#!/usr/bin/env python3
"""The personas' conversation portraits, in the narrators' format.

Each persona has a head-and-shoulders portrait (640x428, black background, the narrators' style) and three
edits of it: eyes closed, mouth a little open, mouth wide. The art drop's edits are the portrait with only the
eyes or the mouth pasted back, so every differing pixel is meant.

Out comes what `js/anim/portrait.js` already plays for the narrators:
    assets/portrait_<who>.png                    the still
    assets/anim/portrait_<who>_<kind>.png/.json  a small patch (transparent where nothing changed) and where it goes

The still and its three edits are cut to one palette together, so a patch never shifts a colour the art left alone.
Run from the project root:  python3 tools/build_persona_portraits.py
"""
import json
import os
import sys
import numpy as np
from PIL import Image

if __package__ in (None, ''): sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.build_intro import quantise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, COLOURS, PAD = 640, 428, 256, 4
DROP = 'art-drops/2026-11-13-era-look-portraits'
# who -> the still's path without its extension; the edits sit beside it as <base>_blink, _talk1, _talk2
PORTRAITS = {f'p{n}': f'{DROP}/P{n}_portrait' for n in (1, 2, 3, 4, 5)}
# Where on the face each edit may change (x0, y0, x1, y1): a change outside it is a bad edit, not a blink.
ZONES = {'blink': (140, 60, 500, 260), 'talk1': (160, 170, 480, 380), 'talk2': (160, 170, 480, 380)}


def build(portraits=None, assets=None):
    """Writes every portrait's still and patches under `assets`; returns the names written, in order."""
    portraits = portraits if portraits is not None else {k: os.path.join(ROOT, v) for k, v in PORTRAITS.items()}
    assets = assets or os.path.join(ROOT, 'assets')
    os.makedirs(os.path.join(assets, 'anim'), exist_ok=True)
    made = []
    for who, base in portraits.items():
        src = {k: Image.open(base + (f'_{k}' if k else '') + '.png').convert('RGB') for k in ('', 'blink', 'talk1', 'talk2')}
        for k, im in src.items():
            if im.size != (W, H): raise ValueError(f'{who}{"_" + k if k else ""}: {im.size}, not {W}x{H}')
        strip = Image.new('RGB', (W, H * 4))
        for i, k in enumerate(src): strip.paste(src[k], (0, H * i))
        strip = quantise(strip, COLOURS).convert('RGB')                      # one palette for the still and its edits
        cut = {k: np.asarray(strip.crop((0, H * i, W, H * (i + 1)))) for i, k in enumerate(src)}
        still = Image.fromarray(cut['']).convert('P', palette=Image.ADAPTIVE, colors=COLOURS)
        still.save(os.path.join(assets, f'portrait_{who}.png'), optimize=True); made.append(f'portrait_{who}')
        plate = np.asarray(src[''])
        for k in ('blink', 'talk1', 'talk2'):
            changed = (np.asarray(src[k]) != plate).any(axis=2)
            ys, xs = np.nonzero(changed)
            if not len(xs): raise ValueError(f'{who}_{k}: the edit is the same picture as the portrait')
            zx0, zy0, zx1, zy1 = ZONES[k]
            if xs.min() < zx0 or xs.max() >= zx1 or ys.min() < zy0 or ys.max() >= zy1:
                raise ValueError(f'{who}_{k}: it changes x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}, outside the {k} part of the face')
            x0, y0 = max(0, xs.min() - PAD), max(0, ys.min() - PAD); x1, y1 = min(W, xs.max() + 1 + PAD), min(H, ys.max() + 1 + PAD)
            rgba = np.dstack([cut[k][y0:y1, x0:x1], (changed[y0:y1, x0:x1] * 255).astype(np.uint8)])
            name = f'portrait_{who}_{k}'
            Image.fromarray(rgba, 'RGBA').save(os.path.join(assets, 'anim', name + '.png'), optimize=True)
            with open(os.path.join(assets, 'anim', name + '.json'), 'w') as f: json.dump({'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0)}, f)
            made.append(name); print(f'  {name}: {x1 - x0}x{y1 - y0} at {x0},{y0}')
    return made


if __name__ == '__main__':
    build()
