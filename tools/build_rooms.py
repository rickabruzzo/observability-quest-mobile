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
from PIL import Image, ImageFilter

if __package__ in (None, ''): sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools.build_intro import downsample, quantise, snap_to_plate

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = 'scratch/room_gen', 'assets/rooms'
COLOURS = 192
MAX_DRIFT = 0.25                    # a talk frame changes one figure; past a quarter of the frame it is another picture
# Each chapter: the plates (room first) and the edits of the room plate. Rooms 2-5 each have a win frame (the
# persona once the fix has landed); room 2 also has its whiteboard after the fix, a second close-up plate.
# Room 5 is the atrium (same file names as the loft it replaced).
_FILES = {
    'ch1': (['R1_exec_floor', 'R1_monitor_closeup', 'R1_pc_closeup'], 'R1_exec_floor', ('R1_cto_talk_1', 'R1_cto_talk_2')),
    'ch2': (['R2_war_room', 'R2_wall_closeup', 'R2_wall_closeup_fixed', 'R2_pc_closeup'], 'R2_war_room',
            ('R2_npc_talk_1', 'R2_npc_talk_2', 'R2_npc_look', 'R2_npc_scratch', 'R2_npc_mark', 'R2_npc_win')),
    'ch3': (['R3_bullpen', 'R3_wall_closeup', 'R3_pc_closeup'], 'R3_bullpen', ('R3_npc_talk_1', 'R3_npc_talk_2', 'R3_npc_win')),
    'ch4': (['R4_ops_room', 'R4_wall_closeup', 'R4_pc_closeup'], 'R4_ops_room', ('R4_npc_talk_1', 'R4_npc_talk_2', 'R4_npc_win')),
    'ch5': (['R5_loft', 'R5_wall_closeup', 'R5_pc_closeup'], 'R5_loft', ('R5_npc_talk_1', 'R5_npc_talk_2', 'R5_npc_win')),
}
# Two looks, the same file names. Where each look's 640x400 files are, and whether its figure frames are exact:
#   painted  the build Rick approved on 2026-11-13 (tag v0.2-painted-rooms): personas painted at portrait level.
#            Chapter 1's sources predate the art drops and live in scratch/ on the machine that made them.
#   era      the era-look fork: the same rooms with every persona redrawn as a simple 1990s game character, and
#            the close-ups repainted. One drop holds all five rooms.
# To go back to the painted look: set LOOK = 'painted' (or run `python3 tools/build_rooms.py painted`) and rebuild.
_SOURCES = {
    'painted': {'ch1': (SRC, False), **{f'ch{n}': (f'art-drops/2026-11-12-room-ch{n}', True) for n in (2, 3, 4, 5)}},
    'era': {ch: ('art-drops/2026-11-13-era-look-rooms', True) for ch in _FILES},
}
LOOK = 'era'


def rooms(look):
    """The chapters of one look: where each one's files are, its plates and its edits."""
    return {ch: {'src': _SOURCES[look][ch][0], 'exact': _SOURCES[look][ch][1], 'plates': list(plates), 'edits': {n: room for n in edits}}
            for ch, (plates, room, edits) in _FILES.items()}


ROOMS = rooms(LOOK)
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
CARD_QUALITY = 92          # WebP quality for a persona card: visually the source, about 70 KB at 640×400


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
    """The persona cards' pictures as the art is: the source's own size and colours (Rick, 2026-11-14: the cards
    "look bad since they were de-rezed"; he would rather have the original look than a small palette and a
    downscale). A card is saved as a WebP at CARD_QUALITY: a tenth of the PNG's weight with nothing to see.

    A card's extra frames (`frames`: card name -> source paths) are overlays the game draws over the card: the
    card's size, see-through wherever the frame's source is the card's source (the mask is kept exactly), and the
    source's picture where it differs, at the card's quality."""
    os.makedirs(out, exist_ok=True)
    full = lambda paths: {k: [os.path.join(ROOT, p) for p in v] if isinstance(v, list) else os.path.join(ROOT, v) for k, v in paths.items()}
    cards = cards if cards is not None else full(CARDS)
    frames = frames if frames is not None else (full(CARD_FRAMES) if cards == full(CARDS) else {})
    m = {'size': None, 'cards': {}, 'frames': {}}
    for name, path in cards.items():
        card = Image.open(path).convert('RGB')
        if m['size'] is None: m['size'] = list(card.size)
        elif list(card.size) != m['size']: raise ValueError(f'{name}: the card is {card.size}, the others {tuple(m["size"])}')
        card.save(os.path.join(out, name + '_card.webp'), 'WEBP', quality=CARD_QUALITY, method=6); m['cards'][name] = name + '_card.webp'
        base = np.asarray(card)
        for fp in frames.get(name, []):
            f = Image.open(fp).convert('RGB')
            if f.size != card.size: raise ValueError(f'{name}: a frame is {f.size}, the card {card.size}')
            px = np.asarray(f)
            changed = (px != base).any(axis=2)
            # the picture is kept a few pixels beyond the mask, so the codec's colour smoothing at the mask's edge
            # mixes in the frame's own neighbours and not the black of the see-through part
            near = np.asarray(Image.fromarray((changed * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9))) > 0
            over = np.zeros(px.shape[:2] + (4,), np.uint8)
            over[near, :3] = px[near]; over[changed, 3] = 255
            fn = os.path.splitext(os.path.basename(fp))[0] + '.webp'
            Image.fromarray(over, 'RGBA').save(os.path.join(out, fn), 'WEBP', quality=CARD_QUALITY, alpha_quality=100, method=6)
            m['frames'].setdefault(name, []).append(fn)
    with open(os.path.join(out, 'cards.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    look = sys.argv[1] if len(sys.argv) > 1 else LOOK
    print(f'look: {look}')
    for name, r in rooms(look).items():
        src = os.path.join(ROOT, r['src'])
        if not os.path.exists(os.path.join(src, r['plates'][0] + '.png')): print(f'{name}: sources not in this checkout ({r["src"]}); left as built'); continue
        build(src, os.path.join(ROOT, OUT), name, r['plates'], r['edits'], r.get('crops'), r.get('exact', False))
    build_cards(os.path.join(ROOT, 'assets/cards'))
