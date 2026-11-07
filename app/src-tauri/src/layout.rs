//! Pure window geometry (no Tauri types), so it can be unit-tested.
//! All numbers are physical pixels.

use serde::Serialize;

/// A monitor's work area (the screen minus the taskbar).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Area {
    pub x: i32,
    pub y: i32,
    /// right edge (exclusive)
    pub r: i32,
    /// bottom edge (exclusive)
    pub b: i32,
}

/// Clamp the pet window's top-left so the whole pet (a `size` square at offset `left`/`top`
/// inside the window) stays inside the work area. The transparent margin may overhang.
pub fn clamp_window(a: Area, x: i32, y: i32, left: i32, top: i32, size: i32) -> (i32, i32) {
    let min_x = a.x - left;
    let max_x = a.r - left - size;
    let min_y = a.y - top;
    let max_y = a.b - top - size;
    (x.clamp(min_x, max_x.max(min_x)), y.clamp(min_y, max_y.max(min_y)))
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Side {
    Above,
    Below,
    Right,
    Left,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Placement {
    pub x: i32,
    pub y: i32,
    pub side: Side,
    /// Distance along the bubble's edge (from its left for Above/Below, from its top for
    /// Left/Right) to the point facing the pet's center, for the speech-bubble tail.
    pub tail: i32,
}

/// Choose where a `w` x `h` bubble goes around the pet square `(px, py, size)`: above if it
/// fits, then below, right, left; clamped along the other axis so it never leaves the work area.
pub fn place_bubble(a: Area, px: i32, py: i32, size: i32, w: i32, h: i32, gap: i32) -> Placement {
    let cx = px + size / 2;
    let cy = py + size / 2;
    let clamp_x = |x: i32| x.clamp(a.x, (a.r - w).max(a.x));
    let clamp_y = |y: i32| y.clamp(a.y, (a.b - h).max(a.y));

    let above_y = py - h - gap;
    if above_y >= a.y {
        let x = clamp_x(cx - w / 2);
        return Placement { x, y: above_y, side: Side::Above, tail: cx - x };
    }
    let below_y = py + size + gap;
    if below_y + h <= a.b {
        let x = clamp_x(cx - w / 2);
        return Placement { x, y: below_y, side: Side::Below, tail: cx - x };
    }
    let right_x = px + size + gap;
    if right_x + w <= a.r {
        let y = clamp_y(cy - h / 2);
        return Placement { x: right_x, y, side: Side::Right, tail: cy - y };
    }
    let left_x = px - gap - w;
    if left_x >= a.x {
        let y = clamp_y(cy - h / 2);
        return Placement { x: left_x, y, side: Side::Left, tail: cy - y };
    }
    // A bubble bigger than the free space on every side: keep it on screen, above the pet.
    let x = clamp_x(cx - w / 2);
    Placement { x, y: clamp_y(above_y), side: Side::Above, tail: cx - x }
}

#[cfg(test)]
mod tests {
    use super::*;

    const A: Area = Area { x: 0, y: 0, r: 1920, b: 1040 };

    #[test]
    fn pet_window_is_clamped_so_the_pet_stays_on_screen() {
        // pet is 120 px at offset (10, 10) inside its window
        assert_eq!(clamp_window(A, 100, 100, 10, 10, 120), (100, 100));
        // too far left/up: the transparent margin may overhang, the pet may not
        assert_eq!(clamp_window(A, -500, -500, 10, 10, 120), (-10, -10));
        // too far right/down: pet's right edge sits on the work area's right edge
        assert_eq!(clamp_window(A, 5000, 5000, 10, 10, 120), (1920 - 130, 1040 - 130));
        // a work area smaller than the pet must not panic
        let tiny = Area { x: 0, y: 0, r: 50, b: 50 };
        assert_eq!(clamp_window(tiny, 30, 30, 10, 10, 120), (-10, -10));
    }

    #[test]
    fn the_pet_can_reach_the_very_top_of_the_screen() {
        let (_, y) = clamp_window(A, 500, -9999, 10, 10, 120);
        assert_eq!(y + 10, 0); // pet top == work area top
    }

    #[test]
    fn bubble_goes_above_when_there_is_room() {
        let p = place_bubble(A, 900, 600, 120, 240, 80, 2);
        assert_eq!(p.side, Side::Above);
        assert_eq!(p.y, 600 - 80 - 2);
        assert_eq!(p.x, 960 - 120); // centered on the pet
        assert_eq!(p.tail, 120); // tail at the bubble's middle
    }

    #[test]
    fn bubble_flips_below_when_the_pet_is_at_the_top() {
        let p = place_bubble(A, 900, 0, 120, 240, 80, 2);
        assert_eq!(p.side, Side::Below);
        assert_eq!(p.y, 122);
    }

    #[test]
    fn bubble_shifts_sideways_near_the_screen_edges_and_the_tail_still_points_at_the_pet() {
        // pet against the right edge
        let p = place_bubble(A, 1920 - 120, 600, 120, 240, 80, 2);
        assert_eq!(p.side, Side::Above);
        assert_eq!(p.x, 1920 - 240); // clamped inside the screen
        assert_eq!(p.tail, (1920 - 60) - p.x); // distance from bubble left to pet center
        // pet against the left edge
        let q = place_bubble(A, 0, 600, 120, 240, 80, 2);
        assert_eq!(q.x, 0);
        assert_eq!(q.tail, 60);
    }

    #[test]
    fn bubble_uses_the_side_when_neither_above_nor_below_fits() {
        // a very short work area: 100 px tall, bubble is 80 tall, pet is 120 tall
        let short = Area { x: 0, y: 0, r: 1920, b: 100 };
        let p = place_bubble(short, 800, 0, 120, 240, 80, 2);
        assert_eq!(p.side, Side::Right);
        assert_eq!(p.x, 800 + 120 + 2);
        let q = place_bubble(short, 1920 - 120, 0, 120, 240, 80, 2);
        assert_eq!(q.side, Side::Left);
        assert_eq!(q.x, 1920 - 120 - 2 - 240);
    }

    #[test]
    fn an_oversized_bubble_is_kept_on_screen() {
        let p = place_bubble(A, 900, 500, 120, 3000, 2000, 2);
        assert_eq!((p.x, p.y), (0, 0));
    }
}
