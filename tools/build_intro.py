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
DERIVED = ['C_awake_lit', 'B_lamp_lit']
MAX_DRIFT = 0.35
COLOURS = 32
DEFAULTS = {'wall': {'x': 24, 'y': 14, 'w': 232, 'h': 44}, 'bed': {'x': 60, 'y': 96}, 'door': {'x': 286}, 'floorY': 176}
LCD_FALLBACK = (92, 62, 136, 36)
OVERRIDES = 'intro.overrides.json'

_PH_BG = {'A': (14, 14, 26), 'B': (30, 30, 36), 'C': (52, 40, 44), 'D': (40, 44, 70)}
_PH_CHANGE = {'B_arm': (176, 60, 304, 150), 'B_lamp': (24, 20, 80, 110), 'C_eye_crack': (110, 80, 210, 96),
              'C_awake': (110, 70, 210, 104), 'C_misery': (120, 124, 200, 150)}
_PH_TINT = {'B_arm': (200, 150, 120), 'B_lamp': (150, 140, 90), 'C_eye_crack': (20, 20, 24),
            'C_awake': (230, 230, 230), 'C_misery': (120, 60, 60)}


def downsample(img):
    """640x400 (or anything) -> 320x200, nearest: the art is already pixel art at 2x."""
    img = img.convert('RGB')
    return img if img.size == (W, H) else img.resize((W, H), Image.NEAREST)


def quantise(img, colours=COLOURS):
    return img.convert('RGB').quantize(colours, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')


def snap_to_plate(edit, plate, tol=24, base=None):
    """Keep only what the edit changed. Pixels within `tol` per channel of the plate take the pixel from
    `base` (the finished plate; defaults to `plate`). Returns (image, fraction of pixels that changed)."""
    e = np.asarray(edit.convert('RGB')).astype(np.int16)
    p = np.asarray(plate.convert('RGB')).astype(np.int16)
    changed = (np.abs(e - p) > tol).any(axis=2)
    out = np.asarray((base or plate).convert('RGB')).copy()
    out[changed] = e[changed].astype(np.uint8)
    return Image.fromarray(out, 'RGB'), float(changed.mean())


def find_lcd(img):
    """Bounding box of the largest connected bright-green region, inset 2px. None when there is none."""
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (g > 150) & (g > r + 40) & (g > b + 40)
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
    return (x0 + 2, y0 + 2, w, h) if w > 0 and h > 0 else None


def placeholder(name):
    """Flat labelled stand-in. Edits are their plate plus one changed block, so they survive snapping."""
    if name in EDITS:
        im = placeholder(EDITS[name])
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


def lit_green(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    a[..., 0] *= 0.9; a[..., 1] *= 1.35; a[..., 2] *= 0.9
    return quantise(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'))


def lit_warm(img):
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    a[..., 0] = a[..., 0] * 1.5 + 40; a[..., 1] = a[..., 1] * 1.35 + 30; a[..., 2] = a[..., 2] + 5
    return quantise(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'))


def build(src, out, placeholders=False):
    os.makedirs(out, exist_ok=True)

    def have(n):
        return not placeholders and os.path.exists(os.path.join(src, f'{n}.png'))

    def real(n):                                    # an edit is only real when the still it is cut against is too
        return have(n) and (n not in EDITS or real(EDITS[n]))

    raw, done, fake = {}, {}, []
    for n in SOURCES:
        if real(n):
            raw[n] = downsample(Image.open(os.path.join(src, f'{n}.png')))
        else:
            if have(n): print(f'build_intro: {n} ignored — its plate {EDITS[n]} is missing', file=sys.stderr)
            raw[n] = placeholder(n); fake.append(n)
    for n in PLATES:
        done[n] = quantise(raw[n])
    refs = {n: raw[n] for n in PLATES}
    for n, plate in EDITS.items():                  # dict order: C_awake before C_misery
        # compare in the generator's own colours (refs[]), but take unchanged pixels from the finished plate
        src_img = quantise(raw[n]) if n in fake else raw[n]
        refs[n] = snap_to_plate(src_img, refs[plate])[0]
        img, frac = snap_to_plate(src_img, refs[plate], base=done[plate])
        if frac > MAX_DRIFT:
            raise SystemExit(f'build_intro: {n}.png differs from {plate} over {frac:.0%} of the frame (limit {MAX_DRIFT:.0%}). '
                             f'It must be the same picture with one change — regenerate it as an edit of {plate}.')
        if n not in fake:                           # limit the colours the change itself brought in
            q = np.asarray(quantise(img)); a = np.asarray(img).copy(); b = np.asarray(done[plate])
            diff = (a != b).any(axis=2); a[diff] = q[diff]; img = Image.fromarray(a, 'RGB')
        done[n] = img
    done['C_awake_lit'] = lit_green(done['C_awake'])
    done['B_lamp_lit'] = lit_warm(done['B_lamp'])

    images = {}
    for n, im in done.items():
        images[n] = f'{n}.png'
        im.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(out, images[n]), optimize=True)

    lcd = find_lcd(done['B_nightstand'])
    if not lcd:
        print('build_intro: no green LCD found in B_nightstand; using the default box '
              f'(set "lcd" in {OVERRIDES} to place it)', file=sys.stderr)
        lcd = LCD_FALLBACK
    m = {'size': [W, H], 'images': images, 'lcd': dict(zip('xywh', lcd)), **json.loads(json.dumps(DEFAULTS)),
         'placeholder': bool(fake)}
    ov = os.path.join(src, OVERRIDES)
    if os.path.exists(ov):
        for k, v in json.load(open(ov)).items():
            if k in ('lcd', 'wall', 'bed', 'door'): m[k] = {**m[k], **v}
            elif k == 'floorY': m[k] = v
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
    print(f"intro: {len(man['images'])} stills, {size // 1024} KB, lcd {man['lcd']}, "
          f"{'PLACEHOLDERS' if man['placeholder'] else 'real art'}")
