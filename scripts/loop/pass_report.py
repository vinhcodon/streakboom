#!/usr/bin/env python3
"""Join the pass lines of loop-trace.log to the marks of pass-marks.log (scripts/loop/drive-pass.ps1) and report, per round and kind, how many passes
were meant, how many were seen, and the numbers; then try candidate flick rules and count what each catches and what it wrongly catches (E33, ADR-0133).

  python scripts/loop/pass_report.py [data-dir]      (default: %APPDATA%\\com.streakboom.app)
Only the final run is read (from the last `mark ... round=` block of marks written after the first mark of the newest group).
"""
import os, re, sys
from collections import defaultdict

d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get("APPDATA", "."), "com.streakboom.app")
P = re.compile(r"(\d+) pass n=(\d+) ms=(\d+) path=(\d+) vmax=(\d+) vavg=(\d+) rev=(\d+) dx=(-?\d+) dy=(-?\d+) w=(\d+)")
M = re.compile(r"(\d+) mark round=(\d+) kind=(\w+) variant=(\w+)(.*)")
passes = [tuple(map(int, m.groups())) for l in open(os.path.join(d, "loop-trace.log"), encoding="utf8") if (m := P.match(l))]
marks = [(int(m[1]), int(m[2]), m[3], m[4], m[5]) for l in open(os.path.join(d, "pass-marks.log"), encoding="utf-8-sig") if (m := M.match(l))]
# every mark of the current driver (it writes rect=) for rounds 1 to 3; the stop marks and a mis-typed round are left out
run = [m for m in marks if "rect=" in m[4] and m[1] in (1, 2, 3) and m[2] != "stop"]
rows = []  # (round, kind, variant, pass tuple or None)
for i, m in enumerate(run):
    if m[2] == "round_end":
        continue
    t0 = m[0]
    t1 = run[i + 1][0] if i + 1 < len(run) else t0 + 5000
    got = [p for p in passes if t0 <= p[0] < t1]
    if got:
        for p in got:
            rows.append((m[1], m[2], m[3], p, m[4]))
    else:
        rows.append((m[1], m[2], m[3], None, m[4]))

def stat(v):
    v = sorted(v)
    return f"{v[0]}..{v[-1]} (med {v[len(v)//2]})" if v else "-"

print("== seen / meant, by round and kind")
tab = defaultdict(lambda: [0, 0])
for r, k, v, p, _ in rows:
    tab[(r, k)][0] += 1
    if p:
        tab[(r, k)][1] += 1
for key in sorted(tab):
    meant = len({(m[1], m[2], m[3], m[0]) for m in run if m[1] == key[0] and m[2] == key[1]})
    seen = len({(r, k, v, id(p)) for r, k, v, p, _ in rows if (r, k) == key and p})
    print(f"round {key[0]} {key[1]:9} meant {meant:3}  lines {tab[key][1]:3}  passes with no line {tab[key][0] - tab[key][1]}")

print("\n== numbers by kind and variant (all rounds)")
by = defaultdict(list)
for r, k, v, p, _ in rows:
    if p:
        by[(k, v)].append(p)
for key in sorted(by):
    ps = by[key]
    print(f"{key[0]:9} {key[1]:14} lines {len(ps):3}  n {stat([p[1] for p in ps])}  ms {stat([p[2] for p in ps])}  vavg {stat([p[5] for p in ps])}  vmax {stat([p[4] for p in ps])}")

print("\n== candidate flick rules: caught per kind (lines), and the share of meant flicks seen at all")
def horiz(p):
    path = max(1, p[3]); return abs(p[7]) >= 0.7 * path
rules = {
    "vavg>=1000 & ms<=120": lambda p: p[5] >= 1000 and p[2] <= 120,
    "... & horizontal": lambda p: p[5] >= 1000 and p[2] <= 120 and horiz(p),
    "vavg>=800 & ms<=150 & n<=10": lambda p: p[5] >= 800 and p[2] <= 150 and p[1] <= 10,
    "vavg>=1500 & ms<=120": lambda p: p[5] >= 1500 and p[2] <= 120,
    "vmax>=2000": lambda p: p[4] >= 2000,
}
kinds = sorted({k for _, k, _, _, _ in rows})
meant_flick = len([m for m in run if m[2] == "flick"])
for name, f in rules.items():
    c = {k: sum(1 for r, kk, v, p, _ in rows if kk == k and p and f(p)) for k in kinds}
    print(f"{name:32}", "  ".join(f"{k}:{c[k]}" for k in kinds), f"  (meant flicks {meant_flick}, lines for flicks {sum(1 for r, k, v, p, _ in rows if k == 'flick' and p)})")
