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
    assert 'masc-idle' in names and 'masc-walk3' in names and 'var-fro' in names
    for n in names:
        cfg = json.load(open(tmp_path / f'{n}.json'))
        assert set(cfg) == set(hero_gen.CONFIG_KEYS) | {'pose', 'outfit'}
        assert os.path.getsize(tmp_path / f'{n}.rgba') == 28 * 72 * 4
        assert (tmp_path / f'{n}.png').exists()


def test_simplified_option_lists():
    o = hero_gen.OPTIONS
    assert o['skin'] == [0, 1, 2, 3]                                  # the palest tone is gone
    assert o['style'] == ['mohawk', 'standard', 'shoulder', 'long', 'fro']   # mohawk = buzzed sides, short top
    assert o['beard'] == ['none', 'short', 'long']
    assert o['glasses'] == ['none', 'glasses']
    assert 'length' not in o and 'beardCol' not in o


def test_beard_uses_hair_colour():
    cfg = {**hero_gen.PRESETS['masc'], 'hair': 'ginger', 'beard': 'long'}
    im = hero_gen.hero(**cfg)
    ginger = hero_gen.hexc(hero_gen.HAIR['ginger'])[:3]
    beard_px = im.getpixel((13, 20))[:3]                              # chin area of the long beard
    assert beard_px == ginger or beard_px == hero_gen.ramp(hero_gen.HAIR['ginger'], light=1.3, shade=0.7)['S'][:3]


def test_styles_differ_from_each_other():
    seen = set()
    for st in hero_gen.OPTIONS['style']:
        b = hero_gen.hero(**{**hero_gen.PRESETS['masc'], 'style': st}).tobytes()
        assert b not in seen, st
        seen.add(b)


def test_pj_outfit_differs_and_drops_the_item():
    base = hero_gen.hero(**hero_gen.PRESETS['masc'])
    pj = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert pj.tobytes() != base.tobytes()
    assert pj.getpixel((2, 37))[3] == 0            # where the laptop was
    assert pj.getpixel((9, 70))[:3] != base.getpixel((9, 70))[:3]   # bare feet, not shoes


def test_situp_has_no_legs_and_sits_lower():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='situp', outfit='pj')
    top = next(y for y in range(72) if any(im.getpixel((x, y))[3] for x in range(28)))
    assert top >= 20
    idle = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert im.tobytes() != idle.tobytes()


def test_new_fixture_names(tmp_path):
    hero_gen.write_fixtures(str(tmp_path))
    for n in ('masc-pj-idle', 'masc-pj-situp', 'fem-pj-walk1'):
        assert (tmp_path / f'{n}.rgba').exists()
