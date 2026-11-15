"""Summary of a day of Peak (E29): python score_day.py loop-trace.log. Reads only the numbers and names the app wrote."""
import re, sys, collections, datetime
L = open(sys.argv[1], encoding='utf-8', errors='ignore').read().splitlines()
def ts(l):
    try: return int(l.split(' ', 1)[0]) / 1000
    except Exception: return None
if not L: print('empty trace'); sys.exit()
t0, t1 = ts(L[0]), ts(L[-1])
print('from', datetime.datetime.fromtimestamp(t0), 'to', datetime.datetime.fromtimestamp(t1), '| hours', round((t1 - t0) / 3600, 1))
looks = [l for l in L if re.search(r' settle(_presleep)? col=', l)]
cov = [int(re.search(r'cover=(\d+)', l)[1]) for l in looks]
print('looks at the picture:', len(looks), '| the cat covered 30% or more in', sum(1 for c in cov if c >= 30), 'of them (%d%%)' % (100 * sum(1 for c in cov if c >= 30) / max(1, len(cov))))
moves = collections.Counter(re.search(r'move=(\w+)', l)[1] for l in looks)
print('decisions:', dict(moves))
print('settle walks arrived / not:', sum(1 for l in L if 'settle_walk ok=1' in l), '/', sum(1 for l in L if 'settle_walk ok=0' in l), '| skipped for no room:', sum(1 for l in L if 'settle_walk skipped' in l), '| hops:', sum(1 for l in L if ' settle_hop ' in l))
print('step aside / make way to a clear place:', collections.Counter(re.search(r'move=(\w+)', l)[1] for l in L if ' aside_place ' in l))
per_hour = collections.Counter(datetime.datetime.fromtimestamp(ts(l)).strftime('%H') for l in L if ' settle_walk ok=1' in l or ' settle_hop ' in l)
print('moves by the rule per hour of the day:', dict(sorted(per_hour.items())))
ev = collections.Counter(re.sub(r' (pose|button)=.*', '', l.split(' ', 1)[1]) for l in L if ' settle' not in l and ' aside_place' not in l and ' view ' not in l)
print('other events:', dict(ev.most_common(15)))
