//! The boundary between the pet and the operating system (ADR-0132; `docs/plans/repo-structure-proposal.md`).
//!
//! The page (TypeScript) never calls the system: it asks Rust through Tauri commands, and the commands reach the system only through the
//! functions below. **One file per platform with the same names**: `windows.rs` (the Win32 code), `macos.rs` (stubs that return "unknown"
//! until the spike replaces them). The rest of the Rust code (`lib.rs`, `ground.rs`, `picture.rs`, the brains, the layout) is shared.
//!
//! The contract, in the order of `windows.rs`:
//! - `busy_now() -> bool`: the person is in a full-screen program, presenting, or away (the session locked).
//! - `primary_button_raw() -> i16`: the state of the button the person clicks with (negative: down); 0 where it cannot be read.
//! - `last_input_idle_ms() -> Option<u32>`: milliseconds since the last keyboard or mouse input; None where unknown. One number, no key identity.
//! - `timer_period(begin)`: ask for a finer system timer while a flight runs, and give it back.
//! - `pointer_pos() -> Option<(i32, i32)>`, `window_rect_of(hwnd) -> Option<(i32, i32, i32, i32)>`: the pointer's position, and the rectangle of one of the program's own visible windows; read by the fine sampler near Peak (ADR-0135, a test build only for now).
//! - `precise_sleep(ms)`: sleep with a timer of the calling thread that keeps a short period (8 ms) without a finer system timer for the whole program.
//! - `show_without_activating(window)`: show a window without taking the keyboard focus.
//! - `ground_of_point(x, y) -> Ground`: the **kind** of thing at a physical point (the desktop, the taskbar, a window, the window in front, Peak itself), never what it is.
//! - `window_id_at(x, y) -> u64`, `window_holds(id, x, y) -> bool`: an opaque number for the ordinary window at a point, and whether it is still there.
//! - `cover_at(own, x, y) -> bool`, `raise_own(own)`: a window that sits over Peak and cannot be raised over, and raising Peak to the top of its layer.
//! - `capture_gray_with(x, y, w, h, gw, gh, include_layered) -> Option<Vec<u8>>`: a grey picture of a rectangle of the screen reduced to `gw` by `gh`; None on any failure.
//! - `set_capture_exclusion(windows, exclude) -> Option<u32>`: leave Peak's own windows out of a capture, for the instant of it; `Some(error)` when the platform refuses.
//!
//! A change here that touches what the program reads from the system is a decision (the privacy contract, ADR-0031); the privacy tests read
//! these files as well as `picture.rs`.

#[cfg(windows)]
mod windows;
#[cfg(windows)]
pub use windows::*;

#[cfg(not(windows))]
mod macos;
#[cfg(not(windows))]
pub use macos::*;

// The stub file is compiled and tried on every platform (not only where it is used), and the two files must offer the same names, so that
// a function added for Windows cannot be forgotten for the others (ADR-0132).
#[cfg(all(test, windows))]
#[path = "macos.rs"]
#[allow(dead_code)]
mod macos_stubs;

#[cfg(test)]
mod tests {
    fn pub_fns(src: &str) -> Vec<String> {
        let mut v: Vec<String> = src
            .lines()
            .filter_map(|l| l.strip_prefix("pub fn "))
            .map(|l| l.split(|c: char| c == '(' || c == '<').next().unwrap_or("").to_string())
            .collect();
        v.sort();
        v
    }

    #[test]
    fn the_platform_files_offer_the_same_functions() {
        let win = pub_fns(include_str!("windows.rs"));
        let other = pub_fns(include_str!("macos.rs"));
        assert!(win.len() >= 15, "the contract has at least fifteen functions: {win:?}");
        assert_eq!(win, other, "windows.rs and macos.rs must have the same pub fn names");
    }

    #[cfg(windows)]
    #[test]
    fn the_stubs_say_unknown_and_nothing_more() {
        use super::macos_stubs as s;
        assert!(!s::busy_now());
        assert_eq!(s::primary_button_raw(), 0);
        assert_eq!(s::last_input_idle_ms(), None);
        s::timer_period(true);
        s::timer_period(false);
        assert_eq!(s::pointer_pos(), None);
        s::precise_sleep(1);
        assert_eq!(s::window_rect_of(5), None);
        assert_eq!(s::ground_of_point(1, 1), crate::ground::Ground::Unknown);
        assert_eq!(s::window_id_at(1, 1), 0);
        assert!(s::window_holds(5, 1, 1));
        assert!(!s::cover_at(0, 1, 1));
        s::raise_own(0);
        assert_eq!(s::capture_gray_with(0, 0, 100, 100, 10, 10, false), None);
        assert!(s::set_capture_exclusion(&[], true).is_some(), "no picture where the windows cannot be left out");
    }
}
