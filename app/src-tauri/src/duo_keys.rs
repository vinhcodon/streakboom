//! The two global shortcuts of the duo prototype (ADR-0142): show or hide the chat box, and send everyone in or bring them out. Only with the
//! developer flag. They are registered with Windows (`RegisterHotKey`) on a thread of their own: the program learns only that one of these two
//! combinations was pressed, never any other key. A combination another program already holds is reported, never taken over. The two
//! combinations are kept in `duo-keys.json` in the data folder (its own file: the shared files of Stable and Preview are not touched).

use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    sync::{mpsc, Mutex, OnceLock},
    time::Duration,
};
use tauri::{AppHandle, Manager};
use windows_sys::Win32::UI::{
    Input::KeyboardAndMouse::{RegisterHotKey, UnregisterHotKey, MOD_ALT, MOD_CONTROL, MOD_NOREPEAT, MOD_SHIFT, MOD_WIN},
    WindowsAndMessaging::{PeekMessageW, MSG, PM_REMOVE, WM_HOTKEY},
};

const ID_BOX: i32 = 1;
const ID_ALL: i32 = 2;
pub const DEFAULT_BOX: &str = "Ctrl+Alt+P";
pub const DEFAULT_ALL: &str = "Ctrl+Alt+Shift+P";

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
pub struct Combos { #[serde(default = "d_box")] pub r#box: String, #[serde(default = "d_all")] pub all: String }
fn d_box() -> String { DEFAULT_BOX.into() }
fn d_all() -> String { DEFAULT_ALL.into() }
impl Default for Combos { fn default() -> Self { Combos { r#box: d_box(), all: d_all() } } }

/// What the page is told about one shortcut.
#[derive(Clone, Serialize, Debug, PartialEq)]
pub struct KeyView { pub combo: String, pub ok: bool, pub error: Option<String> }
#[derive(Clone, Serialize, Debug)]
pub struct KeysView { pub r#box: KeyView, pub all: KeyView }

/// "Ctrl+Alt+P" to (modifiers, virtual key). A shortcut needs Ctrl, Alt or Win (Shift alone would take a letter away from typing) and one key: a letter, a digit, F1 to F12 or Space.
pub fn parse(combo: &str) -> Result<(u32, u32), String> {
    let mut mods = 0u32;
    let mut key: Option<u32> = None;
    for part in combo.split('+').map(str::trim).filter(|p| !p.is_empty()) {
        match part.to_ascii_lowercase().as_str() {
            "ctrl" | "control" => mods |= MOD_CONTROL,
            "alt" => mods |= MOD_ALT,
            "shift" => mods |= MOD_SHIFT,
            "win" | "meta" | "super" => mods |= MOD_WIN,
            p => {
                if key.is_some() { return Err("one key besides the modifiers".into()); }
                let b = p.as_bytes();
                key = Some(match b {
                    [c @ b'a'..=b'z'] => (*c as u32) - 32, // VK_A..VK_Z are the capital letters
                    [c @ b'0'..=b'9'] => *c as u32,
                    _ if p == "space" => 0x20,
                    _ if p.starts_with('f') && p[1..].parse::<u32>().is_ok_and(|n| (1..=12).contains(&n)) => 0x70 + p[1..].parse::<u32>().unwrap() - 1,
                    _ => return Err(format!("unknown key {p}")),
                });
            }
        }
    }
    let Some(key) = key else { return Err("no key".into()) };
    if mods & (MOD_CONTROL | MOD_ALT | MOD_WIN) == 0 { return Err("needs Ctrl, Alt or Win".into()); }
    Ok((mods, key))
}

/// A combination as it is written back: modifiers in a fixed order, the key in capitals.
pub fn normal(combo: &str) -> Result<String, String> {
    let (mods, key) = parse(combo)?;
    let mut out: Vec<String> = vec![];
    if mods & MOD_CONTROL != 0 { out.push("Ctrl".into()); }
    if mods & MOD_ALT != 0 { out.push("Alt".into()); }
    if mods & MOD_SHIFT != 0 { out.push("Shift".into()); }
    if mods & MOD_WIN != 0 { out.push("Win".into()); }
    out.push(match key { 0x20 => "Space".into(), 0x70..=0x7B => format!("F{}", key - 0x70 + 1), k => (k as u8 as char).to_string() });
    Ok(out.join("+"))
}

enum Cmd { Apply(Combos, mpsc::Sender<(Option<String>, Option<String>)>) }

struct State { combos: Combos, view: KeysView, tx: mpsc::Sender<Cmd>, path: PathBuf }
static STATE: OnceLock<Mutex<State>> = OnceLock::new();

fn register(id: i32, combo: &str) -> Result<(), String> {
    let (mods, vk) = parse(combo)?;
    // SAFETY: a plain Win32 call with no window (the hotkey belongs to this thread's message queue)
    let ok = unsafe { RegisterHotKey(std::ptr::null_mut(), id, mods | MOD_NOREPEAT, vk) };
    if ok != 0 { Ok(()) } else { Err("another program already uses this combination".into()) }
}

fn run_action(app: &AppHandle, id: i32) {
    let app = app.clone();
    std::thread::spawn(move || if id == ID_BOX { crate::duo::chatbox_toggle(&app) } else if id == ID_ALL { crate::duo::tray(&app) });
}

fn spawn_thread(app: AppHandle, rx: mpsc::Receiver<Cmd>) {
    std::thread::spawn(move || {
        let mut msg: MSG = unsafe { std::mem::zeroed() };
        loop {
            if let Ok(Cmd::Apply(c, reply)) = rx.try_recv() {
                unsafe { UnregisterHotKey(std::ptr::null_mut(), ID_BOX); UnregisterHotKey(std::ptr::null_mut(), ID_ALL); }
                let e1 = register(ID_BOX, &c.r#box).err();
                let e2 = register(ID_ALL, &c.all).err();
                let _ = reply.send((e1, e2));
            }
            // SAFETY: the message of this thread's own queue
            while unsafe { PeekMessageW(&mut msg, std::ptr::null_mut(), 0, 0, PM_REMOVE) } != 0 {
                if msg.message == WM_HOTKEY { run_action(&app, msg.wParam as i32); }
            }
            std::thread::sleep(Duration::from_millis(40));
        }
    });
}

fn view_of(c: &Combos, e1: Option<String>, e2: Option<String>) -> KeysView {
    KeysView { r#box: KeyView { combo: c.r#box.clone(), ok: e1.is_none(), error: e1 }, all: KeyView { combo: c.all.clone(), ok: e2.is_none(), error: e2 } }
}

fn apply(st: &mut State, c: Combos) -> (Option<String>, Option<String>) {
    let (rtx, rrx) = mpsc::channel();
    if st.tx.send(Cmd::Apply(c.clone(), rtx)).is_err() { return (Some("not running".into()), Some("not running".into())); }
    let r = rrx.recv_timeout(Duration::from_secs(2)).unwrap_or((Some("no answer".into()), Some("no answer".into())));
    st.view = view_of(&c, r.0.clone(), r.1.clone());
    st.combos = c;
    r
}

fn save(path: &PathBuf, c: &Combos) { if let Ok(j) = serde_json::to_string(c) { let _ = std::fs::write(path, j); } }

/// At the end of the setup, only with the flag: read the two combinations (or the defaults) and register them.
pub fn init(app: &AppHandle) {
    let Ok(dir) = app.path().app_data_dir() else { return };
    let path = dir.join("duo-keys.json");
    let mut c: Combos = std::fs::read_to_string(&path).ok().and_then(|r| serde_json::from_str(&r).ok()).unwrap_or_default();
    // a file edited by hand with a combination that does not parse falls back to the default
    if normal(&c.r#box).is_err() { c.r#box = d_box(); } else { c.r#box = normal(&c.r#box).unwrap(); }
    if normal(&c.all).is_err() { c.all = d_all(); } else { c.all = normal(&c.all).unwrap(); }
    let (tx, rx) = mpsc::channel();
    spawn_thread(app.clone(), rx);
    let mut st = State { combos: c.clone(), view: view_of(&c, None, None), tx, path };
    apply(&mut st, c);
    let _ = STATE.set(Mutex::new(st));
}

pub fn current() -> Option<KeysView> { STATE.get().map(|s| s.lock().unwrap().view.clone()) }

#[tauri::command]
pub fn duo_keys_get() -> Option<KeysView> { current() }

/// Set one of the two combinations. Refused with a reason when it does not parse, equals the other one, or another program already holds it
/// (then the old one stays).
#[tauri::command]
pub fn duo_keys_set(which: String, combo: String) -> Result<KeysView, String> {
    let Some(m) = STATE.get() else { return Err("the shortcuts are not on".into()) };
    let mut st = m.lock().unwrap();
    let combo = normal(&combo)?;
    let mut next = st.combos.clone();
    if which == "box" { next.r#box = combo.clone(); } else { next.all = combo.clone(); }
    if next.r#box == next.all { return Err("the other shortcut already uses this combination".into()); }
    let old = st.combos.clone();
    let r = apply(&mut st, next.clone());
    let failed = if which == "box" { r.0 } else { r.1 };
    if let Some(e) = failed {
        apply(&mut st, old); // back to what worked
        return Err(e);
    }
    save(&st.path, &next);
    Ok(st.view.clone())
}

#[tauri::command]
pub fn duo_keys_reset() -> Result<KeysView, String> {
    let Some(m) = STATE.get() else { return Err("the shortcuts are not on".into()) };
    let mut st = m.lock().unwrap();
    let c = Combos::default();
    apply(&mut st, c.clone());
    save(&st.path, &c);
    Ok(st.view.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn a_combination_is_read_and_written_back_the_same_way() {
        assert_eq!(normal("ctrl+alt+p").unwrap(), "Ctrl+Alt+P");
        assert_eq!(normal("Alt + Shift + Ctrl + p").unwrap(), "Ctrl+Alt+Shift+P");
        assert_eq!(normal("Win+F5").unwrap(), "Win+F5");
        assert_eq!(normal("Ctrl+Space").unwrap(), "Ctrl+Space");
        assert_eq!(normal("Ctrl+7").unwrap(), "Ctrl+7");
        assert_eq!(parse("Ctrl+Alt+P").unwrap(), (MOD_CONTROL | MOD_ALT, 0x50));
    }
    #[test]
    fn a_combination_without_a_real_modifier_or_with_two_keys_is_refused() {
        assert!(parse("P").is_err());
        assert!(parse("Shift+P").is_err()); // would take a letter away from typing
        assert!(parse("Ctrl+").is_err());
        assert!(parse("Ctrl+P+Q").is_err());
        assert!(parse("Ctrl+F13").is_err());
        assert!(parse("Ctrl+Enter").is_err());
    }
    #[test]
    fn the_defaults_parse_and_differ() {
        assert!(parse(DEFAULT_BOX).is_ok() && parse(DEFAULT_ALL).is_ok());
        assert_ne!(DEFAULT_BOX, DEFAULT_ALL);
        let c: Combos = serde_json::from_str("{}").unwrap();
        assert_eq!(c, Combos::default());
    }
}
