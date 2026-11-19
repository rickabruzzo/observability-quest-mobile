"""The title screen's art at game size (art brief 07; Art Claude's drop of 2026-11-17).

The drop is painted at 640x400; the game's picture is 320x200. The build carries the painting down and keeps what the
reduction would lose: the twelve stars that twinkle, the lit pager as a patch of only what changed, and the wordmark's
two layers at one letter pixel per pixel, exactly as delivered.
"""
import json, os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from tools import build_title as bt

ROOT = bt.ROOT
src = lambda n: Image.open(os.path.join(ROOT, bt.SRC, n))
lum = lambda a: 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def test_the_plate_is_the_painting_at_game_size_in_192_colours_or_fewer():
    p = bt.plate(); a = np.asarray(p).astype(int)
    assert p.size == (320, 200) and p.mode == 'RGB'
    assert len(np.unique(a.reshape(-1, 3), axis=0)) <= 192
    big = np.asarray(src('T_title.png').convert('RGB').resize((320, 200), Image.NEAREST)).astype(int)
    assert np.abs(a - big).mean() < 4                       # the painting, not another picture
    q = bt.QUIET; sky = lum(a[q['y']:q['y'] + q['h'], q['x']:q['x'] + q['w']])
    assert sky.mean() < 20 and np.percentile(sky, 99) < 80  # dark enough to carry bright blue letters


def test_no_lettering_is_baked_in_and_the_picture_is_night():
    a = np.asarray(bt.plate()).astype(int)
    assert lum(a[:100]).mean() < 25                         # the upper half is sky
    orange = (a[..., 0] > 150) & (a[..., 1] > 60) & (a[..., 1] < 150) & (a[..., 2] < 60)
    assert orange[100:, 190:].mean() > 0.15 and orange[:95].mean() < 0.001      # the nightstand, lower right, and only there


def test_twelve_stars_twinkle_where_the_hand_back_says():
    stars = bt.stars(); a = np.asarray(bt.plate()).astype(int)
    assert len(stars) == 12 and len({(s['x'], s['y']) for s in stars}) == 12
    q = bt.QUIET
    for s, (X, Y) in zip(stars, bt.STARS_640):
        assert (s['x'], s['y']) == (X // 2, Y // 2)
        assert q['x'] - 5 <= s['x'] < q['x'] + q['w'] and q['y'] - 1 <= s['y'] < q['y'] + q['h']
        on = np.array([int(s['on'][i:i + 2], 16) for i in (1, 3, 5)])
        was = a[s['y'], s['x']]
        assert lum(on) >= lum(was) + 30, (s, tuple(was))   # brighter than the star it sits on
        assert lum(was) > lum(a[s['y'], max(0, s['x'] - 3)]) + 15, 'the star is in the plate, not only in the twinkle'
    assert sum(1 for s in stars if s['cross']) >= 3         # the brightest few have a faint cross


def test_the_lit_pager_is_a_patch_of_only_what_the_edit_changed():
    patch, box = bt.pager()
    assert patch.mode == 'RGBA' and patch.size == (box['w'], box['h'])
    assert 205 <= box['x'] and box['x'] + box['w'] <= 320 and 105 <= box['y'] and box['y'] + box['h'] <= 170
    p = np.asarray(patch).astype(int); base = np.asarray(bt.plate()).astype(int)[box['y']:box['y'] + box['h'], box['x']:box['x'] + box['w']]
    shown = p[..., 3] > 0
    assert set(np.unique(p[..., 3])) <= {0, 255}
    assert 0.5 < shown.mean() < 0.95                         # a glow round a pager, not the whole rectangle
    assert (np.abs(p[..., :3] - base).sum(axis=2)[shown] > 0).mean() > 0.98, 'a pixel the edit left alone is not in the patch'
    s = bt.SCREEN; scr = p[s['y'] - box['y'] + 2:s['y'] - box['y'] + s['h'] - 2, s['x'] - box['x'] + 3:s['x'] - box['x'] + s['w'] - 3]
    assert (scr[..., :3] == (0x06, 0xF8, 0x05)).all(axis=2).mean() > 0.9 and (scr[..., 3] == 255).all()      # the intro's lit green, flat
    assert len(np.unique(p[..., :3][shown], axis=0)) <= 64


def test_the_wordmark_layers_are_the_drops_own_at_one_letter_pixel_a_pixel():
    letters, glow = bt.wordmark()
    assert letters.size == glow.size == (194, 68) and letters.mode == glow.mode == 'RGBA'
    for layer, name in ((letters, 'T_wordmark.png'), (glow, 'T_wordmark_glow.png')):
        back = layer.resize((582, 204), Image.NEAREST)
        assert np.array_equal(np.asarray(back), np.asarray(src(name).convert('RGBA'))), f'{name} is this layer times three, exactly'
    wall = np.asarray(Image.open(os.path.join(ROOT, 'assets/intro/wall_logo.png')).convert('RGBA'))
    inner = np.asarray(letters)[8:8 + wall.shape[0], 8:8 + wall.shape[1]]
    assert wall.shape[:2] == (52, 178) and np.array_equal(inner[..., 3], wall[..., 3])
    assert np.array_equal(inner[wall[..., 3] > 0], wall[wall[..., 3] > 0]), 'the letters are the game\'s own wordmark: nothing generated'
    g = np.asarray(glow)
    assert set(np.unique(g[..., 3])) <= {0, 55, 110, 170}    # three hard steps, Rick's pick
    assert (g[..., :3][g[..., 3] > 0] == (0x46, 0x78, 0xFF)).all()


def test_the_glint_is_the_drops_four_frames_side_by_side():
    # Rick, 2026-11-18: "I asked for glints on the title."
    strip = bt.glint(); a = np.asarray(strip)
    assert strip.size == (88, 22) and strip.mode == 'RGBA'
    for i in range(4):
        assert np.array_equal(a[:, i * 22:(i + 1) * 22], np.asarray(src(f'T_glint_{i + 1}.png').convert('RGBA'))), f'frame {i + 1} is the drop\'s, untouched'
    assert set(np.unique(a[..., 3])) <= {0, 255}
    lit = [int((a[:, i * 22:(i + 1) * 22, 3] > 0).sum()) for i in range(4)]
    assert lit[0] < lit[1] < lit[2] > lit[3] > 0             # small, larger, largest, small again


def test_the_glints_sit_on_the_letters_highlights_and_stay_whole_on_the_picture():
    letters, _ = bt.wordmark(); a = np.asarray(letters).astype(int)
    pts = bt.GLINTS
    assert 6 <= len(pts) <= 12 and len(set(pts)) == len(pts)
    reach = 10.5 * bt.SCALE                                  # the largest frame's arms, in game pixels
    for x, y in pts:
        assert a[y, x, 3] > 0 and lum(a[y, x]) > 150, f'{(x, y)} is on a light edge of a letter'
        gx, gy = bt.LAYER_640[0] / 2 + (x + 0.5) * bt.SCALE, bt.LAYER_640[1] / 2 + (y + 0.5) * bt.SCALE
        assert reach <= gx <= 320 - reach and reach <= gy <= 200 - reach, f'{(x, y)}: the whole sparkle is on the picture'
    top, bottom = [q for q in pts if q[1] < 30], [q for q in pts if q[1] >= 30]
    assert pts == top + bottom and top == sorted(top) and bottom == sorted(bottom), 'across the top line, then the bottom one'
    assert len(top) >= 4 and len(bottom) >= 2


def test_the_manifest_puts_everything_where_rick_approved_it(tmp_path):
    m = bt.build(str(tmp_path))
    assert m == json.load(open(tmp_path / 'title.json'))
    assert set(m['images']) == {'plate', 'pager', 'wordmark', 'glow', 'glint'}
    assert m['glint'] == {'frames': 4, 'size': 22, 'points': [list(q) for q in bt.GLINTS]}      # in the wordmark layer's own pixels
    for n in m['images'].values(): assert os.path.exists(tmp_path / n)
    assert Image.open(tmp_path / m['images']['plate']).size == (320, 200)
    # the layer as mocked at 640x400, top left (-17, 10), three screen pixels a letter pixel there: half that here
    assert m['layer'] == {'x': -8.5, 'y': 5, 'w': 291, 'h': 102, 'scale': 1.5}
    L = m['letters']; assert L == {'x': 3.5, 'y': 17, 'w': 267, 'h': 78}
    assert L['x'] >= 0 and L['x'] + L['w'] <= m['frame']['x'], 'the letters stop short of the window frame'
    assert L['y'] + L['h'] <= 97, 'and above the towers'
    assert m['screen'] == bt.SCREEN and m['pager']['w'] > m['screen']['w'] and len(m['stars']) == 12
    assert m['print'] == {'x': 8, 'w': 182}                # the bottom rows are dark only left of the nightstand
    assert os.path.getsize(tmp_path / m['images']['plate']) < 60_000


def test_the_built_assets_are_the_builds_own(tmp_path):
    bt.build(str(tmp_path))
    for n in sorted(os.listdir(tmp_path)):
        assert open(tmp_path / n, 'rb').read() == open(os.path.join(ROOT, bt.OUT, n), 'rb').read(), f'assets/title/{n} is stale: run python3 tools/build_title.py'
