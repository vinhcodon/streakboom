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

/// Take the picture: the screen rectangle (`x`, `y`, `w`, `h`, physical px) reduced by the system to a `gw` by `gh` bitmap and read as grey; Peak's own
/// windows are left out of it (`set_capture_exclusion`). `None` on any failure. The calls to the system are in `platform` (ADR-0132).
pub fn capture_gray(x: i32, y: i32, w: i32, h: i32, gw: u32, gh: u32) -> Option<Vec<u8>> {
    capture_gray_with(x, y, w, h, gw, gh, false)
}

pub use crate::platform::{capture_gray_with, set_capture_exclusion};

/// A capture that is black everywhere (a locked screen, the secure desktop of an elevation prompt, a remote session without a display, a
/// program that blocks capture) says nothing about the screen: it must not be taken for an empty screen (PS-10). A real screen, even a dark
/// one, has at least a little change; an all-zero or near-zero picture is a failed capture.
pub fn looks_failed(grey: &[u8]) -> bool {
    grey.is_empty() || grey.iter().all(|&v| v <= 2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_black_or_empty_capture_is_a_failed_capture() {
        assert!(looks_failed(&[]));
        assert!(looks_failed(&vec![0u8; 192 * 108]));
        assert!(looks_failed(&vec![2u8; 100]));
        let mut dark = vec![10u8; 192 * 108];
        assert!(!looks_failed(&dark), "a dark screen with some light in it is a screen");
        dark[5] = 0;
        assert!(!looks_failed(&dark));
    }

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
    fn the_height_is_108_only_on_a_16_9_screen_and_never_above_the_limit() {
        // ADR-0128's text said 'at most 192 by 108'; the grid is 192 wide and as tall as the screen's shape asks, up to GRID_H_MAX (issue 2)
        assert_eq!(grid_dims(1366, 768), Some((192, 108)));
        assert_eq!(grid_dims(1920, 1200), Some((192, 120)));
        assert_eq!(grid_dims(1280, 1024), Some((192, 154)));
        assert_eq!(grid_dims(1080, 1920), Some((192, GRID_H_MAX)));
        assert!(grid_dims(1280, 1024).unwrap().1 > 108);
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
        // the picture is built in picture.rs and taken in the platform files (ADR-0132): all of them are checked
        for (name, text) in [("picture.rs", include_str!("picture.rs")), ("platform/windows.rs", include_str!("platform/windows.rs")), ("platform/macos.rs", include_str!("platform/macos.rs"))] {
            let src = before_tests(text);
            for bad in FORBIDDEN {
                assert!(!src.contains(bad), "{name} must not use {bad}: the picture is never saved, logged or sent");
            }
            assert!(!src.contains(".emit"), "{name} must not emit the picture to any window");
        }
    }

    #[test]
    fn the_screen_grid_command_only_returns_the_grid() {
        let lib = include_str!("lib.rs");
        let start = lib.find("async fn screen_grid").expect("screen_grid exists");
        let rest = &lib[start..];
        let end = rest.find("
}").unwrap_or(rest.len()); // the function ends at its closing brace in column 0
        let body = &rest[..end];
        // the only notes it may write are the two numbers-and-fixed-words lines of the test traces (a Preview or developer build), never the picture
        for line in body.lines().filter(|l| l.contains("append_trace")) {
            for bad in ["data", "with", "grid", "own_cells"] {
                assert!(!line.contains(bad), "a trace line of screen_grid must not hold {bad}: {line}");
            }
        }
        for bad in FORBIDDEN.iter().filter(|b| **b != "append_trace").chain(["emit", "emit_to"].iter()) {
            assert!(!body.contains(bad), "screen_grid must not use {bad}");
        }
        assert!(body.contains("picture_allowed"), "screen_grid asks the gate first");
        assert!(body.contains("busy_now"), "no capture while the person is in a full-screen program, presenting or away");
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

    /// PS-10: what one picture costs. `cargo test --release the_capture_costs -- --ignored --nocapture` takes the real screen 30 times and prints
    /// the mean and the worst in milliseconds (the 60 ms wait for the composition in `screen_grid` is on top of it).
    #[test]
    #[ignore]
    #[cfg(windows)]
    fn the_capture_costs() {
        let (w, h) = (1920, 1080);
        let (gw, gh) = grid_dims(w, h).unwrap();
        let mut worst = 0u128;
        let t0 = std::time::Instant::now();
        for _ in 0..30 {
            let t = std::time::Instant::now();
            let g = capture_gray(0, 0, w, h, gw, gh);
            worst = worst.max(t.elapsed().as_micros());
            assert!(g.is_some());
        }
        println!("capture: mean {:.2} ms, worst {:.2} ms over 30", t0.elapsed().as_micros() as f64 / 30000.0, worst as f64 / 1000.0);
    }
}
