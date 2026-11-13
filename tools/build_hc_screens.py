#!/usr/bin/env python3
"""The Honeycomb screens, drawn as VGA pixel art: assets/screens/<chapter>_hc_0..2.png + <chapter>_hc.json.

They are not screenshots and do not try to match the product pixel for pixel. They are drawn from Honeycomb's
own demo videos so that someone who has used the product recognises it and someone who has not can see what
using it looks like. Scenario 1 (agent observability demo, Innovation Week 2026):

  0  Canvas: an automatic investigation, already filled in (graphs, the worst conversations, a summary)
  1  Agent Timeline: one conversation, every agent, LLM call and tool call in order
  2  one LLM call opened: how many tokens went in, and the tool result that put them there

Scenario 3 (frontend observability demo, "See everything"):

  0  the Web Launchpad: Core Web Vitals, and Slowest Requests by Endpoint
  1  a trace from the browser's click to the backend service that kept it waiting
  2  the heatmap of that span's duration with the slow ones selected, and BubbleUp

Scenario 4 (no product demo: a customer's story of hidden failures and the Honeycomb MCP). These show the team's
coding agent, not Honeycomb's own pages, with Honeycomb answering through MCP:

  0  the agent with Honeycomb's tools connected (the real tool names: run_query, run_bubbleup, get_trace, get_slos)
  1  a plain question, the query, and the success rate nobody had
  2  the follow-up, and BubbleUp's answer

Scenario 5 (Team Agents demo, Innovation Week 2026):

  0  Goals: standing responsibilities for agents, each with a state; one has a Finding
  1  the Finding: what broke, for how many, and where in the code
  2  the agent's work on a Canvas: the queries it ran and the fix it wrote

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


# ---- scenario 3: Honeycomb for Frontend Observability (from Honeycomb's "See everything" demo) ----

TEAL = (60, 160, 160); PINK = (250, 206, 214); NAVY = (30, 52, 120); SELECT = (255, 240, 200)


def launchpad():
    """Stage 0. The Web Launchpad: Core Web Vitals all green, and one row in Slowest Requests that is not."""
    p = Pic(); p.chrome('Web Launchpad')
    e = p.text(14, 16, 'Performance', BLUE); p.rect(14, 26, e - 14, 1, BLUE); p.text(e + 8, 16, 'Errors', MUTE)
    for i, (name, value, pts) in enumerate((('LCP', '1.9s', [.3, .5, .35, .6, .4, .5, .3, .55, .4, .45]),
                                            ('CLS', '0.02', [.1, .1, .15, .1, .1, .2, .1, .1, .1, .1]),
                                            ('INP', '60ms', [.2, .15, .2, .2, .3, .2, .15, .2, .25, .2]))):
        x = 13 + i * 58
        p.card(x, 30, 56, 47); p.text(x + 3, 33, name)
        p.rect(x + 3, 43, 50, 6, MID); p.text(x + 30, 33, '100%', BLUE)
        p.spark(x + 3, 52, 50, 13, pts, BLUE); p.text(x + 3, 67, value, BLUE)
    p.card(13, 81, 172, 93); p.text(16, 84, 'Slowest requests')
    p.rect(14, 94, 170, 1, FAINT)
    rows = (('POST', '/api/checkout', '14.2s'), ('GET', '/api/products', '0.4s'), ('GET', '/api/cart', '0.3s'), ('GET', '/api/lessons', '0.2s'))
    for i, (verb, path, t) in enumerate(rows):
        y = 98 + i * 12
        if i == 0: p.rect(14, y - 2, 170, 11, (255, 236, 180))
        p.text(17, y, verb, MUTE); p.text(46, y, path, INK if i == 0 else MUTE)
        p.text(182 - text_width(t), y, t, RED if i == 0 else MUTE)
    hl = {'x': 13, 'y': 95, 'w': 172, 'h': 13}
    # the row's menu, as when you click it
    mx, my = 92, 110
    p.rect(mx + 2, my + 2, 80, 36, GREEK); p.card(mx, my, 80, 36)
    p.rect(mx + 1, my + 1, 78, 11, SKY); p.text(mx + 4, my + 3, 'View trace', BLUE)
    p.text(mx + 4, my + 14, 'Filter', MUTE); p.text(mx + 4, my + 25, 'BubbleUp', MUTE)
    for r, row in enumerate(ARROW):
        for c, ch in enumerate(row):
            if ch == '#': p.rect(mx + 68 + c, my + 6 + r, 1, 1, INK)
            elif '#' in row[:c] and '#' in row[c:]: p.rect(mx + 68 + c, my + 6 + r, 1, 1, CARD)
    p.greek(17, 152, [[30, 44], [26, 50]])
    return p.im, [hl, {'x': mx, 'y': my, 'w': 80, 'h': 13}]


def trace():
    """Stage 1. One trace, browser to backend: the click, the request, and the service that kept it waiting."""
    p = Pic(); p.chrome('Trace')
    p.card(12, 15, 174, 159)
    x = 15
    for name, fill in (('web', BLUE), ('checkout', RED), ('stock', TEAL)):
        p.rect(x, 19, 5, 5, fill); x = p.text(x + 7, 18, name, MUTE) + 4
    bx, bw = 98, 85
    for t, label in ((0, '0'), (5, '5s'), (10, '10s')):
        tx = bx + round(t / 14.2 * (bw - 1)); p.text(tx, 29, label, MUTE); p.rect(tx, 38, 1, 133, FAINT)
    p.rect(13, 38, 172, 1, FAINT)
    spans = [(0, 'placeOrder', BLUE, 0, 14.2), (1, 'HTTP POST', BLUE, 0.05, 14.15), (2, 'api-gateway', ORANGE, 0.1, 14.05),
             (3, 'PlaceOrder', RED, 0.15, 13.95), (4, 'getCart', PURPLE, 0.2, 0.25)]
    spans += [(4, 'checkStock', TEAL, 0.5 + i * 2.2, 2.1) for i in range(6)] + [(4, 'charge', GREEN_D, 13.75, 0.3)]
    hl = None
    for i, (depth, name, colour, start, dur) in enumerate(spans):
        y = 41 + i * 11
        if name == 'PlaceOrder':
            p.rect(13, y - 2, 172, 11, SKY, BLUE); hl = {'x': 13, 'y': y - 2, 'w': 172, 'h': 11}
        if depth: p.rect(13 + depth * 3, y - 2, 1, 6, MUTE); p.rect(13 + depth * 3, y + 3, 3, 1, MUTE)
        p.text(17 + depth * 3, y, name, INK if depth < 4 else MUTE)
        x0 = bx + round(start / 14.2 * (bw - 1)); w = max(2, round(dur / 14.2 * (bw - 1)))
        p.rect(x0, y, w, 7, colour)
        if name == 'PlaceOrder': p.text(x0 + 3, y, '14.1s', CARD)
    return p.im, [hl]


def bubbleup():
    """Stage 2. The heatmap of every checkout, the slow ones selected, and BubbleUp: what do they share?"""
    p = Pic(); p.chrome('BubbleUp')
    e = p.chip(14, 17, 'HEATMAP'); p.text(e + 5, 17, 'name = placeOrder', MUTE)
    p.card(12, 27, 174, 58)
    for label, y in (('14s', 31), ('7s', 52), ('0', 73)): p.text(15, y, label, MUTE)
    px, pw = 36, 146
    for y in (34, 55, 76): p.rect(px, y, pw, 1, FAINT)
    p.rect(px, 30, pw, 22, SELECT, YELLOW)                                 # the box drawn round the slow ones
    for i in range(48):                                                    # everyone else: fast, and a lot of them
        x = px + 2 + i * 3; h = (i * 7) % 3
        p.rect(x, 74 - h, 2, 2, (BLUE, MID, TEAL)[(i * 5) % 3]); 
        if i % 4 == 0: p.rect(x, 71 - h, 2, 2, MID)
    for i, (dx, dy) in enumerate(((6, 4), (19, 9), (31, 3), (44, 12), (58, 6), (71, 2), (83, 10), (97, 5), (110, 13), (122, 7), (135, 3))):
        p.rect(px + dx, 32 + dy, 2, 2, NAVY)
    e = p.text(14, 88, 'BubbleUp', BLUE); p.rect(14, 98, e - 14, 1, BLUE); p.text(e + 8, 88, 'Traces', MUTE)
    p.rect(118, 90, 5, 5, YELLOW); p.text(125, 89, 'slow', MUTE); p.rect(153, 90, 5, 5, BLUE); p.text(160, 89, 'rest', MUTE)
    cards = ((12, 78, 'handedness', (('right', .9, .03), ('left', .08, 1.0))),
             (92, 48, 'browser', (('', .5, .45), ('', .3, .35), ('', .2, .2))),
             (142, 44, 'city', (('', .3, .25), ('', .25, .3), ('', .2, .2), ('', .25, .25))))
    hl = None
    for i, (x, cw, name, groups) in enumerate(cards):
        p.card(x, 103, cw, 71); p.text(x + 3, 106, name)
        base = 160; gw = (cw - 8) // len(groups)
        p.rect(x + 3, base, cw - 6, 1, LINE)
        for j, (label, blue, yellow) in enumerate(groups):
            gx = x + 5 + j * gw; bwid = max(3, min(12, (gw - 4) // 2))
            hb = round(blue * 40); hy = round(yellow * 40)
            p.rect(gx, base - hb, bwid, hb, BLUE); p.rect(gx + bwid + 1, base - hy, bwid, hy, YELLOW)
            if label: p.text(gx + (2 * bwid + 1 - text_width(label)) // 2, base + 4, label, INK if label == 'left' else MUTE)
        if i == 0: hl = {'x': x, 'y': 103, 'w': cw, 'h': 71}
    return p.im, [hl, {'x': px, 'y': 30, 'w': pw, 'h': 22}]


# ---- scenario 4: Honeycomb through MCP, inside the team's coding agent (the story follows a customer's: 93% to 99%) ----

DARK = (22, 26, 34); PANEL = (36, 42, 56); LIGHT = (222, 228, 238); DIM = (120, 130, 150); TERM = (120, 208, 130)
TOOL_BG = (44, 54, 76); TOOL_FG = (150, 190, 250); CLAWC = (242, 140, 40)
CLAW = ['.##...##.', '#..#.#..#', '#...#...#', '.#.....#.', '..#####..', '.#######.', '.#.###.#.', '#..#.#..#']


def agent_window(p, lines=()):
    """The coding agent's window: dark, a claw for Claw Codez, and the Honeycomb MCP server shown as connected."""
    p.rect(0, 0, W, H, DARK); p.rect(0, 0, W, 13, PANEL)
    claw(p, 3, 2); p.text(15, 3, 'Claw Codez', LIGHT)
    p.rect(W - 93, 4, 5, 5, TERM); p.text(W - 86, 3, 'MCP: honeycomb', DIM)
    for i, line in enumerate(lines): p.text(6, 18 + i * 9, line, TERM)


def claw(p, x, y):
    for r, row in enumerate(CLAW):
        for c, ch in enumerate(row):
            if ch == '#': p.rect(x + c, y + r, 1, 1, CLAWC)


def says(p, y, lines):
    claw(p, 6, y)
    for i, line in enumerate(lines): p.text(19, y + i * 9, line, LIGHT)


def ask_box(p, y, h=14):
    p.rect(5, y, W - 10, h, PANEL, DIM); e = p.text(9, y + (h - 7) // 2, '>', TERM); p.rect(e + 4, y + (h - 7) // 2, 5, 7, LIGHT)
    return {'x': 5, 'y': y, 'w': W - 10, 'h': h}


def mcp_connected():
    """Stage 0. Claw Codez with Honeycomb's tools connected: production is one plain question away."""
    p = Pic(); agent_window(p)
    p.text(6, 18, 'connected tools', DIM)
    x = 6
    for name in ('run_query', 'get_trace'): x = p.chip(x, 29, name, TOOL_FG, TOOL_BG) + 4
    x = 6
    for name in ('run_bubbleup', 'get_slos'): x = p.chip(x, 41, name, TOOL_FG, TOOL_BG) + 4
    says(p, 58, ('Honeycomb is', 'connected. Ask', 'production anything.'))
    p.greek(6, 96, [[22, 40, 16], [30, 18, 44, 12], [26, 36]], (52, 60, 78))
    p.greek(6, 118, [[18, 28, 34], [40, 22]], (52, 60, 78))
    return p.im, [ask_box(p, 150, 18)]


def mcp_query():
    """Stage 1. The question, the query Honeycomb ran, and a number nobody had: 93%."""
    p = Pic(); agent_window(p, ('> how many fleet', '  joins succeed?'))
    p.chip(6, 40, 'run_query', TOOL_FG, TOOL_BG); p.text(68, 40, 'fleet.join', DIM)
    cx, cy, cw, chh = 5, 51, W - 10, 70
    p.card(cx, cy, cw, chh)
    p.text(cx + 4, cy + 4, 'fleet.join success')
    p.text(cx + 4, cy + 15, '93%', INK, 3)
    bx, bw = cx + 64, 108
    p.rect(bx, cy + 17, round(bw * .93), 10, BLUE); p.rect(bx + round(bw * .93), cy + 17, bw - round(bw * .93), 10, YELLOW)
    p.rect(bx, cy + 31, 5, 5, BLUE); e = p.text(bx + 7, cy + 30, 'ok', MUTE)
    p.rect(e + 8, cy + 31, 5, 5, YELLOW); p.text(e + 15, cy + 30, 'failed 7%', INK)
    for x in range(cx + 5, cx + cw - 5):                              # thirty days, and it never moved
        p.rect(x, cy + 44 + (x * 7 % 5 == 0), 1, 1, BLUE); p.rect(x, cy + 64 - (x * 3 % 7 == 0), 1, 1, YELLOW)
    p.text(cx + cw - 46, cy + 50, '30 days', MUTE)
    says(p, 126, ('7 joins in 100 fail.', 'The game retries,', 'so nobody saw it.'))
    ask_box(p, 158, 14)
    return p.im, [{'x': cx, 'y': cy, 'w': cw, 'h': chh}]


def mcp_bubbleup():
    """Stage 2. The follow-up, BubbleUp through the same connection, and the one thing the failures share."""
    p = Pic(); agent_window(p, ('> what do the', '  failures share?'))
    p.chip(6, 40, 'run_bubbleup', TOOL_FG, TOOL_BG)
    cx, cy, cw, chh = 5, 51, W - 10, 76
    p.card(cx, cy, cw, chh)
    p.text(cx + 4, cy + 4, 'BubbleUp')
    p.rect(cx + 92, cy + 5, 5, 5, YELLOW); e = p.text(cx + 99, cy + 4, 'failed', MUTE); p.rect(e + 6, cy + 5, 5, 5, BLUE); p.text(e + 13, cy + 4, 'ok', MUTE)
    base = cy + 60
    p.text(cx + 4, cy + 15, 'fleet.size'); p.rect(cx + 4, base, 92, 1, LINE)
    for gx, label, blue, yellow in ((cx + 12, '<=255', 34, 1), (cx + 58, '>255', 3, 36)):
        p.rect(gx, base - blue, 12, blue, BLUE); p.rect(gx + 13, base - yellow, 12, yellow, YELLOW)
        p.text(gx + (25 - text_width(label)) // 2, base + 4, label, INK if yellow > 5 else MUTE)
    hl = {'x': cx + 2, 'y': cy + 13, 'w': 97, 'h': chh - 15}
    p.rect(cx + 102, cy + 14, 1, chh - 18, FAINT)
    p.text(cx + 108, cy + 15, 'region'); p.rect(cx + 108, base, 64, 1, LINE)
    for i, (blue, yellow) in enumerate(((20, 18), (14, 15), (9, 9))):
        gx = cx + 111 + i * 21; p.rect(gx, base - blue, 7, blue, BLUE); p.rect(gx + 8, base - yellow, 7, yellow, YELLOW)
    says(p, 132, ('Fails when a fleet', 'is over 255 ships.', 'Limit set in 2003.'))
    ask_box(p, 162, 12)
    return p.im, [hl]


# ---- scenario 5: Team Agents (from Honeycomb's Team Agents demo, Innovation Week 2026) ----

ADD = (226, 244, 220); DEL = (252, 232, 232); WARN = (255, 232, 200)


def button(p, x, y, label, primary=True):
    w = text_width(label) + 10
    p.rect(x, y, w, 13, BLUE if primary else CARD, BLUE); p.text(x + 5, y + 3, label, CARD if primary else BLUE)
    return x + w


def goals():
    """Stage 0. Team Agents' goals: standing responsibilities, each with a state. One has a Finding waiting."""
    p = Pic(); p.chrome('Team Agents')
    e = p.text(14, 16, 'Goals', BLUE); p.rect(14, 26, e - 14, 1, BLUE); p.text(e + 8, 16, 'Findings', MUTE)
    p.card(12, 30, 174, 54)
    rows = (('Watch every deploy', '1 finding', WARN, ORANGE), ('Catch slow queries', 'verifying', SKY, BLUE),
            ('Keep search fast', 'watching', CHIP, MUTE), ('Tidy the runbooks', 'verifying', SKY, BLUE))
    for i, (name, state, bg, fg) in enumerate(rows):
        y = 34 + i * 12
        if i == 0: p.rect(13, y - 2, 172, 11, (255, 246, 220))
        p.text(16, y, name, INK if i == 0 else MUTE)
        p.chip(183 - text_width(state) - 4, y, state, fg, bg)
    hl = {'x': 12, 'y': 31, 'w': 174, 'h': 13}
    p.card(12, 88, 174, 86)
    p.text(16, 92, 'Watch every deploy')
    p.rect(13, 102, 172, 1, FAINT)
    e = p.text(16, 107, 'runs on', MUTE); p.chip(e + 5, 107, 'every deploy')
    e = p.text(16, 120, 'skills', MUTE)
    for name in ('read PR', 'queries', 'code'): e = p.chip(e + 5, 120, name) - 2
    p.text(16, 133, 'connectors', MUTE)
    e = 13
    for name in ('code', 'tickets', 'runbooks'): e = p.chip(e + 3, 144, name)
    p.greek(16, 158, [[30, 22, 40, 18], [26, 44, 20]])
    return p.im, [hl]


def finding():
    """Stage 1. One Finding: specific, with numbers, and the place in the code."""
    p = Pic(); p.chrome('Finding')
    p.rect(12, 15, 3, 62, ORANGE)
    p.text(18, 16, 'Sign-ups fail for names'); p.text(18, 26, 'with an apostrophe')
    p.chip(18, 39, "since Friday's deploy", ORANGE, WARN)
    p.card(18, 50, 56, 28); p.text(21, 53, 'people', MUTE); p.text(21, 62, '11', RED, 2)
    p.card(76, 50, 110, 28); p.text(79, 53, 'overall errors', MUTE); e = p.text(79, 62, '0.4%', INK, 2); p.text(e + 6, 68, 'normal', GREEN_D)
    hl = {'x': 12, 'y': 14, 'w': 174, 'h': 65}
    p.text(14, 83, 'What happened', MUTE); p.greek(14, 94, [[24, 40, 18, 30, 22], [36, 20, 44, 14]])
    p.text(14, 106, 'In the code')
    p.rect(12, 116, 174, 33, (248, 249, 251), LINE)
    p.text(15, 119, 'def check(name):', MUTE)
    p.rect(13, 128, 172, 10, (255, 240, 190)); p.text(15, 129, '  if not name.isalpha():', INK)
    p.text(15, 139, '    reject()', MUTE)
    e = button(p, 12, 156, 'See its work'); button(p, e + 5, 156, 'Open PR', False)
    return p.im, [hl]


def agent_work():
    """Stage 2. The agent's work, on a Canvas: the queries it ran, what they showed, and the fix it wrote."""
    p = Pic(); p.chrome('Canvas / Finding')
    for y in range(18, H, 8):
        for x in range(16, W, 8): p.rect(x, y, 1, 1, FAINT)
    p.card(13, 16, 92, 56); p.text(16, 19, 'Errors by name')
    base = 58; p.rect(17, base, 84, 1, LINE)
    for i, (h, c) in enumerate(((2, BLUE), (3, BLUE), (2, BLUE), (30, YELLOW))): p.rect(22 + i * 19, base - h, 12, h, c)
    p.text(30, base + 4, 'a-z', MUTE); p.text(70, base + 4, "has '", INK)
    hl1 = {'x': 13, 'y': 16, 'w': 92, 'h': 56}
    p.card(108, 16, 77, 56); p.text(111, 19, 'Latency')
    p.spark(112, 34, 68, 14, [.5, .55, .5, .45, .5, .55, .5, .5, .45, .5, .5], BLUE)
    p.chip(112, 58, 'unchanged', GREEN_D, ADD)
    p.card(13, 75, 92, 30); p.text(16, 78, 'Neighbours')
    for i in range(3): p.rect(17 + i * 28, 90, 7, 7, ADD, GREEN_D); p.rect(27 + i * 28, 93, 12, 2, GREEK)
    p.rect(112, 77, 44, 26, NOTE); p.greek(115, 82, [[16, 14], [22, 8], [12, 16]], (150, 120, 40))
    p.card(13, 108, 172, 66); p.text(16, 111, 'Suggested fix')
    p.rect(14, 121, 170, 10, DEL); p.text(16, 122, '- if not name.isalpha():', RED)
    p.rect(14, 131, 170, 10, ADD); p.text(16, 132, '+ if not is_name(name):', GREEN_D)
    x = 16 + 0; e = button(p, 16, 150, 'Open a pull request')
    hl2 = {'x': 13, 'y': 108, 'w': 172, 'h': 66}
    return p.im, [hl1, hl2]


CHAPTERS = {
    'ch1': ((canvas, 'Canvas: the automatic investigation'),
            (agent_timeline, 'Agent Timeline: one conversation'),
            (llm_call, 'One LLM call: what the model was sent')),
    'ch3': ((launchpad, 'Web Launchpad: the vitals are green, one request is not'),
            (trace, 'Trace: from the click in the browser to the backend'),
            (bubbleup, 'Heatmap and BubbleUp: what the slow checkouts share')),
    'ch5': ((goals, 'Team Agents: goals, and one with a Finding waiting'),
            (finding, 'The Finding: specific, with numbers and the place in the code'),
            (agent_work, "The agent's work on a Canvas: its queries and its fix")),
    'ch4': ((mcp_connected, "The coding agent, with Honeycomb's MCP tools connected"),
            (mcp_query, 'The question, the query Honeycomb ran, and the number: 93%'),
            (mcp_bubbleup, 'BubbleUp through MCP: what the failures share')),
}


def build(out=OUT, chapter='ch1'):
    """Builds one chapter's Honeycomb screens into `out`; returns (and writes) its manifest."""
    os.makedirs(out, exist_ok=True)
    m = {'pic': PIC, 'stages': []}
    for i, (draw, what) in enumerate(CHAPTERS[chapter]):
        im, highlights = draw(); name = f'{chapter}_hc_{i}.png'
        im.convert('P', palette=Image.ADAPTIVE, colors=64).save(os.path.join(out, name), optimize=True)
        m['stages'].append({'image': name, 'what': what, 'highlights': highlights})
    with open(os.path.join(out, f'{chapter}_hc.json'), 'w') as f: json.dump(m, f, indent=1); f.write('\n')
    return m


if __name__ == '__main__':
    for ch in CHAPTERS:
        for s in build(chapter=ch)['stages']: print(s['image'], '-', s['what'])
