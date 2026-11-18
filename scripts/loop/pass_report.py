#!/usr/bin/env python3
"""Join the pass lines of loop-trace.log to the marks of pass-marks.log (scripts/loop/drive-pass.ps1) and report, per round and kind, how many passes
were meant and how many left a line; the numbers by variant; and what candidate flick rules catch and wrongly catch (E33, ADR-0133, ADR-0135).

  python scripts/loop/pass_report.py [data-dir] [fast] [since=<ms>]
    data-dir   default %APPDATA%\\com.streakboom.app
    fast       read the lines of the fine sampler in Rust (`fast n=...`), else those of the page (`pass n=...`)
    since=<ms> only the marks (and lines) from this time on: one run of the driver

Each line belongs to the last mark before it (a pass is written when the pointer leaves, within a fraction of a second of its end).
A script is not a hand: this says what the sampler sees of a given speed and path, not what a person does.
"""
import bisect, os, re, sys
from collections import Counter, defaultdict

args = sys.argv[1:]
SRC = "fast" if "fast" in args else "pass"
SINCE = next((int(a[6:]) for a in args if a.startswith("since=")), 0)
d = next((a for a in args if a != "fast" and not a.startswith("since=")), os.path.join(os.environ.get("APPDATA", "."), "com.streakboom.app"))
P = re.compile(r"(\d+) " + SRC + r" n=(\d+) ms=(\d+) path=(\d+) vmax=(\d+) vavg=(\d+) rev=(\d+) dx=(-?\d+) dy=(-?\d+) w=(\d+)(?: hz=(\d+) vend=(\d+) left=(\d)(?: ex=(-?\d+) ey=(-?\d+))?)?")
M = re.compile(r"(\d+) mark round=(\d+) kind=(\w+) variant=(\w+)(.*)")
lines = [tuple(int(g or 0) for g in m.groups()) for l in open(os.path.join(d, "loop-trace.log"), encoding="utf8") if (m := P.match(l))]
marks = [(int(m[1]), int(m[2]), m[3], m[4]) for l in open(os.path.join(d, "pass-marks.log"), encoding="utf-8-sig")
         if (m := M.match(l)) and "rect=" in m[5] and m[3] not in ("stop", "round_end") and int(m[2]) in (1, 2, 3)]
marks = [m for m in marks if m[0] >= SINCE]
if SRC == "fast" and lines:
    first = lines[0][0]
    marks = [m for m in marks if m[0] >= first - 5000]
if not marks:
    sys.exit("no marks")
ts = [m[0] for m in marks]
lines = [p for p in lines if p[0] >= ts[0]]
by_mark = defaultdict(list)
for p in lines:
    i = bisect.bisect_right(ts, p[0]) - 1
    by_mark[i].append(p)

meant = Counter((m[1], m[2]) for m in marks)
seen = Counter((marks[i][1], marks[i][2]) for i in by_mark)
print(f"== source: {SRC}; passes meant, and passes that left at least one line, by round and kind")
for k in sorted(meant):
    print(f"round {k[0]} {k[1]:9} meant {meant[k]:3}  seen {seen[k]:3}")
tot = Counter()
for (r, k), n in meant.items():
    tot[k] += n
tots = Counter()
for (r, k), n in seen.items():
    tots[k] += n
print("all rounds:", "  ".join(f"{k} {tots[k]}/{tot[k]}" for k in sorted(tot)))

print("\n== numbers by kind and variant (all rounds)")
def stat(v):
    v = sorted(v)
    return f"{v[0]}..{v[-1]} (med {v[len(v)//2]})" if v else "-"
var_meant = Counter((m[2], m[3]) for m in marks)
var_seen = Counter((marks[i][2], marks[i][3]) for i in by_mark)
var_lines = defaultdict(list)
for i, ps in by_mark.items():
    var_lines[(marks[i][2], marks[i][3])] += ps
for key in sorted(var_meant):
    ps = var_lines[key]
    print(f"{key[0]:9} {key[1]:14} seen {var_seen[key]:2}/{var_meant[key]:2}  n {stat([p[1] for p in ps])}  ms {stat([p[2] for p in ps])}  vavg {stat([p[5] for p in ps])}  vmax {stat([p[4] for p in ps])}")

print("\n== candidate flick rules: passes (a pass counts once if any of its lines is caught) caught, by kind; meant totals in the last row")
def horiz(p):
    return abs(p[7]) >= 0.7 * max(1, p[3])
# indexes: 0 t, 1 n, 2 ms, 3 path, 4 vmax, 5 vavg, 6 rev, 7 dx, 8 dy, 9 w, 10 hz, 11 vend, 12 left, 13 ex, 14 ey (ex, ey: the last position, relative to Peak's square of 120 px)
def ends_on_sprite(p, slack=15):
    return -slack <= p[13] <= 120 + slack and -slack <= p[14] <= 120 + slack
def ends_near(p, slack=45):
    return -slack <= p[13] <= 120 + slack and -slack <= p[14] <= 120 + slack
fastp = lambda p: p[5] >= 1000 and p[2] <= 120
rules = {
    "vavg>=1000 & ms<=120": fastp,
    "... & vend<=0.5*vmax": lambda p: fastp(p) and p[11] <= 0.5 * p[4],
    "... & ends on the sprite (+-15)": lambda p: fastp(p) and ends_on_sprite(p),
    "... & ends near the sprite (+-45)": lambda p: fastp(p) and ends_near(p),
    "... near & vend<=0.5*vmax": lambda p: fastp(p) and ends_near(p) and p[11] <= 0.5 * p[4],
    "... on & vend<=0.5*vmax": lambda p: fastp(p) and ends_on_sprite(p) and p[11] <= 0.5 * p[4],
}
kinds = sorted(tot)
for name, f in rules.items():
    c = Counter()
    for i, ps in by_mark.items():
        if any(f(p) for p in ps):
            c[marks[i][2]] += 1
    print(f"{name:30}", "  ".join(f"{k}:{c[k]}" for k in kinds))
print(f"{'meant':30}", "  ".join(f"{k}:{tot[k]}" for k in kinds))
