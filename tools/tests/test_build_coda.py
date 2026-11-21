"""The sunrise coda's pictures and their manifest (the ending; art brief 09, delivered 2026-11-19).

One painting, the street just after sunrise, and what the build makes of it: three earlier, darker pictures by
recolouring; the open door as a patch; the sun at game size; and the layout Art Claude's hand-back measured. These
tests state what the game relies on.
"""
import json, os, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
from tools import build_coda as bc

ROOT = bc.ROOT
HERO_ROWS = 136                                   # the standing figure's height in his own pixels (js/engine/hero.js)
lum = lambda a: 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def built(tmp_path):
    m = bc.build(str(tmp_path))
    return m, lambda n: Image.open(tmp_path / n)


def test_the_dawn_is_four_whole_pictures_each_lighter_than_the_last(tmp_path):
    m, im = built(tmp_path)
    frames = m['images']['frames']
    assert len(frames) == 4
    sky = m['sky']; means = []; lums = []
    for n in frames:
        p = im(n).convert('RGB'); assert p.size == (320, 200)
        a = np.asarray(p).astype(int)
        assert len(np.unique(a.reshape(-1, 3), axis=0)) <= 192
        means.append(lum(a[sky['y']:sky['y'] + sky['h'], sky['x']:sky['x'] + sky['w']]).mean()); lums.append(lum(a))
    assert all(b > a + 8 for a, b in zip(means, means[1:])), means        # steps you can see, not a fade
    assert lum(np.asarray(im(frames[0]).convert('RGB')).astype(int)).mean() > 30, 'the first is before dawn, not black'


def test_the_last_picture_is_the_painting_and_the_earlier_ones_are_it_recoloured(tmp_path):
    m, im = built(tmp_path)
    frames = [np.asarray(im(n).convert('RGB')).astype(int) for n in m['images']['frames']]
    painting = np.asarray(Image.open(os.path.join(ROOT, bc.SRC, 'E_dawn.png')).convert('RGB').resize((320, 200), Image.NEAREST)).astype(int)
    assert np.abs(frames[3] - painting).mean() < 4
    for k in (0, 1, 2):
        r = np.corrcoef(lum(frames[k]).ravel(), lum(painting).ravel())[0, 1]
        assert r > 0.9, f'picture {k} is the same street, darker ({r:.2f})'
        blue = frames[k][..., 2].mean() / max(1, frames[k][..., 0].mean()); late = painting[..., 2].mean() / painting[..., 0].mean()
        assert blue > late, f'picture {k} is cooler than the sunrise'


def test_the_door_opens_as_a_patch_of_only_what_changed_in_the_first_pictures_light(tmp_path):
    m, im = built(tmp_path)
    d = m['door']; patch = im(m['images']['door'])
    assert patch.mode == 'RGBA' and patch.size == (d['w'], d['h'])
    e = bc.DOOR_EDIT                                                   # the hand-back: the edit touches only this
    assert e['x'] <= d['x'] and d['x'] + d['w'] <= e['x'] + e['w'] and e['y'] <= d['y'] and d['y'] + d['h'] <= e['y'] + e['h']
    p = np.asarray(patch).astype(int); shown = p[..., 3] > 0
    assert set(np.unique(p[..., 3])) <= {0, 255} and 0.3 < shown.mean() < 0.98
    shut = np.asarray(Image.open(os.path.join(ROOT, bc.SRC, 'E_dawn.png')).convert('RGB').resize((320, 200), Image.NEAREST)).astype(int)
    opened = np.asarray(Image.open(os.path.join(ROOT, bc.SRC, 'E_dawn_door.png')).convert('RGB').resize((320, 200), Image.NEAREST)).astype(int)
    differs = (np.abs(opened - shut).sum(axis=2) > 0)[d['y']:d['y'] + d['h'], d['x']:d['x'] + d['w']]
    assert np.array_equal(shown, differs), 'opaque exactly where the open door differs from the shut one'
    # the door opens while the street is still in its first, darkest picture: the patch is in that light
    first = np.asarray(im(m['images']['frames'][0]).convert('RGB')).astype(int)
    assert lum(p[..., :3])[shown].max() <= lum(first).max() + 12
    assert lum(p[..., :3])[shown].mean() < 60, 'a dark lobby'


def test_he_fits_the_doorway_and_the_words_fit_above_his_head(tmp_path):
    m, im = built(tmp_path)
    tall, half = round(HERO_ROWS * m['heroScale']), round(48 * m['heroScale'] / 2)
    d, way = m['door'], m['doorway']
    shown = np.asarray(im(m['images']['door']))[..., 3] > 0
    # the open doorway, in the column where the middle of his feet stands and across his width
    col = np.where(shown[:, way['x'] - d['x']])[0]
    top, bottom = d['y'] + col.min(), d['y'] + col.max()
    assert bottom - top + 1 >= tall + 2, f'the doorway there is {bottom - top + 1} tall and he is {tall}'
    assert top + 1 <= way['y'] - tall and way['y'] <= bottom + 1, 'he stands in it, head under its top, feet on its threshold'
    for x in (way['x'] - half + 2, way['x'] + half - 2):
        assert shown[way['y'] - d['y'] - tall // 2, x - d['x']], 'the whole of his width is inside the opening'
    assert way['y'] <= m['floorY'], 'the threshold is no nearer us than the pavement line'
    assert m['floorY'] - tall >= m['windowBottom'] + 6, 'a window that ends at windowBottom clears his head'
    assert way['x'] + 40 <= m['stand']['x'] <= 300 and 150 <= m['floorY'] <= 196


def test_the_sun_comes_up_from_behind_the_horizon_inside_the_open_sky(tmp_path):
    m, im = built(tmp_path)
    s, sky = m['sun'], m['sky']; sun = im(m['images']['sun'])
    assert sun.mode == 'RGBA' and sun.size == (s['w'], s['h'])
    assert set(np.unique(np.asarray(sun)[..., 3])) <= {0, 255}, 'hard edged'
    assert sky['x'] <= s['x'] and s['x'] + s['w'] <= sky['x'] + sky['w']
    assert s['y0'] >= sky['y'] + sky['h'], 'it starts wholly below the horizon'
    assert sky['y'] <= s['y1'] and s['y1'] + s['h'] <= sky['y'] + sky['h'], 'and ends wholly above it'
    assert s['y1'] >= m['windowBottom'], 'below the words'
    assert s['x'] >= m['stand']['x'] + 30, 'beside where he stands, not behind his head'
    # the hand-back's clear stretch: in the painting nothing but sky stands above the horizon where the sun shows
    last = np.asarray(im(m['images']['frames'][-1]).convert('RGB')).astype(int)
    column = last[sky['y']:sky['y'] + sky['h'], s['x']:s['x'] + s['w']]
    assert lum(column).min() > 110, 'pure sky in the sun\'s column'
    assert sky['y'] + sky['h'] == bc.HORIZON_Y and lum(last[bc.HORIZON_Y, s['x']:s['x'] + s['w']]).mean() < lum(column[-3:]).mean() - 20, 'and the ground\'s dark edge right under it'
    assert s['x'] - 0 >= 155, 'the hand-back: the sun\'s left edge at x 155 or more'


def test_the_manifest_is_whole_and_says_whether_the_pictures_are_stand_ins(tmp_path):
    m, _ = built(tmp_path)
    assert m == json.load(open(tmp_path / 'coda.json'))
    assert set(m) == {'placeholder', 'images', 'floorY', 'heroScale', 'door', 'doorway', 'stand', 'sun', 'sky', 'windowBottom'}
    assert set(m['images']) == {'frames', 'door', 'sun'}
    assert m['placeholder'] is False and bc.SRC == 'art-drops/2026-11-19-the-sunrise', 'the stand-ins are gone'
    for n in m['images']['frames'] + [m['images']['door'], m['images']['sun']]: assert os.path.exists(tmp_path / n)


def test_the_built_assets_are_the_builds_own(tmp_path):
    bc.build(str(tmp_path))
    for n in sorted(os.listdir(tmp_path)):
        assert open(tmp_path / n, 'rb').read() == open(os.path.join(ROOT, bc.OUT, n), 'rb').read(), f'assets/coda/{n} is stale: run python3 tools/build_coda.py'
