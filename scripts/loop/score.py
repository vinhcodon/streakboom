"""Scores a loop round (E29): python score.py round.csv [loop-trace.log]. Numbers only; reads the driver's CSV and the app's loop trace."""
import csv, sys, collections, re
R = list(csv.DictReader(open(sys.argv[1])))
def pos(r): return (int(r['x']), int(r['y'])) if r['x'] else None
print('samples', len(R), 'seconds', R[-1]['sec'])
last = -99; auto = collections.defaultdict(float); n = collections.defaultdict(int); ych = collections.defaultdict(int); still = collections.defaultdict(float); prev = None
for r in R:
    t = float(r['sec'])
    if r['event'].startswith('do:'): last = t
    p = pos(r)
    if not p: continue
    if prev and r['scene'] == prev[1] and t - last > 8:
        dx = abs(p[0] - prev[0][0]); auto[r['scene']] += dx; n[r['scene']] += 1
        if p[1] != prev[0][1]: ych[r['scene']] += 1
        if dx == 0 and p[1] == prev[0][1]: still[r['scene']] += t - prev[2]
    prev = (p, r['scene'], t)
print('scene, calm samples, sideways px by itself, height changes by itself, seconds standing still')
for s in auto: print(f'  {s:14} {n[s]:4} {auto[s]:7.0f} {ych[s]:3} {still[s]:6.0f}')
if len(sys.argv) > 2:
    on = [0, 0]; surf = []; spots = []; own = []
    for l in open(sys.argv[2]):
        m = re.search(r'view .*surfaces=(\d+) roomy=(\d+) spots=(-?\d+) on_spot=(-?\d+) own_cells=(-?\d+)', l)
        if m:
            surf.append(int(m[1])); spots.append(int(m[3])); own.append(int(m[5]))
            if int(m[4]) >= 0: on[int(m[4])] += 1
    if surf: print('view lines', len(surf), 'surfaces max', max(surf), 'spots max', max(spots), 'own cells max', max(own), 'on a spot / not', on[1], on[0])
    c = collections.Counter(re.sub(r' (pose|button)=.*', '', l.split(' ', 1)[1].strip()) for l in open(sys.argv[2]) if ' view ' not in l)
    cv = [int(m[1]) for l in open(sys.argv[2]) for m in [re.search(r' view .*cover=(-?\d+)', l)] if m and int(m[1]) >= 0]
    if cv: print('cover (share of the cat box that is not empty): views', len(cv), 'average', round(sum(cv) / len(cv)), '% | views at 30% or more:', sum(1 for c in cv if c >= 30), f'({round(100 * sum(1 for c in cv if c >= 30) / len(cv))}%)')
    st = collections.Counter((re.search(r' (settle_\w+|settle) (?:col=\S+ row=\S+ )?(move=\w+)?', l) or [0, '?', ''])[1] + ' ' + ((re.search(r' (settle_\w+|settle) (?:col=\S+ row=\S+ )?(move=\w+)?', l) or [0, 0, ''])[2] or '') for l in open(sys.argv[2]) if ' settle' in l)
    if st: print('settle:', dict(st))
    print('actions:', dict(c))
