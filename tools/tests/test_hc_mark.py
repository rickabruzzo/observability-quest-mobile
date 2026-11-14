"""The Honeycomb mark on the hoodie comes from the official file, reduced by a tool — never drawn by hand.
tools/hc_mark.py reduces assets/hc_logomark.png to the sprite's mark and writes the one pixel table both
generators use: tools/hc_mark.json (Python) and js/engine/hc-mark.js (the game), which must agree."""
import json, re
from tools import hc_mark, hero_gen

OFFICIAL = 'assets/hc_logomark.png'


def test_reduction_is_a_small_table_of_the_four_brand_colours():
    px = hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)
    assert hc_mark.SIZE == 9
    assert 24 <= len(px) <= 81
    assert all(0 <= x < 9 and 0 <= y < 9 for x, y, _ in px)
    assert {k for _, _, k in px} == set(hc_mark.HC_MARK)              # blue, green, orange, honey all survive
    assert len({(x, y) for x, y, _ in px}) == len(px)                 # one colour per pixel
    assert px == sorted(px, key=lambda p: (p[1], p[0]))               # row-major, so the files diff cleanly


def test_the_h_of_the_wordmark_is_left_out():
    """assets/hc_logomark.png carries a small dark 'h' beside the hexagons; the mark is the hexagons."""
    px = hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)
    assert 'ink' not in {k for _, _, k in px}
    xs = [x for x, _, _ in px]; ys = [y for _, y, _ in px]
    assert min(xs) == 0 and min(ys) == 0 and (max(xs) == 8 or max(ys) == 8)   # the hexagons fill the table's box


def test_blue_is_the_big_hexagon_top_right_and_honey_sits_below():
    px = {(x, y): k for x, y, k in hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)}
    by = {}
    for (x, y), k in px.items(): by.setdefault(k, []).append((x, y))
    centre = {k: (sum(x for x, _ in v) / len(v), sum(y for _, y in v) / len(v)) for k, v in by.items()}
    assert len(by['blue']) == max(len(v) for v in by.values())
    assert centre['blue'][0] > centre['orange'][0] and centre['blue'][1] < centre['honey'][1]


def test_committed_table_equals_the_tools_reduction():
    want = hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)
    got = json.load(open('tools/hc_mark.json'))
    assert [tuple(p) for p in got['pixels']] == want
    assert got['size'] == hc_mark.SIZE and got['source'] == OFFICIAL
    assert got['colours'] == hc_mark.HC_MARK


def test_js_module_carries_the_same_table():
    src = open('js/engine/hc-mark.js').read()
    table = json.loads(re.sub(r',\s*\]', ']', re.search(r'HC_MARK_PIXELS\s*=\s*(\[[\s\S]*?\]);', src).group(1)))
    assert [tuple(p) for p in table] == hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)
    colours = dict(re.findall(r"(\w+): '(#[0-9A-F]{6})'", re.search(r'HC_MARK\s*=\s*(\{[^}]*\});', src).group(1)))
    assert colours == hc_mark.HC_MARK


def test_the_generator_uses_the_tools_table():
    assert hero_gen.HC_MARK_PIXELS == hc_mark.reduce_mark(OFFICIAL, hc_mark.SIZE)
    assert hero_gen.HC_MARK == hc_mark.HC_MARK
