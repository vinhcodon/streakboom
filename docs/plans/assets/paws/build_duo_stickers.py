# The eight stickers of the duo test (spec/19 section 3): D1-D3 Paws alone, P1-P2 the pair, S1 a four-panel story, C1-C2 Peak alone (control).
# Paws is option A "Mochi" (ADR-0128). Peak is drawn by the rig port in ../stickers/build_stickers.py. Flat, 360 x 360, transparent, the caption
# baked in (as set-v2), three languages, NO ARM STROKES (paws on the body, on props or at the face).
#
# Run (PyMuPDF needed):  python build_duo_stickers.py        -> stickers-draft/{vi,en,ja}/<id>.png, manifest.json, review sheets
import json
import math
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
STK = os.path.join(HERE, "..", "stickers")


def load(path, stop):
    """Run the helper part of a script (everything before `stop`) in its own namespace."""
    src = open(path, encoding="utf-8").read()
    src = src[: src.index(stop)]
    ns = {"__file__": path, "__name__": "helpers"}
    argv = sys.argv
    sys.argv = [path, tempfile.mkdtemp()]
    try:
        exec(compile(src, path, "exec"), ns)
    finally:
        sys.argv = argv
    return ns


C = load(os.path.join(STK, "build_stickers.py"), "STICKERS = [")   # Peak: cat(), STAND_F, SIT_F, LOOK, curled_up pieces, png_from ...
P = load(os.path.join(HERE, "build_paws_options.py"), "OPTIONS = [")   # Paws helpers: sh, wh, toes, eye, nose, blush, shadow
cat, SIT_F, STAND_F, LOOK, cat_head_only = C["cat"], C["SIT_F"], C["STAND_F"], C["LOOK"], C["cat_head_only"]
shift_down = lambda k, dy: C["shift"](k, 0, dy)
ell, stroke_path, wrap, png_from, star = C["ell"], C["stroke_path"], C["wrap"], C["png_from"], C["star"]
FUR, DARK, BELLY, INK_C = C["FUR"], C["DARK"], C["BELLY"], C["INK"]
sh, wh, toes, eye, nose, shadow = P["sh"], P["wh"], P["toes"], P["eye"], P["nose"], P["shadow"]
BODY, BODY_D, RIM, WHITE, WHITE_L, TAN, INK, MOUTH, TONGUE, BLUSH = (P[k] for k in ("BODY", "BODY_D", "RIM", "WHITE", "WHITE_L", "TAN", "INK", "MOUTH", "TONGUE", "BLUSH"))
OUT = os.path.join(HERE, "stickers-draft")
LANGS = ("vi", "en", "ja")
LANG_FONT = {"vi": C["FONT"], "en": C["FONT"], "ja": C["FONT_JA"]}


def arc_eye(x, y, w=8, up=True):
    """A closed, happy (or calm) eye: an arc."""
    return stroke_path(f"M{x - w} {y + 3} Q{x} {y - 7} {x + w} {y + 3}" if up else f"M{x - w} {y} Q{x} {y + 7} {x + w} {y}", INK, 3)


def paws(eyes="open", mouth="smile", roll=0, gaze=(0, 0), brows=None, blush_k=1.0, tail_wag=0):
    """Paws, option A (front view), in the 120 space. eyes: open | happy | calm | wide; mouth: smile | open | flat | none."""
    bean = "M60 12 C96 12 108 44 108 72 C108 100 90 112 60 112 C30 112 12 100 12 72 C12 44 24 12 60 12Z"
    o = shadow(34)
    o += f'<circle cx="106" cy="{96 - tail_wag}" r="8" {sh(BODY)}/><circle cx="110" cy="{91 - tail_wag}" r="4.6" fill="{WHITE}"/>'
    g = f'<g transform="rotate({roll} 60 108)">'
    g += f'<path d="{bean}" {sh(BODY)}/>'
    g += f'<path d="M30 20 Q8 22 8 54 Q8 66 20 62 Q34 52 40 28Z" {sh(BODY_D)}/><path d="M90 20 Q112 22 112 54 Q112 66 100 62 Q86 52 80 28Z" {sh(BODY_D)}/>'
    g += f'<path d="M52 14 Q60 10 68 14 L70 52 Q80 62 78 84 Q60 100 42 84 Q40 62 50 52Z" {wh()}/>'
    g += f'<ellipse cx="60" cy="102" rx="22" ry="12" {wh()}/>'
    g += f'<ellipse cx="33" cy="48" rx="5" ry="3.2" fill="{TAN}"/><ellipse cx="87" cy="48" rx="5" ry="3.2" fill="{TAN}"/>'
    gx, gy = gaze
    if eyes in ("open", "wide"):
        k = 1.15 if eyes == "wide" else 1
        g += eye(37 + gx, 66 + gy, 8 * k, 10 * k) + eye(83 + gx, 66 + gy, 8 * k, 10 * k)
    elif eyes == "happy":
        g += arc_eye(37, 68, 8) + arc_eye(83, 68, 8)
    elif eyes == "calm":
        g += arc_eye(37, 66, 8, False) + arc_eye(83, 66, 8, False)
    if brows == "worry":
        g += stroke_path("M28 52 Q36 48 46 55", INK, 2.2) + stroke_path("M92 52 Q84 48 74 55", INK, 2.2)
    g += f'<ellipse cx="26" cy="82" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="{0.85 * blush_k:.2f}"/><ellipse cx="94" cy="82" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="{0.85 * blush_k:.2f}"/>'
    g += nose(60, 78, 1.0)
    if mouth == "smile":
        g += f'<path d="M60 84 L60 87 M60 87 Q55 91 51 88 M60 87 Q65 91 69 88" fill="none" stroke="{MOUTH}" stroke-width="1.9" stroke-linecap="round"/>'
    elif mouth == "open":
        g += f'<path d="M51 86 Q60 100 69 86Z" fill="#7a2f3a" stroke="{MOUTH}" stroke-width="1.5" stroke-linejoin="round"/><path d="M55 93 Q60 98 65 93Q60 89 55 93Z" fill="{TONGUE}"/>'
    elif mouth == "flat":
        g += f'<path d="M60 84 L60 86 M53 88 Q60 90 67 88" fill="none" stroke="{MOUTH}" stroke-width="1.9" stroke-linecap="round"/>'
    g += "</g>"
    o += g
    o += f'<ellipse cx="40" cy="110" rx="11" ry="6.4" {wh()}/>{toes(40, 111, 1)}<ellipse cx="80" cy="110" rx="11" ry="6.4" {wh()}/>{toes(80, 111, 1)}'
    return o


def deco(*parts):
    return "".join(parts)


def sparkle(x, y, r=5, col="#ffd166"):
    return star(x, y, r, col)


# ---------------------------------------------------------------- D1 the chestnuts
def chestnut(x, y, r):
    return (f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.9:.1f}" fill="#9a5b34" stroke="#7a4326" stroke-width="1"/>'
            f'<path d="M{x - r * 0.7:.1f} {y - r * 0.55:.1f} Q{x} {y - r * 1.25:.1f} {x + r * 0.7:.1f} {y - r * 0.55:.1f} Q{x} {y - r * 0.3:.1f} {x - r * 0.7:.1f} {y - r * 0.55:.1f}Z" fill="#d9a066"/>'
            f'<ellipse cx="{x - r * 0.3:.1f}" cy="{y + r * 0.1:.1f}" rx="{r * 0.25:.1f}" ry="{r * 0.35:.1f}" fill="#fff" fill-opacity="0.25"/>')


def d1():
    row = "".join(chestnut(x, 127, 5.6) for x in (14, 31, 48)) + chestnut(66, 125, 8.6) + "".join(chestnut(x, 127, 5.6) for x in (86, 103))
    return paws("open", "flat", gaze=(2, 5), brows="worry") + row


# ---------------------------------------------------------------- D2 the stamp
def d2():
    paper = (f'<g transform="rotate(-3 60 124)"><rect x="22" y="112" width="52" height="26" rx="2" fill="#fff" stroke="#c9d0da" stroke-width="1.2"/>'
             f'<path d="M28 119 h30 M28 125 h24 M28 131 h28" stroke="#c9d0da" stroke-width="1.6" stroke-linecap="round"/>'
             f'<circle cx="63" cy="125" r="6" fill="none" stroke="#d9534f" stroke-width="2"/><path d="M60 125 l2.2 2.4 l4 -4.6" fill="none" stroke="#d9534f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>')
    stamp = ('<g transform="translate(92,110)"><rect x="-9" y="8" width="18" height="6" rx="2" fill="#8a5a3c"/><rect x="-6" y="-10" width="12" height="19" rx="4" fill="#b98a5a"/>'
             '<ellipse cx="0" cy="-11" rx="7" ry="3.4" fill="#d9a870"/></g>')
    return paws("calm", "none", gaze=(0, 0), roll=-2) + paper + stamp


# ---------------------------------------------------------------- D3 the pebble
def d3():
    pile = ('<ellipse cx="100" cy="124" rx="9" ry="6" fill="#aeb6c1"/><ellipse cx="114" cy="126" rx="8" ry="5.4" fill="#9aa3af"/><ellipse cx="107" cy="116" rx="8" ry="5.6" fill="#c0c8d2"/>'
            '<ellipse cx="108" cy="109" rx="5.4" ry="3.8" fill="#d6dce4" stroke="#fff" stroke-width="1"/>')
    return paws("happy", "open", roll=-3, blush_k=1.15) + pile + sparkle(10, 40, 6) + sparkle(112, 36, 5)


# ---------------------------------------------------------------- the pair
def curled(look):
    o = ell(60, 115, 46, 4.5, "#000", op=0.08)
    o += ell(60, 92, 45, 30, FUR) + ell(60, 100, 30, 14, DARK, 0, 0.25)
    o += stroke_path("M104 98 Q100 122 58 119 Q22 117 14 98", DARK, 11)
    o += ell(46, 104, 9, 6, FUR) + ell(74, 104, 9, 6, FUR)
    o += f'<g transform="translate(60,78) scale(0.86) translate(-60,-64)">{cat_head_only(STAND_F, look)}</g>'
    return o


def zzz():
    return '<path d="M92 38 h9 l-9 10 h9 M104 24 h6 l-6 7 h6" fill="none" stroke="#6b7cff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'


def beads(x0, y0, x1, y1, n=13):
    cols = ["#e8828a", "#7fb2e5", "#f2c14e", "#8fcf9a", "#b79ae0"]
    o = f'<path d="M{x0} {y0} L{x1} {y1}" stroke="#9aa3af" stroke-width="1.4"/>'
    for i in range(n):
        t = i / (n - 1)
        o += f'<circle cx="{x0 + (x1 - x0) * t:.1f}" cy="{y0 + (y1 - y0) * t:.1f}" r="3.6" fill="{cols[i % 5]}" stroke="#fff" stroke-width="0.8"/>'
    return o


PASS = {  # the four steps of Paws creeping past Peak: (scale, x0, feet y): small and far, nearer, just past Peak, well past and bigger
    1: (0.45, -4, 122), 2: (0.66, -4, 128), 3: (0.88, 116, 134), 4: (1.05, 166, 140)}


def pair_scene(peak_look, step=0, z=True):
    """A 290 x 146 scene: Peak asleep in the middle (rump at about x 150), Paws creeping past from the left (small, far) to the right (big, near).
    step 0 = Paws not there yet."""
    o = wrap(curled(peak_look) + (zzz() if z else ""), 34, 26, 1.0)
    if step:
        k, x0, feet = PASS[step]
        creep = dict(eyes="wide", mouth="flat", gaze=(-3 if step < 3 else 3, 0), brows="worry") if step < 4 else dict(eyes="calm", mouth="smile", gaze=(0, 0))
        o += wrap(paws(roll=-4 if step < 4 else 0, **creep), x0, feet - 115 * k, k)
    return o


def p1():
    """The first P1 (the author kept it), without the string of beads: Peak asleep with one eye open, Paws sitting beside."""
    look = dict(LOOK["rest"], lid=0.06, roll=7, cheek=0.85, lidR=1)
    return wrap(curled(look) + zzz(), 0, 20, 1.0) + wrap(paws("open", "smile"), 118, 20, 1.0)


# ---------------------------------------------------------------- P2 the meeting
def p2():
    peak = cat(SIT_F, dict(LOOK["rest"], lid=0.55, gy=-6, gx=-2, roll=-4, mouth="flat", cheek=0.3))
    paper = (f'<g transform="rotate(4 60 98)"><rect x="44" y="84" width="34" height="30" rx="2" fill="#fff" stroke="#c9d0da" stroke-width="1.4"/>'
             f'<rect x="44" y="84" width="34" height="8" rx="2" fill="#7fb2e5"/><path d="M50 99 h22 M50 106 h16" stroke="#c9d0da" stroke-width="1.8" stroke-linecap="round"/></g>')
    dog = paws("open", "none", roll=3, gaze=(0, -1)) + paper
    return peak, dog


# ---------------------------------------------------------------- the control: Peak alone
def c1():
    peak = cat(SIT_F, dict(LOOK["rest"], lid=0.6, gx=5, gy=2, roll=4, mouth="smile", cheek=0.6))
    table = ('<rect x="160" y="108" width="80" height="9" rx="2" fill="#b98a5a"/><rect x="160" y="108" width="80" height="3" fill="#d9a870"/>'
             '<rect x="226" y="117" width="8" height="40" fill="#a37548"/><rect x="166" y="117" width="8" height="40" fill="#a37548"/>')
    cup = ('<g transform="translate(166,92)"><path d="M-9 0 L-8 16 Q0 19 8 16 L9 0Z" fill="#fff" stroke="#c9d0da" stroke-width="1.3"/>'
           '<path d="M9 4 q8 0 6 7 q-2 4 -7 3" fill="none" stroke="#c9d0da" stroke-width="2"/><path d="M-6 6 h12" stroke="#7fb2e5" stroke-width="2"/></g>')
    return peak, table + cup


def c2():
    peak = cat(shift_down(SIT_F, 6), dict(LOOK["rest"], wide=0.4, cheek=0.9, roll=-3, mouth="smile"))
    back = ('<path d="M24 82 L96 82 L100 100 L20 100Z" fill="#8a6238"/><path d="M24 82 L12 72 M96 82 L108 72" stroke="#9c7040" stroke-width="4" stroke-linecap="round"/>'
            '<path d="M24 82 L96 82" stroke="#6f4d2b" stroke-width="2"/>')
    front = ('<path d="M20 100 L100 100 L94 122 L26 122Z" fill="#c9985e" stroke="#9c7040" stroke-width="1.8" stroke-linejoin="round"/>'
             '<path d="M20 100 L100 100" stroke="#e0b57e" stroke-width="3"/><path d="M50 108 h20" stroke="#9c7040" stroke-width="2" stroke-linecap="round"/>')
    tail = stroke_path("M98 108 Q112 104 108 90", DARK, 8)
    return back + peak + front + tail


# ---------------------------------------------------------------- S1 the four panels
def panel(x, y, w, h, inner, scale):
    o = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#fbf7f1" stroke="#d6cfc4" stroke-width="2"/>'
    return o + wrap(inner, x + (w - 290 * scale) / 2, y + (h - 146 * scale) / 2 + 4, scale)


def s1():
    sleep = dict(LOOK["rest"], lid=0.06, roll=7, cheek=0.85)
    awake = dict(sleep, lidR=1)
    k = 0.55
    return (panel(10, 70, 166, 136, pair_scene(sleep, 1), k)
            + panel(184, 70, 166, 136, pair_scene(sleep, 2), k)
            + panel(10, 214, 166, 136, pair_scene(awake, 3, z=False), k)
            + panel(184, 214, 166, 136, pair_scene(awake, 4, z=False), k))


STK_LIST = [
    # id, slug, texts (vi, en, ja), titles, scene (vi, en, ja), synonyms, builder
    ("D1", "one-is-off", ("Lệch một hạt.", "One is off.", "ひとつ大きい"), ("Lệch một hạt", "One is off", "ひとつ大きい"),
     ("Paws xếp hạt dẻ theo cỡ thành một hàng thẳng, nhưng một hạt to hơn một chút", "sorts chestnuts by size in a perfect row, but one is slightly too big", "くりを大きさ順にきれいに並べたが、ひとつだけ少し大きい"),
     {"vi": ["xếp hàng", "cẩn thận", "tỉ mỉ", "lệch"], "en": ["sorting", "careful", "tidy", "perfectionist"], "ja": ["並べる", "きちんと", "くり"]}, "d1"),
    ("D2", "stamped", ("Đã đóng dấu.", "Stamped.", "押印しました"), ("Đã đóng dấu", "Stamped", "押印しました"),
     ("Paws đóng dấu thật cẩn thận lên một tờ giấy chẳng ai đọc", "stamps a paper nobody will read, with great care", "だれも読まない書類に、ていねいにはんこを押している"),
     {"vi": ["đóng dấu", "duyệt", "giấy tờ", "xong việc"], "en": ["approved", "paperwork", "done", "stamp"], "ja": ["はんこ", "書類", "承認"]}, "d2"),
    ("D3", "one-pebble", ("Xong một viên.", "One pebble.", "ひとつ運んだ"), ("Xong một viên", "One pebble", "ひとつ運んだ"),
     ("Paws vừa mang một viên sỏi đến đống sỏi, đặt xuống và tự hào", "carried one pebble to the pile, put it down and looks proud", "小石をひとつ山まで運んで置き、とくいげにしている"),
     {"vi": ["tự hào", "xong", "việc nhỏ", "sỏi"], "en": ["proud", "small win", "done", "pebble"], "ja": ["ほこらしい", "ひとつ", "小石"]}, "d3"),
    ("P1", "excuse-me", ("Xin phép nhé.", "Excuse me.", "失礼します"), ("Xin phép nhé", "Excuse me", "失礼します"),
     ("Paws rón rén đi ngang qua Peak đang ngủ; Peak hé một mắt nhìn theo", "tiptoes past sleeping Peak; Peak opens one eye and watches", "ねているPeakのそばをそろそろと通りぬける。Peakは片目をあけて見ている"),
     {"vi": ["xin phép", "rón rén", "lịch sự", "ngủ"], "en": ["polite", "excuse me", "tiptoe", "nap"], "ja": ["失礼", "ていねい", "ねている", "そろそろ"]}, "p1"),
    ("P2", "meeting", ("Họp nhé?", "Meeting?", "会議しよう？"), ("Họp nhé?", "Meeting?", "会議しよう？"),
     ("Paws ngậm một tờ giấy nhỏ ghi cuộc họp đưa ra; Peak nhìn lên trần nhà", "holds out a tiny paper marked as a meeting; Peak looks at the ceiling", "小さな会議のお知らせをくわえて差し出す。Peakは天井を見ている"),
     {"vi": ["họp", "cuộc họp", "né", "công sở"], "en": ["meeting", "office", "avoid", "invite"], "ja": ["会議", "ミーティング", "会社", "さける"]}, "p2"),
    ("S1", "asks-first", ("Có xin phép.", "Asks first.", "ちゃんと許可"), ("Có xin phép", "Asks first", "ちゃんと許可"),
     ("bốn khung: Paws từ xa nhỏ dần tiến lại, rón rén qua Peak đang ngủ, Peak hé một mắt, Paws đi hẳn qua", "four panels: Paws creeps closer from far away, tiptoes past sleeping Peak, Peak opens one eye, Paws is well past", "4コマ：Pawsが遠くから近づき、ねているPeakのそばを通り、Peakが片目をあけ、Pawsは通りすぎる"),
     {"vi": ["truyện", "bốn khung", "xin phép", "ngủ"], "en": ["story", "four panels", "polite", "nap"], "ja": ["4コマ", "ストーリー", "許可", "ねる"]}, "s1"),
    ("C1", "just-testing", ("Rơi thử?", "Just testing.", "ためしただけ"), ("Rơi thử?", "Just testing", "ためしただけ"),
     ("Peak ngồi nhìn chiếc cốc ở mép bàn bằng đôi mắt lim dim", "sits and eyes a cup at the edge of the table with half-closed eyes", "テーブルのふちのコップを半目でじっと見ている"),
     {"vi": ["nghịch", "cốc", "mép bàn", "lầy"], "en": ["mischief", "cup", "table edge", "cheeky"], "ja": ["いたずら", "コップ", "ためす"]}, "c1"),
    ("C2", "fits", ("Vừa khít.", "Fits.", "ぴったり"), ("Vừa khít", "Fits", "ぴったり"),
     ("Peak ngồi chật cứng trong một chiếc hộp nhỏ xíu, vẫn cười", "squeezed into a much too small box, smiling anyway", "小さすぎる箱にぎゅうぎゅうに入って、それでも笑っている"),
     {"vi": ["hộp", "chật", "vừa", "đáng yêu"], "en": ["box", "snug", "squeeze", "cute"], "ja": ["箱", "ぎゅうぎゅう", "ぴったり"]}, "c2"),
]


ACTIVE = {"D1", "D2", "D3", "P1"}   # the author's choice for now; the others are parked (stickers-draft/parked/), not in the manifest


def build_inner(kind):
    S, DY = 2.3, 12
    x0, y0 = (360 - 120 * S) / 2, 82 - 20 * S + 8 + DY
    if kind in ("d1", "d2", "d3"):
        return wrap(globals()[kind](), x0, y0 - 4 * (kind == "d1"), S)
    if kind == "p1":
        return wrap(p1(), 2, 96, 1.5)
    if kind == "p2":
        peak, dog = p2()
        return wrap(peak, 2, 158, 1.5) + wrap(dog, 188, 168, 1.4)
    if kind == "s1":
        return s1()
    if kind == "c1":
        peak, extra = c1()
        return wrap(peak, -6, 130, 1.8) + wrap(extra, -98, 130, 1.8)
    if kind == "c2":
        return wrap(c2(), 36, 76, 2.3 * 0.9)
    raise KeyError(kind)


def main():
    import fitz
    manifest = []
    for sid, slug, texts, titles, scenes, syn, kind in STK_LIST:
        inner = build_inner(kind)
        base = OUT if sid in ACTIVE else os.path.join(OUT, "parked")
        for i, lang in enumerate(LANGS):
            os.makedirs(os.path.join(base, lang), exist_ok=True)
            png_from(inner, (360, 360), texts[i], os.path.join(base, lang, f"{sid}.png"), font=LANG_FONT[lang])
        if sid not in ACTIVE:
            continue
        who = "Peak" if sid.startswith("C") else ("Paws" if sid.startswith("D") else "Paws và Peak")
        manifest.append({
            "id": sid, "slug_en": slug, "kind": {"D": "paws-alone", "P": "pair", "S": "story", "C": "control-peak"}[sid[0]],
            "text": dict(zip(LANGS, texts)), "title": dict(zip(LANGS, titles)),
            "alt": {"vi": f"{scenes[0][0].upper() + scenes[0][1:]}. Chữ trên ảnh: “{texts[0]}”",
                    "en": f"{scenes[1][0].upper() + scenes[1][1:]}. Text on the image: \"{texts[1]}\"",
                    "ja": f"{scenes[2]}。画像の文字：「{texts[2]}」"},
            "synonyms": syn, "reviewed": {"vi": True, "en": False, "ja": False}, "status": "draft",
        })
    with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump({"version": "duo-draft-4", "creator": "Streakboom", "license": "CC BY 4.0", "stickers": manifest}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    for lang in LANGS:  # a review sheet per language: light and dark ground
        rd = fitz.open()
        pg = rd.new_page(width=1100, height=226 + 20)
        for gi, (sid, *_r) in enumerate([t for t in STK_LIST if t[0] in ACTIVE]):
            for row, bg in enumerate(((1, 1, 1), (0.118, 0.122, 0.133))):
                r = fitz.Rect(10 + (gi % 4) * 270, 10 + (gi // 4) * 226 + 0, 10 + (gi % 4) * 270 + 130, 10 + (gi // 4) * 226 + 130)
                r2 = fitz.Rect(r.x0 + 133, r.y0, r.x0 + 263, r.y0 + 130)
                rr = r if row == 0 else r2
                pg.draw_rect(rr, color=(0.8, 0.8, 0.8), fill=bg)
                pg.insert_image(rr, filename=os.path.join(OUT, lang, f"{sid}.png"))
        pg.get_pixmap(dpi=72).save(os.path.join(OUT, f"review_{lang}.png"))
    # one larger sheet for the author (vi): 4 x 2 at 256 px on light, plus 64 and 32 px on dark
    rd = fitz.open()
    pg = rd.new_page(width=1100, height=400)
    pg.draw_rect(pg.rect, color=None, fill=(1, 1, 1))
    for gi, (sid, *_r) in enumerate([t for t in STK_LIST if t[0] in ACTIVE]):
        x, y = 10 + (gi % 4) * 272, 10 + (gi // 4) * 370
        pg.draw_rect(fitz.Rect(x, y, x + 262, y + 262), color=(0.85, 0.85, 0.85), fill=(0.97, 0.97, 0.97))
        pg.insert_image(fitz.Rect(x + 3, y + 3, x + 259, y + 259), filename=os.path.join(OUT, "vi", f"{sid}.png"))
        pg.draw_rect(fitz.Rect(x, y + 266, x + 262, y + 354), color=None, fill=(0.118, 0.122, 0.133))
        pg.insert_image(fitz.Rect(x + 8, y + 270, x + 8 + 80, y + 350), filename=os.path.join(OUT, "vi", f"{sid}.png"))
        pg.insert_image(fitz.Rect(x + 110, y + 290, x + 110 + 36, y + 326), filename=os.path.join(OUT, "vi", f"{sid}.png"))
        pg.insert_text(fitz.Point(x + 170, y + 314), sid, fontsize=14, color=(0.8, 0.8, 0.8))
    pg.get_pixmap(dpi=100).save(os.path.join(OUT, "duo-stickers-vi.png"))
    print("done", len(STK_LIST), "stickers x", len(LANGS), "languages in", OUT)


if __name__ == "__main__":
    main()
