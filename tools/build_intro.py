#!/usr/bin/env python3
"""Build the intro stills: scratch/intro_gen/*.png (640x400, generated) -> assets/intro/*.png (320x200) + intro.json.

Limited animation: the intro cuts between recycled stills, so an edit (arm in, eye open) must be
pixel-identical to its plate everywhere except the change. Generators drift, so edits are snapped
back onto their plate here, and rejected outright when they drift too far to be the same picture.
Missing sources become labelled placeholders so the game can be built before the art exists.
"""
import argparse, json, os, sys
import numpy as np
from PIL import Image, ImageDraw

W, H = 320, 200
PLATES = ['A_room_dark', 'B_nightstand', 'C_face_asleep', 'D_bedroom_vga']
EDITS = {'B_arm': 'B_nightstand', 'B_lamp': 'B_nightstand', 'C_eye_crack': 'C_face_asleep',
         'C_awake': 'C_face_asleep', 'C_misery': 'C_awake'}                 # edit -> the still it is cut against
SOURCES = PLATES + list(EDITS)
# extra edits, in build order: built when delivered, never a placeholder. Each is cut against the first of its
# candidate plates that exists (the door opens on the laptop-less room when there is one).
OPTIONAL = {'D_laptop_gone': ['D_bedroom_vga'], 'D_door_open': ['D_laptop_gone', 'D_bedroom_vga']}
DERIVED = ['C_awake_lit', 'B_lamp_lit']
MAX_DRIFT = 0.5                     # an edit may remove an object and add a hand; past half the frame it is another picture
COLOURS = 32                        # the EGA-style shots
COLOURS_FOR = {'D_bedroom_vga': 192}   # the VGA bedroom keeps its full palette: at 32 a green plant or a yellow lampshade greys out
CHANGE_COLOURS_FOR = {'D_bedroom_vga': 32}   # 192 + two chained edits of 32 still fit one 256-colour file
DEFAULTS = {'wall': {'x': 24, 'y': 14, 'w': 232, 'h': 44}, 'bed': {'x': 60, 'y': 96}, 'stand': {'x': 90}, 'door': {'x': 286}, 'floorY': 176,
            'clothes': {'x': 126, 'y': 184}, 'item': {'x': 200, 'y': 150}, 'doorway': {'x': 272, 'y': 60, 'w': 56, 'h': 116}}
LCD_MIN = (40, 10)                  # anything smaller is a stray green speck, not the pager's LCD
CHANGE_COLOURS = 16
LCD_FALLBACK = (92, 62, 136, 36)
OVERRIDES = 'intro.overrides.json'
LOGO_SRC = 'assets/title_screen.png'   # the app's Observability Quest wordmark lives on the v0.1 title screen
LOGO_BOX = (60, 172, 590, 318)         # the wordmark on that 640x428 picture, clear of the gold rule below it
LOGO_MAX_W = 190
LOGO_OUTLINE = (8, 14, 40, 255)

_PH_BG = {'A': (14, 14, 26), 'B': (30, 30, 36), 'C': (52, 40, 44), 'D': (40, 44, 70)}
_PH_CHANGE = {'B_arm': (176, 60, 304, 150), 'B_lamp': (24, 20, 80, 110), 'C_eye_crack': (110, 80, 210, 96),
              'C_awake': (110, 70, 210, 104), 'C_misery': (120, 124, 200, 150)}
_PH_TINT = {'B_arm': (200, 150, 120), 'B_lamp': (150, 140, 90), 'C_eye_crack': (20, 20, 24),
            'C_awake': (230, 230, 230), 'C_misery': (120, 60, 60)}


def downsample(img):
    """640x400 (or anything 16:10) -> 320x200, nearest: the art is already pixel art at 2x. Transparency goes to black."""
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGBA'); bg = Image.new('RGBA', img.size, (0, 0, 0, 255)); img = Image.alpha_composite(bg, img)
    img = img.convert('RGB')
    return img if img.size == (W, H) else img.resize((W, H), Image.NEAREST)


def quantise(img, colours=COLOURS):
    """Median cut. Past 64 colours, in two passes: median cut spends its palette on the big areas and averages
    the small bright things (a green plant, a yellow lampshade) into the browns around them, so a quarter of the
    palette is held back and handed out, one colour at a time, to whichever pixel is still furthest off."""
    img = img.convert('RGB')
    if colours <= 64: return img.quantize(colours, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    spare = colours // 4
    first = img.quantize(colours - spare, method=Image.MEDIANCUT, dither=Image.NONE)
    a = np.asarray(img).astype(np.int32); flat = a.reshape(-1, 3)
    pal = np.asarray(first.getpalette()[:(colours - spare) * 3], np.int32).reshape(-1, 3)
    idx = np.concatenate([((flat[i:i + 8000, None, :] - pal[None]) ** 2).sum(axis=2).argmin(axis=1) for i in range(0, len(flat), 8000)])
    dist = ((flat - pal[idx]) ** 2).sum(axis=1)
    for _ in range(spare):                          # each spare colour goes to the pixel that is furthest from its nearest
        worst = int(dist.argmax())
        if dist[worst] <= 3 * 8 * 8: break
        pal = np.vstack([pal, flat[worst]])
        d = ((flat - flat[worst]) ** 2).sum(axis=1); closer = d < dist
        idx[closer] = len(pal) - 1; dist[closer] = d[closer]
    return Image.fromarray(pal[idx].reshape(a.shape).astype(np.uint8), 'RGB')


MIN_CHANGE = 12                     # px: a changed patch smaller than this, away from any real change, is generator noise
WEAK_TOL = 10                       # near a real change, differences this small still belong to it (soft edges, dark-on-dark)


def _dilate(mask, r):
    out = mask.copy()
    for _ in range(r):
        p = np.pad(out, 1)
        out = p[1:-1, 1:-1] | p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]
    return out


def _erode(mask, r):
    return ~_dilate(~mask, r)


def _components(mask):
    """8-connected components as lists of (y, x)."""
    seen = np.zeros_like(mask); out = []
    hh, ww = mask.shape
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]: continue
        stack, comp = [(int(sy), int(sx))], []
        seen[sy, sx] = True
        while stack:
            y, x = stack.pop(); comp.append((y, x))
            for ny in (y - 1, y, y + 1):
                for nx in (x - 1, x, x + 1):
                    if 0 <= ny < hh and 0 <= nx < ww and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
        out.append(comp)
    return out


def _fill_holes(mask):
    """Everything not reachable from the frame edge through unchanged pixels counts as changed."""
    outside = np.zeros_like(mask); hh, ww = mask.shape
    stack = [(y, x) for y in range(hh) for x in (0, ww - 1) if not mask[y, x]] + [(y, x) for x in range(ww) for y in (0, hh - 1) if not mask[y, x]]
    for y, x in stack: outside[y, x] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < hh and 0 <= nx < ww and not mask[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True; stack.append((ny, nx))
    return ~outside


def clean_change(d, tol=24):
    """The change an artist meant, from a noisy per-pixel difference `d` (generators redraw the whole
    frame, so faint differences are everywhere). A real change has a core that differs a lot; take the
    cores, what differs around them, close and fill the result (a removed dark object otherwise leaves a
    ghost), and include its soft edges. Everything else is noise and stays the plate's."""
    core = np.zeros(d.shape, bool)
    for comp in _components(d > 2 * tol):
        if len(comp) >= MIN_CHANGE:
            ys, xs = zip(*comp); core[list(ys), list(xs)] = True
    if not core.any(): return core
    mask = (d > tol) & _dilate(core, 6)
    mask = _fill_holes(_erode(_dilate(np.pad(mask, 4), 3), 3)[4:-4, 4:-4] | mask)
    return mask | ((d > WEAK_TOL) & _dilate(mask, 1))


def snap_to_plate(edit, plate, tol=24, base=None):
    """Keep only what the edit changed. Pixels outside the (cleaned) change take the pixel from `base`
    (the finished plate; defaults to `plate`). Returns (image, fraction of pixels that changed)."""
    e = np.asarray(edit.convert('RGB')).astype(np.int16)
    p = np.asarray(plate.convert('RGB')).astype(np.int16)
    changed = clean_change(np.abs(e - p).max(axis=2), tol)
    out = np.asarray((base or plate).convert('RGB')).copy()
    out[changed] = e[changed].astype(np.uint8)
    return Image.fromarray(out, 'RGB'), float(changed.mean())


def find_lcd(img):
    """Bounding box of the largest connected green region, inset 2px. None when there is none big enough.
    Works on a 3x3 box blur so a dithered LCD is one region, and takes olive as well as bright green."""
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    pad = np.pad(a, ((1, 1), (1, 1), (0, 0)), mode='edge')
    a = sum(pad[dy:dy + a.shape[0], dx:dx + a.shape[1]] for dy in range(3) for dx in range(3)) / 9
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (g > 110) & (g > r + 12) & (g > b + 30)
    seen = np.zeros_like(mask)
    best, best_n = None, 0
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]: continue
        stack, n = [(sy, sx)], 0
        seen[sy, sx] = True
        x0 = x1 = sx; y0 = y1 = sy
        while stack:
            y, x = stack.pop(); n += 1
            x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; stack.append((ny, nx))
        if n > best_n: best, best_n = (x0, y0, x1, y1), n
    if not best: return None
    x0, y0, x1, y1 = (int(v) for v in best)
    w, h = x1 - x0 + 1 - 4, y1 - y0 + 1 - 4
    return (x0 + 2, y0 + 2, w, h) if w >= LCD_MIN[0] and h >= LCD_MIN[1] else None


def placeholder(name, base=None):
    """Flat labelled stand-in. Edits are their plate (`base` when the real one exists) plus one changed block."""
    if name in EDITS:
        im = base.copy() if base is not None else placeholder(EDITS[name])
        d = ImageDraw.Draw(im)
        x0, y0, x1, y1 = _PH_CHANGE[name]
        d.rectangle((x0, y0, x1 - 1, y1 - 1), fill=_PH_TINT[name])
        d.text((x0 + 3, y0 + 2), name, fill=(255, 255, 255) if sum(_PH_TINT[name]) < 380 else (0, 0, 0))
        return im
    im = Image.new('RGB', (W, H), _PH_BG[name[0]])
    d = ImageDraw.Draw(im)
    if name[0] == 'B':
        x, y, w, h = LCD_FALLBACK
        d.rectangle((x - 2, y - 2, x + w + 1, y + h + 1), fill=(120, 220, 90))
    if name[0] == 'D':
        wl = DEFAULTS['wall']
        d.rectangle((wl['x'], wl['y'], wl['x'] + wl['w'] - 1, wl['y'] + wl['h'] - 1), fill=(150, 150, 170))
        d.rectangle((0, DEFAULTS['floorY'], W - 1, H - 1), fill=(70, 52, 40))
    d.text((6, H - 14), f'PLACEHOLDER {name}', fill=(200, 200, 210))
    return im


def _runs(flags):
    out, start = [], None
    for i, f in enumerate(list(flags) + [False]):
        if f and start is None: start = i
        elif not f and start is not None: out.append((start, i - 1)); start = None
    return out


def _append_numeral(art, letters):
    """OBSERVABILITY QUEST -> OBSERVABILITY QUEST I: the wordmark's own letter I (from OBSERVABILITY), enlarged
    to QUEST's height and set a word-space after the T. Returns (art, letters) unchanged if it cannot be found."""
    rows = letters.sum(axis=1); ys = np.nonzero(rows)[0]
    y0, y1 = int(ys.min()), int(ys.max())
    lo, hi = y0 + (y1 - y0) * 3 // 10, y0 + (y1 - y0) * 7 // 10
    split = lo + int(np.argmin(rows[lo:hi + 1]))                       # the thinnest row between the two lines
    top = np.nonzero(letters[:split].any(axis=1))[0]; bot = np.nonzero(letters[split:].any(axis=1))[0] + split
    if not len(top) or not len(bot): return art, letters
    t0, t1, b0, b1 = int(top.min()), int(top.max()), int(bot.min()), int(bot.max())
    band = letters[t0:t1 + 1]
    # letters touch through their outlines, so find the I by its bright face: the one narrow, lone upright
    face = (art[t0:t1 + 1, :, 2].astype(int) > 200) & (art[t0:t1 + 1, :, 1].astype(int) > 120) & band
    eyes = [(a, b) for a, b in _runs(face.any(axis=0)) if 10 <= b - a + 1 <= 30]
    if not eyes: return art, letters
    a, b = eyes[-1]; a, b = max(0, a - 1), min(letters.shape[1] - 1, b + 1)     # with its outline
    scale = (b1 - b0 + 1) / (t1 - t0 + 1)
    gw, gh = max(1, round((b - a + 1) * scale)), b1 - b0 + 1
    glyph = Image.fromarray(art[t0:t1 + 1, a:b + 1], 'RGB').resize((gw, gh), Image.LANCZOS)
    gmask = Image.fromarray((band[:, a:b + 1] * 255).astype(np.uint8), 'L').resize((gw, gh), Image.NEAREST)
    qx1 = int(np.nonzero(letters[b0:b1 + 1].any(axis=0))[0].max())
    x = qx1 + 1 + round((b - a + 1) * 0.7)                              # a word space
    if x + gw > letters.shape[1]: return art, letters
    art = art.copy(); letters = letters.copy(); m = np.asarray(gmask) > 127
    art[b0:b1 + 1, x:x + gw][m] = np.asarray(glyph)[m]; letters[b0:b1 + 1, x:x + gw] |= m
    return art, letters


def wall_logo(src=LOGO_SRC, width=LOGO_MAX_W, height=None, numeral=True):
    """The Observability Quest wordmark alone — letters cut out of the title screen, without its starscape,
    glow, rule or blue panel — sized for the bedroom wall, hard-edged, with a 1px dark outline. None if absent."""
    if not os.path.exists(src): return None
    c = Image.open(src).convert('RGB').crop(LOGO_BOX)
    a = np.asarray(c).astype(np.int16)
    edge = (a[..., 2] > 150) & (a[..., 1] > 90)                           # the letters' bright rims
    keep = np.zeros_like(edge)
    for comp in _components(edge):
        if len(comp) >= 60: ys, xs = zip(*comp); keep[list(ys), list(xs)] = True   # stars are specks; letters are not
    letters = _erode(_fill_holes(_dilate(keep, 1)), 1) | keep
    ys, xs = np.nonzero(letters)
    if not len(ys): return None
    art = np.asarray(c).copy()
    if numeral: art, letters = _append_numeral(art, letters)
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    rgba = Image.fromarray(np.dstack([art, (letters * 255).astype(np.uint8)]), 'RGBA').crop(box)
    w = max(8, min(width, rgba.width))
    if height: w = max(8, min(w, int(height * rgba.width / rgba.height)))   # fit the wall's height too
    h = max(1, round(rgba.height * w / rgba.width))
    small = np.asarray(rgba.resize((w, h), Image.LANCZOS)).copy()
    solid = small[..., 3] > 110
    rgb = np.asarray(quantise(Image.fromarray(small[..., :3], 'RGB'), 24))
    out = np.zeros((h + 2, w + 2, 4), np.uint8)
    out[_dilate(np.pad(solid, 1), 1)] = LOGO_OUTLINE
    inner = out[1:-1, 1:-1]; inner[solid] = np.dstack([rgb, np.full((h, w), 255, np.uint8)])[solid]
    return Image.fromarray(out, 'RGBA')


def lit_green(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    a[..., 0] *= 0.9; a[..., 1] *= 1.35; a[..., 2] *= 0.9
    return quantise(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'))


def lit_warm(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    a[..., 0] = a[..., 0] * 1.5 + 40; a[..., 1] = a[..., 1] * 1.35 + 30; a[..., 2] = a[..., 2] + 5
    return quantise(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'))


def build(src, out, placeholders=False, logo_src=LOGO_SRC):
    os.makedirs(out, exist_ok=True)

    def have(n):
        return not placeholders and os.path.exists(os.path.join(src, f'{n}.png'))

    def real(n):                                    # an edit is only real when the still it is cut against is too
        return have(n) and (n not in EDITS or real(EDITS[n]))

    def warn(msg): print(f'build_intro: {msg}', file=sys.stderr)

    if not placeholders and os.path.isdir(src):
        known = {f'{n}.png' for n in SOURCES} | {f'{n}.png' for n in OPTIONAL} | {OVERRIDES}
        for f in sorted(os.listdir(src)):
            if f not in known and not f.startswith('.'):
                warn(f'{f} is not one of the expected files and is ignored (names are case-sensitive, .png only)')

    raw, done, fake = {}, {}, []
    for n in SOURCES:
        if real(n):
            im = Image.open(os.path.join(src, f'{n}.png'))
            if im.width * H != im.height * W:
                raise SystemExit(f'build_intro: {n}.png is {im.width}x{im.height}; it must be 16:10 (640x400). '
                                 'Crop or re-export it — a stretched edit will not line up with its plate.')
            raw[n] = downsample(im)
        else:
            if have(n): warn(f'{n} ignored — its plate {EDITS[n]} is missing')
            fake.append(n)
    for n in PLATES:
        if n in fake: raw[n] = placeholder(n)
        done[n] = quantise(raw[n], COLOURS_FOR.get(n, COLOURS))
    refs = {n: raw[n] for n in PLATES}
    root = {n: n for n in PLATES}                   # which plate each still descends from
    def make_edit(n, plate):
        root[n] = root.get(plate, plate)
        # compare in the generator's own colours (refs[]), but take unchanged pixels from the finished plate
        refs[n] = snap_to_plate(raw[n], refs[plate])[0]
        img, frac = snap_to_plate(raw[n], refs[plate], base=done[plate])
        if frac > MAX_DRIFT:
            raise SystemExit(f'build_intro: {n}.png differs from {plate} over {frac:.0%} of the frame (limit {MAX_DRIFT:.0%}). '
                             f'It must be the same picture with one change — regenerate it as an edit of {plate}.')
        a = np.asarray(img).copy(); diff = (a != np.asarray(done[plate])).any(axis=2)
        if diff.any():                              # the change gets its own small palette, so a tiny edit keeps its colours
            ys, xs = np.nonzero(diff)
            strip = Image.fromarray(a[diff].reshape(1, -1, 3), 'RGB')
            a[diff] = np.asarray(quantise(strip, CHANGE_COLOURS_FOR.get(root[n], CHANGE_COLOURS))).reshape(-1, 3)
            print(f'  {n}: {frac:.1%} of the frame changed, x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}')
        done[n] = Image.fromarray(a, 'RGB')

    for n, plate in EDITS.items():                  # dict order: C_awake before C_misery
        if n in fake:                               # stand-in drawn on the finished still it is cut against
            done[n] = placeholder(n, base=done[plate]); refs[n] = placeholder(n, base=refs[plate])
        else: make_edit(n, plate)
    for n, plates in OPTIONAL.items():
        path = os.path.join(src, f'{n}.png')
        plate = next((p for p in plates if p in done and p not in fake), None)
        if placeholders or plate is None or not os.path.exists(path):
            if os.path.exists(os.path.join(out, f'{n}.png')): os.remove(os.path.join(out, f'{n}.png'))
            continue
        im = Image.open(path)
        if im.width * H != im.height * W: raise SystemExit(f'build_intro: {n}.png is {im.width}x{im.height}; it must be 16:10 (640x400).')
        raw[n] = downsample(im); make_edit(n, plate)
    if fake and not placeholders: warn('placeholders used for: ' + ', '.join(fake))
    done['C_awake_lit'] = lit_green(done['C_awake'])
    done['B_lamp_lit'] = lit_warm(done['B_lamp'])

    images = {}
    for n, im in done.items():
        images[n] = f'{n}.png'
        exact = len(im.convert('RGB').getcolors(1 << 20) or []) <= 256     # a palette file only when it loses nothing:
        (im.convert('P', palette=Image.ADAPTIVE, colors=256) if exact else im.convert('RGB')).save(os.path.join(out, images[n]), optimize=True)   # a requantised edit would stop matching its plate

    lcd = find_lcd(done['B_nightstand'])
    if not lcd:
        print('build_intro: no green LCD found in B_nightstand; using the default box '
              f'(set "lcd" in {OVERRIDES} to place it)', file=sys.stderr)
        lcd, found = LCD_FALLBACK, False
    else: found = True
    m = {'size': [W, H], 'images': images, 'lcd': dict(zip('xywh', lcd)), **json.loads(json.dumps(DEFAULTS)),
         'lcdFound': found, 'placeholder': bool(fake)}
    ov = os.path.join(src, OVERRIDES)
    if os.path.exists(ov):
        for k, v in json.load(open(ov)).items():
            if k in ('lcd', 'wall', 'bed', 'stand', 'door', 'clothes', 'item', 'doorway') and isinstance(v, dict): m[k] = {**m[k], **v}
            elif k == 'floorY' and isinstance(v, (int, float)): m[k] = v
            else: warn(f'{OVERRIDES}: "{k}" ignored (expected lcd, wall, bed, stand, door, clothes, item, doorway as objects, or floorY as a number)')
    m['door'].setdefault('y', m['floorY'])           # the row the hero's feet reach at the door; the floor line unless set
    # the title: the wordmark at the top of the wall, a line of text under it (placed after overrides moved the wall)
    wl = m['wall']
    logo = wall_logo(logo_src, max(8, min(LOGO_MAX_W, int(wl['w']) - 10) - 2), max(8, int(wl['h']) - 28))   # 6 above, 2 + a 16px text line + 2 below
    if logo is not None:
        m['images']['wall_logo'] = 'wall_logo.png'
        logo.save(os.path.join(out, 'wall_logo.png'), optimize=True)
        lg = {'x': int(wl['x'] + (wl['w'] - logo.width) // 2), 'y': int(wl['y'] + 6), 'w': logo.width, 'h': logo.height}
        m['logo'] = lg
        top = lg['y'] + lg['h'] + 2
        m['subtitle'] = {'x': int(wl['x']), 'y': top, 'w': int(wl['w']), 'h': max(0, min(16, int(wl['y'] + wl['h']) - top))}
    elif os.path.exists(os.path.join(out, 'wall_logo.png')):
        os.remove(os.path.join(out, 'wall_logo.png'))
    json.dump(m, open(os.path.join(out, 'intro.json'), 'w'), indent=1)
    return m


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--src', default='scratch/intro_gen')
    ap.add_argument('--out', default='assets/intro')
    ap.add_argument('--placeholders', action='store_true', help='ignore sources; draw every still as a placeholder')
    a = ap.parse_args()
    man = build(a.src, a.out, a.placeholders)
    size = sum(os.path.getsize(os.path.join(a.out, f)) for f in os.listdir(a.out))
    print(f"intro: {len(man['images'])} stills, {size // 1024} KB, lcd {man['lcd']}{'' if man['lcdFound'] else ' (FALLBACK — not found)'}, "
          f"{'PLACEHOLDERS' if man['placeholder'] else 'real art'}")
