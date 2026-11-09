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

/// One monitor: its full rectangle and its work area, with the scale factor (physical px per logical px).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Mon {
    pub full: Area,
    pub work: Area,
    pub scale: f64,
}

/// Distance from a physical point to a rectangle (0 inside it). The right and bottom edges are exclusive, so a
/// point exactly on the shared edge of two touching monitors is 1 px away from the first and inside the second.
fn dist_to(a: Area, px: f64, py: f64) -> f64 {
    let dx = if px < a.x as f64 { a.x as f64 - px } else if px >= a.r as f64 { px - a.r as f64 + 1.0 } else { 0.0 };
    let dy = if py < a.y as f64 { a.y as f64 - py } else if py >= a.b as f64 { py - a.b as f64 + 1.0 } else { 0.0 };
    dx.hypot(dy)
}

/// The monitor containing the physical point, or the nearest one (the first on a tie).
pub fn nearest_mon(mons: &[Mon], px: f64, py: f64) -> Option<Mon> {
    let mut best: Option<(f64, Mon)> = None;
    for m in mons {
        let d = dist_to(m.full, px, py);
        if best.is_none_or(|(bd, _)| d < bd) {
            best = Some((d, *m));
        }
    }
    best.map(|(_, m)| m)
}

/// Where the pet window ends up when it is asked to go to `(x, y)` (its top-left, physical px): the whole
/// cat stays inside the work area of the monitor nearest to where the cat's centre would be. `scale_of`
/// gives the cat's offset and size in physical px for that monitor's scale, so a move onto a monitor with
/// another scale is clamped with that monitor's numbers. Returns the position and whether it was changed.
pub fn clamp_to_world(mons: &[Mon], x: i32, y: i32, pet_px: impl Fn(f64) -> (i32, i32, i32)) -> Option<(i32, i32, bool)> {
    // first guess with the first monitor's sizes just to find which monitor the centre falls on
    let (l0, t0, s0) = pet_px(mons.first()?.scale);
    let m = nearest_mon(mons, (x + l0 + s0 / 2) as f64, (y + t0 + s0 / 2) as f64)?;
    let (l, t, s) = pet_px(m.scale);
    let (nx, ny) = clamp_window(m.work, x, y, l, t, s);
    Some((nx, ny, nx != x || ny != y))
}

/// Milliseconds since the user's last keyboard or mouse input, from two readings of the 32-bit
/// millisecond tick counter (`GetTickCount` now, and the time `GetLastInputInfo` reports). The counter
/// wraps about every 49.7 days, so the difference is taken with wrapping; a last-input time that is a
/// moment *ahead* of the reading (input arrived between the two calls) counts as 0.
pub fn idle_since(now_tick: u32, last_input_tick: u32) -> u32 {
    let d = now_tick.wrapping_sub(last_input_tick);
    if d > u32::MAX / 2 { 0 } else { d }
}

/// Virtual-key codes of the two physical mouse buttons (`VK_LBUTTON` and `VK_RBUTTON`).
pub const VK_PHYSICAL_LEFT: i32 = 0x01;
pub const VK_PHYSICAL_RIGHT: i32 = 0x02;

/// The key code to read for the button the user clicks with (the *primary* button, the one that puts the caret in a
/// field). `GetAsyncKeyState` reports the **physical** buttons, not the logical ones: with the buttons swapped in
/// Windows (`GetSystemMetrics(SM_SWAPBUTTON)` is non-zero, usual for left-handed users) the primary button is the
/// physical right one, so reading the physical left button would record the wrong clicks (V-22).
pub fn primary_button_vk(swapped: bool) -> i32 {
    if swapped { VK_PHYSICAL_RIGHT } else { VK_PHYSICAL_LEFT }
}

/// Reading of the primary mouse button from `GetAsyncKeyState` (`raw`): whether it is down now (the high bit) and whether
/// it was pressed since the previous reading (the low bit). A button, never a key: nothing else is read (T8, ADR-0031).
pub fn button_bits(raw: i16) -> (bool, bool) {
    (raw < 0, raw & 1 != 0)
}

/// Is this reading a new click? A press shows as the button being down when it was not before, or as the "pressed
/// since the last reading" bit, which catches a click shorter than the polling interval.
pub fn is_click(was_down: bool, down: bool, pressed_since: bool) -> bool {
    (down && !was_down) || pressed_since
}

/// Milliseconds since `at` (both from the same millisecond clock); 0 when `at` is in the future.
pub fn age_ms(now: u64, at: u64) -> u64 {
    now.saturating_sub(at)
}

/// The pointer must be within this many logical px of the cat's centre, and the user active within the last
/// `ENGAGE_IDLE_MS`, for the hit-test thread to tell the page "the user may be working near the cat". It is a coarse
/// trigger a little wider than the exact limits of `src/lib/focus.ts` (NEAR_PX 200, ACTIVE_MS 3000), which make the
/// real decision; keep them in step. While it is false the page does no focus polling at all.
pub const ENGAGE_RADIUS_PX: f64 = 250.0;
pub const ENGAGE_IDLE_MS: u32 = 3000;

pub fn engaged_near(idle_ms: Option<u32>, dx: f64, dy: f64) -> bool {
    idle_ms.is_some_and(|i| i < ENGAGE_IDLE_MS) && dx.hypot(dy) < ENGAGE_RADIUS_PX
}

/// The typing lane (spec/07 section 3.1, `src/lib/lane.ts`) makes the page poll even when the pointer is far from the
/// cat: the user is active and clicked, within the last `LANE_ANCHOR_MS`, on a row within `LANE_ROW_PX` (logical px)
/// of the cat's centre, so text typed there may be running toward the cat. A coarse trigger a little wider than the
/// exact lane (half height 100 px), which `lane.ts` decides; keep them in step.
pub const LANE_ANCHOR_MS: u64 = 60_000;
pub const LANE_ROW_PX: f64 = 200.0;

pub fn engaged_lane(idle_ms: Option<u32>, click_age_ms: Option<u64>, click_dy: f64) -> bool {
    idle_ms.is_some_and(|i| i < ENGAGE_IDLE_MS) && click_age_ms.is_some_and(|a| a < LANE_ANCHOR_MS) && click_dy.abs() <= LANE_ROW_PX
}

/// How far the cat can move up and down before the work-area edges, in logical px (0 against an edge): the room a
/// hop out of the typing lane has. `win_y` is the pet window's top edge (physical px); the cat is a `size` square
/// at `top` inside it.
pub fn room_vertical(a: Area, win_y: i32, top: i32, size: i32, scale: f64) -> (i32, i32) {
    let up = (win_y + top) - a.y;
    let down = a.b - (win_y + top + size);
    let lg = |v: i32| (v.max(0) as f64 / scale).round() as i32;
    (lg(up), lg(down))
}

/// How far the cat can walk before the work-area edge in direction `dir` (+1 right, -1 left), in logical px.
/// `win_x` is the pet window's left edge (physical px); the cat is a `size` square at `left` inside it.
pub fn room_to_edge(a: Area, win_x: i32, left: i32, size: i32, dir: i32, scale: f64) -> i32 {
    let room = if dir > 0 { a.r - (win_x + left + size) } else { (win_x + left) - a.x };
    (room.max(0) as f64 / scale).round() as i32
}

/// Where the pointer is, in logical px, measured from the centre of the cat. `cur` and `win` are physical
/// px (the pointer and the pet window's top-left); the cat is a `pet_size` square at `(pet_left, pet_top)`
/// inside the window (logical px). Positive x is to the right, positive y is down.
#[allow(clippy::too_many_arguments)]
pub fn pointer_offset(cur_x: f64, cur_y: f64, win_x: f64, win_y: f64, scale: f64, pet_left: f64, pet_top: f64, pet_size: f64) -> (f64, f64) {
    let lx = (cur_x - win_x) / scale;
    let ly = (cur_y - win_y) / scale;
    (lx - (pet_left + pet_size / 2.0), ly - (pet_top + pet_size / 2.0))
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

    fn mon(x: i32, y: i32, w: i32, h: i32, taskbar: i32, scale: f64) -> Mon {
        Mon {
            full: Area { x, y, r: x + w, b: y + h },
            work: Area { x, y, r: x + w, b: y + h - taskbar },
            scale,
        }
    }
    // the cat is 120 px at offset (10, 10) at scale 1 and 1.5 times that at scale 1.5
    fn pet(scale: f64) -> (i32, i32, i32) {
        ((10.0 * scale) as i32, (10.0 * scale) as i32, (120.0 * scale) as i32)
    }

    #[test]
    fn the_nearest_monitor_is_the_one_containing_the_point_or_the_closest() {
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0), mon(1920, 0, 1920, 1080, 40, 1.0)];
        assert_eq!(nearest_mon(&mons, 100.0, 100.0), Some(mons[0]));
        assert_eq!(nearest_mon(&mons, 2000.0, 500.0), Some(mons[1]));
        assert_eq!(nearest_mon(&mons, 1919.0, 500.0), Some(mons[0]));
        assert_eq!(nearest_mon(&mons, 1920.0, 500.0), Some(mons[1]));
        // far outside: the nearest one wins
        assert_eq!(nearest_mon(&mons, 9000.0, 500.0), Some(mons[1]));
        assert_eq!(nearest_mon(&mons, -500.0, -500.0), Some(mons[0]));
        assert_eq!(nearest_mon(&[], 0.0, 0.0), None);
    }

    #[test]
    fn a_point_in_the_taskbar_strip_still_belongs_to_its_own_monitor() {
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0), mon(1920, 0, 1920, 1080, 40, 1.0)];
        assert_eq!(nearest_mon(&mons, 1900.0, 1070.0), Some(mons[0]));
    }

    #[test]
    fn a_move_inside_the_work_area_is_left_alone() {
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0)];
        assert_eq!(clamp_to_world(&mons, 300, 200, pet), Some((300, 200, false)));
    }

    #[test]
    fn a_move_into_the_taskbar_or_off_the_screen_is_pulled_back_inside() {
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0)];
        // the cat's bottom edge may not go below the work area (1040): window y = 1040 - 10 - 120 = 910
        assert_eq!(clamp_to_world(&mons, 300, 5000, pet), Some((300, 910, true)));
        assert_eq!(clamp_to_world(&mons, -900, -900, pet), Some((-10, -10, true)));
        assert_eq!(clamp_to_world(&mons, 5000, 300, pet), Some((1920 - 130, 300, true)));
    }

    #[test]
    fn a_move_across_touching_monitors_lands_on_the_monitor_under_the_cat() {
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0), mon(1920, 0, 1920, 1080, 40, 1.0)];
        // the centre is on the second monitor: the cat may stand there
        assert_eq!(clamp_to_world(&mons, 2500, 300, pet), Some((2500, 300, false)));
        // far to the right of everything: held at the right edge of the last monitor
        assert_eq!(clamp_to_world(&mons, 9000, 300, pet), Some((3840 - 130, 300, true)));
    }

    #[test]
    fn a_monitor_with_another_scale_is_clamped_with_its_own_cat_size() {
        // a second monitor at 150%: the cat is 180 px at offset 15
        let mons = [mon(0, 0, 1920, 1080, 40, 1.0), mon(1920, 0, 2880, 1620, 60, 1.5)];
        assert_eq!(clamp_to_world(&mons, 9000, 100, pet), Some((1920 + 2880 - 15 - 180, 100, true)));
        assert_eq!(clamp_to_world(&mons, 3000, 9000, pet), Some((3000, 1560 - 15 - 180, true)));
        assert_eq!(clamp_to_world(&[], 0, 0, pet), None);
    }

    #[test]
    fn the_primary_button_is_the_physical_right_one_when_the_buttons_are_swapped() {
        assert_eq!(primary_button_vk(false), VK_PHYSICAL_LEFT);
        assert_eq!(primary_button_vk(true), VK_PHYSICAL_RIGHT);
        assert_eq!((VK_PHYSICAL_LEFT, VK_PHYSICAL_RIGHT), (0x01, 0x02)); // VK_LBUTTON and VK_RBUTTON
    }

    #[test]
    fn the_button_reading_is_split_into_down_now_and_pressed_since() {
        assert_eq!(button_bits(0), (false, false));
        assert_eq!(button_bits(i16::MIN), (true, false)); // 0x8000: down now
        assert_eq!(button_bits(i16::MIN | 1), (true, true)); // down now and pressed since the last reading
        assert_eq!(button_bits(1), (false, true)); // a click that was over before this reading
    }

    #[test]
    fn a_click_is_a_new_press_or_a_press_since_the_last_reading() {
        assert!(is_click(false, true, false)); // went down
        assert!(!is_click(true, true, false)); // still held: not a new click
        assert!(!is_click(false, false, false)); // nothing
        assert!(!is_click(true, false, false)); // released: the click was counted when it went down
        assert!(is_click(false, false, true)); // a click shorter than the polling interval
        assert!(is_click(true, true, true)); // released and pressed again between two readings
    }

    #[test]
    fn the_age_of_a_click_never_goes_negative() {
        assert_eq!(age_ms(10_000, 4_000), 6_000);
        assert_eq!(age_ms(5, 5), 0);
        assert_eq!(age_ms(5, 9), 0);
    }

    #[test]
    fn the_lane_trigger_needs_activity_a_recent_click_and_the_same_row() {
        assert!(engaged_lane(Some(0), Some(5_000), 40.0)); // active, a click 5 s ago, 40 px off the cat's row
        assert!(engaged_lane(Some(0), Some(5_000), -LANE_ROW_PX)); // the edge of the row counts
        assert!(!engaged_lane(Some(0), Some(5_000), 260.0)); // another row
        assert!(!engaged_lane(Some(ENGAGE_IDLE_MS), Some(5_000), 0.0)); // not active any more
        assert!(!engaged_lane(Some(0), Some(LANE_ANCHOR_MS), 0.0)); // the click is too old
        assert!(!engaged_lane(Some(0), None, 0.0)); // no click
        assert!(!engaged_lane(None, Some(5_000), 0.0)); // idle time unknown
    }

    #[test]
    fn the_room_up_and_down_is_measured_from_the_cat_not_the_window() {
        // pet window at y=500 with the cat (120 px) at offset 10: the cat spans 510..630; work area 0..1040
        assert_eq!(room_vertical(A, 500, 10, 120, 1.0), (510, 1040 - 630));
        // at 125% the physical room is divided into logical px
        let (up, down) = room_vertical(A, 500, 12, 150, 1.25);
        assert_eq!((up, down), (((512) as f64 / 1.25).round() as i32, ((1040 - 662) as f64 / 1.25).round() as i32));
        // against an edge, or past it, there is no room
        assert_eq!(room_vertical(A, -10, 10, 120, 1.0).0, 0);
        assert_eq!(room_vertical(A, 1040 - 130, 10, 120, 1.0).1, 0);
        assert_eq!(room_vertical(A, 5000, 10, 120, 1.0).1, 0);
    }

    #[test]
    fn idle_time_is_the_difference_of_the_tick_counters() {
        assert_eq!(idle_since(10_000, 4_000), 6_000);
        assert_eq!(idle_since(5, 5), 0);
        assert_eq!(idle_since(0, 0), 0);
    }

    #[test]
    fn idle_time_survives_the_tick_counter_wrapping_around() {
        // the counter wraps after about 49.7 days: the last input was 10 ms before the wrap, now is 5 ms after
        assert_eq!(idle_since(5, u32::MAX - 9), 15);
        assert_eq!(idle_since(1_000, u32::MAX - 999), 2_000);
    }

    #[test]
    fn a_last_input_a_moment_ahead_of_the_reading_counts_as_no_idle_time() {
        assert_eq!(idle_since(1_000, 1_003), 0);
        assert_eq!(idle_since(0, 1), 0);
    }

    #[test]
    fn the_pointer_offset_is_measured_from_the_cat_centre_in_logical_px() {
        // pet window at physical (500, 300); cat 120 px at (10, 10), so its centre is (70, 70) inside the window
        assert_eq!(pointer_offset(570.0, 370.0, 500.0, 300.0, 1.0, 10.0, 10.0, 120.0), (0.0, 0.0));
        // 100 px to the right and 40 px below the centre
        assert_eq!(pointer_offset(670.0, 410.0, 500.0, 300.0, 1.0, 10.0, 10.0, 120.0), (100.0, 40.0));
        // left of and above the centre are negative
        assert_eq!(pointer_offset(470.0, 350.0, 500.0, 300.0, 1.0, 10.0, 10.0, 120.0), (-100.0, -20.0));
    }

    #[test]
    fn the_pointer_offset_is_in_logical_px_at_a_scaled_display() {
        // at 150% the window is at physical (1500, 900); the centre is at logical (70, 70), physical (105, 105) inside
        let (dx, dy) = pointer_offset(1500.0 + 105.0 + 150.0, 900.0 + 105.0, 1500.0, 900.0, 1.5, 10.0, 10.0, 120.0);
        assert!((dx - 100.0).abs() < 1e-9 && dy.abs() < 1e-9, "{dx} {dy}");
    }

    #[test]
    fn room_to_the_edge_is_measured_from_the_cat_not_the_window() {
        // pet window at x=500 with the cat (120 px) at offset 10: the cat spans 510..630; work area 0..1920
        assert_eq!(room_to_edge(A, 500, 10, 120, 1, 1.0), 1920 - 630);
        assert_eq!(room_to_edge(A, 500, 10, 120, -1, 1.0), 510);
        // at 150% the physical room is divided into logical px
        assert_eq!(room_to_edge(A, 600, 15, 180, 1, 1.5), ((1920 - 795) as f64 / 1.5).round() as i32);
        // against the edge, or past it, there is no room
        assert_eq!(room_to_edge(A, -10, 10, 120, -1, 1.0), 0);
        assert_eq!(room_to_edge(A, 1920 - 130, 10, 120, 1, 1.0), 0);
        assert_eq!(room_to_edge(A, 5000, 10, 120, 1, 1.0), 0);
    }

    #[test]
    fn the_page_is_told_only_when_the_user_is_active_near_the_cat() {
        assert!(engaged_near(Some(0), 100.0, 0.0));
        assert!(engaged_near(Some(ENGAGE_IDLE_MS - 1), 0.0, 249.0));
        assert!(!engaged_near(Some(ENGAGE_IDLE_MS), 10.0, 10.0)); // not active any more
        assert!(!engaged_near(Some(0), 250.0, 0.0)); // not near
        assert!(!engaged_near(Some(0), 200.0, 200.0)); // diagonal distance counts (283)
        assert!(!engaged_near(None, 0.0, 0.0)); // idle time unknown: no trigger
    }

    #[test]
    fn an_oversized_bubble_is_kept_on_screen() {
        let p = place_bubble(A, 900, 500, 120, 3000, 2000, 2);
        assert_eq!((p.x, p.y), (0, 0));
    }
}
