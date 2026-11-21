# A look at three ways to deal with chat apps that put a transparent PNG on a black ground: (1) as it is, (2) a flat white square, (3) a white die-cut border
# round the whole sticker (the picture stays transparent outside the border). Run with PyMuPDF. Output: bg-test.png (a review sheet, not for the site).
import os
import fitz

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
FILES = [os.path.join(ROOT, "set-v2", "vi", "04.png"), os.path.join(ROOT, "set-v2", "vi", "11.png"),
         os.path.join(ROOT, "..", "paws", "set-duo-4", "vi", "one-pebble.png"), os.path.join(ROOT, "..", "paws", "set-duo-4", "vi", "our-secret.png")]


def white_silhouette(path):
    pix = fitz.Pixmap(path)
    if not pix.alpha:
        pix = fitz.Pixmap(pix, 1)
    b = bytearray(pix.samples)
    for i in range(0, len(b), 4):
        b[i] = b[i + 1] = b[i + 2] = 255
        b[i + 3] = 255 if b[i + 3] > 60 else 0   # the faint floor shadow (alpha about 8%) is left out of the border
    return fitz.Pixmap(fitz.csRGB, pix.width, pix.height, bytes(b), 1) if False else _from(b, pix)


def _from(b, pix):
    out = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, pix.width, pix.height), True)
    out.set_rect(out.irect, (255, 255, 255, 0))
    out.samples_mv[:] = bytes(b)
    return out


def die_cut(path, r=7, size=360):
    """The sticker with a white border r px wide round everything that is drawn (a ring of offsets of its white silhouette)."""
    sil = white_silhouette(path)
    d = fitz.open()
    pg = d.new_page(width=size, height=size)
    import math
    for ring in (r, r * 0.55):
        for i in range(36):
            a = i * math.pi / 18
            dx, dy = ring * math.cos(a), ring * math.sin(a)
            pg.insert_image(fitz.Rect(dx, dy, size + dx, size + dy), pixmap=sil)
    pg.insert_image(fitz.Rect(0, 0, size, size), filename=path)
    return pg.get_pixmap(alpha=True, dpi=72)


def main():
    cols = ("transparent, on black chat", "transparent, on dark grey", "flat white square, on black", "white die-cut border, on black", "white die-cut border, on white")
    cell = 170
    d = fitz.open()
    pg = d.new_page(width=cell * len(FILES) + 20, height=cell * len(cols) + 20)
    pg.draw_rect(pg.rect, color=None, fill=(0.85, 0.85, 0.85))
    for ci, name in enumerate(cols):
        for fi, f in enumerate(FILES):
            r = fitz.Rect(10 + fi * cell, 10 + ci * cell, 10 + fi * cell + cell - 6, 10 + ci * cell + cell - 6)
            bg = {0: (0, 0, 0), 1: (0.17, 0.18, 0.19), 2: (0, 0, 0), 3: (0, 0, 0), 4: (1, 1, 1)}[ci]
            pg.draw_rect(r, color=None, fill=bg)
            if ci == 2:
                pg.draw_rect(fitz.Rect(r.x0 + 4, r.y0 + 4, r.x1 - 4, r.y1 - 4), color=None, fill=(1, 1, 1))
            if ci >= 3:
                tmp = os.path.join(HERE, "_dc.png")
                die_cut(f).save(tmp)
                pg.insert_image(r, filename=tmp)
                os.remove(tmp)
            else:
                pg.insert_image(r, filename=f)
        pg.insert_text(fitz.Point(14, 10 + ci * cell + 12), name, fontsize=8, color=(0.7, 0.7, 0.7) if ci != 4 else (0.3, 0.3, 0.3))
    pg.get_pixmap(dpi=100).save(os.path.join(HERE, "bg-test.png"))
    print("ok")


main()
