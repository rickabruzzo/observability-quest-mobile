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

Run it for the test's picture (three of the creator's looks standing in room 2):
  python3 tools/build_hero_painted.py <out.png>
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
    parts[neutral & (light < 0.25)] = PARTS.index('outline')
    parts[neutral & (light >= 0.25)] = PARTS.index('grey')
    key = np.abs(np.asarray(im.convert('RGB')).astype(int) - KEY).max(axis=2) <= 24
    parts[key] = 0
    # The fringe: where a part was blended into the yellow background the edge pixel is yellowish, which hue alone
    # reads as skin. A yellowish pixel touching the background is the figure's edge: outline, and painted dark.
    edge = np.zeros_like(key)
    edge[1:] |= key[:-1]; edge[:-1] |= key[1:]; edge[:, 1:] |= key[:, :-1]; edge[:, :-1] |= key[:, 1:]
    fringe = ~key & edge & (hue >= FRINGE_HUE[0]) & (hue < FRINGE_HUE[1]) & (sat >= 0.3)
    parts[fringe] = PARTS.index('outline'); light = np.where(fringe, np.minimum(light, 0.15), light)
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


FRINGE_HUE = (38, 70)        # yellowish, between the skin's orange and the hoodie's green: the background showing through an edge
SPECK = 14                   # a patch of a family smaller than this many pixels (as delivered, 272 px tall) is not that part
SLIVER = 0.04                # nor is a patch of a clothing family smaller than this share of that family's pixels


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


def to_size(parts, light, w, h):
    """The figure at w×h: each pixel takes the part that most of what it covers is, and the mean lightness of all
    it covers (so an outline too thin to keep its own pixel still darkens the edge it ran along). A pixel that
    covers more background than figure is background."""
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
            L[y, x] = (light[np.ix_(ys, xs)] * wgt)[blk > 0].sum() / his
    return P, L


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
        elif name == 'outline': rgb = _ramp(_hex(OUTLINE), np.clip(l / max(ref.get('outline', 0.12), 1e-3), 0.6, 1.6))
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


if __name__ == '__main__':
    print(preview(sys.argv[1] if len(sys.argv) > 1 else 'hero-painted-in-room-2.png'))
