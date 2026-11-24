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
    /// The person asks for `target` to come out ("call Peak out", the slash list): the pet that is on the screen calls it, whichever pet that is (it was Peak
    /// only, so with Paws out Peak could not be called); with nobody on the screen the person brings it out by name.
    pub fn request_out(&mut self, target: Id) -> bool {
        if self.get(target).out { return false; }
        if self.out().is_empty() { return self.bring_when_none_out(target); }
        let caller = if target == Id::Peak { Id::Paws } else { Id::Peak };
        self.call(caller, target)
    }
    /// With nobody out the person may bring either pet out by name (the slash list of the chat box, ADR-0145): there is no pet on the screen to call it.
    pub fn bring_when_none_out(&mut self, target: Id) -> bool {
        if !self.out().is_empty() { return false; }
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

/// Issue 15 (revision r1): Paws as an invited round portrait beside the chat, instead of the walking window. A developer flag on top of the duo flag; off,
/// the walking prototype is unchanged (the way back).
pub fn portrait() -> bool { enabled() && std::env::var("STREAKBOOM_PAWS_PORTRAIT").is_ok_and(|v| v == "1") }
#[tauri::command]
pub fn duo_portrait() -> bool { portrait() }

/// Issue 17 (revision r1, option A): Paws joins the chat as a member, with no window at all; Peak stays the only pet on the desktop. A developer flag on top of
/// the duo flag (`STREAKBOOM_PAWS_CHAT=1`); the portrait of #15 (`STREAKBOOM_PAWS_PORTRAIT=1`) stays as the reference, and with neither the walking Paws runs.
pub fn chat_member() -> bool { enabled() && !portrait() && std::env::var("STREAKBOOM_PAWS_CHAT").is_ok_and(|v| v == "1") }
/// A visit: Paws belongs to one opening of the chat (the portrait and the chat member both).
pub fn visit_mode() -> bool { portrait() || chat_member() }
/// How Paws appears: "walk" (the prototype), "portrait" (#15 r1) or "chat" (#17 r1). The pages ask it once.
#[tauri::command]
pub fn duo_paws_mode() -> String { (if chat_member() { "chat" } else if portrait() { "portrait" } else { "walk" }).into() }
const PORTRAIT: f64 = 104.0; // logical px: the round frame beside the chat

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
    if !peak_out { if let Some(w) = app.get_webview_window("main") { crate::platform::hide_window(&w); } } // the system call: the library's hide made a later hover hide Peak again
    if paws_out && visit_mode() {
        // the portrait belongs to an invitation: a restart in the middle of a visit is Peak alone until a fresh one (r1, AC7)
        let d = app.state::<Duo>();
        let mut s = d.state.lock().unwrap();
        s.pets.paws.out = false;
        save(&d, &s);
    } else if paws_out { paws_in_thread(app.clone(), true); }
    crate::duo_keys::init(app);
    spawn_dev_commands(app.clone(), dir);
    let a = app.clone();
    std::thread::spawn(move || loop { std::thread::sleep(Duration::from_secs(3)); sync_windows(&a); });
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
                l if l.starts_with("openbox:") => duo_open_box(app.clone(), l[8..].to_string()), // a double click on a pet, without the mouse
                "opensettings" => crate::open_settings_window(&app, None),
                // `setkey:box:Ctrl+Alt+F9`: the Settings field, without the keys; the answer goes to duo-cmd-result.txt
                l if l.starts_with("setkey:") => {
                    let mut p = l[7..].splitn(2, ':');
                    if let (Some(w), Some(c)) = (p.next(), p.next()) {
                        let r = crate::duo_keys::duo_keys_set(w.into(), c.into());
                        let _ = std::fs::write(dir.join("duo-cmd-result.txt"), format!("{l} -> {}", match r { Ok(_) => "ok".to_string(), Err(e) => format!("refused: {e}") }));
                    }
                }
                "hotbox" => chatbox_toggle(&app), // what the global shortcuts do, without the keys
                "hotall" => tray(&app),
                "pinbox" => chatbox_pin(true), // the pin without a click: the person's own windows may take the focus while a script runs
                "unpinbox" => chatbox_pin(false),
                "traysingle" => tray_single(&app), // the tray clicks without the mouse (the real tray is for the person to try)
                "traydouble" => tray_double(&app),
                "cancel" => scene_cleanup(&app),
                // a message typed to the pets without the box: `type:<text>` (the page routes it like the chat box does)
                l if l.starts_with("type:") => { let _ = app.emit_to("main", "duo-type", l[5..].to_string()); }
                // Quiet on or off as the page hears it, without the tray menu (the page handler only; the saved preference is not touched): `quiet:on`, `quiet:off`
                // a test aid: hold Peak in a pose (`peakpose:sleep`) or give it back (`peakpose:release`), to check what depends on Peak's real state (#17)
                l if l.starts_with("peakpose:") => { let pose = &l[9..]; let hold = pose != "release"; let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": if hold { pose } else { "idle" }, "dir": 1, "hold": hold })); }
                l if l.starts_with("quiet:") => { let _ = app.emit_to("main", "quiet-changed", &l[6..] == "on"); }
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
    if let Some(k) = crate::duo_keys::current() { o += &format!("hotkeys box={} ok={} all={} ok={}\n", k.r#box.combo, k.r#box.ok, k.all.combo, k.all.ok); }
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


static PAWS_DRAGGING: AtomicBool = AtomicBool::new(false);

/// The page of Paws is dragging it (DU-11): the window keeps the pointer even when the pet lags behind it.
#[tauri::command]
pub fn duo_paws_drag(on: bool) { PAWS_DRAGGING.store(on, Ordering::SeqCst); }

/// Where the window of Paws is (physical px, top-left).
#[tauri::command]
pub fn duo_paws_pos(app: AppHandle) -> Option<(i32, i32)> {
    let p = app.get_webview_window(PAWS_LABEL)?.outer_position().ok()?;
    Some((p.x, p.y))
}

/// The top of the window of Paws when it stands on the floor of the work area under (x, y): where it falls to when it is let go.
#[tauri::command]
pub fn duo_paws_floor(app: AppHandle, x: i32, y: i32) -> i32 {
    let (body, inset) = ((BODY * scale(&app)).round() as i32, (INSET * scale(&app)).round() as i32);
    let size = body + 2 * inset;
    let mons = monitors(&app);
    let (cx, cy) = (x + size / 2, y + size / 2);
    match mons.iter().find(|m| cx >= m.x && cx < m.x + m.w && cy >= m.y && cy < m.y + m.h).or(mons.first()) {
        Some(m) => m.y + m.h - body - inset,
        None => y,
    }
}

/// The hit test of the Paws window: the window takes the pointer only while it is over the pet, as Peak's does, and lets it through elsewhere.
/// It also tells the page (every 120 ms, when it changed) where the pointer is when it is near but not on the pet, and where Peak is when Peak is close,
/// so that Paws looks at them (DU-11): the window lets the pointer through there, so the page cannot hear it.
fn spawn_paws_hit_test(app: AppHandle) {
    std::thread::spawn(move || {
        let mut ignoring: Option<bool> = None;
        let mut grab: Option<(f64, f64)> = None;
        let mut last_x = i32::MIN / 2;
        let mut tick = 0u32;
        let mut last: (Option<(f64, f64)>, Option<f64>) = (None, None);
        loop {
            std::thread::sleep(Duration::from_millis(30));
            let Some(win) = app.get_webview_window(PAWS_LABEL) else { return }; // the window exists only while Paws is out
            let (Ok(cur), Ok(pos), Ok(scale)) = (win.cursor_position(), win.outer_position(), win.scale_factor()) else { continue };
            let (lx, ly) = ((cur.x - pos.x as f64) / scale, (cur.y - pos.y as f64) / scale);
            // the art: 100 px wide, bottom-aligned in the 140 px window (10 px padding)
            let inside = lx >= 20.0 && lx <= 120.0 && ly >= 30.0 && ly <= 130.0;
            let keep = inside || PAWS_DRAGGING.load(Ordering::SeqCst);
            if ignoring != Some(!keep) { let _ = win.set_ignore_cursor_events(!keep); ignoring = Some(!keep); }
            // carried: the window follows the pointer while the button is down (the page does not get the pointer once the window moves under it: seen with the
            // real mouse, one move and then nothing), and when the button is up it tells the page where it was let go
            if PAWS_DRAGGING.load(Ordering::SeqCst) {
                let down = crate::platform::primary_button_raw() < 0;
                if down {
                    let (gx, gy) = *grab.get_or_insert((cur.x - pos.x as f64, cur.y - pos.y as f64));
                    let (nx, ny) = ((cur.x - gx).round() as i32, (cur.y - gy).round() as i32);
                    let _ = win.set_position(PhysicalPosition::new(nx, ny));
                    if (nx - last_x).abs() > 2 { let _ = app.emit_to(PAWS_LABEL, "duo-paws-dir", if nx > last_x { 1 } else { -1 }); last_x = nx; }
                } else {
                    PAWS_DRAGGING.store(false, Ordering::SeqCst);
                    grab = None;
                    let p = win.outer_position().map(|p| (p.x, p.y)).unwrap_or((pos.x, pos.y));
                    let _ = app.emit_to(PAWS_LABEL, "duo-paws-dropped", serde_json::json!({ "x": p.0, "y": p.1 }));
                }
            } else { grab = None; }
            tick += 1;
            if tick % 4 != 0 { continue; }
            // the pointer, relative to the middle of the pet (70, 80 in the window), when it is near and not on the pet
            let pointer = { let (dx, dy) = (lx - 70.0, ly - 80.0); if !inside && dx.abs() < 280.0 && dy.abs() < 220.0 { Some((dx.round(), dy.round())) } else { None } };
            let peak = app.get_webview_window("main").filter(|m| m.is_visible().unwrap_or(false)).and_then(|m| m.outer_position().ok()).and_then(|p| {
                let (dx, dy) = ((p.x - pos.x) as f64 / scale, (p.y - pos.y) as f64 / scale);
                if dx.abs() < 260.0 && dy.abs() < 120.0 { Some(dx.round()) } else { None }
            });
            let changed = pointer.is_some() != last.0.is_some() || peak.is_some() != last.1.is_some()
                || matches!((pointer, last.0), (Some(a), Some(b)) if (a.0 - b.0).abs() > 10.0 || (a.1 - b.1).abs() > 10.0)
                || matches!((peak, last.1), (Some(a), Some(b)) if (a - b).abs() > 10.0);
            if changed {
                last = (pointer, peak);
                let _ = app.emit_to(PAWS_LABEL, "duo-look", serde_json::json!({ "pointer": pointer, "peak": peak }));
            }
        }
    });
}

/// The chat command (step 4), said to the pet on the screen (Peak's chat): `act` "out" has Peak call `target` out, "in" sends `target` in.
/// False when it changes nothing (already out, already in, busy), so the page can stay silent. No model, no key.
#[tauri::command]
pub fn duo_command(app: AppHandle, target: String, act: String) -> bool {
    if !enabled() { return false; }
    let Some(d) = app.try_state::<Duo>() else { return false };
    if chat_member() && target == "paws" {
        // #17: Paws's membership of the chat is a state only (no window, no walk), so it never waits for Peak's walk (the busy flag) and needs no caller on the screen
        let go_in = act == "in";
        let ok = { let mut s = d.state.lock().unwrap(); let ok = if go_in { s.tuck(Id::Paws, now_ms(), None) } else if s.pets.paws.out { false } else { s.pets.paws.out = true; true }; if ok { save(&d, &s); } ok };
        if ok { log(&app, if go_in { "paws left the chat" } else { "paws joined the chat" }); let _ = app.emit_to(BOX_LABEL, "chatbox-members", ()); }
        return ok;
    }
    if d.busy.swap(true, Ordering::SeqCst) { return false; }
    let id = if target == "peak" { Id::Peak } else { Id::Paws };
    let go_in = act == "in";
    let done = {
        let mut s = d.state.lock().unwrap();
        let ok = if go_in { s.tuck(id, now_ms(), None) } else { s.request_out(id) };
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
    let mut peak_work = false;
    let mut peak_in = false;
    for id in &send_in {
        match id {
            Id::Peak => {
                if let Some(w) = app.get_webview_window("main") {
                    if let Ok(p) = w.outer_position() {
                        let e = nearest_entrance(p.x, p.y, (PET * scale(app)) as i32, &monitors(app));
                        let mut s = d.state.lock().unwrap();
                        if let Some(e) = e { s.pets.peak.entrance = Some(e); save(&d, &s); }
                    }
                    peak_in = true; // it walks out through the nearest edge before it is hidden (the author: an invisible door at the edge, not a vanishing on the spot)
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
            Id::Peak => peak_work = true,
            Id::Paws => paws_work = true,
        }
    }
    if peak_in { peak_work = true; }
    if paws_work || peak_work {
        let out = bring_out.contains(&Id::Paws);
        let app2 = app.clone();
        std::thread::spawn(move || {
            if peak_in { peak_go_in(&app2); } else if peak_work { peak_come_out(&app2); }
            if paws_work { if out { paws_come_out(&app2, false) } else { paws_go_in(&app2) } }
            app2.state::<Duo>().busy.store(false, Ordering::SeqCst);
            let _ = app2.emit_to(BOX_LABEL, "chatbox-members", ());
        });
    } else {
        d.busy.store(false, Ordering::SeqCst);
        let _ = app.emit_to(BOX_LABEL, "chatbox-members", ());
    }
}

/// Peak comes out as Paws does (ADR-0158): from its remembered edge, walking in. If its window is already shown nothing moves. The window is set to shown
/// only after it has been put outside the screen, so that it does not flash where it was.
fn peak_come_out(app: &AppHandle) {
    let Some(win) = app.get_webview_window("main") else { return };
    if win.is_visible().unwrap_or(false) { return; }
    let Some(d) = app.try_state::<Duo>() else { crate::set_peak_visible(app, true); return };
    let entrance = d.state.lock().unwrap().pets.peak.entrance.clone();
    let Some((e, m)) = resolve_entrance(&entrance, &monitors(app)) else { crate::set_peak_visible(app, true); return };
    let (at, door_x) = peak_door(app, &e, &m);
    let from = (door_x, at.1);
    let _ = win.set_position(PhysicalPosition::new(from.0, from.1));
    crate::set_peak_visible(app, true);
    peak_walk(app, &win, from, at);
}

/// Where Peak stands when it is in (`at`, from its remembered entrance) and the x of its door: an invisible door in the side of the screen, left or right,
/// whichever is nearer (Peak lives on the floor: it walks through a side, it does not sink into the taskbar). The author asked for a door, not a vanishing.
fn peak_door(app: &AppHandle, e: &Entrance, m: &Mon) -> ((i32, i32), i32) {
    let (body, inset) = ((BODY * scale(app)).round() as i32, (INSET * scale(app)).round() as i32);
    let (at, outside) = entrance_pos(e, m, body, inset);
    let win = body + 2 * inset;
    let door_x = match e.edge {
        Edge::Left | Edge::Right => outside.0,
        Edge::Top | Edge::Bottom => if e.along < 0.5 { m.x - win } else { m.x + m.w },
    };
    // Peak lives on the floor: an entrance learned at the top of the screen (it was on a high ledge) brings it back on the floor, not along the ceiling
    let at = if e.edge == Edge::Top { entrance_pos(&Entrance { edge: Edge::Bottom, ..e.clone() }, m, body, inset).0 } else { at };
    (at, door_x)
}

/// Peak walks (its walking pose, held by the page as in a scene) from one point to another in a straight line at a walking pace, then is given its own
/// behaviour back. Not a slide: the page shows the steps.
fn peak_walk(app: &AppHandle, win: &tauri::WebviewWindow, from: (i32, i32), to: (i32, i32)) {
    let dist = ((to.0 - from.0) as f64).abs().max(((to.1 - from.1) as f64).abs());
    let speed = 60.0 * scale(app); // physical px per second: the one unhurried pace of every walk on purpose (ADR-0161; it was at least 230 with a 4 s cap)
    let dur = Duration::from_secs_f64((dist / speed).max(0.2));
    let dir = if to.0 >= from.0 { 1 } else { -1 };
    let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": "walk", "dir": dir, "hold": true }));
    let t0 = Instant::now();
    loop {
        let t = (t0.elapsed().as_secs_f64() / dur.as_secs_f64()).min(1.0);
        let x = from.0 as f64 + (to.0 - from.0) as f64 * t;
        let y = from.1 as f64 + (to.1 - from.1) as f64 * t;
        let _ = win.set_position(PhysicalPosition::new(x.round() as i32, y.round() as i32));
        if t >= 1.0 { break; }
        std::thread::sleep(Duration::from_millis(16));
    }
    let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": "idle", "dir": dir, "hold": false }));
}

/// Peak goes in through its entrance (the nearest edge, saved just before): it walks out of the screen and only then is hidden.
fn peak_go_in(app: &AppHandle) {
    let Some(win) = app.get_webview_window("main") else { return };
    if win.is_visible().unwrap_or(false) {
        let entrance = app.try_state::<Duo>().and_then(|d| d.state.lock().unwrap().pets.peak.entrance.clone());
        if let (Some((e, m)), Ok(p)) = (resolve_entrance(&entrance, &monitors(app)), win.outer_position()) {
            let (_, door_x) = peak_door(app, &e, &m);
            peak_walk(app, &win, (p.x, p.y), (door_x, p.y)); // along the floor to the nearer side, then out of sight
        }
    }
    crate::set_peak_visible(app, false);
}

/// Lượn đi (ADR-0160): the page has walked Peak to the edge; it walks on through its door, out of sight, and only then is it hidden and "in".
pub fn peak_walk_off(app: &AppHandle) {
    let app = app.clone();
    std::thread::spawn(move || {
        let Some(d) = app.try_state::<Duo>() else { return };
        let mine = !d.busy.swap(true, Ordering::SeqCst);
        if let Some(win) = app.get_webview_window("main") {
            if let (Ok(p), Some(e)) = (win.outer_position(), nearest_entrance_of(&app, &win)) {
                if let Some((e, m)) = resolve_entrance(&Some(e), &monitors(&app)) {
                    let (_, door_x) = peak_door(&app, &e, &m);
                    peak_walk(&app, &win, (p.x, p.y), (door_x, p.y));
                }
            }
        }
        peak_present(&app, false); // saves the side it left by, before the window is hidden
        crate::set_peak_visible(&app, false);
        if mine { d.busy.store(false, Ordering::SeqCst); }
    });
}

fn nearest_entrance_of(app: &AppHandle, win: &tauri::WebviewWindow) -> Option<Entrance> {
    let p = win.outer_position().ok()?;
    nearest_entrance(p.x, p.y, (PET * scale(app)) as i32, &monitors(app))
}

/// Lượn đi is over (ADR-0160): Peak comes back through its door, walking in from the side it left by, as when it is called out.
pub fn peak_walk_back(app: &AppHandle) {
    peak_present(app, true);
    let app = app.clone();
    std::thread::spawn(move || {
        let Some(d) = app.try_state::<Duo>() else { return };
        let mine = !d.busy.swap(true, Ordering::SeqCst);
        peak_come_out(&app);
        if mine { d.busy.store(false, Ordering::SeqCst); }
    });
}

/// The state follows a change of Peak's window made elsewhere (the away flow hides and shows it): away is a tuck. Does nothing without the flag.
pub fn peak_present(app: &AppHandle, out: bool) {
    if !enabled() { return; }
    let Some(d) = app.try_state::<Duo>() else { return };
    let mut s = d.state.lock().unwrap();
    if s.pets.peak.out == out { return; }
    s.pets.peak.out = out;
    if !out {
        s.pets.peak.tucked_at = now_ms();
        // it left by the side it walked to: it comes back by the same one
        if let Some(w) = app.get_webview_window("main") { if let Ok(p) = w.outer_position() { if let Some(e) = nearest_entrance(p.x, p.y, (PET * scale(app)) as i32, &monitors(app)) { s.pets.peak.entrance = Some(e); } } }
    }
    save(&d, &s);
}

/// Whether a pet is still coming or going: the page waits for this to be false before the pet speaks (ADR-0158; it was a fixed wait).
#[tauri::command]
pub fn duo_busy(app: AppHandle) -> bool {
    app.try_state::<Duo>().map(|d| d.busy.load(Ordering::SeqCst)).unwrap_or(false)
}

/// The check of ADR-0158: the windows follow the saved state. Called every few seconds and never while a pet is coming or going. A disagreement is
/// put right and written in the log, so that it can be found afterwards.
fn sync_windows(app: &AppHandle) {
    let Some(d) = app.try_state::<Duo>() else { return };
    let look = || {
        let (peak_out, paws_out) = { let s = d.state.lock().unwrap(); (s.pets.peak.out, s.pets.paws.out) };
        let peak_vis = app.get_webview_window("main").map(|w| w.is_visible().unwrap_or(false));
        let paws_win = if chat_member() { paws_out } else { app.get_webview_window(PAWS_LABEL).is_some() }; // a chat member has no window
        (peak_out, paws_out, peak_vis, paws_win)
    };
    let off = |t: (bool, bool, Option<bool>, bool)| t.2.is_some_and(|v| v != t.0) || t.3 != t.1;
    if d.busy.load(Ordering::SeqCst) || !off(look()) { return; }
    std::thread::sleep(Duration::from_millis(900)); // a change in progress (a window being made, a state just written) settles first: only a disagreement seen twice is put right
    if d.busy.load(Ordering::SeqCst) { return; }
    let (peak_out, paws_out, peak_vis, paws_window) = look();
    if let Some(v) = peak_vis {
        if v != peak_out {
            log(app, &format!("sync_fix peak state_out={peak_out}"));
            crate::set_peak_visible(app, peak_out);
        }
    }
    if paws_window != paws_out {
        if d.busy.swap(true, Ordering::SeqCst) { return; }
        log(app, &format!("sync_fix paws state_out={paws_out}"));
        if paws_out { paws_come_out(app, true); } else if let Some(w) = app.get_webview_window(PAWS_LABEL) { let _ = w.destroy(); }
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
    if portrait() { portrait_open(app); return; }
    if chat_member() { log(app, "paws joined the chat"); let _ = app.emit_to(BOX_LABEL, "chatbox-members", ()); return; } // no window: the saved state is the membership (#17)
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
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false).focused(false) // a pet coming out must not take the keyboard from the chat box (or from the program the person is in)
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
    if chat_member() { log(app, "paws left the chat"); let _ = app.emit_to(BOX_LABEL, "chatbox-members", ()); return; }
    let Some(win) = app.get_webview_window(PAWS_LABEL) else { return };
    if portrait() {
        // the frame fades out (its page), then the window is closed
        let _ = app.emit_to(PAWS_LABEL, "portrait-leave", ());
        std::thread::sleep(Duration::from_millis(330));
        let _ = win.destroy();
        return;
    }
    let Some(d) = app.try_state::<Duo>() else { return };
    let entrance = d.state.lock().unwrap().pets.paws.entrance.clone();
    if let Some((e, m)) = resolve_entrance(&entrance, &monitors(app)) {
        let (body, inset) = ((BODY * scale(app)).round() as i32, (INSET * scale(app)).round() as i32);
        let (at, outside) = entrance_pos(&e, &m, body, inset);
        if let Ok(p) = win.outer_position() { slide(&win, (p.x, p.y), outside); } else { slide(&win, at, outside); }
    }
    let _ = win.destroy();
}

/// Where the portrait stands (ADR-0161): left of the box, level with its top, like the picture of someone taking part; never lower than the height of Peak above
/// the floor, so that a short box does not put it in Peak's lane (Peak steps aside to the left of the box). It follows the box when the box grows or shrinks.
fn portrait_place(app: &AppHandle) -> (i32, i32) {
    let s = scale(app);
    let size = (PORTRAIT * s).round() as i32;
    let (bx, by) = box_position(app);
    let x = bx - size - (12.0 * s).round() as i32; // the window is wider than the frame, which sits in its middle
    let floor = monitors(app).first().map(|m| m.y + m.h).unwrap_or(by + size);
    let lane_top = floor - (PET * s).round() as i32; // the top of Peak's window when it stands on the floor
    let y = (by + (10.0 * s).round() as i32).min(lane_top - size);
    (x, y)
}

/// The round portrait (issue 15): the window of Paws (the same label, so the talk, the bubble and the saved presence work as before), small, beside the chat
/// box on its left and level with its bottom, letting the mouse through and never taking the keyboard. No hit test, no walk, no scene.
fn portrait_open(app: &AppHandle) {
    if app.get_webview_window(PAWS_LABEL).is_some() { return; } // a repeated mention reuses the portrait that is showing
    let (x, y) = portrait_place(app);
    let built = WebviewWindowBuilder::new(app, PAWS_LABEL, WebviewUrl::App("pawsportrait".into()))
        .title("Streakboom Paws")
        .inner_size(PORTRAIT, PORTRAIT)
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false).focused(false)
        .additional_browser_args(BROWSER_ARGS)
        .build();
    let Ok(win) = built else { return };
    // the system keeps a window at least about 133 logical px wide: the frame is drawn square in the middle (vmin) and the rest is transparent and lets the mouse
    // through. Resizing it here took the keyboard (found in the check: Esc went to the portrait).
    let _ = win.set_position(PhysicalPosition::new(x, y));
    let _ = win.set_ignore_cursor_events(true);
    log(app, "portrait open");
}

/// The chat went away (the person hid it, or it faded): the visit is over. Paws is sent in and its frame fades with the box (r1, AC7), so the next ordinary
/// message is Peak's alone. Nothing without the portrait flag.
fn portrait_dismiss(app: &AppHandle) {
    if !visit_mode() { return; }
    let Some(d) = app.try_state::<Duo>() else { return };
    let tucked = { let mut s = d.state.lock().unwrap(); let ok = s.tuck(Id::Paws, now_ms(), None); if ok { save(&d, &s); } ok };
    if !tucked { return; }
    log(app, "visit ended with the chat: paws is no longer a member");
    let _ = app.emit_to("main", "duo-tucked", "paws");
    let _ = app.emit_to("main", "duo-visit-ended", ()); // the talk of the visit is dropped: a reply, a retry or a timer of it cannot reach a later visit (#17)
    let _ = app.emit_to(BOX_LABEL, "chatbox-members", ());
    let app = app.clone();
    std::thread::spawn(move || {
        let d = app.state::<Duo>();
        let mine = !d.busy.swap(true, Ordering::SeqCst);
        paws_go_in(&app);
        if mine { d.busy.store(false, Ordering::SeqCst); }
    });
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
    if visit_mode() { return; } // no full-body scenes with the portrait or the chat member (non-goals of #15 and #17)
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
    fn with_nobody_out_the_person_may_bring_either_pet_out_by_name_and_with_one_out_only_that_pet_calls() {
        let mut s = DuoState::default();
        s.pets.peak.out = false;
        assert!(s.bring_when_none_out(Id::Paws));
        assert!(s.pets.paws.out && !s.pets.peak.out);
        assert!(!s.bring_when_none_out(Id::Peak)); // Paws is out now: only a pet on the screen calls
        assert!(s.call(Id::Paws, Id::Peak));
    }
    #[test]
    fn a_pet_that_is_out_is_called_by_whichever_pet_is_on_the_screen() {
        let mut s = DuoState::default(); // Peak out
        assert!(s.request_out(Id::Paws)); // Peak calls Paws
        assert!(!s.request_out(Id::Paws)); // already out
        let mut t = DuoState::default();
        t.pets.peak.out = false; t.pets.paws.out = true; // the case the author hit: Paws out, Peak in
        assert!(t.request_out(Id::Peak)); // Paws calls Peak
        assert!(t.pets.peak.out && t.pets.paws.out);
        let mut n = DuoState::default();
        n.pets.peak.out = false; // nobody out: by name
        assert!(n.request_out(Id::Paws));
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
const BOX_FADE_HEAD: f64 = 0.0; // the clear strip at the top of the window where the scrim fades away: it does not count as the box for the pointer (the page has the same number)
const BOX_MARGIN: f64 = 0.0; // flush with the work area (the stack has its own 8 px inside); 16 was the gap of the old floating card (ADR-0147)
const BLUR_GRACE_MS: u64 = 600; // a blur this soon after the box was shown is the box taking focus, not the person leaving
const BLUR_TOGGLE_MS: u64 = 900; // a tray click this soon after a blur-hide is the click that took the focus away: it must not show the box again

// Two modes (ADR-0147): AMBIENT (transparent, click-through, no focus: only the pills of the recent messages) and ENGAGED (solid, with the field, the
// keyboard). Pinned (the default) keeps the ambient window between messages; unpinned, the page hides it when no message is alive.
static BOX_PINNED: AtomicBool = AtomicBool::new(false); // pinned: the box never fades away (`/pin`); not pinned (the default): it fades after the person has been elsewhere for a while
static BOX_IDLE_SINCE: AtomicU64 = AtomicU64::new(0); // since when nothing has made the box matter (0: it matters now): no keyboard, no pointer on it, no draft, no new message
static BOX_FADE_PERMILLE: AtomicU64 = AtomicU64::new(1000); // the opacity the page was last told (1000 = whole)
const FADE_AFTER_MS: u64 = 20_000; // the person has been in another program this long: the box begins to fade (not sooner: it must not go while it may still be read)
const FADE_MS: u64 = 4_000; // and goes slowly, so that it is never a jolt; the pointer on it, a new message or the keyboard brings it back at once
static BOX_ENGAGED: AtomicBool = AtomicBool::new(false);
static BOX_CUR_H: AtomicU64 = AtomicU64::new(120); // the height the page asked for (logical px): the window is as tall as the stack
static BOX_DRAFT_EMPTY: AtomicBool = AtomicBool::new(true); // the page tells: the field is empty (the pointer leaving may then take the box back to reading)
static BOX_HAS_CONTENT: AtomicBool = AtomicBool::new(false); // the page tells: something is showing (the pointer resting on an empty window engages nothing)
const HOVER_IN_MS: u64 = 250; // the pointer must rest this long on the box to engage it (ADR-0147)
const HOVER_OUT_MS: u64 = 800; // and be away this long, with an empty field, to give it back
const HOVER_MARGIN: f64 = 8.0; // logical px around the box that still count as on it
static BOX_SHOWN_AT: AtomicU64 = AtomicU64::new(0);
static BOX_BLUR_HID_AT: AtomicU64 = AtomicU64::new(0);
static TRAY_GEN: AtomicU64 = AtomicU64::new(0);

/// A single click on the tray (with the flag): after the wait, if no second click came, the box is shown or hidden.
pub fn tray_single(app: &AppHandle) {
    dismiss_tray_flyout();
    TRAY_GEN.fetch_add(1, Ordering::SeqCst);
    let app = app.clone();
    std::thread::spawn(move || chatbox_toggle(&app)); // no double click any more (ADR-0160): no wait to tell the two apart
}

/// A double click on the tray (with the flag): it cancels the single click that came with it, then everyone goes in or the last one comes out.
pub fn tray_double(app: &AppHandle) {
    dismiss_tray_flyout();
    TRAY_GEN.fetch_add(1, Ordering::SeqCst);
    tray(app);
}

/// The hidden-icons flyout of the taskbar stays open when a program clicked in it opens a window of its own (the author saw it stay behind the chat box;
/// reproduced: the box had the foreground and the flyout stayed visible). The click on our icon is the person's way of saying they are done with the
/// flyout, so it is hidden, as the shell would do for a click elsewhere. Windows 10 and 11 name it differently; nothing happens when it is not showing.
fn dismiss_tray_flyout() {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{FindWindowW, IsWindowVisible, PostMessageW, WM_KEYDOWN, WM_KEYUP};
        const VK_ESCAPE: usize = 0x1B;
        for class in ["NotifyIconOverflowWindow", "TopLevelWindowForOverflowXamlIsland"] {
            let w: Vec<u16> = class.encode_utf16().chain(std::iter::once(0)).collect();
            let h = FindWindowW(w.as_ptr(), std::ptr::null());
            // Esc, as the person would press it: the shell closes its flyout and knows it is closed. Hiding the window behind its back (as before) left the
            // shell thinking it was open, so the next click on the chevron did nothing (the author saw it; reproduced: hide, then the chevron fails; Esc, then it opens)
            if !h.is_null() && IsWindowVisible(h) != 0 { PostMessageW(h, WM_KEYDOWN, VK_ESCAPE, 0); PostMessageW(h, WM_KEYUP, VK_ESCAPE, 0); }
        }
    }
}

fn box_position(app: &AppHandle) -> (i32, i32) {
    let s = scale(app);
    let (w, h, m) = ((BOX_W * s).round() as i32, (BOX_CUR_H.load(Ordering::SeqCst) as f64 * s).round() as i32, (BOX_MARGIN * s).round() as i32);
    match monitors(app).first() {
        Some(mon) => (mon.x + mon.w - w - m, mon.y + mon.h - h - m),
        None => (100, 100),
    }
}

/// The box as the ambient log: transparent to the mouse, no focus, shown without taking the keyboard from the program that has it.
/// Tell the page how opaque to be (it fades by itself with this), only when the figure changed.
fn emit_fade(app: &AppHandle, permille: u64) {
    if BOX_FADE_PERMILLE.swap(permille, Ordering::SeqCst) != permille { let _ = app.emit_to(BOX_LABEL, "chatbox-fade", permille as f64 / 1000.0); }
}

fn show_ambient(app: &AppHandle, win: &tauri::WebviewWindow) {
    HIDE_GEN.fetch_add(1, Ordering::SeqCst); // a fade on the way out is called off
    BOX_IDLE_SINCE.store(0, Ordering::SeqCst); emit_fade(app, 1000);
    let (x, y) = box_position(app);
    let _ = win.set_position(PhysicalPosition::new(x, y));
    BOX_ENGAGED.store(false, Ordering::SeqCst);
    let _ = win.set_focusable(false);
    let _ = win.set_ignore_cursor_events(true);
    crate::platform::show_without_activating(win);
    let _ = app.emit_to(BOX_LABEL, "chatbox-mode", false);
    peak_yield_to_box(app);
}

/// Engaged: solid, takes clicks and the keyboard (the tray, the shortcut and a double click on a pet open it).
fn show_box(app: &AppHandle, win: &tauri::WebviewWindow) {
    HIDE_GEN.fetch_add(1, Ordering::SeqCst); // a fade on the way out is called off
    BOX_IDLE_SINCE.store(0, Ordering::SeqCst); emit_fade(app, 1000);
    let (x, y) = box_position(app);
    let _ = win.set_position(PhysicalPosition::new(x, y));
    BOX_SHOWN_AT.store(now_ms(), Ordering::SeqCst);
    BOX_ENGAGED.store(true, Ordering::SeqCst);
    let _ = win.set_focusable(true);
    let _ = win.set_ignore_cursor_events(false);
    let _ = app.emit_to(BOX_LABEL, "chatbox-mode", true);
    let _ = win.show();
    let _ = win.set_focus();
    take_foreground(win);
    let _ = app.emit_to(BOX_LABEL, "chatbox-open", ());
    peak_yield_to_box(app);
}

/// The box has appeared over Peak (ADR-0161): Peak lifts its ears for a moment, then walks at its unhurried pace to the nearer side of the box that has room on
/// the screen, until its body is clear. Also when it was asleep (it wakes to step aside). Nothing if Peak is in, hidden, busy, or not under the box.
fn peak_yield_to_box(app: &AppHandle) {
    let app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(400)); // the box has taken its place and size
        let Some(d) = app.try_state::<Duo>() else { return };
        if !d.state.lock().unwrap().pets.peak.out { return; }
        let (Some(win), Some(bw)) = (app.get_webview_window("main"), app.get_webview_window(BOX_LABEL)) else { return };
        if !win.is_visible().unwrap_or(false) || !bw.is_visible().unwrap_or(false) { return; }
        let (Ok(p), Ok(sz), Ok(bp), Ok(bs)) = (win.outer_position(), win.outer_size(), bw.outer_position(), bw.outer_size()) else { return };
        let (pw, ph) = (sz.width as i32, sz.height as i32);
        let body = (p.x + pw / 4, p.y + ph / 3, p.x + pw * 3 / 4, p.y + ph); // Peak's body: the middle of its window, the lower two thirds
        let bx = (bp.x, bp.y, bp.x + bs.width as i32, bp.y + bs.height as i32);
        if !(body.0 < bx.2 && body.2 > bx.0 && body.1 < bx.3 && body.3 > bx.1) { return; }
        let m = (12.0 * scale(&app)).round() as i32;
        let mon = monitors(&app).into_iter().find(|mo| bx.0 >= mo.x && bx.0 < mo.x + mo.w).or_else(|| monitors(&app).into_iter().next());
        let Some(mon) = mon else { return };
        let left = bx.0 - m - pw * 3 / 4; // its body ends just left of the box
        let right = bx.2 + m - pw / 4; // its body starts just right of the box
        let mut options = vec![];
        if left + pw / 4 >= mon.x { options.push(left); }
        if right + pw * 3 / 4 <= mon.x + mon.w { options.push(right); }
        let Some(to) = options.into_iter().min_by_key(|x| (x - p.x).abs()) else { return };
        if d.busy.swap(true, Ordering::SeqCst) { return; }
        log(&app, &format!("peak yields to the box: {} -> {}", p.x, to));
        let dir = if to >= p.x { 1 } else { -1 };
        let _ = app.emit_to("main", "duo-scene-pose", serde_json::json!({ "pose": "notice", "dir": dir, "hold": true })); // look before moving: ears up
        std::thread::sleep(Duration::from_millis(700));
        peak_walk(&app, &win, (p.x, p.y), (to, p.y));
        d.busy.store(false, Ordering::SeqCst);
    });
}

/// Make the box the window in front that has the keyboard, also when another program (the hidden-icons flyout of the taskbar, where the person just
/// clicked our icon) is in front. Windows refuses `SetForegroundWindow` to a program that is not allowed to take the foreground, and the box then
/// opens behind the flyout, which stays open (seen by the author). The usual remedy: for a moment share the input queue of the window now in front.
fn take_foreground(win: &tauri::WebviewWindow) {
    #[cfg(windows)]
    {
        use windows_sys::Win32::{
            System::Threading::{AttachThreadInput, GetCurrentThreadId},
            UI::{
                WindowsAndMessaging::{BringWindowToTop, GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow},
            },
        };
        let Ok(h) = win.hwnd() else { return };
        let target = h.0 as isize as _;
        unsafe {
            let front = GetForegroundWindow();
            if front == target { return; }
            PREV_FRONT.store(front as isize, Ordering::SeqCst); // the program the person was in: the keyboard goes back to it when the box is hidden
            let (mine, theirs) = (GetCurrentThreadId(), GetWindowThreadProcessId(front, std::ptr::null_mut()));
            let attached = theirs != 0 && theirs != mine && AttachThreadInput(mine, theirs, 1) != 0;
            BringWindowToTop(target);
            SetForegroundWindow(target);
            if attached { AttachThreadInput(mine, theirs, 0); }
        }
    }
    #[cfg(not(windows))]
    let _ = win;
}

/// The shortcut (ADR-0159): open the box, or give it the keyboard if it is showing; never hide it (Esc, a click elsewhere and the fade do that).
pub fn chatbox_open(app: &AppHandle) {
    match app.get_webview_window(BOX_LABEL) {
        Some(win) => { if !(win.is_visible().unwrap_or(false) && BOX_ENGAGED.load(Ordering::SeqCst) && has_keyboard(&win)) { show_box(app, &win); } }
        None => make_box(app, true),
    }
}

/// Show the box, or hide it if it is showing. The window is made the first time and kept after that.
pub fn chatbox_toggle(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(BOX_LABEL) {
        if win.is_visible().unwrap_or(false) && BOX_ENGAGED.load(Ordering::SeqCst) && has_keyboard(&win) {
            hide_box_soft(app, &win); // the person is writing in it and asks again: off the screen. Showing and hiding are all there is
        } else if win.is_visible().unwrap_or(false) {
            // showing but the mouse goes through it: the shortcut gives it the keyboard; but a click on the tray that has just taken the keyboard away from it asks to hide it
            if now_ms().saturating_sub(BOX_BLUR_HID_AT.load(Ordering::SeqCst)) <= BLUR_TOGGLE_MS { hide_box_soft(app, &win); } else { show_box(app, &win); }
        } else if now_ms().saturating_sub(BOX_BLUR_HID_AT.load(Ordering::SeqCst)) > BLUR_TOGGLE_MS {
            show_box(app, &win);
        }
        return;
    }
    make_box(app, true);
}

/// The pointer rests on the reading log: the same window starts to take clicks and keys (the scroll, the field) without taking the keyboard from the program
/// in front; a click in the field then gives it the focus. No move, no `set_focus`.
fn hover_engage(app: &AppHandle, win: &tauri::WebviewWindow) {
    log(app, "hover_engage");
    BOX_ENGAGED.store(true, Ordering::SeqCst);
    let _ = win.set_focusable(true);
    let _ = win.set_ignore_cursor_events(false);
    crate::platform::show_without_activating(win); // changing the focusable style takes the window off the screen: it is shown again, still without taking the keyboard (found with the real mouse)
    let _ = app.emit_to(BOX_LABEL, "chatbox-mode", true);
}

/// Whether the window is the one in front, that has the keyboard (`is_focused` also says yes for the window that is merely the last one of this program to have been active).
fn has_keyboard(win: &tauri::WebviewWindow) -> bool {
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::GetForegroundWindow;
        // a hidden box can stay the foreground window after Esc (nothing else took it): hidden, it has no keyboard (#17 check: it never faded, so the visit never ended)
        if let Ok(h) = win.hwnd() { return win.is_visible().unwrap_or(false) && unsafe { GetForegroundWindow() } == h.0 as isize as _; }
    }
    win.is_focused().unwrap_or(false)
}

#[cfg(windows)]
fn cursor_pos() -> Option<(i32, i32)> {
    use windows_sys::Win32::{Foundation::POINT, UI::WindowsAndMessaging::GetCursorPos};
    let mut p = POINT { x: 0, y: 0 };
    if unsafe { GetCursorPos(&mut p) } != 0 { Some((p.x, p.y)) } else { None }
}
#[cfg(not(windows))]
fn cursor_pos() -> Option<(i32, i32)> { None }

/// The pointer watcher of the box: the reading log lets the mouse through, so it cannot hear the pointer; this reads where it is every 100 ms (as the
/// hit test of the pets does) and, with a delay and a margin so that it does not flicker, engages the box when the pointer rests on it and gives it back
/// when the pointer has gone, the field is empty and the box does not have the keyboard.
fn spawn_hover(app: AppHandle) {
    std::thread::spawn(move || {
        let (mut inside_since, mut outside_since): (Option<u64>, Option<u64>) = (None, None);
        loop {
            std::thread::sleep(Duration::from_millis(100));
            let Some(win) = app.get_webview_window(BOX_LABEL) else { continue };
            if !win.is_visible().unwrap_or(false) { inside_since = None; outside_since = None; BOX_IDLE_SINCE.store(0, Ordering::SeqCst); continue; }
            let (Some((px, py)), Ok(pos), Ok(size)) = (cursor_pos(), win.outer_position(), win.outer_size()) else { continue };
            let m = (HOVER_MARGIN * scale(&app)).round() as i32;
            let inside = px >= pos.x - m && px <= pos.x + size.width as i32 + m && py >= pos.y + (BOX_FADE_HEAD * scale(&app)).round() as i32 - m && py <= pos.y + size.height as i32 + m;
            let now = now_ms();
            // the fade: nothing has made the box matter for a while (the keyboard is elsewhere, the pointer is not on it, no draft, not pinned): it fades slowly and goes
            // the last program in front other than the box: where the keyboard goes back when the box is hidden (the box may have been clicked into, not opened)
            #[cfg(windows)]
            if let Ok(h) = win.hwnd() { let f = unsafe { windows_sys::Win32::UI::WindowsAndMessaging::GetForegroundWindow() }; if !f.is_null() && f != h.0 as isize as _ { PREV_FRONT.store(f as isize, Ordering::SeqCst); } }
            let matters = inside || has_keyboard(&win) || !BOX_DRAFT_EMPTY.load(Ordering::SeqCst) || BOX_PINNED.load(Ordering::SeqCst);
            static LAST_MATTERS: AtomicBool = AtomicBool::new(true);
            if LAST_MATTERS.swap(matters, Ordering::SeqCst) != matters { log(&app, &format!("box matters={matters} inside={inside} keyboard={} draft_empty={} pinned={} cursor=({px},{py}) box=({},{} {}x{})", has_keyboard(&win), BOX_DRAFT_EMPTY.load(Ordering::SeqCst), BOX_PINNED.load(Ordering::SeqCst), pos.x, pos.y, size.width, size.height)); }
            if matters {
                BOX_IDLE_SINCE.store(0, Ordering::SeqCst);
                emit_fade(&app, 1000);
            } else {
                let mut since = BOX_IDLE_SINCE.load(Ordering::SeqCst);
                if since == 0 { since = now; BOX_IDLE_SINCE.store(now, Ordering::SeqCst); }
                let idle = now.saturating_sub(since);
                if idle > FADE_AFTER_MS {
                    let p = ((idle - FADE_AFTER_MS) as f64 / FADE_MS as f64).min(1.0);
                    emit_fade(&app, ((1.0 - p) * 1000.0).round() as u64);
                    if p >= 1.0 { portrait_dismiss(&app); hide_box(&win); BOX_IDLE_SINCE.store(0, Ordering::SeqCst); emit_fade(&app, 1000); log(&app, "box faded away"); continue; }
                }
            }
            if !BOX_ENGAGED.load(Ordering::SeqCst) {
                outside_since = None;
                if inside && BOX_HAS_CONTENT.load(Ordering::SeqCst) {
                    let since = *inside_since.get_or_insert(now);
                    if now.saturating_sub(since) >= HOVER_IN_MS { hover_engage(&app, &win); inside_since = None; }
                } else { inside_since = None; }
            } else {
                inside_since = None;
                if !inside && BOX_DRAFT_EMPTY.load(Ordering::SeqCst) && !has_keyboard(&win) {
                    let since = *outside_since.get_or_insert(now);
                    if now.saturating_sub(since) >= HOVER_OUT_MS { leave_engaged(&app, &win); outside_since = None; }
                } else { outside_since = None; }
            }
        }
    });
}

/// The page says how tall the stack is: the window takes that height (within a part of the screen) and stays at the bottom right.
#[tauri::command]
pub fn chatbox_fit(app: AppHandle, h: f64) {
    let s = scale(&app);
    let cap = monitors(&app).first().map(|m| (m.h as f64 * 0.6 / s).round()).unwrap_or(600.0);
    let h = h.clamp(48.0, cap.max(120.0));
    BOX_CUR_H.store(h.round() as u64, Ordering::SeqCst);
    if let Some(win) = app.get_webview_window(BOX_LABEL) {
        let _ = win.set_size(tauri::LogicalSize::new(BOX_W, h));
        let (x, y) = box_position(&app);
        let _ = win.set_position(PhysicalPosition::new(x, y));
    }
    if portrait() { if let Some(pw) = app.get_webview_window(PAWS_LABEL) { let (x, y) = portrait_place(&app); let _ = pw.set_position(PhysicalPosition::new(x, y)); } } // the portrait follows the top of the box
}

/// What the page knows that the pointer watcher needs: whether the field is empty and whether anything is showing.
#[tauri::command]
pub fn chatbox_state(empty: bool, content: bool) {
    BOX_DRAFT_EMPTY.store(empty, Ordering::SeqCst);
    BOX_HAS_CONTENT.store(content, Ordering::SeqCst);
}

/// The box goes off the screen (the shortcut, the tray, Esc): the only thing besides showing it.
/// The box goes after a fade (ADR-0159: a window never vanishes on the spot): the page fades (its own 0.3 s transition), then the window is hidden, unless
/// it was shown again meanwhile. It stops taking clicks and keys at once.
static HIDE_GEN: AtomicU64 = AtomicU64::new(0);
fn hide_box_soft(app: &AppHandle, win: &tauri::WebviewWindow) {
    let g = HIDE_GEN.fetch_add(1, Ordering::SeqCst) + 1;
    BOX_ENGAGED.store(false, Ordering::SeqCst);
    let _ = win.set_ignore_cursor_events(true);
    emit_fade(app, 0);
    portrait_dismiss(app); // the portrait fades with the chat (issue 15)
    let (app, win) = (app.clone(), win.clone());
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(320));
        if HIDE_GEN.load(Ordering::SeqCst) != g { return; } // shown again during the fade
        hide_box(&win);
        emit_fade(&app, 1000); // ready to be seen whole the next time it shows
    });
}

fn hide_box(win: &tauri::WebviewWindow) {
    BOX_ENGAGED.store(false, Ordering::SeqCst);
    let had_keyboard = has_keyboard(win);
    crate::platform::hide_window(win); // the system call: the ambient box is shown by one too (ADR-0158, the same trap as Peak's window)
    // the keyboard goes back to the program the person was in. Left alone, a hidden box could stay the foreground window: the keys typed next went nowhere,
    // and the box, "having the keyboard", never faded (#17 check: the visit never ended)
    #[cfg(windows)]
    if had_keyboard {
        use windows_sys::Win32::UI::WindowsAndMessaging::{IsWindow, IsWindowVisible, SetForegroundWindow};
        let prev = PREV_FRONT.swap(0, Ordering::SeqCst);
        if prev != 0 { unsafe { if IsWindow(prev as _) != 0 && IsWindowVisible(prev as _) != 0 { SetForegroundWindow(prev as _); } } }
    }
}
static PREV_FRONT: std::sync::atomic::AtomicIsize = std::sync::atomic::AtomicIsize::new(0);

/// The box loses the keyboard or the pointer has left it: it looks the same, lets the mouse through (pinned, the default), or goes off the screen (not pinned).
/// If it is still the window in front, it is shown again without the focus so that the keyboard goes back to the program the person was in.
fn leave_engaged(app: &AppHandle, win: &tauri::WebviewWindow) {
    log(app, "leave_engaged");
    let front = has_keyboard(win);
    if front { crate::platform::hide_window(win); }
    show_ambient(app, win);
}

/// Make the window of the box (hidden), set its blur rule, and show it (`engaged`: for the person to write in; else as the ambient log). Called when it does not exist yet.
fn make_box(app: &AppHandle, engaged: bool) {
    let built = WebviewWindowBuilder::new(app, BOX_LABEL, WebviewUrl::App("chatbox".into()))
        .title("Streakboom chat")
        .inner_size(BOX_W, BOX_H)
        .decorations(false).transparent(true).always_on_top(true).skip_taskbar(true).resizable(false).shadow(false)
        .visible(false)
        .focused(engaged) // made by a message that arrives (the faded log), it must not take the keyboard: it then "had the keyboard" and never faded (#17 check)
        .additional_browser_args(BROWSER_ARGS)
        .build();
    let Ok(win) = built else { return };
    static WATCHER: std::sync::Once = std::sync::Once::new();
    WATCHER.call_once(|| spawn_hover(app.clone()));
    let app2 = app.clone();
    win.on_window_event(move |e| {
        if let tauri::WindowEvent::Focused(false) = e {
            let recently = now_ms().saturating_sub(BOX_SHOWN_AT.load(Ordering::SeqCst)) < BLUR_GRACE_MS;
            if BOX_ENGAGED.load(Ordering::SeqCst) && !recently {
                if let Some(w) = app2.get_webview_window(BOX_LABEL) {
                    if w.is_visible().unwrap_or(false) { BOX_BLUR_HID_AT.store(now_ms(), Ordering::SeqCst); leave_engaged(&app2, &w); }
                }
            }
        }
    });
    if engaged { show_box(app, &win); } else { show_ambient(app, &win); }
}

/// A double click on Peak or Paws (ADR-0145): the box is shown if it was not, takes the keyboard, and the pet that was clicked is kept for the page,
/// which writes `@Name ` in the field when both are out. The pet is kept here because the page may not exist yet when the box is made.
#[tauri::command]
pub fn duo_open_box(app: AppHandle, pet: String) {
    log(&app, &format!("open_box pet={pet} exists={}", app.get_webview_window(BOX_LABEL).is_some()));
    *BOX_PREFILL.lock().unwrap() = Some(pet);
    std::thread::spawn(move || {
        dismiss_tray_flyout();
        if let Some(win) = app.get_webview_window(BOX_LABEL) {
            show_box(&app, &win); // also when it is showing: it takes the keyboard and the page reads the pet
        } else {
            make_box(&app, true);
        }
    });
}

/// A message arrived (the main page asks) or is still alive: the ambient log is shown if the box is not showing. Never takes the focus, never leaves engaged.
#[tauri::command]
pub fn duo_box_ambient(app: AppHandle) {
    // on a thread of its own: making a window from a synchronous command takes the main thread that has to run it, and the program hangs (found when a message
    // arrived before the box had ever been made: nothing answered any more)
    std::thread::spawn(move || {
        match app.get_webview_window(BOX_LABEL) {
            Some(win) => { BOX_IDLE_SINCE.store(0, Ordering::SeqCst); emit_fade(&app, 1000); if !win.is_visible().unwrap_or(false) { show_ambient(&app, &win); } } // a new message: the box matters again
            None => make_box(&app, false),
        }
    });
}

/// Whether the chat box is on the screen (engaged or as the faded log): the page says a pet's line in a bubble only when it is not (ADR-0161).
#[tauri::command]
pub fn chatbox_showing(app: AppHandle) -> bool { app.get_webview_window(BOX_LABEL).is_some_and(|w| w.is_visible().unwrap_or(false)) }

/// Whether the box is engaged now (the page asks when it starts; it is also told by `chatbox-mode`).
#[tauri::command]
pub fn chatbox_mode() -> bool { BOX_ENGAGED.load(Ordering::SeqCst) }

/// The page of the box takes the pet that was double clicked (once).
#[tauri::command]
pub fn chatbox_take_prefill() -> Option<String> { BOX_PREFILL.lock().unwrap().take() }

static BOX_PREFILL: Mutex<Option<String>> = Mutex::new(None);

/// The box asks to hide (Esc, or its own button).
#[tauri::command]
pub fn chatbox_hide(app: AppHandle) {
    if let Some(w) = app.get_webview_window(BOX_LABEL) { hide_box_soft(&app, &w); }
}

/// The pin of the box: pinned, it stays when it loses focus.
#[tauri::command]
pub fn chatbox_pin(on: bool) { BOX_PINNED.store(on, Ordering::SeqCst); BOX_IDLE_SINCE.store(0, Ordering::SeqCst); }

/// Who is out now, for the dots of the box.
#[tauri::command]
pub fn duo_presence(app: AppHandle) -> serde_json::Value {
    let Some(d) = app.try_state::<Duo>() else { return serde_json::json!({ "peak": true, "paws": false }) };
    let s = d.state.lock().unwrap();
    serde_json::json!({ "peak": s.pets.peak.out, "paws": s.pets.paws.out })
}
