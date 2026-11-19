"""The sunrise coda's pictures and their manifest (the ending; Rick, 2026-11-18: "the sunrise animation and play
more screen can be built").

Until art brief 09's painting is delivered, the build draws labelled stand-ins to the same layout, so the ending
can be built now and the art dropped in afterwards with no change to the game. These tests hold either way: they
state what the game relies on, not what the pictures look like.
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
    sky = m['sky']; means = []
    for n in frames:
        p = im(n).convert('RGB'); assert p.size == (320, 200)
        a = np.asarray(p).astype(int)
        assert len(np.unique(a.reshape(-1, 3), axis=0)) <= 192
        means.append(lum(a[sky['y']:sky['y'] + sky['h'], sky['x']:sky['x'] + sky['w']]).mean())
    assert all(b > a + 8 for a, b in zip(means, means[1:])), means        # steps you can see, not a fade


def test_the_door_opens_as_a_patch_where_the_manifest_says(tmp_path):
    m, im = built(tmp_path)
    d = m['door']; patch = im(m['images']['door'])
    assert patch.size == (d['w'], d['h'])
    assert d['x'] >= 0 and d['y'] >= 0 and d['x'] + d['w'] <= 320 and d['y'] + d['h'] <= 200
    last = np.asarray(im(m['images']['frames'][-1]).convert('RGB')).astype(int)[d['y']:d['y'] + d['h'], d['x']:d['x'] + d['w']]
    assert np.abs(np.asarray(patch.convert('RGB')).astype(int) - last).sum() > 0, 'the open door is not the shut one'


def test_he_fits_the_doorway_and_the_words_fit_above_his_head(tmp_path):
    m, _ = built(tmp_path)
    tall = round(HERO_ROWS * m['heroScale'])
    d, way = m['door'], m['doorway']
    assert d['x'] + 12 <= way['x'] <= d['x'] + d['w'] - 12, 'he stands inside the doorway'
    assert d['y'] + d['h'] - 6 <= way['y'] <= m['floorY'], 'on its threshold, no nearer us than the pavement'
    assert way['y'] - tall >= d['y'], 'the door is tall enough for him'
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


def test_the_manifest_is_whole_and_says_whether_the_pictures_are_stand_ins(tmp_path):
    m, _ = built(tmp_path)
    assert m == json.load(open(tmp_path / 'coda.json'))
    assert set(m) == {'placeholder', 'images', 'floorY', 'heroScale', 'door', 'doorway', 'stand', 'sun', 'sky', 'windowBottom'}
    assert set(m['images']) == {'frames', 'door', 'sun'}
    assert m['placeholder'] is (bc.SRC is None), 'stand-ins exactly until the art is named in the build'
    for n in m['images']['frames'] + [m['images']['door'], m['images']['sun']]: assert os.path.exists(tmp_path / n)


def test_the_built_assets_are_the_builds_own(tmp_path):
    bc.build(str(tmp_path))
    for n in sorted(os.listdir(tmp_path)):
        assert open(tmp_path / n, 'rb').read() == open(os.path.join(ROOT, bc.OUT, n), 'rb').read(), f'assets/coda/{n} is stale: run python3 tools/build_coda.py'
