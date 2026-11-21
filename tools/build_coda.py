#!/usr/bin/env python3
"""The sunrise coda's pictures: art-drops/2026-11-19-the-sunrise/ (Art Claude, brief 09) -> assets/coda/ + coda.json.
Run from the project root:  python3 tools/build_coda.py

The ending (spec: Final): after Charity's verdict the building's door opens, the hero walks out onto the pavement
and stops, the sun comes up beside them while the street lightens, and the sunglasses go on. Rick, 2026-11-18:
"the sunrise animation and play more screen can be built." He picked the street ("right for ending. building looks
more like an office") and, on a mock that drew the whole sun over the ground: "that's not how the sun works in
regards to horizons." The sun is clipped at the horizon: the game draws it only inside `sky`.

  frames   the street at dawn, four whole pictures, each lighter than the last; the game cuts from one to the next.
           Art Claude painted one, the last: just after sunrise. The three before it are that painting recoloured
           here (darker, cooler, less colour), so they are the same picture pixel for pixel and nothing in the
           street moves when the light changes.
  door     the door standing open, as a patch of only the pixels the edit changed, in the first picture's light:
           the door opens before the sun is up.
  sun      Art Claude's stepped disc (drawn in code, as the title's glow was) at game size.

The layout is the hand-back's measurements. The game reads every number from coda.json.
"""
import functools, json, os, sys
import numpy as np
from PIL import Image

if __package__ in (None, ''): sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.build_intro import downsample, quantise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = 'art-drops/2026-11-19-the-sunrise'
OUT = 'assets/coda'
COLOURS, PATCH_COLOURS = 192, 64

# The layout, in the game's 320x200 pixels: Art Claude's hand-back, measured on the painting.
HORIZON_Y = 115                                      # the first row of ground; the sky ends at 114
FLOOR_Y = 186                                        # the pavement row his feet walk along
HERO_SCALE = 0.8                                     # he is 109 tall: the doorway, drawn in perspective, is 121 where he stands
DOOR_EDIT = {'x': 4, 'y': 44, 'w': 77, 'h': 140}     # E_dawn_door differs from E_dawn only inside this
DOORWAY = {'x': 34, 'y': 171}                        # the middle of his feet on the threshold, in the open doorway
STAND = {'x': 132}                                   # where he stops, as Art Claude mocked it for Rick
SKY = {'x': 123, 'y': 0, 'w': 175, 'h': HORIZON_Y}   # the clear stretch: nothing but sky above the horizon, x 123 to 297
SUN = {'x': 205, 'y0': HORIZON_Y, 'y1': HORIZON_Y - 40, 'w': 40, 'h': 40}   # centre x 225; from wholly below the horizon to resting on it
WINDOW_BOTTOM = 64                                   # the narration ends above this row: his head starts at 77, the sun stops at 75

# How the three earlier pictures are made from the painting: (brightness, how much of its colour is kept, a tint).
# Before dawn is dark, cool and nearly colourless; each step lets more of the painting's own light and colour in.
GRADES = [
    (0.50, 0.45, (0.74, 0.84, 1.30)),
    (0.66, 0.70, (0.90, 0.88, 1.16)),
    (0.84, 0.90, (1.00, 0.95, 1.05)),
]


def _open(name):
    return Image.open(os.path.join(ROOT, SRC, name))


@functools.lru_cache(maxsize=None)
def _small(name):
    """A 640x400 painting at 320x200, before any colour is cut."""
    return np.asarray(downsample(_open(name))).astype(np.float64)


def grade(a, k):
    """The picture `a` (h, w, 3) in the light of frame k: 0, 1 and 2 are GRADES; 3 is the painting itself."""
    if k >= len(GRADES): return a
    bright, colour, tint = GRADES[k]
    grey = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
    return np.clip((grey + colour * (a - grey)) * bright * np.array(tint), 0, 255)


def _rgb(a):
    return Image.fromarray(np.rint(a).astype(np.uint8), 'RGB')


@functools.lru_cache(maxsize=None)
def frames():
    return tuple(quantise(_rgb(grade(_small('E_dawn.png'), k)), COLOURS) for k in range(4))


@functools.lru_cache(maxsize=None)
def door():
    """(the patch, its box): RGBA, opaque exactly where the open door differs from the shut one, in frame 0's light."""
    shut, opened = _small('E_dawn.png'), _small('E_dawn_door.png')
    changed = np.abs(opened - shut).sum(axis=2) > 0
    ys, xs = np.where(changed)
    box = {'x': int(xs.min()), 'y': int(ys.min()), 'w': int(xs.max() - xs.min() + 1), 'h': int(ys.max() - ys.min() + 1)}
    e = DOOR_EDIT
    if not (e['x'] <= box['x'] and box['x'] + box['w'] <= e['x'] + e['w'] and e['y'] <= box['y'] and box['y'] + box['h'] <= e['y'] + e['h']):
        raise SystemExit(f'the door edit reaches outside the hand-back\'s region: {box}')
    cut = (slice(box['y'], box['y'] + box['h']), slice(box['x'], box['x'] + box['w']))
    rgb = np.asarray(quantise(_rgb(grade(opened[cut], 0)), PATCH_COLOURS))
    return Image.fromarray(np.dstack([rgb, np.where(changed[cut], 255, 0).astype(np.uint8)]), 'RGBA'), box


@functools.lru_cache(maxsize=None)
def sun():
    big = _open('E_sun.png').convert('RGBA')
    if big.size != (SUN['w'] * 2, SUN['h'] * 2): raise SystemExit(f'E_sun.png is {big.size}, not twice {SUN["w"]}x{SUN["h"]}')
    a = np.asarray(big.resize((SUN['w'], SUN['h']), Image.NEAREST)).copy()
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)          # hard edged
    return Image.fromarray(a, 'RGBA')


def build(out=None):
    out = out or os.path.join(ROOT, OUT)
    os.makedirs(out, exist_ok=True)
    names = []
    for k, f in enumerate(frames()):
        n = f'E_dawn_{k}.png'; names.append(n)
        f.convert('P', palette=Image.ADAPTIVE, colors=256).save(os.path.join(out, n), optimize=True)
    patch, box = door()
    patch.save(os.path.join(out, 'E_door_open.png'), optimize=True)
    sun().save(os.path.join(out, 'E_sun.png'), optimize=True)
    m = {
        'placeholder': False,
        'images': {'frames': names, 'door': 'E_door_open.png', 'sun': 'E_sun.png'},
        'floorY': FLOOR_Y, 'heroScale': HERO_SCALE,
        'door': box, 'doorway': DOORWAY, 'stand': STAND, 'sun': SUN, 'sky': SKY, 'windowBottom': WINDOW_BOTTOM,
    }
    with open(os.path.join(out, 'coda.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    m = build()
    print('coda:', ', '.join(m['images']['frames']), '|', m['images']['door'], m['door'], '|', m['images']['sun'])
