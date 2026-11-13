import json
from PIL import Image
from tools import build_hc_screens as hs


def test_font_reads_the_games_5x7_glyphs():
    g = hs.glyphs()
    assert len(g) == 95 and g['I'] == [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110]
    assert hs.text_width('Share') == 29 and hs.text_width('57,293', 2) == 70


import pytest


@pytest.mark.parametrize('ch', ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])
def test_three_stages_at_the_picture_size_with_highlights_inside(tmp_path, ch):
    m = hs.build(str(tmp_path), ch)
    assert m['pic'] == {'x': 4, 'y': 20, 'w': 188, 'h': 176}
    assert [s['image'] for s in m['stages']] == [f'{ch}_hc_{i}.png' for i in range(3)]
    for s in m['stages']:
        im = Image.open(tmp_path / s['image'])
        assert im.size == (188, 176)
        assert len(im.convert('RGB').getcolors(1 << 16)) <= 64          # flat VGA fills, no gradients
        assert s['what'] and s['highlights'], s['image']
        for h in s['highlights']:
            assert 0 <= h['x'] and h['x'] + h['w'] <= 188 and 0 <= h['y'] and h['y'] + h['h'] <= 176
    assert json.load(open(tmp_path / f'{ch}_hc.json')) == m


@pytest.mark.parametrize('ch', ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])
def test_build_is_deterministic(tmp_path, ch):
    hs.build(str(tmp_path / 'a'), ch); hs.build(str(tmp_path / 'b'), ch)
    for i in range(3):
        n = f'{ch}_hc_{i}.png'
        assert open(tmp_path / 'a' / n, 'rb').read() == open(tmp_path / 'b' / n, 'rb').read()


def test_the_committed_screens_are_what_the_tool_builds(tmp_path):
    import os
    for ch in hs.CHAPTERS:
        m = hs.build(str(tmp_path), ch)
        for s in m['stages']:
            assert open(tmp_path / s['image'], 'rb').read() == open(os.path.join(hs.OUT, s['image']), 'rb').read(), s['image']


@pytest.mark.parametrize('ch', ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'])
def test_pictures_do_not_outline_their_own_highlights(tmp_path, ch):
    """The game draws the pulsing outline; a box baked into the picture would show through its 'off' frames."""
    m = hs.build(str(tmp_path), ch)
    for s in m['stages']:
        px = Image.open(tmp_path / s['image']).convert('RGB').load()
        for h in s['highlights']:
            x0, y0, x1, y1 = h['x'], h['y'], h['x'] + h['w'] - 1, h['y'] + h['h'] - 1
            ring = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)
                    if min(x - x0, x1 - x, y - y0, y1 - y) < 4]
            orange = sum(px[x, y] == hs.ORANGE for x, y in ring)
            assert orange < len(ring) * 0.1, (s['image'], h, orange, len(ring))
