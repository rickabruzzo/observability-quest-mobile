#!/usr/bin/env python3
"""The sunrise coda's pictures: -> assets/coda/ + coda.json. Run from the project root:  python3 tools/build_coda.py

The ending (spec: Final): after Charity's verdict the hero walks out of the building into the dawn, the sun comes
up, and the sunglasses go on. Rick, 2026-11-18: "the sunrise animation and play more screen can be built."

**Until art brief 09's painting is delivered (SRC is None) every picture here is a labelled stand-in**: flat
blocks drawn to the layout below, with STAND-IN written on them. They are not the game's art and are not meant
to be judged as art; they exist so the ending can be built and tested now. When the drop lands, SRC names it,
the layout numbers become the ones in Art Claude's hand-back, and the game does not change: it reads everything
from coda.json.

  frames   the street at dawn, four whole pictures, each lighter than the last; the game cuts from one to the next
  door     the building's door standing open, a patch the size of the doorway
  sun      the sun, hard edged, on a clear ground; the game slides it up from behind the horizon inside `sky`
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = None                          # the art drop, when there is one: 'art-drops/<date>-the-sunrise'
OUT = 'assets/coda'
W, H = 320, 200

# The layout, in the game's 320x200 pixels. Art brief 09 asks for a painting that fits it; the hand-back's
# measurements replace these numbers.
FLOOR_Y = 186                                        # the pavement line his feet stand on
HERO_SCALE = 0.85                                    # as in the bedroom
DOOR = {'x': 28, 'y': 58, 'w': 52, 'h': 124}         # the doorway in the building's front
DOORWAY = {'x': 54, 'y': 182}                        # the middle of his feet as he stands in it
STAND = {'x': 150}                                   # the middle of his feet where he stops and faces us
SKY = {'x': 96, 'y': 0, 'w': 224, 'h': 118}          # open sky down to the horizon: where the sun may show
SUN = {'x': 208, 'y0': 118, 'y1': 62, 'w': 40, 'h': 40}   # its left edge; its top edge before and after it rises
WINDOW_BOTTOM = 60                                   # the narration ends above this row, clear of his head and the sun

# the stand-ins' flat colours: four skies from before dawn to sunrise, the building, the pavement
_SKIES = [((14, 16, 44), (36, 28, 66)), ((38, 34, 84), (120, 66, 92)), ((88, 78, 132), (226, 132, 84)), ((150, 170, 214), (250, 196, 110))]
_LIGHT = [0.45, 0.62, 0.8, 1.0]


def _stand_in_frame(k):
    top, low = _SKIES[k]; f = _LIGHT[k]
    im = Image.new('RGB', (W, H), top); d = ImageDraw.Draw(im)
    hz = SKY['y'] + SKY['h']
    d.rectangle([0, hz - 40, W, hz], fill=low)                                        # the glow along the horizon
    shade = lambda c: tuple(int(v * f) for v in c)
    d.rectangle([0, hz, W, H], fill=shade((92, 88, 96)))                              # the street
    d.rectangle([0, FLOOR_Y - 14, W, H], fill=shade((128, 122, 126)))                 # the pavement
    d.rectangle([0, 20, SKY['x'] - 1, FLOOR_Y - 14], fill=shade((70, 76, 96)))        # the building's front
    x, y, w, h = DOOR['x'], DOOR['y'], DOOR['w'], DOOR['h']
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=shade((54, 96, 120)), outline=shade((170, 176, 190)))   # its door, shut
    d.text((100, 124), f'STAND-IN  dawn {k + 1} of 4', fill=(255, 255, 255))
    d.text((100, 136), 'art brief 09 replaces this', fill=(255, 255, 255))
    return im


def _stand_in_door():
    im = Image.new('RGB', (DOOR['w'], DOOR['h']), (12, 12, 18)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, DOOR['w'] - 1, DOOR['h'] - 1], outline=(170, 176, 190))
    d.text((4, 4), 'OPEN', fill=(255, 255, 255))
    return im


def _stand_in_sun():
    a = np.zeros((SUN['h'], SUN['w'], 4), np.uint8)
    yy, xx = np.mgrid[0:SUN['h'], 0:SUN['w']]; r = np.hypot(xx - (SUN['w'] - 1) / 2, yy - (SUN['h'] - 1) / 2)
    for radius, colour in ((19.5, (250, 150, 60)), (15.5, (255, 204, 96)), (11.5, (255, 244, 200))):
        a[r <= radius] = (*colour, 255)
    return Image.fromarray(a, 'RGBA')


def build(out=None):
    out = out or os.path.join(ROOT, OUT)
    os.makedirs(out, exist_ok=True)
    if SRC is not None: raise SystemExit('the art has landed: cut it here (see art brief 09 and its hand-back)')
    frames = []
    for k in range(4):
        n = f'E_dawn_{k}.png'; frames.append(n)
        _stand_in_frame(k).convert('P', palette=Image.ADAPTIVE, colors=64).save(os.path.join(out, n), optimize=True)
    _stand_in_door().save(os.path.join(out, 'E_door_open.png'), optimize=True)
    _stand_in_sun().save(os.path.join(out, 'E_sun.png'), optimize=True)
    m = {
        'placeholder': SRC is None,
        'images': {'frames': frames, 'door': 'E_door_open.png', 'sun': 'E_sun.png'},
        'floorY': FLOOR_Y, 'heroScale': HERO_SCALE,
        'door': DOOR, 'doorway': DOORWAY, 'stand': STAND, 'sun': SUN, 'sky': SKY, 'windowBottom': WINDOW_BOTTOM,
    }
    with open(os.path.join(out, 'coda.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    m = build()
    print('coda:', 'STAND-INS' if m['placeholder'] else 'real art', '|', ', '.join(m['images']['frames']), '|', m['images']['door'], m['images']['sun'])
