"""The painted hero (art brief 05): Art Claude's figures cut to game size, as parts the game can repaint.

Art Claude paints the hero the way the personas are painted, with every part in its own colour family on a flat
yellow background: hoodie green, jeans blue, skin orange-tan, hair and beard magenta, shoes and whites neutral
grey, outline a dark neutral. Nothing here draws anything. It sorts each painted pixel into its part and keeps how
light it was painted, shrinks that to the size the game needs, and can repaint the parts in the player's colours
with the painter's shading left as it was.

  classify(image)            -> parts (which part each pixel is), light (how light it was painted)
  to_size(parts, light, w, h)-> the same, smaller: each pixel takes the part most of it covers
  figure(path)               -> a delivered figure on the game's canvas (136 px tall on 144 rows)
  repaint(parts, light, look)-> an RGBA picture in the player's colours

The full set (art brief 06) is the second half of this file: bodies without their heads, heads as layers, the
beard and the glasses as overlays, written as one sheet of codes and a manifest the game looks colours up in.

  python3 tools/build_hero_painted.py                       builds assets/hero/ and tests/fixtures/hero-painted/
  python3 tools/build_hero_painted.py --walk <out.gif>      a moving picture: he walks along the front of room 2
  python3 tools/build_hero_painted.py --test-picture <out.png>   art brief 05's picture: three looks in room 2
"""
import colorsys
import os
import sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DROP = 'art-drops/2026-11-14-hero-painted-test'
KEY = (250, 215, 60)                         # the drop's flat yellow background
PARTS = ['none', 'hoodie', 'jeans', 'skin', 'hair', 'grey', 'outline']
GAME_H, FIGURE_H, SOURCE_H = 144, 136, 272   # the game's canvas rows, the figure's height on it, the figure's height as delivered
OUTLINE = '#1a1424'                          # the game's outline colour (js/engine/hero-parts.js)

# The creator's colours (js/engine/hero-parts.js)
SKIN = ['#E5B48E', '#C2865A', '#8F5B38', '#5A3826']
HAIR = {'black': '#262430', 'brown': '#5C3A1E', 'blonde': '#D9B85A', 'ginger': '#C0522A', 'violet': '#7B4FB8'}
HOODIE = {'honey': '#E8A000', 'ink': '#2B3647', 'teal': '#1F8FD6', 'indigo': '#51368D', 'lime': '#5FA81A'}
JEANS = {'indigo': '#34497E', 'black': '#23232A', 'light': '#7F9CC4', 'grey': '#5B5F66', 'khaki': '#B59B6A'}


def classify(im, speck=None):
    """Sorts each pixel into its part by colour family (the drop's hand-back gives the families) and keeps its
    lightness. Background is the flat yellow. A dark green or dark blue is still hoodie or jeans: the darkest
    folds sit close to the outline, and only a pixel with next to no colour in it is outline. `speck` is the size
    under which a patch of a family is not that part (SPECK; 0 sorts by colour alone)."""
    rgb = np.asarray(im.convert('RGB')).astype(float) / 255
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    light = (mx + mn) / 2
    d = mx - mn
    sat = np.where(d == 0, 0, d / np.where(light <= 0.5, mx + mn + 1e-9, 2 - mx - mn + 1e-9))
    hue = np.zeros_like(light)
    m = d > 0
    rc = np.where(m, (mx - r) / (d + 1e-9), 0); gc = np.where(m, (mx - g) / (d + 1e-9), 0); bc = np.where(m, (mx - b) / (d + 1e-9), 0)
    hue = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc))
    hue = (hue / 6 % 1) * 360
    parts = np.full(light.shape, PARTS.index('skin'), np.uint8)
    parts[(hue >= 70) & (hue < 170)] = PARTS.index('hoodie')
    parts[(hue >= 170) & (hue < 255)] = PARTS.index('jeans')
    parts[(hue >= 255) & (hue < 345)] = PARTS.index('hair')
    # next to no colour: neutral. Dark neutral is outline, the rest grey (shoes, soles, the eyes' whites, the collar).
    chroma = d                                             # how much colour is in it, whatever its lightness
    neutral = (sat < 0.18) | (chroma < 0.07)
    parts[neutral & (light < OUTLINE_BELOW)] = PARTS.index('outline')
    parts[neutral & (light >= OUTLINE_BELOW)] = PARTS.index('grey')
    key = np.abs(np.asarray(im.convert('RGB')).astype(int) - KEY).max(axis=2) <= 24
    parts[key] = 0
    # The fringe: where a part was blended into the yellow background the edge pixel is yellowish, which hue alone
    # reads as skin. A yellowish pixel touching the background is the figure's edge: outline, and painted dark.
    edge = np.zeros_like(key)
    edge[1:] |= key[:-1]; edge[:-1] |= key[1:]; edge[:, 1:] |= key[:, :-1]; edge[:, :-1] |= key[:, 1:]
    fringe = ~key & edge & (hue >= FRINGE_HUE[0]) & (hue < FRINGE_HUE[1]) & (sat >= 0.3)
    parts[fringe] = PARTS.index('outline'); light = np.where(fringe, np.minimum(light, 0.15), light)
    # The soles: painted in the background's yellow, each shut in between the shoe and its outline. A patch of the
    # background's colour that cannot reach the outside and has only shoe and outline round it is the sole.
    _soles(parts, light, key & ~_reaches_the_border(key), reach=2)
    key = key & (parts == 0)
    # Specks: a few pixels of one family inside another part (the eyes are a dark blue; a stray blend on a cuff).
    # A dark speck is outline; a lighter one belongs to whatever part it mostly touches.
    # A garment is also a few big pieces: a patch of a clothing family that is a sliver of that family's whole (the
    # hood's inner shadow is a blue-green that sorts as jeans) belongs to what it sits in.
    small = SPECK if speck is None else speck
    for i in (PARTS.index('hoodie'), PARTS.index('jeans'), PARTS.index('skin'), PARTS.index('hair')):
        sliver = SLIVER * (parts == i).sum() if speck is None and PARTS[i] in ('hoodie', 'jeans') else 0
        for piece in _pieces(parts == i):
            if len(piece) >= max(small, sliver): continue
            ys, xs = np.array(piece).T
            if len(piece) < small and light[ys, xs].mean() < 0.3: parts[ys, xs] = PARTS.index('outline'); continue   # an iris, a nostril
            votes = np.zeros(len(PARTS))
            for y, x in piece:
                for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                    if 0 <= ny < parts.shape[0] and 0 <= nx < parts.shape[1] and parts[ny, nx] not in (0, i): votes[parts[ny, nx]] += 1
            votes[PARTS.index('outline')] = 0                     # an outline runs beside every part; it is not what the speck is
            if votes.any(): parts[ys, xs] = votes.argmax()
    return parts, np.where(key, 0.0, light)


OUTLINE_BELOW = 0.33         # a neutral pixel darker than this is outline. The painted outline is a dark grey in places (round the
                             # shoes above all); between this and the shoes' own grey the paintings have next to nothing
SOLE = 0.75                  # how light a sole is: a little lighter than the shoe above it (they were painted in the background's colour)
FRINGE_HUE = (38, 70)        # yellowish, between the skin's orange and the hoodie's green: the background showing through an edge
SPECK = 14                   # a patch of a family smaller than this many pixels (as delivered, 272 px tall) is not that part
SLIVER = 0.04                # nor is a patch of a clothing family smaller than this share of that family's pixels


def _spread(mask):
    """A boolean mask grown by one pixel in all eight directions."""
    out = mask.copy()
    out[1:] |= mask[:-1]; out[:-1] |= mask[1:]
    grown = out.copy()
    grown[:, 1:] |= out[:, :-1]; grown[:, :-1] |= out[:, 1:]
    return grown


def _reaches_the_border(mask):
    """The pixels of a boolean mask joined (4-connected) to the picture's border: the background round the figure."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    stack = [(y, x) for y in range(h) for x in (0, w - 1) if mask[y, x]] + [(y, x) for x in range(w) for y in (0, h - 1) if mask[y, x]]
    for y, x in stack: seen[y, x] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; stack.append((ny, nx))
    return seen


def _soles(parts, light, holes, reach):
    """Makes each patch of `holes` (clear pixels shut inside the figure) that is a sole into one: grey, SOLE light.
    A sole has shoe within `reach` pixels of it and no cloth, skin or hair; a gap between his legs or under his
    arm has cloth round it and stays a gap. Changes `parts` and `light` in place."""
    cloth = np.isin(parts, [PARTS.index(n) for n in ('hoodie', 'jeans', 'skin', 'hair')])
    for piece in _pieces(holes):
        ys, xs = np.array(piece).T
        y0, y1, x0, x1 = max(ys.min() - reach, 0), ys.max() + reach + 1, max(xs.min() - reach, 0), xs.max() + reach + 1
        patch = np.zeros_like(holes); patch[ys, xs] = True
        near = patch[y0:y1, x0:x1]
        for _ in range(reach): near = _spread(near)
        near = near & ~patch[y0:y1, x0:x1]
        if (near & (parts[y0:y1, x0:x1] == PARTS.index('grey'))).any() and not (near & cloth[y0:y1, x0:x1]).any():
            parts[ys, xs] = PARTS.index('grey'); light[ys, xs] = SOLE


def _pieces(mask):
    """The 4-connected pieces of a boolean mask, as lists of (y, x)."""
    seen = np.zeros_like(mask, bool); out = []
    h, w = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        stack, piece = [(y0, x0)], []; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); piece.append((y, x))
            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; stack.append((ny, nx))
        out.append(piece)
    return out


_G, _O = PARTS.index('grey'), PARTS.index('outline')


def _edge_lines(P, L):
    """What making a figure smaller leaves to tidy at his feet. A sole whose outline had a gap a pixel wide in the
    painting was open to the background there and comes out as a slit: shut in at this size, with only shoe round
    it, it is sole. And at the figure's edge a grey pixel as dark as a line is the line: outline. A pixel that is
    mostly shoe and partly outline is a grey darker than OUTLINE_BELOW, and on the silhouette it stands out from
    the dark outline on either side of it as one stray pixel."""
    _soles(P, L, (P == 0) & ~_reaches_the_border(np.pad(P == 0, 1, constant_values=True))[1:-1, 1:-1], reach=1)
    clear = P == 0
    edge = np.zeros_like(clear)
    edge[1:] |= clear[:-1]; edge[:-1] |= clear[1:]; edge[:, 1:] |= clear[:, :-1]; edge[:, :-1] |= clear[:, 1:]
    edge[0] = edge[-1] = True; edge[:, 0] = edge[:, -1] = True
    P[(P == _G) & edge & (L < OUTLINE_BELOW)] = _O
    return P, L


def to_size(parts, light, w, h):
    """The figure at w×h: each pixel takes the part that most of what it covers is, and the mean lightness of all
    it covers (so an outline too thin to keep its own pixel still darkens the edge it ran along). A pixel that
    covers more background than figure is background. Where grey and outline cover a pixel evenly the outline has
    it: half shoe and half line as grey is a soft mid grey on the shoe's edge, which reads as fringe."""
    H, W = parts.shape
    ky, kx = H / h, W / w
    P = np.zeros((h, w), np.uint8); L = np.zeros((h, w))
    for y in range(h):
        y0, y1 = y * ky, min(H, (y + 1) * ky)
        ys = np.arange(int(y0), int(np.ceil(y1 - 1e-9)))
        wy = np.minimum(y1, ys + 1) - np.maximum(y0, ys)
        for x in range(w):
            x0, x1 = x * kx, min(W, (x + 1) * kx)
            xs = np.arange(int(x0), int(np.ceil(x1 - 1e-9)))
            wx = np.minimum(x1, xs + 1) - np.maximum(x0, xs)
            wgt = np.outer(wy, wx); blk = parts[np.ix_(ys, xs)]
            his = wgt[blk > 0].sum()
            if his * 2 < wgt.sum(): continue
            votes = np.bincount(blk.ravel(), weights=wgt.ravel(), minlength=len(PARTS)); votes[0] = 0
            P[y, x] = votes.argmax()
            if P[y, x] == _G and abs(votes[_G] - votes[_O]) < 1e-9: P[y, x] = _O        # shoe and outline evenly: the outline has it
            L[y, x] = (light[np.ix_(ys, xs)] * wgt)[blk > 0].sum() / his
    return _edge_lines(P, L)


def trim(parts, light):
    """Cut to the figure's own box."""
    ys, xs = np.nonzero(parts)
    return parts[ys.min():ys.max() + 1, xs.min():xs.max() + 1], light[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def figure(path, height=FIGURE_H, canvas=GAME_H):
    """A delivered figure at `height` px tall, his feet on the last row of a `canvas`-row picture as wide as the
    game's canvas for that frame (56; a stride wider than that keeps its width, rounded up to even)."""
    parts, light = trim(*classify(Image.open(path)))
    k = height / parts.shape[0]
    w = max(1, round(parts.shape[1] * k))
    p, l = to_size(parts, light, w, height)
    cw = max(round(56 * height / FIGURE_H), w + (w % 2))
    P = np.zeros((canvas, cw), np.uint8); L = np.zeros((canvas, cw))
    x0 = (cw - w) // 2
    P[canvas - height:, x0:x0 + w] = p; L[canvas - height:, x0:x0 + w] = l
    return P, L


def reference(parts, light):
    """Each part's usual lightness in a figure: the tone the player's colour replaces."""
    return {name: float(np.median(light[parts == i])) for i, name in enumerate(PARTS) if i and (parts == i).any()}


def _hex(c):
    return np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], float)


def _ramp(base, ratio):
    """`base` at a lightness `ratio` times its own: darker scales it down, lighter lifts it part of the way to white."""
    dark = base[None, :] * np.minimum(ratio, 1)[:, None]
    lift = np.clip((ratio - 1) / 1.2, 0, 0.55)[:, None]
    return np.where(ratio[:, None] <= 1, dark, base[None, :] + (255 - base[None, :]) * lift)


def _outline(ratio):
    """The outline at a lightness `ratio` times its usual one: the game's outline colour scaled, darker or lighter.
    Never lifted toward white as cloth is: an outline has no highlights, and one on the figure's edge that took a
    little light from its neighbours in the painting was coming out as a pale speck."""
    return _hex(OUTLINE)[None, :] * np.clip(ratio, 0.6, 1.6)[:, None]


def repaint(parts, light, look, ref=None):
    """The figure in the player's colours. `look` gives a colour for hoodie, jeans, skin and hair; a part keeps its
    painted shading: a pixel as light as the part usually is gets the colour itself, darker folds get it darker,
    lit ones lighter. Grey stays the neutral it was painted; the outline is the game's outline colour."""
    ref = ref or reference(parts, light)
    out = np.zeros(parts.shape + (4,), np.uint8)
    for i, name in enumerate(PARTS):
        m = parts == i
        if not i or not m.any(): continue
        l = light[m]
        if name == 'grey': rgb = np.repeat((l * 255)[:, None], 3, axis=1) * np.array([0.985, 0.985, 1.0])
        elif name == 'outline': rgb = _outline(l / max(ref.get('outline', 0.12), 1e-3))
        elif name not in look: rgb = np.repeat((l * 255)[:, None], 3, axis=1)
        elif name == 'hair' and 'skin' in look:                 # hair painted lighter than usual is thinner hair over skin (stubble): toward the skin, not toward white
            base, skin, ratio = _hex(look['hair']), _hex(look['skin']), l / ref['hair']
            thin = np.clip((ratio - 1) / 0.9, 0, 0.75)[:, None]
            rgb = np.where(ratio[:, None] <= 1, base[None, :] * np.minimum(ratio, 1)[:, None], base[None, :] + (skin[None, :] - base[None, :]) * thin)
        else: rgb = _ramp(_hex(look[name]), l / ref[name])
        out[m, :3] = np.clip(np.round(rgb), 0, 255); out[m, 3] = 255
    return Image.fromarray(out, 'RGBA')


LOOKS = [
    ('ink hoodie, indigo jeans, skin 1, black hair', {'hoodie': HOODIE['ink'], 'jeans': JEANS['indigo'], 'skin': SKIN[0], 'hair': HAIR['black']}),
    ('honey hoodie, black jeans, skin 3, brown hair', {'hoodie': HOODIE['honey'], 'jeans': JEANS['black'], 'skin': SKIN[2], 'hair': HAIR['brown']}),
    ('teal hoodie, khaki jeans, skin 2, ginger hair', {'hoodie': HOODIE['teal'], 'jeans': JEANS['khaki'], 'skin': SKIN[1], 'hair': HAIR['ginger']}),
]


def preview(out, room='assets/rooms/R2_war_room.png', feet=(206, 180), height=124, scale=4):
    """The test's picture: three of the creator's looks standing in room 2 beside the cloud engineer, at the size
    the room draws him where he talks to the engineer. Front, side and mid-stride, one look each."""
    from PIL import ImageDraw, ImageFont
    drop = os.path.join(ROOT, DROP)
    ref = reference(*trim(*classify(Image.open(os.path.join(drop, 'H_front.png')))))
    plate = Image.open(os.path.join(ROOT, room)).convert('RGBA')
    box = (150, 34, 318, 196)
    panels = []
    for (label, look), name in zip(LOOKS, ('H_front', 'H_side', 'H_walk_contact')):
        parts, light = figure(os.path.join(drop, name + '.png'), height=height, canvas=height)
        fig = repaint(parts, light, look, ref)
        scene = plate.copy(); scene.alpha_composite(fig, (feet[0] - fig.width // 2, feet[1] - height + 1))
        panels.append((label, scene.crop(box).convert('RGB')))
    w, h = panels[0][1].size
    gap, foot = 10, 46
    sheet = Image.new('RGB', ((w * scale) * 3 + gap * 2, h * scale + foot), (24, 22, 22))
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 20)
    except OSError: font = ImageFont.load_default()
    for i, (label, im) in enumerate(panels):
        x = i * (w * scale + gap)
        sheet.paste(im.resize((w * scale, h * scale), Image.NEAREST), (x, 0))
        d.text((x + 8, h * scale + 10), label, font=font, fill=(225, 215, 200))
    sheet.save(out)
    return sheet.size




# ======================================================================================================
# The full set (art brief 06): one body set, and the head as a layer
#
# Every painting is sorted into parts and halved to game size (a 112x288 painting is the game's 56x144).
# Then, at game size:
#   bodies()    each body painting with its own head lifted off
#   heads()     each hair style as a whole head (hair, face, neck), cut from a painting of the standing figure
#   overlays()  the beard and the glasses: what differs between two paintings of the same head
#   props()     the heap of clothes
# A body and a head each carry an anchor (the neck); put anchor on anchor, head over body, and the pieces are
# the painting again (tools/tests/test_build_hero_set.py proves it for every painting that allows it).
# build_set() writes them as one sheet of codes (part and tone) and a manifest with the ramps the game looks
# colours up in; write_fixtures() writes finished figures for the game's own tests.
# ======================================================================================================
import functools
import json

SET = 'art-drops/2026-11-15-hero-painted-set'
ANCHOR = (28, 36)                                  # the neck on the standing figures' game canvas (56, 72 as delivered)
NECK = {'front': 35, 'side': 36, 'back': 33}       # the collar's row at game size, each view's standing figure (the drop's hand-back)
BASE = {'front': f'{DROP}/H_front.png', 'side': f'{DROP}/H_side.png', 'back': f'{SET}/H_back.png'}   # the approved figure of each view: short hair, beard
BODY_FILES = {
    'front': (BASE['front'], 'front'), 'side': (BASE['side'], 'side'), 'back': (BASE['back'], 'back'),
    'walk_contact': (f'{DROP}/H_walk_contact.png', 'side'), 'walk_down': (f'{SET}/B_walk_down.png', 'side'),
    'walk_pass': (f'{DROP}/H_walk_pass.png', 'side'), 'walk_up': (f'{SET}/B_walk_up.png', 'side'),
    'toward_l': (f'{SET}/B_walkF_L.png', 'front'), 'toward_r': (f'{SET}/B_walkF_R.png', 'front'),
    'away_l': (f'{SET}/B_walkB_L.png', 'back'), 'away_r': (f'{SET}/B_walkB_R.png', 'back'),
    'pj_front': (f'{SET}/B_pj_front.png', 'front'), 'pj_sit': (f'{SET}/B_pj_sit.png', 'front'),
}
HEAD_FILES = {     # 'standard' is the approved short hair on the clean-shaven face; from behind that is the approved back view
    'standard': {'front': f'{SET}/HD_clean_front.png', 'side': f'{SET}/HD_clean_side.png', 'back': BASE['back']},
    'long': {v: f'{SET}/HD_long_{v}.png' for v in ('front', 'side', 'back')},
    'fro': {v: f'{SET}/HD_fro_{v}.png' for v in ('front', 'side', 'back')},
    'mohawk': {v: f'{SET}/HD_mohawk_{v}.png' for v in ('front', 'side', 'back')},
}
OVERLAY_FILES = {  # what is added -> view -> (the painting with it, the painting without)
    'beard': {v: (BASE[v], f'{SET}/HD_clean_{v}.png') for v in ('front', 'side')},
    'glasses': {v: (f'{SET}/HD_glasses_{v}.png', f'{SET}/HD_clean_{v}.png') for v in ('front', 'side')},
}
HAIR_SCALE = {'fro': 0.78}                         # a hair style cut smaller than it was painted (Rick, 2026-11-16: "Those afros are way too large")
FRAME = 0.04                                       # a pixel this much darker with the glasses on is frame
PJ = {'top': '#A9C4EC', 'bottom': '#A9C4EC'}       # the pyjamas' pale blue, the same on everyone (js/engine/hero-parts.js)
TONES, TONE_0, TONE_STEP = 32, 0.15, 0.05          # a part's lightness, as a share of its usual one, in 32 steps from 0.15
TONE_OF_1 = round((1 - TONE_0) / TONE_STEP)        # the tone that is the player's colour itself
_HOODIE, _JEANS, _SKIN, _HAIR, _GREY, _OUTLINE = (PARTS.index(n) for n in ('hoodie', 'jeans', 'skin', 'hair', 'grey', 'outline'))


def halve(parts, light, phase=(0, 0)):
    """to_size() for exactly half, fast: each pixel is a 2x2 block of the painting (majority part, mean lightness
    of the figure's pixels in it, and background when under half of it is figure). `phase` starts the blocks one
    painting pixel in, across and/or down."""
    p, l = parts[phase[1]:, phase[0]:], light[phase[1]:, phase[0]:]
    h, w = (p.shape[0] + 1) // 2, (p.shape[1] + 1) // 2
    P = np.zeros((h * 2, w * 2), np.uint8); L = np.zeros((h * 2, w * 2))
    P[:p.shape[0], :p.shape[1]] = p; L[:p.shape[0], :p.shape[1]] = l
    pb = P.reshape(h, 2, w, 2).transpose(0, 2, 1, 3).reshape(h, w, 4)
    lb = L.reshape(h, 2, w, 2).transpose(0, 2, 1, 3).reshape(h, w, 4)
    votes = np.stack([(pb == i).sum(axis=2) for i in range(len(PARTS))], axis=2)
    his = 4 - votes[..., 0]; votes[..., 0] = 0
    keep = his * 2 >= 4
    out = np.where(keep, votes.argmax(axis=2), 0).astype(np.uint8)
    out[(out == _G) & (votes[..., _G] == votes[..., _O])] = _O                   # shoe and outline evenly: the outline has it, as in to_size()
    return _edge_lines(out, np.where(keep, (lb * (pb > 0)).sum(axis=2) / np.maximum(his, 1), 0.0))


@functools.lru_cache(maxsize=None)
def _source(path):
    return classify(Image.open(os.path.join(ROOT, path)))


@functools.lru_cache(maxsize=None)
def full(path, phase=(0, 0)):
    """A whole painting at game size: (parts, light). Shared: copy before changing."""
    return halve(*_source(path), phase)


@functools.lru_cache(maxsize=None)
def REF():
    """Each part's usual lightness: the approved front figure's."""
    return reference(*trim(*_source(BASE['front'])))


def _near(mask, diagonal=True):
    """Where a pixel has a neighbour inside `mask`."""
    h, w = mask.shape; pad = np.pad(mask, 1); out = np.zeros_like(mask)
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)] + ([(-1, -1), (-1, 1), (1, -1), (1, 1)] if diagonal else []):
        out |= pad[1 + dy:1 + dy + h, 1 + dx:1 + dx + w]
    return out


def _enclosed(mask):
    """Pixels outside `mask` that cannot reach the picture's edge without crossing it."""
    out = np.zeros_like(mask); out[0] = out[-1] = True; out[:, 0] = out[:, -1] = True
    out &= ~mask
    while True:
        grow = _near(out, diagonal=False) & ~mask & ~out
        if not grow.any(): return ~mask & ~out
        out |= grow


def head_mask(parts, neck_row):
    """The head in a game-size figure: all his hair (a beard and long hair are hair wherever they reach), the skin
    above the collar, what the face encloses (eyes, mouth), and the outline that runs round them. Clothing is
    never head, and the hands are skin far below the collar."""
    rows = np.arange(parts.shape[0])[:, None]
    core = (parts == _HAIR) | ((parts == _SKIN) & (rows < neck_row + 3))
    filled = core | (_enclosed(core) & np.isin(parts, (_SKIN, _GREY, _OUTLINE)))
    return filled | (np.isin(parts, (_GREY, _OUTLINE)) & _near(filled))


@functools.lru_cache(maxsize=None)
def register(view, path):
    """How far (dx, dy), in the painting's own pixels, a body painting's head is from the standing figure's. The
    painter kept the head 'exactly as it is' in every body painting; where it sits in the frame differs."""
    if path == BASE[view]: return (0, 0)
    base, frame = _source(BASE[view])[0], _source(path)[0]
    top = NECK[view] * 2 + 6
    tpl = np.where(np.isin(base[:top], (_HAIR, _SKIN)), base[:top], 0)
    ys, xs = np.nonzero(tpl)
    y0, x0 = ys.min(), xs.min(); t = tpl[y0:ys.max() + 1, x0:xs.max() + 1]
    hair, skin = t == _HAIR, t == _SKIN
    best = (-1, 0, 0)
    for dy in range(-12, 13):
        fy = y0 + dy
        if fy < 0 or fy + t.shape[0] > frame.shape[0]: continue
        for fx in range(frame.shape[1] - t.shape[1] + 1):
            win = frame[fy:fy + t.shape[0], fx:fx + t.shape[1]]
            score = int(((win == _HAIR) & hair).sum() + ((win == _SKIN) & skin).sum())
            if score > best[0]: best = (score, fx - x0, dy)
    return best[1], best[2]


def _piece(parts, light, anchor, erase=None, **more):
    """Cut to the pixels' own box, with the anchor counted from that box's corner. `erase` marks pixels an overlay
    clears (see _overlay); they count as the piece's pixels."""
    ys, xs = np.nonzero((parts > 0) | erase if erase is not None else parts)
    box = np.s_[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    piece = dict(parts=parts[box].copy(), light=light[box].copy(), ax=int(anchor[0] - xs.min()), ay=int(anchor[1] - ys.min()), **more)
    if erase is not None and erase.any(): piece['erase'] = erase[box].copy()
    return piece


def _shift(mask, dx, dy, shape):
    out = np.zeros(shape, bool)
    ys, xs = np.nonzero(mask); ys, xs = ys + dy, xs + dx
    ok = (ys >= 0) & (ys < shape[0]) & (xs >= 0) & (xs < shape[1])
    out[ys[ok], xs[ok]] = True
    return out


@functools.lru_cache(maxsize=None)
def _base_mask(view):
    return head_mask(full(BASE[view])[0], NECK[view])


def _body(name):
    path, view = BODY_FILES[name]
    dx, dy = register(view, path)
    phase = (dx % 2, dy % 2)                               # halve on the standing figure's grid, so his head lands on the same pixels
    parts, light = (a.copy() for a in full(path, phase))
    gx, gy = (dx - phase[0]) // 2, (dy - phase[1]) // 2
    own = (_shift(_base_mask(view), gx, gy, parts.shape) & ~np.isin(parts, (_HOODIE, _JEANS))) | (parts == _HAIR)
    parts[own] = 0
    solid = parts > 0                                      # scraps: what was his head's edge, now attached to nothing he wears
    for blob in _blobs(solid):
        ys, xs = blob
        if not np.isin(parts[ys, xs], (_HOODIE, _JEANS)).any(): parts[ys, xs] = 0
    light[parts == 0] = 0
    return _piece(parts, light, (ANCHOR[0] + gx, ANCHOR[1] + gy), view=view)


def _blobs(mask):
    """The 8-connected pieces of a mask, each as (ys, xs)."""
    seen = np.zeros_like(mask, bool); out = []; h, w = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        stack, ys, xs = [(y0, x0)], [], []; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); ys.append(y); xs.append(x)
            for ny in (y - 1, y, y + 1):
                for nx in (x - 1, x, x + 1):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; stack.append((ny, nx))
        out.append((np.array(ys), np.array(xs)))
    return out


@functools.lru_cache(maxsize=None)
def bodies():
    """{name: piece}: every body painting at game size without its head. A piece is parts, light, the anchor
    (ax, ay) counted from its own corner, and its view."""
    return {name: _body(name) for name in BODY_FILES}


def _smaller_hair(parts, light, view, k):
    """A standing figure's painting with its hair at `k` of its size, about the middle of his skull. Nothing is
    drawn: each hair pixel of the smaller hair is a hair pixel of the painting (the nearest one, as every picture
    here is made smaller). His face, his neck and his clothes stay exactly as painted and lie over the hair, so
    only the hair's outer edge moves in. Where the approved head has his skull the painting's hair stays, so no
    part of his head is ever left bare. The hair's old outline goes and the same one-pixel outline is put round
    its new edge."""
    parts, light = parts.copy(), light.copy()
    hair, skull = parts == _HAIR, _base_mask(view)
    rows = np.arange(parts.shape[0])[:, None]
    ys, xs = np.nonzero(skull & (rows <= NECK[view] - 6))                  # his skull above the jaw: where an afro sits
    cy, cx = ys.mean(), xs.mean()
    ring = (parts == _OUTLINE) & _near(hair) & ~_near(parts == _SKIN)      # the outline round the hair, not the face's
    yy, xx = np.mgrid[0:parts.shape[0], 0:parts.shape[1]]
    sy, sx = np.rint(cy + (yy - cy) / k).astype(int), np.rint(cx + (xx - cx) / k).astype(int)
    inside = (sy >= 0) & (sy < parts.shape[0]) & (sx >= 0) & (sx < parts.shape[1])
    sy, sx = np.clip(sy, 0, parts.shape[0] - 1), np.clip(sx, 0, parts.shape[1] - 1)
    small = inside & hair[sy, sx] & (hair | ring | (parts == 0))           # never over his face or his clothes
    stays = hair & skull & ~small
    gone = (hair | ring) & ~small & ~stays
    new_light = light[sy, sx]
    parts[gone] = 0; light[gone] = 0
    parts[small] = _HAIR; light[small] = new_light[small]
    edge = (parts == 0) & _near(parts == _HAIR, diagonal=False)
    parts[edge] = _OUTLINE; light[edge] = REF()['outline']
    return parts, light


def _head(view, path, style=None):
    parts, light = (a.copy() for a in full(path))
    if style in HAIR_SCALE: parts, light = _smaller_hair(parts, light, view, HAIR_SCALE[style])
    hair = parts == _HAIR
    for ys, xs in _blobs(parts == _SKIN):                                      # a light streak in hair that hangs below the collar reads as
        if ys.min() >= NECK[view] + 3 and _near(hair)[ys, xs].any():          # skin by its colour; a patch of it wholly below the collar
            parts[ys, xs] = _HAIR                                              # and touching his hair is hair (his hands are nowhere near)
    take = head_mask(parts, NECK[view]) | (_base_mask(view) & (parts > 0))     # his head, and whatever shows where the approved head was
    return _piece(np.where(take, parts, 0).astype(np.uint8), np.where(take, light, 0.0), ANCHOR)


@functools.lru_cache(maxsize=None)
def heads():
    """{style: {view: piece}}: each hair style as a whole clean-shaven head."""
    return {style: {view: _head(view, path, style) for view, path in views.items()} for style, views in HEAD_FILES.items()}


def _overlay(what, view, with_path, without_path):
    """What is laid over a clean-shaven head to add the beard or the glasses: pixels that differ between the
    painting with it and the one without, and the few to clear (the clean chin's outline, which the bearded chin
    does not have). Two paintings of one head also differ in ways that are neither: a stray pixel at the hair's
    edge, a cheek shaded a little differently, the hair beside the glasses redrawn. None of that belongs on
    another hair style. So the beard is the differing patches that hold beard (hair in the lower half of the
    head), and the glasses are the frames alone: the differing outline and grey, and the pixels a frame darkened
    (a frame is half a pixel thick at this size, so most of it is a face pixel painted darker)."""
    a, al = full(with_path); b, bl = full(without_path)
    differ = (a != b) | (np.abs(al - bl) > 1e-9)
    if what == 'glasses': keep = differ & (a != _HAIR) & (np.isin(a, (_OUTLINE, _GREY)) | (al < bl - FRAME))
    else:
        rows = np.nonzero(_base_mask(view).any(axis=1))[0]
        mid = (rows[0] + min(rows[-1], NECK[view])) / 2
        keep = np.zeros_like(differ)
        for ys, xs in _blobs(differ):
            if ((a[ys, xs] == _HAIR) & (ys > mid)).any(): keep[ys, xs] = True
    take = keep & (a > 0)
    return _piece(np.where(take, a, 0).astype(np.uint8), np.where(take, al, 0.0), ANCHOR, erase=keep & (a == 0))


@functools.lru_cache(maxsize=None)
def overlays():
    """{'beard' | 'glasses': {view: piece}}: see _overlay."""
    return {what: {view: _overlay(what, view, *pair) for view, pair in views.items()} for what, views in OVERLAY_FILES.items()}


# Yesterday's outfit, lying where it was dropped (art brief 08; Rick, 2026-11-17: "spread on the ground like it was what
# the character took off before bed"). It replaces brief 06's folded stack, which nobody had asked for. The Honeycomb
# mark lies face up on the hoodie: Art Claude's hand-back gives the chest's point on the painting, and the mark's 9x9
# is centred on it.
CLOTHES = 'art-drops/2026-11-17-clothes-on-the-floor/B_clothes.png'
CLOTHES_CHEST = (60, 27)


@functools.lru_cache(maxsize=None)
def props():
    parts, light = full(CLOTHES)
    mark = (CLOTHES_CHEST[0] // 2 - 4, CLOTHES_CHEST[1] // 2 - 4)
    return {'clothes': dict(parts=parts, light=light, ax=parts.shape[1] // 2, ay=parts.shape[0], mark=mark)}


ERASE = 255          # in the coded form: an overlay's pixel that clears what is under it


def _stack(layers):
    """[(codes, ax, ay)] laid anchor on anchor, later over earlier: a 0 leaves what is under it, ERASE clears it
    -> (codes, ax, ay). This is the whole of what the game does to put a figure together."""
    left = max(ax for _, ax, _ in layers); top = max(ay for _, _, ay in layers)
    w = max(a.shape[1] - ax for a, ax, _ in layers) + left; h = max(a.shape[0] - ay for a, _, ay in layers) + top
    out = np.zeros((h, w), np.uint8)
    for a, ax, ay in layers:
        view = out[top - ay:top - ay + a.shape[0], left - ax:left - ax + a.shape[1]]
        view[a > 0] = a[a > 0]
        view[a == ERASE] = 0
    return out, left, top


def place(pieces):
    """Pieces put anchor on anchor, later over earlier -> (parts, light, ax, ay)."""
    left = max(p['ax'] for p in pieces); top = max(p['ay'] for p in pieces)
    w = max(p['parts'].shape[1] - p['ax'] for p in pieces) + left; h = max(p['parts'].shape[0] - p['ay'] for p in pieces) + top
    parts = np.zeros((h, w), np.uint8); light = np.zeros((h, w))
    for p in pieces:
        box = np.s_[top - p['ay']:top - p['ay'] + p['parts'].shape[0], left - p['ax']:left - p['ax'] + p['parts'].shape[1]]
        m = p['parts'] > 0
        parts[box][m] = p['parts'][m]; light[box][m] = p['light'][m]
        if 'erase' in p: parts[box][p['erase']] = 0; light[box][p['erase']] = 0
    return parts, light, left, top


def coded(piece):
    """A piece in the form the sheet holds: encode(), with ERASE where it clears."""
    codes = encode(piece['parts'], piece['light'], REF())
    if 'erase' in piece: codes[piece['erase']] = ERASE
    return codes


# ---- the form the game reads ----

def encode(parts, light, ref):
    """Each pixel as one byte: 0 is clear, else 1 + 32 x (part - 1) + tone. A tone is the pixel's lightness as a
    share of its part's usual one, in steps of TONE_STEP from TONE_0; grey is coded by its own lightness."""
    codes = np.zeros(parts.shape, np.uint8)
    for i, name in enumerate(PARTS[1:]):
        m = parts == i + 1
        if not m.any(): continue
        tone = light[m] * (TONES - 1) if name == 'grey' else (light[m] / ref[name] - TONE_0) / TONE_STEP
        codes[m] = 1 + i * TONES + np.clip(np.round(tone), 0, TONES - 1).astype(int)
    return codes


def decode(codes):
    return np.where(codes > 0, (codes.astype(int) - 1) // TONES + 1, 0), np.where(codes > 0, (codes.astype(int) - 1) % TONES, 0)


def _tones(name, colour=None, skin=None):
    """The 32 colours of one part in one of the creator's colours, as repaint() paints them."""
    ratio = TONE_0 + TONE_STEP * np.arange(TONES)
    if name == 'grey': rgb = np.repeat((np.arange(TONES) / (TONES - 1) * 255)[:, None], 3, axis=1) * np.array([0.985, 0.985, 1.0])
    elif name == 'outline': rgb = _outline(ratio)
    elif name == 'hair':
        base, under = _hex(colour), _hex(skin)
        thin = np.clip((ratio - 1) / 0.9, 0, 0.75)[:, None]
        rgb = np.where(ratio[:, None] <= 1, base[None, :] * np.minimum(ratio, 1)[:, None], base[None, :] + (under[None, :] - base[None, :]) * thin)
    else: rgb = _ramp(_hex(colour), ratio)
    return ''.join('%02x%02x%02x' % tuple(int(v) for v in np.clip(np.round(c), 0, 255)) for c in rgb)


@functools.lru_cache(maxsize=None)
def ramps():
    """Every colour the game can need, so it only looks colours up: 32 tones (rrggbb, run together) for each hoodie
    and jeans colour, each skin, each hair colour over each skin (thin hair shows the skin under it), grey, outline."""
    return {
        'hoodie': {n: _tones('hoodie', c) for n, c in HOODIE.items()},
        'jeans': {n: _tones('jeans', c) for n, c in JEANS.items()},
        'skin': [_tones('skin', c) for c in SKIN],
        'hair': {n: [_tones('hair', c, s) for s in SKIN] for n, c in HAIR.items()},
        'grey': _tones('grey'), 'outline': _tones('outline'),
        'pj': {'top': _tones('hoodie', PJ['top']), 'bottom': _tones('jeans', PJ['bottom'])},
    }


def _named(look):
    """A look by the creator's names ({hoodie, jeans, hair: name, skin: index}); a hex colour of theirs is accepted too."""
    def name(table, v): return v if v in table else next(n for n, c in table.items() if c.lower() == str(v).lower())
    skin = look['skin'] if isinstance(look['skin'], int) else [c.lower() for c in SKIN].index(look['skin'].lower())
    return {'hoodie': name(HOODIE, look['hoodie']), 'jeans': name(JEANS, look['jeans']), 'hair': name(HAIR, look['hair']), 'skin': skin}


def lut(look, outfit='hoodie'):
    """code -> RGBA for one look: 256 rows. In pyjamas ('pj') the hoodie's and the jeans' parts are the pyjamas'."""
    look, r = _named(look), ramps()
    top, bottom = (r['pj']['top'], r['pj']['bottom']) if outfit == 'pj' else (r['hoodie'][look['hoodie']], r['jeans'][look['jeans']])
    out = np.zeros((256, 4), np.uint8)
    for i, ramp in enumerate([top, bottom, r['skin'][look['skin']], r['hair'][look['hair']][look['skin']], r['grey'], r['outline']]):
        for t in range(TONES):
            out[1 + i * TONES + t] = [int(ramp[t * 6 + k:t * 6 + k + 2], 16) for k in (0, 2, 4)] + [255]
    return out


def paint(codes, look, outfit='hoodie'):
    return Image.fromarray(lut(look, outfit)[codes], 'RGBA')


# ---- the files ----

OUT = 'assets/hero'
FIXTURES = 'tests/fixtures/hero-painted'
# The walks: which body each frame is, and how far the whole figure dips in it (game pixels, down is positive). Every
# walk painting was scaled to the same height, so the paintings themselves do not bob (the drop's hand-back).
WALKS = {
    'side': [('walk_contact', 1), ('walk_down', 2), ('walk_pass', 0), ('walk_up', -1)],     # one step; the next step is the same four
    'toward': [('toward_l', 1), ('front', 0), ('toward_r', 1), ('front', 0)],
    'away': [('away_l', 1), ('back', 0), ('away_r', 1), ('back', 0)],
}
MARK = (-14, 10)      # the Honeycomb mark's corner from the anchor on the hoodie bodies that face us: high on the chest,
MARKED = ('front', 'toward_l', 'toward_r')   # the wearer's right of the drawstrings. The mark itself is js/engine/hc-mark.js.


ADVANCE = 13.5     # how far he travels in one frame of the side walk at full size. Measured by _advance() on the first build of
                   # the set and approved in motion; kept as a number so that re-sorting his shoes' pixels cannot change his pace


def _advance():
    """How far he travels in one frame of the side walk at full size, as the shoes measure it: a step is the
    distance between his shoes at the long stride, and a step is four frames. A check on ADVANCE, not its source:
    the measurement moves by a fraction of a pixel with how the shoes' pixels are sorted."""
    b = bodies()['walk_contact']
    xs = np.sort(np.nonzero(b['parts'][-14:] == _GREY)[1])
    cut = xs[np.diff(xs).argmax()]
    return round(float(xs[xs > cut].mean() - xs[xs <= cut].mean()) / 4, 1)


def _eyes():
    """Where the pupils are, from the anchor, facing us and in profile: the outline pixels in the clean face with
    skin on all four sides. Every hair style has the same face, so they hold for every head."""
    out = {}
    for view in ('front', 'side'):
        h = heads()['standard'][view]; p = h['parts']
        skin = np.pad(p == _SKIN, 1)
        inside = (p == _OUTLINE) & skin[:-2, 1:-1] & skin[2:, 1:-1] & skin[1:-1, :-2] & skin[1:-1, 2:]
        inside[h['ay'] - 8:] = False                                      # the mouth and the chin are lower down
        ys, xs = np.nonzero(inside)
        out[view] = sorted([int(x - h['ax']), int(y - h['ay'])] for y, x in zip(ys, xs))
    return out


def _pack(items, width=512, gap=1):
    """[(key, codes)] -> (sheet, {key: (x, y)}): rows, in the order given, a clear pixel between neighbours."""
    x = y = row = 0; at = {}
    for key, a in items:
        if x and x + a.shape[1] > width: x, y, row = 0, y + row + gap, 0
        at[key] = (x, y); x += a.shape[1] + gap; row = max(row, a.shape[0])
    sheet = np.zeros((y + row, max(at[k][0] + a.shape[1] for k, a in items)), np.uint8)
    for key, a in items: sheet[at[key][1]:at[key][1] + a.shape[0], at[key][0]:at[key][0] + a.shape[1]] = a
    return sheet, at


def build_set(out=None):
    """Writes hero.png (every piece as codes; a browser reads a pixel's code from its red channel, 0 where clear)
    and hero.json (where each piece is, its anchor, the walks, the mark's place, the ramps). Returns the manifest."""
    out = out or os.path.join(ROOT, OUT); os.makedirs(out, exist_ok=True)
    B, H, O, Pr = bodies(), heads(), overlays(), props()
    items = [(('bodies', n), B[n]) for n in B] + [(('heads', s, v), H[s][v]) for s in H for v in H[s]] \
        + [((what, v), O[what][v]) for what in O for v in O[what]] + [(('props', n), Pr[n]) for n in Pr]
    sheet, at = _pack([(k, coded(p)) for k, p in items])
    def entry(key, piece, anchor=True, **more):
        e = dict(x=at[key][0], y=at[key][1], w=piece['parts'].shape[1], h=piece['parts'].shape[0])
        if anchor: e.update(ax=piece['ax'], ay=piece['ay'])
        return {**e, **more}
    m = {
        'image': 'hero.png', 'tones': TONES, 'parts': PARTS[1:], 'erase': ERASE,
        'bodies': {n: entry(('bodies', n), B[n], view=B[n]['view']) for n in B},
        'heads': {s: {v: entry(('heads', s, v), H[s][v]) for v in H[s]} for s in H},
        'beard': {v: entry(('beard', v), O['beard'][v]) for v in O['beard']},
        'glasses': {v: entry(('glasses', v), O['glasses'][v]) for v in O['glasses']},
        'props': {n: {**entry(('props', n), Pr[n], anchor=False), 'mark': list(Pr[n]['mark'])} for n in Pr},
        'walk': {name: {'frames': [{'body': b, 'dy': dy} for b, dy in frames]} for name, frames in WALKS.items()},
        'mark': {'dx': MARK[0], 'dy': MARK[1], 'bodies': list(MARKED)},
        'eyes': _eyes(),
        'ramps': ramps(),
    }
    m['walk']['side']['advance'] = ADVANCE
    im = Image.fromarray(sheet, 'P'); im.putpalette([v for i in range(256) for v in (i, i, i)])
    im.save(os.path.join(out, m['image']), optimize=True, transparency=0)
    with open(os.path.join(out, 'hero.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


def compose(m, codes, body, style, beard=False, glasses=False, look=None, outfit='hoodie'):
    """A finished figure from the built files, exactly as the game makes one: the body, the head of that style for
    the body's view, then the beard and the glasses if asked for and the view shows them, anchor on anchor; then
    each code looked up in the look's colours. -> (RGBA picture, ax, ay)."""
    cut = lambda e: (codes[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']], e['ax'], e['ay'])
    b = m['bodies'][body]; view = b['view']
    layers = [cut(b), cut(m['heads'][style][view])]
    if beard and view in m['beard']: layers.append(cut(m['beard'][view]))
    if glasses and view in m['glasses']: layers.append(cut(m['glasses'][view]))
    out, ax, ay = _stack(layers)
    return paint(out, look, outfit), ax, ay


CASES = [   # finished figures for the game's tests: name, body, style, beard, glasses, look
    ('front-standard-beard', 'front', 'standard', True, False, {'hoodie': 'ink', 'jeans': 'indigo', 'skin': 0, 'hair': 'black'}),
    ('side-long-glasses', 'side', 'long', False, True, {'hoodie': 'honey', 'jeans': 'black', 'skin': 1, 'hair': 'brown'}),
    ('back-fro', 'back', 'fro', False, False, {'hoodie': 'teal', 'jeans': 'grey', 'skin': 0, 'hair': 'violet'}),
    ('walk-contact-mohawk-beard-glasses', 'walk_contact', 'mohawk', True, True, {'hoodie': 'teal', 'jeans': 'khaki', 'skin': 2, 'hair': 'ginger'}),
    ('walk-down-long-beard', 'walk_down', 'long', True, False, {'hoodie': 'lime', 'jeans': 'light', 'skin': 1, 'hair': 'black'}),
    ('walk-up-standard', 'walk_up', 'standard', False, False, {'hoodie': 'lime', 'jeans': 'light', 'skin': 3, 'hair': 'blonde'}),
    ('toward-l-fro-beard', 'toward_l', 'fro', True, False, {'hoodie': 'indigo', 'jeans': 'indigo', 'skin': 1, 'hair': 'black'}),
    ('away-l-long-asked-for-beard-and-glasses', 'away_l', 'long', True, True, {'hoodie': 'honey', 'jeans': 'black', 'skin': 2, 'hair': 'brown'}),
    ('pj-sit-standard-beard', 'pj_sit', 'standard', True, False, {'hoodie': 'ink', 'jeans': 'indigo', 'skin': 0, 'hair': 'black'}),
    ('pj-front-mohawk-glasses', 'pj_front', 'mohawk', False, True, {'hoodie': 'teal', 'jeans': 'grey', 'skin': 3, 'hair': 'violet'}),
]


def write_fixtures(out=None, built=None):
    """tests/fixtures/hero-painted/: sheet.codes (the sheet's codes, row by row, one byte each: Node has no PNG
    decoder) and, for each case, <name>.json (what to compose, its size and anchor) and <name>.rgba."""
    out = out or os.path.join(ROOT, FIXTURES); built = built or os.path.join(ROOT, OUT); os.makedirs(out, exist_ok=True)
    m = json.load(open(os.path.join(built, 'hero.json')))
    codes = np.asarray(Image.open(os.path.join(built, m['image'])))
    with open(os.path.join(out, 'sheet.codes'), 'wb') as f: f.write(codes.tobytes())
    for name, body, style, beard, glasses, look in CASES:
        outfit = 'pj' if body.startswith('pj_') else 'hoodie'
        img, ax, ay = compose(m, codes, body, style, beard, glasses, look, outfit)
        with open(os.path.join(out, name + '.json'), 'w') as f:
            json.dump(dict(body=body, style=style, beard=beard, glasses=glasses, look=look, outfit=outfit, w=img.width, h=img.height, ax=ax, ay=ay), f); f.write('\n')
        with open(os.path.join(out, name + '.rgba'), 'wb') as f: f.write(np.asarray(img).tobytes())
    return [c[0] for c in CASES]


def walk_preview(out, room='assets/rooms/R2_war_room.png', y=194, scale=3, look=None, style='standard', beard=True, glasses=False, ms=110):
    """A moving picture from the built files only: he walks along the front of room 2, stops and faces us, and
    walks back. He is at full size here, 136 px, so every pixel is the build's; the game draws him about a
    twentieth smaller on that line. The frames, the dips and the distance a frame are the manifest's."""
    built = os.path.join(ROOT, OUT)
    m = json.load(open(os.path.join(built, 'hero.json'))); codes = np.asarray(Image.open(os.path.join(built, m['image'])))
    look = look or {'hoodie': 'ink', 'jeans': 'indigo', 'skin': 0, 'hair': 'black'}
    plate = Image.open(os.path.join(ROOT, room)).convert('RGBA')
    step = m['walk']['side']['advance']
    def shot(body, x, dy=0, flip=False):
        img, ax, ay = compose(m, codes, body, style, beard, glasses, look)
        e = m['bodies'][body]
        if flip: img, ax = img.transpose(Image.FLIP_LEFT_RIGHT), img.width - 1 - ax
        top = y + 1 - (e['h'] - e['ay']) - ay + dy               # the body's last row on the floor line, the head hung on its anchor
        scene = plate.copy(); scene.alpha_composite(img, (round(x) - ax, top))
        return scene.resize((plate.width * scale, plate.height * scale), Image.NEAREST).convert('RGB')
    frames, x, i = [], 40.0, 0
    side = m['walk']['side']['frames']
    while x < 205: f = side[i % 4]; frames.append(shot(f['body'], x, f['dy'])); x += step; i += 1
    frames += [shot('side', x)] * 2 + [shot('front', x)] * 9 + [shot('side', x, flip=True)] * 2
    i = 0
    while x > 40: f = side[i % 4]; frames.append(shot(f['body'], x, f['dy'], flip=True)); x -= step; i += 1
    frames += [shot('side', x, flip=True)] * 2 + [shot('front', x)] * 6 + [shot('side', x)] * 2
    frames[0].save(out, save_all=True, append_images=frames[1:], duration=ms, loop=0, optimize=True)
    return len(frames)


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--test-picture': print(preview(sys.argv[2]))      # art brief 05's picture: three looks in room 2
    elif len(sys.argv) > 2 and sys.argv[1] == '--walk': print(walk_preview(sys.argv[2]), 'frames')
    else:
        m = build_set()
        print(len(m['bodies']), 'bodies,', sum(len(v) for v in m['heads'].values()), 'heads ->', os.path.join(OUT, m['image']))
        print('fixtures:', ', '.join(write_fixtures()))
