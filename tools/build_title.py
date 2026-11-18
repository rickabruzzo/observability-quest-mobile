#!/usr/bin/env python3
"""The title screen's art: art-drops/2026-11-17-title-screen/ (640x400, Art Claude, brief 07) -> assets/title/ + title.json.

Rick picked picture A, "Before the page": the night sky over the game's city from an open bedroom window, the intro's
pager on its nightstand, not gone off yet. Run from the project root:  python3 tools/build_title.py

The painting is 640x400 and the game's picture is 320x200, so the build carries it down the way the rooms are
(every other pixel, then 192 colours) and keeps what that would lose:

  plate     the painting at game size. Twelve of its stars twinkle; the halving would skip some of them, so each is
            put back at its place in the painting's own colour.
  stars     those twelve, with the brighter colour Art Claude gave each and whether it has a faint cross. The game
            draws a twinkle as a pixel (and four round it), which a halved 1-px star could not be.
  pager     the pager gone off (T_title_light), as a patch of only the pixels the edit changed: the flat lit screen
            in the intro's green and the stepped glow on the nightstand. Transparent everywhere else, so nothing but
            the pager changes when the game shows it.
  wordmark  the letters and their glow at one letter pixel per pixel (194x68). The drop holds them three times that
            size; they come down without loss. The letters are the game's own assets/intro/wall_logo.png.

The wordmark is shown at 1.5 game pixels a letter pixel (three of the painting's), the size Rick approved, so the
game lays it over the picture as its own layer instead of drawing it into the 320x200 canvas.
"""
import functools, json, os, sys
import numpy as np
from PIL import Image

if __package__ in (None, ''): sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.build_intro import downsample, quantise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = 'art-drops/2026-11-17-title-screen', 'assets/title'
COLOURS, PATCH_COLOURS = 192, 64

# From Art Claude's hand-back, measured on the painting. At 640x400:
STARS_640 = [(443, 9), (264, 12), (32, 17), (528, 21), (410, 70), (318, 114), (108, 114), (47, 138), (413, 150), (208, 133), (60, 33), (483, 66)]
LAYER_640 = (-17, 10)               # the wordmark layer's top left as mocked and approved; its letters are three pixels a letter pixel there
# At 320x200:
QUIET = {'x': 20, 'y': 5, 'w': 250, 'h': 73}       # stars only, and one faint band of cloud
FRAME = {'x': 275, 'w': 13}                         # the window's frame: the one hard edge in the sky
SCREEN = {'x': 245, 'y': 128, 'w': 42, 'h': 18}     # the pager's screen
PRINT = {'x': 8, 'w': 182}                          # the bottom rows are dark only left of the nightstand
MARGIN = 8                          # the layers' transparent margin round the letters, in letter pixels (24 in the drop)
SCALE = 1.5                         # game pixels a letter pixel


def _open(name):
    return Image.open(os.path.join(ROOT, SRC, name))


@functools.lru_cache(maxsize=None)
def _small(name):
    """A 640x400 file at 320x200, before any colour is cut."""
    return np.asarray(downsample(_open(name))).astype(np.int32)


@functools.lru_cache(maxsize=None)
def _big(name):
    return np.asarray(_open(name).convert('RGB')).astype(np.int32)


@functools.lru_cache(maxsize=None)
def plate():
    a = _small('T_title.png').copy(); big = _big('T_title.png')
    for X, Y in STARS_640: a[Y // 2, X // 2] = big[Y, X]
    return quantise(Image.fromarray(a.astype(np.uint8), 'RGB'), COLOURS)


def _hex(c):
    return '#%02X%02X%02X' % tuple(int(v) for v in c)


@functools.lru_cache(maxsize=None)
def _stars():
    was, now = _big('T_title.png'), _big('T_title_stars.png')
    out = []
    for X, Y in STARS_640:
        arms = [(X - 1, Y), (X + 1, Y), (X, Y - 1), (X, Y + 1)]
        lit = [p for p in arms if np.abs(now[p[1], p[0]] - was[p[1], p[0]]).sum() > 0]
        s = {'x': X // 2, 'y': Y // 2, 'on': _hex(now[Y, X]), 'cross': len(lit) == 4}
        if s['cross']: s['arm'] = _hex(now[lit[0][1], lit[0][0]])
        out.append(s)
    return out


def stars():
    return [dict(s) for s in _stars()]


@functools.lru_cache(maxsize=None)
def pager():
    """(the patch, its box): RGBA, opaque exactly where T_title_light differs from the painting at game size."""
    was, now = _small('T_title.png'), _small('T_title_light.png')
    changed = np.abs(now - was).sum(axis=2) > 0
    ys, xs = np.where(changed)
    box = {'x': int(xs.min()), 'y': int(ys.min()), 'w': int(xs.max() - xs.min() + 1), 'h': int(ys.max() - ys.min() + 1)}
    cut = (slice(box['y'], box['y'] + box['h']), slice(box['x'], box['x'] + box['w']))
    rgb = np.asarray(quantise(Image.fromarray(now[cut].astype(np.uint8), 'RGB'), PATCH_COLOURS))
    return Image.fromarray(np.dstack([rgb, np.where(changed[cut], 255, 0).astype(np.uint8)]), 'RGBA'), box


@functools.lru_cache(maxsize=None)
def wordmark():
    """(letters, glow) at one letter pixel per pixel. The drop's files are these times three, exactly; anything else
    is a damaged drop and the build stops."""
    out = []
    for name in ('T_wordmark.png', 'T_wordmark_glow.png'):
        big = _open(name).convert('RGBA')
        small = big.resize((big.width // 3, big.height // 3), Image.NEAREST)
        if big.size != (small.width * 3, small.height * 3) or not np.array_equal(np.asarray(small.resize(big.size, Image.NEAREST)), np.asarray(big)):
            raise SystemExit(f'{name}: not a whole three times its letter pixels')
        out.append(small)
    return tuple(out)


def build(out=None):
    out = out or os.path.join(ROOT, OUT)
    os.makedirs(out, exist_ok=True)
    p = plate(); patch, box = pager(); letters, glow = wordmark()
    p.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(out, 'T_title.png'), optimize=True)
    patch.save(os.path.join(out, 'T_pager_lit.png'), optimize=True)
    letters.save(os.path.join(out, 'T_wordmark.png'), optimize=True)
    glow.save(os.path.join(out, 'T_wordmark_glow.png'), optimize=True)
    lx, ly = LAYER_640[0] / 2, LAYER_640[1] / 2
    m = {
        'images': {'plate': 'T_title.png', 'pager': 'T_pager_lit.png', 'wordmark': 'T_wordmark.png', 'glow': 'T_wordmark_glow.png'},
        # where the two wordmark layers go on the 320x200 picture, and the letters inside them
        'layer': {'x': lx, 'y': ly, 'w': letters.width * SCALE, 'h': letters.height * SCALE, 'scale': SCALE},
        'letters': {'x': lx + MARGIN * SCALE, 'y': ly + MARGIN * SCALE, 'w': (letters.width - 2 * MARGIN) * SCALE, 'h': (letters.height - 2 * MARGIN) * SCALE},
        'pager': box, 'screen': SCREEN, 'stars': stars(),
        'quiet': QUIET, 'frame': FRAME, 'print': PRINT,
    }
    for k in ('layer', 'letters'): m[k] = {n: (int(v) if float(v).is_integer() else v) for n, v in m[k].items()}
    with open(os.path.join(out, 'title.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    m = build()
    print('title:', ', '.join(m['images'].values()), '| pager patch', m['pager'], '|', len(m['stars']), 'stars')
