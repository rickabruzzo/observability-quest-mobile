"""The Home Screen icons: the official Honeycomb mark on black, never drawn or generated.

A phone asks for an icon when the game is added to its Home Screen (iPhone: 180×180; the web app manifest:
192×192 and 512×512). This takes the four hexagons of assets/hc_logomark.png as the file has them (the small
dark 'h' of the wordmark is left out, the way tools/hc_mark.py leaves it out of the hoodie's mark), enlarges
them by a whole number, so every pixel is one of the file's own, and centres them on black with at least a
tenth of the icon clear on every side.

    python3 tools/build_icons.py        writes assets/icons/icon-180.png, icon-192.png, icon-512.png

To use a larger official export, replace assets/hc_logomark.png and run this again (and tools/hc_mark.py).
"""
from PIL import Image
import os, sys

if __package__ in (None, ''):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools import hc_mark

SIZES = (180, 192, 512)
BACKGROUND = (0, 0, 0)
FILL = 0.8                                             # the mark's longer side is at most this much of the icon
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFFICIAL = os.path.join(ROOT, 'assets', 'hc_logomark.png')
OUT = os.path.join(ROOT, 'assets', 'icons')


def _dist(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b))


def hexagons(path=OFFICIAL):
    """The official file with the 'h' made transparent, cropped to the hexagons: RGBA, the file's own pixels."""
    im = Image.open(path).convert('RGBA')
    brand = [hc_mark._rgb(h) for h in hc_mark.HC_MARK.values()]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and min(_dist((r, g, b), c) for c in brand) >= _dist((r, g, b), hc_mark.INK):
                px[x, y] = (0, 0, 0, 0)
    return im.crop(im.getchannel('A').getbbox())


def scale_for(size, mark_size):
    """The largest whole number that keeps the mark's longer side within FILL of the icon."""
    return max(1, int(size * FILL) // max(mark_size))


def icon(path=OFFICIAL, size=512):
    mark = hexagons(path)
    k = scale_for(size, mark.size)
    big = mark.resize((mark.width * k, mark.height * k), Image.NEAREST)
    out = Image.new('RGBA', (size, size), BACKGROUND + (255,))
    out.alpha_composite(big, ((size - big.width) // 2, (size - big.height) // 2))
    return out.convert('RGB')


def write_outputs(path=OFFICIAL, out=OUT):
    os.makedirs(out, exist_ok=True)
    written = []
    for size in SIZES:
        p = os.path.join(out, f'icon-{size}.png')
        icon(path, size).save(p, optimize=True)
        written.append(p)
    return written


if __name__ == '__main__':
    for p in write_outputs():
        print(os.path.relpath(p, ROOT), os.path.getsize(p), 'bytes')
