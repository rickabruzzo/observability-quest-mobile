"""Reference VGA hero generator — the sprite Rick approved on the design canvas 2026-11-10.

This is the normative implementation: js/engine/hero.js must match it pixel for pixel
(golden fixtures in tests/fixtures/hero). Plan task 2 adds OPTIONS/POSES/WALK, pose support
and the --fixtures CLI; tools/tests/test_hero_gen.py covers it.
"""
from PIL import Image
import json, sys, os

W, H = 28, 72

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
SIT_DY = 20
# per-pose offsets applied to the idle masks: (legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy)
WALK = {'idle': (0, 0, 0, 0, 0, 0, 0), 'walk1': (-1, 1, -2, 2, 0, 1, -1), 'walk2': (0, 0, 0, 0, 1, 0, 0),
        'walk3': (1, -1, 2, -2, 0, -1, 1), 'walk4': (0, 0, 0, 0, 1, 0, 0)}
PRESETS = {
    'masc': dict(body='masc', skin=0, hair='black', style='standard', beard='short', hoodie='ink', jeans='indigo', glasses='none'),
    'fem': dict(body='fem', skin=1, hair='brown', style='long', beard='none', hoodie='honey', jeans='black', glasses='glasses'),
    'nb': dict(body='nb', skin=0, hair='violet', style='mohawk', beard='none', hoodie='teal', jeans='grey', glasses='glasses'),
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
GLASSES = (30, 30, 42, 255)                 # dark frames: they must read as glasses on every skin tone
EYE_WHITE = hexc('#F2F2F2')
# The Honeycomb logomark on the hoodie's chest: assets/hc_logomark.png taken down to 4x4 sprite pixels —
# the big blue hexagon top right, green beside it, orange at the left, honey below. Brand colours.
# High on the chest, wearer's right of the drawstrings.
HC_MARK = {'blue': '#0298EC', 'green': '#64BA00', 'orange': '#F96E10', 'honey': '#FFB000'}
HC_MARK_PIXELS = [(11, 23, 'blue'), (12, 23, 'blue'), (10, 24, 'green'), (11, 24, 'blue'), (12, 24, 'blue'),
                  (9, 25, 'orange'), (10, 25, 'green'), (10, 26, 'honey')]

class Canvas:
    def __init__(self):
        self.part = [[None] * W for _ in range(H)]   # part id per pixel
        self.col = [[None] * W for _ in range(H)]    # final colour
        self.oy = 0                                  # vertical offset for fills/px (walk bob)
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
    # torso spans, arm columns, leg columns, shoe columns
    'masc': dict(shoulder=(6, 21), arm_l=(5, 7), arm_r=(20, 22), torso=(8, 19), waist=(8, 19), hip=(8, 19),
                 leg_l=(8, 12), leg_r=(15, 19), gap=(13, 14), shoe_l=(6, 12), shoe_r=(15, 21), neck=(12, 15), head_rx=5.6),
    'fem':  dict(shoulder=(7, 20), arm_l=(6, 7), arm_r=(20, 21), torso=(8, 19), waist=(9, 18), hip=(8, 19),
                 leg_l=(9, 12), leg_r=(15, 18), gap=(13, 14), shoe_l=(7, 12), shoe_r=(15, 20), neck=(12, 15), head_rx=5.3),
    'nb':   dict(shoulder=(6, 21), arm_l=(5, 7), arm_r=(20, 22), torso=(8, 19), waist=(9, 18), hip=(8, 19),
                 leg_l=(8, 12), leg_r=(15, 19), gap=(13, 14), shoe_l=(6, 12), shoe_r=(15, 21), neck=(12, 15), head_rx=5.5),
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
    cx = 13.5
    legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob, armL_dy, armR_dy = WALK.get(pose, WALK['idle'])
    if sit: bob = SIT_DY                                            # the whole upper body sits lower

    # ---- legs & shoes (back; never bob) ----
    leg_top, leg_bot = 45, 66
    c.oy = 0
    if not sit:                                                     # sitting up: the legs are under the blanket
        c.fill('legL', rect(b['leg_l'][0] + legL_dx, leg_top, b['leg_l'][1] + legL_dx, leg_bot))
        c.fill('legR', rect(b['leg_r'][0] + legR_dx, leg_top, b['leg_r'][1] + legR_dx, leg_bot))
        c.fill('shoeL', rect(b['shoe_l'][0] + shoeL_dx, 66, b['shoe_l'][1] + shoeL_dx, 71))
        c.fill('shoeR', rect(b['shoe_r'][0] + shoeR_dx, 66, b['shoe_r'][1] + shoeR_dx, 71))
        # crotch: jeans continuous above row 52
        c.fill('legL', rect(b['hip'][0], leg_top, 13, 51)); c.fill('legR', rect(14, leg_top, b['hip'][1], 51))

    # ---- everything above the legs bobs with the walk ----
    c.oy = bob
    # ---- hood (behind neck; pyjamas have none) ----
    if not pj: c.fill('hood', rect(9, 18, 18, 22))
    # ---- back hair: the mass behind the head and neck (the body is drawn over it) ----
    if style == 'shoulder': c.fill('hair', ellipse(cx, 10.0, b['head_rx'] + 2.6, 8.0) + rect(6, 10, 21, 21))
    elif style == 'long': c.fill('hair', ellipse(cx, 10.0, b['head_rx'] + 2.9, 8.2) + rect(5, 10, 22, 23))
    # ---- torso ----
    for y in range(20, 46):
        if y <= 21: span = (b['shoulder'][0] + (21 - y), b['shoulder'][1] - (21 - y))
        elif y <= 29: span = (b['torso'][0], b['torso'][1])
        elif y <= 38: span = (b['waist'][0], b['waist'][1])
        else: span = (b['hip'][0], b['hip'][1])
        c.fill('torso', rect(span[0], y, span[1], y))
    # arms (each swings by its own dy)
    c.fill('armL', rect(b['arm_l'][0], 22 + armL_dy, b['arm_l'][1], 43 + armL_dy)); c.fill('armR', rect(b['arm_r'][0], 22 + armR_dy, b['arm_r'][1], 43 + armR_dy))
    c.fill('handL', rect(b['arm_l'][0], 44 + armL_dy, b['arm_l'][1], 47 + armL_dy)); c.fill('handR', rect(b['arm_r'][0], 44 + armR_dy, b['arm_r'][1], 47 + armR_dy))
    # ---- neck & head ----
    c.fill('neck', rect(b['neck'][0], 17, b['neck'][1], 20))
    c.fill('head', ellipse(cx, 11.5, b['head_rx'], 6.8))
    c.fill('head', rect(8, 15, 19, 16)); c.fill('head', rect(9, 17, 18, 17)); c.fill('head', rect(11, 18, 16, 18))  # jaw & chin
    c.fill('head', rect(8, 9, 19, 14))                              # cheeks out to the ears: no gap between ear and face
    c.fill('earL', rect(7, 10, 7, 12)); c.fill('earR', rect(20, 10, 20, 12))
    # ---- hair in front of the head ----
    # standard: a cap with short sideburns, all inside the head's outline. shoulder/long: the cap, plus locks that
    # fall in front of the shoulders (the mass behind the head was filled before the body). mohawk: a flat-topped
    # ridge on a buzzed scalp — the head stays round. fro: one big round mass.
    hm = []
    c.fill('head', ellipse(cx, 7.0, b['head_rx'] + 0.8, 3.8) + rect(8, 6, 19, 8))       # a full round skull under any hair
    if style == 'mohawk':
        hm += rect(12, 1, 15, 5)                                     # the ridge stops above the forehead
    elif style == 'fro':
        hm = [p for p in ellipse(cx, 8.0, b['head_rx'] + 4.2, 8.2) if not (p[1] >= 8 and 9 <= p[0] <= 18)]
    else:
        hm += ellipse(cx, 6.2, b['head_rx'] + 0.9, 4.2)             # crown, with some height to it
        hm += rect(8, 6, 19, 8)                                      # down to the temples
        if style == 'standard':
            hm += rect(8, 9, 8, 11) + rect(19, 9, 19, 11)            # sideburns, inside the head's outline
        elif style == 'shoulder':
            hm += rect(6, 6, 8, 21) + rect(19, 6, 21, 21)            # locks to the shoulders, three wide
        elif style == 'long':
            hm += rect(5, 7, 8, 31) + rect(19, 7, 22, 31) + rect(6, 32, 8, 33) + rect(19, 32, 21, 33)   # down over the chest
        hm = [p for p in hm if not (p[1] >= 7 and 9 <= p[0] <= 18)]  # hairline: two rows of forehead above the brows
    c.fill('hair', hm)
    # ---- shading ----
    c.shade('legL', jean_r); c.shade('legR', jean_r)
    c.shade('shoeL', shoe_r, hl=1, sh=1); c.shade('shoeR', shoe_r, hl=1, sh=1)
    c.shade('hood', {'L': hood_r['S'], 'B': hood_r['D'], 'S': hood_r['D'], 'D': hood_r['D']}, hl=0, sh=0, top_light=False)
    c.shade('torso', hood_r, hl=2, sh=3); c.shade('armL', hood_r, hl=1, sh=1); c.shade('armR', hood_r, hl=1, sh=2)
    c.shade('handL', skin_r, hl=1, sh=1); c.shade('handR', skin_r, hl=1, sh=1)
    c.shade('neck', {'L': skin_r['S'], 'B': skin_r['S'], 'S': skin_r['D'], 'D': skin_r['D']}, hl=0, sh=1, top_light=False)
    c.shade('head', skin_r, hl=1, sh=2); c.shade('earL', skin_r, hl=0, sh=0); c.shade('earR', skin_r, hl=0, sh=1)
    c.shade('hair', hair_r, hl=2, sh=3)
    # pyjama stripes: every third row of the cloth
    if pj:
        stripe = hexc(PJ['stripe'])
        for y in range(H):
            if y % 3: continue
            for x in range(W):
                if c.part[y][x] in ('torso', 'armL', 'armR', 'legL', 'legR'): c.col[y][x] = stripe
    # ---- details ----
    # inner arm lines; the hoodie also has a hem, a pocket and drawstrings
    for y in range(23, 44):
        c.px(b['torso'][0], y, hood_r['S']); c.px(b['torso'][1], y, hood_r['D'])
    if not pj:
        for x in range(b['hip'][0], b['hip'][1] + 1): c.px(x, 45, hood_r['D'])
        px0, px1 = b['waist'][0] + 2, b['waist'][1] - 2
        for x in range(px0, px1 + 1): c.px(x, 37, hood_r['S']); c.px(x, 43, hood_r['S'])
        for y in range(37, 44): c.px(px0, y, hood_r['S']); c.px(px1, y, hood_r['S'])
        for y in range(22, 31): c.px(12, y, hood_r['L']); c.px(15, y, hood_r['L'])
        for (x, y, k) in HC_MARK_PIXELS: c.px(x, y, hexc(HC_MARK[k]))            # Honeycomb-branded hoodie
    # knees
    if not sit:
        for x in range(b['leg_l'][0] + 1, b['leg_l'][1]): c.px(x, 57, jean_r['S'])
        for x in range(b['leg_r'][0] + 1, b['leg_r'][1]): c.px(x, 57, jean_r['S'])
    # face
    brow = hair_r['D']
    for x in (9, 10, 11): c.px(x, 9, brow)
    for x in (16, 17, 18): c.px(x, 9, brow)
    c.px(10, 10, EYE_WHITE); c.px(11, 10, OUTLINE); c.px(17, 10, EYE_WHITE); c.px(16, 10, OUTLINE)
    c.px(14, 12, skin_r['S']); c.px(14, 13, skin_r['S']); c.px(13, 13, skin_r['S'])
    for x in (12, 13, 14, 15): c.px(x, 15, skin_r['D'])
    # hair texture: buzzed sides for the mohawk, dark curls dotted through the fro
    if style == 'mohawk':
        buzz = tuple((a * 11 + h * 9) // 20 for a, h in zip(skin_r['B'], hair_r['B']))      # stubble: skin showing through
        for y in range(4, 9):
            for x in range(7, 21):
                if c.part[y + c.oy][x] == 'head' and not (y >= 7 and 9 <= x <= 18): c.px(x, y, buzz)
    if style == 'fro':
        for (x, y) in [(9, 3), (16, 2), (6, 7), (21, 6), (12, 5), (18, 5), (5, 12), (22, 11), (8, 14), (19, 14)]:
            if c.part[y + c.oy][x] == 'hair': c.px(x, y, hair_r['D'])        # a few darker curls
    # beard (takes the hair colour): short = stubble over the jaw with a solid chin; long = full, down the chest
    if beard == 'short':
        # close-cropped, inside the face: sideburns, a moustache, a frame round the mouth, the jaw and a narrow chin
        pts = rect(9, 13, 9, 15) + rect(18, 13, 18, 15)            # sideburns
        pts += rect(11, 14, 16, 14)                                 # moustache (the mouth is row 15)
        pts += [(11, 15), (16, 15), (10, 16), (11, 16), (16, 16), (17, 16)]   # round the mouth to the jaw
        pts += rect(10, 17, 17, 17) + rect(12, 18, 15, 18)          # jaw line, chin brought in a pixel
        for (x, y) in pts: c.px(x, y, beard_r['S'] if x >= 16 else beard_r['B'])
    elif beard == 'long':
        for (x, y) in rect(9, 13, 18, 22):
            if (x, y) in {(12,15),(13,15),(14,15),(15,15)}: continue
            if y >= 19 and (x < 10 + (y - 19) or x > 17 - (y - 19)): continue
            c.px(x, y, beard_r['S'] if x >= 17 else beard_r['B'])
        for y in range(13, 17): c.px(9, y, beard_r['L'])
    # glasses: a dark round frame about each eye (the eye and a row of skin show inside), a bridge, arms to the ears
    if glasses == 'glasses':
        frame = []
        for x0 in (9, 15):                                                                # lenses over the eyes at 10-11 and 16-17
            frame += [(x0 + 1, 8), (x0 + 2, 8), (x0 + 1, 11), (x0 + 2, 11), (x0, 9), (x0, 10), (x0 + 3, 9), (x0 + 3, 10)]
            for x in (x0 + 1, x0 + 2): c.px(x, 9, skin_r['L'])                            # the brow sits behind the lens
        frame += [(13, 9), (14, 9), (8, 9), (19, 9)]                                      # bridge, arms
        for (x, y) in frame: c.px(x, y, GLASSES)
    c.oy = 0
    c.outline()
    return c.image()

# ---- profile view (facing right; the game mirrors it for left) --------------------------------------
# DRAFT for Rick's approval (2026-11-11): not ported to the game yet. Standing plus a four-frame walk:
# stride, passing, stride with the other leg forward, passing.
SIDE_POSES = ['stand', 'step1', 'step2', 'step3', 'step4']
#            (front-leg swing, back-leg swing, bob, arm swing)   swing = px the foot leads (+) or trails (-) the hip
SIDE_WALK = {'stand': (0, 0, 0, 0), 'step1': (5, -5, 0, -3), 'step2': (1, -1, -1, 0), 'step3': (-5, 5, 0, 3), 'step4': (-1, 1, -1, 0)}


def _slant(x0, x1, y0, y1, lean):
    """A limb: columns x0..x1 at the top row, leaning `lean` px by the bottom row."""
    return [(x + round(lean * (y - y0) / max(1, y1 - y0)), y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]


def hero_side(body='masc', skin=0, hair='black', style='standard', beard='none',
              hoodie='ink', jeans='indigo', glasses='none', pose='stand', outfit='hoodie'):
    c = Canvas()
    skin_r = ramp(SKIN[skin], light=1.12, shade=0.8, dark=0.62)
    hair_r = ramp(HAIR[hair], light=1.35, shade=0.7)
    pj = outfit == 'pj'
    hood_r = ramp(PJ['top'] if pj else HOODIE[hoodie]); jean_r = ramp(PJ['bottom'] if pj else JEANS[jeans], light=1.25, shade=0.72)
    shoe_r = skin_r if pj else SHOE
    front, back, bob, arm = SIDE_WALK[pose]
    slim = body == 'fem'
    t0, t1 = (10, 18) if slim else (9, 18)                              # torso, side on

    # legs: the far one first (darker), then the near one; shoes point the way the hero faces
    c.oy = 0
    c.fill('legB', _slant(10, 14, 45, 66, back)); c.fill('shoeB', [(x + back, y) for (x, y) in rect(10, 67, 17, 71)])
    c.fill('legF', _slant(11, 15, 45, 66, front)); c.fill('shoeF', [(x + front, y) for (x, y) in rect(11, 67, 18, 71)])
    c.oy = bob
    # back hair behind the body, hood behind the neck
    if style == 'shoulder': c.fill('hair', rect(7, 8, 12, 21))
    elif style == 'long': c.fill('hair', rect(6, 8, 12, 31))
    if not pj: c.fill('hood', rect(7, 18, 12, 23))
    c.fill('torso', rect(t0, 20, t1, 45) + rect(t0 + 1, 19, t1 - 1, 19))
    c.fill('neck', rect(12, 17, 15, 20))
    # head in profile: skull, face plane, nose, chin
    c.fill('head', ellipse(13.5, 10.5, 5.6, 6.6) + rect(13, 13, 18, 17) + rect(14, 18, 17, 18))
    c.fill('head', [(19, 11), (19, 12), (20, 12), (19, 13)])            # nose
    c.fill('ear', rect(12, 10, 13, 12))
    # hair
    skull = ellipse(13.5, 9.0, 6.2, 6.0)
    if style == 'mohawk':
        hm = rect(9, 1, 17, 5)                                          # the ridge, seen along its length
    elif style == 'fro':
        hm = [p for p in ellipse(12.0, 8.0, 9.2, 8.4) if not (p[0] >= 15 and p[1] >= 8)]
    else:
        hm = [p for p in skull if p[1] <= 6 or p[0] <= 11]              # crown and the back of the head
        hm = [p for p in hm if not (p[0] >= 13 and p[1] >= 7)]          # forehead and face stay clear
        if style == 'standard': hm += rect(11, 7, 12, 9)                # sideburn in front of the ear
        elif style == 'shoulder': hm += rect(7, 8, 11, 21) + rect(12, 7, 12, 9)
        elif style == 'long': hm += rect(6, 8, 11, 31) + rect(12, 7, 12, 9)
    c.fill('hair', hm)
    # the near arm, over the torso; it swings against the legs
    c.fill('arm', _slant(11, 15, 22, 43, arm)); c.fill('hand', [(x + arm, y) for (x, y) in rect(11, 44, 15, 47)])

    c.shade('legB', {k: jean_r['S'] if k != 'D' else jean_r['D'] for k in 'LBSD'}, hl=0, sh=1, top_light=False)
    c.shade('shoeB', {k: shoe_r['S'] for k in 'LBSD'}, hl=0, sh=0, top_light=False)
    c.shade('legF', jean_r, hl=1, sh=1, top_light=False); c.shade('shoeF', shoe_r, hl=1, sh=1)
    c.shade('hood', {'L': hood_r['S'], 'B': hood_r['D'], 'S': hood_r['D'], 'D': hood_r['D']}, hl=0, sh=0, top_light=False)
    c.shade('torso', hood_r, hl=1, sh=2, top_light=False)
    c.shade('arm', {'L': hood_r['S'], 'B': hood_r['B'], 'S': hood_r['S'], 'D': hood_r['D']}, hl=1, sh=1, top_light=False)
    c.shade('hand', skin_r, hl=1, sh=1, top_light=False)
    c.shade('neck', {'L': skin_r['S'], 'B': skin_r['S'], 'S': skin_r['D'], 'D': skin_r['D']}, hl=0, sh=1, top_light=False)
    c.shade('head', skin_r, hl=1, sh=1); c.shade('ear', {k: skin_r['S'] for k in 'LBSD'}, hl=0, sh=0, top_light=False)
    c.shade('hair', hair_r, hl=2, sh=2)
    if pj:
        stripe = hexc(PJ['stripe'])
        for y in range(H):
            if y % 3: continue
            for x in range(W):
                if c.part[y][x] in ('torso', 'arm', 'legF', 'legB'): c.col[y][x] = stripe
    else:
        for x in range(t0, t1 + 1): c.px(x, 45, hood_r['D'])            # hem
        for (x, y, k) in HC_MARK_PIXELS: c.px(x + 5, y, hexc(HC_MARK[k]))   # the mark, on the chest's leading side
    if style == 'mohawk':
        buzz = tuple((a * 11 + h * 9) // 20 for a, h in zip(skin_r['B'], hair_r['B']))
        for (x, y) in skull:
            if (y <= 6 or x <= 11) and not (x >= 13 and y >= 7) and c.part[y + c.oy][x] == 'head': c.px(x, y, buzz)
    # face, looking right
    for x in (16, 17, 18): c.px(x, 9, hair_r['D'])
    c.px(17, 10, EYE_WHITE); c.px(18, 10, OUTLINE)
    c.px(17, 15, skin_r['D']); c.px(18, 15, skin_r['D'])
    beard_r = ramp(HAIR[hair], light=1.3, shade=0.7)
    if beard == 'short':
        for (x, y) in rect(13, 14, 13, 16) + [(16, 14), (17, 14), (18, 14)] + rect(14, 16, 18, 17) + rect(14, 18, 17, 18):
            if (x, y) not in ((17, 15), (18, 15)): c.px(x, y, beard_r['B'])
    elif beard == 'long':
        for (x, y) in rect(13, 13, 18, 23):
            if (x, y) in ((17, 15), (18, 15)) or (y <= 13 and x >= 15): continue
            if y >= 20 and x < 13 + (y - 20): continue
            c.px(x, y, beard_r['S'] if x <= 13 else beard_r['B'])
    if glasses == 'glasses':
        for (x, y) in [(17, 8), (18, 8), (17, 11), (18, 11), (16, 9), (16, 10), (19, 9), (19, 10)] + [(x, 9) for x in range(12, 16)]:
            c.px(x, y, GLASSES)
        c.px(17, 9, skin_r['L']); c.px(18, 9, skin_r['L'])
    c.oy = 0
    c.outline()
    return c.image()


def write_fixtures(d):
    """<name>.json (config + pose), <name>.rgba (28*72*4 bytes row-major), <name>.png for every fixture."""
    os.makedirs(d, exist_ok=True)
    for name, fx in FIXTURES.items():
        cfg, pose, outfit = (fx + ('hoodie',))[:3]
        im = hero(**cfg, pose=pose, outfit=outfit)
        with open(os.path.join(d, f'{name}.json'), 'w') as f: json.dump({**cfg, 'pose': pose, 'outfit': outfit}, f, indent=1, sort_keys=True)
        with open(os.path.join(d, f'{name}.rgba'), 'wb') as f: f.write(im.tobytes())
        im.save(os.path.join(d, f'{name}.png'))

def write_contact(d, scale=6):
    """Contact sheet of every fixture at `scale` for eyeballing."""
    os.makedirs(d, exist_ok=True)
    names = list(FIXTURES)
    sheet = Image.new('RGBA', (len(names) * (W + 6) * scale, (H + 6) * scale), (43, 53, 72, 255))
    for i, n in enumerate(names):
        cfg, pose, outfit = (FIXTURES[n] + ('hoodie',))[:3]
        im = hero(**cfg, pose=pose, outfit=outfit).resize((W * scale, H * scale), Image.NEAREST)
        sheet.alpha_composite(im, (i * (W + 6) * scale + 3 * scale, 3 * scale))
    sheet.save(os.path.join(d, 'contact.png'))

if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == '--fixtures': write_fixtures(args[1])
    elif len(args) == 2 and args[0] == '--contact': write_contact(args[1])
    else: print('usage: hero_gen.py --fixtures DIR | --contact DIR', file=sys.stderr); sys.exit(2)
