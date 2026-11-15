# Three cuter options for Paws (the author: "Paws is not as cute as Peak"). Same palette, rim line and 120 x 120 space as build_paws_sheet.py.
# The idea shared by all three: the Peak recipe. A round, soft mochi shape, a BIG head, small body, a small muzzle low on the face,
# big wide-set eyes with two highlights, blush, no arm strokes. They differ in the ears and the pose.
#   A "Mochi"   : head and body are one round bean, soft floppy ears, a tiny nub tail.
#   B "Big head": a big head on a small body, upright ears with the tips folded, a happy open mouth.
#   C "Sitting" : sits like a loaf, long drooping ears, a big white face mask, a fluffy tail curled up.
# Run: python build_paws_options.py   (PyMuPDF only for the PNG renders)
import os

HERE = os.path.dirname(os.path.abspath(__file__))
BODY, BODY_D, RIM = "#4b5160", "#3a3f4b", "#e9eef5"
WHITE, WHITE_L, TAN = "#fdfdfd", "#c9d0da", "#c98f4a"
INK, NOSE, TONGUE, BLUSH, MOUTH = "#2b2220", "#1f2128", "#ef7f8c", "#f4b3b3", "#7a4b3a"
NS = 'xmlns="http://www.w3.org/2000/svg"'


def sh(fill, extra=""):
    return f'fill="{fill}" stroke="{RIM}" stroke-width="2.2" stroke-linejoin="round" {extra}'


def wh(extra=""):
    return f'fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1" {extra}'


def toes(x, y, k=1.0):
    return "".join(f'<path d="M{x + dx * k:.1f} {y - 2 * k:.1f} l0 {4 * k:.1f}" stroke="{WHITE_L}" stroke-width="1.3" stroke-linecap="round"/>' for dx in (-2.6, 2.6))


def eye(x, y, rx=8, ry=10):
    return (f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{INK}"/>'
            f'<ellipse cx="{x + rx * 0.36:.1f}" cy="{y - ry * 0.36:.1f}" rx="{rx * 0.4:.1f}" ry="{rx * 0.4:.1f}" fill="#fff"/>'
            f'<ellipse cx="{x - rx * 0.34:.1f}" cy="{y + ry * 0.38:.1f}" rx="{rx * 0.18:.1f}" ry="{rx * 0.18:.1f}" fill="#fff"/>')


def nose(x, y, s=1.0):
    return (f'<path d="M{x - 5 * s:.1f} {y} Q{x} {y - 3.4 * s:.1f} {x + 5 * s:.1f} {y} Q{x + 4 * s:.1f} {y + 5 * s:.1f} {x} {y + 6 * s:.1f} Q{x - 4 * s:.1f} {y + 5 * s:.1f} {x - 5 * s:.1f} {y}Z" fill="{NOSE}"/>'
            f'<ellipse cx="{x - 1.8 * s:.1f}" cy="{y + 0.9 * s:.1f}" rx="{1.8 * s:.1f}" ry="{0.9 * s:.1f}" fill="#fff" fill-opacity="0.55"/>')


def blush(x1, x2, y):
    return f'<ellipse cx="{x1}" cy="{y}" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="0.85"/><ellipse cx="{x2}" cy="{y}" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="0.85"/>'


def shadow(rx=36):
    return f'<ellipse cx="60" cy="115" rx="{rx}" ry="4.5" fill="#000" fill-opacity="0.09"/>'


def option_a():
    """Mochi: head and body are one round bean; floppy ears; a nub tail."""
    o = shadow(34)
    o += f'<circle cx="106" cy="96" r="8" {sh(BODY)}/><circle cx="110" cy="91" r="4.6" fill="{WHITE}"/>'          # tail nub
    o += f'<path d="M60 12 C96 12 108 44 108 72 C108 100 90 112 60 112 C30 112 12 100 12 72 C12 44 24 12 60 12Z" {sh(BODY)}/>'  # the bean
    o += f'<path d="M30 20 Q8 22 8 54 Q8 66 20 62 Q34 52 40 28Z" {sh(BODY_D)}/>'
    o += f'<path d="M90 20 Q112 22 112 54 Q112 66 100 62 Q86 52 80 28Z" {sh(BODY_D)}/>'
    o += f'<path d="M52 14 Q60 10 68 14 L70 52 Q80 62 78 84 Q60 100 42 84 Q40 62 50 52Z" {wh()}/>'                  # blaze + muzzle
    o += f'<ellipse cx="60" cy="102" rx="22" ry="12" {wh()}/>'                                                       # white belly
    o += f'<ellipse cx="40" cy="110" rx="11" ry="6.4" {wh()}/>{toes(40, 111, 1)}<ellipse cx="80" cy="110" rx="11" ry="6.4" {wh()}/>{toes(80, 111, 1)}'
    o += f'<ellipse cx="33" cy="48" rx="5" ry="3.2" fill="{TAN}"/><ellipse cx="87" cy="48" rx="5" ry="3.2" fill="{TAN}"/>'
    o += eye(37, 66) + eye(83, 66)
    o += blush(26, 94, 82)
    o += nose(60, 78, 1.0)
    o += f'<path d="M60 84 L60 87 M60 87 Q55 91 51 88 M60 87 Q65 91 69 88" fill="none" stroke="{MOUTH}" stroke-width="1.9" stroke-linecap="round"/>'
    return o


def option_b():
    """Big head on a small body, upright ears with folded tips, a happy open mouth."""
    o = shadow(30)
    o += f'<path d="M86 102 Q112 102 110 86" fill="none" stroke="{RIM}" stroke-width="14" stroke-linecap="round"/>'
    o += f'<path d="M86 102 Q112 102 110 86" fill="none" stroke="{BODY}" stroke-width="10.5" stroke-linecap="round"/><circle cx="110" cy="86" r="5.8" {wh()}/>'
    o += f'<ellipse cx="60" cy="98" rx="28" ry="19" {sh(BODY)}/><ellipse cx="60" cy="102" rx="14" ry="12" {wh()}/>'
    o += f'<ellipse cx="44" cy="110" rx="10.5" ry="6.4" {wh()}/>{toes(44, 111)}<ellipse cx="76" cy="110" rx="10.5" ry="6.4" {wh()}/>{toes(76, 111)}'
    o += (f'<path d="M20 52 Q8 24 24 8 Q34 4 40 12 Q40 22 52 30 Q46 42 44 52Z" {sh(BODY)}/><path d="M26 46 Q20 28 28 16" fill="none" stroke="{BODY_D}" stroke-width="5" stroke-linecap="round"/>'
          f'<path d="M100 52 Q112 24 96 8 Q86 4 80 12 Q80 22 68 30 Q74 42 76 52Z" {sh(BODY)}/><path d="M94 46 Q100 28 92 16" fill="none" stroke="{BODY_D}" stroke-width="5" stroke-linecap="round"/>')
    o += f'<ellipse cx="60" cy="58" rx="46" ry="38" {sh(BODY)}/>'
    o += f'<path d="M54 22 Q60 18 66 22 L68 50 Q76 60 74 74 Q60 86 46 74 Q44 60 52 50Z" {wh()}/>'
    o += f'<ellipse cx="36" cy="38" rx="5" ry="3.2" fill="{TAN}"/><ellipse cx="84" cy="38" rx="5" ry="3.2" fill="{TAN}"/>'
    o += eye(34, 56, 8.6, 10.8) + eye(86, 56, 8.6, 10.8)
    o += blush(21, 99, 72)
    o += nose(60, 66, 1.05)
    o += f'<path d="M50 76 Q60 94 70 76Z" fill="#7a2f3a" stroke="{MOUTH}" stroke-width="1.6" stroke-linejoin="round"/><path d="M54.5 84 Q60 91.500 65.500 84Q60 80 54.500 84Z" fill="{TONGUE}"/>'
    o += f'<path d="M60 70 L60 76" stroke="{MOUTH}" stroke-width="1.8" stroke-linecap="round"/>'
    return o.replace(".500", ".5")


def option_c():
    """Sitting like a loaf: long drooping ears, a big white mask, a fluffy tail curled up."""
    o = shadow(36)
    o += f'<path d="M90 104 Q112 104 106 68 Q103 62 98 68" fill="none" stroke="{RIM}" stroke-width="17" stroke-linecap="round"/>'
    o += f'<path d="M90 104 Q112 104 106 68 Q103 62 98 68" fill="none" stroke="{BODY}" stroke-width="13.5" stroke-linecap="round"/><circle cx="98" cy="68" r="6.4" {wh()}/>'
    o += f'<ellipse cx="60" cy="94" rx="36" ry="24" {sh(BODY)}/><ellipse cx="60" cy="98" rx="21" ry="17" {wh()}/>'
    o += f'<ellipse cx="45" cy="110" rx="11" ry="6.6" {wh()}/>{toes(45, 111)}<ellipse cx="75" cy="110" rx="11" ry="6.6" {wh()}/>{toes(75, 111)}'
    o += f'<path d="M24 36 Q4 46 8 78 Q22 90 34 68 Q40 50 38 38Z" {sh(BODY_D)}/><path d="M96 36 Q116 46 112 78 Q98 90 86 68 Q80 50 82 38Z" {sh(BODY_D)}/>'
    o += f'<ellipse cx="60" cy="56" rx="40" ry="35" {sh(BODY)}/>'
    o += f'<path d="M20 62 Q22 88 60 90 Q98 88 100 62 Q86 54 60 56 Q34 54 20 62Z" {wh()}/><path d="M53 22 Q60 18 67 22 L68 54 L52 54Z" {wh()}/>'
    o += f'<ellipse cx="38" cy="38" rx="5" ry="3.2" fill="{TAN}"/><ellipse cx="82" cy="38" rx="5" ry="3.2" fill="{TAN}"/>'
    o += eye(40, 54, 8, 10) + eye(80, 54, 8, 10)
    o += blush(27, 93, 70)
    o += nose(60, 64, 1.0)
    o += f'<path d="M60 70 L60 73 M60 73 Q55 78 50 75 M60 73 Q65 78 70 75" fill="none" stroke="{MOUTH}" stroke-width="1.9" stroke-linecap="round"/>'
    return o


def option_a_side():
    """Option A from the side, facing right: the same round bean, one floppy ear, short legs, the nub tail."""
    bean = "M58 14 C92 12 112 40 110 70 C108 98 88 108 58 108 C30 108 12 98 12 74 C12 40 28 16 58 14Z"
    o = shadow(38)
    o += f'<circle cx="14" cy="88" r="8" {sh(BODY)}/><circle cx="9" cy="84" r="4.6" fill="{WHITE}"/>'
    for x in (34, 76):                                                                                            # far legs: feet only
        o += f'<ellipse cx="{x + 7}" cy="109" rx="9" ry="5.4" {wh()}/>{toes(x + 7, 110, 0.9)}'
    o += f'<path d="{bean}" {sh(BODY)}/>'
    o += f'<path d="M97.5 30 C106.5 40.5 111 55 110 70 C109 84 103.5 93.5 94.5 99.5 C86 84 86 50 97.5 30Z" fill="{WHITE}"/>'   # the white face, inside the bean
    o += f'<ellipse cx="58" cy="102" rx="24" ry="6" fill="{WHITE}"/>'
    o += f'<path d="{bean}" fill="none" stroke="{RIM}" stroke-width="2.2" stroke-linejoin="round"/>'
    for x in (20, 62):                                                                                            # near legs: feet only
        o += f'<ellipse cx="{x + 7.5}" cy="109.5" rx="10" ry="5.8" {wh()}/>{toes(x + 7.5, 110.5, 1)}'
    o += f'<path d="M78 18 Q62 22 60 44 Q60 58 72 58 Q84 52 88 34Z" {sh(BODY_D)}/>'                               # near ear, floppy
    o += f'<ellipse cx="96" cy="34" rx="4.6" ry="3" fill="{TAN}"/>'
    o += eye(94, 54, 7.6, 9.6)
    o += f'<ellipse cx="86" cy="72" rx="6.5" ry="4" fill="{BLUSH}" fill-opacity="0.85"/>'
    o += nose(112, 62, 0.9)
    o += f'<path d="M110 70 Q105 77 98 74" fill="none" stroke="{MOUTH}" stroke-width="1.9" stroke-linecap="round"/>'
    return o


OPTIONS = [("A", "Mochi", option_a, "One round bean, floppy ears"),
           ("B", "Big head", option_b, "Big head, folded upright ears, open smile"),
           ("C", "Sitting", option_c, "Sits, long drooping ears, white mask")]


def svg(inner, w=120, h=120, bg=None):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg {NS} viewBox="0 0 {w} {h}" width="{w * 4}" height="{h * 4}">{b}{inner}</svg>'


def sheet():
    parts = ['<rect width="720" height="470" fill="#ffffff"/>',
             '<text x="20" y="30" font-size="18" font-weight="700" fill="#2b2220">Paws: three cuter options (2026-11-15)</text>',
             '<text x="20" y="50" font-size="12" fill="#666">The Peak recipe: a round soft shape, a big head, a small muzzle, big eyes with two highlights, blush. No arms.</text>']
    for i, (k, name, fn, note) in enumerate(OPTIONS):
        x = 20 + i * 232
        parts.append(f'<rect x="{x}" y="64" width="212" height="212" rx="10" fill="#f6f1ea"/><g transform="translate({x + 6},{70}) scale(1.7)">{fn()}</g>')
        parts.append(f'<rect x="{x}" y="284" width="212" height="70" rx="10" fill="#1e1f22"/><g transform="translate({x + 8},{288}) scale(0.55)">{fn()}</g>')
        parts.append(f'<g transform="translate({x + 84},{296}) scale(0.27)">{fn()}</g>')
        parts.append(f'<rect x="{x + 130}" y="286" width="72" height="66" rx="6" fill="#2b2d31"/><g transform="translate({x + 152},{290}) scale(0.5)">{fn()}</g>')
        parts.append(f'<text x="{x}" y="378" font-size="15" font-weight="700" fill="#2b2220">{k}. {name}</text>')
        parts.append(f'<text x="{x}" y="396" font-size="11" fill="#444">{note}</text>')
    return f'<svg {NS} viewBox="0 0 720 420" width="720" height="420" font-family="Segoe UI, Arial, sans-serif">' + "".join(parts) + '</svg>'


def write(name, text):
    with open(os.path.join(HERE, name), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


for k, name, fn, note in OPTIONS:
    write(f"paws-option-{k.lower()}.svg", svg(fn()))
write("paws-options.svg", sheet())
write("paws-option-a-side.svg", svg(option_a_side()))

try:
    import fitz
    doc = fitz.open(stream=sheet().encode("utf-8"), filetype="svg")
    doc[0].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(os.path.join(HERE, "paws-options.png"))
    # the small check: 256 / 64 / 32 px on white, #1e1f22 and #2b2d31, for each option
    out = fitz.open()
    pg = out.new_page(width=1100, height=640)
    pg.draw_rect(pg.rect, color=None, fill=(0.9, 0.9, 0.9))
    for oi, (k, name, fn, note) in enumerate(OPTIONS):
        for gi, color in enumerate(("#ffffff", "#1e1f22", "#2b2d31")):
            cx, cy = 10 + gi * 360, 10 + oi * 208
            rgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
            pg.draw_rect(fitz.Rect(cx, cy, cx + 350, cy + 200), color=None, fill=rgb)
            for px, (dx, dy) in ((256, (6, 4)), (64, (270, 6)), (32, (290, 90))):
                s = doc_ = fitz.open(stream=svg(fn(), bg=color).encode("utf-8"), filetype="svg")
                pix = doc_[0].get_pixmap(matrix=fitz.Matrix(px / 120, px / 120), alpha=False)
                pix.save(os.path.join(HERE, "_tmp.png"))
                pg.insert_image(fitz.Rect(cx + dx, cy + dy, cx + dx + px, cy + dy + px) if px != 256 else fitz.Rect(cx + 6, cy + 4, cx + 198, cy + 196), filename=os.path.join(HERE, "_tmp.png"))
            pg.insert_text(fitz.Point(cx + 210, cy + 190), f"{k} {name}", fontsize=9, color=(0.4, 0.4, 0.4) if gi == 0 else (0.8, 0.8, 0.8))
    pg.get_pixmap(dpi=72).save(os.path.join(HERE, "paws-options-check.png"))
    os.remove(os.path.join(HERE, "_tmp.png"))
    out2 = fitz.open()
    pg2 = out2.new_page(width=740, height=420)
    pg2.draw_rect(pg2.rect, color=None, fill=(0.9, 0.9, 0.9))
    for gi, color in enumerate(("#ffffff", "#1e1f22", "#2b2d31")):
        rgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
        cy = 10 + gi * 136
        pg2.draw_rect(fitz.Rect(10, cy, 730, cy + 130), color=None, fill=rgb)
        for vi, fn in enumerate((option_a, option_a_side)):
            d = fitz.open(stream=svg(fn(), bg=color).encode("utf-8"), filetype="svg")
            for px, dx in ((120, 10), (64, 140), (32, 215)):
                d[0].get_pixmap(matrix=fitz.Matrix(px / 120, px / 120), alpha=False).save(os.path.join(HERE, "_tmp.png"))
                pg2.insert_image(fitz.Rect(vi * 360 + dx, cy + 5, vi * 360 + dx + px, cy + 5 + px), filename=os.path.join(HERE, "_tmp.png"))
    pg2.get_pixmap(dpi=144).save(os.path.join(HERE, "paws-option-a-check.png"))
    os.remove(os.path.join(HERE, "_tmp.png"))
    print("rendered")
except Exception as e:
    print("no PNG renders:", e)
