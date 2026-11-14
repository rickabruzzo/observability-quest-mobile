"""The Honeycomb mark for the hero's hoodie, reduced from the official file — never drawn or generated.

assets/hc_logomark.png is the four hexagons and a small dark 'h'. This takes the hexagons down to a SIZE×SIZE
pixel table in the four brand colours and writes it twice, so the reference generator (tools/hero_gen.py) and
the game (js/engine/hero.js, hero-side.js) agree exactly:

    tools/hc_mark.json      read by hero_gen.py
    js/engine/hc-mark.js    imported by hero-parts.js

Run `python3 tools/hc_mark.py` after the official file changes; tools/tests/test_hc_mark.py checks both
outputs against a fresh reduction.
"""
from PIL import Image
import json, os, sys

SIZE = 9
COVER = 0.4                                          # a cell is in the mark when this much of it is hexagon (0.5 left the hexagons ragged)
HC_MARK = {'blue': '#0298EC', 'green': '#64BA00', 'orange': '#F96E10', 'honey': '#FFB000'}
INK = (37, 48, 62)                                   # the 'h' beside the hexagons: not part of the mark
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_OUT = os.path.join(ROOT, 'tools', 'hc_mark.json')
JS_OUT = os.path.join(ROOT, 'js', 'engine', 'hc-mark.js')


def _rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _nearest(rgb):
    return min(HC_MARK, key=lambda k: sum((a - b) ** 2 for a, b in zip(rgb, _rgb(HC_MARK[k]))))


def reduce_mark(path, size=SIZE):
    """[(x, y, colour_key), ...] row-major: the hexagons of `path` fitted into a size×size box.

    Each source pixel is kept when it is opaque and nearer a brand colour than to the 'h' ink; the kept pixels'
    box is scaled to fit `size` (aspect kept) and each cell takes the colour most of its covered area has,
    when at least COVER of the cell is covered."""
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    keep = {}
    for y in range(h):
        for x in range(w):
            r, g, b, a = im.getpixel((x, y))
            if a < 128: continue
            d_ink = sum((c - i) ** 2 for c, i in zip((r, g, b), INK))
            k = _nearest((r, g, b))
            if sum((c - i) ** 2 for c, i in zip((r, g, b), _rgb(HC_MARK[k]))) < d_ink: keep[(x, y)] = k
    xs = [x for x, _ in keep]; ys = [y for _, y in keep]
    x0, y0, bw, bh = min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
    cell = max(bw, bh) / size                                   # source px per table px; the box fits the table
    cols, rows = round(bw / cell), round(bh / cell)
    out = []
    for cy in range(rows):
        for cx in range(cols):
            sx0, sx1 = x0 + cx * cell, x0 + (cx + 1) * cell
            sy0, sy1 = y0 + cy * cell, y0 + (cy + 1) * cell
            area = {}; covered = 0.0; total = 0.0
            for sy in range(int(sy0), int(sy1 - 1e-9) + 1):
                for sx in range(int(sx0), int(sx1 - 1e-9) + 1):
                    f = max(0.0, min(sx + 1, sx1) - max(sx, sx0)) * max(0.0, min(sy + 1, sy1) - max(sy, sy0))
                    if f <= 0: continue
                    total += f
                    k = keep.get((sx, sy))
                    if k: covered += f; area[k] = area.get(k, 0.0) + f
            if total and covered / total >= COVER: out.append((cx, cy, max(area, key=area.get)))
    return out


def write_outputs(path='assets/hc_logomark.png'):
    px = reduce_mark(os.path.join(ROOT, path), SIZE)
    data = {'source': path, 'size': SIZE, 'colours': HC_MARK, 'pixels': [list(p) for p in px]}
    with open(JSON_OUT, 'w') as f: json.dump(data, f, indent=1); f.write('\n')
    rows = ',\n'.join('  ' + ', '.join(json.dumps(list(p)) for p in px if p[1] == y) for y in sorted({p[1] for p in px}))
    js = ('// The Honeycomb mark on the hero\'s hoodie: %s reduced to %d×%d by tools/hc_mark.py.\n'
          '// GENERATED — do not edit; run `python3 tools/hc_mark.py`. tools/tests/test_hc_mark.py keeps this file,\n'
          '// tools/hc_mark.json and the official file in step. Brand colours; [x, y, colour] row-major.\n'
          'export const HC_MARK = { %s };\n'
          'export const HC_MARK_PIXELS = [\n%s,\n];\n') % (
        path, SIZE, SIZE, ', '.join(f"{k}: '{v}'" for k, v in HC_MARK.items()), rows)
    with open(JS_OUT, 'w') as f: f.write(js)
    return px


if __name__ == '__main__':
    px = write_outputs(*sys.argv[1:2])
    print(f'{len(px)} pixels → {os.path.relpath(JSON_OUT, ROOT)}, {os.path.relpath(JS_OUT, ROOT)}')
