mod brain;
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
        atomic::{AtomicBool, AtomicU64, Ordering},
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
    model: Mutex<Option<String>>,
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

// ------------------------------------------------------------ geometry helpers

/// The pet's offset and size inside its window, in physical px for a given scale factor.
fn pet_px(scale: f64) -> (i32, i32, i32) {
    (
        (PET_LEFT * scale).round() as i32,
        (PET_TOP * scale).round() as i32,
        (PET_SIZE * scale).round() as i32,
    )
}

/// Work area of the monitor containing the physical point, or of the nearest monitor.
fn area_at(win: &WebviewWindow, px: f64, py: f64) -> Option<Area> {
    let mons = win.available_monitors().ok()?;
    let mut best: Option<(f64, Area)> = None;
    for m in &mons {
        let (p, s) = (m.position(), m.size());
        let (x, y, r, b) = (p.x as f64, p.y as f64, p.x as f64 + s.width as f64, p.y as f64 + s.height as f64);
        let dx = if px < x { x - px } else if px >= r { px - r } else { 0.0 };
        let dy = if py < y { y - py } else if py >= b { py - b } else { 0.0 };
        let dist = dx.hypot(dy);
        let wa = m.work_area();
        let area = Area {
            x: wa.position.x,
            y: wa.position.y,
            r: wa.position.x + wa.size.width as i32,
            b: wa.position.y + wa.size.height as i32,
        };
        if best.is_none_or(|(d, _)| dist < d) {
            best = Some((dist, area));
        }
    }
    best.map(|(_, a)| a)
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

// ------------------------------------------------------------------- dragging

/// Start dragging the pet. We do the drag ourselves (instead of the OS drag) so the pet can be
/// clamped to the screen live: the OS lets a borderless window leave the screen.
#[tauri::command]
fn drag_start(window: WebviewWindow, state: State<AppState>) -> Result<(), String> {
    let cur = window.cursor_position().map_err(|e| e.to_string())?;
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    *state.drag.lock().unwrap() = DragStart { win_x: pos.x, win_y: pos.y, cur_x: cur.x, cur_y: cur.y };
    state.dragging.store(true, Ordering::Relaxed);
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
        .inner_size(480.0, 640.0)
        .min_inner_size(420.0, 440.0)
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

fn run_generate(state: &AppState, key: &str, system: &str, turns: &[Turn]) -> Result<String, AiError> {
    let model = current_model(state);
    match brain::generate(brain::API_BASE, key, &model, system, turns) {
        // The model name may not exist for this key: ask the API what it offers.
        Err(e) if e.kind == Kind::Model => {
            let list = brain::list_models(brain::API_BASE, key)?;
            let m = brain::pick_model_except(&list, &model).ok_or(e)?;
            *state.model.lock().unwrap() = Some(m.clone());
            brain::generate(brain::API_BASE, key, &m, system, turns)
        }
        // This model is overloaded or timing out (503 / no answer): switch to another one
        // instead of hammering the same model. A bad key or rate limit is never failed over.
        Err(e) if matches!(e.kind, Kind::Server | Kind::Network) => {
            let list = brain::list_models(brain::API_BASE, key).map_err(|_| e.clone())?;
            let m = brain::pick_model_except(&list, &model).ok_or_else(|| e.clone())?;
            let out = brain::generate(brain::API_BASE, key, &m, system, turns);
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

/// True when an API key is stored in the OS credential store.
#[tauri::command]
async fn brain_status() -> bool {
    tauri::async_runtime::spawn_blocking(|| brain::load_key().is_some())
        .await
        .unwrap_or(false)
}

#[derive(Serialize)]
struct ConnectOut {
    reply: String,
    model: String,
}

fn current_model(state: &AppState) -> String {
    state
        .model
        .lock()
        .unwrap()
        .clone()
        .unwrap_or_else(|| brain::DEFAULT_MODEL.to_string())
}

/// Validate a pasted key with one tiny request; store it only if Google accepts it.
/// `model` is the user's explicit choice (None = automatic). Returns the pet's first
/// AI-written line and the model that actually answered.
#[tauri::command]
async fn brain_connect(
    app: AppHandle,
    key: String,
    lang: String,
    tier: u8,
    gentle: bool,
    model: Option<String>,
) -> Result<ConnectOut, AiError> {
    let key = key.trim().to_string();
    if !brain::key_ok(&key) {
        return Err(AiError::new(Kind::InvalidKey, "format"));
    }
    let model = model.filter(|m| !m.is_empty());
    if model.as_deref().is_some_and(|m| !brain::model_ok(m)) {
        return Err(AiError::new(Kind::Model, "bad model name"));
    }
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AppState>();
        // A fresh connection starts from the user's choice, or from the automatic default.
        let previous = std::mem::replace(&mut *state.model.lock().unwrap(), model.clone());
        let turns = [Turn {
            role: "user".into(),
            text: brain::hello_prompt(&lang),
        }];
        let reply = match run_generate(&state, &key, &brain::persona(&lang, tier, gentle), &turns) {
            Ok(r) => r,
            Err(e) => {
                *state.model.lock().unwrap() = previous; // a failed attempt must not change a working setup
                return Err(e);
            }
        };
        brain::store_key(&key)?;
        {
            let mut prefs = state.prefs.lock().unwrap();
            prefs.model = model;
        }
        state.dirty.store(true, Ordering::Relaxed);
        Ok(ConnectOut {
            reply,
            model: current_model(&state),
        })
    })
    .await
    .map_err(|_| task_failed())?
}

/// Models the key can use for chat, best first. Uses `key` if given (while connecting),
/// otherwise the stored key (settings).
#[tauri::command]
async fn brain_models(key: Option<String>) -> Result<Vec<String>, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let key = match key.map(|k| k.trim().to_string()).filter(|k| !k.is_empty()) {
            Some(k) if brain::key_ok(&k) => k,
            Some(_) => return Err(AiError::new(Kind::InvalidKey, "format")),
            None => brain::load_key().ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?,
        };
        Ok(brain::chat_models(&brain::list_models(brain::API_BASE, &key)?))
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
    ModelInfo {
        model: current_model(&state),
        auto: state.prefs.lock().unwrap().model.is_none(),
    }
}

/// Change the model on purpose (`None` or empty = automatic).
#[tauri::command]
fn brain_set_model(state: State<AppState>, model: Option<String>) -> Result<String, AiError> {
    let model = model.filter(|m| !m.is_empty());
    if model.as_deref().is_some_and(|m| !brain::model_ok(m)) {
        return Err(AiError::new(Kind::Model, "bad model name"));
    }
    *state.model.lock().unwrap() = model.clone();
    state.prefs.lock().unwrap().model = model;
    state.dirty.store(true, Ordering::Relaxed);
    Ok(current_model(&state))
}

#[tauri::command]
async fn brain_chat(app: AppHandle, lang: String, tier: u8, gentle: bool, history: Vec<Turn>) -> Result<String, AiError> {
    tauri::async_runtime::spawn_blocking(move || {
        let key = brain::load_key().ok_or_else(|| AiError::new(Kind::InvalidKey, "no key"))?;
        let state = app.state::<AppState>();
        run_generate(&state, &key, &brain::persona(&lang, tier, gentle), &history)
    })
    .await
    .map_err(|_| task_failed())?
}

#[tauri::command]
async fn brain_forget() -> Result<(), AiError> {
    tauri::async_runtime::spawn_blocking(brain::delete_key)
        .await
        .map_err(|_| task_failed())?
}

/// Open Google AI Studio's key page in the default browser (fixed URL, nothing user-supplied).
#[tauri::command]
fn open_key_page(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    app.opener()
        .open_url("https://aistudio.google.com/apikey", None::<&str>)
        .map_err(|e| e.to_string())
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
        let mut last_flush = Instant::now();
        loop {
            let state = app.state::<AppState>();
            let mut delay = 150;
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
                    // While dragging the window follows the cursor and must keep receiving events.
                    let want_ignore = !inside && !state.dragging.load(Ordering::Relaxed);
                    if ignoring != Some(want_ignore) {
                        let _ = win.set_ignore_cursor_events(want_ignore);
                        ignoring = Some(want_ignore);
                    }
                }
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
                model: Mutex::new(prefs.model.clone().filter(|m| brain::model_ok(m))),
                path,
                hit: Mutex::new(Rect {
                    x: PET_LEFT,
                    y: PET_TOP,
                    w: PET_SIZE,
                    h: PET_SIZE,
                }),
                dirty: AtomicBool::new(false),
                last_self_move_ms: AtomicU64::new(now_ms()),
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
            save_memory,
            is_busy,
            brain_status,
            brain_connect,
            brain_models,
            brain_model,
            brain_set_model,
            brain_chat,
            brain_forget,
            open_key_page
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
