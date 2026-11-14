#!/usr/bin/env python3
"""Room art for the chapters: scratch/room_gen/*.png (640x400, generated) -> assets/rooms/ (320x200) + <chapter>.json.

A plate is saved whole. An edit of a plate (a talk frame) keeps only what it changed, and is saved as a patch:
every edit of one plate is cut to the same rectangle (the union of their changes), so the game swaps one
rectangle and nothing else flickers. Run from the project root:  python3 tools/build_rooms.py

Two kinds of edit. Chapter 1's were whole frames redrawn by the generator, so faint differences are everywhere
and only the real change is kept (build_intro.clean_change). The art drops' are `exact`: Art Claude pasted
only the figure back onto the plate, so every differing pixel is meant and every one is kept. (Cleaning those
dropped the faint lower half of a figure that had turned, leaving him cut off at the waist.)
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
    # Rooms 2-5 come from the art drops as reviewed with Rick on 2026-11-13. Each has a win frame (the persona
    # once the fix has landed); room 2 also has its whiteboard after the fix, a second close-up plate.
    'ch2': {'src': 'art-drops/2026-11-12-room-ch2', 'exact': True,
            'plates': ['R2_war_room', 'R2_wall_closeup', 'R2_wall_closeup_fixed', 'R2_pc_closeup'],
            'edits': {n: 'R2_war_room' for n in ('R2_npc_talk_1', 'R2_npc_talk_2', 'R2_npc_look', 'R2_npc_scratch', 'R2_npc_mark', 'R2_npc_win')}},
    'ch3': {'src': 'art-drops/2026-11-12-room-ch3', 'exact': True, 'plates': ['R3_bullpen', 'R3_wall_closeup', 'R3_pc_closeup'],
            'edits': {n: 'R3_bullpen' for n in ('R3_npc_talk_1', 'R3_npc_talk_2', 'R3_npc_win')}},
    'ch4': {'src': 'art-drops/2026-11-12-room-ch4', 'exact': True, 'plates': ['R4_ops_room', 'R4_wall_closeup', 'R4_pc_closeup'],
            'edits': {n: 'R4_ops_room' for n in ('R4_npc_talk_1', 'R4_npc_talk_2', 'R4_npc_win')}},
    # Room 5 is the atrium (same file names as the loft it replaced).
    'ch5': {'src': 'art-drops/2026-11-12-room-ch5', 'exact': True, 'plates': ['R5_loft', 'R5_wall_closeup', 'R5_pc_closeup'],
            'edits': {n: 'R5_loft' for n in ('R5_npc_talk_1', 'R5_npc_talk_2', 'R5_npc_win')}},
}
# The persona cards' pictures: 640x400 in the drops, 128x80 in the card's window. P2 is the druid (its own drop;
# the armoured picture in room 2's drop is retired). P4 was redone in place as Knight Watch.
CARDS = {'P1': 'art-drops/2026-11-12-card-ch1/P1_card.png', 'P2': 'art-drops/2026-11-13-card-ch2/P2_card.png',
         'P3': 'art-drops/2026-11-12-room-ch3/P3_card.png', 'P4': 'art-drops/2026-11-12-room-ch4/P4_card.png',
         'P5': 'art-drops/2026-11-12-room-ch5/P5_card.png'}
# A card's extra frames (edits of its picture), in loop order: painted magic. P4 has none; its phone screen is
# animated in code.
CARD_FRAMES = {'P1': [f'art-drops/2026-11-12-card-ch1/P1_card_sparkle_{i}.png' for i in (1, 2, 3)],
               'P2': [f'art-drops/2026-11-13-card-ch2/P2_card_fx_{i}.png' for i in (1, 2, 3)],
               'P3': [f'art-drops/2026-11-12-room-ch3/P3_card_fx_{i}.png' for i in (1, 2, 3)],
               'P5': [f'art-drops/2026-11-12-room-ch5/P5_card_fx_{i}.png' for i in (1, 2, 3)]}
CARD_SIZE, CARD_COLOURS = (128, 80), 64


def _save(img, path):
    if len(img.getcolors(1 << 24) or []) <= 256: img = img.convert('P', palette=Image.ADAPTIVE, colors=256)
    img.save(path, optimize=True)


def build(src, out, name, plates, edits, crops=None, exact=False):
    """Builds one chapter's room art into `out`; returns (and writes) its manifest. `crops` cuts a named picture
    (and any edit of it) to a 16:10 window of its source, (x0, y0, x1, y1), before it is shrunk. `exact` keeps
    every pixel an edit changed (see the top of this file)."""
    os.makedirs(out, exist_ok=True)
    crops = crops or {}
    for n, (x0, y0, x1, y1) in crops.items():
        if (x1 - x0) * 10 != (y1 - y0) * 16: raise ValueError(f'{n}: the crop {x1 - x0}x{y1 - y0} is not 16:10')

    def load(n):
        img, box = Image.open(os.path.join(src, n + '.png')), crops.get(n) or crops.get(edits.get(n))
        return downsample(img.crop(box) if box else img)
    m = {'size': [320, 200], 'images': {}, 'patches': {}}
    done = {}
    for n in plates:
        done[n] = quantise(load(n), COLOURS)
        _save(done[n], os.path.join(out, n + '.png')); m['images'][n] = n + '.png'
    snapped, boxes = {}, {}
    for n, plate in edits.items():
        if exact:
            changed = (np.asarray(load(n).convert('RGB')) != np.asarray(load(plate).convert('RGB'))).any(axis=2)
            px = np.asarray(done[plate].convert('RGB')).copy(); px[changed] = np.asarray(quantise(load(n), COLOURS).convert('RGB'))[changed]
            img, frac = Image.fromarray(px, 'RGB'), float(changed.mean())
        else: img, frac = snap_to_plate(quantise(load(n), COLOURS), load(plate), base=done[plate])
        if frac > MAX_DRIFT: raise ValueError(f'{n} differs from {plate} over {frac:.0%} of the frame')
        ys, xs = np.nonzero(changed if exact else (np.asarray(img) != np.asarray(done[plate])).any(axis=2))
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


def build_cards(out='assets/cards', cards=None, frames=None):
    """The persona cards' pictures at the card window's size. Averaged down (they are one figure seen small, and a
    nearest-neighbour fifth loses the face), then cut to a VGA-sized palette.

    A card's extra frames (`frames`: card name -> source paths) share that palette with it: the card and its
    frames are cut to colours together, and a frame keeps the card's own pixel wherever its source is the same,
    so swapping them moves only what was painted to move."""
    os.makedirs(out, exist_ok=True)
    full = lambda paths: {k: [os.path.join(ROOT, p) for p in v] if isinstance(v, list) else os.path.join(ROOT, v) for k, v in paths.items()}
    cards = cards if cards is not None else full(CARDS)
    frames = frames if frames is not None else (full(CARD_FRAMES) if cards == full(CARDS) else {})
    m = {'size': list(CARD_SIZE), 'cards': {}, 'frames': {}}
    w, h = CARD_SIZE
    for name, path in cards.items():
        src = [Image.open(p).convert('RGB') for p in [path] + list(frames.get(name, []))]
        for s in src[1:]:
            if s.size != src[0].size: raise ValueError(f'{name}: a frame is {s.size}, the card {src[0].size}')
        strip = Image.new('RGB', (w, h * len(src)))
        for i, s in enumerate(src): strip.paste(s.resize(CARD_SIZE, Image.BOX), (0, h * i))
        strip = quantise(strip, CARD_COLOURS)
        card = strip.crop((0, 0, w, h))
        _save(card, os.path.join(out, name + '_card.png')); m['cards'][name] = name + '_card.png'
        for i, s in enumerate(src[1:], 1):
            same = np.asarray(Image.fromarray(((np.asarray(s) != np.asarray(src[0])).any(axis=2) * 255).astype(np.uint8)).resize(CARD_SIZE, Image.BOX)) == 0
            f = np.asarray(strip.crop((0, h * i, w, h * (i + 1)))).copy()
            f[same] = np.asarray(card)[same]
            fn = os.path.basename(list(frames[name])[i - 1])
            _save(Image.fromarray(f, 'RGB'), os.path.join(out, fn)); m['frames'].setdefault(name, []).append(fn)
    with open(os.path.join(out, 'cards.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    for name, r in ROOMS.items():
        src = os.path.join(ROOT, r['src'])
        if not os.path.exists(os.path.join(src, r['plates'][0] + '.png')): print(f'{name}: sources not in this checkout ({r["src"]}); left as built'); continue
        build(src, os.path.join(ROOT, OUT), name, r['plates'], r['edits'], r.get('crops'), r.get('exact', False))
    build_cards(os.path.join(ROOT, 'assets/cards'))
