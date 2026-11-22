//! The duo prototype (exp/duo-prototype only, ADR-0139): who is on the screen, Peak and Paws. **Behind the developer flag
//! `STREAKBOOM_DUO=1`, off by default; never on main, never in a release.** The rule is the one of `app/src/lib/duo.ts` (pure logic, tested there);
//! the tray needs it while the pet page may be hidden, so it is mirrored here with its own tests. The state is `duo.json` in the data
//! folder (not `pet.json`: a Stable build rewrites that file and drops fields it does not know).
//!
//! Step 2: Paws is a second window (`/paws`) that exists only while it is out and slides in and out through its entrance. It is click-through
//! (the hit test of a second window is step 3). Peak goes in and out with the existing show and hide (no walk yet).

use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    sync::{atomic::{AtomicBool, AtomicU64, Ordering}, Mutex},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindowBuilder};

const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu";
const PAWS_LABEL: &str = "paws";
/// Logical size of a pet window (the real window of Peak is 140 by 140, see WIN_W in lib.rs).
const PET: f64 = 140.0;
/// The drawn pet inside its window, as in lib.rs (PET_LEFT, PET_TOP, PET_SIZE): the window is 140 and the pet 120 at offset 10.
const INSET: f64 = 10.0;
const BODY: f64 = 120.0;
/// Logical size of the shared object window.
const BALL: f64 = 48.0;
const SLIDE: Duration = Duration::from_millis(900);

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Id { Peak, Paws }

#[derive(Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Edge { Left, Right, Top, Bottom }

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct Entrance { pub monitor: Option<String>, pub edge: Edge, pub along: f64 }

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, Default)]
pub struct Presence {
    #[serde(default)] pub out: bool,
    #[serde(default, rename = "tuckedAt")] pub tucked_at: u64,
    #[serde(default)] pub entrance: Option<Entrance>,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct Pets { #[serde(default)] pub peak: Presence, #[serde(default)] pub paws: Presence }

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct DuoState { #[serde(default = "one")] pub v: u8, #[serde(default = "default_pets")] pub pets: Pets }
fn one() -> u8 { 1 }
fn default_pets() -> Pets { Pets { peak: Presence { out: true, ..Default::default() }, paws: Presence::default() } }

impl Default for DuoState { fn default() -> Self { DuoState { v: 1, pets: default_pets() } } }

impl DuoState {
    pub fn parse(raw: &str) -> DuoState { serde_json::from_str(raw).unwrap_or_default() }
    fn get(&self, id: Id) -> &Presence { if id == Id::Peak { &self.pets.peak } else { &self.pets.paws } }
    fn get_mut(&mut self, id: Id) -> &mut Presence { if id == Id::Peak { &mut self.pets.peak } else { &mut self.pets.paws } }
    pub fn out(&self) -> Vec<Id> { [Id::Peak, Id::Paws].into_iter().filter(|i| self.get(*i).out).collect() }
    /// The pet tucked away last; with no tuck on record, Peak.
    pub fn last_tucked(&self) -> Id {
        if self.pets.paws.tucked_at > self.pets.peak.tucked_at { Id::Paws } else { Id::Peak }
    }
    /// The tray click: with any pet out, everyone goes in; with none out, the one tucked last comes out. Returns (send in, bring out).
    pub fn tray_click(&mut self, now: u64) -> (Vec<Id>, Vec<Id>) {
        let out = self.out();
        if !out.is_empty() {
            for id in &out { let p = self.get_mut(*id); p.out = false; p.tucked_at = now; }
            return (out, vec![]);
        }
        let id = self.last_tucked();
        self.get_mut(id).out = true;
        (vec![], vec![id])
    }
    pub fn tuck(&mut self, id: Id, now: u64, entrance: Option<Entrance>) -> bool {
        if !self.get(id).out { return false; }
        let p = self.get_mut(id);
        p.out = false; p.tucked_at = now;
        if entrance.is_some() { p.entrance = entrance; }
        true
    }
    /// The pet on the screen may call the other; nobody else.
    pub fn call(&mut self, caller: Id, target: Id) -> bool {
        if caller == target || !self.get(caller).out || self.get(target).out { return false; }
        self.get_mut(target).out = true;
        true
    }
}

#[derive(Clone, Debug)]
pub struct Mon { pub id: String, pub x: i32, pub y: i32, pub w: i32, pub h: i32 }

/// The remembered entrance if its monitor is present, else the same edge on the first monitor; the bottom edge when nothing is remembered.
pub fn resolve_entrance(e: &Option<Entrance>, mons: &[Mon]) -> Option<(Entrance, Mon)> {
    let first = mons.first()?;
    match e {
        None => Some((Entrance { monitor: Some(first.id.clone()), edge: Edge::Bottom, along: 0.5 }, first.clone())),
        Some(e) => {
            let m = mons.iter().find(|m| Some(&m.id) == e.monitor.as_ref()).unwrap_or(first);
            Some((Entrance { monitor: Some(m.id.clone()), edge: e.edge, along: e.along.clamp(0.0, 1.0) }, m.clone()))
        }
    }
}

/// Top-left of the WINDOW of a pet (`body` px square drawn `inset` px inside a window) standing flush with the edge, and the same window pushed
/// fully outside the monitor (the work area).
pub fn entrance_pos(e: &Entrance, m: &Mon, body: i32, inset: i32) -> ((i32, i32), (i32, i32)) {
    let win = body + 2 * inset;
    let span = |len: i32| ((len - body).max(0) as f64 * e.along.clamp(0.0, 1.0)).round() as i32;
    match e.edge {
        Edge::Left => ((m.x - inset, m.y + span(m.h) - inset), (m.x - win, m.y + span(m.h) - inset)),
        Edge::Right => ((m.x + m.w - body - inset, m.y + span(m.h) - inset), (m.x + m.w, m.y + span(m.h) - inset)),
        Edge::Top => ((m.x + span(m.w) - inset, m.y - inset), (m.x + span(m.w) - inset, m.y - win)),
        Edge::Bottom => ((m.x + span(m.w) - inset, m.y + m.h - body - inset), (m.x + span(m.w) - inset, m.y + m.h)),
    }
}

/// The nearest edge of the monitor that holds the centre of a window, and where along it: how Peak's entrance is learned.
pub fn nearest_entrance(x: i32, y: i32, size: i32, mons: &[Mon]) -> Option<Entrance> {
    let (cx, cy) = (x + size / 2, y + size / 2);
    let m = mons.iter().find(|m| cx >= m.x && cx < m.x + m.w && cy >= m.y && cy < m.y + m.h).or(mons.first())?;
    let d = [(Edge::Left, (cx - m.x).abs()), (Edge::Right, (m.x + m.w - cx).abs()), (Edge::Top, (cy - m.y).abs()), (Edge::Bottom, (m.y + m.h - cy).abs())];
    let edge = d.iter().min_by_key(|(_, v)| *v)?.0;
    let along = match edge {
        Edge::Left | Edge::Right => (y - m.y) as f64 / ((m.h - size).max(1)) as f64,
        _ => (x - m.x) as f64 / ((m.w - size).max(1)) as f64,
    };
    Some(Entrance { monitor: Some(m.id.clone()), edge, along: along.clamp(0.0, 1.0) })
}

// ------------------------------------------------------------------ runtime

pub struct Duo { state: Mutex<DuoState>, path: PathBuf, busy: AtomicBool }

pub fn enabled() -> bool { std::env::var("STREAKBOOM_DUO").is_ok_and(|v| v == "1") }

fn now_ms() -> u64 { SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0) }

fn monitors(app: &AppHandle) -> Vec<Mon> {
    app.available_monitors().unwrap_or_default().iter().enumerate().map(|(i, m)| {
        // the work area: the screen without the taskbar (a pet that stands on the bottom edge must stand on the taskbar, not behind it)
        let wa = m.work_area(); let p = wa.position; let s = wa.size;
        Mon { id: m.name().cloned().unwrap_or_else(|| format!("m{i}")), x: p.x, y: p.y, w: s.width as i32, h: s.height as i32 }
    }).collect()
}

fn scale(app: &AppHandle) -> f64 { app.primary_monitor().ok().flatten().map(|m| m.scale_factor()).unwrap_or(1.0) }

fn save(d: &Duo, s: &DuoState) {
    if let Ok(j) = serde_json::to_string(s) {
        let tmp = d.path.with_extension("json.tmp");
        if std::fs::write(&tmp, j).is_ok() { let _ = std::fs::rename(&tmp, &d.path); }
    }
}

/// Called at the end of the setup, only with the flag: restores who was out.
pub fn init(app: &AppHandle) {
    let Ok(dir) = app.path().app_data_dir() else { return };
    let path = dir.join("duo.json");
    let state = std::fs::read_to_string(&path).map(|r| DuoState::parse(&r)).unwrap_or_default();
    let (peak_out, paws_out) = (state.pets.peak.out, state.pets.paws.out);
    app.manage(Duo { state: Mutex::new(state), path, busy: AtomicBool::new(false) });
    if !peak_out { if let Some(w) = app.get_webview_window("main") { let _ = w.hide(); } }
    if paws_out { paws_in_thread(app.clone(), true); }
    spawn_dev_commands(app.clone(), dir);
}

/// The developer channel of the prototype (instead of menu items): a line written to `duo-cmd.txt` in the data folder is run once and the file is
/// removed. `call` (the pet on the screen calls the other), `scene`, `tray`, `cancel`, `dump` (the state and the windows to `duo-dump.txt`).
fn spawn_dev_commands(app: AppHandle, dir: PathBuf) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(300));
        let f = dir.join("duo-cmd.txt");
        let Ok(text) = std::fs::read_to_string(&f) else { continue };
        let _ = std::fs::remove_file(&f);
        for line in text.lines().map(str::trim).filter(|l| !l.is_empty()) {
            match line {
                "call" => call_other(&app),
                "scene" => scene_start(&app, ""),
                l if l.starts_with("scene:") => scene_start(&app, &l[6..]),
                "tray" => tray(&app),
                "pinbox" => chatbox_pin(true), // the pin without a click: the person's own windows may take the focus while a script runs
                "unpinbox" => chatbox_pin(false),
                "traysingle" => tray_single(&app), // the tray clicks without the mouse (the real tray is for the person to try)
                "traydouble" => tray_double(&app),
                "cancel" => scene_cleanup(&app),
                // a message typed to the pets without the box: `type:<text>` (the page routes it like the chat box does)
                l if l.starts_with("type:") => { let _ = app.emit_to("main", "duo-type", l[5..].to_string()); }
                // a line in the bubble of a pet without the model: `say:paws:text`
                l if l.starts_with("say:") => {
                    let mut p = l[4..].splitn(2, ':');
                    if let (Some(t), Some(x)) = (p.next(), p.next()) { let _ = app.emit_to("main", "duo-say", serde_json::json!({ "pet": t, "text": x })); }
                }
                // the chat command without the chat box: `cmd:paws:out`, `cmd:paws:in`, `cmd:peak:in`
                l if l.starts_with("cmd:") => {
                    let mut p = l[4..].split(':');
                    if let (Some(t), Some(a)) = (p.next(), p.next()) {
                        let ok = duo_command(app.clone(), t.into(), a.into());
                        let _ = std::fs::write(dir.join("duo-cmd-result.txt"), format!("{l} ok={ok}"));
                    }
                }
                "dump" => dump(&app, &dir),
                _ => {}
            }
        }
    });
}

fn dump(app: &AppHandle, dir: &PathBuf) {
    let mut o = String::new();
    for l in ["main", "paws", "ball", "bubble", "chatbox"] {
        match app.get_webview_window(l) {
            Some(w) => {
                let (p, s) = (w.outer_position().ok(), w.outer_size().ok());
                o += &format!("{l} visible={} pos={:?} size={:?}
", w.is_visible().unwrap_or(false), p.map(|p| (p.x, p.y)), s.map(|s| (s.width, s.height)));
            }
            None => o += &format!("{l} none
"),
        }
    }
    for m in monitors(app) { o += &format!("work-area {} x={} y={} w={} h={}
", m.id, m.x, m.y, m.w, m.h); }
    if let Some(d) = app.try_state::<Duo>() { o += &format!("state {}
", serde_json::to_string(&*d.state.lock().unwrap()).unwrap_or_default()); }
    o += &format!("scale {}
", scale(app));
    let _ = std::fs::write(dir.join("duo-dump.txt"), o);
}

/// The tray click (with the flag): everyone goes in, or the pet tucked last comes out. Ignored while an entrance is running.
pub fn tray(app: &AppHandle) {
    let Some(d) = app.try_state::<Duo>() else { return };
    if d.busy.swap(true, Ordering::SeqCst) { return; }
    scene_cleanup(app);
    let (send_in, bring_out) = { let mut s = d.state.lock().unwrap(); let r = s.tray_click(now_ms()); save(&d, &s); r };
    apply(app, send_in, bring_out);
}

#[tauri::command]
pub fn duo_enabled() -> bool { enabled() }

/// Developer channel: canned replies instead of the model (`STREAKBOOM_DUO_FAKE=1`), so the talk is checked without a key.
#[tauri::command]
pub fn duo_fake() -> bool { enabled() && std::env::var("STREAKBOOM_DUO_FAKE").is_ok_and(|v| v == "1") }

fn label_of(pet: &str) -> &'static str { if pet == "paws" { PAWS_LABEL } else { "main" } }

/// The talk (ADR-0141): the listener turns its head toward the speaker (the side it stands on), before the line appears.
#[tauri::command]
pub fn duo_face(app: AppHandle, listener: String, speaker: String) {
    let (Some(l), Some(s)) = (app.get_webview_window(label_of(&listener)), app.get_webview_window(label_of(&speaker))) else { return };
    let (Ok(lp), Ok(sp)) = (l.outer_position(), s.outer_position()) else { return };
    let dir = if sp.x >= lp.x { 1 } else { -1 };
    let _ = app.emit_to(label_of(&listener), "duo-face", serde_json::json!({ "dir": dir }));
}

/// A nod (a pass, or a gesture instead of words) of the pet.
#[tauri::command]
pub fn duo_nod(app: AppHandle, pet: String) { let _ = app.emit_to(label_of(&pet), "duo-nod", ()); }

#[tauri::command]
pub fn duo_paws_out(app: AppHandle) -> bool { app.get_webview_window(PAWS_LABEL).is_some() }

/// The bubble belongs to the pet that answers (ADR-0139/0140): it stands next to `pet` ("peak" or "paws") for `ms` milliseconds, then goes
/// back to Peak. The bubble window is the same one; only the window it is placed against changes.
#[tauri::command]
pub fn duo_bubble_to(app: AppHandle, pet: String, ms: u64) {
    let state = app.state::<crate::AppState>();
    let label = if pet == "paws" && app.get_webview_window(PAWS_LABEL).is_some() { PAWS_LABEL } else { "main" };
    *state.bubble_anchor.lock().unwrap() = label.to_string();
    crate::place_bubble(&app); // a bubble already on the screen moves to the pet it now belongs to
    let stamp = BUBBLE_GEN.fetch_add(1, Ordering::SeqCst) + 1;
    if label == PAWS_LABEL {
        let app2 = app.clone();
        std::thread::spawn(move || {
            std::thread::sleep(Duration::from_millis(ms));
            if BUBBLE_GEN.load(Ordering::SeqCst) == stamp { *app2.state::<crate::AppState>().bubble_anchor.lock().unwrap() = "main".to_string(); } // a later call keeps its own anchor
        });
    }
}

static BUBBLE_GEN: AtomicU64 = AtomicU64::new(0);

/// A touch on Paws (its window is click-through except over the pet, see `spawn_paws_hit_test`): a scene ends, the talk is cancelled (the page of Peak does it).
#[tauri::command]
pub fn duo_touch(app: AppHandle, pet: String) {
    scene_cleanup(&app);
    let _ = app.emit_to("main", "duo-touch", pet);
}

/// A double click on Paws opens the chat for it (ADR-0141, I2): the chat box is the page of Peak, which is told whose box it is.
#[tauri::command]
pub fn duo_open_chat(app: AppHandle, pet: String) { let _ = app.emit_to("main", "duo-open-chat", pet); }

/// The hit test of the Paws window: the window takes the pointer only while it is over the pet, as Peak's does, and lets it through elsewhere.
fn spawn_paws_hit_test(app: AppHandle) {
    std::thread::spawn(move || {
        let mut ignoring: Option<bool> = None;
        loop {
            std::thread::sleep(Duration::from_millis(30));
            let Some(win) = app.get_webview_window(PAWS_LABEL) else { return }; // the window exists only while Paws is out
            let (Ok(cur), Ok(pos), Ok(scale)) = (win.cursor_position(), win.outer_position(), win.scale_factor()) else { continue };
            let (lx, ly) = ((cur.x - pos.x as f64) / scale, (cur.y - pos.y as f64) / scale);
            // the art: 100 px wide, bottom-aligned in the 140 px window (10 px padding)
            let inside = lx >= 20.0 && lx <= 120.0 && ly >= 30.0 && ly <= 130.0;
            if ignoring != Some(!inside) { let _ = win.set_ignore_cursor_events(!inside); ignoring = Some(!inside); }
        }
    });
}

/// The chat command (step 4), said to the pet on the screen (Peak's chat): `act` "out" has Peak call `target` out, "in" sends `target` in.
/// False when it changes nothing (already out, already in, busy), so the page can stay silent. No model, no key.
#[tauri::command]
pub fn duo_command(app: AppHandle, target: String, act: String) -> bool {
    if !enabled() { return false; }
    let Some(d) = app.try_state::<Duo>() else { return false };
    if d.busy.swap(true, Ordering::SeqCst) { return false; }
    let id = if target == "peak" { Id::Peak } else { Id::Paws };
    let go_in = act == "in";
    let done = {
        let mut s = d.state.lock().unwrap();
        let ok = if go_in { s.tuck(id, now_ms(), None) } else { s.call(Id::Peak, id) };
        if ok { save(&d, &s); }
        ok
    };
    if !done { d.busy.store(false, Ordering::SeqCst); return false; }
    scene_cleanup(&app);
    if go_in { apply(&app, vec![id], vec![]); } else { apply(&app, vec![], vec![id]); }
    true
}

/// A prototype helper for the developer channel: the pet on the screen calls the other one.
pub fn call_other(app: &AppHandle) {
    let Some(d) = app.try_state::<Duo>() else { return };
    if d.busy.swap(true, Ordering::SeqCst) { return; }
    let (ok, target) = {
        let mut s = d.state.lock().unwrap();
        let (caller, target) = if s.pets.peak.out { (Id::Peak, Id::Paws) } else { (Id::Paws, Id::Peak) };
        let ok = s.call(caller, target);
        if ok { save(&d, &s); }
        (ok, target)
    };
    if ok { apply(app, vec![], vec![target]); } else { d.busy.store(false, Ordering::SeqCst); }
}

fn apply(app: &AppHandle, send_in: Vec<Id>, bring_out: Vec<Id>) {
    let d = app.state::<Duo>();
    let mut paws_work = false;
    for id in &send_in {
        match id {
            Id::Peak => {
                if let Some(w) = app.get_webview_window("main") {
                    if let Ok(p) = w.outer_position() {
                        let e = nearest_entrance(p.x, p.y, (PET * scale(app)) as i32, &monitors(app));
                        let mut s = d.state.lock().unwrap();
                        if let Some(e) = e { s.pets.peak.entrance = Some(e); save(&d, &s); }
                    }
                    crate::toggle_visibility(app); // visible -> hides it and its bubble
                }
            }
            Id::Paws => {
                // it comes out again where it goes in now (ADR-0139)
                if let Some(w) = app.get_webview_window(PAWS_LABEL) {
                    if let Ok(p) = w.outer_position() {
                        let e = nearest_entrance(p.x, p.y, (PET * scale(app)) as i32, &monitors(app));
                        let mut s = d.state.lock().unwrap();
                        if let Some(e) = e { s.pets.paws.entrance = Some(e); save(&d, &s); }
                    }
                }
                paws_work = true;
            }
        }
    }
    for id in &bring_out {
        match id {
            Id::Peak => { if let Some(w) = app.get_webview_window("main") { if !w.is_visible().unwrap_or(false) { crate::toggle_visibility(app); } } }
            Id::Paws => paws_work = true,
        }
    }
    if paws_work {
        let out = bring_out.contains(&Id::Paws);
        let app2 = app.clone();
        std::thread::spawn(move || { if out { paws_come_out(&app2, false) } else { paws_go_in(&app2) } app2.state::<Duo>().busy.store(false, Ordering::SeqCst); });
    } else {
        d.busy.store(false, Ordering::SeqCst);
    }
}

fn paws_in_thread(app: AppHandle, quiet: bool) {
    std::thread::spawn(move || { paws_come_out(&app, quiet); app.state::<Duo>().busy.store(false, Ordering::SeqCst); });
}

fn slide(win: &tauri::WebviewWindow, from: (i32, i32), to: (i32, i32)) {
    let t0 = Instant::now();
    loop {
        let t = (t0.elapsed().as_secs_f64() / SLIDE.as_secs_f64()).min(1.0);
        let k = 1.0 - (1.0 - t).powi(3); // ease out
        let x = from.0 as f64 + (to.0 - from.0) as f64 * k;
        let y = from.1 as f64 + (to.1 - from.1) as f64 * k;
        let _ = win.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
        if t >= 1.0 { break; }
        std::thread::sleep(Duration::from_millis(16));
    }
}

/// Paws comes out through its entrance. `quiet`: at the start of the program it is simply there, no walk.
fn paws_come_out(app: &AppHandle, quiet: bool) {
    let Some(d) = app.try_state::<Duo>() else { return };
    let entrance = d.state.lock().unwrap().pets.paws.entrance.clone();
    let mons = monitors(app);
    let Some((e, m)) = resolve_entrance(&entrance, &mons) else { return };
    let (body, inset) = ((BODY * scale(app)).round() as i32, (INSET * scale(app)).round() as i32);
    let size = body + 2 * inset;
    let (at, outside) = entrance_pos(&e, &m, body, inset);
    let from = if quiet { at } else { outside };
    let facing = match e.edge { Edge::Left => "right", Edge::Right => "left", Edge::Top => "down", Edge::Bottom => "up" };
    let url = format!("paws?from={facing}");
    let built = WebviewWindowBuilder::new(app, PAWS_LABEL, WebviewUrl::App(url.into()))
        .title("Streakboom Paws")
        .inner_size(PET, PET)
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false)
        .additional_browser_args(BROWSER_ARGS)
        .build();
    let Ok(win) = built else { return };
    let _ = win.set_size(PhysicalSize::new(size as u32, size as u32));
    let _ = win.set_position(PhysicalPosition::new(from.0, from.1));
    let _ = win.set_ignore_cursor_events(true); // opened by the hit test thread only over the pet
    spawn_paws_hit_test(app.clone());
    if !quiet { slide(&win, from, at); }
    let mut s = d.state.lock().unwrap();
    s.pets.paws.entrance = Some(e);
    save(&d, &s);
}

/// Paws goes in through its entrance and the window is closed: it exists only while Paws is out.
fn paws_go_in(app: &AppHandle) {
    let Some(win) = app.get_webview_window(PAWS_LABEL) else { return };
    let Some(d) = app.try_state::<Duo>() else { return };
    let entrance = d.state.lock().unwrap().pets.paws.entrance.clone();
    if let Some((e, m)) = resolve_entrance(&entrance, &monitors(app)) {
        let (body, inset) = ((BODY * scale(app)).round() as i32, (INSET * scale(app)).round() as i32);
        let (at, outside) = entrance_pos(&e, &m, body, inset);
        if let Ok(p) = win.outer_position() { slide(&win, (p.x, p.y), outside); } else { slide(&win, at, outside); }
    }
    let _ = win.destroy();
}

// ------------------------------------------------------------------ scenes (step 3)
// The scene engine is `app/src/lib/scene.ts`; it runs in the page of Paws (a scene needs both pets out, and that page exists exactly then).
// Rust only moves windows, shows the shared ball, and tells Peak's page to hold its own wandering and show a pose.

static BALL_LOCK: Mutex<()> = Mutex::new(());

#[derive(Serialize)]
pub struct Stage { pub peak: (i32, i32), pub paws: (i32, i32), pub size: i32, pub inset: i32, pub body: i32, pub scale: f64 }

/// Where the two pet windows are (physical px, top-left) and how big a pet window is; None unless both are out.
#[tauri::command]
pub fn duo_stage(app: AppHandle) -> Option<Stage> {
    let main = app.get_webview_window("main")?;
    let paws = app.get_webview_window(PAWS_LABEL)?;
    if !main.is_visible().unwrap_or(false) { return None; }
    let (a, b) = (main.outer_position().ok()?, paws.outer_position().ok()?);
    let scale = scale(&app);
    Some(Stage { peak: (a.x, a.y), paws: (b.x, b.y), size: (PET * scale).round() as i32, inset: (INSET * scale).round() as i32, body: (BODY * scale).round() as i32, scale })
}

/// Move one of the windows of a scene: "main" (Peak), "paws" or "ball".
#[tauri::command]
pub fn duo_pos(app: AppHandle, label: String, x: i32, y: i32) {
    let l = if label == "peak" { "main" } else { label.as_str() };
    if !matches!(l, "main" | "paws" | "ball") { return; }
    if let Some(w) = app.get_webview_window(l) { let _ = w.set_position(PhysicalPosition::new(x, y)); }
}

/// Show the shared object (a window of its own, click-through) or take it away. `kind` is "ball" or "cushion".
#[tauri::command]
pub async fn duo_ball(app: AppHandle, show: bool, kind: String, x: i32, y: i32) -> Result<(), String> {
    // one call at a time: the page asks every frame, and two calls that both find no window would build two (seen as several balls)
    let _one = BALL_LOCK.lock().unwrap_or_else(|e| e.into_inner());
    if !show {
        if let Some(w) = app.get_webview_window("ball") { let _ = w.destroy(); }
        return Ok(());
    }
    let kind = if kind == "cushion" { "cushion" } else { "ball" };
    if let Some(w) = app.get_webview_window("ball") {
        let _ = w.set_position(PhysicalPosition::new(x, y));
        let _ = app.emit_to("ball", "ball-kind", kind);
        return Ok(());
    }
    let url = format!("ball?kind={kind}");
    let w = WebviewWindowBuilder::new(&app, "ball", WebviewUrl::App(url.into()))
        .title("Streakboom ball").inner_size(BALL, BALL)
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false).focused(false)
        .additional_browser_args(BROWSER_ARGS).build().map_err(|e| e.to_string())?;
    let _ = w.set_position(PhysicalPosition::new(x, y));
    let _ = w.set_ignore_cursor_events(true);
    Ok(())
}

/// Peak's page holds its own wandering while a scene runs and shows the pose given; `hold: false` gives the control back.
#[tauri::command]
pub fn duo_peak_pose(app: AppHandle, pose: String, dir: i32, hold: bool) {
    let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": pose, "dir": dir, "hold": hold }));
}

/// Start a scene (a prototype menu item for now; the automatic start needs the attention mode of Peak's page). Needs both pets out.
pub fn scene_start(app: &AppHandle, id: &str) {
    if let Some(d) = app.try_state::<Duo>() {
        let s = d.state.lock().unwrap();
        if s.out().len() != 2 || d.busy.load(Ordering::SeqCst) { return; }
    } else { return; }
    let _ = app.emit_to(PAWS_LABEL, "scene-start", id.to_string());
}

/// A touch, or a pet going in: the scene ends at once, the object goes, Peak gets its own behaviour back.
pub fn scene_cleanup(app: &AppHandle) {
    let _ = app.emit_to(PAWS_LABEL, "scene-cancel", ());
    { let _one = BALL_LOCK.lock().unwrap_or_else(|e| e.into_inner()); if let Some(w) = app.get_webview_window("ball") { let _ = w.destroy(); } }
    let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": "idle", "dir": 1, "hold": false }));
}

/// A line for `duo-log.txt` in the data folder (why a scene did not start, when it ended): the prototype's own trace, read by the test script.
#[tauri::command]
pub fn duo_log(app: AppHandle, line: String) { log(&app, &line); }

pub fn log(app: &AppHandle, line: &str) {
    use std::io::Write;
    let Ok(dir) = app.path().app_data_dir() else { return };
    if let Ok(mut f) = std::fs::OpenOptions::new().create(true).append(true).open(dir.join("duo-log.txt")) {
        let _ = writeln!(f, "{} {}", now_ms(), line.chars().take(200).collect::<String>());
    }
}

#[tauri::command]
pub fn duo_scene_cancel(app: AppHandle) { scene_cleanup(&app); }

#[cfg(test)]
mod tests {
    use super::*;
    fn both() -> DuoState { let mut s = DuoState::default(); s.pets.paws.out = true; s }
    fn m1() -> Mon { Mon { id: "m1".into(), x: 0, y: 0, w: 1920, h: 1080 } }
    fn m2() -> Mon { Mon { id: "m2".into(), x: 1920, y: 0, w: 1280, h: 1024 } }

    #[test]
    fn a_new_state_is_peak_alone_and_junk_gives_the_default() {
        assert_eq!(DuoState::default().out(), vec![Id::Peak]);
        assert_eq!(DuoState::parse("not json").out(), vec![Id::Peak]);
        assert_eq!(DuoState::parse("{}").out(), vec![Id::Peak]);
    }
    #[test]
    fn the_file_round_trips_and_matches_the_shape_of_duo_ts() {
        let mut s = both();
        s.pets.paws.entrance = Some(Entrance { monitor: Some("m2".into()), edge: Edge::Left, along: 0.25 });
        s.pets.peak.tucked_at = 5;
        let j = serde_json::to_string(&s).unwrap();
        assert!(j.contains("\"tuckedAt\":5") && j.contains("\"edge\":\"left\""));
        assert_eq!(DuoState::parse(&j), s);
    }
    #[test]
    fn the_tray_sends_everyone_in_then_brings_out_the_last_tucked() {
        let mut s = both();
        let (send, out) = s.tray_click(100);
        assert_eq!((send, out), (vec![Id::Peak, Id::Paws], vec![]));
        assert!(s.out().is_empty());
        s.pets.paws.tucked_at = 200; // Paws went in last
        let (send, out) = s.tray_click(300);
        assert_eq!((send, out), (vec![], vec![Id::Paws]));
        assert_eq!(s.out(), vec![Id::Paws]);
    }
    #[test]
    fn one_tucked_leaves_the_other_and_only_the_pet_on_the_screen_may_call() {
        let mut s = both();
        assert!(s.tuck(Id::Paws, 10, None));
        assert!(!s.tuck(Id::Paws, 11, None));
        assert_eq!(s.out(), vec![Id::Peak]);
        assert!(s.call(Id::Peak, Id::Paws));
        assert!(!s.call(Id::Peak, Id::Paws), "already out");
        let mut none = DuoState::default(); none.pets.peak.out = false;
        assert!(!none.call(Id::Peak, Id::Paws), "a pet that is not out cannot call");
    }
    #[test]
    fn the_entrance_is_flush_with_the_edge_and_falls_back_to_a_present_monitor() {
        let e = Entrance { monitor: Some("m2".into()), edge: Edge::Right, along: 0.0 };
        let ((x, _), (ox, _)) = entrance_pos(&e, &m2(), 120, 10);
        assert_eq!((x, ox), (1920 + 1280 - 120 - 10, 1920 + 1280));
        let (r, m) = resolve_entrance(&Some(e), &[m1()]).unwrap();
        assert_eq!((r.monitor.as_deref(), m.id.as_str()), (Some("m1"), "m1"));
        assert!(resolve_entrance(&None, &[]).is_none());
        assert_eq!(resolve_entrance(&None, &[m1()]).unwrap().0.edge, Edge::Bottom);
    }
    #[test]
    fn the_nearest_edge_is_learned_from_where_a_window_stands() {
        let e = nearest_entrance(1700, 400, 250, &[m1()]).unwrap();
        assert_eq!(e.edge, Edge::Right);
        let e = nearest_entrance(500, 820, 250, &[m1()]).unwrap();
        assert_eq!(e.edge, Edge::Bottom);
    }
}

// ------------------------------------------------------------------ the chat box (ADR-0142)
// One floating box for the person, at the bottom right of the work area. The tray: one click shows or hides it, a double click sends everyone in
// or brings the last one out. The box hides when it loses focus unless pinned; it never opens itself.

const BOX_LABEL: &str = "chatbox";
const BOX_W: f64 = 340.0;
const BOX_H: f64 = 460.0;
const BOX_MARGIN: f64 = 16.0;
const CLICK_WAIT: Duration = Duration::from_millis(300); // a single click waits this long to be told from the first half of a double click
const BLUR_GRACE_MS: u64 = 600; // a blur this soon after the box was shown is the box taking focus, not the person leaving
const BLUR_TOGGLE_MS: u64 = 900; // a tray click this soon after a blur-hide is the click that took the focus away: it must not show the box again

static BOX_PINNED: AtomicBool = AtomicBool::new(false);
static BOX_SHOWN_AT: AtomicU64 = AtomicU64::new(0);
static BOX_BLUR_HID_AT: AtomicU64 = AtomicU64::new(0);
static TRAY_GEN: AtomicU64 = AtomicU64::new(0);

/// A single click on the tray (with the flag): after the wait, if no second click came, the box is shown or hidden.
pub fn tray_single(app: &AppHandle) {
    let g = TRAY_GEN.fetch_add(1, Ordering::SeqCst) + 1;
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(CLICK_WAIT);
        if TRAY_GEN.load(Ordering::SeqCst) == g { chatbox_toggle(&app); }
    });
}

/// A double click on the tray (with the flag): it cancels the single click that came with it, then everyone goes in or the last one comes out.
pub fn tray_double(app: &AppHandle) {
    TRAY_GEN.fetch_add(1, Ordering::SeqCst);
    tray(app);
}

fn box_position(app: &AppHandle) -> (i32, i32) {
    let s = scale(app);
    let (w, h, m) = ((BOX_W * s).round() as i32, (BOX_H * s).round() as i32, (BOX_MARGIN * s).round() as i32);
    match monitors(app).first() {
        Some(mon) => (mon.x + mon.w - w - m, mon.y + mon.h - h - m),
        None => (100, 100),
    }
}

fn show_box(app: &AppHandle, win: &tauri::WebviewWindow) {
    let (x, y) = box_position(app);
    let _ = win.set_position(PhysicalPosition::new(x, y));
    BOX_SHOWN_AT.store(now_ms(), Ordering::SeqCst);
    let _ = win.show();
    let _ = win.set_focus();
    let _ = app.emit_to(BOX_LABEL, "chatbox-open", ());
}

/// Show the box, or hide it if it is showing. The window is made the first time and kept after that.
pub fn chatbox_toggle(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(BOX_LABEL) {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else if now_ms().saturating_sub(BOX_BLUR_HID_AT.load(Ordering::SeqCst)) > BLUR_TOGGLE_MS {
            show_box(app, &win);
        }
        return;
    }
    let built = WebviewWindowBuilder::new(app, BOX_LABEL, WebviewUrl::App("chatbox".into()))
        .title("Streakboom chat")
        .inner_size(BOX_W, BOX_H)
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false)
        .visible(false)
        .additional_browser_args(BROWSER_ARGS)
        .build();
    let Ok(win) = built else { return };
    let app2 = app.clone();
    win.on_window_event(move |e| {
        if let tauri::WindowEvent::Focused(false) = e {
            let recently = now_ms().saturating_sub(BOX_SHOWN_AT.load(Ordering::SeqCst)) < BLUR_GRACE_MS;
            if !BOX_PINNED.load(Ordering::SeqCst) && !recently {
                if let Some(w) = app2.get_webview_window(BOX_LABEL) {
                    if w.is_visible().unwrap_or(false) { BOX_BLUR_HID_AT.store(now_ms(), Ordering::SeqCst); let _ = w.hide(); }
                }
            }
        }
    });
    show_box(app, &win);
}

/// The box asks to hide (Esc, or its own button).
#[tauri::command]
pub fn chatbox_hide(app: AppHandle) { if let Some(w) = app.get_webview_window(BOX_LABEL) { let _ = w.hide(); } }

/// The pin of the box: pinned, it stays when it loses focus.
#[tauri::command]
pub fn chatbox_pin(on: bool) { BOX_PINNED.store(on, Ordering::SeqCst); }

/// Who is out now, for the dots of the box.
#[tauri::command]
pub fn duo_presence(app: AppHandle) -> serde_json::Value {
    let Some(d) = app.try_state::<Duo>() else { return serde_json::json!({ "peak": true, "paws": false }) };
    let s = d.state.lock().unwrap();
    serde_json::json!({ "peak": s.pets.peak.out, "paws": s.pets.paws.out })
}
