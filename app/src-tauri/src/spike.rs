//! A throw-away measurement of the two ways to show two pets (docs/plans/duo-render-spike.md). **Only on the branch exp/duo-prototype, never
//! on main, never in a release.** With `STREAKBOOM_SPIKE=s0|s1|s2|s3` the program skips its normal setup and opens only the windows of one
//! scenario, each showing the page `/spike` (a rig or two, no logic of the pet), and writes the phase it is in to `spike-phases.log` so that
//! an outside script can sample the memory and the processor of the process tree per phase.
//!
//!  - s0: one window, one pet (the baseline of a pet in its own WebView); a walk moves the window.
//!  - s1: one small window (400 by 200) with two pets; a walk moves the pets inside the window.
//!  - s2: two windows (200 by 200 each), one pet each; a walk moves each window.
//!  - s3: one window of the size of the screen ("the world window") with two pets; a walk moves the pets inside it.
//! Every window is click-through (`set_ignore_cursor_events`), so the computer stays usable; this is the best case of the hit test.

use std::{
    fs::OpenOptions,
    io::Write,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{App, Manager, PhysicalPosition, PhysicalSize, State, WebviewUrl, WebviewWindowBuilder};

const BROWSER_ARGS: &str = "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu";

pub struct SpikeState {
    phase: Arc<Mutex<String>>,
    log: PathBuf,
}

pub fn mode() -> Option<String> {
    std::env::var("STREAKBOOM_SPIKE").ok().filter(|m| matches!(m.as_str(), "s0" | "s1" | "s2" | "s3"))
}

fn now_ms() -> u128 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0)
}

/// The page tells which phase it is in; the mover thread and the script follow it.
#[tauri::command]
pub fn spike_phase(state: State<SpikeState>, name: String) {
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(&state.log) {
        let _ = writeln!(f, "{} {}", now_ms(), name);
    }
    *state.phase.lock().unwrap() = name;
}

pub fn setup(app: &mut App, mode: &str) -> Result<(), Box<dyn std::error::Error>> {
    let dir = app.path().app_data_dir()?;
    let _ = std::fs::create_dir_all(&dir);
    let log = dir.join("spike-phases.log");
    let _ = std::fs::remove_file(&log);
    let phase = Arc::new(Mutex::new(String::from("start")));
    app.manage(SpikeState { phase: phase.clone(), log });
    // the window made from the configuration loads the real page, which this scenario does not want: close it at once
    if let Some(main) = app.get_webview_window("main") {
        let monitor = main.primary_monitor()?.ok_or("no monitor")?;
        let (mp, ms, scale) = (*monitor.position(), *monitor.size(), monitor.scale_factor());
        let _ = main.destroy();
        let l = |v: f64| (v * scale).round() as u32;
        // (label, x, y, width, height) in physical px, and how many pets it shows
        let plan: Vec<(&str, i32, i32, u32, u32, u8, u8)> = match mode {
            "s0" => vec![("spike0", mp.x + 300, mp.y + 300, l(200.0), l(200.0), 1, 0)],
            "s1" => vec![("spike0", mp.x + 300, mp.y + 300, l(400.0), l(200.0), 2, 0)],
            "s2" => vec![("spike0", mp.x + 300, mp.y + 300, l(200.0), l(200.0), 1, 0), ("spike1", mp.x + 700, mp.y + 300, l(200.0), l(200.0), 1, 1)],
            _ => vec![("spike0", mp.x, mp.y, ms.width, ms.height, 2, 0)],
        };
        let mut movers = Vec::new();
        for (label, x, y, w, h, n, id) in plan {
            let url = format!("spike?m={mode}&n={n}&id={id}&w={}&h={}", (w as f64 / scale).round(), (h as f64 / scale).round());
            let win = WebviewWindowBuilder::new(app, label, WebviewUrl::App(url.into()))
                .title("Streakboom spike")
                .inner_size(w as f64 / scale, h as f64 / scale)
                .position(x as f64 / scale, y as f64 / scale)
                .decorations(false)
                .transparent(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .resizable(false)
                .shadow(false)
                .additional_browser_args(BROWSER_ARGS)
                .build()?;
            let _ = win.set_position(PhysicalPosition::new(x, y));
            let _ = win.set_size(PhysicalSize::new(w, h));
            let _ = win.set_ignore_cursor_events(true);
            movers.push((win, x, y));
        }
        // a walk moves the window itself only where the design is "a window per pet" (s0, s2); s1 and s3 move the pets inside the canvas
        if matches!(mode, "s0" | "s2") {
            std::thread::spawn(move || {
                let t0 = std::time::Instant::now();
                loop {
                    std::thread::sleep(Duration::from_millis(66)); // the walk tick of the real app
                    if *phase.lock().unwrap() != "walk" {
                        continue;
                    }
                    let t = t0.elapsed().as_secs_f64();
                    for (i, (win, x, y)) in movers.iter().enumerate() {
                        let dx = ((t * 1.3 + i as f64).sin() * 100.0 * scale) as i32;
                        let _ = win.set_position(PhysicalPosition::new(x + dx, *y));
                    }
                }
            });
        } else {
            std::mem::forget(movers);
        }
    }
    Ok(())
}
