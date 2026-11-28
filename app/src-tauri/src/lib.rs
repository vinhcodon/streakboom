mod brain;
mod claude;
mod fastpass;
mod ground;
mod platform;
mod spike; // the duo render spike (exp/duo-prototype only)
mod duo;
mod duo_keys; // the duo prototype, behind STREAKBOOM_DUO=1 (exp/duo-prototype only)
mod openai;
mod picture;
mod layout;
mod updater;

use brain::{AiError, Kind, Turn};
use layout::Area;
use platform::{busy_now, hide_window, last_input_idle_ms, pointer_pos, primary_button_raw, precise_sleep, show_without_activating, timer_period, window_rect_of};
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    sync::{
        Mutex,
        atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering},
    },
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, State, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder, WindowEvent,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

// Pet window layout (logical px): a small window holding only the pet plus a thin margin.
// Speech bubbles live in their own window (see `place_bubble`) and settings in another.
// Must match the frontend (src/routes/+page.svelte).
const WIN_W: f64 = 140.0;
const WIN_H: f64 = 140.0;
const PET_LEFT: f64 = 10.0;
const PET_TOP: f64 = 10.0;
const PET_SIZE: f64 = 120.0;

const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu";

#[derive(Serialize, Deserialize, Clone, Default)]
struct Prefs {
    x: Option<i32>,
    y: Option<i32>,
    quiet: bool,
    /// Model the user picked on purpose. None = automatic (fast model, with failover).
    #[serde(default)]
    model: Option<String>,
    /// Which provider answers ("gemini" or "claude"; none = gemini) and the model chosen for Claude.
    #[serde(default)]
    provider: Option<String>,
    #[serde(default)]
    claude_model: Option<String>,
    #[serde(default)]
    openai_model: Option<String>,
    /// Retired with Groq (ADR-0150): still read so an old file loads, never used.
    #[serde(default)]
    #[allow(dead_code)]
    groq_model: Option<String>,
}

#[derive(Clone, Copy)]
struct Rect {
    x: f64,
    y: f64,
    w: f64,
    h: f64,
}

/// Where the window and the cursor were when a drag started (physical px).
#[derive(Clone, Copy, Default)]
struct DragStart {
    win_x: i32,
    win_y: i32,
    cur_x: f64,
    cur_y: f64,
}

/// What the bubble window currently shows (logical px size) and whether it is visible.
#[derive(Clone, Copy, Default)]
struct BubbleState {
    w: f64,
    h: f64,
    visible: bool,
}

struct AppState {
    prefs: Mutex<Prefs>,
    path: PathBuf,
    pet_path: PathBuf,
    memory_path: PathBuf,
    /// Model of the active provider (None = automatic).
    model: Mutex<Option<String>>,
    provider: Mutex<brain::Provider>,
    hit: Mutex<Rect>,
    dirty: AtomicBool,
    last_self_move_ms: AtomicU64,
    dragging: AtomicBool,
    drag: Mutex<DragStart>,
    bubble: Mutex<BubbleState>,
    quiet_item: Mutex<Option<CheckMenuItem<tauri::Wry>>>,
    /// The other tray items, so that their text can follow the language (`set_tray_labels`).
    tray_items: Mutex<Option<[MenuItem<tauri::Wry>; 3]>>,
    /// Which part of the settings window to scroll to when it opens ("brain"). A window URL
    /// with a query string is not reliable across dev and release, so the page asks for it.
    settings_section: Mutex<Option<String>>,
    /// Bumped whenever the bubble is shown or hidden; lets the delayed "destroy when idle"
    /// know whether the bubble was used again in the meantime.
    bubble_gen: AtomicU64,
    /// The window the bubble stands next to: "main" (Peak), or "paws" while Paws answers (duo prototype, ADR-0140).
    bubble_anchor: Mutex<String>,
    /// "Lượn đi" (spec 14, story S2): Peak has walked off and its window is hidden until a timer runs out or the person calls it
    /// back (the tray, or starting the program again). Never saved: after a restart Peak is simply on screen. `away_gen`
    /// numbers each leaving, so that a timer of an earlier leaving does nothing.
    away: AtomicBool,
    away_gen: AtomicU64,
    /// The screen picture experiment (ADR-0119): turned on by the person from the tray of a Preview build, off at every start. The
    /// command `screen_grid` gives nothing while it is off.
    picture_on: AtomicBool,
    /** The person's own switch in Settings (PS-8): the picture may be taken, in any build. Off at every start until the page says so. */
    picture_user: AtomicBool,
    /** How many times in a row Windows refused to take Peak's windows out of the capture (a window just created, or before 10 version 2004): the picture would show Peak itself, so none is given, and a new try waits longer each time (PS-10). */
    picture_refused: AtomicU32,
    /** When (ms since the epoch) the next try may be made after a refusal. */
    picture_retry_at: AtomicU64,
    /// Latest focus-safety readings (spec/06 section 3.2, ADR-0029), written by the hit-test thread (which
    /// already wakes every 30 to 150 ms and already reads the pointer) and read by `focus_probe`.
    /// `u32::MAX` = the idle time is unknown; the offsets are `f64` bits.
    focus_idle_ms: AtomicU32,
    focus_dx: AtomicU64,
    focus_dy: AtomicU64,
    /// The pointer reading is valid (the pet window is visible and the pointer was read).
    focus_ptr: AtomicBool,
    /// Fullscreen, presentation mode or a locked session (`busy_now`), read by the hit-test thread about once a second so
    /// that `focus_probe` still makes no system call; the page keeps the cat still and quiet while it holds (spec 14, AP-08).
    focus_busy: AtomicBool,
    /// The pointer is on the cat (inside its hit region).
    focus_over: AtomicBool,
    /// The cat's centre in logical px of the screen (physical px divided by the window's scale): the common frame of
    /// `src/lib/lane.ts`, so the typing lane stays where it is while the cat walks. `f64` bits.
    focus_cat_x: AtomicU64,
    focus_cat_y: AtomicU64,
    /// The primary mouse button is down now (a button, never a key: T8, ADR-0031).
    button_down: AtomicBool,
    /// The last click made away from the cat: when (ms since the epoch, 0 = none) and where (logical px, `f64` bits).
    /// Kept in memory only; it tells the typing lane where the caret was probably put.
    click_at: AtomicU64,
    click_x: AtomicU64,
    click_y: AtomicU64,
    /// Asks a flight in progress (`fly_path`) to stop (the cat was picked up, or something else took over).
    fly_cancel: AtomicBool,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn write_prefs(state: &AppState) {
    if let Ok(s) = serde_json::to_string_pretty(&*state.prefs.lock().unwrap()) {
        let _ = fs::write(&state.path, s);
    }
    state.dirty.store(false, Ordering::Relaxed);
}

// ---------------------------------------------------------------- commands

#[tauri::command]
fn set_hit_rect(state: State<AppState>, x: f64, y: f64, w: f64, h: f64) {
    *state.hit.lock().unwrap() = Rect { x, y, w, h };
}

#[tauri::command]
fn get_prefs(state: State<AppState>) -> Prefs {
    state.prefs.lock().unwrap().clone()
}

/// The pet's own state (mood, closeness, settings...) is an opaque JSON string owned by the
/// frontend; Rust only stores it, writing to a temp file first so a crash cannot corrupt it.
#[tauri::command]
fn load_pet(state: State<AppState>) -> Option<String> {
    fs::read_to_string(&state.pet_path).ok()
}

#[tauri::command]
fn save_pet(state: State<AppState>, json: String) -> Result<(), String> {
    let tmp = state.pet_path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &state.pet_path).map_err(|e| e.to_string())
}

/// Whether the pet starts when the user logs in to Windows.
#[tauri::command]
fn autostart_get(app: AppHandle) -> bool {
    use tauri_plugin_autostart::ManagerExt;
    app.autolaunch().is_enabled().unwrap_or(false)
}

#[tauri::command]
fn autostart_set(app: AppHandle, on: bool) -> Result<bool, String> {
    use tauri_plugin_autostart::ManagerExt;
    let launch = app.autolaunch();
    if on { launch.enable() } else { launch.disable() }.map_err(|e| e.to_string())?;
    Ok(launch.is_enabled().unwrap_or(false))
}

/// What the pet remembers about the user: its own file, also an opaque JSON string owned by the
/// frontend, so the user (or "Forget everything") can remove it without touching the pet's state.
#[tauri::command]
fn load_memory(state: State<AppState>) -> Option<String> {
    fs::read_to_string(&state.memory_path).ok()
}

#[tauri::command]
fn save_memory(state: State<AppState>, json: String) -> Result<(), String> {
    let tmp = state.memory_path.with_extension("json.tmp");
    fs::write(&tmp, json).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &state.memory_path).map_err(|e| e.to_string())
}

/// True when the user should not be interrupted: a fullscreen app/game, presentation mode,
/// or a locked/absent session (Windows only; false elsewhere).
#[tauri::command]
fn is_busy() -> bool {
    busy_now()
}

// ------------------------------------------------------------ focus-safety probe

/// What the focus-safety logic needs (`src/lib/focus.ts`): how long ago the user last did anything, and where
/// the pointer is relative to the cat. One number and one position; no key identity, no hook, nothing stored.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FocusProbe {
    /// Milliseconds since the last keyboard or mouse input; None where it cannot be read (not Windows).
    idle_ms: Option<u32>,
    /// Pointer offset from the cat's centre in logical px (right and down are positive); None when unknown.
    dx: Option<f64>,
    dy: Option<f64>,
    /// The pointer is on the cat itself.
    over: bool,
    /// The cat's centre in logical px of the screen; None when unknown.
    cat_x: Option<f64>,
    cat_y: Option<f64>,
    /// The primary mouse button is down now.
    button_down: bool,
    /// The last click away from the cat, if any.
    click: Option<ClickInfo>,
    /// The person is in something full-screen, presenting, or the session is locked (read about once a second).
    busy: bool,
}

/// Where and how long ago the user last clicked away from the cat (logical px of the screen).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ClickInfo {
    x: f64,
    y: f64,
    age_ms: u64,
}

/// The latest readings of the hit-test thread (no system call here: a few atomic loads).
#[tauri::command]
fn focus_probe(state: State<AppState>) -> FocusProbe {
    let idle = state.focus_idle_ms.load(Ordering::Relaxed);
    let ptr = state.focus_ptr.load(Ordering::Relaxed);
    FocusProbe {
        idle_ms: if idle == u32::MAX { None } else { Some(idle) },
        dx: ptr.then(|| f64::from_bits(state.focus_dx.load(Ordering::Relaxed))),
        dy: ptr.then(|| f64::from_bits(state.focus_dy.load(Ordering::Relaxed))),
        over: ptr && state.focus_over.load(Ordering::Relaxed),
        cat_x: ptr.then(|| f64::from_bits(state.focus_cat_x.load(Ordering::Relaxed))),
        cat_y: ptr.then(|| f64::from_bits(state.focus_cat_y.load(Ordering::Relaxed))),
        button_down: state.button_down.load(Ordering::Relaxed),
        busy: state.focus_busy.load(Ordering::Relaxed),
        click: {
            let at = state.click_at.load(Ordering::Relaxed);
            (at != 0).then(|| ClickInfo {
                x: f64::from_bits(state.click_x.load(Ordering::Relaxed)),
                y: f64::from_bits(state.click_y.load(Ordering::Relaxed)),
                age_ms: layout::age_ms(now_ms(), at),
            })
        },
    }
}

// ------------------------------------------------------------ geometry helpers

/// The pet's offset and size inside its window, in physical px for a given scale factor.
fn pet_px(scale: f64) -> (i32, i32, i32) {
    (
        (PET_LEFT * scale).round() as i32,
        (PET_TOP * scale).round() as i32,
        (PET_SIZE * scale).round() as i32,
    )
}

/// Every monitor with its full rectangle, work area and scale factor (physical px), as the pure layout code wants them.
fn mons_of(win: &WebviewWindow) -> Vec<layout::Mon> {
    let area = |p: tauri::PhysicalPosition<i32>, w: u32, h: u32| Area { x: p.x, y: p.y, r: p.x + w as i32, b: p.y + h as i32 };
    win.available_monitors()
        .unwrap_or_default()
        .iter()
        .map(|m| layout::Mon {
            full: area(*m.position(), m.size().width, m.size().height),
            work: area(m.work_area().position, m.work_area().size.width, m.work_area().size.height),
            scale: m.scale_factor(),
        })
        .collect()
}

/// Work area of the monitor containing the physical point, or of the nearest monitor.
fn area_at(win: &WebviewWindow, px: f64, py: f64) -> Option<Area> {
    layout::nearest_mon(&mons_of(win), px, py).map(|m| m.work)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MonitorInfo {
    /// work area (physical px): left, top, width, height
    x: i32,
    y: i32,
    w: i32,
    h: i32,
    scale: f64,
}

/// The monitors' work areas (the screen minus the taskbar) and scales, in physical px, so the page can reason
/// about the whole world (the walk across touching monitors, places that are kept as a monitor and a fraction).
#[tauri::command]
fn monitors_info(window: WebviewWindow) -> Vec<MonitorInfo> {
    mons_of(&window)
        .iter()
        .map(|m| MonitorInfo { x: m.work.x, y: m.work.y, w: m.work.r - m.work.x, h: m.work.b - m.work.y, scale: m.scale })
        .collect()
}

#[derive(Serialize)]
struct Place {
    x: i32,
    y: i32,
    scale: f64,
}

/// Where the pet window is (its top-left, physical px) and its scale, so the page can plan a hop or a fall as
/// positions relative to here and ask for each one with `move_to`.
#[tauri::command]
fn pet_place(window: WebviewWindow) -> Result<Place, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    Ok(Place { x: pos.x, y: pos.y, scale })
}

/// A hop or a fall, played entirely here (TE-15): the page sends the whole path at once (offsets from where the window
/// is now, physical px, one per `frame_ms`) and this thread moves the window along it. Doing it from the page cost an
/// IPC round trip per frame (60 a second), about 0.4 core-seconds a hop. Each position is held inside the work area of
/// the monitor under the cat. Returns false when the flight was cancelled. The system timer is set to 1 ms for the
/// flight so the frames are even (the default step is about 15 ms).
#[tauri::command]
async fn fly_path(app: AppHandle, window: WebviewWindow, points: Vec<(i32, i32)>, frame_ms: u64) -> Result<bool, String> {
    let start = window.outer_position().map_err(|e| e.to_string())?;
    let mons = mons_of(&window);
    tauri::async_runtime::spawn_blocking(move || -> Result<bool, String> {
        let state = app.state::<AppState>();
        state.fly_cancel.store(false, Ordering::Relaxed);
        timer_period(true);
        let t0 = Instant::now();
        let mut finished = true;
        for (i, (dx, dy)) in points.iter().enumerate() {
            let due = t0 + Duration::from_millis(i as u64 * frame_ms);
            let now = Instant::now();
            if due > now {
                std::thread::sleep(due - now);
            }
            if state.fly_cancel.load(Ordering::Relaxed) {
                finished = false;
                break;
            }
            let Some((x, y, _)) = layout::clamp_to_world(&mons, start.x + dx, start.y + dy, pet_px) else {
                break;
            };
            state.last_self_move_ms.store(now_ms(), Ordering::Relaxed);
            if window.set_position(PhysicalPosition::new(x, y)).is_err() {
                break;
            }
        }
        timer_period(false);
        Ok(finished)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Stop a flight in progress.
#[tauri::command]
fn fly_cancel(state: State<AppState>) {
    state.fly_cancel.store(true, Ordering::Relaxed);
}

#[derive(Serialize)]
struct Moved {
    x: i32,
    y: i32,
    /// true when the wanted position had to be pulled back inside the world
    clamped: bool,
}

/// Put the pet window's top-left at `(x, y)` (physical px), held so the whole cat stays inside the work area of
/// the monitor under it, on whichever monitor that is. Replaces nothing yet: `move_by` is still the horizontal walk.
#[tauri::command]
fn move_to(window: WebviewWindow, state: State<AppState>, x: i32, y: i32) -> Result<Moved, String> {
    let (nx, ny, clamped) = layout::clamp_to_world(&mons_of(&window), x, y, pet_px).ok_or("no monitor")?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    if nx != pos.x || ny != pos.y {
        state.last_self_move_ms.store(now_ms(), Ordering::Relaxed);
        window
            .set_position(PhysicalPosition::new(nx, ny))
            .map_err(|e| e.to_string())?;
    }
    Ok(Moved { x: nx, y: ny, clamped })
}

/// Move the window horizontally by `dx` physical pixels, keeping the whole pet inside the
/// work area of the monitor it is on (and pulling it back in vertically if it is outside).
/// Returns true when the edge was hit.
#[tauri::command]
fn move_by(window: WebviewWindow, state: State<AppState>, dx: i32) -> Result<bool, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let area = area_at(&window, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64).ok_or("no monitor")?;
    let wanted = pos.x + dx;
    let (nx, ny) = layout::clamp_window(area, wanted, pos.y, l, t, s);
    if nx != pos.x || ny != pos.y {
        state.last_self_move_ms.store(now_ms(), Ordering::Relaxed);
        window
            .set_position(PhysicalPosition::new(nx, ny))
            .map_err(|e| e.to_string())?;
    }
    Ok(nx != wanted)
}

/// How far the cat can walk in direction `dir` (+1 right, -1 left) before the edge of the work area of the monitor
/// it is on, in logical px (0 against the edge). Lets the page decide whether walking away is possible before it
/// turns the cat round.
#[tauri::command]
fn edge_room(window: WebviewWindow, dir: i32) -> Result<i32, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let area = area_at(&window, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64).ok_or("no monitor")?;
    Ok(layout::room_to_edge(area, pos.x, l, s, dir, scale))
}

/// What is under the points the page gives (physical px of the screen): the kind of thing at each, nothing else (see
/// `ground.rs`). Only asked for when a decision needs it; about 4 ms for 144 points.
#[tauri::command]
fn ground_at(points: Vec<(i32, i32)>) -> Vec<ground::Ground> {
    points.into_iter().take(256).map(|(x, y)| ground::ground_of_point(x, y)).collect()
}

#[derive(Serialize)]
struct GroundUnder {
    /// What the cat stands over, from the points just below its feet.
    under: ground::Ground,
    /// The kind at each of those points, left to right.
    points: Vec<ground::Ground>,
    /// An opaque number for the window under the cat's middle foot (0: none), to tell later whether it is the same one.
    id: u64,
    /// The point it was asked at (physical px), to ask the same place again.
    foot: (i32, i32),
}

/// Which of these points (physical px) are covered by a window that Peak cannot be raised over (the Start menu, Search)? The
/// window's rectangle is useless (the Start menu's is the whole screen), only a touch at a point tells where its flyout is, so
/// the page tries places for the cat and asks about their points. With `raise`, Peak first puts itself back on top (a window of
/// its own layer may simply have come later) and the answer is taken after that. Only "covered or not" comes back.
/// Is anything covering the cat that it cannot be raised over (the Start menu, Search)? Asked about five points of its body, by the
/// hit-test thread about once a second (it already wakes often): no call from the page, which is told only when the answer
/// changes. A first version asked from the page once a second and then three times a second; the CPU check of 0.3.2 showed
/// about 1 per cent of a core more than 0.3.1 standing still. With `raise`, Peak first puts itself back on top (a window of its own
/// layer may simply have come later), and the answer is taken after that.
fn cat_covered_at(x: i32, y: i32, scale: f64, own: isize, raise: bool) -> bool {
    let (l, t, s) = pet_px(scale);
    let at = |fx: f64, fy: f64| (x + l + (s as f64 * fx) as i32, y + t + (s as f64 * fy) as i32);
    let pts = [at(0.5, 0.5), at(0.25, 0.3), at(0.75, 0.3), at(0.25, 0.8), at(0.75, 0.8)];
    let any = || pts.iter().any(|(px, py)| ground::cover_at(own, *px, *py));
    let mut covered = any();
    if covered && raise {
        ground::raise_own(own);
        covered = any();
    }
    covered
}

#[tauri::command]
fn cover_probe(window: WebviewWindow, points: Vec<(i32, i32)>, raise: bool) -> Result<Vec<bool>, String> {
    let own = window.hwnd().map_err(|e| e.to_string())?.0 as isize;
    let ask = |pts: &[(i32, i32)]| pts.iter().map(|(x, y)| ground::cover_at(own, *x, *y)).collect::<Vec<bool>>();
    let mut out = ask(&points);
    if raise && out.iter().any(|c| *c) {
        ground::raise_own(own);
        out = ask(&points);
    }
    Ok(out)
}

/// What the cat stands over now: the kind of thing just below its left foot, its middle and its right foot.
#[tauri::command]
fn ground_under_cat(window: WebviewWindow) -> Result<GroundUnder, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let points: Vec<ground::Ground> = ground::feet_points(pos.x, pos.y, l, t, s).into_iter().map(|(x, y)| ground::ground_of_point(x, y)).collect();
    let feet = ground::feet_points(pos.x, pos.y, l, t, s);
    let id = ground::window_id_at(feet[1].0, feet[1].1);
    Ok(GroundUnder { under: ground::standing_on(&points), points, id, foot: feet[1] })
}

/// What Peak is told when a brain is connected, layer by layer, for a language, a closeness tier and a tone: the page
/// "What Peak is told" in Settings shows it (RX-6). Read-only; the text is compiled into the app.
#[tauri::command]
fn persona_preview(lang: String, tier: u8, gentle: bool) -> Vec<brain::PersonaLayer> {
    brain::persona_layers(&lang, tier, gentle)
}

#[derive(Serialize)]
struct GroundMap {
    /// the monitor's work area (physical px)
    x: i32,
    y: i32,
    w: i32,
    h: i32,
    cols: usize,
    rows: usize,
    /// the kind at the centre of each cell, row by row from the top left
    cells: Vec<ground::Ground>,
    /// an opaque number for the window at each cell (0: none, the desktop or the taskbar): cells with the same number
    /// belong to the same window, so a boundary between two numbers is an edge (spec/10)
    ids: Vec<u64>,
}

/// A coarse picture of what is where on the monitor the cat is on (PC-6, ADR-0043): the kind (desktop, taskbar, window,
/// window in front) at the centre of each cell of a `cols` x `rows` grid, at most 16 x 9. It reveals where the user's
/// windows are, so the page asks for it only when the user allowed it and the cat is about to move, keeps it in memory
/// and never writes or sends it. No title, process or window list.
#[tauri::command]
fn ground_map(window: WebviewWindow, cols: Option<usize>, rows: Option<usize>) -> Result<GroundMap, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let a = area_at(&window, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64).ok_or("no monitor")?;
    let cols = cols.unwrap_or(16).clamp(1, 16);
    let rows = rows.unwrap_or(9).clamp(1, 9);
    let (w, h) = (a.r - a.x, a.b - a.y);
    let mut cells = Vec::with_capacity(cols * rows);
    let mut ids = Vec::with_capacity(cols * rows);
    for r in 0..rows {
        for c in 0..cols {
            let px = a.x + ((c as f64 + 0.5) * w as f64 / cols as f64) as i32;
            let py = a.y + ((r as f64 + 0.5) * h as f64 / rows as f64) as i32;
            let (g, id) = ground::cell_at(px, py);
            cells.push(g);
            ids.push(id);
        }
    }
    Ok(GroundMap { x: a.x, y: a.y, w, h, cols, rows, cells, ids })
}

/// Is the window with that opaque number still there and still under that point (closed, minimized or dragged away: no).
#[tauri::command]
fn window_holds(id: u64, x: i32, y: i32) -> bool {
    ground::window_holds(id, x, y)
}

#[derive(Serialize)]
struct VerticalRoom {
    up: i32,
    down: i32,
}

/// How far the cat can move up and down before the edges of the work area of its monitor, in logical px: the room a
/// hop out of the typing lane has.
#[tauri::command]
fn vertical_room(window: WebviewWindow) -> Result<VerticalRoom, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let area = area_at(&window, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64).ok_or("no monitor")?;
    let (up, down) = layout::room_vertical(area, pos.y, t, s, scale);
    Ok(VerticalRoom { up, down })
}

// ------------------------------------------------------------------- dragging

/// Start dragging the pet. We do the drag ourselves (instead of the OS drag) so the pet can be
/// clamped to the screen live: the OS lets a borderless window leave the screen.
#[tauri::command]
fn drag_start(window: WebviewWindow, state: State<AppState>) -> Result<(), String> {
    let cur = window.cursor_position().map_err(|e| e.to_string())?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    *state.drag.lock().unwrap() = DragStart { win_x: pos.x, win_y: pos.y, cur_x: cur.x, cur_y: cur.y };
    state.dragging.store(true, Ordering::Relaxed);
    state.fly_cancel.store(true, Ordering::Relaxed); // picked up in mid-air: the flight ends
    let _ = window.set_ignore_cursor_events(false);
    Ok(())
}

/// Follow the cursor, clamped so the pet never leaves the work area of the monitor under it.
#[tauri::command]
fn drag_move(window: WebviewWindow, state: State<AppState>) -> Result<(), String> {
    if !state.dragging.load(Ordering::Relaxed) {
        return Ok(());
    }
    let d = *state.drag.lock().unwrap();
    let cur = window.cursor_position().map_err(|e| e.to_string())?;
    let scale = window.scale_factor().map_err(|e| e.to_string())?;
    let (l, t, s) = pet_px(scale);
    let wanted_x = d.win_x + (cur.x - d.cur_x).round() as i32;
    let wanted_y = d.win_y + (cur.y - d.cur_y).round() as i32;
    let area = area_at(&window, cur.x, cur.y).ok_or("no monitor")?;
    let (nx, ny) = layout::clamp_window(area, wanted_x, wanted_y, l, t, s);
    state.last_self_move_ms.store(now_ms(), Ordering::Relaxed);
    window
        .set_position(PhysicalPosition::new(nx, ny))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn drag_end(state: State<AppState>) {
    state.dragging.store(false, Ordering::Relaxed);
    state.dirty.store(true, Ordering::Relaxed);
}

// --------------------------------------------------------------------- bubble

/// How long a hidden bubble window is kept before it is destroyed to free its memory.
const BUBBLE_IDLE_DESTROY: Duration = Duration::from_secs(45);
/// How often the hit-test thread asks the system whether the person is busy (fullscreen, presenting, locked): about once a second.
const BUSY_READ_EVERY: Duration = Duration::from_millis(1000);
/// How often the return timer of "Lượn đi" looks at the clock while Peak is away.
const AWAY_SLICE: Duration = Duration::from_secs(20);

/// A transparent topmost window of its own, so the bubble is never clipped by the small pet
/// window and can sit on whichever side of the pet has room.
fn create_bubble(app: &AppHandle) -> tauri::Result<()> {
    if app.get_webview_window("bubble").is_some() {
        return Ok(());
    }
    WebviewWindowBuilder::new(app, "bubble", WebviewUrl::App("bubble".into()))
        .title("Streakboom bubble")
        .inner_size(240.0, 80.0)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .shadow(false)
        .visible(false)
        .focusable(false)
        .focused(false) // a window made while the person is typing elsewhere must not take the keyboard when it is first shown (issue 5: seen after the bubble was destroyed and made again)
        .additional_browser_args(BROWSER_ARGS)
        .build()?;
    Ok(())
}

/// Make sure the bubble window exists. It loads asynchronously, then announces itself with
/// `bubble-ready` and the pet re-sends what to show. (Async so window creation never runs on
/// the thread that handles a synchronous command, which can deadlock on Windows.)
#[tauri::command]
async fn bubble_ensure(app: AppHandle) {
    let _ = create_bubble(&app);
}

#[derive(Clone, Serialize)]
struct BubblePlace {
    side: layout::Side,
    tail: f64,
}

/// Put the bubble window next to the pet: above if it fits, else below, right or left, always
/// inside the work area. Called whenever the bubble resizes or the pet moves.
pub(crate) fn place_bubble(app: &AppHandle) {
    let state = app.state::<AppState>();
    let b = *state.bubble.lock().unwrap();
    if !b.visible {
        return;
    }
    let anchor = state.bubble_anchor.lock().unwrap().clone();
    let (Some(main), Some(bubble)) = (app.get_webview_window(&anchor).or_else(|| app.get_webview_window("main")), app.get_webview_window("bubble")) else {
        return;
    };
    let (Ok(pos), Ok(scale)) = (main.outer_position(), main.scale_factor()) else {
        return;
    };
    let (l, t, s) = pet_px(scale);
    let (px, py) = (pos.x + l, pos.y + t);
    let Some(area) = area_at(&main, (px + s / 2) as f64, (py + s / 2) as f64) else {
        return;
    };
    let (w, h) = ((b.w * scale).round() as i32, (b.h * scale).round() as i32);
    let p = layout::place_bubble(area, px, py, s, w, h, (2.0 * scale).round() as i32);
    let _ = bubble.set_position(PhysicalPosition::new(p.x, p.y));
    let _ = app.emit_to("bubble", "bubble-place", BubblePlace { side: p.side, tail: p.tail as f64 / scale });
}

/// The bubble page measured its content: size the window to it, show it and place it.
/// `interactive` bubbles take clicks and keys; plain speech is click-through and never takes
/// focus from the app the user is typing in.
#[tauri::command]
fn bubble_fit(app: AppHandle, state: State<AppState>, w: f64, h: f64, interactive: bool, focus: bool) {
    let Some(bubble) = app.get_webview_window("bubble") else {
        return;
    };
    // The bubble belongs to the pet: while the pet is hidden (tray Show / Hide) nothing is shown.
    let anchor = state.bubble_anchor.lock().unwrap().clone();
    if !app.get_webview_window(&anchor).or_else(|| app.get_webview_window("main")).is_some_and(|m| m.is_visible().unwrap_or(false)) {
        bubble_hide(app.clone(), state);
        return;
    }
    let was_visible = {
        let mut b = state.bubble.lock().unwrap();
        let v = b.visible;
        *b = BubbleState { w: w.ceil(), h: h.ceil(), visible: true };
        v
    };
    state.bubble_gen.fetch_add(1, Ordering::Relaxed); // in use: cancels a pending destroy
    let _ = bubble.set_focusable(interactive);
    let _ = bubble.set_ignore_cursor_events(!interactive);
    let _ = bubble.set_size(LogicalSize::new(w.ceil(), h.ceil()));
    place_bubble(&app);
    if !was_visible {
        // Plain speech is shown without taking the keyboard. Found with the chat box (ADR-0142): a pet's line took the focus from the box the person
        // was typing in (the program was already in front, so Windows let the bubble be activated). Only a bubble that is asked to take focus does.
        if interactive { let _ = bubble.show(); } else { show_without_activating(&bubble); }
    }
    if focus && interactive {
        let _ = bubble.set_focus();
    }
}

#[tauri::command]
fn bubble_hide(app: AppHandle, state: State<AppState>) {
    state.bubble.lock().unwrap().visible = false;
    if let Some(bubble) = app.get_webview_window("bubble") {
        hide_window(&bubble);
    }
    // Destroy the window if it stays unused, to give its memory back.
    let gen_now = state.bubble_gen.fetch_add(1, Ordering::Relaxed) + 1;
    let app2 = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(BUBBLE_IDLE_DESTROY);
        let state = app2.state::<AppState>();
        if state.bubble_gen.load(Ordering::Relaxed) == gen_now && !state.bubble.lock().unwrap().visible {
            if let Some(w) = app2.get_webview_window("bubble") {
                let _ = w.destroy();
            }
        }
    });
}

// ------------------------------------------------------------ settings and menus

/// Open (or bring to front) the settings window. `section` scrolls to a part of it ("brain").
pub(crate) fn open_settings_window(app: &AppHandle, section: Option<&str>) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
        if let Some(s) = section {
            let _ = app.emit_to("settings", "settings-goto", s.to_string());
        }
        return;
    }
    *app.state::<AppState>().settings_section.lock().unwrap() = section.map(str::to_string);
    let _ = WebviewWindowBuilder::new(app, "settings", WebviewUrl::App("settings".into()))
        .title("Streakboom")
        .inner_size(680.0, 600.0)
        .min_inner_size(580.0, 420.0)
        .center()
        .resizable(true)
        .additional_browser_args(BROWSER_ARGS)
        .build();
}

/// The settings page asks once on load which section it was opened for.
#[tauri::command]
fn take_settings_section(state: State<AppState>) -> Option<String> {
    state.settings_section.lock().unwrap().take()
}

#[tauri::command]
async fn open_settings(app: AppHandle, section: Option<String>) {
    open_settings_window(&app, section.as_deref());
}

/// Menu handlers run on the main thread, where creating a window can deadlock on Windows:
/// hand the work to the async runtime instead.
fn open_settings_async(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move { open_settings_window(&app, None) });
}

/// The text of the tray menu in the app's language (the page sends it at start and whenever the language changes):
/// [Show / Hide, Settings, Quiet mode, Quit]. An empty or missing entry keeps the English default.
#[tauri::command]
fn set_tray_labels(state: State<AppState>, labels: Vec<String>) {
    let pick = |i: usize| labels.get(i).map(|s| s.trim()).filter(|s| !s.is_empty()).map(str::to_string);
    if let Some([toggle, settings, quit]) = state.tray_items.lock().unwrap().as_ref() {
        if let Some(t) = pick(0) {
            let _ = toggle.set_text(t);
        }
        if let Some(t) = pick(1) {
            let _ = settings.set_text(t);
        }
        if let Some(t) = pick(3) {
            let _ = quit.set_text(t);
        }
    }
    if let Some(t) = pick(2) {
        if let Some(item) = state.quiet_item.lock().unwrap().as_ref() {
            let _ = item.set_text(t);
        }
    }
}

/// Switch quiet mode (tray menu): persist, tell the frontend, sync the tray check mark.
fn set_quiet(app: &AppHandle, q: bool) {
    let state = app.state::<AppState>();
    state.prefs.lock().unwrap().quiet = q;
    state.dirty.store(true, Ordering::Relaxed);
    if let Some(item) = state.quiet_item.lock().unwrap().as_ref() {
        let _ = item.set_checked(q);
    }
    let _ = app.emit("quiet-changed", q);
}

fn quit_app(app: &AppHandle) {
    write_prefs(&app.state::<AppState>());
    app.exit(0);
}

// ------------------------------------------------------------------- brain

/// The provider that answers now.
fn active(state: &AppState) -> brain::Provider {
    *state.provider.lock().unwrap()
}

fn prefs_model(prefs: &Prefs, p: brain::Provider) -> Option<String> {
    match p {
        brain::Provider::Gemini => prefs.model.clone(),
        brain::Provider::Claude => prefs.claude_model.clone(),
        brain::Provider::OpenAI => prefs.openai_model.clone(),
    }
}

fn set_prefs_model(prefs: &mut Prefs, p: brain::Provider, model: Option<String>) {
    match p {
        brain::Provider::Gemini => prefs.model = model,
        brain::Provider::Claude => prefs.claude_model = model,
        brain::Provider::OpenAI => prefs.openai_model = model,
    }
}

fn current_model(state: &AppState) -> String {
    let p = active(state);
    state
        .model
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(|| p.default_model().to_string())
}

/// One request to the active provider, with failover to another model when the model is unknown,
/// overloaded or timing out. A bad key or a rate limit is never failed over.
fn run_generate(state: &AppState, key: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let p = active(state);
    let model = current_model(state);
    match brain::generate_for(p, key, &model, system, turns) {
        // The model name may not exist for this key: ask the API what it offers.
        Err(e) if e.kind == Kind::Model => {
            let m = brain::models_for(p, key)?.into_iter().find(|n| *n != model).ok_or(e)?;
            *state.model.lock().unwrap() = Some(m.clone());
            brain::generate_for(p, key, &m, system, turns)
        }
        // This model is overloaded or timing out (503 / no answer): switch to another one
        // instead of hammering the same model.
        Err(e) if matches!(e.kind, Kind::Server | Kind::Network) => {
            let m = brain::models_for(p, key)
                .map_err(|_| e.clone())?
                .into_iter()
                .find(|n| *n != model)
                .ok_or_else(|| e.clone())?;
            let out = brain::generate_for(p, key, &m, system, turns);
            if out.is_ok() {
                *state.model.lock().unwrap() = Some(m);
            }
            out
        }
        other => other,
    }
}

fn task_failed() -> AiError {
    AiError::new(Kind::Unknown, "task failed")
}

/// Which providers have a key, and which one answers now.
#[derive(Serialize)]
struct ProviderInfo {
    active: String,
    gemini: bool,
    claude: bool,
    openai: bool,
}

fn provider_info(state: &AppState) -> ProviderInfo {
    ProviderInfo {
        active: active(state).id().to_string(),
        gemini: brain::load_key(brain::Provider::Gemini).is_some(),
        claude: brain::load_key(brain::Provider::Claude).is_some(),
        openai: brain::load_key(brain::Provider::OpenAI).is_some(),
    }
}

fn provider_or_active(state: &AppState, provider: Option<String>) -> Result<brain::Provider, AiError> {
    match provider.filter(|p| !p.is_empty()) {
        Some(p) => brain::Provider::parse(&p).ok_or_else(|| AiError::new(Kind::Unknown, "unknown provider")),
        None => Ok(active(state)),
    }
}

/// Make `p` the active provider: its own chosen model (or automatic) is loaded.
fn switch_provider(state: &AppState, p: brain::Provider) {
    *state.provider.lock().unwrap() = p;
    let model = prefs_model(&state.prefs.lock().unwrap(), p).filter(|m| brain::model_ok(m));
    *state.model.lock().unwrap() = model;
    state.prefs.lock().unwrap().provider = Some(p.id().to_string());
    state.dirty.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn brain_provider(app: AppHandle) -> ProviderInfo {
    tauri::async_runtime::spawn_blocking(move || provider_info(&app.state::<AppState>()))
        .await
        .unwrap_or(ProviderInfo { active: "gemini".into(), gemini: false, claude: false, openai: false })
}

/// Choose which provider answers. Its key must already be stored.
#[tauri::command]
async fn brain_set_provider(app: AppHandle, provider: String) -> Result<ProviderInfo, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let p = brain::Provider::parse(&provider).ok_or_else(|| AiError::new(Kind::Unknown, "unknown provider"))?;
        if brain::load_key(p).is_none() {
            return Err(AiError::new(Kind::InvalidKey, "no key"));
        }
        switch_provider(&state, p);
        Ok(provider_info(&state))
    })
    .await
    .map_err(|_| task_failed())?
}

/// True when the active provider has a key stored in the OS credential store.
#[tauri::command]
async fn brain_status(app: AppHandle) -> bool {
    tauri::async_runtime::spawn_blocking(move || brain::load_key(active(&app.state::<AppState>())).is_some())
        .await
        .unwrap_or(false)
}

#[derive(Serialize)]
struct ConnectOut {
    reply: String,
    model: String,
    provider: String,
}

/// Validate a pasted key with one tiny request; store it only if the provider accepts it, and
/// make that provider the active one. `model` is the user's explicit choice (None = automatic).
/// Returns the pet's first AI-written line and the model that actually answered.
#[tauri::command]
async fn brain_connect(
    app: AppHandle,
    provider: Option<String>,
    key: String,
    lang: String,
    tier: u8,
    gentle: bool,
    model: Option<String>,
    activate: Option<bool>,
) -> Result<ConnectOut, AiError> {
    let key = key.trim().to_string();
    if !brain::key_ok(&key) {
        return Err(AiError::new(Kind::InvalidKey, "format"));
    }
    let model = model.filter(|m| !m.is_empty());
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let p = provider_or_active(&state, provider)?;
        if model.as_deref().is_some_and(|m| !brain::model_ok(m)) {
            return Err(AiError::new(Kind::Model, "bad model name"));
        }
        // A fresh connection starts from the user's choice, or from the automatic default.
        let previous_provider = std::mem::replace(&mut *state.provider.lock().unwrap(), p);
        let previous_model = std::mem::replace(&mut *state.model.lock().unwrap(), model.clone());
        let turns = [Turn {
            role: "user".into(),
            text: brain::hello_prompt(&lang),
        }];
        let reply = match run_generate(&state, &key, &brain::persona(&lang, tier, gentle), &turns) {
            Ok(r) => r,
            Err(e) => {
                // a failed attempt must not change a working setup
                *state.provider.lock().unwrap() = previous_provider;
                *state.model.lock().unwrap() = previous_model;
                return Err(e);
            }
        };
        brain::store_key(p, &key)?;
        let answered_with = current_model(&state);
        {
            let mut prefs = state.prefs.lock().unwrap();
            set_prefs_model(&mut prefs, p, model);
        }
        // The new key is saved either way; whether it takes over is the user's choice.
        if activate.unwrap_or(true) {
            state.prefs.lock().unwrap().provider = Some(p.id().to_string());
        } else {
            *state.provider.lock().unwrap() = previous_provider;
            *state.model.lock().unwrap() = previous_model;
        }
        state.dirty.store(true, Ordering::Relaxed);
        Ok(ConnectOut {
            reply: brain::split_mood(&reply).0,
            model: answered_with,
            provider: active(&state).id().to_string(),
        })
    })
    .await
    .map_err(|_| task_failed())?
}

/// Models the key can use for chat, best first. Uses `key` if given (while connecting),
/// otherwise the stored key (settings).
#[tauri::command]
async fn brain_models(app: AppHandle, provider: Option<String>, key: Option<String>) -> Result<Vec<String>, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let p = provider_or_active(&state, provider)?;
        let key = match key.map(|k| k.trim().to_string()).filter(|k| !k.is_empty()) {
            Some(k) if brain::key_ok(&k) => k,
            Some(_) => return Err(AiError::new(Kind::InvalidKey, "format")),
            None => brain::load_key(p).ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?,
        };
        brain::models_for(p, &key)
    })
    .await
    .map_err(|_| task_failed())?
}

#[derive(Serialize)]
struct ModelInfo {
    model: String,
    /// True when the user has not picked a model on purpose.
    auto: bool,
}

/// The model currently used for chat.
#[tauri::command]
fn brain_model(state: State<AppState>) -> ModelInfo {
    let p = active(&state);
    ModelInfo {
        model: current_model(&state),
        auto: prefs_model(&state.prefs.lock().unwrap(), p).is_none(),
    }
}

/// Change the model on purpose (`None` or empty = automatic).
#[tauri::command]
fn brain_set_model(state: State<AppState>, model: Option<String>) -> Result<String, AiError> {
    let model = model.filter(|m| !m.is_empty());
    let p = active(&state);
    if model.as_deref().is_some_and(|m| !brain::model_ok(m)) {
        return Err(AiError::new(Kind::Model, "bad model name"));
    }
    *state.model.lock().unwrap() = model.clone();
    set_prefs_model(&mut state.prefs.lock().unwrap(), p, model);
    state.dirty.store(true, Ordering::Relaxed);
    Ok(current_model(&state))
}

/// A chat answer: the words to show, and the emotion the pet should act out while saying them.
#[derive(Serialize)]
struct ChatReply {
    text: String,
    mood: String,
    /// A skill the model named in a `[skill:name]` tag, if it is on the closed list (S4); the page checks it again.
    #[serde(skip_serializing_if = "Option::is_none")]
    skill: Option<String>,
    /// The arguments of the tag, for `remind` only (`MM-DD|words`); the page checks the form again.
    #[serde(skip_serializing_if = "Option::is_none", rename = "skillArgs")]
    skill_args: Option<String>,
}

#[tauri::command]
async fn brain_chat(
    app: AppHandle,
    lang: String,
    tier: u8,
    gentle: bool,
    history: Vec<Turn>,
    known: Option<Vec<String>>,
    follow_user: Option<bool>,
    event: Option<String>,
    skills: Option<bool>,
    clock: Option<String>,
    banter: Option<bool>,
    remind: Option<bool>,
    open_day: Option<String>,
    kept_days: Option<Vec<String>>,
    pet: Option<String>,
    duo: Option<bool>,
    situation: Option<String>,
) -> Result<ChatReply, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        if pet.as_deref() == Some("paws") {
            // Paws (ADR-0140): its own persona, its own key if it has one else the shared one; no notes about the person, no skills.
            let p = active(&state); // the same brain as Peak (the developer flag that gave Paws another one went with Groq, ADR-0150)
            let key = brain::load_key_for_paws(p).ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?;
            let system = brain::with_situation(brain::with_clock(brain::persona_paws(&lang, gentle), clock.as_deref()), situation.as_deref());
            let started = std::time::Instant::now();
            let (raw, model) = (run_generate(&state, &key, &system, &history), current_model(&state));
            duo::log(&app, &format!("brain paws provider={} model={} ok={} err={} ms={}", p.id(), model, raw.is_ok(), raw.as_ref().err().map(|e| format!("{:?}", e.kind)).unwrap_or_default(), started.elapsed().as_millis()));
            let raw = raw?;
            if duo.unwrap_or(false) { return Ok(ChatReply { text: raw, mood: String::new(), skill: None, skill_args: None }); } // the page reads the tags ([pass], [to:..]) of the talk
            let r = brain::split_reply(&raw);
            return Ok(ChatReply { text: r.text, mood: r.mood, skill: None, skill_args: None });
        }
        let key = brain::load_key(active(&state)).ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?;
        // A remark after a reflex (RX-7) uses the persona and the card of that event, never the user's notes.
        let system = match event.as_deref() {
            Some(ev) if brain::reaction_card(ev).is_some() => brain::persona_with_card(&lang, tier, gentle, ev),
            _ => brain::persona_with_skill_set(&lang, tier, gentle, known.as_deref().unwrap_or(&[]), follow_user.unwrap_or(false), skills.unwrap_or(false), remind.unwrap_or(false)),
        };
        let system = brain::with_clock(system, clock.as_deref());
        let system = brain::with_banter(system, banter.unwrap_or(false));
        let system = if remind.unwrap_or(false) { brain::with_open_day(system, open_day.as_deref()) } else { system };
        // the days the person asked it to keep, so that it can answer about them; never in a remark after a reflex (that path has its own card)
        let system = if event.is_none() { brain::with_kept_days(system, kept_days.as_deref().unwrap_or(&[])) } else { system };
        let system = brain::with_situation(system, situation.as_deref());
        let started = std::time::Instant::now();
        let raw = run_generate(&state, &key, &system, &history);
        if duo.unwrap_or(false) { duo::log(&app, &format!("brain peak provider={} ok={} ms={}", active(&state).id(), raw.is_ok(), started.elapsed().as_millis())); }
        let raw = raw?;
        if duo.unwrap_or(false) { return Ok(ChatReply { text: raw, mood: String::new(), skill: None, skill_args: None }); }
        let r = brain::split_reply(&raw);
        // Without the skills layer the model was not told about the tag: a tag it still wrote is ignored, never acted on.
        let skill = match r.skill.as_deref() {
            Some("leave") if skills.unwrap_or(false) => r.skill.clone(),
            Some("remind") if remind.unwrap_or(false) => r.skill.clone(),
            _ => None,
        };
        let skill_args = if skill.as_deref() == Some("remind") { r.skill_args } else { None };
        Ok(ChatReply { text: r.text, mood: r.mood, skill, skill_args })
    })
    .await
    .map_err(|_| task_failed())?
}

/// Paws' own key (ADR-0140), typed in Settings and sent straight here, never shown or logged. Stored for the active provider.
#[tauri::command]
async fn brain_paws_store_key(app: AppHandle, key: String) -> Result<(), AiError> {
    tauri::async_runtime::spawn_blocking(move || brain::store_key_paws(active(&app.state::<AppState>()), &key))
        .await
        .map_err(|_| task_failed())?
}

/// True when Paws has a key of its own (false: it uses the shared one).
#[tauri::command]
async fn brain_paws_has_own_key(app: AppHandle) -> bool {
    tauri::async_runtime::spawn_blocking(move || brain::load_key_paws(active(&app.state::<AppState>())).is_some())
        .await
        .unwrap_or(false)
}

#[tauri::command]
async fn brain_paws_forget_key(app: AppHandle) -> Result<(), AiError> {
    tauri::async_runtime::spawn_blocking(move || brain::delete_key_paws(active(&app.state::<AppState>())))
        .await
        .map_err(|_| task_failed())?
}

/// A small background call: which lasting facts did the user state in this chat? The transcript
/// is what the user already sent to the model in the chat itself. Returns at most 3 filtered
/// lines (see brain::parse_facts); the caller stores them and shows them in Settings.
#[tauri::command]
async fn brain_remember(app: AppHandle, lang: String, transcript: String, known: Vec<String>) -> Result<Vec<String>, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let key = brain::load_key(active(&state)).ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?;
        let text: String = transcript.chars().take(2000).collect();
        let turns = [Turn { role: "user".into(), text }];
        let raw = run_generate(&state, &key, &brain::extract_prompt(&lang, &known), &turns)?;
        Ok(brain::parse_facts(&raw, &known))
    })
    .await
    .map_err(|_| task_failed())?
}

/// Remove a stored key. If it was the active provider's and another has a key, that one takes over.
#[tauri::command]
async fn brain_forget(app: AppHandle, provider: Option<String>) -> Result<ProviderInfo, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let p = provider_or_active(&state, provider)?;
        brain::delete_key(p)?;
        if active(&state) == p {
            if let Some(other) = brain::Provider::ALL.into_iter().find(|o| *o != p && brain::load_key(*o).is_some()) {
                switch_provider(&state, other);
            }
        }
        Ok(provider_info(&state))
    })
    .await
    .map_err(|_| task_failed())?
}

/// Open the provider's key page in the default browser (fixed URLs, nothing user-supplied).
#[tauri::command]
fn open_key_page(app: AppHandle, provider: Option<String>) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let p = provider
        .as_deref()
        .and_then(brain::Provider::parse)
        .unwrap_or_else(|| active(&app.state::<AppState>()));
    app.opener().open_url(p.key_page(), None::<&str>).map_err(|e| e.to_string())
}

/// The project's website (Settings, About). One fixed address, nothing user-supplied.
const WEBSITE_URL: &str = "https://streakboom.com";

#[tauri::command]
fn open_website(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener().open_url(WEBSITE_URL, None::<&str>).map_err(|e| e.to_string())
}
// ------------------------------------------------------------- positioning

/// Place the window at the saved position if it is still on a connected monitor,
/// otherwise at the bottom-right of the primary monitor's work area.
fn place_window(win: &WebviewWindow, prefs: &Prefs) {
    let size = match win.outer_size() {
        Ok(s) => s,
        Err(_) => return,
    };
    let scale = win.scale_factor().unwrap_or(1.0);
    let (l, t, s) = pet_px(scale);

    // A saved position is used (pulled fully inside the work area of the nearest monitor, in case
    // the monitor layout or taskbar changed); otherwise the pet starts at the primary
    // monitor's bottom-right corner.
    let saved = match (prefs.x, prefs.y) {
        (Some(x), Some(y)) => area_at(win, (x + l + s / 2) as f64, (y + t + s / 2) as f64)
            .map(|a| layout::clamp_window(a, x, y, l, t, s)),
        _ => None,
    };
    let (x, y) = saved.unwrap_or_else(|| {
        if let Ok(Some(m)) = win.primary_monitor() {
            let wa = m.work_area();
            let margin = (20.0 * scale) as i32;
            (
                wa.position.x + wa.size.width as i32 - size.width as i32 - margin + l,
                wa.position.y + wa.size.height as i32 - (t + s),
            )
        } else {
            (100, 100)
        }
    });
    let _ = win.set_position(PhysicalPosition::new(x, y));
}

// --------------------------------------------------------------- hit-testing

/// Make the window click-through except over the pet. Polls fast only when the cursor
/// is near the window; also flushes dirty preferences to disk.
fn spawn_hit_test(app: AppHandle, win: WebviewWindow) {
    std::thread::spawn(move || {
        let mut ignoring: Option<bool> = None;
        let mut last_hint = false;
        let mut was_down = false;
        let mut was_active = false;
        let mut mons_sig = layout::monitors_signature(&mons_of(&win));
        let mut mons_checked = Instant::now();
        let mut last_flush = Instant::now();
        let mut cover_checked = Instant::now();
        let mut cover_told = Instant::now();
        let mut was_covered = false;
        let mut busy_checked = Instant::now() - Duration::from_secs(5); // read at once on the first round
        loop {
            let state = app.state::<AppState>();
            if busy_checked.elapsed() >= BUSY_READ_EVERY {
                state.focus_busy.store(busy_now(), Ordering::Relaxed);
                busy_checked = Instant::now();
            }
            let mut delay = 150;
            let mut ptr_ok = false;
            let mut offset: Option<(f64, f64)> = None;
            let idle = last_input_idle_ms();
            state.focus_idle_ms.store(idle.unwrap_or(u32::MAX), Ordering::Relaxed);
            if win.is_visible().unwrap_or(false) {
                if let (Ok(cur), Ok(pos), Ok(size), Ok(scale)) = (
                    win.cursor_position(),
                    win.outer_position(),
                    win.outer_size(),
                    win.scale_factor(),
                ) {
                    let lx = (cur.x - pos.x as f64) / scale;
                    let ly = (cur.y - pos.y as f64) / scale;
                    let w = size.width as f64 / scale;
                    let h = size.height as f64 / scale;
                    if lx > -40.0 && lx < w + 40.0 && ly > -40.0 && ly < h + 40.0 {
                        delay = 30;
                    }
                    let r = *state.hit.lock().unwrap();
                    let inside = lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h;
                    let (dx, dy) = layout::pointer_offset(cur.x, cur.y, pos.x as f64, pos.y as f64, scale, PET_LEFT, PET_TOP, PET_SIZE);
                    state.focus_dx.store(dx.to_bits(), Ordering::Relaxed);
                    state.focus_dy.store(dy.to_bits(), Ordering::Relaxed);
                    state.focus_over.store(inside, Ordering::Relaxed);
                    state.focus_cat_x.store(((pos.x as f64 / scale) + PET_LEFT + PET_SIZE / 2.0).to_bits(), Ordering::Relaxed);
                    state.focus_cat_y.store(((pos.y as f64 / scale) + PET_TOP + PET_SIZE / 2.0).to_bits(), Ordering::Relaxed);
                    // the primary button: a press away from the cat is a click that put the caret somewhere (typing lane);
                    // a press on the cat is a gesture on it, and a press while dragging is the drag
                    let (down, pressed) = layout::button_bits(primary_button_raw());
                    state.button_down.store(down, Ordering::Relaxed);
                    if layout::is_click(was_down, down, pressed) && !inside && !state.dragging.load(Ordering::Relaxed) {
                        state.click_x.store((cur.x / scale).to_bits(), Ordering::Relaxed);
                        state.click_y.store((cur.y / scale).to_bits(), Ordering::Relaxed);
                        state.click_at.store(now_ms().max(1), Ordering::Relaxed);
                        // only that a click happened: where stays here and is read with the probe (PC-3)
                        let _ = app.emit("percept", serde_json::json!({ "kind": "click" }));
                    }
                    was_down = down;
                    ptr_ok = true;
                    offset = Some((dx, dy));
                    // While dragging the window follows the cursor and must keep receiving events.
                    let want_ignore = !inside && !state.dragging.load(Ordering::Relaxed);
                    if ignoring != Some(want_ignore) {
                        let _ = win.set_ignore_cursor_events(want_ignore);
                        ignoring = Some(want_ignore);
                    }
                }
            }
            state.focus_ptr.store(ptr_ok, Ordering::Relaxed);
            // events for the page (PC-3): the user started or stopped working, and the monitors changed (checked every few seconds)
            let act = layout::activity_next(was_active, idle);
            if act != was_active {
                was_active = act;
                let _ = app.emit("percept", serde_json::json!({ "kind": "activity", "on": act }));
            }
            // covered by a window of a higher layer (Start, Search)? About once a second; the page is told when it changes, and again every
            // 3 seconds while it lasts (it may have been busy the first time)
            if cover_checked.elapsed() >= Duration::from_secs(1) && win.is_visible().unwrap_or(false) {
                cover_checked = Instant::now();
                if let (Ok(pos), Ok(scale), Ok(h)) = (win.outer_position(), win.scale_factor(), win.hwnd()) {
                    let covered = cat_covered_at(pos.x, pos.y, scale, h.0 as isize, true);
                    if covered != was_covered || (covered && cover_told.elapsed() >= Duration::from_secs(3)) {
                        was_covered = covered;
                        cover_told = Instant::now();
                        let _ = app.emit("percept", serde_json::json!({ "kind": "covered", "on": covered }));
                    }
                }
            }
            if mons_checked.elapsed() > Duration::from_secs(5) {
                mons_checked = Instant::now();
                let sig = layout::monitors_signature(&mons_of(&win));
                if sig != mons_sig {
                    mons_sig = sig;
                    let _ = app.emit("percept", serde_json::json!({ "kind": "monitors" }));
                }
            }
            // tell the page only when "the user may be working near the cat" changes (no polling while it is false)
            let click_at = state.click_at.load(Ordering::Relaxed);
            let lane_hint = ptr_ok
                && click_at != 0
                && layout::engaged_lane(
                    idle,
                    Some(layout::age_ms(now_ms(), click_at)),
                    f64::from_bits(state.click_y.load(Ordering::Relaxed)) - f64::from_bits(state.focus_cat_y.load(Ordering::Relaxed)),
                );
            let hint = offset.is_some_and(|(dx, dy)| layout::engaged_near(idle, dx, dy)) || lane_hint;
            if hint != last_hint {
                last_hint = hint;
                let _ = app.emit("focus-hint", hint);
            }
            if state.dirty.load(Ordering::Relaxed) && last_flush.elapsed() > Duration::from_secs(1) {
                write_prefs(&state);
                last_flush = Instant::now();
            }
            std::thread::sleep(Duration::from_millis(delay));
        }
    });
}

/// The pointer near Peak at a fine rate (ADR-0135, E33 IR-4a): a small thread beside the hit-test thread, **a test build only** (the same gate as
/// the terrain overlay). Inside a zone around Peak's window it reads the pointer every 8 ms with two cheap system calls (no round trip to the
/// main thread), keeps the last 300 ms in memory and, when the pointer leaves, writes the numbers of the pass as one fixed line. Outside the
/// zone it looks every 60 ms and reads nothing else. Nothing is stored or sent; **one event goes to the page, when a flick is recognised** (ADR-0136).
fn spawn_fast_pass(app: AppHandle, win: WebviewWindow) {
    if !overlay_allowed() || std::env::var_os("STREAKBOOM_NO_FAST").is_some() {
        return; // the second condition is for the A/B measurement of the cost (a test build, set by hand)
    }
    std::thread::spawn(move || {
        let hwnd = win.hwnd().ok().map(|h| h.0 as isize);
        let mut scale = win.scale_factor().unwrap_or(1.0);
        let mut scale_at = Instant::now();
        let epoch = Instant::now();
        let mut tracker = fastpass::Tracker::new();
        loop {
            if scale_at.elapsed() >= Duration::from_millis(500) {
                scale = win.scale_factor().unwrap_or(scale);
                scale_at = Instant::now();
            }
            let mut inside = false;
            if let (Some(h), Some((cx, cy))) = (hwnd, pointer_pos()) {
                if let Some((l, t, r, b)) = window_rect_of(h) {
                    let (lx, ly) = ((cx - l) as f64 / scale, (cy - t) as f64 / scale);
                    let (w, hh) = ((r - l) as f64 / scale, (b - t) as f64 / scale);
                    if fastpass::in_zone(lx, ly, w, hh) {
                        inside = true;
                        let s = fastpass::Sample { t: epoch.elapsed().as_millis() as u64, x: lx - PET_LEFT, y: ly - PET_TOP, ax: cx as f64 / scale, ay: cy as f64 / scale };
                        if let Some(done) = tracker.step(s) {
                            if let Some(line) = fastpass::line(&done, PET_SIZE) {
                                append_trace(&app, "loop-trace.log", &line);
                            }
                        }
                        // a strike on Peak (ADR-0136): one event for the page, with the way and a power, nothing else
                        if let Some(f) = tracker.flick() {
                            let way = if f.way == fastpass::Way::Right { "right" } else { "left" };
                            let _ = app.emit("percept", serde_json::json!({ "kind": "flick", "way": way, "power": f.power }));
                            append_trace(&app, "loop-trace.log", &format!("flick_fired way={way} power={} vpeak={} vend={}", f.power, f.vpeak.round() as i64, f.vend.round() as i64));
                        }
                    }
                }
            }
            if !inside {
                if let Some(done) = tracker.leave() {
                    if let Some(line) = fastpass::line(&done, PET_SIZE) {
                        append_trace(&app, "loop-trace.log", &line);
                    }
                }
            }
            precise_sleep(if inside { fastpass::SAMPLE_MS } else { 60 }); // a timer of this thread, not a finer one for the whole program
        }
    });
}

// ---------------------------------------------------------------------- tray

/// May this build open the terrain overlay? A developer build (cargo feature `terrain-overlay`) and every **Preview** build (an odd
/// middle number, ADR-0116); never a Stable one. It draws on the screen only; nothing is saved or sent.
fn overlay_allowed() -> bool {
    cfg!(feature = "terrain-overlay") || updater::channel_of(env!("CARGO_PKG_VERSION")) == updater::Channel::Preview
}

/// The overlay belongs to Peak: when Peak is hidden (the tray, or away) it is hidden too, and shown again when Peak is.
fn overlay_follow(app: &AppHandle, show: bool) {
    if let Some(w) = app.get_webview_window("overlay") {
        if show {
            show_without_activating(&w);
        } else {
            hide_window(&w);
        }
    }
}

/// The developer overlay (TT-1, spec/10 section 7): a click-through, transparent window over the monitor's work area that
/// draws what Peak believes about the screen (the page `overlay`). Opens or closes it, tells the pet page, and puts the pet
/// window back on top so the cat is never hidden by it.
fn toggle_overlay(app: &AppHandle) -> String {
    if !overlay_allowed() {
        return "not in this build".into();
    }
    if let Some(w) = app.get_webview_window("overlay") {
        let _ = w.close();
        let _ = app.emit_to("main", "overlay-toggle", false);
        return "closed".into();
    }
    let Some(main) = app.get_webview_window("main") else { return "no main window".into() };
    let (Ok(pos), Ok(scale)) = (main.outer_position(), main.scale_factor()) else { return "no position".into() };
    let (l, t, s) = pet_px(scale);
    let Some(a) = area_at(&main, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64) else { return "no monitor".into() };
    let built = WebviewWindowBuilder::new(app, "overlay", WebviewUrl::App("overlay".into()))
        .transparent(true)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(false)
        .resizable(false)
        .shadow(false)
        .additional_browser_args(BROWSER_ARGS) // the same arguments as the other windows (WebView2 refuses a window whose environment differs)
        .position(a.x as f64 / scale, a.y as f64 / scale)
        .inner_size((a.r - a.x) as f64 / scale, (a.b - a.y) as f64 / scale)
        .build();
    match built {
        Ok(w) => {
            let _ = w.set_ignore_cursor_events(true);
            let _ = main.set_always_on_top(true); // above the overlay: the cat is never hidden
            let _ = app.emit_to("main", "overlay-toggle", true);
            "opened".into()
        }
        Err(e) => format!("could not open: {e}"),
    }
}

/// Open or close the developer overlay from the page (for the debugger); false in a build without the feature.
#[tauri::command]
async fn overlay_toggle(app: AppHandle) -> String {
    // an async command: creating a window from a synchronous one blocks on Windows
    toggle_overlay(&app)
}

/// The experiment of ADR-0119: turn the screen picture on or off (a tray item of a Preview build). Off at every start; the page is told.
fn toggle_picture(app: &AppHandle) -> bool {
    if !overlay_allowed() {
        return false;
    }
    let now = !app.state::<AppState>().picture_on.load(Ordering::SeqCst);
    app.state::<AppState>().picture_on.store(now, Ordering::SeqCst);
    let _ = app.emit_to("main", "picture-toggle", now);
    now
}

/// What the page is given: the work area it is a picture of (physical px), the size of the grid and the grey levels, row by row.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ScreenGrid {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
    gw: u32,
    gh: u32,
    data: Vec<u8>,
    /// How many cells differ between a picture with Peak's own windows in it and the one given (which leaves them out): a check that
    /// the windows of ours are really out of the picture (a diagnostic of the experiment only).
    own_cells: u32,
}

/// May the picture be taken now? Two separate gates (PS-8): the person's own switch in Settings (any build, off by default), or the test
/// switch of the tray in a build that may have the overlay (Preview and developer builds). The overlay is only a drawing for the people who
/// test; the picture itself, and what Peak does with it, do not need it.
fn picture_allowed(app: &AppHandle) -> bool {
    let st = app.state::<AppState>();
    picture_gate(st.picture_user.load(Ordering::SeqCst), st.picture_on.load(Ordering::SeqCst), overlay_allowed())
}

/// The rule of the two gates, pure so that it can be tested: the person's switch, or the test switch of a build that may have the overlay.
pub(crate) fn picture_gate(user: bool, tray: bool, test_build: bool) -> bool {
    user || (test_build && tray)
}

/// The page tells Rust that the person's switch changed (and at the start, with the saved value).
#[tauri::command]
fn picture_user(state: State<AppState>, on: bool) {
    state.picture_user.store(on, Ordering::SeqCst);
}

/// A very small grey picture of the monitor Peak is on (ADR-0119, `picture.rs`), only while the person has the experiment on (the overlay
/// need not be open: the rules of the clear place use it too, ADR-0123); `None` otherwise. The picture is not kept here: it is built, returned and dropped.
#[tauri::command]
async fn screen_grid(app: AppHandle) -> Option<ScreenGrid> {
    // none while the person is in a full-screen program, presenting, or away (the session locked): no capture of a game or a shared screen (PS-10)
    let now_ms = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis() as u64).unwrap_or(0);
    if !picture_allowed(&app) || now_ms < app.state::<AppState>().picture_retry_at.load(Ordering::SeqCst) || busy_now() {
        return None;
    }
    let main = app.get_webview_window("main")?;
    let (pos, scale) = (main.outer_position().ok()?, main.scale_factor().ok()?);
    let (l, t, s) = pet_px(scale);
    let a = area_at(&main, (pos.x + l + s / 2) as f64, (pos.y + t + s / 2) as f64)?;
    let (w, h) = (a.r - a.x, a.b - a.y);
    let (gw, gh) = picture::grid_dims(w, h)?;
    // Peak's own windows (the pet, the bubble, the overlay) are taken out of the capture for the moment of taking it (they were found to be in it)
    // (only the ones that are on the screen: a hidden window is not in the picture, and Windows may refuse the change for it)
    let hwnds: Vec<isize> = ["main", "bubble", "overlay"].iter().filter_map(|l| app.get_webview_window(l)).filter(|w| w.is_visible().unwrap_or(false)).filter_map(|w| w.hwnd().ok()).map(|h| h.0 as isize).collect();
    // the diagnostic picture with our windows in it (the count of `own_cells` on the overlay) is taken only while the overlay is open
    let diagnostic = app.get_webview_window("overlay").is_some();
    let hwnds_n = hwnds.len();
    let (with, data, excluded) = tauri::async_runtime::spawn_blocking(move || {
        let with = if diagnostic { picture::capture_gray(a.x, a.y, w, h, gw, gh) } else { None };
        let excluded = picture::set_capture_exclusion(&hwnds, true);
        std::thread::sleep(Duration::from_millis(60)); // the desktop composition takes a frame to follow
        let without = picture::capture_gray(a.x, a.y, w, h, gw, gh);
        picture::set_capture_exclusion(&hwnds, false);
        (with, without, excluded)
    })
    .await
    .ok()?;
    if let Some(code) = excluded {
        // Peak's windows could not be left out, so the picture would show Peak itself: none is given now, and a new try waits longer each time
        let n = app.state::<AppState>().picture_refused.fetch_add(1, Ordering::SeqCst) + 1;
        // wait 5 s after the first refusal, then twice as long each time, at most 5 minutes: a window that was just created is ready soon; a Windows that cannot do it is asked rarely
        let wait_ms = (5_000u64 << (n - 1).min(6)).min(300_000);
        app.state::<AppState>().picture_retry_at.store(now_ms + wait_ms, Ordering::SeqCst);
        if overlay_allowed() {
            append_trace(&app, "loop-trace.log", &format!("picture_refused n={n} windows={} error={code}", hwnds_n)); // a test build only (ADR-0122)
        }
        return None;
    }
    app.state::<AppState>().picture_refused.store(0, Ordering::SeqCst);
    let data = data?;
    if picture::looks_failed(&data) {
        if overlay_allowed() {
            append_trace(&app, "loop-trace.log", "picture_failed black_or_empty=1");
        }
        return None; // a locked screen, a secure desktop or a capture that is blocked: it says nothing about the screen
    }
    let own_cells = with.map(|v| v.iter().zip(&data).filter(|(p, q)| (**p as i32 - **q as i32).abs() >= 6).count() as u32).unwrap_or(0);
    Some(ScreenGrid { x: a.x, y: a.y, w, h, gw, gh, data, own_cells })
}

fn toggle_visibility(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        set_peak_visible(app, !win.is_visible().unwrap_or(false));
    }
}

/// Peak's window is shown or hidden to match `want`, and does nothing if it already does (ADR-0158: a window is set, never switched, so that it cannot
/// disagree with who is out). Shown without the keyboard: calling a pet out from the chat box must not take the keyboard from it.
pub(crate) fn set_peak_visible(app: &AppHandle, want: bool) {
    let Some(win) = app.get_webview_window("main") else { return };
    let now = win.is_visible().unwrap_or(false);
    if want && !now {
        show_without_activating(&win);
        overlay_follow(app, true);
        end_away(app);
    } else if !want && now {
        hide_window(&win);
        // the bubble belongs to the pet: hide it too
        bubble_hide(app.clone(), app.state::<AppState>());
        overlay_follow(app, false);
        if duo::enabled() { duo::log(app, &format!("peak_hide visible_after={}", win.is_visible().unwrap_or(false))); }
    }
}

/// The person showed Peak (the tray, or starting the program again) while it was away: the leaving is over, its timer is
/// cancelled and the page is told, so that it stretches and goes on.
fn end_away(app: &AppHandle) {
    let state = app.state::<AppState>();
    if state.away.swap(false, Ordering::SeqCst) {
        state.away_gen.fetch_add(1, Ordering::SeqCst);
        let _ = app.emit_to("main", "away-ended", ());
    }
}

/// One step of the "Luợn đi" flow as a line of `leave-trace.log` in the data folder (V-132): only a fixed step name and numbers the page
/// chose, never chat text, so that a failure the author sees can be read afterwards. Anything outside letters, digits and
/// `_ - : . , = space` is dropped, a line is at most 120 characters, and the file is cut to its newest half past 64 KB.
pub(crate) fn trace_line(step: &str, now_ms: u128) -> Option<String> {
    let clean: String = step
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | ':' | '.' | ',' | '=' | ' '))
        .take(120)
        .collect();
    let clean = clean.trim();
    if clean.is_empty() {
        None
    } else {
        Some(format!("{now_ms} {clean}\n"))
    }
}

const TRACE_MAX_BYTES: usize = 64 * 1024;

pub(crate) fn trim_trace(text: &str) -> String {
    if text.len() <= TRACE_MAX_BYTES {
        return text.to_string();
    }
    let mut start = text.len() / 2;
    while !text.is_char_boundary(start) {
        start += 1;
    }
    match text[start..].find('\n') {
        Some(i) => text[start + i + 1..].to_string(),
        None => String::new(),
    }
}

/// Append one line (names and numbers only) to a small log in the app data folder, cut to its newest half past 64 KB.
pub(crate) fn append_trace(app: &AppHandle, file: &str, step: &str) {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let Some(line) = trace_line(step, now) else { return };
    let Ok(dir) = app.path().app_data_dir() else { return };
    let _ = fs::create_dir_all(&dir);
    let path = dir.join(file);
    let old = fs::read_to_string(&path).unwrap_or_default();
    let _ = fs::write(&path, trim_trace(&(old + &line)));
}

#[tauri::command]
fn leave_trace(app: AppHandle, step: String) {
    append_trace(&app, "leave-trace.log", &step);
}

/// The same for the perches, climbs and hops (`perch-trace.log`, ADR-0116): which gate stopped an attempt, and the numbers of the
/// map; fixed names and numbers only.
#[tauri::command]
fn perch_trace(app: AppHandle, step: String) {
    append_trace(&app, "perch-trace.log", &step);
}

/// A test aid (E29): whether a named switch is set in the environment. Only the names listed here can be asked; they change a behaviour
/// being measured and are never set for a person.
#[tauri::command]
fn dev_flag(name: String) -> bool {
    matches!(name.as_str(), "STREAKBOOM_NO_SETTLE" | "STREAKBOOM_DUO_NOBRAIN") && std::env::var(&name).as_deref() == Ok("1")
}

/// The chat gate and the chat count (`chat-trace.log`, E28): a number of characters and the count of the day, never the words.
#[tauri::command]
fn chat_trace(app: AppHandle, step: String) {
    if !overlay_allowed() {
        return; // a Preview or dev build only (ADR-0122): a Stable build writes none of the loop logs
    }
    append_trace(&app, "chat-trace.log", &step);
}

/// The loop engineering log (`loop-trace.log`, E29): which action ran and when, fixed names and numbers only.
#[tauri::command]
fn loop_trace(app: AppHandle, step: String) {
    if !overlay_allowed() {
        return; // a Preview or dev build only (ADR-0122)
    }
    append_trace(&app, "loop-trace.log", &step);
}

/// Peak walks off (S2): hide the pet window and its bubble and start the return timer. The page decides whether it may leave.
#[tauri::command]
fn pet_leave(app: AppHandle, state: State<AppState>, minutes: u32) -> bool {
    let Some(win) = app.get_webview_window("main") else { return false };
    if !win.is_visible().unwrap_or(false) || state.away.swap(true, Ordering::SeqCst) {
        return false;
    }
    if duo::enabled() {
        duo::peak_walk_off(&app); // ADR-0160: the page walked it to the edge; it walks on through the door, then the state says it is in
    } else {
        hide_window(&win); // the same kind of call as the one that shows it on return
        bubble_hide(app.clone(), app.state::<AppState>());
        overlay_follow(&app, false);
    }
    let secs = away_secs(std::env::var("STREAKBOOM_AWAY_SECS").ok().as_deref(), u64::from(minutes.clamp(1, 24 * 60)) * 60);
    arm_return(&app, Duration::from_secs(secs));
    true
}

/// Peak comes back (S2): show the pet window where it left. False if it was not away.
#[tauri::command]
fn pet_return(app: AppHandle, state: State<AppState>) -> bool {
    if !state.away.swap(false, Ordering::SeqCst) {
        return false;
    }
    state.away_gen.fetch_add(1, Ordering::SeqCst);
    if duo::enabled() {
        duo::peak_walk_back(&app); // ADR-0160: it comes back through its door, walking in from the side it left by
        return true;
    }
    if let Some(win) = app.get_webview_window("main") {
        // The timer, not the person, shows it: it must not take the keyboard from the program they are typing in.
        show_without_activating(&win);
    }
    overlay_follow(&app, true);
    true
}

/// The page found the moment of the return not right (a full-screen program, for example): ask again later.
#[tauri::command]
fn pet_away_retry(app: AppHandle, state: State<AppState>, secs: u32) {
    if state.away.load(Ordering::SeqCst) {
        let wait = away_secs(std::env::var("STREAKBOOM_AWAY_RETRY_SECS").ok().as_deref(), u64::from(secs.clamp(10, 3600)));
        arm_return(&app, Duration::from_secs(wait));
    }
}

/// Start (or restart) the return timer of the current leaving; when it runs out and the same leaving still holds, the page is
/// told with "away-due" (the page keeps the rules about when Peak may reappear).
fn arm_return(app: &AppHandle, after: Duration) {
    let state = app.state::<AppState>();
    let turn = state.away_gen.fetch_add(1, Ordering::SeqCst) + 1;
    let deadline = now_ms().saturating_add(after.as_millis() as u64);
    let app = app.clone();
    std::thread::spawn(move || loop {
        // Look at the wall clock in short slices, not one long sleep: a long sleep does not count the time the computer slept, so
        // a Peak sent away before a lid was closed would come back late. A leaving that was ended or replaced stops the thread.
        let state = app.state::<AppState>();
        if !state.away.load(Ordering::SeqCst) || state.away_gen.load(Ordering::SeqCst) != turn {
            return;
        }
        match next_wait(now_ms(), deadline) {
            Some(wait) => std::thread::sleep(wait),
            None => {
                let _ = app.emit_to("main", "away-due", ());
                return;
            }
        }
    });
}

/// A test aid, like STREAKBOOM_UPDATE_URL: the environment variables STREAKBOOM_AWAY_SECS and STREAKBOOM_AWAY_RETRY_SECS (5 to 3600)
/// replace the 20 minutes and the 5-minute retry of "Lượn đi", so that the return can be tried in a minute. Anything else is ignored.
fn away_secs(over: Option<&str>, default_secs: u64) -> u64 {
    over.and_then(|s| s.trim().parse::<u64>().ok()).filter(|s| (5..=3600).contains(s)).unwrap_or(default_secs)
}

/// How long to sleep before looking at the clock again: the time left, at most `AWAY_SLICE`; None when the deadline has come.
fn next_wait(now_ms: u64, deadline_ms: u64) -> Option<Duration> {
    if now_ms >= deadline_ms {
        return None;
    }
    Some(Duration::from_millis((deadline_ms - now_ms).min(AWAY_SLICE.as_millis() as u64)))
}

fn build_tray(app: &AppHandle, quiet: bool) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let quiet_item = CheckMenuItem::with_id(app, "quiet", "Quiet mode", true, quiet, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    // with the duo flag the menu is only Quiet mode, Settings and Quit: a click on the icon opens the chat, and the pets are called in the chat (ADR-0160)
    let menu = if duo::enabled() { Menu::with_items(app, &[&settings, &quiet_item, &quit])? } else { Menu::with_items(app, &[&toggle, &settings, &quiet_item, &quit])? };
    // a developer build and every Preview build, never a Stable one (ADR-0116): show what Peak believes about the screen
    if overlay_allowed() {
        menu.append(&MenuItem::with_id(app, "overlay", "Terrain overlay (Preview)", true, None::<&str>)?)?;
        menu.append(&MenuItem::with_id(app, "picture", "Screen picture on/off (experiment)", true, None::<&str>)?)?;
    }
    let quiet_ref = quiet_item.clone();
    *app.state::<AppState>().quiet_item.lock().unwrap() = Some(quiet_item.clone());
    *app.state::<AppState>().tray_items.lock().unwrap() = Some([toggle.clone(), settings.clone(), quit.clone()]);

    let mut builder = TrayIconBuilder::with_id("tray")
        .tooltip("Streakboom")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "toggle" => toggle_visibility(app), // not in the menu with the duo flag (ADR-0160)
            "settings" => open_settings_async(app),
            "quiet" => set_quiet(app, quiet_ref.is_checked().unwrap_or(false)),
            "quit" => quit_app(app),
            "picture" => {
                toggle_picture(app);
            }
            "overlay" => {
                // from the tray handler: not on this thread (creating a window here can block on Windows)
                let app = app.clone();
                std::thread::spawn(move || toggle_overlay(&app));
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            match event {
                TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } => {
                    // with the duo flag a click shows or hides the chat box and never a pet; there is no double click (ADR-0160); without it, as before
                    if duo::enabled() { duo::tray_single(tray.app_handle()); } else { toggle_visibility(tray.app_handle()); }
                }
                _ => {}
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;
    Ok(())
}

// ----------------------------------------------------------------------- run

#[cfg_attr(mobile, tauri::mobile_entry_point)]
/// What a second start does (ADR-0067): the running Peak is made visible if it was hidden.
fn second_start_show(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if !win.is_visible().unwrap_or(true) {
            let _ = win.show();
            end_away(app);
        }
    }
}

/// T2a (row 28a): a second start that came during an entry into a group visit, done now that the entry has its outcome.
#[tauri::command]
fn duo_second_start_resume(app: AppHandle) { second_start_show(&app); }

pub fn run() {
    tauri::Builder::default()
        // ONE Peak per user (ADR-0067): a second start (a click on the program, the start with Windows after a manual start)
        // does not open a second pet. It must be the first plugin. The running Peak is only made visible if it was hidden:
        // whoever starts it again most likely cannot find it.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // T2a (row 28a): while the page enters a group visit, a second start waits for the entry; the page then focuses its box (experiment only)
            if duo::entry_pending() { let _ = app.emit_to("main", "duo-open-deferred", "second-start"); return; }
            second_start_show(app);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Starting with Windows is the user's choice (Settings, or the one-time question from the pet).
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .manage(updater::PendingUpdate::default())
        .setup(|app| {
            brain::forget_retired_keys(); // Groq is retired (ADR-0150); its stored key goes with it
            if let Some(m) = spike::mode() {
                return spike::setup(app, &m); // a measurement scenario, not the pet
            }
            let dir = app.path().app_data_dir()?;
            let _ = fs::create_dir_all(&dir);
            let path = dir.join("state.json");
            let prefs: Prefs = fs::read_to_string(&path)
                .ok()
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();
            app.manage(AppState {
                prefs: Mutex::new(prefs.clone()),
                pet_path: dir.join("pet.json"),
                memory_path: dir.join("memory.json"),
                model: Mutex::new({
                    let p = prefs.provider.as_deref().and_then(brain::Provider::parse).unwrap_or_default();
                    prefs_model(&prefs, p).filter(|m| brain::model_ok(m))
                }),
                provider: Mutex::new(prefs.provider.as_deref().and_then(brain::Provider::parse).unwrap_or_default()),
                path,
                hit: Mutex::new(Rect {
                    x: PET_LEFT,
                    y: PET_TOP,
                    w: PET_SIZE,
                    h: PET_SIZE,
                }),
                dirty: AtomicBool::new(false),
                last_self_move_ms: AtomicU64::new(now_ms()),
                focus_idle_ms: AtomicU32::new(u32::MAX),
                focus_dx: AtomicU64::new(0),
                focus_dy: AtomicU64::new(0),
                focus_ptr: AtomicBool::new(false),
                focus_busy: AtomicBool::new(false),
                focus_over: AtomicBool::new(false),
                focus_cat_x: AtomicU64::new(0),
                focus_cat_y: AtomicU64::new(0),
                button_down: AtomicBool::new(false),
                click_at: AtomicU64::new(0),
                click_x: AtomicU64::new(0),
                click_y: AtomicU64::new(0),
                fly_cancel: AtomicBool::new(false),
                dragging: AtomicBool::new(false),
                drag: Mutex::new(DragStart::default()),
                bubble: Mutex::new(BubbleState::default()),
                quiet_item: Mutex::new(None),
                tray_items: Mutex::new(None),
                settings_section: Mutex::new(None),
                bubble_gen: AtomicU64::new(0),
                bubble_anchor: Mutex::new("main".to_string()),
                away: AtomicBool::new(false),
                away_gen: AtomicU64::new(0),
                picture_on: AtomicBool::new(false),
                picture_user: AtomicBool::new(false),
                picture_refused: AtomicU32::new(0),
                picture_retry_at: AtomicU64::new(0),
            });

            let win = app.get_webview_window("main").expect("main window");
            let _ = win.set_size(LogicalSize::new(WIN_W, WIN_H));
            place_window(&win, &prefs);
            build_tray(app.handle(), prefs.quiet)?;
            // A test aid, like STREAKBOOM_AWAY_SECS: with STREAKBOOM_DEV_OVERLAY=1 a build that may have the terrain overlay opens it, and
            // the screen picture, a few seconds after the start, so that the view can be looked at without the tray (ADR-0119).
            if overlay_allowed() && std::env::var("STREAKBOOM_DEV_OVERLAY").as_deref() == Ok("1") {
                let app = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_secs(8));
                    toggle_overlay(&app);
                    toggle_picture(&app);
                });
            }

            // A test aid for a whole working day (scripts/loop/day-run.ps1): with STREAKBOOM_DEV_PICTURE=1 the screen picture is turned on a few
            // seconds after the start, without the overlay, so that the rules that use it can be lived with and their numbers read afterwards.
            if overlay_allowed() && std::env::var("STREAKBOOM_DEV_PICTURE").as_deref() == Ok("1") {
                let app = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(Duration::from_secs(8));
                    toggle_picture(&app);
                });
            }

            // The speech bubble window is created on demand (see `bubble_ensure`), not here: a
            // webview costs about 35 MB and the bubble is hidden most of the time.
            let _ = win.show();
            spawn_hit_test(app.handle().clone(), win.clone());
            spawn_fast_pass(app.handle().clone(), win);
            if duo::enabled() { duo::init(app.handle()); }
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }
            if let WindowEvent::Moved(p) = event {
                let state = window.state::<AppState>();
                {
                    let mut prefs = state.prefs.lock().unwrap();
                    prefs.x = Some(p.x);
                    prefs.y = Some(p.y);
                }
                state.dirty.store(true, Ordering::Relaxed);
                // the bubble follows the pet
                place_bubble(window.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![
            spike::spike_phase,
            duo::duo_stage,
            duo::duo_pos,
            duo::duo_paws_drag,
            duo::duo_paws_pos,
            duo::duo_paws_floor,
            duo::duo_ball,
            duo::duo_peak_pose,
            duo::duo_scene_cancel,
            duo::duo_log,
            duo::duo_enabled,
            duo::duo_command,
            duo::duo_bubble_to,
            duo::duo_paws_out,
            duo_keys::duo_keys_get,
            duo_keys::duo_keys_set,
            duo_keys::duo_keys_reset,
            duo::chatbox_hide,
            duo::chatbox_pin,
            duo::chatbox_mode,
            duo::chatbox_state,
            duo::chatbox_fit,
            duo::duo_box_ambient,
            duo::duo_presence,
            duo::duo_busy,
            duo::duo_portrait,
            duo::duo_paws_mode,
            duo::chatbox_showing,
            duo::duo_touch,
            duo::duo_open_box,
            duo::duo_entry_gen,
            duo::duo_entry_show,
            duo::duo_entry_focus,
            duo::duo_entry_arm,
            duo::duo_entry_end,
            duo::duo_entry_disarm,
            duo::duo_membership,
            duo::duo_focus_box,
            duo_second_start_resume,
            duo::chatbox_take_prefill,
            duo::duo_fake,
            duo::duo_face,
            duo::duo_nod,
            brain_paws_store_key,
            brain_paws_has_own_key,
            brain_paws_forget_key,
            set_tray_labels,
            set_hit_rect,
            get_prefs,
            move_by,
            pet_leave,
            leave_trace,
            perch_trace,
            picture_user,
            chat_trace,
            dev_flag,
            loop_trace,
            pet_return,
            pet_away_retry,
            drag_start,
            drag_move,
            drag_end,
            bubble_fit,
            bubble_hide,
            open_settings,
            bubble_ensure,
            updater::update_enabled,
            updater::update_check,
            updater::update_install,
            take_settings_section,
            load_pet,
            save_pet,
            load_memory,
            autostart_get,
            autostart_set,
            save_memory,
            is_busy,
            brain_status,
            brain_connect,
            brain_models,
            brain_model,
            brain_set_model,
            focus_probe,
            edge_room,
            vertical_room,
            ground_at,
            ground_under_cat, cover_probe, window_holds, persona_preview, ground_map, overlay_toggle, screen_grid,
            monitors_info,
            move_to,
            pet_place,
            fly_path,
            fly_cancel,
            open_website,
            brain_provider,
            brain_set_provider,
            brain_chat,
            brain_remember,
            brain_forget,
            open_key_page
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod away_tests {
    #[test]
    fn the_terrain_overlay_is_for_preview_builds_and_developer_builds_only() {
        let minor: u64 = env!("CARGO_PKG_VERSION").split('.').nth(1).and_then(|m| m.parse().ok()).unwrap();
        assert_eq!(overlay_allowed(), cfg!(feature = "terrain-overlay") || minor % 2 == 1);
    }


    use super::*;

    #[test]
    fn a_trace_line_keeps_only_a_step_name_and_numbers() {
        assert_eq!(trace_line("walk_start room=640 dir=1", 5).as_deref(), Some("5 walk_start room=640 dir=1\n"));
        assert_eq!(trace_line("say \"x\" <b>hi</b>\n", 5).as_deref(), Some("5 say x bhib\n"));
        assert_eq!(trace_line("   \n", 5), None);
        assert!(trace_line(&"a".repeat(500), 5).unwrap().len() <= 130);
    }

    #[test]
    fn the_trace_file_is_cut_to_its_newest_lines() {
        let line = "1 step\n";
        let big = line.repeat(TRACE_MAX_BYTES / line.len() + 100);
        let cut = trim_trace(&big);
        assert!(cut.len() < TRACE_MAX_BYTES && cut.len() > 1000 && cut.ends_with('\n') && cut.starts_with("1 step"));
        assert_eq!(trim_trace("1 a\n"), "1 a\n");
    }

    #[test]
    fn the_return_timer_sleeps_in_slices_and_stops_at_the_deadline() {
        let slice = AWAY_SLICE.as_millis() as u64;
        // far away: a full slice
        assert_eq!(next_wait(0, 20 * 60_000), Some(AWAY_SLICE));
        // close: only what is left
        assert_eq!(next_wait(1_000, 1_000 + 7_500), Some(Duration::from_millis(7_500)));
        assert_eq!(next_wait(0, slice), Some(AWAY_SLICE));
        assert_eq!(next_wait(0, slice - 1), Some(Duration::from_millis(slice - 1)));
        // due now, or long past (the computer slept: the clock is far ahead)
        assert_eq!(next_wait(5_000, 5_000), None);
        assert_eq!(next_wait(5_001, 5_000), None);
        assert_eq!(next_wait(10_000_000, 1_200_000), None);
    }

    #[test]
    fn the_test_aid_replaces_the_times_only_by_a_sane_number() {
        assert_eq!(away_secs(None, 1200), 1200);
        assert_eq!(away_secs(Some("60"), 1200), 60);
        assert_eq!(away_secs(Some(" 45 "), 1200), 45);
        assert_eq!(away_secs(Some("5"), 1200), 5);
        assert_eq!(away_secs(Some("3600"), 1200), 3600);
        for bad in ["", "abc", "4", "3601", "-5", "1.5", "0", "99999999999999999999"] {
            assert_eq!(away_secs(Some(bad), 1200), 1200, "{bad}");
        }
    }

    #[test]
    fn a_slice_is_short_enough_to_notice_a_wake_and_long_enough_to_cost_nothing() {
        assert!(AWAY_SLICE >= Duration::from_secs(5) && AWAY_SLICE <= Duration::from_secs(60));
    }
}
