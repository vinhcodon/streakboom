# Builds the Peak sticker set v0 (plan sticker-test.md, ST-3) as transparent PNGs.
# The cat is drawn from the numbers of app/src/lib/rig/keys.ts and draw.ts (a port to SVG, not the app's own renderer),
# so it matches docs/plans/assets/sticker-character-sheet.svg. No app code is touched.
#
# Run (needs PyMuPDF: pip install pymupdf; the font is Be Vietnam Pro Bold (SIL OFL), in fonts/):
#   python build_stickers.py <output folder>
import math
import os
import sys

import fitz  # PyMuPDF

FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts", "BeVietnamPro-Bold.ttf")  # SIL Open Font License, see fonts/OFL.txt
FUR, DARK, BELLY, PINK, INK, MOUTH = "#f6c26b", "#e9a94a", "#fff1d6", "#f4a7a7", "#2b2220", "#7a4b3a"
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(OUT, exist_ok=True)


def f(n):
    return f"{n:.2f}".rstrip("0").rstrip(".")


def ell(x, y, rx, ry, fill, rot=0, op=1):
    if rx < 0.05 or ry < 0.05 or op < 0.01:
        return ""
    r = f' transform="rotate({f(rot)} {f(x)} {f(y)})"' if rot else ""
    o = f' fill-opacity="{f(op)}"' if op < 0.99 else ""
    return f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}" fill="{fill}"{o}{r}/>'


def tri(a, b, c, fill):
    return f'<polygon points="{f(a[0])},{f(a[1])} {f(b[0])},{f(b[1])} {f(c[0])},{f(c[1])}" fill="{fill}"/>'


def stroke_path(d, col, w, op=1):
    o = f' stroke-opacity="{f(op)}"' if op < 0.99 else ""
    return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{f(w)}" stroke-linecap="round"{o}/>'


def shift(k, dx, dy):
    m = lambda p: [p[0] + dx, p[1] + dy]
    n = dict(k)
    n["head"] = dict(k["head"], x=k["head"]["x"] + dx, y=k["head"]["y"] + dy)
    for e in ("earL", "earR"):
        n[e] = {kk: (m(v) if kk != "alpha" else v) for kk, v in k[e].items()}
    n["stripes"] = [(s[0] + dx, s[1] + dy, s[2] + dy, s[3]) for s in k["stripes"]]
    for e in ("eyeL", "eyeR", "cheekL", "cheekR"):
        n[e] = dict(k[e], x=k[e]["x"] + dx, y=k[e]["y"] + dy)
    n["nose"] = [m(p) for p in k["nose"]]
    mo = dict(k["mouth"])
    for kk in ("l0", "l1", "l2", "r0", "r1", "r2"):
        mo[kk] = m(mo[kk])
    n["mouth"] = mo
    return n


def E(x, y, rx, ry, a=1):
    return dict(x=x, y=y, rx=rx, ry=ry, a=a)


def leg(hx, hy, fx, fy, t, frx, fry, a, d):
    return dict(hx=hx, hy=hy, fx=fx, fy=fy, t=t, frx=frx, fry=fry, a=a, d=d)


STAND_F = dict(
    shadow=(60, 115, 32, 4.5), tail=([86, 100], [110, 100], [108, 74], 10),
    body=(60, 92, 34, 24, 0), belly=(60, 101, 19, 13, 0),
    legs=[leg(46, 108, 46, 110, 0, 11, 6.5, 0, 1), leg(74, 108, 74, 110, 0, 11, 6.5, 0, 1), leg(46, 108, 46, 110, 0, 11, 6.5, 1, 0), leg(74, 108, 74, 110, 0, 11, 6.5, 1, 0)],
    head=dict(x=60, y=64, rx=42, ry=34),
    earL=dict(a=[26, 52], b=[30, 22], c=[54, 38], ia=[31, 48], ib=[34, 30], ic=[48, 40], alpha=1),
    earR=dict(a=[94, 52], b=[90, 22], c=[66, 38], ia=[89, 48], ib=[86, 30], ic=[72, 40], alpha=1),
    stripes=[(53, 36, 43, 1), (60, 34, 43, 1), (67, 36, 43, 1)],
    eyeL=E(44, 66, 7.5, 9.5), eyeR=E(76, 66, 7.5, 9.5), cheekL=E(30, 78, 8, 4.6), cheekR=E(90, 78, 8, 4.6),
    nose=[[56.5, 74], [63.5, 74], [60, 78.5]],
    mouth=dict(l0=[60, 78.5], l1=[56, 83.5], l2=[51, 80], r0=[60, 78.5], r1=[64, 83.5], r2=[69, 80], ra=1, s=1),
)
SIT_F = dict(shift(STAND_F, 0, -12), shadow=(60, 115, 30, 4.5), tail=([84, 106], [108, 110], [104, 97], 10),
             body=(60, 90, 30, 28, 0), belly=(60, 98, 17, 18, 0),
             legs=[leg(34, 100, 34, 102, 0, 13, 12, 1, 1), leg(86, 100, 86, 102, 0, 13, 12, 1, 1), leg(50, 108, 50, 110, 0, 9.5, 6, 1, 0), leg(70, 108, 70, 110, 0, 9.5, 6, 1, 0)])
STAND_S = dict(
    shadow=(60, 115, 34, 4.5), tail=([28, 90], [8, 88], [12, 60], 9),
    body=(56, 88, 34, 22, 0), belly=(58, 99, 20, 9, 0),
    legs=[leg(51, 103.5, 51, 109.5, 11, 0, 0, 1, 1), leg(87, 103.5, 87, 109.5, 11, 0, 0, 1, 1), leg(37, 103.5, 37, 109.5, 11, 0, 0, 1, 0), leg(73, 103.5, 73, 109.5, 11, 0, 0, 1, 0)],
    head=dict(x=92, y=68, rx=27, ry=25),
    earL=dict(a=[70, 52], b=[72, 28], c=[88, 44], ia=[74, 48], ib=[75, 34], ic=[85, 44], alpha=0),
    earR=dict(a=[76, 52], b=[80, 26], c=[98, 46], ia=[81, 48], ib=[83, 34], ic=[94, 46], alpha=1),
    stripes=[(87, 46, 52, 1), (93, 45, 53, 1), (90, 45, 50, 0)],
    eyeL=E(84, 66, 0, 9, 0), eyeR=E(102, 66, 6.5, 8.5), cheekL=E(78, 79, 0, 4, 0), cheekR=E(94, 79, 7, 4),
    nose=[[116.5, 70.5], [119.5, 70.5], [118, 73.5]],
    mouth=dict(l0=[115, 78], l1=[112, 82], l2=[108, 79.5], r0=[115, 78], r1=[112, 82], r2=[108, 79.5], ra=0, s=0.55),
)
_SH = shift(STAND_S, -6, 22)
STRETCH_S = dict(_SH, shadow=(58, 115, 44, 4.5), tail=([16, 76], [4, 62], [10, 32], 9),
                 body=(46, 86, 34, 20, 22), belly=(56, 96, 20, 8, 22),
                 legs=[leg(24, 84, 22, 110, 11, 0, 0, 1, 1), leg(72, 98, 106, 111, 10, 5, 3.5, 1, 1), leg(30, 86, 28, 111, 11, 0, 0, 1, 0), leg(66, 99, 98, 112, 10, 6, 4, 1, 0)],
                 mouth=dict(_SH["mouth"], l0=[106, 96], r0=[106, 96], s=0.85))
LOAF_S = dict(
    STAND_S, shadow=(56, 115, 38, 4.5), tail=([18, 104], [4, 104], [8, 92], 9),
    body=(54, 100, 38, 16, 0), belly=(58, 106, 22, 7, 0),
    legs=[leg(51, 108, 51, 110, 0, 0, 0, 0, 1), leg(87, 108, 87, 110, 0, 0, 0, 0, 1), leg(37, 108, 37, 110, 0, 0, 0, 0, 0), leg(90, 110, 90, 112, 0, 9, 5, 1, 0)],
    head=dict(x=92, y=92, rx=24, ry=20),
    earL=dict(a=[72, 80], b=[74, 66], c=[86, 78], ia=[75, 78], ib=[76, 70], ic=[83, 78], alpha=0),
    earR=dict(a=[80, 82], b=[84, 68], c=[98, 80], ia=[84, 80], ib=[86, 72], ic=[94, 80], alpha=1),
    stripes=[(88, 74, 80, 1), (94, 73, 81, 1), (91, 74, 79, 0)],
    eyeL=E(86, 92, 0, 7.5, 0), eyeR=E(100, 92, 6, 7.5), cheekL=E(80, 100, 0, 3.5, 0), cheekR=E(96, 100, 6, 3.5),
    nose=[[111, 92], [114, 92], [112.5, 95.5]],
    mouth=dict(l0=[110, 98], l1=[107, 101], l2=[103, 99], r0=[110, 98], r1=[107, 101], r2=[103, 99], ra=0, s=0.55),
)

# Looks, from LOOKS in rig/engine.ts (the names are the app's states)
REST = dict(lid=1, happy=0, wide=0, cheek=0.6, mouth="smile", roll=0, dy=0, gx=0, gy=0, droop=0, perk=0, dots=0, z=0)
LOOK = {
    "rest": REST,
    "happy": dict(REST, happy=1, mouth="open", cheek=0.85),
    "purr": dict(REST, happy=1, roll=-5, dy=2, cheek=0.95),
    "huff": dict(REST, roll=7, dy=-1, lid=0.55, mouth="flat", cheek=0.3),
    "smirk": dict(REST, lid=0.62, roll=4, gx=2, cheek=0.8),
    "gasp": dict(REST, wide=1, mouth="o", cheek=0.4),
    "curious": dict(REST, roll=8, gx=3, gy=-3, wide=0.45, mouth="flat"),
    "sad": dict(REST, roll=-6, dy=5, gy=2, lid=0.7, mouth="flat", cheek=0.2, droop=1),
    "think": dict(REST, roll=6, gx=4, gy=-4, mouth="flat", dots=1),
    "drowsy": dict(REST, roll=-3, dy=4, lid=0.45, mouth="yawn"),
    "sleep": dict(REST, lid=0.06, mouth="flat", z=1),
    "wake": dict(REST, lid=0.08, mouth="yawn"),
}


def eye_svg(e, look):
    if e["rx"] < 0.3 or e["a"] ** 3 < 0.02:
        return ""
    x, y, rx, ry = e["x"] + look["gx"] * 0.75, e["y"] + look["gy"] * 0.75, e["rx"], e["ry"]
    s = rx / 7.5
    hp = max(0, min(1, 1.6 * look["happy"] - 0.6))
    op = max(0, 1 - 1.6 * look["happy"]) * (1 - max(0, min(1, (0.28 - look["lid"]) / 0.2)))
    closed = max(0, 1 - 1.6 * look["happy"]) * max(0, min(1, (0.28 - look["lid"]) / 0.2))
    out = ""
    if op > 0.01:
        g = 1 + 0.14 * look["wide"]
        w = look["wide"]
        out += f'<g transform="translate({f(x)},{f(y - ry)}) scale(1,{f(max(0.08, look["lid"]))}) translate(0,{f(ry)})">'
        out += ell(0, 0, rx * g, ry * (1 + 0.16 * w), INK)
        out += ell(rx * 0.35, -ry * 0.37, rx * (0.45 + 0.08 * w), rx * (0.45 + 0.08 * w), "#fff")
        out += ell(-rx * 0.32, ry * 0.42, rx * 0.2, rx * 0.2, "#fff") + "</g>"
    if hp > 0.01:
        out += stroke_path(f"M{f(x - 8 * s)} {f(y + 4)} Q{f(x)} {f(y - 7)} {f(x + 8 * s)} {f(y + 4)}", INK, 3)
    if closed > 0.01:
        out += stroke_path(f"M{f(x - 8 * s)} {f(y + 1)} Q{f(x)} {f(y + 7)} {f(x + 8 * s)} {f(y + 1)}", INK, 3)
    return out


def mouth_svg(k, look):
    m = k["mouth"]
    x, y = m["l0"]
    s = m["s"]
    out = ""
    kind = look["mouth"]
    if kind == "smile":
        out += stroke_path(f"M{f(m['l0'][0])} {f(m['l0'][1])} Q{f(m['l1'][0])} {f(m['l1'][1])} {f(m['l2'][0])} {f(m['l2'][1])}", MOUTH, 1.9)
        if m["ra"] > 0.01:
            out += stroke_path(f"M{f(m['r0'][0])} {f(m['r0'][1])} Q{f(m['r1'][0])} {f(m['r1'][1])} {f(m['r2'][0])} {f(m['r2'][1])}", MOUTH, 1.9)
    elif kind == "open":
        out += f'<path d="M{f(x - 8 * s)} {f(y + 0.5)} Q{f(x)} {f(y + 11.5)} {f(x + 8 * s)} {f(y + 0.5)} Z" fill="#d9696f"/>'
    elif kind == "flat":
        out += stroke_path(f"M{f(x - 6 * s)} {f(y + 2.5)} L{f(x + 6 * s)} {f(y + 2.5)}", MOUTH, 1.9)
    elif kind == "o":
        out += ell(x, y + 4.5, 3.4 * (0.5 + 0.5 * s), 3.4, MOUTH)
    elif kind == "yawn":
        out += ell(x, y + 5.5, 6 * s, 7.5, "#d9696f")
    return out


def leg_svg(l):
    if l["a"] < 0.01:
        return ""
    col = DARK if l["d"] >= 0.5 else FUR
    out = ""
    if l["t"] > 0.3:
        out += stroke_path(f"M{f(l['hx'])} {f(l['hy'])} L{f(l['fx'])} {f(l['fy'])}", col, l["t"])
    return out + ell(l["fx"], l["fy"], l["frx"], l["fry"], col)


def ear_pts(e, look, side):
    a, b, c = list(e["a"]), list(e["b"]), list(e["c"])
    ia, ib, ic = list(e["ia"]), list(e["ib"]), list(e["ic"])
    d = look["droop"]
    p = look["perk"]
    sgn = -1 if side == "L" else 1
    if d:
        b = [b[0] + sgn * 10 * d, b[1] + 16 * d]
        ib = [ib[0] + sgn * 8 * d, ib[1] + 13 * d]
    if p:
        b = [b[0], b[1] - 4 * p]
    return a, b, c, ia, ib, ic


def cat(k, look, front=True):
    """The cat in rig units (0..120). Returns an SVG fragment."""
    sh = k["shadow"]
    o = ell(sh[0], sh[1], sh[2], sh[3], "#000", op=0.08)
    t = k["tail"]
    o += stroke_path(f"M{f(t[0][0])} {f(t[0][1])} Q{f(t[1][0])} {f(t[1][1])} {f(t[2][0])} {f(t[2][1])}", DARK, t[3])
    o += leg_svg(k["legs"][0]) + leg_svg(k["legs"][1])
    b, bl = k["body"], k["belly"]
    o += ell(b[0], b[1], b[2], b[3], FUR, b[4]) + ell(bl[0], bl[1], bl[2], bl[3], BELLY, bl[4])
    o += leg_svg(k["legs"][2]) + leg_svg(k["legs"][3])
    h = k["head"]
    hx, hy = h["x"], h["y"]
    o += f'<g transform="translate({f(hx + look["gx"] * 0.25)},{f(hy + look["dy"] + look["gy"] * 0.25)}) rotate({f(look["roll"])}) translate({f(-hx)},{f(-hy)})">'
    for name, side in (("earL", "L"), ("earR", "R")):
        e = k[name]
        if e["alpha"] ** 3 > 0.01:
            a, bb, c, ia, ib, ic = ear_pts(e, look, side)
            o += tri(a, bb, c, FUR) + tri(ia, ib, ic, PINK)
    o += ell(hx, hy, h["rx"], h["ry"], FUR)
    for s in k["stripes"]:
        if s[3] > 0.01:
            o += f'<path d="M{f(s[0])} {f(s[1])} L{f(s[0])} {f(s[2])}" stroke="{DARK}" stroke-width="2.6" stroke-linecap="round"/>'
    o += eye_svg(k["eyeL"], look) + eye_svg(k["eyeR"], look)
    for c in (k["cheekL"], k["cheekR"]):
        if c["rx"] > 0.3:
            o += ell(c["x"], c["y"], c["rx"], c["ry"], "#f59e9e", op=c["a"] * look["cheek"])
    n = k["nose"]
    o += tri(n[0], n[1], n[2], "#e8828a") + mouth_svg(k, look)
    if look["dots"]:
        for i in range(3):
            o += ell(hx + 22 + i * 7, hy - 40 - i * 3, 2.4, 2.4, "#8a8a8a", op=0.9)
    o += "</g>"
    if look["z"]:
        zx, zy = hx + 14, hy - 30
        o += f'<path d="M{f(zx)} {f(zy)} h9 l-9 10 h9 M{f(zx + 12)} {f(zy - 12)} h6 l-6 7 h6" fill="none" stroke="#6b7cff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
    return o


def wrap(inner, x, y, s):
    return f'<g transform="translate({f(x)},{f(y)}) scale({f(s)})">{inner}</g>'


# ---- sticker-only art (not in the app): the lounging cat (3), the curled-up sleeper (9), the rain (10), confetti (7) ----
def lounging():
    """Lying back at ease with one leg crossed over the other, head propped on a paw, thinking about life."""
    o = ell(64, 115, 50, 4.5, "#000", op=0.08)
    o += stroke_path("M104 108 Q126 112 122 119", DARK, 8)                     # tail laid on the ground
    o += stroke_path("M90 94 L102 68 L116 85", DARK, 10) + ell(118, 89, 7, 5, DARK, 30)   # the lower leg, knee up
    o += ell(68, 98, 38, 17, FUR, -6) + ell(70, 95, 26, 8, BELLY, -6)           # the body on its back
    o += stroke_path("M78 98 L82 72 L100 66", FUR, 10) + ell(103, 65, 7, 5, FUR, -20)  # the other leg, ankle on the knee
    o += ell(60, 90, 7, 5, FUR, -15) + ell(60, 88, 2.4, 1.8, PINK, -15)        # a paw resting on the belly
    o += ell(10, 100, 9, 6, FUR, 10)                                           # the other paw, under the head
    k = shift(STAND_F, 0, 0)
    look = dict(LOOK["rest"], lid=0.5, roll=-13, gy=-3, gx=2, mouth="flat", cheek=0.5)
    o += f'<g transform="translate(32,84) scale(0.7) translate(-60,-64)">{cat_head_only(k, look)}</g>'
    return o


def curled_up():
    """Curled into a round loaf like a mochi: the head on its paws, the tail wrapped round the front."""
    o = ell(60, 115, 46, 4.5, "#000", op=0.08)
    o += ell(60, 92, 45, 30, FUR) + ell(60, 100, 30, 14, DARK, 0, 0.25)
    o += stroke_path("M104 98 Q100 122 58 119 Q22 117 14 98", DARK, 11)
    o += ell(46, 104, 9, 6, FUR) + ell(74, 104, 9, 6, FUR)
    k = STAND_F
    look = dict(LOOK["rest"], lid=0.06, roll=7, mouth="smile", cheek=0.85, happy=0)
    o += f'<g transform="translate(60,78) scale(0.86) translate(-60,-64)">{cat_head_only(k, look)}</g>'
    o += '<path d="M92 38 h9 l-9 10 h9 M104 24 h6 l-6 7 h6" fill="none" stroke="#6b7cff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
    return o


def cat_head_only(k, look):
    """Ears, head, face of the cat (the same drawing as in cat())."""
    h = k["head"]
    hx, hy = h["x"], h["y"]
    o = f'<g transform="translate({f(hx)},{f(hy + look["dy"])}) rotate({f(look["roll"])}) translate({f(-hx)},{f(-hy)})">'
    for name, side in (("earL", "L"), ("earR", "R")):
        a, bb, c, ia, ib, ic = ear_pts(k[name], look, side)
        o += tri(a, bb, c, FUR) + tri(ia, ib, ic, PINK)
    o += ell(hx, hy, h["rx"], h["ry"], FUR)
    for s in k["stripes"]:
        o += f'<path d="M{f(s[0])} {f(s[1])} L{f(s[0])} {f(s[2])}" stroke="{DARK}" stroke-width="2.6" stroke-linecap="round"/>'
    o += eye_svg(k["eyeL"], look) + eye_svg(k["eyeR"], look)
    for c in (k["cheekL"], k["cheekR"]):
        o += ell(c["x"], c["y"], c["rx"], c["ry"], "#f59e9e", op=c["a"] * look["cheek"])
    n = k["nose"]
    return o + tri(n[0], n[1], n[2], "#e8828a") + mouth_svg(k, look) + "</g>"


def paw(x, y, rx=8, ry=7, rot=0):
    """A front paw in front of the body, with a pink pad (sticker art for gestures the rig does not draw)."""
    r = f' transform="rotate({f(rot)} {f(x)} {f(y)})"' if rot else ""
    outline = f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rx)}" ry="{f(ry)}" fill="{FUR}" stroke="{DARK}" stroke-width="1.6"{r}/>'  # an outline, so a paw shows against the fur
    return outline + ell(x, y + ry * 0.25, rx * 0.4, ry * 0.3, PINK, rot)


def arcs(*specs):
    return "".join(stroke_path(d, "#b9a98f", 1.8, 0.9) for d in specs)


def puffs():
    return "".join(ell(x, y, r, r, "#d9dde3") for x, y, r in ((84, 74, 3.2), (92, 70, 2.4), (98, 76, 3.6), (90, 80, 2.2)))


def cloud_and_rain():
    c = "#cfd8e3"
    cl = ell(40, 18, 22, 14, c) + ell(62, 12, 20, 15, c) + ell(82, 18, 22, 14, c) + ell(62, 24, 38, 12, c)
    drops = ""
    for x, y in ((30, 44), (52, 50), (74, 44), (94, 52), (40, 66), (84, 70)):
        drops += f'<path d="M{x} {y} q3 5 0 8 q-3 -3 0 -8z" fill="#8ecae6"/>'
    return cl + drops


def hearts():
    out = ""
    for x, y, k in ((14, 40, 1.0), (104, 30, 1.3), (22, 8, 0.7), (96, 80, 0.8)):
        out += f'<path transform="translate({x},{y}) scale({k})" d="M0 3 C-7 -3 -3 -9 0 -5 C3 -9 7 -3 0 3 Z" fill="#f08a99"/>'
    return out


def confetti():
    cols = ["#f4a7a7", "#8ecae6", "#b8e0a8", "#c9b8f0", "#f6c26b"]
    pcs = ""
    pts = [(14, 30, 0), (26, 12, 1), (98, 16, 2), (110, 38, 3), (8, 66, 4), (112, 70, 0), (20, 96, 2), (104, 100, 1), (84, 8, 3), (40, 6, 4)]
    for i, (x, y, c) in enumerate(pts):
        if i % 2:
            pcs += ell(x, y, 2.6, 2.6, cols[c])
        else:
            pcs += f'<rect x="{x - 2.5}" y="{y - 1.6}" width="5" height="3.2" fill="{cols[c]}" transform="rotate({i * 37} {x} {y})"/>'
    return pcs


# ---- text and composition ---------------------------------------------------------------------------------------------
_FONT = fitz.Font(fontfile=FONT)


def outline(page, pt, text, fs, r=3.4):
    """A white outline made of the text drawn in a ring of offsets (a stroked glyph gives spikes in this library)."""
    page.insert_font(fontname="sg", fontfile=FONT)
    for i in range(16):
        a = i * math.pi / 8
        page.insert_text(fitz.Point(pt.x + r * math.cos(a), pt.y + r * math.sin(a)), text, fontname="sg", fontsize=fs, color=(1, 1, 1), fill=(1, 1, 1))


def png_from(svg_inner, size, text=None, path=None, bg=None, text_y=None):
    w, h = size
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{svg_inner}</svg>'
    sdoc = fitz.open(stream=svg.encode(), filetype="svg")
    pdf = fitz.open("pdf", sdoc.convert_to_pdf())
    page = pdf[0]
    if text:
        fs = 44.0
        while _FONT.text_length(text, fontsize=fs) > w - 24:
            fs -= 1
        tw = _FONT.text_length(text, fontsize=fs)
        pt = fitz.Point((w - tw) / 2, text_y or 52)
        page.insert_font(fontname="sg", fontfile=FONT)
        outline(page, pt, text, fs)
        page.insert_text(pt, text, fontname="sg", fontsize=fs, color=(0.169, 0.133, 0.125), fill=(0.169, 0.133, 0.125))
    pix = page.get_pixmap(alpha=True, dpi=72)
    if path:
        pix.save(path)
    return pix


STICKERS = [
    # file, text, svg of the cat (rig units; wrapped below), extras in rig units
    ("01", "Chào buổi sáng!", lambda: cat(STRETCH_S, LOOK["wake"])),
    ("02", "Sướng quá~", lambda: cat(STAND_F, LOOK["purr"])),
    ("03", "Đời là thế.", lounging, dict(scale=2.15, dx=4, dy=14)),
    ("04", "Buồn ngủ…", lambda: cat(SIT_F, LOOK["drowsy"])),
    ("05", "Hừm.", lambda: cat(SIT_F, LOOK["huff"]) + puffs()),
    ("06", "Quá sức mèo rồi.", lambda: cat(STAND_F, LOOK["sad"])),
    ("07", "Giỏi quá!", lambda: confetti() + cat(STAND_F, LOOK["happy"])),
    ("08", "Làm chung nhé?", lambda: cat(STAND_F, dict(LOOK["curious"], roll=12, wide=0.6, cheek=0.7)) + stroke_path("M38 98 L22 74", FUR, 10) + paw(20, 68, 8, 9, -15) + arcs("M8 60 q-5 6 -1 13", "M4 52 q-7 8 -2 18")),
    ("09", "Ngủ ngon.", curled_up, dict(scale=2.3, dy=6)),
    ("10", "Trời mưa rồi.", lambda: cat(SIT_F, dict(LOOK["curious"], roll=-4, gx=0, gy=2, wide=0.2)) + wrap(cloud_and_rain(), 18, -16, 0.8), dict(scale=2.1, dy=22)),
    ("11", "Xin lỗi nhé.", lambda: cat(STAND_F, dict(LOOK["sad"], roll=-12, dy=8, lid=0.08))),
    ("12", "Cảm ơn nha!", lambda: hearts() + cat(STAND_F, dict(LOOK["purr"], roll=-3, dy=0))),
    ("13", "Ơ!", lambda: cat(STAND_F, LOOK["gasp"])),
    ("14", "Để mình nghĩ…", lambda: cat(STAND_F, dict(LOOK["think"], roll=6, dots=0)) + paw(68, 94, 8, 6, 20) + ell(88, 32, 2.8, 2.8, "#8a8a8a") + ell(97, 25, 3.8, 3.8, "#8a8a8a") + ell(108, 16, 5, 5, "#8a8a8a", 0, 0.9)),
    ("15", "Hì hì.", lambda: cat(STAND_F, dict(LOOK["purr"], roll=8, dy=0, mouth="smile", cheek=1.0)) + paw(70, 86, 9, 7, 25) + arcs("M96 52 q6 -3 7 -10", "M102 62 q7 -2 9 -9")),
    ("16", "Ừ, giỏi lắm.", lambda: cat(STAND_F, dict(LOOK["smirk"], lid=0.5, gx=-4, roll=3, mouth="flat", cheek=0.4)) + paw(52, 100, 7.5, 6.5, 15) + paw(68, 100, 7.5, 6.5, -15) + arcs("M38 88 q-5 5 -1 11", "M82 88 q5 5 1 11")),
    ("17", "Ai đợi đâu.", lambda: cat(STAND_S, dict(LOOK["rest"], lid=0.7, roll=-6, mouth="flat", cheek=1.0, gx=-3))),
]

S = 2.45
made = []
for num, text, art, *opt in STICKERS:
    o = opt[0] if opt else {}
    sc = o.get("scale", S)
    inner = wrap(art(), (360 - 120 * sc) / 2 + o.get("dx", 0), 82 - 20 * sc + 8 + o.get("dy", 0), sc)
    p = os.path.join(OUT, f"{num}.png")
    png_from(inner, (360, 360), text, p)
    made.append(p)

# icon 124 x 124 (the face and the body, front) and preview 440 x 440 (a collage of nine)
png_from(wrap(cat(STAND_F, LOOK["rest"]), 2, 4, 1.0), (124, 124), None, os.path.join(OUT, "icon_124.png"))
prev = ""
for i in range(9):
    x, y = 8 + (i % 3) * 142, 64 + (i // 3) * 124
    pix = fitz.Pixmap(made[i])
    prev += ""  # collage is composed below with pixmaps
pv = fitz.open()
pg = pv.new_page(width=440, height=440)
for i in range(9):
    r = fitz.Rect(10 + (i % 3) * 142, 62 + (i // 3) * 124, 10 + (i % 3) * 142 + 124, 62 + (i // 3) * 124 + 124)
    pg.insert_image(r, filename=made[i])
pg.insert_font(fontname="sg", fontfile=FONT)
tw = _FONT.text_length("Peak", fontsize=46)
outline(pg, fitz.Point((440 - tw) / 2, 50), "Peak", 46, 4)
pg.insert_text(fitz.Point((440 - tw) / 2, 50), "Peak", fontname="sg", fontsize=46, color=(0.169, 0.133, 0.125), fill=(0.169, 0.133, 0.125))
pg.get_pixmap(alpha=True, dpi=72).save(os.path.join(OUT, "preview_440.png"))

# promote banners, 9 sizes: the cat on the left, "Peak" on the right, on a warm cream
for (bw, bh) in [(720, 120), (480, 150), (320, 100), (240, 75), (480, 80), (320, 53), (240, 40), (960, 320), (720, 225)]:
    ch = bh * 165 / 225 if (bw, bh) == (720, 225) else bh  # the content of 720 x 225 stays inside 720 x 165
    top = (bh - ch) / 2
    sc = ch * 0.92 / 100
    cx = bw / 2 - (ch * 0.9 + 0.62 * ch * 1.9) / 2 + 0 if False else bw * 0.30
    bg = f'<rect width="{bw}" height="{bh}" fill="#fff6e3"/>'
    cat_art = wrap(cat(STAND_F, LOOK["rest"]), cx - 60 * sc, top + ch * 0.04 - 18 * sc, sc)
    pix = png_from(bg + cat_art, (bw, bh), None, None)
    pdoc = fitz.open()
    pgb = pdoc.new_page(width=bw, height=bh)
    pgb.insert_image(fitz.Rect(0, 0, bw, bh), pixmap=pix)
    fs = ch * 0.5
    pgb.insert_font(fontname="sg", fontfile=FONT)
    pgb.insert_text(fitz.Point(cx + 60 * sc + ch * 0.1, top + ch * 0.5 + fs * 0.35), "Peak", fontname="sg", fontsize=fs, color=(0.169, 0.133, 0.125), fill=(0.169, 0.133, 0.125))
    pgb.get_pixmap(alpha=False, dpi=72).save(os.path.join(OUT, f"banner_{bw}x{bh}.png"))

# a contact sheet on white (for looking at the set; not part of the upload)
sheet = fitz.open()
sp = sheet.new_page(width=1100, height=880)
sp.draw_rect(sp.rect, color=None, fill=(1, 1, 1))
for i, p in enumerate(made):
    r = fitz.Rect(10 + (i % 5) * 216, 10 + (i // 5) * 214, 10 + (i % 5) * 216 + 206, 10 + (i // 5) * 214 + 206)
    sp.draw_rect(r, color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97))
    sp.insert_image(r, filename=p)
sp.get_pixmap(dpi=72).save(os.path.join(OUT, "contact_sheet.png"))
print("done", len(made), "stickers in", OUT)
