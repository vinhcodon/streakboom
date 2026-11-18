//! What Peak stands over (spec/08 section 4, ADR-0031 decision 2): the **kind** of thing under a few points, never what it
//! is. Categories only: the bare desktop, the taskbar, an app window, the window in front. No title, no process, no
//! application name and no window list is read or kept: a window class is looked at only to tell the desktop and the
//! taskbar from "a window", and is dropped at once.
//!
//! The pure parts (the categories, which class means what, the points under the cat, how several points make one answer) are
//! here with tests; the part that asks Windows for the topmost window at a point is `ground_of_point` (Windows only).

use serde::Serialize;

// The calls to the system are in `platform` (ADR-0132); they are re-exported here so that the callers are unchanged.
pub use crate::platform::{cover_at, ground_of_point, raise_own, window_holds, window_id_at};

/// The kind of thing at a point of the screen.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Ground {
    /// The bare desktop (nothing in front of the wallpaper).
    Desktop,
    /// The taskbar.
    Taskbar,
    /// A window that is not the one in front.
    App,
    /// The window in front (the one the user is working in).
    Foreground,
    /// Peak's own window answered (it is not click-through at this moment): try again later.
    Own,
    /// Could not be told (no window found, or not Windows).
    Unknown,
}

/// What the class of a top-level window says: the desktop or the taskbar, or nothing special (`None`: an ordinary window).
pub fn class_ground(class: &str) -> Option<Ground> {
    match class {
        // the shell windows that draw the desktop
        "Progman" | "WorkerW" => Some(Ground::Desktop),
        // the taskbar of the primary monitor and of the others
        "Shell_TrayWnd" | "Shell_SecondaryTrayWnd" => Some(Ground::Taskbar),
        _ => None,
    }
}

/// How many pixels below the cat's feet the "ground" is looked at.
pub const BELOW_PX: i32 = 4;

/// The points that say what the cat stands over, in physical px: just below its left foot, its middle and its right
/// foot. `win_x` and `win_y` are the pet window's top-left; the cat is a `size` square at `(left, top)` inside it.
pub fn feet_points(win_x: i32, win_y: i32, left: i32, top: i32, size: i32) -> [(i32, i32); 3] {
    let y = win_y + top + size + BELOW_PX;
    let x0 = win_x + left;
    [(x0 + size / 5, y), (x0 + size / 2, y), (x0 + size * 4 / 5, y)]
}

/// One answer from several points: the most common kind (the unknown and the own window do not vote unless nothing else
/// answered); a tie goes to the window in front, then a window, then the taskbar, then the desktop, because the cat is
/// most likely to be in the way of the user's work in that order.
pub fn standing_on(points: &[Ground]) -> Ground {
    let rank = |g: Ground| match g {
        Ground::Foreground => 4,
        Ground::App => 3,
        Ground::Taskbar => 2,
        Ground::Desktop => 1,
        _ => 0,
    };
    let mut counts = [0usize; 5];
    for g in points {
        let r = rank(*g);
        if r > 0 {
            counts[r] += 1;
        }
    }
    if counts.iter().all(|c| *c == 0) {
        return if points.contains(&Ground::Own) { Ground::Own } else { Ground::Unknown };
    }
    // the most votes; on a tie the first of the order Foreground, App, Taskbar, Desktop (the strictly greater count wins)
    let (mut best, mut best_count) = (1, 0);
    for r in (1..=4).rev() {
        if counts[r] > best_count {
            best = r;
            best_count = counts[r];
        }
    }
    match best {
        4 => Ground::Foreground,
        3 => Ground::App,
        2 => Ground::Taskbar,
        _ => Ground::Desktop,
    }
}

/// The kind at a point and, for an ordinary window, an opaque number for it (0 otherwise): one cell of the ground map with
/// regions (spec/10). The number is the system's handle, compared only inside one map and then dropped.
pub fn cell_at(x: i32, y: i32) -> (Ground, u64) {
    let g = ground_of_point(x, y);
    let id = if matches!(g, Ground::App | Ground::Foreground) { window_id_at(x, y) } else { 0 };
    (g, id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_desktop_and_the_taskbar_are_told_apart_by_class_and_everything_else_is_a_window() {
        assert_eq!(class_ground("Progman"), Some(Ground::Desktop));
        assert_eq!(class_ground("WorkerW"), Some(Ground::Desktop));
        assert_eq!(class_ground("Shell_TrayWnd"), Some(Ground::Taskbar));
        assert_eq!(class_ground("Shell_SecondaryTrayWnd"), Some(Ground::Taskbar));
        assert_eq!(class_ground("Chrome_WidgetWin_1"), None);
        assert_eq!(class_ground(""), None);
    }

    #[test]
    fn the_points_that_say_what_the_cat_stands_over_are_just_below_its_feet() {
        // pet window at (500, 300); the cat is 150 px at (15, 15): its feet are at y = 300 + 15 + 150, the ground 4 px lower
        let p = feet_points(500, 300, 15, 15, 150);
        assert_eq!(p[1], (500 + 15 + 75, 300 + 15 + 150 + BELOW_PX));
        assert!(p[0].0 < p[1].0 && p[1].0 < p[2].0, "left, middle, right");
        assert!(p.iter().all(|q| q.1 == 469));
        // the points stay inside the cat's width
        assert!(p[0].0 > 515 && p[2].0 < 665);
    }

    #[test]
    fn several_points_make_one_answer_by_majority() {
        use Ground::*;
        assert_eq!(standing_on(&[Foreground, Foreground, Desktop]), Foreground);
        assert_eq!(standing_on(&[Taskbar, Taskbar, App]), Taskbar);
        assert_eq!(standing_on(&[Desktop, Desktop, Desktop]), Desktop);
        assert_eq!(standing_on(&[App, App, Foreground]), App);
    }

    #[test]
    fn a_tie_goes_to_the_window_that_matters_most_and_the_unknown_does_not_vote() {
        use Ground::*;
        assert_eq!(standing_on(&[Foreground, App]), Foreground);
        assert_eq!(standing_on(&[App, Taskbar]), App);
        assert_eq!(standing_on(&[Taskbar, Desktop]), Taskbar);
        assert_eq!(standing_on(&[Unknown, Unknown, Desktop]), Desktop);
        assert_eq!(standing_on(&[Own, Taskbar, Own]), Taskbar);
    }

    #[test]
    fn with_no_answer_at_all_it_says_so() {
        use Ground::*;
        assert_eq!(standing_on(&[]), Unknown);
        assert_eq!(standing_on(&[Unknown, Unknown]), Unknown);
        assert_eq!(standing_on(&[Own, Unknown]), Own); // the cat's own window answered: the caller asks again later
    }

    #[test]
    fn the_kinds_are_plain_lowercase_words_for_the_page() {
        assert_eq!(serde_json::to_string(&Ground::Foreground).unwrap(), "\"foreground\"");
        assert_eq!(serde_json::to_string(&Ground::Taskbar).unwrap(), "\"taskbar\"");
    }
}
