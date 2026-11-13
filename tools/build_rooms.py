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

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = 'scratch/room_gen', 'assets/rooms'
COLOURS = 192
MAX_DRIFT = 0.25                    # a talk frame changes one figure; past a quarter of the frame it is another picture
# Each chapter: where its 640x400 files are, the plates (room first), and the edits of the room plate.
# Chapter 1's sources predate the art drops and live in scratch/ on the machine that made them.
ROOMS = {
    'ch1': {'src': SRC, 'plates': ['R1_exec_floor', 'R1_monitor_closeup', 'R1_pc_closeup'],
            'edits': {'R1_cto_talk_1': 'R1_exec_floor', 'R1_cto_talk_2': 'R1_exec_floor'}},
    'ch2': {'src': 'art-drops/2026-11-12-room-ch2', 'plates': ['R2_war_room', 'R2_wall_closeup', 'R2_pc_closeup'],
            'edits': {n: 'R2_war_room' for n in ('R2_npc_talk_1', 'R2_npc_talk_2', 'R2_npc_look', 'R2_npc_scratch', 'R2_npc_mark')}},
    'ch3': {'src': 'art-drops/2026-11-12-room-ch3', 'plates': ['R3_bullpen', 'R3_wall_closeup', 'R3_pc_closeup'],
            'edits': {n: 'R3_bullpen' for n in ('R3_npc_talk_1', 'R3_npc_talk_2')}},
    'ch4': {'src': 'art-drops/2026-11-12-room-ch4', 'plates': ['R4_ops_room', 'R4_wall_closeup', 'R4_pc_closeup'],
            'edits': {n: 'R4_ops_room' for n in ('R4_npc_talk_1', 'R4_npc_talk_2')}},
    'ch5': {'src': 'art-drops/2026-11-12-room-ch5', 'plates': ['R5_loft', 'R5_wall_closeup', 'R5_pc_closeup'],
            'edits': {n: 'R5_loft' for n in ('R5_npc_talk_1', 'R5_npc_talk_2')}},
}
# The persona cards' pictures: 640x400 in the drops, 128x80 in the card's window.
CARDS = {'P1': 'art-drops/2026-11-12-card-ch1/P1_card.png', 'P2': 'art-drops/2026-11-12-room-ch2/P2_card.png',
         'P3': 'art-drops/2026-11-12-room-ch3/P3_card.png', 'P4': 'art-drops/2026-11-12-room-ch4/P4_card.png',
         'P5': 'art-drops/2026-11-12-room-ch5/P5_card.png'}
CARD_SIZE, CARD_COLOURS = (128, 80), 64


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


def build_cards(out='assets/cards', cards=None):
    """The persona cards' pictures at the card window's size. Averaged down (they are one figure seen small, and a
    nearest-neighbour fifth loses the face), then cut to a VGA-sized palette."""
    os.makedirs(out, exist_ok=True)
    m = {'size': list(CARD_SIZE), 'cards': {}}
    for name, path in (cards if cards is not None else {k: os.path.join(ROOT, v) for k, v in CARDS.items()}).items():
        img = quantise(Image.open(path).convert('RGB').resize(CARD_SIZE, Image.BOX), CARD_COLOURS)
        _save(img, os.path.join(out, name + '_card.png')); m['cards'][name] = name + '_card.png'
    with open(os.path.join(out, 'cards.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    for name, r in ROOMS.items():
        src = os.path.join(ROOT, r['src'])
        if not os.path.exists(os.path.join(src, r['plates'][0] + '.png')): print(f'{name}: sources not in this checkout ({r["src"]}); left as built'); continue
        build(src, os.path.join(ROOT, OUT), name, r['plates'], r['edits'])
    build_cards(os.path.join(ROOT, 'assets/cards'))
