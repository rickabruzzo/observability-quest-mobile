import json
from PIL import Image
from tools import build_hc_screens as hs


def test_font_reads_the_games_5x7_glyphs():
    g = hs.glyphs()
    assert len(g) == 95 and g['I'] == [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110]
    assert hs.text_width('Share') == 29 and hs.text_width('57,293', 2) == 70


def test_three_stages_at_the_picture_size_with_highlights_inside(tmp_path):
    m = hs.build(str(tmp_path))
    assert m['pic'] == {'x': 4, 'y': 20, 'w': 188, 'h': 176}
    assert [s['image'] for s in m['stages']] == ['ch1_hc_0.png', 'ch1_hc_1.png', 'ch1_hc_2.png']
    for s in m['stages']:
        im = Image.open(tmp_path / s['image'])
        assert im.size == (188, 176)
        assert len(im.convert('RGB').getcolors(1 << 16)) <= 64          # flat VGA fills, no gradients
        assert s['highlights'], s['image']
        for h in s['highlights']:
            assert 0 <= h['x'] and h['x'] + h['w'] <= 188 and 0 <= h['y'] and h['y'] + h['h'] <= 176
    assert json.load(open(tmp_path / 'ch1_hc.json')) == m


def test_build_is_deterministic(tmp_path):
    hs.build(str(tmp_path / 'a')); hs.build(str(tmp_path / 'b'))
    for n in ('ch1_hc_0.png', 'ch1_hc_1.png', 'ch1_hc_2.png'):
        assert open(tmp_path / 'a' / n, 'rb').read() == open(tmp_path / 'b' / n, 'rb').read()
