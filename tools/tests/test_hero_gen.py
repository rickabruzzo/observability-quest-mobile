"""The reference hero generator at the era-look size (Warp brief 09): a 56×144 canvas holding a figure about
136 px tall, redrawn to art-drops/2026-11-13-era-look-portraits/hero_model_sheet.png. The face, the hoodie's
details and the floor row are fixed here as coordinates; js/engine/hero.js and hero-side.js must match the
fixtures this file writes byte for byte."""
import json, os, subprocess, sys
from tools import hero_gen

W, H = hero_gen.W, hero_gen.H
T = hero_gen.TOP            # the figure's own rows start this far down the image


def test_canvas_is_56_by_144_and_the_standing_figure_about_136_tall():
    assert (W, H) == (56, 144)
    for name, cfg in hero_gen.PRESETS.items():
        im = hero_gen.hero(**cfg)
        assert im.size == (W, H) and im.mode == 'RGBA'
        rows = [y for y in range(H) if any(im.getpixel((x, y))[3] for x in range(W))]
        assert rows[-1] == hero_gen.FLOOR == H - 1, name                  # the shoes' lowest row is the canvas's last
        assert 130 <= rows[-1] - rows[0] + 1 <= 140, (name, rows[0], rows[-1])


def test_proportions_match_the_model_sheet():
    """About four and a half heads tall: the head about 30 px, shoulders about 46 across, hips narrower."""
    im = hero_gen.hero(**{**hero_gen.PRESETS['masc'], 'style': 'mohawk', 'beard': 'none'})      # bald temples: the head's own edges
    def width(y): xs = [x for x in range(W) if im.getpixel((x, y))[3]]; return (xs[-1] - xs[0] + 1) if xs else 0
    head_rows = [y for y in range(0, T + 40) if 16 <= width(y) <= 30]
    assert 26 <= len(head_rows) <= 34, head_rows
    assert max(width(y) for y in range(T + 40, T + 60)) in range(44, 49)              # shoulders, with the arms
    assert width(hero_gen.FLOOR - 20) < max(width(y) for y in range(T + 40, T + 60)) # legs narrower than the shoulders


def test_every_option_value_renders():
    for key, values in hero_gen.OPTIONS.items():
        for v in values:
            cfg = {**hero_gen.PRESETS['masc'], key: v}
            assert hero_gen.hero(**cfg).size == (W, H)


def test_every_pose_renders_and_differs_from_idle():
    base = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='idle').tobytes()
    for p in hero_gen.POSES[1:]:
        assert hero_gen.hero(**hero_gen.PRESETS['masc'], pose=p).tobytes() != base


def test_walk_frames_keep_the_shoes_on_the_floor_row():
    for p in ('walk1', 'walk2', 'walk3', 'walk4'):
        im = hero_gen.hero(**hero_gen.PRESETS['masc'], pose=p)
        low = max(y for y in range(H) for x in range(W) if im.getpixel((x, y))[3])
        assert low == hero_gen.FLOOR, p


def test_walk_offsets_doubled_with_the_canvas():
    assert hero_gen.WALK['walk1'] == (-2, 2, -4, 4, 0, 2, -2)
    assert hero_gen.WALK['walk3'] == (2, -2, 4, -4, 0, -2, 2)
    assert hero_gen.WALK['walk2'][4] == hero_gen.WALK['walk4'][4] == 2
    assert hero_gen.SIT_DY == 40


def test_silhouette_edge_is_outline_colour():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    px = im.load()
    top = next(y for y in range(H) if px[27, y][3])             # first opaque pixel down the centre column
    bottom = next(y for y in range(H - 1, -1, -1) if px[18, y][3])  # last opaque pixel up the left-shoe column
    assert bottom == H - 1
    assert px[27, top][:3] == hero_gen.OUTLINE[:3]
    assert px[18, bottom][:3] == hero_gen.OUTLINE[:3]


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
        assert os.path.getsize(tmp_path / f'{n}.rgba') == W * H * 4
        assert (tmp_path / f'{n}.png').exists()


def test_simplified_option_lists_and_presets_unchanged():
    o = hero_gen.OPTIONS
    assert o['body'] == ['masc', 'fem', 'nb'] and o['skin'] == [0, 1, 2, 3]
    assert o['hair'] == ['black', 'brown', 'blonde', 'ginger', 'violet']
    assert o['style'] == ['mohawk', 'standard', 'shoulder', 'long', 'fro']
    assert o['beard'] == ['none', 'short', 'long']
    assert o['hoodie'] == ['honey', 'ink', 'teal', 'indigo', 'lime'] and o['jeans'] == ['indigo', 'black', 'light', 'grey', 'khaki']
    assert o['glasses'] == ['none', 'glasses']
    assert hero_gen.PRESETS == {
        'masc': dict(body='masc', skin=0, hair='black', style='standard', beard='short', hoodie='ink', jeans='indigo', glasses='none'),
        'fem': dict(body='fem', skin=1, hair='brown', style='long', beard='none', hoodie='honey', jeans='black', glasses='glasses'),
        'nb': dict(body='nb', skin=0, hair='violet', style='mohawk', beard='none', hoodie='teal', jeans='grey', glasses='glasses'),
    }


def test_beard_uses_hair_colour():
    cfg = {**hero_gen.PRESETS['masc'], 'hair': 'ginger', 'beard': 'long'}
    im = hero_gen.hero(**cfg)
    ginger = [hero_gen.ramp(hero_gen.HAIR['ginger'], light=1.3, shade=0.7)[k][:3] for k in 'LBSD']
    assert im.getpixel((27, T + 40))[:3] in ginger                        # below the chin, on the chest


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
    skin = [hero_gen.ramp(hero_gen.SKIN[0], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
    assert pj.getpixel((18, T + 136))[:3] in skin                         # bare feet, not shoes
    assert base.getpixel((18, T + 136))[:3] not in skin


def test_situp_shows_head_to_waist_and_sits_lower():
    """Sitting up in bed, the covers come to the waist: nothing below SIT_CUT is drawn, and the figure sits SIT_DY lower."""
    im = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='situp', outfit='pj')
    rows = [y for y in range(H) if any(im.getpixel((x, y))[3] for x in range(W))]
    assert rows[0] >= T + hero_gen.SIT_DY
    assert rows[-1] == T + hero_gen.SIT_DY + hero_gen.SIT_CUT and hero_gen.SIT_CUT == 78    # the waist, so the head stays clear of the wall's title
    assert rows[-1] - rows[0] + 1 <= 76                                                       # about half the standing figure, hair included
    idle = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert im.tobytes() != idle.tobytes()


def test_new_fixture_names(tmp_path):
    hero_gen.write_fixtures(str(tmp_path))
    for n in ('masc-pj-idle', 'masc-pj-situp', 'fem-pj-walk1'):
        assert (tmp_path / f'{n}.rgba').exists()


def test_hoodie_carries_the_honeycomb_mark_from_the_tool_and_pyjamas_do_not():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    ax, ay = hero_gen.HC_MARK_AT
    got = {im.getpixel((ax + x, T + ay + y))[:3] for (x, y, _) in hero_gen.HC_MARK_PIXELS}
    assert got == {hero_gen.hexc(c)[:3] for c in hero_gen.HC_MARK.values()}
    assert 14 <= ax <= 18 and 46 <= ay <= 50                              # high on the chest, wearer's right of the drawstrings
    pj = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert not ({pj.getpixel((ax + x, T + ay + y))[:3] for (x, y, _) in hero_gen.HC_MARK_PIXELS} & got)
    walk = hero_gen.hero(**hero_gen.PRESETS['masc'], pose='walk2')        # the mark rides the body's bob
    x, y, k = hero_gen.HC_MARK_PIXELS[0]
    assert walk.getpixel((ax + x, T + ay + y + 2))[:3] == hero_gen.hexc(hero_gen.HC_MARK[k])[:3]


def test_the_mark_table_is_the_tools_not_a_drawing():
    table = json.load(open('tools/hc_mark.json'))
    assert hero_gen.HC_MARK_PIXELS == [tuple(p) for p in table['pixels']]
    assert hero_gen.HC_MARK == table['colours']


def _head(**kw):
    return hero_gen.hero(**{**hero_gen.PRESETS['masc'], 'beard': 'none', 'hair': 'ginger', 'skin': 1, **kw})


def test_nothing_is_drawn_left_of_the_arm():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    assert all(im.getpixel((x, y))[3] == 0 for x in range(0, 3) for y in range(T + 60, T + 100))


def test_the_face_has_two_eyes_with_a_highlight_a_nose_and_a_mouth():
    im = _head()
    skin = hero_gen.ramp(hero_gen.SKIN[1], light=1.12, shade=0.8, dark=0.62)
    for ex in hero_gen.EYES:                                              # each eye: white, a dark pupil, a glint
        cols = {im.getpixel((x, T + y))[:3] for x in range(ex, ex + 4) for y in (19, 20)}
        assert hero_gen.EYE_WHITE[:3] in cols and hero_gen.OUTLINE[:3] in cols, ex
        assert im.getpixel((ex + 2, T + 19))[:3] == hero_gen.EYE_WHITE[:3]    # the glint, top of the pupil
    assert im.getpixel((28, T + 24))[:3] == skin['S'][:3]                     # the nose's shaded side
    assert all(im.getpixel((x, T + 29))[:3] == skin['D'][:3] for x in range(25, 31))   # the mouth
    hair_d = hero_gen.ramp(hero_gen.HAIR['ginger'], light=1.35, shade=0.7)['D'][:3]
    assert all(im.getpixel((x, T + 17))[:3] == hair_d for x in (19, 20, 21, 34, 35, 36))   # brows


def test_glasses_are_a_frame_round_each_eye():
    im = _head(glasses='glasses'); f = hero_gen.GLASSES[:3]
    for ex in hero_gen.EYES:
        x0, x1 = ex - 1, ex + 4
        ring = [(x, T + 17) for x in range(x0 + 1, x1)] + [(x, T + 22) for x in range(x0 + 1, x1)] + [(x0, T + y) for y in range(18, 22)] + [(x1, T + y) for y in range(18, 22)]
        assert all(im.getpixel(p)[:3] == f for p in ring), ex
        inside = {im.getpixel((x, T + y))[:3] for x in range(x0 + 1, x1) for y in range(18, 22)}
        assert f not in inside and hero_gen.EYE_WHITE[:3] in inside           # the eye shows through
    assert all(im.getpixel((x, T + 19))[:3] == f for x in range(hero_gen.EYES[0] + 5, hero_gen.EYES[1] - 1))   # bridge
    assert im.getpixel((16, T + 19))[:3] == f and im.getpixel((39, T + 19))[:3] == f  # arms to the ears


def test_hands_show_below_the_sleeves():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    skin = [hero_gen.ramp(hero_gen.SKIN[0], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
    for x in (6, 49):
        assert im.getpixel((x, T + 90))[:3] in skin, x
        assert im.getpixel((x, T + 80))[:3] not in skin, x                # sleeve above


def test_hoodie_has_drawstrings_a_pocket_and_a_hem():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    hood = hero_gen.ramp(hero_gen.HOODIE['ink'])
    assert all(im.getpixel((x, T + y))[:3] == hood['L'][:3] for x in hero_gen.DRAWSTRINGS for y in (50, 56))
    assert all(im.getpixel((x, T + 75))[:3] == hood['S'][:3] for x in range(20, 36))  # the pocket's top edge
    assert all(im.getpixel((x, T + 91))[:3] == hood['D'][:3] for x in range(14, 42))  # the hem
    pj = hero_gen.hero(**hero_gen.PRESETS['masc'], outfit='pj')
    assert pj.getpixel((hero_gen.DRAWSTRINGS[0], T + 50))[:3] != hood['L'][:3]


def test_jeans_have_a_seam_a_knee_and_a_cuff_and_shoes_a_sole():
    im = hero_gen.hero(**hero_gen.PRESETS['masc'])
    jean = hero_gen.ramp(hero_gen.JEANS['indigo'], light=1.25, shade=0.72)
    assert im.getpixel((13, T + 110))[:3] == jean['L'][:3]                # seam down the left leg
    assert im.getpixel((18, T + 112))[:3] == jean['S'][:3]                # knee
    assert im.getpixel((18, T + 132))[:3] == jean['S'][:3]                # cuff
    assert im.getpixel((18, T + 138))[:3] == hero_gen.SOLE[:3]            # sole
    assert im.getpixel((18, T + 135))[:3] != hero_gen.SOLE[:3]


def test_mohawk_keeps_the_head_round():
    mo, st = _head(style='mohawk'), _head(style='standard')
    def width(im, y): xs = [x for x in range(W) if im.getpixel((x, y))[3]]; return xs[-1] - xs[0] + 1
    for y in (12, 14, 16): assert width(mo, T + y) >= width(st, T + y) - 2, y     # as wide as any other head at the temples
    ridge = [x for x in range(W) if mo.getpixel((x, T + 4))[3]]
    assert ridge and ridge[-1] - ridge[0] + 1 >= 8                        # a flat-topped strip, not a point


def test_standard_hair_stays_inside_the_head():
    st, bald = _head(style='standard'), _head(style='mohawk')
    for y in range(T + 17, T + 36):
        xs = [x for x in range(W) if st.getpixel((x, y))[3]]; xb = [x for x in range(W) if bald.getpixel((x, y))[3]]
        assert xs[0] >= xb[0] and xs[-1] <= xb[-1], y                     # no strands hanging outside the face


def test_longer_hair_fills_in_behind_the_neck():
    ginger = [hero_gen.ramp(hero_gen.HAIR['ginger'], light=1.35, shade=0.7)[k][:3] for k in 'LBSD']
    for style in ('shoulder', 'long'):
        im = _head(style=style)
        assert im.getpixel((20, T + 38))[:3] in ginger and im.getpixel((35, T + 38))[:3] in ginger, style   # beside the neck, not background
        for y in range(T + 17, T + 36):
            row = [im.getpixel((x, y)) for x in range(13, 43)]
            assert all(p[3] == 255 for p in row), (style, y)              # one solid mass, no gaps between hair and face


def test_every_style_shows_a_forehead():
    skin = [hero_gen.ramp(hero_gen.SKIN[1], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
    for style in hero_gen.OPTIONS['style']:
        im = _head(style=style)
        rows = [y for y in (13, 14, 15, 16) if all(im.getpixel((x, T + y))[:3] in skin for x in range(22, 34))]
        assert len(rows) >= (2 if style == 'fro' else 4), (style, rows)  # clear skin between hair and brows


# ---- profile view (hero_side) ----

def test_side_rounding_is_half_up_not_bankers():
    assert hero_gen._r(2.5) == 3 and hero_gen._r(3.5) == 4
    assert hero_gen._r(0.5) == 1 and hero_gen._r(1.5) == 2
    assert hero_gen._r(-2.5) == -2 and hero_gen._r(-3.5) == -3
    assert hero_gen._r(2.49) == 2 and hero_gen._r(2.51) == 3


def test_side_poses_are_stand_plus_an_eight_frame_walk():
    assert hero_gen.SIDE_POSES == ['stand', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8']
    assert (hero_gen.THIGH, hero_gen.SHIN, hero_gen.UPPER, hero_gen.FORE) == (22, 22, 20, 18)   # twice the old limbs


def test_every_side_pose_renders_and_differs_from_standing():
    base = hero_gen.hero_side(**hero_gen.PRESETS['nb'], pose='stand').tobytes()
    for p in hero_gen.SIDE_POSES[1:]:
        im = hero_gen.hero_side(**hero_gen.PRESETS['nb'], pose=p)
        assert im.size == (W, H) and im.mode == 'RGBA'
        assert im.tobytes() != base, p


def test_side_figure_is_about_26_deep_and_as_tall_as_the_front():
    im = hero_gen.hero_side(**{**hero_gen.PRESETS['masc'], 'style': 'mohawk', 'beard': 'none'})
    def span(y): xs = [x for x in range(W) if im.getpixel((x, y))[3]]; return xs
    torso = span(T + 70); assert 24 <= torso[-1] - torso[0] + 1 <= 30, torso
    rows = [y for y in range(H) if any(im.getpixel((x, y))[3] for x in range(W))]
    front = hero_gen.hero(**{**hero_gen.PRESETS['masc'], 'style': 'mohawk', 'beard': 'none'})
    frows = [y for y in range(H) if any(front.getpixel((x, y))[3] for x in range(W))]
    assert abs(rows[0] - frows[0]) <= 2 and rows[-1] == hero_gen.FLOOR


def test_side_fixtures_cover_the_whole_character_sheet():
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
        assert os.path.getsize(tmp_path / f'{n}.rgba') == W * H * 4
        assert (tmp_path / f'{n}.png').exists()


def test_side_fixtures_cli_does_not_touch_the_front_view_fixtures():
    assert not (set(hero_gen.FIXTURES) & set(hero_gen.SIDE_FIXTURES))


def test_side_faces_right_and_the_nose_leads():
    im = hero_gen.hero_side(**hero_gen.PRESETS['masc'])
    xs = [x for x in range(W) if im.getpixel((x, T + 24))[3]]
    assert xs[-1] >= 40                                                   # the nose reaches past the skull


def test_side_feet_stay_on_one_floor_line():
    """The planted shoe is on the same row in every frame, so the body rides the legs evenly and nothing hops."""
    for name, cfg in hero_gen.PRESETS.items():
        for pose in hero_gen.SIDE_POSES:
            im = hero_gen.hero_side(**cfg, pose=pose)
            low = max(y for y in range(H) for x in range(W) if im.getpixel((x, y))[3])
            assert low == hero_gen.FLOOR, (name, pose, low)


def test_standing_profile_shows_the_far_arm_behind_the_body():
    for name, cfg in hero_gen.PRESETS.items():
        im = hero_gen.hero_side(**cfg, pose='stand')
        behind = [(x, y) for y in range(T + 68, T + 96) for x in range(6, 16) if im.getpixel((x, y))[3]]
        assert len(behind) >= 20, (name, len(behind))                    # a sliver of sleeve and hand at the back
        skin = [hero_gen.ramp(hero_gen.SKIN[cfg['skin']], light=1.12, shade=0.8, dark=0.62)[k][:3] for k in 'LBSD']
        assert any(im.getpixel(p)[:3] in skin for p in behind), name     # including the hand


def test_side_hoodie_carries_the_mark_on_the_leading_side():
    im = hero_gen.hero_side(**hero_gen.PRESETS['masc'])
    ax, ay = hero_gen.HC_MARK_SIDE_AT
    got = {im.getpixel((ax + x, T + ay + y))[:3] for (x, y, _) in hero_gen.HC_MARK_PIXELS}
    assert got == {hero_gen.hexc(c)[:3] for c in hero_gen.HC_MARK.values()}
    assert ax > 26                                                        # the chest's leading (right) side


def test_contact_sheet_covers_the_five_looks_in_both_views(tmp_path):
    hero_gen.write_contact(str(tmp_path))
    assert (tmp_path / 'contact.png').exists() and (tmp_path / 'contact-side.png').exists()
    assert len(hero_gen.SHEET) == 5 and all(k in hero_gen.SHEET for k in hero_gen.PRESETS)
