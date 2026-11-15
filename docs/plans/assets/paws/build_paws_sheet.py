# Builds the reference sheet of Paws, the dog (docs/handoff/sticker-paws-reference.md, spec/19, ADR-0127).
# Flat, same 0..120 drawing space and the same family look as Peak (docs/plans/assets/sticker-character-sheet.svg): a round mochi body, big
# round eyes with two highlights, blush, no arm strokes. The dog is a black-and-white Border Collie.
#
# Answers to the render check of the Gemini SVG (docs/plans/duo-paws-svg-check.md):
#   - the dark body vanished on a dark ground  -> a LIGHTER dark tone (charcoal blue) and a light RIM LINE round every dark shape;
#   - it read like a penguin or a hamster       -> BIG ears with folded tips, a white blaze and muzzle, a neck ruff, back legs, a bushy tail;
#   - the front paws were two empty rings       -> real paws: white feet with two toe lines;
#   - the xmlns was wrong                       -> every file here has xmlns="http://www.w3.org/2000/svg".
#
# Run:  python build_paws_sheet.py   (needs PyMuPDF only for the PNG renders: pip install pymupdf)
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

BODY = "#4b5160"      # a lighter dark: it still reads as black fur but does not vanish on #1e1f22
BODY_D = "#3a3f4b"    # shade for the inside of the ears and the hind legs
RIM = "#e9eef5"       # the light rim line that keeps the silhouette on a dark ground
WHITE = "#fdfdfd"
WHITE_L = "#c9d0da"   # the fine line on the white parts
TAN = "#c98f4a"       # the two brow spots (a tri-colour collie): they make the eyes readable
INK = "#2b2220"
NOSE = "#1f2128"
PINK = "#f29aa4"
TONGUE = "#ef7f8c"
BLUSH = "#f4b3b3"

NS = 'xmlns="http://www.w3.org/2000/svg"'


def sh(d_fill, extra=""):
    return f'fill="{d_fill}" stroke="{RIM}" stroke-width="2.2" stroke-linejoin="round" {extra}'


def toes(x, y, k=1.0):
    return "".join(f'<path d="M{x + dx * k:.1f} {y - 2.5 * k:.1f} l0 {5 * k:.1f}" stroke="{WHITE_L}" stroke-width="1.5" stroke-linecap="round"/>' for dx in (-3, 3))


def front():
    """Front view, standing. Rig-like numbers (a 120 x 120 space)."""
    o = f'<ellipse cx="60" cy="115" rx="34" ry="4.5" fill="#000" fill-opacity="0.09"/>'
    # tail first (behind): bushy, a white tip
    o += f'<path d="M88 100 Q114 100 110 72" fill="none" stroke="{RIM}" stroke-width="15" stroke-linecap="round"/>'
    o += f'<path d="M88 100 Q114 100 110 72" fill="none" stroke="{BODY}" stroke-width="11.5" stroke-linecap="round"/>'
    o += f'<circle cx="110" cy="72" r="6.2" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'
    # hind legs (haunches at the sides) and the body
    o += f'<ellipse cx="30" cy="104" rx="11" ry="9" {sh(BODY_D)}/><ellipse cx="90" cy="104" rx="11" ry="9" {sh(BODY_D)}/>'
    o += f'<ellipse cx="60" cy="92" rx="33" ry="24" {sh(BODY)}/>'
    # the white chest and the neck ruff
    o += f'<ellipse cx="60" cy="100" rx="19" ry="15" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'
    # front feet: real paws, white, with toes
    o += f'<ellipse cx="45" cy="109" rx="11" ry="7" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1.2"/>{toes(45, 111)}'
    o += f'<ellipse cx="75" cy="109" rx="11" ry="7" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1.2"/>{toes(75, 111)}'
    o += f'<ellipse cx="60" cy="88" rx="23" ry="9" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'   # the ruff under the head
    # ears: big, up, the tips folded over
    for sgn, ax in ((-1, 0), (1, 120)):
        pass
    o += (f'<path d="M24 56 Q14 30 28 18 Q36 14 40 20 Q40 28 52 34 Q48 46 46 56Z" {sh(BODY)}/>'
          f'<path d="M30 52 Q24 34 31 24 Q35 22 36 26" fill="none" stroke="{BODY_D}" stroke-width="5" stroke-linecap="round"/>'
          f'<path d="M96 56 Q106 30 92 18 Q84 14 80 20 Q80 28 68 34 Q72 46 74 56Z" {sh(BODY)}/>'
          f'<path d="M90 52 Q96 34 89 24 Q85 22 84 26" fill="none" stroke="{BODY_D}" stroke-width="5" stroke-linecap="round"/>')
    # head
    o += f'<ellipse cx="60" cy="64" rx="40" ry="33" {sh(BODY)}/>'
    # the white blaze and the muzzle
    o += f'<path d="M54 34 Q60 30 66 34 L69 58 Q76 68 74 80 Q60 92 46 80 Q44 68 51 58Z" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'
    o += f'<ellipse cx="60" cy="78" rx="14" ry="10.5" fill="{WHITE}"/>'
    # brow spots, eyes with two highlights, blush
    o += f'<ellipse cx="40" cy="48" rx="4.4" ry="3" fill="{TAN}"/><ellipse cx="80" cy="48" rx="4.4" ry="3" fill="{TAN}"/>'
    for ex in (42, 78):
        o += (f'<ellipse cx="{ex}" cy="62" rx="6.8" ry="8.6" fill="{INK}"/><ellipse cx="{ex + 2.4}" cy="58.6" rx="3" ry="3" fill="#fff"/>'
              f'<ellipse cx="{ex - 2.4}" cy="65.8" rx="1.4" ry="1.4" fill="#fff"/>')
    o += f'<ellipse cx="29" cy="76" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="0.8"/><ellipse cx="91" cy="76" rx="7" ry="4.2" fill="{BLUSH}" fill-opacity="0.8"/>'
    # nose, mouth, a small tongue (a happy, busy dog)
    o += (f'<path d="M54 71.5 Q60 68.5 66 71.5 Q65 77 60 78 Q55 77 54 71.5Z" fill="{NOSE}"/><ellipse cx="58" cy="72.4" rx="2" ry="1" fill="#fff" fill-opacity="0.55"/>'
          f'<path d="M60 78 L60 82 M60 82 Q55 86 51 83 M60 82 Q65 86 69 83" fill="none" stroke="#7a4b3a" stroke-width="1.9" stroke-linecap="round"/>'
          f'<path d="M56.5 85 Q60 94 63.500 85Z" fill="{TONGUE}"/>')
    return o.replace(".500", ".5")


def side():
    """Side view, standing, facing right: a neck, four legs, the ear folded over, the bushy tail up."""
    o = '<g transform="translate(7,8) scale(0.91)">'
    o += '<ellipse cx="58" cy="115" rx="44" ry="4.5" fill="#000" fill-opacity="0.09"/>'
    o += f'<path d="M20 82 Q-2 78 8 50" fill="none" stroke="{RIM}" stroke-width="15" stroke-linecap="round"/>'
    o += f'<path d="M20 82 Q-2 78 8 50" fill="none" stroke="{BODY}" stroke-width="11.5" stroke-linecap="round"/>'
    o += f'<circle cx="8" cy="50" r="6.2" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'
    # far legs (a darker tone) and their white feet
    for x in (40, 84):
        o += f'<rect x="{x}" y="90" width="12" height="18" rx="6" {sh(BODY_D)}/><ellipse cx="{x + 6}" cy="109.5" rx="8.5" ry="5" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1.1"/>{toes(x + 6, 110.5, 0.85)}'
    o += f'<ellipse cx="54" cy="86" rx="38" ry="22" {sh(BODY)}/>'
    # near legs: the same dark fur, white feet with toes
    for x in (20, 64):
        o += f'<rect x="{x}" y="90" width="13" height="19" rx="6.5" {sh(BODY)}/><ellipse cx="{x + 6.5}" cy="109.5" rx="9" ry="5.2" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1.1"/>{toes(x + 6.5, 110.5, 0.9)}'
    # neck and ruff, head with the long white blaze, the muzzle, one big folded ear
    o += f'<path d="M66 66 Q84 58 90 52 Q90 78 80 94 Q66 90 66 66Z" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/>'
    o += f'<ellipse cx="90" cy="60" rx="24" ry="21" {sh(BODY)}/>'
    o += f'<ellipse cx="110" cy="68" rx="12" ry="9" fill="{WHITE}" stroke="{WHITE_L}" stroke-width="1"/><path d="M92 42 Q103 52 109 60" fill="none" stroke="{WHITE}" stroke-width="7" stroke-linecap="round"/>'
    o += f'<path d="M72 44 Q66 24 82 18 Q90 18 92 24 Q88 28 90 38 Q84 46 76 50Z" {sh(BODY)}/><path d="M76 40 Q74 28 82 24" fill="none" stroke="{BODY_D}" stroke-width="4.5" stroke-linecap="round"/>'
    o += f'<ellipse cx="100" cy="51" rx="4" ry="2.8" fill="{TAN}"/>'
    o += f'<ellipse cx="102" cy="59" rx="6" ry="7.6" fill="{INK}"/><ellipse cx="104" cy="56.2" rx="2.6" ry="2.6" fill="#fff"/><ellipse cx="100" cy="62" rx="1.2" ry="1.2" fill="#fff"/>'
    o += f'<ellipse cx="96" cy="70" rx="6.5" ry="3.8" fill="{BLUSH}" fill-opacity="0.8"/>'
    o += f'<path d="M117 64.5 Q123 66 121 70 Q118 72 115.5 69.5Z" fill="{NOSE}"/><path d="M113 73 Q107 77 102 74" fill="none" stroke="#7a4b3a" stroke-width="1.8" stroke-linecap="round"/>'
    return o + '</g>'


def svg(inner, w=120, h=120, bg=None, extra=""):
    b = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg {NS} viewBox="0 0 {w} {h}" width="{w * 4}" height="{h * 4}">{b}{inner}{extra}</svg>'


def sheet():
    pal = [("body #4b5160", BODY), ("shade #3a3f4b", BODY_D), ("rim #e9eef5", RIM), ("white", WHITE), ("brow tan", TAN), ("nose", NOSE)]
    sw = "".join(f'<g transform="translate({20 + (i % 3) * 150},{490 + (i // 3) * 36})"><rect width="26" height="22" rx="4" fill="{c}" stroke="#bbb" stroke-width="1"/><text x="34" y="16" font-size="12" fill="#2b2220">{n}</text></g>' for i, (n, c) in enumerate(pal))
    return (f'<svg {NS} viewBox="0 0 640 620" width="640" height="620" font-family="Segoe UI, Arial, sans-serif">'
            '<rect width="640" height="620" fill="#ffffff"/>'
            '<text x="20" y="30" font-size="18" font-weight="700" fill="#2b2220">Paws, the dog: reference sheet v0.1 (2026-11-15)</text>'
            '<text x="20" y="50" font-size="12" fill="#666">A black-and-white Border Collie, Peak\'s partner. Flat, no arms. Front and side view; the check on the next page.</text>'
            f'<g transform="translate(20,60) scale(2.6)">{front()}</g>'
            f'<g transform="translate(330,60) scale(2.4)">{side()}</g>'
            '<text x="20" y="388" font-size="13" font-weight="700" fill="#2b2220">What changed against the first (Gemini) drawing</text>'
            '<text x="20" y="408" font-size="12" fill="#2b2220">A lighter dark body and a light rim line round every dark shape (it no longer vanishes on a dark ground).</text>'
            '<text x="20" y="424" font-size="12" fill="#2b2220">Big ears with the tips folded, a white blaze and muzzle, a neck ruff, back legs and a bushy tail (a dog, not a penguin).</text>'
            '<text x="20" y="440" font-size="12" fill="#2b2220">Real white paws with toes; a small tongue and tan brow spots so the face reads at 32 px; the correct xmlns.</text>'
            '<text x="20" y="470" font-size="13" font-weight="700" fill="#2b2220">Palette</text>' + sw + '</svg>')


def write(name, text):
    with open(os.path.join(HERE, name), "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)


write("paws-front.svg", svg(front()))
write("paws-side.svg", svg(side()))
write("paws-reference-sheet.svg", sheet())

try:
    import fitz

    def render(svg_text, w, h, path, bg=None):
        doc = fitz.open(stream=svg_text.encode("utf-8"), filetype="svg")
        page = doc[0]
        z = w / page.rect.width
        pix = page.get_pixmap(matrix=fitz.Matrix(z, z), alpha=bg is None)
        pix.save(os.path.join(HERE, path))

    render(sheet(), 1280, 1240, "paws-reference-sheet.png")
    # the check the author asked for: 256 px and 32 px, on a light ground and on a dark ground (front and side)
    cells = []
    for view, fn in (("front", front), ("side", side)):
        for ground, color in (("light", "#ffffff"), ("dark", "#1e1f22"), ("dark2", "#2b2d31")):
            for px in (256, 32):
                cells.append((view, ground, color, px, fn))
    sheet_doc = fitz.open()
    pg = sheet_doc.new_page(width=1100, height=280)
    pg.draw_rect(pg.rect, color=None, fill=(0.9, 0.9, 0.9))
    x = 10
    y = 10
    for gi, (ground, color) in enumerate((("light", "#ffffff"), ("dark", "#1e1f22"), ("dark2", "#2b2d31"))):
        for vi, (view, fn) in enumerate((("front", front), ("side", side))):
            cx = 10 + (gi * 2 + vi) * 180
            rgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
            pg.draw_rect(fitz.Rect(cx, 10, cx + 172, 182), color=None, fill=rgb)
            for pi, px in enumerate((256, 64, 32)):
                s_ = svg(fn(), bg=color)
                doc = fitz.open(stream=s_.encode("utf-8"), filetype="svg")
                pix = doc[0].get_pixmap(matrix=fitz.Matrix(px / 120, px / 120), alpha=False)
                tmp = os.path.join(HERE, "_tmp.png")
                pix.save(tmp)
                if px == 256:
                    pg.insert_image(fitz.Rect(cx + 8, 20, cx + 164, 176), filename=tmp)
                elif px == 64:
                    pg.insert_image(fitz.Rect(cx + 20, 208, cx + 84, 272), filename=tmp)
                else:
                    pg.insert_image(fitz.Rect(cx + 110, 208, cx + 142, 240), filename=tmp)
            pg.insert_text(fitz.Point(cx + 4, 200), f"{ground} / {view}: 256, 64 and 32 px", fontsize=8, color=(0.4, 0.4, 0.4) if ground == "light" else (0.8, 0.8, 0.8))
    pg.get_pixmap(dpi=72).save(os.path.join(HERE, "paws-check.png"))
    os.remove(os.path.join(HERE, "_tmp.png"))
    print("rendered")
except Exception as e:  # the SVG files are the product; the PNGs are for looking
    print("no PNG renders:", e)
print("done")
