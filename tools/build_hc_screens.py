#!/usr/bin/env python3
"""Scenario 1's Honeycomb screens, drawn as VGA pixel art: assets/screens/ch1_hc_0..2.png + ch1_hc.json.

They are not screenshots and do not try to match the product pixel for pixel. They are drawn from Honeycomb's
own agent-observability demo (Innovation Week 2026) so that someone who has used the product recognises it and
someone who has not can see what using it looks like:

  0  Canvas: an automatic investigation, already filled in (graphs, the worst conversations, a summary)
  1  Agent Timeline: one conversation, every agent, LLM call and tool call in order
  2  one LLM call opened: how many tokens went in, and the tool result that put them there

Light UI, flat fills, the game's own 5x7 font. No Honeycomb logo is drawn (the logo only ever comes from the
official files in assets/). Run from the project root:  python3 tools/build_hc_screens.py
"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'screens')
FONT_JS = os.path.join(ROOT, 'js', 'intro', 'font5x7.js')
PIC = {'x': 4, 'y': 20, 'w': 188, 'h': 176}        # where the picture sits on the 320x200 scene
W, H = PIC['w'], PIC['h']

PAGE = (244, 245, 247); CARD = (255, 255, 255); LINE = (201, 206, 214); FAINT = (226, 230, 236)
INK = (43, 47, 54); MUTE = (128, 136, 148); GREEK = (190, 196, 206)
BLUE = (49, 88, 184); MID = (120, 160, 228); SKY = (200, 218, 244); LINK = (36, 96, 200)
GREEN = (196, 230, 170); GREEN_D = (104, 168, 80); PURPLE = (123, 92, 196); YELLOW = (245, 184, 61)
ORANGE = (242, 140, 40); RED = (214, 69, 69); NOTE = (252, 222, 110); CHIP = (232, 235, 240)

_GLYPHS = None
# Nine rows instead of seven: the LCD font has no descenders, so its g reads as a 9 at this size.
DESCENDERS = {
    'g': [0, 0, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
    'p': [0, 0, 0b11110, 0b10001, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000],
    'q': [0, 0, 0b01111, 0b10001, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001],
    'y': [0, 0, 0b10001, 0b10001, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
    'j': [0b00001, 0, 0b00011, 0b00001, 0b00001, 0b00001, 0b00001, 0b10001, 0b01110],
}
ARROW = ['#......', '##.....', '#.#....', '#..#...', '#...#..', '#....#.', '#.....#', '#..####', '#.#.#..', '##..#..', '#....#.', '.....#.']


def glyphs():
    """The game's 5x7 font (js/intro/font5x7.js), as 7 row masks per character, bit 4 = left column."""
    global _GLYPHS
    if _GLYPHS is None:
        src = open(FONT_JS).read()
        cols = ''.join(re.findall(r"'([0-9A-F]{10})'", src[:src.index('export const GLYPHS')]))
        assert len(cols) == 95 * 10, len(cols)
        _GLYPHS = {}
        for i in range(95):
            c = [int(cols[i * 10 + k * 2:i * 10 + k * 2 + 2], 16) for k in range(5)]
            _GLYPHS[chr(32 + i)] = [sum(((c[k] >> r) & 1) << (4 - k) for k in range(5)) for r in range(7)]
    return _GLYPHS


def text_width(s, scale=1):
    return (len(s) * 6 - 1) * scale if s else 0


class Pic:
    def __init__(self):
        self.im = Image.new('RGB', (W, H), PAGE); self.px = self.im.load()

    def rect(self, x, y, w, h, fill=None, line=None):
        for yy in range(max(0, y), min(H, y + h)):
            for xx in range(max(0, x), min(W, x + w)):
                edge = xx in (x, x + w - 1) or yy in (y, y + h - 1)
                if line is not None and edge: self.px[xx, yy] = line
                elif fill is not None: self.px[xx, yy] = fill

    def card(self, x, y, w, h): self.rect(x, y, w, h, CARD, LINE)

    def text(self, x, y, s, colour=INK, scale=1):
        g = glyphs()
        for i, ch in enumerate(s):
            rows = DESCENDERS.get(ch) or g.get(ch, g['?'])
            for r in range(len(rows)):
                for c in range(5):
                    if rows[r] >> (4 - c) & 1: self.rect(x + (i * 6 + c) * scale, y + r * scale, scale, scale, colour)
        return x + text_width(s, scale)

    def greek(self, x, y, widths, colour=GREEK, gap=3):
        """Lines of body text too small to read: one 2-px bar per word."""
        for row, ws in enumerate(widths):
            xx = x
            for w in ws: self.rect(xx, y + row * 5, w, 2, colour); xx += w + gap

    def chip(self, x, y, s, fg=INK, bg=CHIP):
        w = text_width(s) + 4
        self.rect(x, y - 1, w, 9, bg); self.text(x + 2, y, s, fg); return x + w

    def spark(self, x, y, w, h, pts, colour):
        """A spiky line chart: pts are heights 0..1 at even steps, joined with vertical runs."""
        last = None
        for i, v in enumerate(pts):
            xx = x + round(i * (w - 1) / (len(pts) - 1)); yy = y + h - 1 - round(v * (h - 1))
            if last is not None:
                lx, ly = last
                for k in range(lx, xx + 1):
                    t = (k - lx) / max(1, xx - lx); self.rect(k, round(ly + (yy - ly) * t), 1, 1, colour)
                for k in range(min(ly, yy), max(ly, yy) + 1): self.rect(xx, k, 1, 1, colour)
            last = (xx, yy)

    def chrome(self, title):
        """The product's frame: a nav rail down the left, a title bar with Share across the top."""
        self.rect(0, 0, W, 12, CARD); self.rect(0, 12, W, 1, LINE)
        self.rect(0, 0, 10, H, CARD); self.rect(10, 0, 1, H, LINE)
        self.rect(2, 2, 6, 7, BLUE)                                   # a home tile (not the logo)
        for i, y in enumerate(range(18, 150, 13)):
            if i == 4: self.rect(1, y - 2, 8, 9, SKY)
            c = BLUE if i == 4 else MUTE
            if i % 3 == 0: self.rect(3, y, 5, 5, None, c)
            elif i % 3 == 1: self.rect(3, y + 3, 1, 2, c); self.rect(5, y + 1, 1, 4, c); self.rect(7, y, 1, 5, c)
            else: self.rect(3, y, 5, 1, c); self.rect(3, y + 2, 5, 1, c); self.rect(3, y + 4, 3, 1, c)
        self.text(14, 3, title)
        self.rect(W - 37, 1, 35, 10, None, LINE); self.text(W - 34, 3, 'Share', BLUE)


def canvas():
    """Stage 0. The automatic investigation, on a Canvas: evidence on the left, the summary card on the right."""
    p = Pic(); p.chrome('Canvas / Otto alert')
    for y in range(18, H, 8):                                         # the canvas's dot grid
        for x in range(16, W, 8): p.rect(x, y, 1, 1, FAINT)
    # evidence the Canvas agent drew: two graphs, the five worst conversations, a note
    p.card(14, 16, 54, 34); p.greek(17, 19, [[14, 9]])
    p.spark(17, 25, 48, 21, [.1, .5, .15, .8, .2, .6, .1, .9, .2, .7, .15, .85, .3], PURPLE)
    p.spark(17, 25, 48, 21, [.05, .2, .1, .3, .1, .25, .1, .35, .1, .3, .1, .3, .1], GREEN_D)
    p.card(14, 53, 54, 34); p.greek(17, 56, [[18, 6]])
    p.spark(17, 62, 48, 21, [.05, .1, .1, .15, .2, .2, .35, .4, .55, .6, .8, .9, 1], BLUE)
    p.card(14, 90, 54, 43); p.rect(15, 91, 52, 7, CHIP)
    for i, c in enumerate((BLUE, GREEN_D, YELLOW, RED, MID)):
        y = 100 + i * 6
        if i == 0: p.rect(15, y - 1, 52, 6, (255, 244, 214))
        p.rect(17, y, 3, 3, c); p.rect(22, y + 1, 20, 1, LINK if i == 0 else GREEK); p.rect(46, y + 1, 18 - i * 3, 1, INK if i == 0 else GREEK)
    p.rect(16, 138, 30, 24, NOTE); p.greek(19, 142, [[10, 8], [14, 5], [9, 9]], (150, 120, 40))
    # the summary card
    x0, y0, cw = 73, 16, 111
    p.card(x0, y0, cw, 142)
    p.rect(x0 + 4, y0 + 4, 4, 4, None, INK); p.rect(x0 + 8, y0 + 8, 2, 2, INK)        # a magnifier
    p.text(x0 + 13, y0 + 3, 'Investigation')
    p.greek(x0 + 4, y0 + 14, [[20, 34, 12], [16, 40]])
    p.text(x0 + 4, y0 + 25, 'Summary', BLUE)
    p.rect(x0 + 4, y0 + 35, 41, 1, BLUE)
    p.text(x0 + 4, y0 + 39, 'What happened', MUTE)
    p.greek(x0 + 4, y0 + 49, [[12, 30, 8, 22], [26, 10, 34]])
    e = p.text(x0 + 4, y0 + 60, 'Worst: ', INK); e2 = p.text(e, y0 + 60, '52262ea7', LINK); p.rect(e, y0 + 68, e2 - e, 1, LINK)
    sy = y0 + 74
    p.text(x0 + 4, sy, 'Strongest signal:')
    p.rect(x0 + 3, sy + 10, cw - 6, 54, None, ORANGE); p.rect(x0 + 4, sy + 11, cw - 8, 52, None, ORANGE)
    p.chip(x0 + 7, sy + 15, 'order-status')
    p.chip(x0 + 7, sy + 27, 'tool loop', RED, (252, 232, 232))
    for i in range(3):
        y = sy + 39 + i * 8
        p.rect(x0 + 8, y, 2, 2, MUTE); p.greek(x0 + 14, y, [[18 + i * 4, 26 - i * 5, 20, 8 + i * 6]])
    hl = {'x': x0 + 2, 'y': sy - 2, 'w': cw - 4, 'h': 68}
    # the canvas's floating toolbar
    p.card(104, 162, 50, 11)
    for i in range(6):
        if i == 3: p.rect(107 + i * 8, 164, 7, 7, BLUE)
        p.rect(109 + i * 8, 166, 3, 3, CARD if i == 3 else MUTE)
    return p.im, [hl]


TRACK_X, TRACK_W = 91, 92
LLM_AT = [3, 11, 26, 41, 56, 71]              # where the order-status agent's LLM calls start, px along the track


def timeline(p, y, selected=None, labels=True, x=TRACK_X, w=TRACK_W, k=1.0):
    """The lanes of one conversation. Returns the rectangle of the tool-call bursts and of each LLM call."""
    at = [round(v * k) for v in LLM_AT]
    def lane(name, yy, sub=False):
        if labels: p.text(21 if sub else 15, yy, name, MUTE if sub else INK)
        p.rect(x, yy - 1, w, 9, (250, 251, 253))
    lane('supervisor', y)
    p.rect(x + 1, y, round(40 * k), 7, SKY); p.rect(x + round(43 * k), y, w - round(43 * k) - 2, 7, SKY)
    for v in (2, round(41 * k), w - 6): p.rect(x + v, y + 1, 3, 5, MID)
    lane('order-status', y + 11)
    for v in at: p.rect(x + v, y + 11, round(13 * k), 7, SKY); p.rect(x + v, y + 12, 3, 5, MID)
    lane('agent', y + 22, True); p.rect(x + 1, y + 22, 6, 7, GREEN, GREEN_D); p.rect(x + 9, y + 22, w - 12, 7, GREEN, GREEN_D)
    lane('LLM', y + 33, True)
    calls = []
    for i, v in enumerate(at):
        r = (x + v, y + 33, 5, 7); calls.append(r)
        p.rect(*r, MID, BLUE)
    lane('tools', y + 44, True); p.rect(x, y + 52, w, 24, (250, 251, 253))
    for i, v in enumerate(at[1:]):                                    # after each LLM call, a burst of tool calls
        for row in range(4): p.rect(x + v + 4 + (row % 2) * 2 + row, y + 44 + row * 7, round(9 * k), 5, SKY, MID)
    p.rect(x + at[0] + 5, y + 44, round(6 * k), 5, SKY, MID)
    bursts = {'x': x + at[1] + 2, 'y': y + 42, 'w': w - at[1] - 2, 'h': 32}
    lane('refunds', y + 77)
    p.rect(x + round(62 * k), y + 77, round(8 * k), 7, (252, 232, 232), RED)
    if selected is not None:
        sx, sy, sw, sh = calls[selected]
        p.rect(sx - 2, sy - 2, sw + 4, sh + 4, None, INK); p.rect(sx - 1, sy - 1, sw + 2, sh + 2, None, INK)
        for r, row in enumerate(ARROW):                              # the pointer
            for c, ch in enumerate(row):
                if ch == '#': p.rect(sx + 4 + c, sy + 5 + r, 1, 1, INK)
                elif '#' in row[:c] and '#' in row[c:]: p.rect(sx + 4 + c, sy + 5 + r, 1, 1, CARD)
    return bursts, calls


def agent_timeline():
    """Stage 1. Agent Timeline: the conversation's totals, then every agent, LLM call and tool call in order."""
    p = Pic(); p.chrome('Agent Timeline')
    for x, w, label, value in ((12, 78, 'Duration', '11 min'), (92, 94, 'Total tokens', '411,448')):
        p.card(x, 15, w, 28); p.text(x + 4, 18, label, MUTE); p.text(x + 4, 27, value, INK, 2)
    e = p.text(15, 46, '19', INK); e = p.text(e + 4, 46, 'LLM calls', MUTE)
    e = p.text(e + 10, 46, '97', INK); p.text(e + 4, 46, 'tool calls', MUTE)
    p.card(12, 56, 174, 118)
    p.text(15, 59, 'Timeline')
    x = 70
    for name, fill, line in (('agent', GREEN, GREEN_D), ('LLM', MID, BLUE), ('tool', SKY, MID), ('', (252, 232, 232), RED)):
        p.rect(x, 60, 5, 5, fill, line); x = p.text(x + 7, 59, name, MUTE) + 5
    p.rect(TRACK_X, 70, TRACK_W, 4, SKY); p.rect(TRACK_X + 2, 69, TRACK_W - 4, 6, None, MID)      # the scrubber
    for i in range(7): p.rect(TRACK_X + 6 + i * 13, 77, 1, 2, MUTE)                                # time ticks
    bursts, _ = timeline(p, 83)
    return p.im, [bursts]


def llm_call():
    """Stage 2. One LLM call opened: its input tokens, and the tool result that put them there."""
    p = Pic(); p.chrome('Agent Timeline')
    p.card(12, 15, 84, 159); p.text(15, 18, 'Timeline')
    p.rect(17, 29, 74, 4, SKY); p.rect(19, 28, 70, 6, None, MID)
    _, calls = timeline(p, 39, selected=2, labels=False, x=17, w=74, k=74 / 92)
    p.text(15, 132, '11 min', MUTE); p.text(15, 143, '411,448', MUTE); p.text(15, 152, 'tokens', MUTE)
    # the span's sidebar
    x0, cw = 99, 87
    p.card(x0, 15, cw, 159)
    p.text(x0 + 4, 18, 'chat'); p.text(x0 + cw - 9, 18, 'x', MUTE)
    e = p.text(x0 + 4, 29, 'Gen AI', BLUE); p.rect(x0 + 4, 37, e - x0 - 4, 1, BLUE); p.text(e + 7, 29, 'Fields', MUTE)
    p.rect(x0 + 1, 39, cw - 2, 1, FAINT)
    p.text(x0 + 4, 43, 'Input tokens', MUTE)
    p.rect(x0 + 5, 52, 76, 19, None, ORANGE); p.rect(x0 + 4, 53, 78, 17, None, ORANGE)              # circled, as in the demo
    p.text(x0 + 8, 55, '57,293', INK, 2)
    p.text(x0 + 4, 74, 'call 1: 1,174', MUTE)
    p.rect(x0 + 4, 84, cw - 8, 4, PURPLE); p.rect(x0 + cw - 8, 84, 4, 4, GREEN_D)                   # token usage: nearly all input
    p.text(x0 + 4, 92, 'Messages')
    p.chip(x0 + 4, 103, 'USER', BLUE, SKY)
    p.text(x0 + 4, 112, 'Where is my'); p.text(x0 + 4, 121, 'order?')
    ty = 130
    p.rect(x0 + 2, ty, cw - 4, 42, (255, 248, 236), ORANGE)
    p.chip(x0 + 5, ty + 4, 'TOOL', ORANGE, (255, 232, 200))
    p.text(x0 + 5, ty + 13, 'lookup_orders', INK)
    e = p.text(x0 + 5, ty + 23, '97', RED); p.text(e + 4, ty + 23, 'orders', INK)
    e = p.text(x0 + 5, ty + 31, '145 KB', RED)
    p.greek(e + 5, ty + 33, [[14, 8], ], GREEK)
    hl = [{'x': x0 + 3, 'y': 51, 'w': 80, 'h': 21}, {'x': x0 + 2, 'y': ty, 'w': cw - 4, 'h': 42}]
    return p.im, hl


STAGES = (('ch1_hc_0.png', canvas, 'Canvas: the automatic investigation'),
          ('ch1_hc_1.png', agent_timeline, 'Agent Timeline: one conversation'),
          ('ch1_hc_2.png', llm_call, 'One LLM call: what the model was sent'))


def build(out=OUT):
    os.makedirs(out, exist_ok=True)
    m = {'pic': PIC, 'stages': []}
    for name, draw, what in STAGES:
        im, highlights = draw()
        im.convert('P', palette=Image.ADAPTIVE, colors=64).save(os.path.join(out, name), optimize=True)
        m['stages'].append({'image': name, 'what': what, 'highlights': highlights})
    with open(os.path.join(out, 'ch1_hc.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    for s in build()['stages']: print(s['image'], '-', s['what'])
