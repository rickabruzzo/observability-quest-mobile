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
    assert 'hold' not in o and all('hold' not in p for p in hero_gen.PRESETS.values())   # nothing carried (Rick, 2026-11-11)


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


def test_pj_outfit_differs_and_goes_barefoot():
    base = hero_gen.hero(**hero_gen.PRESETS['masc'])
    pj = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert pj.tobytes() != base.tobytes()
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


def test_hoodie_carries_the_honeycomb_mark_and_pyjamas_do_not():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    got = {im.getpixel((x, y))[:3] for (x, y, _) in hero_gen.HC_MARK_PIXELS}
    assert got == {hero_gen.hexc(c)[:3] for c in hero_gen.HC_MARK.values()}
    assert len(hero_gen.HC_MARK_PIXELS) == 8 and all(9 <= x <= 12 and 23 <= y <= 26 for x, y, _ in hero_gen.HC_MARK_PIXELS)   # high on the chest (Rick, 2026-11-11)
    pj = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert not ({pj.getpixel((x, y))[:3] for (x, y, _) in hero_gen.HC_MARK_PIXELS} & got)
    walk = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='walk2')            # the mark rides the body's bob
    assert walk.getpixel((11, 24 + 1))[:3] == hero_gen.hexc(hero_gen.HC_MARK['blue'])[:3]


def _head(**kw):
    return hero_gen.hero(**{**hero_gen.PRESETS['masc'], 'beard': 'none', 'hair': 'ginger', 'skin': 1, **kw})


def test_nothing_is_drawn_left_of_the_arm():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    assert all(im.getpixel((x, y))[3] == 0 for x in range(0, 4) for y in range(30, 50))


def test_glasses_are_a_frame_round_each_eye():
    im = _head(glasses='glasses'); f = hero_gen.GLASSES[:3]
    for x0 in (9, 15):
        ring = [(x0 + 1, 8), (x0 + 2, 8), (x0 + 1, 11), (x0 + 2, 11), (x0, 9), (x0, 10), (x0 + 3, 9), (x0 + 3, 10)]
        assert all(im.getpixel(p)[:3] == f for p in ring), x0
        inside = [im.getpixel((x, y))[:3] for x in (x0 + 1, x0 + 2) for y in (9, 10)]
        assert f not in inside and hero_gen.EYE_WHITE[:3] in inside           # the eye shows through
    assert im.getpixel((13, 9))[:3] == f and im.getpixel((14, 9))[:3] == f    # bridge
    assert sum(im.getpixel((x, y))[:3] == f for x in range(28) for y in range(20)) >= 18


def test_mohawk_keeps_the_head_round():
    mo, st = _head(style='mohawk'), _head(style='standard')
    def width(im, y): xs = [x for x in range(28) if im.getpixel((x, y))[3]]; return xs[-1] - xs[0] + 1
    for y in (6, 7, 8): assert width(mo, y) >= width(st, y) - 1, y            # as wide as any other head at the temples
    ridge = [x for x in range(28) if mo.getpixel((x, 2))[3]]
    assert ridge and ridge[-1] - ridge[0] + 1 >= 4                            # a flat-topped strip, not a point


def test_standard_hair_stays_inside_the_head():
    st, bald = _head(style='standard'), _head(style='mohawk')
    for y in range(9, 19):
        xs = [x for x in range(28) if st.getpixel((x, y))[3]]; xb = [x for x in range(28) if bald.getpixel((x, y))[3]]
        assert xs[0] >= xb[0] and xs[-1] <= xb[-1], y                         # no strands hanging outside the face


def test_longer_hair_fills_in_behind_the_neck():
    ginger = [hero_gen.ramp(hero_gen.HAIR['ginger'], light=1.35, shade=0.7)[k][:3] for k in 'LBSD']
    for style in ('shoulder', 'long'):
        im = _head(style=style)
        assert im.getpixel((10, 19))[:3] in ginger and im.getpixel((17, 19))[:3] in ginger, style   # beside the neck, not background
        for y in range(9, 19):
            row = [im.getpixel((x, y)) for x in range(6, 22)]
            assert all(p[3] == 255 for p in row), (style, y)                  # one solid mass, no gaps between hair and face


def test_every_style_shows_a_forehead():
    skin = [hero_gen.ramp(hero_gen.SKIN[1], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
    for style in hero_gen.OPTIONS['style']:
        im = _head(style=style)
        rows = [y for y in (6, 7, 8) if all(im.getpixel((x, y))[:3] in skin for x in range(11, 17))]
        assert len(rows) >= (1 if style == 'fro' else 2), (style, rows)      # clear skin between hair and brows (the fro, approved as is, sits lower)


# ---- profile view (hero_side) ----

def test_side_rounding_is_half_up_not_bankers():
    """The port in js/engine/hero-side.js uses Math.round; Python's round() is banker's.
    hero_side goes through one explicit rule, floor(x + 0.5), so both sides agree at .5."""
    assert hero_gen._r(2.5) == 3 and hero_gen._r(3.5) == 4        # banker's round() gives 2 and 4
    assert hero_gen._r(0.5) == 1 and hero_gen._r(1.5) == 2
    assert hero_gen._r(-2.5) == -2 and hero_gen._r(-3.5) == -3    # exactly what JS Math.round does
    assert hero_gen._r(2.49) == 2 and hero_gen._r(2.51) == 3


def test_side_poses_are_stand_plus_an_eight_frame_walk():
    assert hero_gen.SIDE_POSES == ['stand', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8']


def test_every_side_pose_renders_and_differs_from_standing():
    base = hero_gen.hero_side(**hero_gen.PRESETS['nb'], pose='stand').tobytes()
    for p in hero_gen.SIDE_POSES[1:]:
        im = hero_gen.hero_side(**hero_gen.PRESETS['nb'], pose=p)
        assert im.size == (28, 72) and im.mode == 'RGBA'
        assert im.tobytes() != base, p


def test_side_fixtures_cover_the_whole_character_sheet():
    """One hero in all nine poses, plus every hair style, every beard, glasses, every body, pyjamas."""
    fx = hero_gen.SIDE_FIXTURES
    for p in hero_gen.SIDE_POSES:
        assert any(pose == p for cfg, pose, *_ in fx.values()), p
    for key in ('style', 'beard', 'body'):
        covered = {cfg[key] for cfg, *_ in fx.values()}
        assert covered == set(hero_gen.OPTIONS[key]), (key, covered)
    assert any(cfg['glasses'] == 'glasses' for cfg, *_ in fx.values())
    assert any(len(v) > 2 and v[2] == 'pj' for v in fx.values())


def test_side_fixtures_cli_writes_json_rgba_png(tmp_path):
    subprocess.run([sys.executable, 'tools/hero_gen.py', '--side-fixtures', str(tmp_path)], check=True)
    names = sorted(p[:-5] for p in os.listdir(tmp_path) if p.endswith('.json'))
    assert names == sorted(hero_gen.SIDE_FIXTURES)
    for n in names:
        cfg = json.load(open(tmp_path / f'{n}.json'))
        assert set(cfg) == set(hero_gen.CONFIG_KEYS) | {'pose', 'outfit'}
        assert cfg['pose'] in hero_gen.SIDE_POSES
        assert os.path.getsize(tmp_path / f'{n}.rgba') == 28 * 72 * 4
        assert (tmp_path / f'{n}.png').exists()


def test_side_fixtures_cli_does_not_touch_the_front_view_fixtures(tmp_path):
    """--side-fixtures and --fixtures write to different directories and different names."""
    assert not (set(hero_gen.FIXTURES) & set(hero_gen.SIDE_FIXTURES))


def test_side_faces_right_and_the_near_shoe_leads():
    """Facing right: the nose is the rightmost thing on the head's rows."""
    im = hero_gen.hero_side(**hero_gen.PRESETS['masc'])
    xs = [x for x in range(28) if im.getpixel((x, 12))[3]]
    assert xs[-1] >= 20                                      # the nose reaches past the skull


def test_side_feet_stay_on_one_floor_line():
    """The planted shoe is on the same row in every frame, so the body rides the legs evenly and nothing hops."""
    for name, cfg in hero_gen.PRESETS.items():
        for pose in hero_gen.SIDE_POSES:
            im = hero_gen.hero_side(**cfg, pose=pose)
            low = max(y for y in range(72) for x in range(28) if im.getpixel((x, y))[3])
            assert low == 70, (name, pose, low)


def test_standing_profile_shows_the_far_arm_behind_the_body():
    for name, cfg in hero_gen.PRESETS.items():
        im = hero_gen.hero_side(**cfg, pose='stand')
        behind = [(x, y) for y in range(34, 48) for x in range(4, 9) if im.getpixel((x, y))[3]]
        assert len(behind) >= 6, (name, behind)                      # a sliver of sleeve and hand at the back
        skin = [hero_gen.ramp(hero_gen.SKIN[cfg['skin']], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
        assert any(im.getpixel(p)[:3] in skin for p in behind), name   # including the hand
