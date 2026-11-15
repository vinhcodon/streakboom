//! The screen picture sense, stage 1 (ADR-0119, `docs/plans/screen-picture-plan.md`): a very small grey picture of one monitor's work
//! area, taken only when the person has turned the experiment on in a Preview build, handed to the pet window once and dropped.
//! Never written, logged or sent. At most `GRID_W` by `GRID_H_MAX` cells, so small that no letter can be read from it.

/// The width of the grid in cells (a cell is about 10 by 10 physical px on a 1920 px screen; 384 was tried and refused, ADR-0121).
pub const GRID_W: u32 = 192;
/// The tallest the grid may be (a very tall work area is cut to this, not taken at more detail).
pub const GRID_H_MAX: u32 = 216;

/// The size of the grid for a work area of `w` by `h` physical px: `GRID_W` wide, the height in proportion, at least 1.
pub fn grid_dims(w: i32, h: i32) -> Option<(u32, u32)> {
    if w < 16 || h < 16 {
        return None;
    }
    let gh = ((GRID_W as f64) * (h as f64) / (w as f64)).round() as u32;
    Some((GRID_W, gh.clamp(1, GRID_H_MAX)))
}

/// Grey levels (0 to 255) from 32-bit pixels in the order blue, green, red, unused (what Windows gives): `0.299 R + 0.587 G + 0.114 B`.
pub fn gray_from_bgra(buf: &[u8]) -> Vec<u8> {
    buf.chunks_exact(4).map(|p| ((299 * p[2] as u32 + 587 * p[1] as u32 + 114 * p[0] as u32) / 1000) as u8).collect()
}

/// Take the picture: the screen rectangle (`x`, `y`, `w`, `h`, physical px) reduced by Windows itself (`StretchBlt`, halftone) into
/// a `gw` by `gh` bitmap and read as grey. Windows layered windows are left out (no `CAPTUREBLT`), and Peak's own windows are
/// layered, so Peak is not in its own picture. `None` on any failure; elsewhere than Windows always `None`.
#[cfg(windows)]
pub fn capture_gray(x: i32, y: i32, w: i32, h: i32, gw: u32, gh: u32) -> Option<Vec<u8>> {
    capture_gray_with(x, y, w, h, gw, gh, false)
}

/// `include_layered`: also take the layered windows (`CAPTUREBLT`). Only the diagnostic test below uses it, to find out whether Peak's own
/// transparent windows are in the picture or not.
#[cfg(windows)]
pub fn capture_gray_with(x: i32, y: i32, w: i32, h: i32, gw: u32, gh: u32, include_layered: bool) -> Option<Vec<u8>> {
    use std::ptr::{null, null_mut};
    use windows_sys::Win32::Graphics::Gdi::{
        CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits, ReleaseDC, SelectObject, SetBrushOrgEx,
        SetStretchBltMode, StretchBlt, CAPTUREBLT, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HALFTONE, SRCCOPY,
    };
    if w < 16 || h < 16 || gw == 0 || gh == 0 {
        return None;
    }
    unsafe {
        let screen = GetDC(null_mut());
        if screen.is_null() {
            return None;
        }
        let mem = CreateCompatibleDC(screen);
        let bmp = CreateCompatibleBitmap(screen, gw as i32, gh as i32);
        let mut out = None;
        if !mem.is_null() && !bmp.is_null() {
            let old = SelectObject(mem, bmp as _);
            SetStretchBltMode(mem, HALFTONE as _);
            SetBrushOrgEx(mem, 0, 0, null_mut());
            let rop = if include_layered { SRCCOPY | CAPTUREBLT } else { SRCCOPY };
            let ok = StretchBlt(mem, 0, 0, gw as i32, gh as i32, screen, x, y, w, h, rop);
            let mut info: BITMAPINFO = std::mem::zeroed();
            info.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
            info.bmiHeader.biWidth = gw as i32;
            info.bmiHeader.biHeight = -(gh as i32); // top-down
            info.bmiHeader.biPlanes = 1;
            info.bmiHeader.biBitCount = 32;
            info.bmiHeader.biCompression = BI_RGB;
            let mut buf = vec![0u8; (gw * gh * 4) as usize];
            let lines = GetDIBits(mem, bmp, 0, gh, buf.as_mut_ptr() as _, &mut info, DIB_RGB_COLORS);
            if ok != 0 && lines != 0 {
                out = Some(gray_from_bgra(&buf));
            }
            SelectObject(mem, old);
        }
        if !bmp.is_null() {
            DeleteObject(bmp as _);
        }
        if !mem.is_null() {
            DeleteDC(mem);
        }
        ReleaseDC(null_mut(), screen);
        let _ = null::<u8>();
        out
    }
}

/// Take Peak's own windows out of any capture (`WDA_EXCLUDEFROMCAPTURE`) or put them back (`WDA_NONE`). Found on 2026-11-15: a transparent
/// window of ours is **in** the usual picture (the terrain overlay saw its own tints and lines), so the windows are left out for the moment
/// of the capture only; they stay visible on the monitor all the time. Windows 10 version 2004 or later; a failure changes nothing.
#[cfg(windows)]
pub fn set_capture_exclusion(hwnds: &[isize], exclude: bool) {
    use windows_sys::Win32::UI::WindowsAndMessaging::SetWindowDisplayAffinity;
    for &h in hwnds {
        unsafe {
            SetWindowDisplayAffinity(h as _, if exclude { 0x11 } else { 0 });
        }
    }
}

#[cfg(not(windows))]
pub fn set_capture_exclusion(_hwnds: &[isize], _exclude: bool) {}

#[cfg(not(windows))]
pub fn capture_gray_with(_x: i32, _y: i32, _w: i32, _h: i32, _gw: u32, _gh: u32, _include_layered: bool) -> Option<Vec<u8>> {
    None
}

#[cfg(not(windows))]
pub fn capture_gray(_x: i32, _y: i32, _w: i32, _h: i32, _gw: u32, _gh: u32) -> Option<Vec<u8>> {
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_grid_is_small_and_in_proportion() {
        assert_eq!(grid_dims(1920, 1080), Some((192, 108)));
        assert_eq!(grid_dims(2560, 1440), Some((192, 108)));
        assert_eq!(grid_dims(1920, 1040), Some((192, 104)));
        assert_eq!(grid_dims(1000, 100000).map(|d| d.1), Some(GRID_H_MAX));
        assert_eq!(grid_dims(15, 1080), None);
        assert_eq!(grid_dims(1920, 4), None);
        let (w, h) = grid_dims(3840, 2160).unwrap();
        assert!(w * h <= GRID_W * GRID_H_MAX, "never more cells than the limit");
    }

    #[test]
    fn grey_is_taken_from_blue_green_red_pixels() {
        // blue, green, red, unused
        assert_eq!(gray_from_bgra(&[0, 0, 0, 0, 255, 255, 255, 0]), vec![0, 255]);
        assert_eq!(gray_from_bgra(&[0, 0, 255, 0]), vec![76]); // pure red
        assert_eq!(gray_from_bgra(&[0, 255, 0, 0]), vec![149]); // pure green
        assert_eq!(gray_from_bgra(&[255, 0, 0, 0]), vec![29]); // pure blue
        assert!(gray_from_bgra(&[1, 2, 3]).is_empty(), "a partial pixel is dropped");
    }

    /// Is Peak's own transparent window (the terrain overlay) in the picture? The same screen is taken without and with the layered windows
    /// and only two numbers are printed: if they differ a lot while the overlay is open, the overlay is left out of the usual picture (good);
    /// if they are equal, the overlay is in the usual picture too (it would see its own tints). Run by hand with the overlay open.
    #[test]
    #[ignore]
    fn the_overlay_is_or_is_not_in_the_picture() {
        let (gw, gh) = grid_dims(1920, 1080).unwrap();
        let usual = capture_gray(0, 0, 1920, 1080, gw, gh).expect("usual");
        let layered = capture_gray_with(0, 0, 1920, 1080, gw, gh, true).expect("with layered");
        let differing = usual.iter().zip(&layered).filter(|(a, b)| (**a as i32 - **b as i32).abs() >= 6).count();
        let mean_diff = usual.iter().zip(&layered).map(|(a, b)| (*a as i32 - *b as i32).unsigned_abs() as u64).sum::<u64>() as f64 / usual.len() as f64;
        println!("cells differing by 6 or more: {} of {}; mean difference {:.2}", differing, usual.len(), mean_diff);
    }

    /// The check of ADR-0121: writes the grid of the real screen to the file named in STREAKBOOM_GRID_OUT (raw grey bytes, row by row), once,
    /// so that the author and the session can look at it and see whether any word can be made out. Never run by CI; the file is the
    /// caller's to delete.
    #[test]
    #[ignore]
    fn the_grid_can_be_written_once_to_look_at() {
        let out = std::env::var("STREAKBOOM_GRID_OUT").expect("set STREAKBOOM_GRID_OUT");
        let (gw, gh) = (384, 216); // the size that was tried in ADR-0121; the check is to look at it
        let g = capture_gray(0, 0, 1920, 1080, gw, gh).expect("the screen could be read");
        std::fs::write(&out, &g).unwrap();
        println!("wrote {gw}x{gh} grey values");
    }

    /// Looks at the real screen once and prints only three numbers (never the picture): run by hand with `-- --ignored --nocapture`.
    #[test]
    #[ignore]
    fn the_real_screen_gives_a_grid_that_is_not_empty() {
        let (gw, gh) = grid_dims(1920, 1080).unwrap();
        let g = capture_gray(0, 0, 1920, 1080, gw, gh).expect("the screen could be read");
        assert_eq!(g.len() as u32, gw * gh);
        let (min, max) = (*g.iter().min().unwrap(), *g.iter().max().unwrap());
        let mean = g.iter().map(|&v| v as u64).sum::<u64>() / g.len() as u64;
        println!("grid {gw}x{gh}: min {min}, max {max}, mean {mean}");
        assert!(max > min, "a screen is not one flat grey");
    }

    // PS-9: the privacy checks of the picture. The picture is built in memory, returned to the page and dropped; these tests read the
    // source so that a later change that writes, logs or sends it fails here.
    const FORBIDDEN: [&str; 12] = ["std::fs", "File::", "OpenOptions", "TcpStream", "UdpSocket", "reqwest", "ureq", "hyper", "println!", "eprintln!", "dbg!", "append_trace"];

    fn before_tests(src: &str) -> &str {
        src.split("#[cfg(test)]").next().unwrap_or(src)
    }

    #[test]
    fn the_picture_module_writes_logs_and_sends_nothing() {
        let src = before_tests(include_str!("picture.rs"));
        for bad in FORBIDDEN {
            assert!(!src.contains(bad), "picture.rs must not use {bad}: the picture is never saved, logged or sent");
        }
        assert!(!src.contains(".emit"), "picture.rs must not emit the picture to any window");
    }

    #[test]
    fn the_screen_grid_command_only_returns_the_grid() {
        let lib = include_str!("lib.rs");
        let start = lib.find("async fn screen_grid").expect("screen_grid exists");
        let rest = &lib[start..];
        let end = rest.find("
}").unwrap_or(rest.len()); // the function ends at its closing brace in column 0
        let body = &rest[..end];
        for bad in FORBIDDEN.iter().chain(["emit", "emit_to"].iter()) {
            assert!(!body.contains(bad), "screen_grid must not use {bad}");
        }
        assert!(body.contains("picture_allowed"), "screen_grid asks the gate first");
    }

    #[test]
    fn the_picture_is_taken_only_on_the_persons_switch_or_the_test_switch_of_a_test_build() {
        use crate::picture_gate;
        assert!(!picture_gate(false, false, false), "nothing on: no picture");
        assert!(!picture_gate(false, true, false), "the tray switch alone does nothing in a Stable build");
        assert!(picture_gate(true, false, false), "the person's switch works in a Stable build");
        assert!(picture_gate(false, true, true), "the tray switch works in a test build");
        assert!(!picture_gate(false, false, true), "a test build is off until a switch is on");
        assert!(picture_gate(true, false, true));
    }
}
