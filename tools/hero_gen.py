"""Reference VGA hero generator — the era-look hero (Warp brief 09, 2026-11-13).

The normative implementation: js/engine/hero.js and hero-side.js must match it pixel for pixel (golden
fixtures in tests/fixtures/hero and tests/fixtures/hero-side; tools/tests/test_hero_gen.py covers it).

The figure is drawn to art-drops/2026-11-13-era-look-portraits/hero_model_sheet.png: a 56×144 canvas holding a
standing figure about 136 px tall, four and a half heads, the head about 30 px high and the shoulders about 46
across. A dark outline round the figure and between its parts; three or four tones on each garment; a simple
face with eyes that have a glint, brows, a nose and a mouth; hands below the sleeves; a hood with two
drawstrings; a front pocket; jeans with a seam, a knee and a cuff; shoes with a sole. The Honeycomb mark on the
chest is the official file reduced by tools/hc_mark.py, never drawn here.
"""
from PIL import Image
import json, math, sys, os

W, H = 56, 144
TOP = 4                     # the figure is drawn this far down the canvas, so its soles sit on the last row
FLOOR = H - 1               # the lowest opaque row of a standing figure, both views: the shoes' soles (143)

# ---- normative data (js/engine/hero-parts.js copies these verbatim) ----
OPTIONS = {
    'body': ['masc', 'fem', 'nb'], 'skin': [0, 1, 2, 3],
    'hair': ['black', 'brown', 'blonde', 'ginger', 'violet'],          # colour; the beard takes it too
    'style': ['mohawk', 'standard', 'shoulder', 'long', 'fro'],           # mohawk = buzzed sides, short textured top
    'beard': ['none', 'short', 'long'],
    'hoodie': ['honey', 'ink', 'teal', 'indigo', 'lime'],
    'jeans': ['indigo', 'black', 'light', 'grey', 'khaki'],
    'glasses': ['none', 'glasses'],
}
CONFIG_KEYS = list(OPTIONS)
POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4', 'situp']   # situp: upright in bed, legs under the blanket
OUTFITS = ['hoodie', 'pj']
PJ = {'top': '#A9C4EC', 'stripe': '#7F9CC4', 'bottom': '#A9C4EC'}
SIT_DY = 40                 # sitting up: the upper body sits this much lower
SIT_CUT = 78                # ...and the covers come to the waist: nothing below this figure row is drawn
# per-pose offsets applied to the idle masks: (legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy)
WALK = {'idle': (0, 0, 0, 0, 0, 0, 0), 'walk1': (-2, 2, -4, 4, 0, 2, -2), 'walk2': (0, 0, 0, 0, 2, 0, 0),
        'walk3': (2, -2, 4, -4, 0, -2, 2), 'walk4': (0, 0, 0, 0, 2, 0, 0)}
PRESETS = {
    'masc': dict(body='masc', skin=0, hair='black', style='standard', beard='short', hoodie='ink', jeans='indigo', glasses='none'),
    'fem': dict(body='fem', skin=1, hair='brown', style='long', beard='none', hoodie='honey', jeans='black', glasses='glasses'),
    'nb': dict(body='nb', skin=0, hair='violet', style='mohawk', beard='none', hoodie='teal', jeans='grey', glasses='glasses'),
}
# The model sheet's five looks, for the contact sheet (PRESETS are the creator's three starting points and do not change).
SHEET = {
    **PRESETS,
    'fro': dict(body='masc', skin=3, hair='black', style='fro', beard='long', hoodie='lime', jeans='indigo', glasses='none'),
    'ginger': dict(body='fem', skin=0, hair='ginger', style='shoulder', beard='none', hoodie='indigo', jeans='light', glasses='none'),
}
FIXTURES = {
    'masc-idle': (PRESETS['masc'], 'idle'),
    'masc-walk1': (PRESETS['masc'], 'walk1'), 'masc-walk2': (PRESETS['masc'], 'walk2'),
    'masc-walk3': (PRESETS['masc'], 'walk3'), 'masc-walk4': (PRESETS['masc'], 'walk4'),
    'fem-idle': (PRESETS['fem'], 'idle'), 'nb-idle': (PRESETS['nb'], 'idle'),
    'var-long-beard': (dict(body='masc', skin=2, hair='black', style='standard', beard='long', hoodie='honey', jeans='khaki', glasses='glasses'), 'idle'),
    'var-fro': (dict(body='nb', skin=1, hair='blonde', style='fro', beard='short', hoodie='lime', jeans='indigo', glasses='glasses'), 'idle'),
    'masc-pj-idle': (PRESETS['masc'], 'idle', 'pj'), 'masc-pj-situp': (PRESETS['masc'], 'situp', 'pj'), 'fem-pj-walk1': (PRESETS['fem'], 'walk1', 'pj'),
    'var-shoulder': (dict(body='fem', skin=3, hair='ginger', style='shoulder', beard='none', hoodie='indigo', jeans='light', glasses='none'), 'idle'),
}

def hexc(s):
    s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def ramp(base, light=1.22, shade=0.74, dark=0.5):
    r, g, b, _ = hexc(base)
    f = lambda k: (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), 255)
    return {'L': f(light), 'B': (r, g, b, 255), 'S': f(shade), 'D': f(dark)}

OUTLINE = hexc('#1a1424')
SKIN = ['#E5B48E', '#C2865A', '#8F5B38', '#5A3826']
HAIR = {'black': '#262430', 'brown': '#5C3A1E', 'blonde': '#D9B85A', 'ginger': '#C0522A', 'violet': '#7B4FB8'}
HOODIE = {'honey': '#E8A000', 'ink': '#2B3647', 'teal': '#1F8FD6', 'indigo': '#51368D', 'lime': '#5FA81A'}
JEANS = {'indigo': '#34497E', 'black': '#23232A', 'light': '#7F9CC4', 'grey': '#5B5F66', 'khaki': '#B59B6A'}
SHOE = ramp('#2E2E36', light=1.6, shade=0.8)
SOLE = hexc('#8A8A94')                      # the shoes' pale sole, two rows at the floor
GLASSES = (30, 30, 42, 255)                 # dark frames: they must read as glasses on every skin tone
EYE_WHITE = hexc('#F2F2F2')
# The face, front on: the left edge of each eye's 4-px white; the two drawstring columns.
EYES = (19, 33)
DRAWSTRINGS = (24, 31)
# The Honeycomb logomark on the hoodie's chest: tools/hc_mark.py reduces assets/hc_logomark.png to this table
# (tools/hc_mark.json; the game imports the same table from js/engine/hc-mark.js). Brand colours. Drawn high on
# the chest, wearer's right of the drawstrings; on the profile, on the chest's leading side.
_MARK = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hc_mark.json')))
HC_MARK = _MARK['colours']
HC_MARK_PIXELS = [tuple(p) for p in _MARK['pixels']]
HC_MARK_AT = (15, 47)
HC_MARK_SIDE_AT = (32, 47)

class Canvas:
    def __init__(self):
        self.part = [[None] * W for _ in range(H)]   # part id per pixel
        self.col = [[None] * W for _ in range(H)]    # final colour
        self.oy = TOP                                # vertical offset for fills/px (TOP, plus the walk bob)
    def fill(self, pid, mask):
        for (x, y) in mask:
            y += self.oy
            if 0 <= x < W and 0 <= y < H:
                self.part[y][x] = pid
    def shade(self, pid, rmp, hl=1, sh=2, top_light=True):
        rows = {}
        for y in range(H):
            xs = [x for x in range(W) if self.part[y][x] == pid]
            if xs: rows[y] = (min(xs), max(xs), xs)
        ys = sorted(rows)
        for y in ys:
            lo, hi, xs = rows[y]
            for x in xs:
                c = rmp['B']
                if x - lo < hl: c = rmp['L']
                elif hi - x < sh: c = rmp['S']
                if top_light and y == ys[0]: c = rmp['L']
                self.col[y][x] = c
    def outline(self):
        sil = [[self.part[y][x] is not None for x in range(W)] for y in range(H)]
        for y in range(H):
            for x in range(W):
                if not sil[y][x]: continue
                edge = False
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if nx < 0 or ny < 0 or nx >= W or ny >= H or not sil[ny][nx]: edge = True
                if edge: self.col[y][x] = OUTLINE
    def seam(self, a, b):
        """A dark line where part `a` meets part `b` (on a's side): the outline between parts of the figure."""
        for y in range(H):
            for x in range(W):
                if self.part[y][x] != a: continue
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < W and 0 <= ny < H and self.part[ny][nx] == b: self.col[y][x] = OUTLINE; break
    def px(self, x, y, c):
        y += self.oy
        if 0 <= x < W and 0 <= y < H: self.col[y][x] = c; self.part[y][x] = self.part[y][x] or 'detail'
    def image(self):
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for y in range(H):
            for x in range(W):
                if self.col[y][x]: im.putpixel((x, y), self.col[y][x])
        return im

def rect(x0, y0, x1, y1):
    return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
def ellipse(cx, cy, rx, ry):
    out = []
    for y in range(int(cy - ry), int(cy + ry) + 1):
        for x in range(int(cx - rx), int(cx + rx) + 1):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0: out.append((x, y))
    return out

BODIES = {
    # torso spans, arm columns, leg columns, shoe columns (inclusive)
    'masc': dict(shoulder=(5, 50), arm_l=(4, 9), arm_r=(46, 51), torso=(10, 45), waist=(10, 45), hip=(10, 45),
                 leg_l=(11, 25), leg_r=(30, 44), shoe_l=(8, 25), shoe_r=(30, 47), neck=(24, 31), head_rx=11.5),
    'fem':  dict(shoulder=(7, 48), arm_l=(6, 9), arm_r=(46, 49), torso=(10, 45), waist=(12, 43), hip=(10, 45),
                 leg_l=(12, 25), leg_r=(30, 43), shoe_l=(10, 25), shoe_r=(30, 45), neck=(24, 31), head_rx=11.0),
    'nb':   dict(shoulder=(5, 50), arm_l=(4, 9), arm_r=(46, 51), torso=(10, 45), waist=(11, 44), hip=(10, 45),
                 leg_l=(11, 25), leg_r=(30, 44), shoe_l=(8, 25), shoe_r=(30, 47), neck=(24, 31), head_rx=11.3),
}

def hero(body='masc', skin=0, hair='black', style='standard', beard='none',
         hoodie='ink', jeans='indigo', glasses='none', pose='idle', outfit='hoodie'):
    b = BODIES[body]; c = Canvas()
    skin_r = ramp(SKIN[skin], light=1.12, shade=0.8, dark=0.62)
    hair_r = ramp(HAIR[hair], light=1.35, shade=0.7)
    pj = outfit == 'pj'; sit = pose == 'situp'
    hood_r = ramp(PJ['top'] if pj else HOODIE[hoodie]); jean_r = ramp(PJ['bottom'] if pj else JEANS[jeans], light=1.25, shade=0.72)
    shoe_r = skin_r if pj else SHOE                                # pyjamas go barefoot
    beard_r = ramp(HAIR[hair], light=1.3, shade=0.7)
    cx = 27.5
    legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob, armL_dy, armR_dy = WALK.get(pose, WALK['idle'])
    if sit: bob = SIT_DY                                            # the whole upper body sits lower

    # ---- legs & shoes (back; never bob) ----
    leg_top, leg_bot = 90, 133
    c.oy = TOP
    if not sit:                                                     # sitting up: the legs are under the blanket
        c.fill('legL', rect(b['leg_l'][0] + legL_dx, leg_top, b['leg_l'][1] + legL_dx, leg_bot))
        c.fill('legR', rect(b['leg_r'][0] + legR_dx, leg_top, b['leg_r'][1] + legR_dx, leg_bot))
        c.fill('shoeL', rect(b['shoe_l'][0] + shoeL_dx, 134, b['shoe_l'][1] + shoeL_dx, 139))
        c.fill('shoeR', rect(b['shoe_r'][0] + shoeR_dx, 134, b['shoe_r'][1] + shoeR_dx, 139))
        # crotch: jeans continuous above row 100
        c.fill('legL', rect(b['hip'][0], leg_top, 27, 99)); c.fill('legR', rect(28, leg_top, b['hip'][1], 99))

    # ---- everything above the legs bobs with the walk ----
    c.oy = TOP + bob
    # ---- hood (behind neck; pyjamas have none) ----
    if not pj: c.fill('hood', rect(17, 36, 38, 46))
    # ---- back hair: the mass behind the head and neck (the body is drawn over it) ----
    if style == 'shoulder': c.fill('hair', ellipse(cx, 20.0, b['head_rx'] + 5.2, 16.0) + rect(12, 20, 43, 43))
    elif style == 'long': c.fill('hair', ellipse(cx, 20.0, b['head_rx'] + 5.8, 16.4) + rect(10, 20, 45, 47))
    # ---- torso ----
    for y in range(40, 93):
        if y <= 43: span = (b['shoulder'][0] + (5, 3, 1, 0)[y - 40], b['shoulder'][1] - (5, 3, 1, 0)[y - 40])   # rounded shoulders
        elif y <= 58: span = (b['torso'][0], b['torso'][1])
        elif y <= 76: span = (b['waist'][0], b['waist'][1])
        else: span = (b['hip'][0], b['hip'][1])
        c.fill('torso', rect(span[0], y, span[1], y))
    # arms (each swings by its own dy), hands below the sleeves
    c.fill('armL', rect(b['arm_l'][0], 44 + armL_dy, b['arm_l'][1], 86 + armL_dy)); c.fill('armR', rect(b['arm_r'][0], 44 + armR_dy, b['arm_r'][1], 86 + armR_dy))
    c.fill('handL', rect(b['arm_l'][0], 87 + armL_dy, b['arm_l'][1], 95 + armL_dy)); c.fill('handR', rect(b['arm_r'][0], 87 + armR_dy, b['arm_r'][1], 95 + armR_dy))
    # the hood's opening: a V of the hood's inside at the neck of the hoodie
    if not pj:
        for i, y in enumerate(range(40, 46)): c.fill('hood', rect(22 + i, y, 33 - i, y))
    # ---- neck & head ----
    c.fill('neck', rect(b['neck'][0], 33, b['neck'][1], 41))
    c.fill('head', ellipse(cx, 21.5, b['head_rx'], 13.5))
    c.fill('head', rect(16, 17, 39, 28))                            # cheeks out to the ears: no gap between ear and face
    c.fill('head', rect(17, 29, 38, 30) + rect(18, 31, 37, 32) + rect(20, 33, 35, 34) + rect(23, 35, 32, 35))   # jaw & chin
    c.fill('earL', rect(14, 19, 15, 24)); c.fill('earR', rect(40, 19, 41, 24))
    # ---- hair in front of the head ----
    # standard: a cap with short sideburns, all inside the head's outline. shoulder/long: the cap, plus locks that
    # fall in front of the shoulders (the mass behind the head was filled before the body). mohawk: a flat-topped
    # ridge on a buzzed scalp — the head stays round. fro: one big round mass.
    hm = []
    c.fill('head', ellipse(cx, 13.5, b['head_rx'] + 1.0, 7.5) + rect(16, 12, 39, 16))   # a full round skull under any hair
    if style == 'mohawk':
        hm += rect(24, 1, 31, 10)                                    # the ridge stops above the forehead
    elif style == 'fro':
        hm = [p for p in ellipse(cx, 16.0, b['head_rx'] + 8.5, 16.0) if not (p[1] >= 15 and 18 <= p[0] <= 37)]
    else:
        hm += ellipse(cx, 12.0, b['head_rx'] + 1.2, 8.5)             # crown, with some height to it
        hm += rect(16, 12, 39, 16)                                   # down to the temples
        if style == 'standard':
            hm += rect(16, 17, 17, 22) + rect(38, 17, 39, 22)        # sideburns, inside the head's outline
        elif style == 'shoulder':
            hm += rect(12, 12, 17, 43) + rect(38, 12, 43, 43)        # locks to the shoulders, six wide
        elif style == 'long':
            hm += rect(10, 14, 17, 63) + rect(38, 14, 45, 63) + rect(12, 64, 17, 67) + rect(38, 64, 43, 67)   # down over the chest
        hm = [p for p in hm if not (p[1] >= 13 and 18 <= p[0] <= 37)]  # hairline: four rows of forehead above the brows
    c.fill('hair', hm)
    # ---- shading ----
    c.shade('legL', jean_r, hl=2, sh=3); c.shade('legR', jean_r, hl=2, sh=3)
    c.shade('shoeL', shoe_r, hl=2, sh=2); c.shade('shoeR', shoe_r, hl=2, sh=2)
    c.shade('hood', {'L': hood_r['S'], 'B': hood_r['D'], 'S': hood_r['D'], 'D': hood_r['D']}, hl=0, sh=0, top_light=False)
    c.shade('torso', hood_r, hl=3, sh=5); c.shade('armL', hood_r, hl=2, sh=2); c.shade('armR', hood_r, hl=2, sh=3)
    c.shade('handL', skin_r, hl=1, sh=2); c.shade('handR', skin_r, hl=1, sh=2)
    c.shade('neck', {'L': skin_r['S'], 'B': skin_r['S'], 'S': skin_r['D'], 'D': skin_r['D']}, hl=0, sh=2, top_light=False)
    c.shade('head', skin_r, hl=2, sh=3); c.shade('earL', skin_r, hl=0, sh=1); c.shade('earR', skin_r, hl=0, sh=1)
    c.shade('hair', hair_r, hl=3, sh=5)
    # pyjama stripes: every fourth column of the cloth, as on the model sheet
    if pj:
        stripe = hexc(PJ['stripe'])
        for y in range(H):
            for x in range(W):
                if x % 4 == 1 and c.part[y][x] in ('torso', 'armL', 'armR', 'legL', 'legR'): c.col[y][x] = stripe
    # ---- details ----
    # the sleeves' inner lines; the hoodie also has a hem, a pocket, drawstrings and the mark
    for y in range(46, 89):
        c.px(b['torso'][0], y, hood_r['S']); c.px(b['torso'][1], y, hood_r['D'])
    if not pj:
        for x in range(b['hip'][0], b['hip'][1] + 1): c.px(x, 91, hood_r['D']); c.px(x, 92, hood_r['D'])
        px0, px1 = b['waist'][0] + 5, b['waist'][1] - 5                                   # the kangaroo pocket
        for x in range(px0, px1 + 1): c.px(x, 75, hood_r['S']); c.px(x, 89, hood_r['S'])
        for y in range(75, 90): c.px(px0, y, hood_r['S']); c.px(px1, y, hood_r['S'])
        for i in range(4): c.px(px0 + 1 + i, 76 + i, hood_r['S']); c.px(px1 - 1 - i, 76 + i, hood_r['S'])   # the slanted openings
        for x in DRAWSTRINGS:
            for y in range(46, 62): c.px(x, y, hood_r['L'])
            c.px(x, 62, hood_r['D'])                                                      # the aglet
        ax, ay = HC_MARK_AT
        for (x, y, k) in HC_MARK_PIXELS: c.px(ax + x, ay + y, hexc(HC_MARK[k]))          # Honeycomb-branded hoodie
    # hands: a line between the fingers and the thumb
    for (x0, x1, dy) in ((b['arm_l'][0], b['arm_l'][1], armL_dy), (b['arm_r'][0], b['arm_r'][1], armR_dy)):
        for x in range(x0 + 1, x1): c.px(x, 92 + dy, skin_r['S'])
    # knees, seams, cuffs and soles: on the legs, which never bob
    c.oy = TOP
    if not sit:
        for (l0, l1, dx) in ((b['leg_l'][0], b['leg_l'][1], legL_dx), (b['leg_r'][0], b['leg_r'][1], legR_dx)):
            for x in range(l0 + dx + 1, l1 + dx): c.px(x, 112, jean_r['S'])                # knee
            for x in range(l0 + dx + 1, l1 + dx): c.px(x, 131, jean_r['L']); c.px(x, 132, jean_r['S']); c.px(x, 133, jean_r['S'])   # cuff
        for y in range(100, 131): c.px(b['leg_l'][0] + legL_dx + 2, y, jean_r['L']); c.px(b['leg_r'][1] + legR_dx - 2, y, jean_r['L'])   # seams
        if not pj:
            for (s0, s1, dx) in ((b['shoe_l'][0], b['shoe_l'][1], shoeL_dx), (b['shoe_r'][0], b['shoe_r'][1], shoeR_dx)):
                for x in range(s0 + dx + 1, s1 + dx): c.px(x, 138, SOLE); c.px(x, 139, SOLE)   # soles
    c.oy = TOP + bob
    # face
    brow = hair_r['D']
    for ex in EYES:
        for x in range(ex, ex + 4): c.px(x, 17, brow)
        for y in (19, 20):
            for x in range(ex, ex + 4): c.px(x, y, EYE_WHITE)
        c.px(ex + 1, 19, OUTLINE); c.px(ex + 1, 20, OUTLINE); c.px(ex + 2, 20, OUTLINE)   # the pupil, with a glint top right
    for y in range(22, 26): c.px(28, y, skin_r['S'])                                      # the nose's shaded side
    c.px(26, 26, skin_r['S']); c.px(27, 26, skin_r['D']); c.px(28, 26, skin_r['D']); c.px(29, 26, skin_r['S'])   # nostrils
    for x in range(25, 31): c.px(x, 29, skin_r['D'])                                      # mouth
    for x in range(26, 30): c.px(x, 30, skin_r['S'])                                      # the lower lip
    # hair texture: buzzed sides for the mohawk, dark curls dotted through the fro, a few strands otherwise
    if style == 'mohawk':
        buzz = tuple((a * 11 + h * 9) // 20 for a, h in zip(skin_r['B'], hair_r['B']))      # stubble: skin showing through
        for y in range(6, 17):
            for x in range(14, 42):
                if c.part[y + c.oy][x] == 'head' and not (y >= 13 and 18 <= x <= 37): c.px(x, y, buzz)
    if style == 'fro':
        for (x, y) in [(18, 4), (33, 2), (12, 12), (43, 10), (24, 8), (37, 9), (10, 24), (45, 22), (16, 30), (39, 29), (28, 3), (20, 14)]:
            if c.part[y + c.oy][x] == 'hair': c.px(x, y, hair_r['D'])        # a few darker curls
    if style in ('standard', 'shoulder', 'long'):
        for (x, y) in [(22, 6), (23, 7), (30, 5), (31, 6), (26, 9)]:
            if c.part[y + c.oy][x] == 'hair': c.px(x, y, hair_r['D'])        # a parting's worth of strands
    # beard (takes the hair colour): short = close-cropped over the jaw with a solid chin; long = full, down the chest
    if beard == 'short':
        pts = rect(18, 26, 19, 30) + rect(36, 26, 37, 30)            # sideburns down the jaw
        pts += rect(22, 27, 33, 28)                                  # moustache (the mouth is row 29)
        pts += [(22, 29), (23, 29), (32, 29), (33, 29), (20, 30), (21, 30), (22, 30), (33, 30), (34, 30), (35, 30)]   # round the mouth
        pts += rect(20, 31, 35, 32) + rect(21, 33, 34, 34) + rect(23, 35, 32, 35)   # jaw line and chin
        for (x, y) in pts: c.px(x, y, beard_r['S'] if x >= 33 else beard_r['B'])
    elif beard == 'long':
        for (x, y) in rect(18, 26, 37, 45):
            if 29 <= y <= 30 and 24 <= x <= 31: continue
            if y >= 38 and (x < 20 + (y - 38) or x > 35 - (y - 38)): continue
            c.px(x, y, beard_r['S'] if x >= 34 else beard_r['B'])
        for y in range(26, 33): c.px(18, y, beard_r['L'])
        for (x, y) in [(23, 36), (28, 40), (32, 37), (26, 43)]: c.px(x, y, beard_r['D'])   # a few darker curls
    # glasses: a dark frame about each eye (the eye and a row of skin show inside), a bridge, arms to the ears
    if glasses == 'glasses':
        frame = []
        for ex in EYES:
            x0, x1 = ex - 1, ex + 4
            frame += [(x, 17) for x in range(x0 + 1, x1)] + [(x, 22) for x in range(x0 + 1, x1)]
            frame += [(x0, y) for y in range(18, 22)] + [(x1, y) for y in range(18, 22)]
            for x in range(x0 + 1, x1): c.px(x, 18, skin_r['L'])                             # the brow sits behind the lens
        frame += [(x, 19) for x in range(EYES[0] + 5, EYES[1] - 1)] + [(16, 19), (17, 19), (38, 19), (39, 19)]   # bridge, arms
        for (x, y) in frame: c.px(x, y, GLASSES)
    if sit:                                                         # under the covers from the waist down
        for y in range(TOP + SIT_DY + SIT_CUT + 1, H):
            for x in range(W): c.part[y][x] = None; c.col[y][x] = None
    c.oy = 0
    c.seam('torso', 'armL'); c.seam('torso', 'armR')                # the sleeves read as sleeves
    c.seam('legL', 'legR')                                          # the legs part
    c.outline()
    return c.image()

# ---- profile view (facing right; the game mirrors it for left) --------------------------------------
# Ported to js/engine/hero-side.js, which must match this pixel for pixel (golden fixtures in
# tests/fixtures/hero-side). Standing plus an eight-frame walk: stride, passing, stride with the other leg
# forward, passing.
SIDE_POSES = ['stand'] + [f'w{i}' for i in range(1, 9)]
# The walk, as joint angles in degrees from straight down (+ = forward). One leg's eight frames; the other leg
# and the arms use the same table half a cycle away. Studied from how adventure-game figures of the era walk:
# the front leg reaches out nearly straight and lands on the heel, the back leg trails with the knee bent and
# the heel lifting, the swinging leg folds at the knee as it passes, and each arm swings against its own leg
# with the elbow a little bent. The body dips on the two wide frames.
#          thigh, shin
SIDE_LEG = [(26, 12), (16, 2), (2, -4), (-12, -22), (-22, -46), (-8, -62), (12, -48), (26, -10)]
SIDE_BOB = [3, 1, 0, 2, 3, 1, 0, 2]   # exactly what keeps the planted shoe on one floor row (a test holds it there)
THIGH, SHIN, UPPER, FORE = 22, 22, 20, 18
LEG_W, ARM_W = 10, 8

# Golden fixtures for js/engine/hero-side.js (tests/fixtures/hero-side, tests/hero-side.test.js).
# One hero through all nine poses, then one of every hair style, every beard, glasses, every body, pyjamas.
SIDE_FIXTURES = {
    **{f'nb-{p}': (PRESETS['nb'], p) for p in SIDE_POSES},               # mohawk, glasses, no beard — nine poses
    'masc-stand': (PRESETS['masc'], 'stand'),                            # masc body, standard hair, short beard
    'masc-w3': (PRESETS['masc'], 'w3'),
    'fem-stand': (PRESETS['fem'], 'stand'),                              # fem body, long hair, glasses
    'fem-w7': (PRESETS['fem'], 'w7'),
    'var-shoulder-w2': (dict(body='fem', skin=3, hair='ginger', style='shoulder', beard='none', hoodie='indigo', jeans='light', glasses='none'), 'w2'),
    'var-fro-w5': (dict(body='nb', skin=1, hair='blonde', style='fro', beard='short', hoodie='lime', jeans='indigo', glasses='glasses'), 'w5'),
    'var-long-beard-stand': (dict(body='masc', skin=2, hair='black', style='standard', beard='long', hoodie='honey', jeans='khaki', glasses='glasses'), 'stand'),
    'masc-pj-stand': (PRESETS['masc'], 'stand', 'pj'),                   # barefoot, striped, no hood and no mark
    'masc-pj-w4': (PRESETS['masc'], 'w4', 'pj'),
}


def _r(v):
    """Round half up — the one rule the whole profile view uses, in both languages.

    Python's built-in round() is banker's rounding (round(2.5) == 2) and JavaScript's Math.round
    is half up (Math.round(2.5) === 3), so a limb whose joint lands exactly on .5 would land on a
    different pixel in js/engine/hero-side.js. floor(v + 0.5) is what Math.round does, negatives
    included, so the port can match byte for byte.
    """
    return math.floor(v + 0.5)


def _limb(x, y, length, deg, width):
    """A thick segment from (x, y), `deg` from straight down. Returns (pixels, end point)."""
    dx, dy = math.sin(math.radians(deg)) * length, math.cos(math.radians(deg)) * length
    steps = max(1, _r(length))
    px = set()
    for i in range(steps + 1):
        cx, cy = x + dx * i / steps, y + dy * i / steps
        for w in range(width): px.add((_r(cx - (width - 1) / 2 + w), _r(cy)))
    return sorted(px), (x + dx, y + dy)


def _leg(c, tag, hip_x, hip_y, thigh, shin, width=LEG_W):
    up, knee = _limb(hip_x, hip_y, THIGH, thigh, width)
    low, ankle = _limb(knee[0], knee[1], SHIN, shin, width)
    c.fill('leg' + tag, up + low)
    ax, ay = _r(ankle[0]), _r(ankle[1])
    lift = 2 if shin < -30 else 0                                       # a trailing foot points its toe down
    c.fill('shoe' + tag, rect(ax - 4, ay, ax + 8, ay + 5) + rect(ax + 7, ay + 2 + lift, ax + 11, ay + 5 + lift))
    return (ax, ay, lift)


def _arm(c, tag, sh_x, sh_y, swing, width=ARM_W):
    up, elbow = _limb(sh_x, sh_y, UPPER, swing, width)
    low, wrist = _limb(elbow[0], elbow[1], FORE, swing + (18 if swing >= 0 else 8), width)   # the elbow stays a little bent
    c.fill('arm' + tag, up + low)
    wx, wy = _r(wrist[0]), _r(wrist[1])
    c.fill('hand' + tag, rect(wx - 3, wy, wx + 3, wy + 8))
    return (wx, wy)


def hero_side(body='masc', skin=0, hair='black', style='standard', beard='none',
              hoodie='ink', jeans='indigo', glasses='none', pose='stand', outfit='hoodie'):
    c = Canvas()
    skin_r = ramp(SKIN[skin], light=1.12, shade=0.8, dark=0.62)
    hair_r = ramp(HAIR[hair], light=1.35, shade=0.7)
    pj = outfit == 'pj'
    hood_r = ramp(PJ['top'] if pj else HOODIE[hoodie]); jean_r = ramp(PJ['bottom'] if pj else JEANS[jeans], light=1.25, shade=0.72)
    shoe_r = skin_r if pj else SHOE
    if pose == 'stand':
        near, far, bob, swing = (0, 0), (0, 0), 0, 4
        far_swing = -30                                                 # standing: the far arm hangs a little behind, so it shows
    else:
        i = SIDE_POSES.index(pose) - 1
        near, far, bob = SIDE_LEG[i], SIDE_LEG[(i + 4) % 8], SIDE_BOB[i]
        swing = -near[0] * 0.9                                           # each arm swings against its own leg
        far_swing = -swing
    slim = body == 'fem'
    t0, t1 = (17, 41) if slim else (15, 41)                             # torso, side on: about 26 deep

    # far arm and far leg first (darker), then the near leg; shoes point the way the hero faces
    c.oy = TOP + bob
    _arm(c, 'B', 28, 46, far_swing)
    shoeB = _leg(c, 'B', 26, 90, *far)
    shoeF = _leg(c, 'F', 28, 90, *near)
    # back hair behind the body, hood behind the neck
    if style == 'shoulder': c.fill('hair', rect(14, 16, 24, 43))
    elif style == 'long': c.fill('hair', rect(12, 16, 24, 63))
    if not pj: c.fill('hood', rect(14, 36, 24, 47))
    c.fill('torso', rect(t0, 40, t1, 92) + rect(t0 + 2, 38, t1 - 2, 39))
    c.fill('neck', rect(24, 33, 31, 41))
    # head in profile: skull, face plane, nose, chin
    c.fill('head', ellipse(27.0, 21.0, 11.5, 13.5) + rect(26, 26, 37, 34) + rect(28, 35, 35, 35))
    c.fill('head', rect(38, 22, 39, 26) + [(40, 24), (40, 25), (41, 25)])   # nose
    c.fill('ear', rect(23, 19, 26, 25))
    # hair
    skull = ellipse(27.0, 17.5, 12.5, 12.0)
    if style == 'mohawk':
        top = lambda x: _r(17.5 - 12.0 * math.sqrt(max(0.0, 1 - ((x - 27.0) / 12.5) ** 2)))   # the skull's top, per column
        hm = [(x, y) for x in range(19, 35) for y in range(top(x) - 5, top(x) + 2)]          # the ridge, following the skull
    elif style == 'fro':
        hm = [p for p in ellipse(24.0, 16.0, 18.5, 17.0) if not (p[0] >= 30 and p[1] >= 15)]
    else:
        hm = [p for p in skull if p[1] <= 12 or p[0] <= 22]              # crown and the back of the head
        hm = [p for p in hm if not (p[0] >= 26 and p[1] >= 13)]          # forehead and face stay clear
        if style == 'standard': hm += rect(22, 14, 25, 19)              # sideburn in front of the ear
        elif style == 'shoulder': hm += rect(14, 16, 23, 43) + rect(24, 14, 25, 19)
        elif style == 'long': hm += rect(12, 16, 23, 63) + rect(24, 14, 25, 19)
    c.fill('hair', hm)
    # the near arm, over the torso; it swings against the legs
    handF = _arm(c, 'F', 26, 46, swing)

    c.shade('legB', {k: jean_r['S'] if k != 'D' else jean_r['D'] for k in 'LBSD'}, hl=0, sh=2, top_light=False)
    c.shade('shoeB', {k: shoe_r['S'] for k in 'LBSD'}, hl=0, sh=0, top_light=False)
    c.shade('legF', jean_r, hl=2, sh=2, top_light=False); c.shade('shoeF', shoe_r, hl=2, sh=2)
    c.shade('hood', {'L': hood_r['S'], 'B': hood_r['D'], 'S': hood_r['D'], 'D': hood_r['D']}, hl=0, sh=0, top_light=False)
    c.shade('torso', hood_r, hl=2, sh=4, top_light=False)
    c.shade('armB', {k: hood_r['D'] for k in 'LBSD'}, hl=0, sh=0, top_light=False); c.shade('handB', {k: skin_r['S'] for k in 'LBSD'}, hl=0, sh=0, top_light=False)
    c.shade('armF', {'L': hood_r['S'], 'B': hood_r['B'], 'S': hood_r['S'], 'D': hood_r['D']}, hl=2, sh=2, top_light=False)
    c.shade('handF', skin_r, hl=1, sh=2, top_light=False)
    c.shade('neck', {'L': skin_r['S'], 'B': skin_r['S'], 'S': skin_r['D'], 'D': skin_r['D']}, hl=0, sh=2, top_light=False)
    c.shade('head', skin_r, hl=2, sh=2); c.shade('ear', {k: skin_r['S'] for k in 'LBSD'}, hl=0, sh=0, top_light=False)
    c.shade('hair', hair_r, hl=3, sh=4)
    if pj:
        stripe = hexc(PJ['stripe'])
        for y in range(H):
            for x in range(W):
                if x % 4 == 1 and c.part[y][x] in ('torso', 'armF', 'armB', 'legF', 'legB'): c.col[y][x] = stripe
    else:
        for x in range(t0, t1 + 1): c.px(x, 91, hood_r['D']); c.px(x, 92, hood_r['D'])   # hem
        for y in range(76, 90): c.px(t1 - 4, y, hood_r['S'])                            # the pocket's leading edge
        for x in range(t0 + 4, t1 - 3): c.px(x, 89, hood_r['S'])
        for y in range(46, 60): c.px(33, y, hood_r['L'])                                 # the near drawstring
        c.px(33, 60, hood_r['D'])
        ax, ay = HC_MARK_SIDE_AT
        for (x, y, k) in HC_MARK_PIXELS: c.px(ax + x, ay + y, hexc(HC_MARK[k]))         # the mark, on the chest's leading side
        for (ax_, ay_, lift) in (shoeB, shoeF):
            for x in range(ax_ - 3, ax_ + 8): c.px(x, ay_ + 4, SOLE); c.px(x, ay_ + 5, SOLE)   # soles
            for x in range(ax_ + 8, ax_ + 11): c.px(x, ay_ + 4 + lift, SOLE); c.px(x, ay_ + 5 + lift, SOLE)
    # the near hand's fingers; the near leg's knee and cuff
    wx, wy = handF
    for x in range(wx - 2, wx + 3): c.px(x, wy + 5, skin_r['S'])
    if style == 'mohawk':
        buzz = tuple((a * 11 + h * 9) // 20 for a, h in zip(skin_r['B'], hair_r['B']))
        for (x, y) in skull:
            if (y <= 12 or x <= 22) and not (x >= 26 and y >= 13) and c.part[y + c.oy][x] == 'head': c.px(x, y, buzz)
    if style == 'fro':
        for (x, y) in [(14, 4), (24, 1), (8, 12), (18, 8), (10, 24), (20, 28), (30, 5), (6, 18)]:
            if c.part[y + c.oy][x] == 'hair': c.px(x, y, hair_r['D'])
    # face, looking right
    for x in range(32, 37): c.px(x, 17, hair_r['D'])                                      # brow
    c.px(33, 19, EYE_WHITE); c.px(33, 20, EYE_WHITE); c.px(34, 19, OUTLINE); c.px(34, 20, OUTLINE); c.px(35, 20, OUTLINE); c.px(35, 19, EYE_WHITE)
    c.px(38, 26, skin_r['S'])                                                             # nostril
    for x in range(33, 38): c.px(x, 29, skin_r['D'])                                      # mouth
    beard_r = ramp(HAIR[hair], light=1.3, shade=0.7)
    if beard == 'short':
        pts = rect(26, 27, 27, 33) + rect(32, 27, 37, 28) + rect(28, 31, 37, 33) + rect(28, 34, 35, 35)
        for (x, y) in pts:
            if not (y == 29 and x >= 33): c.px(x, y, beard_r['B'])
    elif beard == 'long':
        for (x, y) in rect(26, 26, 37, 45):
            if (y == 29 and x >= 33) or (y <= 27 and x >= 30): continue
            if y >= 38 and x < 26 + (y - 38): continue
            c.px(x, y, beard_r['S'] if x <= 27 else beard_r['B'])
    if glasses == 'glasses':
        for (x, y) in [(x, 17) for x in range(33, 37)] + [(x, 22) for x in range(33, 37)] + [(32, y) for y in range(18, 22)] + [(37, y) for y in range(18, 22)] + [(x, 19) for x in range(24, 32)]:
            c.px(x, y, GLASSES)
        for x in range(33, 37): c.px(x, 18, skin_r['L'])
    c.oy = 0
    c.seam('torso', 'armF'); c.seam('legF', 'legB'); c.seam('torso', 'legF'); c.seam('torso', 'legB')
    c.outline()
    return c.image()


def write_fixtures(d):
    """<name>.json (config + pose), <name>.rgba (W*H*4 bytes row-major), <name>.png for every fixture."""
    os.makedirs(d, exist_ok=True)
    for name, fx in FIXTURES.items():
        cfg, pose, outfit = (fx + ('hoodie',))[:3]
        im = hero(**cfg, pose=pose, outfit=outfit)
        with open(os.path.join(d, f'{name}.json'), 'w') as f: json.dump({**cfg, 'pose': pose, 'outfit': outfit}, f, indent=1, sort_keys=True)
        with open(os.path.join(d, f'{name}.rgba'), 'wb') as f: f.write(im.tobytes())
        im.save(os.path.join(d, f'{name}.png'))

def write_side_fixtures(d):
    """Same three files per fixture as write_fixtures, for the profile view."""
    os.makedirs(d, exist_ok=True)
    for name, fx in SIDE_FIXTURES.items():
        cfg, pose, outfit = (fx + ('hoodie',))[:3]
        im = hero_side(**cfg, pose=pose, outfit=outfit)
        with open(os.path.join(d, f'{name}.json'), 'w') as f: json.dump({**cfg, 'pose': pose, 'outfit': outfit}, f, indent=1, sort_keys=True)
        with open(os.path.join(d, f'{name}.rgba'), 'wb') as f: f.write(im.tobytes())
        im.save(os.path.join(d, f'{name}.png'))

def write_contact(d, scale=3):
    """Contact sheets for eyeballing: the five SHEET looks through every pose, front (contact.png) and side
    (contact-side.png), plus the pyjamas; one row per look."""
    os.makedirs(d, exist_ok=True)
    def sheet(poses, draw, name):
        cols = len(poses) + 1
        im = Image.new('RGBA', (cols * (W + 4) * scale, len(SHEET) * (H + 4) * scale), (43, 53, 72, 255))
        for r, (look, cfg) in enumerate(SHEET.items()):
            for i, p in enumerate(poses + [None]):
                sp = draw(**cfg, pose=p or poses[0], outfit='hoodie' if p else 'pj').resize((W * scale, H * scale), Image.NEAREST)
                im.alpha_composite(sp, (i * (W + 4) * scale + 2 * scale, r * (H + 4) * scale + 2 * scale))
        im.save(os.path.join(d, name))
    sheet(POSES, hero, 'contact.png')
    sheet(SIDE_POSES, hero_side, 'contact-side.png')

if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == '--fixtures': write_fixtures(args[1])
    elif len(args) == 2 and args[0] == '--side-fixtures': write_side_fixtures(args[1])
    elif len(args) == 2 and args[0] == '--contact': write_contact(args[1])
    else: print('usage: hero_gen.py --fixtures DIR | --side-fixtures DIR | --contact DIR', file=sys.stderr); sys.exit(2)
