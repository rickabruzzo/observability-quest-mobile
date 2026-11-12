#!/usr/bin/env python3
"""Room art for the chapters: scratch/room_gen/*.png (640x400, generated) -> assets/rooms/ (320x200) + <chapter>.json.

A plate is saved whole. An edit of a plate (a talk frame) keeps only what it changed, and is saved as a patch:
every edit of one plate is cut to the same rectangle (the union of their changes), so the game swaps one
rectangle and nothing else flickers. Run from the project root:  python3 tools/build_rooms.py
"""
import json, os, sys
import numpy as np
from PIL import Image

if __package__ in (None, ''): sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.build_intro import downsample, quantise, snap_to_plate

SRC, OUT = 'scratch/room_gen', 'assets/rooms'
COLOURS = 192
MAX_DRIFT = 0.25                    # a talk frame changes one figure; past a quarter of the frame it is another picture
ROOMS = {
    'ch1': {'plates': ['R1_exec_floor', 'R1_monitor_closeup', 'R1_pc_closeup'],
            'edits': {'R1_cto_talk_1': 'R1_exec_floor', 'R1_cto_talk_2': 'R1_exec_floor'}},
}


def _save(img, path):
    if len(img.getcolors(1 << 24) or []) <= 256: img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
    img.save(path, optimize=True)


def build(src, out, name, plates, edits):
    """Builds one chapter's room art into `out`; returns (and writes) its manifest."""
    os.makedirs(out, exist_ok=True)
    load = lambda n: downsample(Image.open(os.path.join(src, n + '.png')))
    m = {'size': [320, 200], 'images': {}, 'patches': {}}
    done = {}
    for n in plates:
        done[n] = quantise(load(n), COLOURS)
        _save(done[n], os.path.join(out, n + '.png')); m['images'][n] = n + '.png'
    snapped, boxes = {}, {}
    for n, plate in edits.items():
        img, frac = snap_to_plate(quantise(load(n), COLOURS), load(plate), base=done[plate])
        if frac > MAX_DRIFT: raise ValueError(f'{n} differs from {plate} over {frac:.0%} of the frame')
        ys, xs = np.nonzero((np.asarray(img) != np.asarray(done[plate])).any(axis=2))
        if not len(xs): raise ValueError(f'{n} is the same picture as {plate}')
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
        print(f'{n}: {frac:.1%} of the frame changed, x {x0}-{x1 - 1}, y {y0}-{y1 - 1}')
        snapped[n] = (img, plate)
        b = boxes.get(plate); boxes[plate] = (x0, y0, x1, y1) if not b else (min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1))
    for plate, (x0, y0, x1, y1) in boxes.items(): m['patches'][plate] = {'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0}
    for n, (img, plate) in snapped.items():
        _save(img.crop(boxes[plate]), os.path.join(out, n + '.png')); m['images'][n] = n + '.png'
    with open(os.path.join(out, name + '.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    for name, r in ROOMS.items(): build(SRC, OUT, name, r['plates'], r['edits'])
