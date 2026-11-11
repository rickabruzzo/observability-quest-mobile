import json, os, subprocess, sys
from tools import hero_gen


def test_hero_is_28_by_72_rgba():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    assert im.size == (28, 72) and im.mode == 'RGBA'


def test_every_option_value_renders():
    for key, values in hero_gen.OPTIONS.items():
        for v in values:
            cfg = {**hero_gen.PRESETS['masc'], key: v}
            assert hero_gen.hero(**cfg).size == (28, 72)


def test_every_pose_renders_and_differs_from_idle():
    base = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='idle').tobytes()
    for p in hero_gen.POSES[1:]:
        assert hero_gen.hero(**hero_gen.PRESETS['masc'], pose=p).tobytes() != base


def test_silhouette_edge_is_outline_colour():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    px = im.load()
    top = next(y for y in range(72) if px[13, y][3])          # first opaque pixel down the centre column
    bottom = next(y for y in range(71, -1, -1) if px[9, y][3])  # last opaque pixel up the left-shoe column
    assert px[13, top][:3] == hero_gen.OUTLINE[:3]
    assert px[9, bottom][:3] == hero_gen.OUTLINE[:3]


def test_deterministic():
    a = hero_gen.hero(**hero_gen.PRESETS['fem']).tobytes()
    b = hero_gen.hero(**hero_gen.PRESETS['fem']).tobytes()
    assert a == b


def test_fixtures_cli_writes_json_rgba_png(tmp_path):
    subprocess.run([sys.executable, 'tools/hero_gen.py', '--fixtures', str(tmp_path)], check=True)
    names = sorted(p[:-5] for p in os.listdir(tmp_path) if p.endswith('.json'))
    assert 'masc-idle' in names and 'masc-walk3' in names and 'var-locs' in names
    for n in names:
        cfg = json.load(open(tmp_path / f'{n}.json'))
        assert set(cfg) == set(hero_gen.CONFIG_KEYS) | {'pose'}
        assert os.path.getsize(tmp_path / f'{n}.rgba') == 28 * 72 * 4
        assert (tmp_path / f'{n}.png').exists()
