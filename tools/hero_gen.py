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
    'body': ['masc', 'fem', 'nb'], 'skin': [0, 1, 2, 3, 4],
    'hair': ['black', 'brown', 'blonde', 'ginger', 'violet'],
    'length': ['buzz', 'short', 'medium', 'long'],
    'style': ['straight', 'curly', 'spiky', 'locs', 'undercut'],
    'beard': ['none', 'stubble', 'goatee', 'full', 'big'],
    'beardCol': ['black', 'brown', 'blonde', 'ginger', 'violet'],
    'hoodie': ['honey', 'ink', 'teal', 'indigo', 'lime'],
    'jeans': ['indigo', 'black', 'light', 'grey', 'khaki'],
    'glasses': ['none', 'round', 'square', 'thick'],
    'hold': ['laptop', 'coffee', 'phone', 'duck', 'pager'],
}
CONFIG_KEYS = list(OPTIONS)
POSES = ['idle', 'walk1', 'walk2', 'walk3', 'walk4']
# per-pose offsets applied to the idle masks: (legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob_dy, armL_dy, armR_dy)
WALK = {'idle': (0, 0, 0, 0, 0, 0, 0), 'walk1': (-1, 1, -2, 2, 0, 1, -1), 'walk2': (0, 0, 0, 0, 1, 0, 0),
        'walk3': (1, -1, 2, -2, 0, -1, 1), 'walk4': (0, 0, 0, 0, 1, 0, 0)}
PRESETS = {
    'masc': dict(body='masc', skin=1, hair='black', length='short', style='straight', beard='stubble', beardCol='black',
                 hoodie='ink', jeans='indigo', glasses='none', hold='laptop'),
    'fem': dict(body='fem', skin=2, hair='brown', length='long', style='straight', beard='none', beardCol='brown',
                hoodie='honey', jeans='black', glasses='round', hold='coffee'),
    'nb': dict(body='nb', skin=0, hair='violet', length='medium', style='undercut', beard='none', beardCol='violet',
               hoodie='teal', jeans='grey', glasses='square', hold='phone'),
}
FIXTURES = {
    'masc-idle': (PRESETS['masc'], 'idle'),
    'masc-walk1': (PRESETS['masc'], 'walk1'), 'masc-walk2': (PRESETS['masc'], 'walk2'),
    'masc-walk3': (PRESETS['masc'], 'walk3'), 'masc-walk4': (PRESETS['masc'], 'walk4'),
    'fem-idle': (PRESETS['fem'], 'idle'), 'nb-idle': (PRESETS['nb'], 'idle'),
    'var-full-beard': (dict(body='masc', skin=3, hair='black', length='buzz', style='straight', beard='full', beardCol='black',
                            hoodie='honey', jeans='khaki', glasses='thick', hold='duck'), 'idle'),
    'var-locs': (dict(body='nb', skin=2, hair='blonde', length='long', style='locs', beard='goatee', beardCol='blonde',
                      hoodie='lime', jeans='indigo', glasses='round', hold='laptop'), 'idle'),
    'var-curly': (dict(body='fem', skin=4, hair='ginger', length='medium', style='curly', beard='none', beardCol='ginger',
                       hoodie='indigo', jeans='light', glasses='none', hold='pager'), 'idle'),
}

def hexc(s):
    s = s.lstrip('#'); return tuple(int(s[i:i+2], 16) for i in (0, 2, 4)) + (255,)

def ramp(base, light=1.22, shade=0.74, dark=0.5):
    r, g, b, _ = hexc(base)
    f = lambda k: (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), 255)
    return {'L': f(light), 'B': (r, g, b, 255), 'S': f(shade), 'D': f(dark)}

OUTLINE = hexc('#1a1424')
SKIN = ['#F6D8BE', '#E5B48E', '#C2865A', '#8F5B38', '#5A3826']
HAIR = {'black': '#262430', 'brown': '#5C3A1E', 'blonde': '#D9B85A', 'ginger': '#C0522A', 'violet': '#7B4FB8'}
HOODIE = {'honey': '#E8A000', 'ink': '#2B3647', 'teal': '#1F8FD6', 'indigo': '#51368D', 'lime': '#5FA81A'}
JEANS = {'indigo': '#34497E', 'black': '#23232A', 'light': '#7F9CC4', 'grey': '#5B5F66', 'khaki': '#B59B6A'}
SHOE = ramp('#2E2E36', light=1.6, shade=0.8)
LAPTOP = ramp('#8A94A6', light=1.25, shade=0.7)
EYE_WHITE = hexc('#F2F2F2')

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

def hero(body='masc', skin=1, hair='black', length='short', style='straight', beard='none', beardCol=None,
         hoodie='ink', jeans='indigo', glasses='none', hold='laptop', pose='idle'):
    b = BODIES[body]; c = Canvas()
    skin_r = ramp(SKIN[skin], light=1.12, shade=0.8, dark=0.62)
    hair_r = ramp(HAIR[hair], light=1.35, shade=0.7)
    hood_r = ramp(HOODIE[hoodie]); jean_r = ramp(JEANS[jeans], light=1.25, shade=0.72)
    beard_r = ramp(HAIR[beardCol or hair], light=1.3, shade=0.7)
    cx = 13.5
    legL_dx, legR_dx, shoeL_dx, shoeR_dx, bob, armL_dy, armR_dy = WALK[pose]

    # ---- legs & shoes (back; never bob) ----
    leg_top, leg_bot = 45, 66
    c.oy = 0
    c.fill('legL', rect(b['leg_l'][0] + legL_dx, leg_top, b['leg_l'][1] + legL_dx, leg_bot))
    c.fill('legR', rect(b['leg_r'][0] + legR_dx, leg_top, b['leg_r'][1] + legR_dx, leg_bot))
    c.fill('shoeL', rect(b['shoe_l'][0] + shoeL_dx, 66, b['shoe_l'][1] + shoeL_dx, 71))
    c.fill('shoeR', rect(b['shoe_r'][0] + shoeR_dx, 66, b['shoe_r'][1] + shoeR_dx, 71))
    # crotch: jeans continuous above row 52
    c.fill('legL', rect(b['hip'][0], leg_top, 13, 51)); c.fill('legR', rect(14, leg_top, b['hip'][1], 51))

    # ---- everything above the legs bobs with the walk ----
    c.oy = bob
    # ---- hood (behind neck) ----
    c.fill('hood', rect(9, 18, 18, 22))
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
    c.fill('earL', rect(7, 10, 7, 12)); c.fill('earR', rect(20, 10, 20, 12))
    # ---- hair ----
    hm = []
    hm += ellipse(cx, 7.0, b['head_rx'] + 0.8, 3.8)          # crown
    hm += rect(8, 6, 19, 8)                                   # band over forehead
    if style == 'spiky': hm += [(9,2),(12,1),(15,2),(18,3),(11,2),(14,1),(17,2)]
    if style == 'curly': hm += ellipse(cx, 6.5, b['head_rx'] + 1.8, 4.6)
    if style == 'undercut': hm = [p for p in hm if not (p[1] >= 7 and (p[0] <= 8 or p[0] >= 19))] + rect(9, 2, 18, 4)
    side_to = {'buzz': 7, 'short': 11, 'medium': 15, 'long': 30}[length]
    if style != 'undercut' and length != 'buzz':
        hm += rect(6, 7, 7, side_to) + rect(20, 7, 21, side_to)
        if length == 'long': hm += rect(5, 12, 7, side_to) + rect(20, 12, 22, side_to)
        if style == 'locs':
            hm = [p for p in hm if not (p[1] > 9 and p[0] in (6, 21) and p[1] % 2 == 0)]
    if length == 'buzz': hm = [p for p in hm if p[1] >= 4]
    c.fill('hair', hm)
    # ---- shading ----
    c.shade('legL', jean_r); c.shade('legR', jean_r)
    c.shade('shoeL', SHOE, hl=1, sh=1); c.shade('shoeR', SHOE, hl=1, sh=1)
    c.shade('hood', {'L': hood_r['S'], 'B': hood_r['D'], 'S': hood_r['D'], 'D': hood_r['D']}, hl=0, sh=0, top_light=False)
    c.shade('torso', hood_r, hl=2, sh=3); c.shade('armL', hood_r, hl=1, sh=1); c.shade('armR', hood_r, hl=1, sh=2)
    c.shade('handL', skin_r, hl=1, sh=1); c.shade('handR', skin_r, hl=1, sh=1)
    c.shade('neck', {'L': skin_r['S'], 'B': skin_r['S'], 'S': skin_r['D'], 'D': skin_r['D']}, hl=0, sh=1, top_light=False)
    c.shade('head', skin_r, hl=1, sh=2); c.shade('earL', skin_r, hl=0, sh=0); c.shade('earR', skin_r, hl=0, sh=1)
    c.shade('hair', hair_r, hl=2, sh=3)
    # ---- details ----
    # inner arm lines, hem, pocket, drawstrings
    for y in range(23, 44):
        c.px(b['torso'][0], y, hood_r['S']); c.px(b['torso'][1], y, hood_r['D'])
    for x in range(b['hip'][0], b['hip'][1] + 1): c.px(x, 45, hood_r['D'])
    px0, px1 = b['waist'][0] + 2, b['waist'][1] - 2
    for x in range(px0, px1 + 1): c.px(x, 37, hood_r['S']); c.px(x, 43, hood_r['S'])
    for y in range(37, 44): c.px(px0, y, hood_r['S']); c.px(px1, y, hood_r['S'])
    for y in range(22, 31): c.px(12, y, hood_r['L']); c.px(15, y, hood_r['L'])
    # knees & leg gap
    for x in range(b['leg_l'][0] + 1, b['leg_l'][1]): c.px(x, 57, jean_r['S'])
    for x in range(b['leg_r'][0] + 1, b['leg_r'][1]): c.px(x, 57, jean_r['S'])
    # face
    brow = hair_r['D']
    for x in (10, 11, 12): c.px(x, 9, brow)
    for x in (15, 16, 17): c.px(x, 9, brow)
    c.px(10, 10, EYE_WHITE); c.px(11, 10, OUTLINE); c.px(16, 10, EYE_WHITE); c.px(15, 10, OUTLINE)
    c.px(14, 12, skin_r['S']); c.px(14, 13, skin_r['S']); c.px(13, 13, skin_r['S'])
    for x in (12, 13, 14, 15): c.px(x, 15, skin_r['D'])
    # beard
    if beard == 'stubble':
        for (x, y) in [(10,14),(12,16),(14,17),(16,14),(17,16),(11,17),(15,16),(9,13),(18,13),(13,17)]: c.px(x, y, skin_r['D'])
    elif beard == 'goatee':
        for (x, y) in rect(12, 16, 15, 18): c.px(x, y, beard_r['B'])
        c.px(12, 16, beard_r['L'])
    elif beard in ('full', 'big'):
        bot = 18 if beard == 'full' else 22
        for (x, y) in rect(9, 13, 18, bot):
            if (x, y) in {(12,15),(13,15),(14,15),(15,15)}: continue
            if y >= 19 and (x < 10 + (y - 19) or x > 17 - (y - 19)): continue
            c.px(x, y, beard_r['S'] if x >= 17 else beard_r['B'])
        for y in range(13, 17): c.px(9, y, beard_r['L'])
    # glasses
    g = hexc('#C9D2E0') if glasses in ('round', 'square') else OUTLINE
    if glasses != 'none':
        pts = [(9,10),(12,10),(14,10),(17,10),(13,10)] + ([(9,11),(12,11),(14,11),(17,11)] if glasses != 'round' else [(10,11),(11,11),(15,11),(16,11)])
        if glasses == 'thick': pts += [(10,9),(11,9),(15,9),(16,9)]
        for (x, y) in pts: c.px(x, y, g)
    # held item (viewer's left = hero's right hand side) rides with that arm; the pager sits on the belt
    c.oy = bob + (0 if hold == 'pager' else armL_dy)
    if hold == 'laptop':
        for (x, y) in rect(0, 33, 6, 42): c.px(x, y, LAPTOP['B'])
        for x in range(0, 7): c.px(x, 33, LAPTOP['L']); c.px(x, 42, LAPTOP['S'])
        for y in range(33, 43): c.px(6, y, LAPTOP['S'])
        for (x, y) in [(2,37),(3,37),(2,38),(3,38)]: c.px(x, y, hexc('#FFB000'))
        for (x, y) in rect(0, 33, 6, 42):
            if x == 0 or y == 33 or y == 42: c.px(x, y, OUTLINE)
    elif hold == 'coffee':
        for (x, y) in rect(3, 42, 6, 47): c.px(x, y, hexc('#F4F4F4'))
        for x in range(3, 7): c.px(x, 42, hexc('#5C3A1E'))
        c.px(2, 44, hexc('#F4F4F4')); c.px(2, 45, hexc('#F4F4F4'))
    elif hold == 'phone':
        for (x, y) in rect(3, 41, 6, 48): c.px(x, y, OUTLINE)
        for (x, y) in rect(4, 42, 5, 47): c.px(x, y, hexc('#64BA00'))
    elif hold == 'duck':
        for (x, y) in rect(2, 42, 6, 46): c.px(x, y, hexc('#F7D21B'))
        c.px(1, 44, hexc('#F96E10')); c.px(0, 44, hexc('#F96E10')); c.px(4, 43, OUTLINE)
    elif hold == 'pager':
        for (x, y) in rect(7, 44, 11, 47): c.px(x, y, OUTLINE)
        for (x, y) in rect(8, 45, 10, 46): c.px(x, y, hexc('#64BA00'))
    c.oy = 0
    c.outline()
    return c.image()

def write_fixtures(d):
    """<name>.json (config + pose), <name>.rgba (28*72*4 bytes row-major), <name>.png for every fixture."""
    os.makedirs(d, exist_ok=True)
    for name, (cfg, pose) in FIXTURES.items():
        im = hero(**cfg, pose=pose)
        with open(os.path.join(d, f'{name}.json'), 'w') as f: json.dump({**cfg, 'pose': pose}, f, indent=1, sort_keys=True)
        with open(os.path.join(d, f'{name}.rgba'), 'wb') as f: f.write(im.tobytes())
        im.save(os.path.join(d, f'{name}.png'))

def write_contact(d, scale=6):
    """Contact sheet of every fixture at `scale` for eyeballing."""
    os.makedirs(d, exist_ok=True)
    names = list(FIXTURES)
    sheet = Image.new('RGBA', (len(names) * (W + 6) * scale, (H + 6) * scale), (43, 53, 72, 255))
    for i, n in enumerate(names):
        cfg, pose = FIXTURES[n]
        im = hero(**cfg, pose=pose).resize((W * scale, H * scale), Image.NEAREST)
        sheet.alpha_composite(im, (i * (W + 6) * scale + 3 * scale, 3 * scale))
    sheet.save(os.path.join(d, 'contact.png'))

if __name__ == '__main__':
    args = sys.argv[1:]
    if len(args) == 2 and args[0] == '--fixtures': write_fixtures(args[1])
    elif len(args) == 2 and args[0] == '--contact': write_contact(args[1])
    else: print('usage: hero_gen.py --fixtures DIR | --contact DIR', file=sys.stderr); sys.exit(2)
