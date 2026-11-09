mod brain;
mod claude;
mod groq;
mod openai;
mod layout;
mod updater;

use brain::{AiError, Kind, Turn};
use layout::Area;
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
    #[serde(default)]
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
    /// Which part of the settings window to scroll to when it opens ("brain"). A window URL
    /// with a query string is not reliable across dev and release, so the page asks for it.
    settings_section: Mutex<Option<String>>,
    /// Bumped whenever the bubble is shown or hidden; lets the delayed "destroy when idle"
    /// know whether the bubble was used again in the meantime.
    bubble_gen: AtomicU64,
    /// Latest focus-safety readings (spec/06 section 3.2, ADR-0029), written by the hit-test thread (which
    /// already wakes every 30 to 150 ms and already reads the pointer) and read by `focus_probe`.
    /// `u32::MAX` = the idle time is unknown; the offsets are `f64` bits.
    focus_idle_ms: AtomicU32,
    focus_dx: AtomicU64,
    focus_dy: AtomicU64,
    /// The pointer reading is valid (the pet window is visible and the pointer was read).
    focus_ptr: AtomicBool,
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
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::Shell::SHQueryUserNotificationState;
        let mut st: i32 = 0;
        let hr = unsafe { SHQueryUserNotificationState(&mut st) };
        // 1 not present, 2 busy (fullscreen), 3 D3D fullscreen, 4 presentation mode
        hr >= 0 && (1..=4).contains(&st)
    }
    #[cfg(not(windows))]
    {
        false
    }
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
}

/// Where and how long ago the user last clicked away from the cat (logical px of the screen).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ClickInfo {
    x: f64,
    y: f64,
    age_ms: u64,
}

/// The raw state of the primary mouse button, the one the user clicks with (`GetAsyncKeyState`), 0 where it cannot be
/// read. The physical right button when Windows has the buttons swapped (see `layout::primary_button_vk`).
fn primary_button_raw() -> i16 {
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::GetAsyncKeyState;
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_SWAPBUTTON};
        // SAFETY: plain queries of one system metric and one virtual-key code; no pointers.
        unsafe { GetAsyncKeyState(layout::primary_button_vk(GetSystemMetrics(SM_SWAPBUTTON) != 0)) }
    }
    #[cfg(not(windows))]
    {
        0
    }
}

/// Milliseconds since the last user input (Windows: `GetLastInputInfo`). None elsewhere or on failure.
fn last_input_idle_ms() -> Option<u32> {
    #[cfg(windows)]
    {
        use windows_sys::Win32::System::SystemInformation::GetTickCount;
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
        let mut li = LASTINPUTINFO { cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32, dwTime: 0 };
        // SAFETY: `li` is a valid LASTINPUTINFO with its size set, as the call requires.
        if unsafe { GetLastInputInfo(&mut li) } == 0 {
            return None;
        }
        Some(layout::idle_since(unsafe { GetTickCount() }, li.dwTime))
    }
    #[cfg(not(windows))]
    {
        None
    }
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

/// Ask Windows for a 1 ms system timer while a flight runs (`begin`), and give it back after.
fn timer_period(begin: bool) {
    #[cfg(windows)]
    {
        use windows_sys::Win32::Media::{timeBeginPeriod, timeEndPeriod};
        // SAFETY: plain calls with a period in ms; every begin is paired with an end.
        unsafe {
            if begin {
                timeBeginPeriod(1);
            } else {
                timeEndPeriod(1);
            }
        }
    }
    #[cfg(not(windows))]
    let _ = begin;
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
fn place_bubble(app: &AppHandle) {
    let state = app.state::<AppState>();
    let b = *state.bubble.lock().unwrap();
    if !b.visible {
        return;
    }
    let (Some(main), Some(bubble)) = (app.get_webview_window("main"), app.get_webview_window("bubble")) else {
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
        let _ = bubble.show();
    }
    if focus && interactive {
        let _ = bubble.set_focus();
    }
}

#[tauri::command]
fn bubble_hide(app: AppHandle, state: State<AppState>) {
    state.bubble.lock().unwrap().visible = false;
    if let Some(bubble) = app.get_webview_window("bubble") {
        let _ = bubble.hide();
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
fn open_settings_window(app: &AppHandle, section: Option<&str>) {
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

/// Right-click menu on the pet. Labels come from the frontend so they follow the language.
#[tauri::command]
fn show_pet_menu(app: AppHandle, window: WebviewWindow, state: State<AppState>, labels: Vec<String>) -> Result<(), String> {
    let quiet = state.prefs.lock().unwrap().quiet;
    let label = |i: usize, d: &str| labels.get(i).cloned().unwrap_or_else(|| d.to_string());
    let settings = MenuItem::with_id(&app, "pm_settings", label(0, "Settings…"), true, None::<&str>).map_err(|e| e.to_string())?;
    let quiet_item = CheckMenuItem::with_id(&app, "pm_quiet", label(1, "Quiet mode"), true, quiet, None::<&str>).map_err(|e| e.to_string())?;
    let quit = MenuItem::with_id(&app, "pm_quit", label(2, "Quit"), true, None::<&str>).map_err(|e| e.to_string())?;
    let menu = Menu::with_items(&app, &[&settings, &quiet_item, &quit]).map_err(|e| e.to_string())?;
    // test builds only (cargo feature `hop-test`): items to try the hops and the fall
    #[cfg(feature = "hop-test")]
    for (id, text) in [("pm_hop_up", "Test: hop up"), ("pm_hop_down", "Test: hop down"), ("pm_fall", "Test: fall")] {
        let item = MenuItem::with_id(&app, id, text, true, None::<&str>).map_err(|e| e.to_string())?;
        menu.append(&item).map_err(|e| e.to_string())?;
    }
    window.popup_menu(&menu).map_err(|e| e.to_string())
}

/// Switch quiet mode (tray or pet menu): persist, tell the frontend, sync the tray check mark.
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
        brain::Provider::Groq => prefs.groq_model.clone(),
        brain::Provider::Claude => prefs.claude_model.clone(),
        brain::Provider::OpenAI => prefs.openai_model.clone(),
    }
}

fn set_prefs_model(prefs: &mut Prefs, p: brain::Provider, model: Option<String>) {
    match p {
        brain::Provider::Gemini => prefs.model = model,
        brain::Provider::Groq => prefs.groq_model = model,
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
    groq: bool,
    claude: bool,
    openai: bool,
}

fn provider_info(state: &AppState) -> ProviderInfo {
    ProviderInfo {
        active: active(state).id().to_string(),
        gemini: brain::load_key(brain::Provider::Gemini).is_some(),
        groq: brain::load_key(brain::Provider::Groq).is_some(),
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
    let model = prefs_model(&state.prefs.lock().unwrap(), p).filter(|m| brain::model_ok_for(p, m));
    *state.model.lock().unwrap() = model;
    state.prefs.lock().unwrap().provider = Some(p.id().to_string());
    state.dirty.store(true, Ordering::Relaxed);
}

#[tauri::command]
async fn brain_provider(app: AppHandle) -> ProviderInfo {
    tauri::async_runtime::spawn_blocking(move || provider_info(&app.state::<AppState>()))
        .await
        .unwrap_or(ProviderInfo { active: "gemini".into(), gemini: false, groq: false, claude: false, openai: false })
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
        if model.as_deref().is_some_and(|m| !brain::model_ok_for(p, m)) {
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
    if model.as_deref().is_some_and(|m| !brain::model_ok_for(p, m)) {
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
) -> Result<ChatReply, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        let key = brain::load_key(active(&state)).ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?;
        let system = brain::persona_with(&lang, tier, gentle, known.as_deref().unwrap_or(&[]), follow_user.unwrap_or(false));
        let raw = run_generate(&state, &key, &system, &history)?;
        let (text, mood) = brain::split_mood(&raw);
        Ok(ChatReply { text, mood })
    })
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
        let mut last_flush = Instant::now();
        loop {
            let state = app.state::<AppState>();
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

// ---------------------------------------------------------------------- tray

fn toggle_visibility(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
            // the bubble belongs to the pet: hide it too
            bubble_hide(app.clone(), app.state::<AppState>());
        } else {
            let _ = win.show();
        }
    }
}

fn build_tray(app: &AppHandle, quiet: bool) -> tauri::Result<()> {
    let toggle = MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?;
    let quiet_item = CheckMenuItem::with_id(app, "quiet", "Quiet mode", true, quiet, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&toggle, &settings, &quiet_item, &quit])?;
    let quiet_ref = quiet_item.clone();
    *app.state::<AppState>().quiet_item.lock().unwrap() = Some(quiet_item.clone());

    let mut builder = TrayIconBuilder::with_id("tray")
        .tooltip("Streakboom")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "toggle" => toggle_visibility(app),
            "settings" => open_settings_async(app),
            "quiet" => set_quiet(app, quiet_ref.is_checked().unwrap_or(false)),
            "quit" => quit_app(app),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_visibility(tray.app_handle());
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
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Starting with Windows is the user's choice (Settings, or the one-time question from the pet).
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .manage(updater::PendingUpdate::default())
        .setup(|app| {
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
                    prefs_model(&prefs, p).filter(|m| brain::model_ok_for(p, m))
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
                settings_section: Mutex::new(None),
                bubble_gen: AtomicU64::new(0),
            });

            let win = app.get_webview_window("main").expect("main window");
            let _ = win.set_size(LogicalSize::new(WIN_W, WIN_H));
            place_window(&win, &prefs);
            build_tray(app.handle(), prefs.quiet)?;

            // The speech bubble window is created on demand (see `bubble_ensure`), not here: a
            // webview costs about 35 MB and the bubble is hidden most of the time.
            let _ = win.show();
            spawn_hit_test(app.handle().clone(), win);
            Ok(())
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "pm_settings" => open_settings_async(app),
            "pm_quiet" => {
                let q = app.state::<AppState>().prefs.lock().unwrap().quiet;
                set_quiet(app, !q);
            }
            "pm_quit" => quit_app(app),
            #[cfg(feature = "hop-test")]
            id @ ("pm_hop_up" | "pm_hop_down" | "pm_fall") => {
                let _ = app.emit("dev-hop", id);
            }
            _ => {}
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
            set_hit_rect,
            get_prefs,
            move_by,
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
            show_pet_menu,
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
