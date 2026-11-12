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

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "BeVietnamPro-Bold.ttf")  # SIL Open Font License, see fonts/OFL.txt (Vietnamese and English)
FONT_JA = os.path.join(HERE, "fonts", "MPLUSRounded1c-Bold.ttf")  # SIL Open Font License, see fonts/OFL-MPlusRounded1c.txt (Japanese)
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
    if "lidR" in look and e["x"] > 60:  # a different lid for the right eye (a skeptical squint)
        look = dict(look, lid=look["lidR"])
    if look.get("swirl"):  # dizzy spiral eyes (sticker art)
        x0, y0 = e["x"], e["y"]
        d = f"M{f(x0)} {f(y0)} m0 0 a2 2 0 1 1 3 -2 a4.5 4.5 0 1 1 -7 3 a7 7 0 1 1 11 -5"
        return stroke_path(d, INK, 2.2)
    if look.get("shock"):  # a white eye with a tiny pupil: a shock (sticker art)
        return (ell(e["x"], e["y"], e["rx"] * 1.2, e["ry"] * 1.1, "#fff") + f'<ellipse cx="{f(e["x"])}" cy="{f(e["y"])}" rx="{f(e["rx"] * 1.2)}" ry="{f(e["ry"] * 1.1)}" fill="none" stroke="{INK}" stroke-width="1.8"/>'
                + ell(e["x"], e["y"], 2.4, 2.4, INK))
    if look.get("hearts"):  # the eyes are two pink hearts (sticker art)
        k = e["rx"] / 7.5 * 1.25
        return (f'<path transform="translate({f(e["x"])},{f(e["y"] + 1)}) scale({f(k)})" '
                f'd="M0 7 C-13 -3 -6 -13 0 -6 C6 -13 13 -3 0 7Z" fill="#ef6f7e"/>')
    if look.get("wink") and e["x"] > 60:
        look = dict(look, happy=1, lid=1)
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
def thought_bubble():
    """Three round bubbles that grow as they rise from the head, the biggest holding a little fish: a cat's idea of "life"."""
    grey, white = "#b8c2cc", "#ffffff"
    # the trail starts in the gap between the ears with clear space above the head, and each circle clears the next by a visible gap
    circles = ((30, 51, 2.6), (37, 41, 4.2), (50, 24, 11.5))
    o = "".join(f'<circle cx="{x}" cy="{y}" r="{r + 1.3}" fill="{grey}"/>' for x, y, r in circles)
    o += "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{white}"/>' for x, y, r in circles)
    return o + ('<ellipse cx="49" cy="24" rx="6" ry="3.8" fill="#8ecae6"/><path d="M54 24 l5 -4 v8z" fill="#8ecae6"/>'
                '<circle cx="46" cy="23" r="0.9" fill="#2b2220"/>')


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
    return o + thought_bubble()


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


def paw(x, y, rx=8, ry=7, rot=0, pad=False):
    """A front paw (sticker art for gestures the rig does not draw): a rounded paw with three toe lines at the top and, if the palm
    faces us, a pink pad. A thin darker edge makes it show against fur of the same colour."""
    g = f'<g transform="translate({f(x)},{f(y)}) rotate({f(rot)})">'
    g += f'<ellipse rx="{f(rx)}" ry="{f(ry)}" fill="{FUR}" stroke="{DARK}" stroke-width="1.1"/>'
    for dx in (-0.45, 0, 0.45):
        g += f'<path d="M{f(dx * rx)} {f(-ry * 0.95)} L{f(dx * rx)} {f(-ry * 0.45)}" stroke="{DARK}" stroke-width="1.1" stroke-linecap="round"/>'
    if pad:
        g += f'<ellipse cy="{f(ry * 0.3)}" rx="{f(rx * 0.45)}" ry="{f(ry * 0.35)}" fill="{PINK}"/>'
    return g + "</g>"


def thumbs_up(x, y):
    """A fist with the thumb up, sitting at the edge of the body, no arm (sticker art, the rig has no such gesture)."""
    o = f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="10" ry="9" fill="{FUR}" stroke="{DARK}" stroke-width="1.1"/>'
    o += f'<ellipse cx="{f(x - 1)}" cy="{f(y - 11)}" rx="4.4" ry="8" fill="{FUR}" stroke="{DARK}" stroke-width="1.1"/>'
    o += f'<ellipse cx="{f(x - 1)}" cy="{f(y - 5)}" rx="6" ry="3.5" fill="{FUR}"/>'
    for dy in (-1, 3):
        o += f'<path d="M{f(x - 2)} {f(y + dy)} L{f(x + 6)} {f(y + dy)}" stroke="{DARK}" stroke-width="1.1" stroke-linecap="round"/>'
    return o


def sweat():
    return '<path d="M99 30 Q104 37 99 41 Q94 37 99 30" fill="#8ecae6"/>'


def tears():
    t = "".join(stroke_path(d, "#8ecae6", 4.2) for d in ("M43 77 Q40 88 42 98", "M77 77 Q80 88 78 98"))
    return t + '<path d="M52 87 Q60 79 68 87" fill="none" stroke="#7a4b3a" stroke-width="2.2" stroke-linecap="round"/>'


def joy_tears():
    o = ""
    for x, y, r in ((22, 62, -30), (98, 62, 30), (14, 74, -20), (106, 74, 20)):
        o += f'<path transform="translate({x},{y}) rotate({r})" d="M0 -5 Q4 1 0 4 Q-4 1 0 -5" fill="#8ecae6"/>'
    return o


def ok_sign(x, y):
    """A paw making the 'ok' ring, three fingers up (sticker art)."""
    o = f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="9" ry="8" fill="{FUR}" stroke="{DARK}" stroke-width="1.1"/>'
    for dx, dy, r in ((6, -9, 12), (11, -5, 40), (12, 1, 65)):
        o += f'<ellipse cx="{f(x + dx)}" cy="{f(y + dy)}" rx="3.3" ry="6" fill="{FUR}" stroke="{DARK}" stroke-width="1.1" transform="rotate({r} {f(x + dx)} {f(y + dy)})"/>'
    o += f'<circle cx="{f(x - 5)}" cy="{f(y - 5)}" r="4.6" fill="{BELLY}" stroke="{DARK}" stroke-width="1.6"/>'
    return o


def star(x, y, r, col):
    """A four-point sparkle (sticker art)."""
    return f'<path transform="translate({x},{y})" d="M0 {-r} Q{r * 0.18} {-r * 0.18} {r} 0 Q{r * 0.18} {r * 0.18} 0 {r} Q{-r * 0.18} {r * 0.18} {-r} 0 Q{-r * 0.18} {-r * 0.18} 0 {-r}Z" fill="{col}"/>'


def hop_for_joy():
    """The cat in the air with a small shadow below and sparkles: cheering without arms (the motion ticks under the feet were dropped, they confused)."""
    k = dict(STAND_F, shadow=(60, 115, 0, 0))
    o = ell(60, 116, 22, 3.2, "#000", op=0.08)
    o += wrap(cat(k, dict(LOOK["happy"], dy=0, cheek=0.9)), 0, -10, 1)
    return o + star(14, 42, 6, "#ffd166") + star(108, 34, 7, "#f4a7a7") + star(102, 72, 4, "#8ecae6") + star(18, 76, 4, "#c9b8f0")


def no_entry_sign():
    """The cat holds a 'no entry' road sign (a red disc with a white bar) in front of its belly: a gentle, cute 'no'."""
    sign = (f'<circle cx="60" cy="102" r="16" fill="#e5484d" stroke="#c93a40" stroke-width="1.2"/>'
            f'<rect x="49.5" y="99.3" width="21" height="5.4" rx="1.6" fill="#fff"/>')
    return cat(STAND_F, dict(LOOK["rest"], lid=0.9, mouth="smile", cheek=0.7, roll=0)) + sign + paw(41, 104, 6, 6.5, -20) + paw(79, 104, 6, 6.5, 20)


def arcs(*specs):
    return "".join(stroke_path(d, "#b9a98f", 1.8, 0.9) for d in specs)


def puffs():
    return "".join(ell(x, y, r, r, "#d9dde3") for x, y, r in ((84, 74, 3.2), (92, 70, 2.4), (98, 76, 3.6), (90, 80, 2.2)))


def cloud_and_rain():
    c = "#9fb3c8"
    cl = ell(40, 18, 22, 14, c) + ell(62, 12, 20, 15, c) + ell(82, 18, 22, 14, c) + ell(62, 24, 38, 12, c)
    drops = ""
    for x, y in ((30, 44), (52, 50), (74, 44), (94, 52), (40, 66), (84, 70)):
        drops += f'<path d="M{x} {y} q3 5 0 8 q-3 -3 0 -8z" fill="#5aa9d6"/>'
    return cl + drops


def hearts():
    out = ""
    for x, y, k in ((12, 50, 1.0), (106, 40, 1.3), (22, 26, 0.8), (100, 86, 0.8)):  # all below the text line
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
_FONTS = {}


def _font_obj(path):
    if path not in _FONTS:
        _FONTS[path] = fitz.Font(fontfile=path)
    return _FONTS[path]


_FONT = _font_obj(FONT)


def outline(page, pt, text, fs, r=3.4, font=FONT):
    """A white outline made of the text drawn in a ring of offsets (a stroked glyph gives spikes in this library)."""
    name = "f" + str(abs(hash(font)) % 100000)
    page.insert_font(fontname=name, fontfile=font)
    for i in range(16):
        a = i * math.pi / 8
        page.insert_text(fitz.Point(pt.x + r * math.cos(a), pt.y + r * math.sin(a)), text, fontname=name, fontsize=fs, color=(1, 1, 1), fill=(1, 1, 1))


def png_from(svg_inner, size, text=None, path=None, bg=None, text_y=None, font=FONT):
    w, h = size
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{svg_inner}</svg>'
    sdoc = fitz.open(stream=svg.encode(), filetype="svg")
    pdf = fitz.open("pdf", sdoc.convert_to_pdf())
    page = pdf[0]
    if text:
        fo = _font_obj(font)
        name = "f" + str(abs(hash(font)) % 100000)
        fs = 44.0
        while fo.text_length(text, fontsize=fs) > w - 24:
            fs -= 1
        tw = fo.text_length(text, fontsize=fs)
        pt = fitz.Point((w - tw) / 2, text_y or 52)
        page.insert_font(fontname=name, fontfile=font)
        outline(page, pt, text, fs, font=font)
        page.insert_text(pt, text, fontname=name, fontsize=fs, color=(0.169, 0.133, 0.125), fill=(0.169, 0.133, 0.125))
    pix = page.get_pixmap(alpha=True, dpi=72)
    if path:
        pix.save(path)
    return pix


STICKERS = [
    # file, text, svg of the cat (rig units; wrapped below), extras in rig units
    ("01", "Chào buổi sáng!", lambda: cat(STRETCH_S, LOOK["wake"]), dict(scale=2.8, dy=-14)),
    ("02", "Sướng quá~", lambda: cat(STAND_F, LOOK["purr"])),
    ("03", "Cuộc sống mà.", lounging, dict(scale=2.5, dx=2, dy=8)),
    ("04", "Buồn ngủ…", lambda: cat(SIT_F, dict(LOOK["drowsy"], lid=0.34, roll=-8, dy=8, droop=0.4, mouth="yawn", cheek=0.8)) + '<path d="M69.5 80.5 Q72.5 83.5 71.5 87" fill="none" stroke="#a9d8ee" stroke-width="2.2" stroke-linecap="round"/><path d="M71.5 87.5 Q69 90.5 71.5 92.5 Q74 90.5 71.5 87.5Z" fill="#a9d8ee"/>'),
    ("05", "Hừm.", lambda: cat(SIT_F, dict(LOOK["rest"], lid=0.06, roll=15, dy=-2, gx=-7, mouth="flat", cheek=0.4)) + puffs() + stroke_path("M10 60 l7 3 M8 70 l9 1", "#b9a98f", 2)),
    ("06", "Quá sức mèo rồi.", lambda: cat(STAND_F, LOOK["sad"])),
    ("08", "Làm chung nhé?", lambda: cat(STAND_F, dict(LOOK["curious"], roll=12, wide=0.6, cheek=0.7)) + paw(25, 94, 9, 10.5, -40, True) + arcs("M11 82 q-6 6 -2 14", "M5 76 q-8 9 -3 20")),
    ("09", "Ngủ ngon.", curled_up, dict(scale=2.7, dy=-14)),
    ("18", "Haha!", lambda: joy_tears() + cat(STAND_F, dict(LOOK["happy"], mouth="yawn", roll=8, dy=-2, cheek=0.95)) + paw(58, 104, 7, 6.5, 40)),
    ("11", "Xin lỗi nhé.", lambda: cat(STAND_F, dict(LOOK["sad"], roll=-6, dy=5, lid=1, wide=0.9, cheek=0.3, droop=1)) + sweat()),
    ("12", "Cảm ơn nha!", lambda: star(16, 48, 6, "#ffd166") + star(104, 40, 7, "#f4a7a7") + star(98, 74, 4, "#8ecae6") + cat(STAND_F, dict(LOOK["rest"], wide=0.5, mouth="smile", cheek=0.9, roll=-4, dy=6)) + paw(54, 94, 6.5, 9, 14, True) + paw(66, 94, 6.5, 9, -14, True)),
    ("13", "Ơ!", lambda: cat(STAND_F, dict(LOOK["rest"], shock=1, mouth="yawn", cheek=0.3, roll=11, dy=3)) + stroke_path("M42 24 l-5 -9 M58 18 l0 -10 M76 24 l5 -9", "#b9a98f", 2.4)),
    ("14", "Để mình nghĩ…", lambda: cat(STAND_F, dict(LOOK["think"], roll=6, dots=0)) + paw(70, 90, 7, 8.5, 22) + ell(88, 32, 2.8, 2.8, "#8a8a8a") + ell(97, 25, 3.8, 3.8, "#8a8a8a") + ell(108, 16, 5, 5, "#8a8a8a", 0, 0.9)),
    ("15", "Hì hì.", lambda: cat(STAND_F, dict(LOOK["purr"], roll=8, dy=0, mouth="smile", cheek=1.0)) + paw(66, 86, 7.5, 9.5, 28) + arcs("M96 52 q6 -3 7 -10", "M102 62 q7 -2 9 -9")),
    ("16", "Giỏi quá.", lambda: cat(STAND_F, dict(LOOK["smirk"], lid=0.5, gx=-4, roll=3, mouth="flat", cheek=0.4)) + thumbs_up(91, 95)),
    ("17", "Ai đợi đâu.", lambda: cat(STAND_S, dict(LOOK["rest"], lid=0.7, roll=-6, mouth="smile", cheek=1.0, gx=-3))),
    ("19", "Huhu…", lambda: cat(STAND_F, dict(LOOK["sad"], roll=0, dy=0, lid=1, wide=1, cheek=0.5, droop=1, mouth="none")) + tears()),
    ("21", "Ok nè!", lambda: cat(STAND_F, dict(LOOK["rest"], wink=1, mouth="smile", cheek=0.8, roll=4)) + ok_sign(91, 94)),
    ("20", "Hoan hô!", hop_for_joy),
    ("22", "Không nha.", no_entry_sign),
]

S = 2.45
made = []
for stale in os.listdir(OUT):  # files are numbered by position, so remove an old numbering first
    if len(stale) == 6 and stale[:2].isdigit() and stale.endswith(".png"):
        os.remove(os.path.join(OUT, stale))
for pos, (ident, text, art, *opt) in enumerate(STICKERS, 1):
    o = opt[0] if opt else {}
    sc = o.get("scale", S)
    inner = wrap(art(), (360 - 120 * sc) / 2 + o.get("dx", 0), 82 - 20 * sc + 8 + o.get("dy", 0), sc)
    p = os.path.join(OUT, f"{pos:02d}.png")
    print(f"{pos:02d}.png = list id {ident}: {text}")
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
# ---- set-v1: the same 20 stickers with the text in Vietnamese, English and Japanese, and a manifest --------------------------
# One entry per file position (01 to 20): titles, a short scene (for the alt text) and the English and Japanese text on the image.
# The English and Japanese lines were written by an AI and have not been read by a native speaker: "reviewed" is false in the manifest.
V1 = [
    # (title vi, title en, title ja), (scene vi, scene en, scene ja), (text en, text ja)
    (("Chào buổi sáng", "Good morning", "おはよう"), ("vươn vai và ngáp", "stretches and yawns", "のびをしてあくびをしている"), ("Good morning!", "おはよう！")),
    (("Sướng quá", "Bliss", "きもちいい"), ("nhắm mắt sung sướng, được gãi đầu", "eyes shut in bliss, being scratched", "うっとり目を閉じて頭をなでられている"), ("So good~", "きもちいい〜")),
    (("Cuộc sống mà", "Life, you know", "人生ってさ"), ("nằm ngửa vắt chân, vẻ thản nhiên, bong bóng suy nghĩ có một con cá nhỏ, cuộc sống theo kiểu mèo", "lies back with crossed legs, deadpan, a thought bubble above with a little fish, a cat's idea of life", "足を組んで寝転び、すました顔で、小さな魚が入った考えの吹き出しが浮かんでいる（ねこの人生）"), ("Life, you know.", "人生ってさ。")),
    (("Buồn ngủ", "Sleepy", "ねむい"), ("gật gù buồn ngủ, có chữ z bay lên", "nods off with a floating z", "うとうとして「z」が浮かんでいる"), ("Sleepy…", "ねむい…")),
    (("Hừm", "Hmph", "むっ"), ("ngồi lườm hờn, thở ra mấy làn khói nhỏ", "sulks with a half-lidded glare and little puffs", "半目でむっとして、小さく息をはいている"), ("Hmph.", "むっ。")),
    (("Quá sức mèo rồi", "Too much for a cat", "ねこには無理"), ("mắt buồn, tai cụp, quá sức", "looks overwhelmed, ears down", "耳をたたんで、手に負えない様子"), ("Too much for a cat.", "ねこには無理！")),
    (("Làm chung nhé", "Work together?", "いっしょにやる？"), ("đưa một chân vẫy gọi, rủ làm cùng", "beckons with a raised paw", "片手を上げて手まねきしている"), ("Work together?", "いっしょにやる？")),
    (("Ngủ ngon", "Sweet dreams", "おやすみ"), ("cuộn tròn ngủ ngon, có chữ z", "curled up asleep with a z", "丸くなってぐっすり眠っている"), ("Sweet dreams.", "おやすみ。")),
    (("Haha", "Haha", "あはは"), ("cười lớn, nước mắt vui", "laughs out loud with tears of joy", "涙を浮かべて大笑いしている"), ("Haha!", "あはは！")),
    (("Xin lỗi", "Sorry", "ごめんね"), ("mắt to ướt, tai cụp, giọt mồ hôi, xin lỗi", "big wet eyes, ears down, a sweat drop", "うるんだ大きな目で耳をたたみ、汗をかいている"), ("Sorry!", "ごめんね。")),
    (("Cảm ơn", "Thank you", "ありがとう"), ("chắp hai chân, có trái tim, cảm ơn", "paws together with hearts", "両手を合わせて、ハートが浮かんでいる"), ("Thank you!", "ありがとう！")),
    (("Ơ!", "Oh!", "えっ"), ("mắt tròn ngạc nhiên", "round eyes, surprised", "目を丸くしておどろいている"), ("Oh!", "えっ！")),
    (("Để mình nghĩ", "Let me think", "考え中"), ("chống chân lên cằm, đang nghĩ", "paw on chin, thinking", "あごに手をあてて考えている"), ("Let me think…", "考え中…")),
    (("Hì hì", "Hehe", "ふふっ"), ("khúc khích sau bàn chân", "giggles behind a paw", "手で口をおさえてくすくす笑っている"), ("Hehe.", "ふふっ。")),
    (("Giỏi quá", "Good job", "すごいすごい"), ("giơ ngón cái, mặt thản nhiên", "gives a deadpan thumbs-up", "すました顔で親指を立てている"), ("Good job.", "すごいすごい。")),
    (("Ai đợi đâu", "Who's waiting?", "待ってないし"), ("đứng nghiêng, má đỏ, làm bộ không đợi", "stands sideways, cheeks pink, pretending not to wait", "横向きで頬を赤くして、待ってないふりをしている"), ("Who's waiting?", "待ってないし。")),
    (("Huhu", "Boohoo", "うえーん"), ("khóc, hai dòng nước mắt", "cries with two streams of tears", "二すじの涙を流して泣いている"), ("Boohoo…", "うえーん…")),
    (("Ok nè", "OK", "オッケー"), ("nháy mắt, làm dấu ok", "winks and makes an OK sign", "ウインクしてオッケーサインをしている"), ("OK!", "オッケー！")),
    (("Hoan hô", "Hooray", "やったー"), ("nhảy lên vui mừng, lấp lánh", "hops for joy with sparkles", "喜んでジャンプし、きらきら光っている"), ("Hooray!", "やったー！")),
    (("Không nha", "Nope", "だめだよ"), ("cầm biển cấm đi ngược chiều", "holds a no-entry road sign", "進入禁止の標識を持っている"), ("Nope.", "だめだよ。")),
]
assert len(V1) == len(STICKERS), (len(V1), len(STICKERS))
LANGS = ("vi", "en", "ja")
LANG_FONT = {"vi": FONT, "en": FONT, "ja": FONT_JA}
V1_DIR = os.path.join(os.path.dirname(os.path.abspath(OUT)), "set-v1")
import json  # noqa: E402

stickers_json = []
for pos, ((ident, text_vi, art, *opt), (titles, scenes, texts_new)) in enumerate(zip(STICKERS, V1), 1):
    o = opt[0] if opt else {}
    sc = o.get("scale", S)
    inner = wrap(art(), (360 - 120 * sc) / 2 + o.get("dx", 0), 82 - 20 * sc + 8 + o.get("dy", 0), sc)
    texts = {"vi": text_vi, "en": texts_new[0], "ja": texts_new[1]}
    for li, lang in enumerate(LANGS):
        os.makedirs(os.path.join(V1_DIR, lang), exist_ok=True)
        png_from(inner, (360, 360), texts[lang], os.path.join(V1_DIR, lang, f"{pos:02d}.png"), font=LANG_FONT[lang])
    alts = {
        "vi": f"Peak {scenes[0]}. Chữ trên ảnh: “{texts['vi']}”",
        "en": f"Peak {scenes[1]}. Text on the image: \"{texts['en']}\"",
        "ja": f"Peak（ねこ）が{scenes[2]}。画像の文字：「{texts['ja']}」",
    }
    stickers_json.append({
        "id": f"{pos:02d}",
        "text": texts,
        "title": {"vi": titles[0], "en": titles[1], "ja": titles[2]},
        "alt": alts,
        "reviewed": {"vi": True, "en": False, "ja": False},
    })
manifest = {
    "version": "set-v1",
    "creator": "Streakboom",
    "license": "CC BY 4.0",
    "credits": [
        {"font": "Be Vietnam Pro", "license": "SIL OFL 1.1", "langs": ["vi", "en"], "licenseFile": "docs/plans/assets/stickers/fonts/OFL.txt"},
        {"font": "M PLUS Rounded 1c", "license": "SIL OFL 1.1", "langs": ["ja"], "licenseFile": "docs/plans/assets/stickers/fonts/OFL-MPlusRounded1c.txt"},
    ],
    "stickers": stickers_json,
}
with open(os.path.join(V1_DIR, "manifest.json"), "w", encoding="utf-8", newline="\n") as fh:
    json.dump(manifest, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
print("set-v1:", len(stickers_json), "stickers x", len(LANGS), "languages in", V1_DIR)

# ---- pack Cute (docs/plans/sticker-packs-three-categories.md): ten new stickers next to ten of the current ones --------------
# No arms, ever (the author, 2026-11-12): gestures are paws on the body, props, marks or the face.
def fist(x, y):
    o = f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="8.5" ry="7.5" fill="{FUR}" stroke="{DARK}" stroke-width="1.1"/>'
    for dy in (-2.5, 1, 4.5):
        o += f'<path d="M{f(x - 6)} {f(y + dy)} L{f(x + 6)} {f(y + dy)}" stroke="{DARK}" stroke-width="1.1" stroke-linecap="round"/>'
    return o


def heart(x, y, k, col="#f08a99"):
    return f'<path transform="translate({x},{y}) scale({k})" d="M0 3 C-7 -3 -3 -9 0 -5 C3 -9 7 -3 0 3Z" fill="{col}"/>'


def cute_hug():
    """Open for a hug: two stubby paws at the sides of the body, pads toward us, and hearts. No arms."""
    return (cat(STAND_F, dict(LOOK["purr"], roll=0, dy=0, cheek=0.95)) + paw(22, 94, 10.5, 12, -55, True) + paw(98, 94, 10.5, 12, 55, True)
            + arcs("M7 82 q-5 7 -1 15", "M113 82 q5 7 1 15") + heart(16, 50, 1.1) + heart(104, 42, 1.4) + heart(98, 70, 0.8))


def cute_heart_eyes():
    return (cat(STAND_F, dict(LOOK["purr"], hearts=1, happy=0, mouth="smile", cheek=1.0, roll=-3))
            + star(14, 50, 6, "#ffd166") + star(106, 38, 7, "#f4a7a7") + star(100, 82, 4, "#c9b8f0"))


def cute_miss_you():
    return (cat(STAND_F, dict(LOOK["sad"], lid=1, wide=0.85, cheek=0.5, droop=0.6, roll=-4, dy=2, mouth="flat"))
            + heart(60, 97, 2.6, "#ef6f7e") + paw(51, 101, 6.5, 8, 18, True) + paw(69, 101, 6.5, 8, -18, True))  # a heart held to the chest


def cute_cheer():
    """Cheering someone on: a red headband with a knot, bright eyes, two small fists at the chest, sparks. No arms."""
    band = ('<path d="M20 50 Q60 36 100 50 L100 57 Q60 43 20 57Z" fill="#e5484d"/>'
            '<path d="M99 51 l13 -6 l-2 8z M99 55 l12 6 l-7 3z" fill="#e5484d"/><circle cx="99" cy="53.5" r="3.2" fill="#c93a40"/>')
    return (cat(STAND_F, dict(LOOK["rest"], wide=0.4, mouth="open", cheek=0.9, roll=0)) + band + paw(51, 100, 6.5, 8, 12) + paw(69, 100, 6.5, 8, -12)
            + stroke_path("M38 88 l-6 -5", "#ffd166", 2.4) + stroke_path("M82 88 l6 -5", "#ffd166", 2.4) + star(16, 40, 6, "#ffd166") + star(106, 78, 5, "#ffd166"))


def cute_flower():
    """Congratulations: a flower held at the chest with both paws. No arms."""
    petals = "".join(f'<circle cx="{f(78 + 6.2 * math.cos(a * math.pi / 2.5))}" cy="{f(88 + 6.2 * math.sin(a * math.pi / 2.5))}" r="5.2" fill="#f08a99"/>' for a in range(5))
    return (cat(STAND_F, dict(LOOK["rest"], wide=0.5, mouth="open", roll=-3, dy=0, cheek=0.9)) + stroke_path("M60 106 Q66 98 76 91", "#7cc17c", 2.6)
            + petals + '<circle cx="78" cy="88" r="3.4" fill="#ffd166"/>' + paw(53, 103, 6.5, 8, 15) + paw(66, 104, 6.5, 8, -15)
            + star(18, 46, 5, "#ffd166") + star(104, 44, 6, "#f4a7a7"))


def cute_birthday():
    hat = '<polygon points="46,28 74,28 60,0" fill="#8ecae6"/><polygon points="53,28 67,28 62,12 58,12" fill="#f4a7a7" opacity="0.9"/><circle cx="60" cy="0" r="3.6" fill="#ffd166"/>'
    cake = ('<rect x="42" y="100" width="36" height="14" rx="3" fill="#fff1d6" stroke="#e9a94a" stroke-width="1.1"/>'
            '<path d="M42 104 q4 5 9 0 q4 5 9 0 q4 5 9 0 q4 5 9 -1 v-5 h-36z" fill="#f4a7a7"/>'
            '<rect x="58.5" y="84" width="3.6" height="16" rx="1" fill="#8ecae6"/><path d="M58.5 90 l3.6 -2 M58.5 95 l3.6 -2" stroke="#fff" stroke-width="1.2"/>'
            '<path d="M60.3 72 Q66 80 62.5 84 Q60.3 86 58 84 Q54.5 80 60.3 72Z" fill="#ff8a3d"/>'
            '<path d="M60.3 77 Q63 81 61.5 83.5 Q60.3 85 59 83.5 Q57.5 81 60.3 77Z" fill="#ffd166"/>'
            + stroke_path("M52 75 l-4 -3 M68 75 l4 -3 M60.3 66 l0 -4", "#ffb347", 1.8))
    return cat(SIT_F, dict(LOOK["rest"], wide=0.5, mouth="open", dy=0, cheek=0.9)) + hat + cake


def cute_meow():
    return (cat(STAND_F, dict(LOOK["curious"], mouth="o", roll=7, gx=0, gy=0, wide=0.3, cheek=0.7))
            + arcs("M96 76 q6 4 0 10", "M103 72 q9 8 0 18", "M24 76 q-6 4 0 10", "M17 72 q-9 8 0 18") + star(100, 36, 5, "#ffd166"))


def cute_peekaboo():
    box = ('<rect x="10" y="78" width="100" height="40" rx="2" fill="#d4a76a" stroke="#b88a4e" stroke-width="1.4"/>'
           '<rect x="8" y="74" width="104" height="8" rx="2" fill="#b88a4e"/><path d="M40 82 L40 118 M80 82 L80 118" stroke="#c4955a" stroke-width="1.2"/>')
    return (ell(60, 118, 52, 4, "#000", op=0.08) + cat(dict(STAND_F, shadow=(60, 115, 0, 0)), dict(LOOK["curious"], wide=0.5, gx=0, gy=-2, roll=0, mouth="none", cheek=0.6))
            + box + paw(38, 76, 7, 6.5, 0) + paw(82, 76, 7, 6.5, 0))


def cute_pat():
    return (cat(STAND_F, dict(LOOK["purr"], roll=-14, dy=6, droop=0.6, cheek=1.0))
            + stroke_path("M44 12 q5 -7 10 0", "#b9a98f", 2) + stroke_path("M58 6 q5 -7 10 0", "#b9a98f", 2) + stroke_path("M72 12 q5 -7 10 0", "#b9a98f", 2))


def cute_pout():
    """A cute sulk: both cheeks puffed out evenly (the head is not tilted), eyes aside, a small huff mark."""
    puff = ell(19, 78, 11, 10, FUR) + ell(101, 78, 11, 10, FUR)  # cheeks that bulge past the head's edge (drawn over the head edge and the tail, same fur colour)
    blush = ell(26, 80, 8, 5, "#f59e9e", 0, 0.85) + ell(94, 80, 8, 5, "#f59e9e", 0, 0.85)
    huff = stroke_path("M100 44 l6 -4 M104 52 l8 -1", "#b9a98f", 2)
    return cat(STAND_F, dict(LOOK["rest"], lid=0.8, gx=-6, gy=0, roll=0, mouth="flat", cheek=0.0)) + puff + blush + huff


CUTE_NEW = [
    ("Ôm cái nè!", cute_hug, {}),
    ("Thương quá!", cute_heart_eyes, {}),
    ("Nhớ bạn!", cute_miss_you, {}),
    ("Cố lên nha!", cute_cheer, {}),
    ("Chúc mừng nha!", cute_flower, {}),
    ("Sinh nhật vui!", cute_birthday, dict(scale=2.0, dy=42)),
    ("Meo~", cute_meow, {}),
    ("Ú òa!", cute_peekaboo, {}),
    ("Xoa đầu cái!", cute_pat, {}),
    ("Dỗi nè.", cute_pout, {}),
]
CUTE_DIR = os.path.join(os.path.dirname(os.path.abspath(OUT)), "pack-cute-draft")
os.makedirs(CUTE_DIR, exist_ok=True)
cute_files = []
for ci, (ctext, cart, copt) in enumerate(CUTE_NEW, 1):
    csc = copt.get("scale", S)
    cinner = wrap(cart(), (360 - 120 * csc) / 2 + copt.get("dx", 0), 82 - 20 * csc + 8 + copt.get("dy", 0), csc)
    cpath = os.path.join(CUTE_DIR, f"new-{ci:02d}.png")
    png_from(cinner, (360, 360), ctext, cpath)
    cute_files.append(cpath)
# a contact sheet: the ten current Cute stickers (Vietnamese, from set-v1) and the ten new ones
current_cute = [1, 2, 4, 8, 10, 11, 12, 13, 17, 19]
cd = fitz.open()
cpg = cd.new_page(width=1100, height=880)
cpg.draw_rect(cpg.rect, color=None, fill=(1, 1, 1))
for ci, cf in enumerate([os.path.join(V1_DIR, "vi", f"{n:02d}.png") for n in current_cute] + cute_files):
    r = fitz.Rect(10 + (ci % 5) * 216, 10 + (ci // 5) * 214, 10 + (ci % 5) * 216 + 206, 10 + (ci // 5) * 214 + 206)
    cpg.draw_rect(r, color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97) if ci < 10 else (1, 0.98, 0.93))
    cpg.insert_image(r, filename=cf)
cpg.get_pixmap(dpi=72).save(os.path.join(CUTE_DIR, "contact_sheet.png"))
print("pack-cute-draft:", len(cute_files), "new stickers in", CUTE_DIR)

# ---- pack Friends (docs/plans/sticker-packs-three-categories.md): eleven new stickers, no arms -------------------------------
LOAF_F = dict(shift(STAND_F, 0, 18), shadow=(60, 115, 40, 4.5), tail=([86, 108], [110, 110], [106, 92], 9),
              body=(60, 100, 40, 17, 0), belly=(60, 106, 24, 9, 0), legs=[leg(46, 108, 46, 110, 0, 11, 6.5, 0, 1)] * 4)


def qmark(x, y, k=1.0, col="#8a97a6"):
    return (f'<g transform="translate({x},{y}) scale({k})">' + stroke_path("M-4.5 -6 Q-4.5 -11 0 -11 Q4.5 -11 4.5 -7 Q4.5 -3.5 0 -2 L0 0.5", col, 2.6)
            + f'<circle cx="0" cy="5" r="1.7" fill="{col}"/></g>')


def fr_gossip():
    bowl = ('<path d="M40 96 L80 96 L75 116 L45 116Z" fill="#e5484d"/><path d="M50 96 L52 116 M60 96 L60 116 M70 96 L68 116" stroke="#fff" stroke-width="3"/>')
    pop = "".join(ell(x, y, 5, 4.5, "#fff6dc") + ell(x - 1, y - 1, 2, 1.8, "#ffe9a8") for x, y in ((46, 93), (55, 90), (64, 91), (73, 93), (51, 86), (60, 84), (69, 86)))
    return cat(SIT_F, dict(LOOK["rest"], wide=0.9, gy=0, roll=0, mouth="o", cheek=0.8)) + pop + bowl + paw(40, 103, 6, 7, -15) + paw(80, 103, 6, 7, 15)


def fr_faint():
    """Knocked flat: the cat as a pancake on the floor, spiral eyes, the tongue out, stars circling over its head."""
    ring = '<ellipse cx="60" cy="38" rx="30" ry="7" fill="none" stroke="#e6d9b8" stroke-width="1.6" stroke-dasharray="3 4"/>'
    return (cat(LOAF_F, dict(LOOK["rest"], swirl=1, mouth="flat", cheek=0.5, dy=2)) + ell(60, 104.5, 3.6, 4.6, "#f4a7a7")
            + ring + star(32, 36, 6, "#ffd166") + star(60, 30, 5, "#ffd166") + star(88, 36, 6, "#ffd166"))


def fr_ew():
    gloom = "".join(stroke_path(f"M{x} 34 L{x} {y}", "#7f93a8", 2.2) for x, y in ((74, 46), (80, 50), (86, 46)))
    wavy = stroke_path("M51 82 q2.2 -3.5 4.5 0 t4.5 0 t4.5 0 t4.5 0", MOUTH, 1.9)
    return cat(STAND_F, dict(LOOK["huff"], lid=0.5, gx=-3, roll=9, dy=-2, mouth="none", cheek=0.2)) + gloom + wavy


def fr_shrug():
    return (cat(STAND_F, dict(LOOK["rest"], lid=0.5, mouth="smile", cheek=0.4, roll=-4)) + paw(23, 92, 8.5, 10, -80, True) + paw(97, 92, 8.5, 10, 80, True)
            + sweat())


def fr_dream_on():
    """"Lêu lêu": the lower eyelids pulled down (a pink crescent under each eye) and a short tongue stuck out; the head tipped."""
    lids = "".join(f'<path d="M{x - 8} {y + 6} Q{x} {y + 22} {x + 8} {y + 6} Q{x} {y + 10} {x - 8} {y + 6}Z" fill="#ef5f72"/>' for x, y in ((44, 66), (76, 66)))
    tongue = ('<path d="M55 81 Q55 90 60 90 Q65 90 65 81Z" fill="#ef6f7e"/><path d="M60 83 L60 88" stroke="#c94f5f" stroke-width="1.2" stroke-linecap="round"/>')
    return (cat(STAND_F, dict(LOOK["rest"], mouth="none", roll=8, dy=-2, cheek=0.5, wide=0.1, gy=-3)) + lids + stroke_path("M53 80 Q60 84 67 80", MOUTH, 1.9) + tongue
            + stroke_path("M100 44 l8 -4 M104 53 l10 -1 M102 62 l8 3", "#b9a98f", 2))


def fr_really():
    """Doubt: the head tilted, one eye wide and the other narrowed, three dots beside it (no brow)."""
    dots = "".join(ell(x, 40, 2.4, 2.4, "#8a97a6") for x in (94, 102, 110))
    return cat(STAND_F, dict(LOOK["rest"], lid=1, lidR=0.38, wide=0.5, roll=-12, gx=2, mouth="flat", cheek=0.4)) + dots


def fr_treat():
    coin = '<circle cx="98" cy="74" r="8" fill="#ffd166" stroke="#e0a93a" stroke-width="1.6"/><circle cx="98" cy="74" r="4.2" fill="none" stroke="#e0a93a" stroke-width="1.2"/>'
    return (cat(STAND_F, dict(LOOK["happy"], roll=5, dy=0, cheek=0.95)) + paw(96, 93, 8.5, 9.5, 60, True) + coin + star(112, 60, 4, "#ffd166") + star(84, 60, 3, "#ffd166"))


def fr_wait():
    big = (f'<ellipse cx="60" cy="97" rx="14" ry="15" fill="{FUR}" stroke="{DARK}" stroke-width="1.3"/>'
           + ell(60, 101, 6.5, 5.5, PINK) + "".join(ell(x, 89, 2.6, 3, PINK) for x in (51, 57, 63, 69)))
    return cat(STAND_F, dict(LOOK["gasp"], mouth="flat", cheek=0.3)) + big + arcs("M38 86 q-6 8 -1 18", "M82 86 q6 8 1 18")


def fr_huh():
    return cat(STAND_F, dict(LOOK["rest"], wide=0.3, roll=14, mouth="flat", cheek=0.6)) + qmark(98, 34, 1.5) + qmark(112, 48, 0.9)


def fr_go_out():
    pack = ('<rect x="30" y="62" width="30" height="26" rx="8" fill="#8ecae6" stroke="#5aa9d6" stroke-width="1.3"/>'
            '<rect x="36" y="74" width="18" height="10" rx="3" fill="#bfe3f2"/><path d="M58 66 Q70 72 70 86" fill="none" stroke="#5aa9d6" stroke-width="3" stroke-linecap="round"/>')
    return cat(STAND_S, dict(LOOK["happy"], roll=-4, cheek=0.9)) + pack + star(112, 40, 6, "#ffd166") + star(20, 44, 4, "#ffd166") + arcs("M4 96 l8 0", "M2 104 l10 0")


def fr_fibber():
    """"Sure, sure": eyes narrowed to slits and slid aside, a one-sided smirk, a paw on the chin."""
    k = dict(STAND_F, mouth=dict(STAND_F["mouth"], ra=0))
    return (cat(k, dict(LOOK["smirk"], lid=0.28, gx=6, roll=-9, cheek=0.8)) + paw(72, 92, 7, 8.5, -20)
            + stroke_path("M100 44 q5 2 4 7 M106 38 q8 4 6 12", "#b9a98f", 2))


FRIENDS_NEW = [
    ("Hóng!", fr_gossip, {}),
    ("Xỉu ngang!", fr_faint, {}),
    ("Gớm!", fr_ew, {}),
    ("Bó tay.", fr_shrug, {}),
    ("Còn lâu!", fr_dream_on, {}),
    ("Thật hả?", fr_really, {}),
    ("Bao nha!", fr_treat, {}),
    ("Khoan đã!", fr_wait, {}),
    ("Ủa?", fr_huh, {}),
    ("Đi chơi đi!", fr_go_out, {}),
    ("Xạo vừa thôi!", fr_fibber, {}),
]
FR_DIR = os.path.join(os.path.dirname(os.path.abspath(OUT)), "pack-friends-draft")
os.makedirs(FR_DIR, exist_ok=True)
fr_files = []
for fi, (ftext, fart, fopt) in enumerate(FRIENDS_NEW, 1):
    fsc = fopt.get("scale", S)
    finner = wrap(fart(), (360 - 120 * fsc) / 2 + fopt.get("dx", 0), 82 - 20 * fsc + 8 + fopt.get("dy", 0), fsc)
    fpath = os.path.join(FR_DIR, f"new-{fi:02d}.png")
    png_from(finner, (360, 360), ftext, fpath)
    fr_files.append(fpath)
current_friends = [3, 5, 6, 9, 14, 15, 16, 18, 20]
fd = fitz.open()
fpg = fd.new_page(width=1100, height=880)
fpg.draw_rect(fpg.rect, color=None, fill=(1, 1, 1))
for fi, ff in enumerate([os.path.join(V1_DIR, "vi", f"{n:02d}.png") for n in current_friends] + fr_files):
    r = fitz.Rect(10 + (fi % 5) * 216, 10 + (fi // 5) * 214, 10 + (fi % 5) * 216 + 206, 10 + (fi // 5) * 214 + 206)
    fpg.draw_rect(r, color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97) if fi < 9 else (1, 0.98, 0.93))
    fpg.insert_image(r, filename=ff)
fpg.get_pixmap(dpi=72).save(os.path.join(FR_DIR, "contact_sheet.png"))
print("pack-friends-draft:", len(fr_files), "new stickers in", FR_DIR)

# ---- pack Office (docs/plans/sticker-packs-three-categories.md): nineteen new stickers, one prop each, no arms ----------------
LOAF_F = dict(shift(STAND_F, 0, 18), shadow=(60, 115, 40, 4.5), tail=([86, 108], [110, 110], [106, 92], 9),
              body=(60, 100, 40, 17, 0), belly=(60, 106, 24, 9, 0), legs=[leg(46, 108, 46, 110, 0, 11, 6.5, 0, 1)] * 4)
GREY_D, GREY_L, BLUE = "#6f7b88", "#dfe5ea", "#5aa9d6"


def tick(x, y, k=1.0, col=BLUE, w=2.6):
    return f'<path transform="translate({x},{y}) scale({k})" d="M-5 0 l3.5 3.5 l7 -8" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def clock(x, y, r=10):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" stroke="{GREY_D}" stroke-width="2"/>'
            + stroke_path(f"M{x} {y} L{x} {y - r * 0.6} M{x} {y} L{x + r * 0.45} {y + r * 0.15}", GREY_D, 1.8))


def mug(x, y, k=1.0, rot=0, col="#fff"):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({k})"><path d="M8 -4 q8 0 8 6 q0 6 -8 6" fill="none" stroke="{GREY_D}" stroke-width="2.4"/>'
            f'<rect x="-9" y="-9" width="18" height="18" rx="3" fill="{col}" stroke="{GREY_D}" stroke-width="1.6"/><rect x="-7" y="-9" width="14" height="4" rx="1.5" fill="#7a4b3a"/></g>')


def laptop_back(x, y, w=64, h=40):
    return (f'<rect x="{x - w / 2}" y="{y - h}" width="{w}" height="{h}" rx="4" fill="{GREY_L}" stroke="{GREY_D}" stroke-width="1.6"/>'
            f'<circle cx="{x}" cy="{y - h / 2}" r="3.2" fill="{GREY_D}" opacity="0.5"/><rect x="{x - w / 2 - 5}" y="{y - 1}" width="{w + 10}" height="5" rx="2.5" fill="{GREY_D}"/>')


def page(x, y, w=22, h=27):
    return (f'<rect x="{x - w / 2}" y="{y - h / 2}" width="{w}" height="{h}" rx="2" fill="#fff" stroke="{GREY_D}" stroke-width="1.4"/>'
            + stroke_path(f"M{x - 6} {y - 7} h12 M{x - 6} {y - 2} h8", "#c3ccd4", 1.6))


def calendar(x, y, k=1.0, rot=0, mark=True):
    o = (f'<g transform="translate({x},{y}) rotate({rot}) scale({k})"><rect x="-11" y="-11" width="22" height="22" rx="3" fill="#fff" stroke="{GREY_D}" stroke-width="1.5"/>'
         f'<rect x="-11" y="-11" width="22" height="7" rx="3" fill="#e5484d"/>')
    if mark:
        o += '<circle cx="2" cy="4" r="4.5" fill="none" stroke="#e5484d" stroke-width="1.8"/>'
    return o + "</g>"


def grey_cloud(x, y, k=1.0, rain=False):
    c = "#9fb3c8"
    o = f'<g transform="translate({x},{y}) scale({k})">' + ell(-12, 2, 11, 8, c) + ell(0, -4, 12, 10, c) + ell(12, 2, 11, 8, c) + ell(0, 5, 20, 7, c)
    if rain:
        o += "".join(f'<path d="M{dx} 15 q2 4 0 6 q-2 -2 0 -6z" fill="#5aa9d6"/>' for dx in (-12, 0, 12))
    return o + "</g>"


def of_seen():
    return cat(STAND_F, dict(LOOK["rest"], lid=0.5, gx=-6, mouth="flat", cheek=0.3)) + tick(98, 44, 1.2) + tick(105, 44, 1.2)


def of_ok_boss():
    """A military salute: the flat paw at the brow above the right eye, palm down, toes together; chest out, a sharp smile."""
    hand = ('<g transform="translate(92,49) rotate(-22)"><rect x="-15" y="-6" width="30" height="12" rx="6" fill="#f6c26b" stroke="#e9a94a" stroke-width="1.2"/>'
            '<path d="M7 -4 L7 4 M11 -4.5 L11 4.5 M3 -3.5 L3 3.5" stroke="#e9a94a" stroke-width="1.1" stroke-linecap="round"/></g>')
    return cat(STAND_F, dict(LOOK["rest"], wide=0.4, mouth="open", cheek=0.8, roll=-3, dy=-1)) + hand + star(112, 30, 5, "#ffd166")


def of_meeting():
    return cat(STAND_F, dict(LOOK["gasp"], droop=1, mouth="flat", cheek=0.2, dy=3)) + clock(20, 40, 11) + sweat() + stroke_path("M10 24 l-4 -4 M20 21 l0 -6 M30 24 l4 -4", "#b9a98f", 2)


def of_listening():
    """Caught dozing in a meeting: eyes wide and slid aside, a nervous smile, a sweat drop, the "z" crossed out."""
    z = '<path d="M88 20 h11 l-11 12 h11" fill="none" stroke="#6b7cff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
    return (cat(STAND_F, dict(LOOK["rest"], wide=0.9, gx=-6, mouth="smile", cheek=0.9, roll=3)) + z + stroke_path("M84 36 L104 16", "#e5484d", 2.8)
            + '<path d="M22 34 Q27 41 22 45 Q17 41 22 34" fill="#8ecae6"/>')


def of_deadline():
    bell = (clock(100, 34, 10) + ell(92, 23, 4, 3, "#e5484d", -35) + ell(108, 23, 4, 3, "#e5484d", 35)
            + stroke_path("M84 26 q-4 6 -1 12 M116 26 q4 6 1 12", "#e5484d", 2))
    return cat(STAND_F, dict(LOOK["gasp"], mouth="yawn", cheek=0.3)) + paw(27, 82, 7.5, 9, 20) + paw(93, 82, 7.5, 9, -20) + bell


def of_done():
    return (cat(STAND_F, dict(LOOK["happy"], mouth="smile", cheek=0.9, roll=3, dy=-1)) + page(60, 98) + tick(60, 104, 1.3, "#3fae5a", 3)
            + paw(46, 104, 6, 7.5, 10) + paw(74, 104, 6, 7.5, -10) + star(100, 40, 5, "#ffd166"))


def of_nudge():
    desk = f'<rect x="0" y="112" width="100" height="5" rx="2" fill="#b88a4e"/>'
    return (cat(dict(STAND_F, shadow=(60, 115, 0, 0)), dict(LOOK["rest"], lid=0.55, gx=4, mouth="smile", cheek=0.6, roll=4)) + desk
            + mug(101, 100, 0.95, 24) + paw(86, 101, 7, 8, 80) + arcs("M112 84 q5 5 2 12", "M118 80 q7 8 3 18"))


def of_coffee():
    steam = stroke_path("M54 76 q-4 -5 0 -10 M66 76 q4 -5 0 -10", "#b9a98f", 2)
    return (cat(SIT_F, dict(LOOK["drowsy"], lid=0.3, mouth="flat", roll=-5, dy=5, cheek=0.3)) + steam + mug(60, 99, 1.5)
            + paw(41, 101, 6.5, 8, -10) + paw(73, 104, 6.5, 8, 10))


def of_payday():
    return (cat(STAND_F, dict(LOOK["rest"], wide=0.9, gy=-3, mouth="smile", cheek=0.9, roll=-5)) + paw(54, 98, 6.5, 9, 14, True) + paw(66, 98, 6.5, 9, -14, True)
            + calendar(102, 36, 1.1, 8) + star(84, 30, 4, "#ffd166"))


def of_monday():
    return cat(LOAF_F, dict(LOOK["sad"], lid=0.5, roll=0, dy=3, gy=3, cheek=0.1, droop=1)) + grey_cloud(60, 22, 1.0, True)


def of_friday():
    shades = (f'<rect x="31" y="58" width="25" height="16" rx="6" fill="{INK}"/><rect x="64" y="58" width="25" height="16" rx="6" fill="{INK}"/>'
              f'<path d="M56 63 h8 M31 62 l-8 -3 M89 62 l8 -3" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
              '<path d="M36 62 l6 -2 M69 62 l6 -2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8"/>')
    return (cat(STAND_F, dict(LOOK["rest"], lid=0.06, mouth="open", cheek=0.8, roll=5)) + shades
            + star(14, 40, 6, "#ffd166") + star(106, 34, 7, "#f4a7a7") + star(104, 76, 4, "#8ecae6"))


def of_not_me():
    note = '<g transform="translate(22,46)"><ellipse cx="0" cy="8" rx="4.5" ry="3.5" fill="#6f7b88" transform="rotate(-20 0 8)"/><path d="M4 7 V-8 l8 3" fill="none" stroke="#6f7b88" stroke-width="2.2" stroke-linecap="round"/></g>'
    spill = ell(105, 114, 12, 3.5, "#7a4b3a", 0, 0.75)
    return cat(STAND_F, dict(LOOK["rest"], lid=0.7, gx=-7, gy=-3, mouth="o", cheek=0.6, roll=-5)) + note + spill + mug(104, 104, 0.9, 90)


def of_recall():
    bubble = ('<path d="M76 14 h34 a6 6 0 0 1 6 6 v16 a6 6 0 0 1 -6 6 h-20 l-8 8 v-8 h-6 a6 6 0 0 1 -6 -6 v-16 a6 6 0 0 1 6 -6z" fill="#fff" stroke="#6f7b88" stroke-width="1.6"/>'
              '<path d="M103 34 h-14 M95 28 l-7 6 l7 6" fill="none" stroke="#e5484d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
              '<path d="M103 34 q6 0 6 -6" fill="none" stroke="#e5484d" stroke-width="2.6" stroke-linecap="round"/>')
    return cat(STAND_F, dict(LOOK["gasp"], mouth="o", cheek=0.3, roll=-4)) + bubble + stroke_path("M20 44 l-7 -3 M22 36 l-5 -6", "#b9a98f", 2)


def of_lag():
    spin = ('<circle cx="60" cy="12" r="9" fill="none" stroke="#dfe5ea" stroke-width="3.2"/>'
            '<path d="M60 3 a9 9 0 0 1 9 9" fill="none" stroke="#5aa9d6" stroke-width="3.2" stroke-linecap="round"/>')
    blocks = "".join(f'<rect x="{x}" y="{y}" width="8" height="8" fill="{c}"/>' for x, y, c in (
        (104, 52, FUR), (112, 60, DARK), (104, 68, FUR), (112, 76, FUR), (8, 76, FUR), (0, 84, DARK), (8, 92, FUR), (96, 60, "#fff6e3"), (16, 84, "#fff6e3")))
    return cat(STAND_F, dict(LOOK["rest"], lid=0.75, mouth="o", cheek=0.3), ) + spin + blocks


def of_mute():
    mic = ('<rect x="98" y="30" width="10" height="18" rx="5" fill="#6f7b88"/><path d="M93 42 q0 12 10 12 q10 0 10 -12 M103 54 v7 M97 61 h12" fill="none" stroke="#6f7b88" stroke-width="2.2" stroke-linecap="round"/>'
           '<path d="M90 60 L116 30" stroke="#e5484d" stroke-width="3.2" stroke-linecap="round"/>')
    return cat(STAND_F, dict(LOOK["rest"], wide=0.3, mouth="yawn", cheek=0.6, roll=3)) + mic + arcs("M22 76 q-6 4 0 10", "M15 72 q-9 8 0 18")


def of_tomorrow():
    return (cat(LOAF_F, dict(LOOK["purr"], roll=5, dy=2, cheek=0.8)) + calendar(98, 36, 1.0, 22, False)
            + stroke_path("M78 46 l-8 4 M80 34 l-10 1 M84 56 l-6 6", "#b9a98f", 2))


def of_final():
    files = "".join(f'<rect x="{38 + d}" y="{92 - d}" width="40" height="24" rx="2.5" fill="#fff" stroke="{GREY_D}" stroke-width="1.4"/>' for d in (6, 3, 0))
    return (cat(STAND_F, dict(LOOK["rest"], lid=0.5, mouth="smile", cheek=0.3, roll=-3)) + files + tick(58, 105, 1.3, "#3fae5a", 3) + sweat()
            + paw(36, 106, 6, 7, 5) + paw(80, 106, 6, 7, -5))


def of_boss():
    return (cat(STAND_F, dict(LOOK["gasp"], perk=1, mouth="none", cheek=0.3)) + laptop_back(60, 116, 76, 42)
            + stroke_path("M14 40 l-7 -4 M12 52 l-8 0 M106 40 l7 -4 M108 52 l8 0", "#b9a98f", 2.2) + paw(34, 76, 6.5, 6, 0) + paw(86, 76, 6.5, 6, 0))


def of_wfh():
    """Working from home: a nightcap still on, half-lidded and content, behind a laptop."""
    cap = ('<path d="M36 31 Q58 -8 98 14 Q82 15 85 33Z" fill="#8ecae6"/><path d="M34 29 Q60 19 87 31 l0 7 Q60 26 34 36Z" fill="#fff" stroke="#bcd9f2" stroke-width="1"/>'
           '<circle cx="99" cy="15" r="5.5" fill="#fff" stroke="#bcd9f2" stroke-width="1"/>')
    return (cat(SIT_F, dict(LOOK["rest"], lid=0.5, mouth="smile", cheek=0.7, roll=0)) + cap + laptop_back(60, 116, 58, 30)
            + paw(34, 88, 6, 5.5, 0) + paw(86, 88, 6, 5.5, 0))


OFFICE_NEW = [
    ("Đã xem.", of_seen, {}),
    ("Ok sếp.", of_ok_boss, {}),
    ("Họp nữa à?", of_meeting, {}),
    ("Em có nghe mà.", of_listening, {}),
    ("Deadline!", of_deadline, {}),
    ("Xong rồi nha!", of_done, {}),
    ("Nhắc nhẹ nhé.", of_nudge, {}),
    ("Cà phê đâu?", of_coffee, {}),
    ("Lương về chưa?", of_payday, {}),
    ("Thứ Hai rồi…", of_monday, dict(scale=2.3, dy=14)),
    ("Thứ Sáu rồi!", of_friday, {}),
    ("Không phải em.", of_not_me, {}),
    ("Thu hồi đi!", of_recall, {}),
    ("Mạng lag quá.", of_lag, dict(scale=2.3, dy=12)),
    ("Tắt mic rồi!", of_mute, {}),
    ("Mai tính nha.", of_tomorrow, dict(dy=-4)),
    ("Bản cuối. Thật.", of_final, {}),
    ("Sếp tới rồi!", of_boss, {}),
    ("Làm ở nhà.", of_wfh, dict(scale=2.2, dy=24)),
]
OF_DIR = os.path.join(os.path.dirname(os.path.abspath(OUT)), "pack-office-draft")
os.makedirs(OF_DIR, exist_ok=True)
of_files = []
for oi, (otext, oart, oopt) in enumerate(OFFICE_NEW, 1):
    osc = oopt.get("scale", S)
    oinner = wrap(oart(), (360 - 120 * osc) / 2 + oopt.get("dx", 0), 82 - 20 * osc + 8 + oopt.get("dy", 0), osc)
    opath = os.path.join(OF_DIR, f"new-{oi:02d}.png")
    png_from(oinner, (360, 360), otext, opath)
    of_files.append(opath)
od = fitz.open()
opg = od.new_page(width=1100, height=880)
opg.draw_rect(opg.rect, color=None, fill=(1, 1, 1))
for oi, of_ in enumerate([os.path.join(V1_DIR, "vi", "07.png")] + of_files):
    r = fitz.Rect(10 + (oi % 5) * 216, 10 + (oi // 5) * 214, 10 + (oi % 5) * 216 + 206, 10 + (oi // 5) * 214 + 206)
    opg.draw_rect(r, color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97) if oi < 1 else (1, 0.98, 0.93))
    opg.insert_image(r, filename=of_)
opg.get_pixmap(dpi=72).save(os.path.join(OF_DIR, "contact_sheet.png"))
print("pack-office-draft:", len(of_files), "new stickers in", OF_DIR)

# ---- the single list (docs/plans/sticker-list-33.md): the author's shortlist, grouped by type; no categories ----------------
ART = {}
for _ident, _text, _art, *_opt in STICKERS:
    ART[_text] = (_art, _opt[0] if _opt else {})
for _lst in (CUTE_NEW, FRIENDS_NEW, OFFICE_NEW):
    for _text, _art, _opt in _lst:
        ART[_text] = (_art, _opt)
# (group, key in ART, the text printed on the image if it changes)
GROUPS = [
    ("Chào hỏi và ngày tháng", [("Chào buổi sáng!", None), ("Ngủ ngon.", None), ("Buồn ngủ…", None), ("Thứ Sáu rồi!", None)]),
    ("Yêu thương và lời tử tế", [("Thương quá!", "Yêu quá!"), ("Cảm ơn nha!", None), ("Xin lỗi nhé.", None), ("Chúc mừng nha!", None), ("Sinh nhật vui!", "Sinh nhật vui vẻ!"), ("Cố lên nha!", None)]),
    ("Vui và phấn khích", [("Haha!", None), ("Sướng quá~", None), ("Hì hì.", None), ("Meo~", None), ("Ú òa!", None), ("Đi chơi đi!", None), ("Hóng!", None)]),
    ("Buồn và lo", [("Huhu…", None), ("Deadline!", None)]),
    ("Bất ngờ và nghi ngờ", [("Ơ!", None), ("Ủa?", None), ("Để mình nghĩ…", None)]),
    ("Trêu và lầy", [("Còn lâu!", None), ("Gớm!", None), ("Xỉu ngang!", None), ("Hừm.", "Hứ!"), ("Ai đợi đâu.", None), ("Giỏi quá.", None), ("Cuộc sống mà.", None)]),
    ("Đáp lời", [("Ok nè!", None), ("Không nha.", None)]),
]
ALL_DIR = os.path.join(os.path.dirname(os.path.abspath(OUT)), "list-draft")
os.makedirs(ALL_DIR, exist_ok=True)
for _old in os.listdir(ALL_DIR):
    if _old.endswith(".png"):
        os.remove(os.path.join(ALL_DIR, _old))
n_all = 0
placed = []  # (group, number, file)
for gname, items in GROUPS:
    for key, shown in items:
        n_all += 1
        aart, aopt = ART[key]
        asc = aopt.get("scale", S)
        ainner = wrap(aart(), (360 - 120 * asc) / 2 + aopt.get("dx", 0), 82 - 20 * asc + 8 + aopt.get("dy", 0), asc)
        apath = os.path.join(ALL_DIR, f"{n_all:02d}.png")
        png_from(ainner, (360, 360), shown or key, apath)
        placed.append((gname, n_all, apath, shown or key))
# one contact sheet, a single list (the order follows the types, but there is no group on the page)
cells_per_row, cw, ch = 5, 216, 214
rows_total = (len(placed) + cells_per_row - 1) // cells_per_row
sd = fitz.open()
spg = sd.new_page(width=1100, height=rows_total * ch + 20)
spg.draw_rect(spg.rect, color=None, fill=(1, 1, 1))
spg.insert_font(fontname="hd", fontfile=FONT)
for gi, (_, num, path, _t) in enumerate(placed):
    r = fitz.Rect(10 + (gi % cells_per_row) * cw, 10 + (gi // cells_per_row) * ch, 10 + (gi % cells_per_row) * cw + 206, 10 + (gi // cells_per_row) * ch + 206)
    spg.draw_rect(r, color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97))
    spg.insert_image(r, filename=path)
    spg.insert_text(fitz.Point(r.x0 + 4, r.y1 - 4), f"{num:02d}", fontname="hd", fontsize=11, color=(0.5, 0.5, 0.5))
spg.get_pixmap(dpi=72).save(os.path.join(ALL_DIR, "contact_sheet.png"))
print("list-draft:", n_all, "stickers in", ALL_DIR)

print("done", len(made), "stickers in", OUT)
