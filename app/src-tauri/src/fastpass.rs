//! The pointer near Peak at a fine rate (ADR-0135, E33 IR-4a). Pure: no Tauri, no system call, so it can be unit-tested.
//!
//! The sampler (a small thread, `spawn_fast_pass` in `lib.rs`) reads the pointer every 8 ms **only inside a zone** around Peak's window and hands
//! each position here. This keeps a ring of the last 300 ms **in memory** (for the rule of the flick, IR-4b) and the running numbers of the
//! present pass, as `pass.ts` does for the events of the page: how long, how far, how fast, how many reversals. Nothing is stored: when the
//! pointer leaves the zone the pass is over and its numbers are the only thing that remains, and **only a test build writes them** (a fixed line
//! of words and numbers). No position outside the zone is ever read into this module.

use std::collections::VecDeque;

/// How far outside the window the zone reaches (logical px).
pub const MARGIN: f64 = 80.0;
/// The period of the fine sampling, inside the zone (ms).
pub const SAMPLE_MS: u64 = 8;
/// A gap longer than this ends a pass (ms), as in `pass.ts`.
pub const GAP_MS: u64 = 250;
/// How much of the past the ring keeps (ms).
pub const RING_MS: u64 = 300;
/// A pass whose top speed is below this (px per second) is not written.
pub const MIN_VMAX: f64 = 40.0;
/// A change of direction counts only after this many px.
const REV_PX: f64 = 8.0;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Sample {
    pub t: u64, // ms
    pub x: f64, // logical px, relative to Peak's square
    pub y: f64,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Stats {
    pub n: u32,
    pub ms: u64,
    pub path: f64,
    pub vmax: f64,
    pub vavg: f64,
    pub rev: u32,
    pub dx: f64,
    pub dy: f64,
    /// The speed over the last 24 ms or more of the pass (px per second): a strike has stopped by then, a transit leaves at speed.
    pub vend: f64,
    /// The pass ended because the pointer left the zone (true), or because it rested for more than 250 ms (false).
    pub left: bool,
    /// Where the last position of the pass was (logical px, relative to Peak's square): a strike stops on or just beyond the sprite, a transit
    /// leaves through the margin of the zone.
    pub ex: f64,
    pub ey: f64,
}

/// Is the pointer (logical px, relative to the window's top-left) inside the zone of a `w` by `h` window?
pub fn in_zone(lx: f64, ly: f64, w: f64, h: f64) -> bool {
    lx > -MARGIN && lx < w + MARGIN && ly > -MARGIN && ly < h + MARGIN
}

#[derive(Default)]
pub struct Tracker {
    ring: VecDeque<Sample>,
    n: u32,
    first: Option<Sample>,
    last: Option<Sample>,
    path: f64,
    vmax: f64,
    dir: i8,
    extreme: f64,
    rev: u32,
}

impl Tracker {
    pub fn new() -> Self {
        Self::default()
    }

    /// The last 300 ms of positions, oldest first. Read by the rule of the flick (IR-4b); in memory only.
    #[allow(dead_code)]
    pub fn recent(&self) -> &VecDeque<Sample> {
        &self.ring
    }

    /// Add a position. Returns the numbers of the previous pass when this one begins after a gap.
    pub fn step(&mut self, s: Sample) -> Option<Stats> {
        let mut done = None;
        if let Some(l) = self.last {
            if s.t.saturating_sub(l.t) > GAP_MS {
                done = self.finish(false);
            }
        }
        self.ring.push_back(s);
        while self.ring.front().is_some_and(|f| s.t.saturating_sub(f.t) > RING_MS) {
            self.ring.pop_front();
        }
        match self.last {
            None => {
                self.first = Some(s);
                self.extreme = s.x;
            }
            Some(l) => {
                let d = ((s.x - l.x).powi(2) + (s.y - l.y).powi(2)).sqrt();
                let dt = s.t.saturating_sub(l.t).max(1) as f64;
                self.path += d;
                self.vmax = self.vmax.max(d * 1000.0 / dt);
            }
        }
        self.reversals(s.x);
        self.n += 1;
        self.last = Some(s);
        done
    }

    /// The pointer left the zone: the pass is over, and nothing of it stays.
    pub fn leave(&mut self) -> Option<Stats> {
        let done = self.finish(true);
        self.ring.clear();
        done
    }

    fn reversals(&mut self, x: f64) {
        match self.dir {
            0 => {
                if (x - self.extreme).abs() >= REV_PX {
                    self.dir = if x > self.extreme { 1 } else { -1 };
                    self.extreme = x;
                }
            }
            1 => {
                if x > self.extreme {
                    self.extreme = x;
                } else if self.extreme - x >= REV_PX {
                    self.dir = -1;
                    self.extreme = x;
                    self.rev += 1;
                }
            }
            _ => {
                if x < self.extreme {
                    self.extreme = x;
                } else if x - self.extreme >= REV_PX {
                    self.dir = 1;
                    self.extreme = x;
                    self.rev += 1;
                }
            }
        }
    }

    /// The speed over the last 24 ms or more of what the ring holds (0 when it holds fewer than two samples).
    fn end_speed(&self) -> f64 {
        let Some(last) = self.ring.back() else { return 0.0 };
        let Some(from) = self.ring.iter().rev().skip(1).find(|p| last.t.saturating_sub(p.t) >= 24).or_else(|| self.ring.front().filter(|p| p.t < last.t)) else {
            return 0.0;
        };
        let d = ((last.x - from.x).powi(2) + (last.y - from.y).powi(2)).sqrt();
        d * 1000.0 / last.t.saturating_sub(from.t).max(1) as f64
    }

    fn finish(&mut self, left: bool) -> Option<Stats> {
        let vend = self.end_speed();
        let (f, l) = (self.first, self.last);
        let (n, path, vmax, rev) = (self.n, self.path, self.vmax, self.rev);
        self.n = 0;
        self.first = None;
        self.last = None;
        self.path = 0.0;
        self.vmax = 0.0;
        self.dir = 0;
        self.rev = 0;
        let (f, l) = (f?, l?);
        if n < 2 {
            return None;
        }
        let ms = l.t.saturating_sub(f.t).max(1);
        Some(Stats { n, ms, path, vmax, vavg: path * 1000.0 / ms as f64, rev, dx: l.x - f.x, dy: l.y - f.y, vend, left, ex: l.x, ey: l.y })
    }
}

/// The line of a pass for the test log (`loop-trace.log`), or None when it is too slow to be of interest. Fixed words and numbers only;
/// `hz` is the rate that was really achieved (samples per second), which is the point of this measurement.
pub fn line(st: &Stats, w: f64) -> Option<String> {
    if st.vmax < MIN_VMAX {
        return None;
    }
    let hz = (st.n as f64 * 1000.0 / st.ms as f64).round() as i64;
    Some(format!(
        "fast n={} ms={} path={} vmax={} vavg={} rev={} dx={} dy={} w={} hz={} vend={} left={} ex={} ey={}",
        st.n,
        st.ms,
        st.path.round() as i64,
        st.vmax.round() as i64,
        st.vavg.round() as i64,
        st.rev,
        st.dx.round() as i64,
        st.dy.round() as i64,
        w.round() as i64,
        hz,
        st.vend.round() as i64,
        st.left as u8,
        st.ex.round() as i64,
        st.ey.round() as i64
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run(points: &[(u64, f64, f64)]) -> (Tracker, Vec<Stats>) {
        let mut t = Tracker::new();
        let mut done = Vec::new();
        for &(ms, x, y) in points {
            if let Some(d) = t.step(Sample { t: ms, x, y }) {
                done.push(d);
            }
        }
        (t, done)
    }

    #[test]
    fn the_zone_is_the_window_and_a_margin() {
        assert!(in_zone(70.0, 70.0, 140.0, 140.0));
        assert!(in_zone(-79.0, 10.0, 140.0, 140.0));
        assert!(!in_zone(-81.0, 10.0, 140.0, 140.0));
        assert!(!in_zone(10.0, 140.0 + 81.0, 140.0, 140.0));
        assert!(in_zone(140.0 + 79.0, 70.0, 140.0, 140.0));
    }

    #[test]
    fn a_fast_stroke_gives_its_speed_and_its_rate() {
        // 100 px in 40 ms, a sample every 8 ms
        let pts: Vec<_> = (0..6).map(|i| (i as u64 * 8, i as f64 * 20.0, 0.0)).collect();
        let (mut t, _) = run(&pts);
        let st = t.leave().unwrap();
        assert_eq!(st.n, 6);
        assert_eq!(st.ms, 40);
        assert_eq!(st.path.round() as i64, 100);
        assert_eq!(st.vmax.round() as i64, 2500);
        assert_eq!(st.vavg.round() as i64, 2500);
        assert_eq!(st.rev, 0);
        assert_eq!(st.dx.round() as i64, 100);
        let l = line(&st, 140.0).unwrap();
        assert_eq!(l, "fast n=6 ms=40 path=100 vmax=2500 vavg=2500 rev=0 dx=100 dy=0 w=140 hz=150 vend=2500 left=1 ex=100 ey=0");
    }

    #[test]
    fn a_slow_back_and_forth_counts_its_reversals() {
        let xs = [0.0, 30.0, 0.0, 30.0, 0.0, 30.0];
        let pts: Vec<_> = xs.iter().enumerate().map(|(i, &x)| (i as u64 * 200, x, 0.0)).collect();
        let (mut t, _) = run(&pts);
        let st = t.leave().unwrap();
        assert_eq!(st.rev, 4);
        assert!(line(&st, 140.0).is_some(), "150 px per second is above the floor");
    }

    #[test]
    fn a_pointer_that_hardly_moves_is_not_written() {
        let (mut t, _) = run(&[(0, 0.0, 0.0), (200, 3.0, 0.0)]);
        let st = t.leave().unwrap();
        assert!(line(&st, 140.0).is_none());
    }

    #[test]
    fn a_gap_ends_the_pass_and_one_event_is_nothing() {
        let (mut t, done) = run(&[(0, 0.0, 0.0), (8, 10.0, 0.0), (16, 20.0, 0.0), (400, 50.0, 0.0), (408, 60.0, 0.0)]);
        assert_eq!(done.len(), 1);
        assert_eq!(done[0].n, 3);
        assert_eq!(t.leave().unwrap().n, 2);
        let (mut t2, _) = run(&[(0, 5.0, 5.0)]);
        assert_eq!(t2.leave(), None);
    }

    #[test]
    fn a_strike_that_stops_has_a_low_end_speed_and_a_transit_has_a_high_one() {
        // fast, then still for 40 ms, then a gap: the pass ended by resting
        let mut pts: Vec<(u64, f64, f64)> = (0..6).map(|i| (i as u64 * 8, i as f64 * 20.0, 0.0)).collect();
        pts.extend((6..11).map(|i| (i as u64 * 8, 100.0, 0.0)));
        let (mut t, _) = run(&pts);
        let stop = t.leave().unwrap();
        assert!(stop.vend < 1000.0, "vend {} after the stop", stop.vend);
        assert_eq!(stop.vmax.round() as i64, 2500);
        // a transit: the same speed up to the last sample
        let run_pts: Vec<_> = (0..11).map(|i| (i as u64 * 8, i as f64 * 20.0, 0.0)).collect();
        let (mut t2, _) = run(&run_pts);
        let transit = t2.leave().unwrap();
        assert_eq!(transit.vend.round() as i64, 2500);
        assert!(transit.left);
        // a pass that ends by a gap says so
        let (_, done) = run(&[(0, 0.0, 0.0), (8, 10.0, 0.0), (16, 20.0, 0.0), (500, 90.0, 0.0)]);
        assert!(!done[0].left);
    }

    #[test]
    fn the_ring_keeps_only_the_last_300_ms_and_is_cleared_on_leaving() {
        let pts: Vec<_> = (0..100).map(|i| (i as u64 * 8, i as f64, 0.0)).collect();
        let (mut t, _) = run(&pts);
        let first = t.recent().front().unwrap().t;
        let last = t.recent().back().unwrap().t;
        assert!(last - first <= RING_MS, "the ring spans {} ms", last - first);
        assert!(t.recent().len() <= (RING_MS / SAMPLE_MS) as usize + 2);
        t.leave();
        assert!(t.recent().is_empty(), "nothing of the pass stays");
    }
}
