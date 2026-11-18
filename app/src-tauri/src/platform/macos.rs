//! The boundary with the operating system for every platform that is not Windows (ADR-0132). It begins as **stubs with the same names as
//! `windows.rs`**: they return "unknown" and nothing else, so that the program builds and the pet runs without senses (it stands where it is,
//! the page treats the unknown as the page always has). The macOS spike replaces them one by one, each with its permission text and an ADR
//! (docs/plans/repo-structure-proposal.md, stage 5). Linux, which is not a target, builds with the same stubs.

use crate::ground::Ground;
use tauri::WebviewWindow;

pub fn busy_now() -> bool {
    false
}

pub fn primary_button_raw() -> i16 {
    0
}

pub fn last_input_idle_ms() -> Option<u32> {
    None
}

pub fn timer_period(_begin: bool) {}

pub fn precise_sleep(ms: u64) {
    std::thread::sleep(std::time::Duration::from_millis(ms));
}

pub fn pointer_pos() -> Option<(i32, i32)> {
    None
}

pub fn window_rect_of(_hwnd: isize) -> Option<(i32, i32, i32, i32)> {
    None
}

pub fn show_without_activating(win: &WebviewWindow) {
    let _ = win.show();
}

pub fn ground_of_point(_x: i32, _y: i32) -> Ground {
    Ground::Unknown
}

pub fn window_id_at(_x: i32, _y: i32) -> u64 {
    0
}

pub fn window_holds(_id: u64, _x: i32, _y: i32) -> bool {
    true
}

pub fn cover_at(_own: isize, _x: i32, _y: i32) -> bool {
    false
}

pub fn raise_own(_own: isize) {}

pub fn capture_gray_with(_x: i32, _y: i32, _w: i32, _h: i32, _gw: u32, _gh: u32, _include_layered: bool) -> Option<Vec<u8>> {
    None
}

/// `Some(code)`: the windows could not be left out of the picture, so none is given (there is no picture on this platform yet).
pub fn set_capture_exclusion(_hwnds: &[isize], _exclude: bool) -> Option<u32> {
    Some(0)
}
