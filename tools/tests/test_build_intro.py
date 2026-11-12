import json, os
from PIL import Image
from tools import build_intro as bi

ALL = ['A_room_dark', 'B_nightstand', 'B_arm', 'C_face_asleep', 'C_eye_crack',
       'C_awake', 'C_awake_lit', 'C_misery', 'D_bedroom_vga']


def test_placeholders_build_a_complete_manifest(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert m['placeholder'] is True and m['size'] == [320, 200]
    for n in ALL:
        p = tmp_path / 'out' / m['images'][n]
        assert Image.open(p).size == (320, 200), n
    assert m['lcd']['w'] >= 80 and m['lcd']['h'] >= 16
    for k in ('wall', 'bed', 'door', 'floorY'): assert k in m
    assert json.load(open(tmp_path / 'out' / 'intro.json')) == m


def test_snap_keeps_only_the_change():
    plate = Image.new('RGB', (320, 200), (10, 20, 30))
    edit = plate.copy(); edit.paste((200, 180, 160), (200, 80, 300, 140))
    noisy = edit.copy(); noisy.putpixel((5, 5), (14, 22, 33))            # generator drift within tolerance
    out, frac = bi.snap_to_plate(noisy, plate)
    assert out.getpixel((5, 5)) == (10, 20, 30) and out.getpixel((250, 100)) == (200, 180, 160)
    assert abs(frac - (100 * 60) / (320 * 200)) < 0.001


def test_drifted_edit_is_rejected(tmp_path):
    src = tmp_path / 'src'; os.makedirs(src)
    for n in bi.SOURCES: bi.placeholder(n).resize((640, 400)).save(src / f'{n}.png')
    Image.new('RGB', (640, 400), (250, 250, 250)).save(src / 'B_arm.png')
    try:
        bi.build(str(src), str(tmp_path / 'out'))
    except SystemExit as e:
        assert 'B_arm' in str(e.code)
    else:
        raise AssertionError('drifted edit accepted')


def test_find_lcd_on_a_green_rectangle():
    im = Image.new('RGB', (320, 200), (30, 30, 36)); im.paste((120, 220, 90), (90, 60, 230, 100))
    x, y, w, h = bi.find_lcd(im)
    assert (x, y) == (92, 62) and (w, h) == (136, 36)


def test_real_sources_are_used_and_flagged(tmp_path):
    src = tmp_path / 'src'; os.makedirs(src)
    for n in bi.SOURCES: bi.placeholder(n).resize((640, 400)).save(src / f'{n}.png')
    m = bi.build(str(src), str(tmp_path / 'out'))
    assert m['placeholder'] is False


def test_overrides_file_wins(tmp_path):
    src = tmp_path / 'src'; os.makedirs(src)
    json.dump({'wall': {'x': 1, 'y': 2, 'w': 3, 'h': 4}, 'floorY': 170}, open(src / 'intro.overrides.json', 'w'))
    m = bi.build(str(src), str(tmp_path / 'out'), placeholders=True)
    assert m['wall'] == {'x': 1, 'y': 2, 'w': 3, 'h': 4} and m['floorY'] == 170


def test_total_weight_under_budget(tmp_path):
    bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert sum(os.path.getsize(tmp_path / 'out' / f) for f in os.listdir(tmp_path / 'out')) <= 400 * 1024


# ---- review fixes ----
import numpy as np
import pytest


def _real_src(tmp_path, names=None):
    """Synthetic 'real' art: noisy plates, edits = plate + one block (+ generator drift)."""
    src = tmp_path / 'src'; os.makedirs(src, exist_ok=True)
    rng = np.random.default_rng(7); made = {}
    for n in bi.SOURCES:
        if n in bi.PLATES:
            a = rng.integers(20, 120, (400, 640, 3), dtype=np.uint8)
            if n == 'B_nightstand': a[120:200, 180:460] = (120, 220, 90)
        else:
            a = made[bi.EDITS[n]].astype(np.int16) + rng.integers(-8, 9, (400, 640, 3))
            a = np.clip(a, 0, 255).astype(np.uint8)
            if n == 'C_eye_crack': a[40:48, 40:52] = (30, 60, 200)             # a tiny change: an iris
            elif n == 'C_misery': a[100:140, 200:280] = (200, 40, 60)
            else: a[40:80, 40:120] = (230, 200, 40)
        made[n] = a
        if names is None or n in names: Image.fromarray(a, 'RGB').save(src / f'{n}.png')
    return src


def _px(out, m, n):
    return np.asarray(Image.open(os.path.join(out, m['images'][n])).convert('RGB'))


def test_partial_delivery_builds_with_placeholders_for_the_missing(tmp_path, capsys):
    for i, have in enumerate((bi.PLATES, [n for n in bi.SOURCES if n != 'B_arm'], [n for n in bi.SOURCES if n != 'C_awake'])):
        src = _real_src(tmp_path / str(i), have)
        m = bi.build(str(src), str(tmp_path / 'out'))
        assert m['placeholder'] is True
    assert 'placeholder' in capsys.readouterr().err.lower()


def test_edits_equal_their_plate_outside_the_change(tmp_path):
    out = str(tmp_path / 'out'); m = bi.build(str(_real_src(tmp_path)), out)
    for n, plate in bi.EDITS.items():
        diff = (_px(out, m, n) != _px(out, m, plate)).any(axis=2)
        ys, xs = np.nonzero(diff)
        y0, y1, x0, x1 = (49, 71, 99, 141) if n == 'C_misery' else (19, 41, 19, 61)      # the change plus a 1px soft rim
        assert ys.min() >= y0 and ys.max() < y1 and xs.min() >= x0 and xs.max() < x1, (n, ys.min(), ys.max(), xs.min(), xs.max())


def test_a_small_change_keeps_its_own_colour(tmp_path):
    out = str(tmp_path / 'out'); m = bi.build(str(_real_src(tmp_path)), out)
    r, g, b = _px(out, m, 'C_eye_crack')[21, 22]
    assert abs(int(r) - 30) < 16 and abs(int(g) - 60) < 16 and abs(int(b) - 200) < 16, (r, g, b)


def test_find_lcd_dithered_and_olive():
    im = Image.new('RGB', (320, 200), (30, 30, 36)); a = np.asarray(im).copy()
    yy, xx = np.mgrid[60:100, 90:230]
    a[60:100, 90:230] = np.where(((yy + xx) % 2 == 0)[..., None], (120, 220, 90), (40, 90, 40))
    a[190:195, 57:63] = (120, 220, 90)                                   # a stray green speck elsewhere
    x, y, w, h = bi.find_lcd(Image.fromarray(a.astype(np.uint8), 'RGB'))
    assert abs(x - 92) <= 2 and abs(y - 62) <= 2 and abs(w - 136) <= 4 and abs(h - 36) <= 4
    olive = Image.new('RGB', (320, 200), (30, 30, 36)); olive.paste((150, 170, 115), (90, 60, 230, 100))
    x, y, w, h = bi.find_lcd(olive)
    assert abs(x - 92) <= 2 and abs(w - 136) <= 4


def test_a_speck_is_not_an_lcd():
    im = Image.new('RGB', (320, 200), (30, 30, 36)); im.paste((120, 220, 90), (57, 190, 63, 195))
    assert bi.find_lcd(im) is None


def test_no_lcd_is_reported_in_the_manifest(tmp_path, capsys):
    src = _real_src(tmp_path); Image.new('RGB', (640, 400), (40, 40, 40)).save(src / 'B_nightstand.png')
    os.remove(src / 'B_arm.png')
    m = bi.build(str(src), str(tmp_path / 'out'))
    assert m['lcdFound'] is False and 'lcd' in capsys.readouterr().err.lower()


def test_wrong_aspect_source_is_refused_by_name(tmp_path):
    src = _real_src(tmp_path); Image.new('RGB', (1024, 1024), (9, 9, 9)).save(src / 'B_arm.png')
    with pytest.raises(SystemExit) as e: bi.build(str(src), str(tmp_path / 'out'))
    assert 'B_arm' in str(e.value.code) and '1024' in str(e.value.code)


def test_unrecognised_files_are_called_out(tmp_path, capsys):
    src = _real_src(tmp_path); os.rename(src / 'B_arm.png', src / 'B_arm.jpg'); open(src / 'arm_take2.PNG', 'wb').close()   # (a name that differs only by case would be the same file on a Mac)
    bi.build(str(src), str(tmp_path / 'out'))
    err = capsys.readouterr().err
    assert 'B_arm.jpg' in err and 'arm_take2.PNG' in err


def test_manifest_has_a_stand_spot_and_overrides_move_it(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert m['stand'] == {'x': 90}
    src = tmp_path / 'src'; os.makedirs(src); json.dump({'stand': {'x': 150}}, open(src / 'intro.overrides.json', 'w'))
    assert bi.build(str(src), str(tmp_path / 'out'), placeholders=True)['stand'] == {'x': 150}


# ---- real-art fixes (2026-11-11): generators redraw the whole frame, so strays and ghosts must go ----
def test_snap_drops_stray_specks():
    rng = np.random.default_rng(3)
    plate = Image.fromarray(rng.integers(20, 90, (200, 320, 3), dtype=np.uint8), 'RGB')
    a = np.asarray(plate).copy(); a[80:140, 200:300] = (230, 200, 40)
    specks = [(int(y), int(x)) for y, x in zip(rng.integers(0, 70, 40), rng.integers(0, 190, 40))]
    for y, x in specks: a[y, x] = (255, 255, 255)
    out, frac = bi.snap_to_plate(Image.fromarray(a, 'RGB'), plate)
    o, p = np.asarray(out), np.asarray(plate)
    assert all((o[y, x] == p[y, x]).all() for y, x in specks)
    assert (o[80:140, 200:300] == (230, 200, 40)).all()
    assert abs(frac - 6000 / 64000) < 0.002


def test_snap_removes_a_faint_ghost_inside_a_removed_object():
    a = np.zeros((200, 320, 3), np.uint8)
    a[60:120, 100:220] = (18, 18, 20)                                 # dark body: within tolerance of black
    a[60:63, 100:220] = a[117:120, 100:220] = (120, 120, 120)         # lighter outline
    a[60:120, 100:103] = a[60:120, 217:220] = (120, 120, 120)
    a[80:100, 120:200] = (110, 220, 90)                               # LCD
    plate = Image.fromarray(a, 'RGB'); edit = Image.new('RGB', (320, 200), (0, 0, 0))
    out, _ = bi.snap_to_plate(edit, plate)
    assert np.asarray(out)[60:120, 100:220].max() == 0, 'ghost of the removed object survives'


def test_snap_keeps_soft_edges_of_the_change():
    plate = Image.new('RGB', (320, 200), (10, 20, 30))
    a = np.asarray(plate).copy(); a[80:140, 200:300] = (200, 180, 160); a[79, 200:300] = (24, 34, 44)   # a faint anti-aliased rim
    out, _ = bi.snap_to_plate(Image.fromarray(a, 'RGB'), plate)
    assert tuple(np.asarray(out)[79, 250]) == (24, 34, 44)


def test_a_removed_object_plus_a_hand_is_not_drift(tmp_path):
    assert bi.MAX_DRIFT >= 0.5


# ---- the wall title is the app's own wordmark, cut out of the title screen ----
def test_wall_logo_is_the_wordmark_alone(tmp_path):
    out = tmp_path / 'out'; m = bi.build(str(tmp_path / 'nosrc'), str(out), placeholders=True)
    im = Image.open(out / m['images']['wall_logo']).convert('RGBA'); a = np.asarray(im).astype(int)
    assert (im.width, im.height) == (m['logo']['w'], m['logo']['h'])
    op = a[..., 3] > 0
    assert set(np.unique(a[..., 3])) <= {0, 255}                      # hard pixel edges, no soft alpha
    assert 0.25 < op.mean() < 0.8                                     # letters, not a filled box
    assert not op[-1, 0] and not op[-1, -1] and not op[-(im.height // 4):, :im.width // 8].any()   # QUEST is the narrower line: nothing fills the box behind it
    r, g, b = a[..., 0][op], a[..., 1][op], a[..., 2][op]
    assert ((b >= r) & (b >= g - 12)).mean() > 0.995                  # blue wordmark and its dark outline: no gold rule, no white stars
    w = m['wall']; lg = m['logo']; st = m['subtitle']
    assert w['x'] <= lg['x'] and lg['x'] + lg['w'] <= w['x'] + w['w'] and w['y'] <= lg['y']
    assert st['y'] >= lg['y'] + lg['h'] and st['y'] + st['h'] <= w['y'] + w['h']


def test_wall_logo_follows_an_overridden_wall(tmp_path):
    src = tmp_path / 'src'; os.makedirs(src); json.dump({'wall': {'x': 41, 'y': 0, 'w': 120, 'h': 100}}, open(src / 'intro.overrides.json', 'w'))
    m = bi.build(str(src), str(tmp_path / 'out'), placeholders=True)
    assert m['logo']['w'] <= 120 and m['logo']['x'] >= 41


def test_no_title_screen_means_no_logo_and_still_builds(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True, logo_src=str(tmp_path / 'missing.png'))
    assert 'wall_logo' not in m['images'] and 'logo' not in m


# ---- bedroom: clothes on the floor, a door to leave by ----
def test_manifest_places_the_clothes_and_the_doorway(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert set(m['clothes']) == {'x', 'y'} and set(m['doorway']) == {'x', 'y', 'w', 'h'}
    assert m['door']['y'] == m['floorY']                               # by default the door is on the hero's own row
    assert 'D_door_open' not in m['images']
    src = tmp_path / 'src'; os.makedirs(src)
    json.dump({'floorY': 170, 'clothes': {'x': 200, 'y': 190}, 'doorway': {'x': 246, 'y': 27, 'w': 58, 'h': 126}, 'door': {'x': 261, 'y': 153}}, open(src / 'intro.overrides.json', 'w'))
    m = bi.build(str(src), str(tmp_path / 'out'), placeholders=True)
    assert m['clothes'] == {'x': 200, 'y': 190} and m['doorway']['h'] == 126 and m['door'] == {'x': 261, 'y': 153}
    json.dump({'floorY': 170}, open(src / 'intro.overrides.json', 'w'))
    assert bi.build(str(src), str(tmp_path / 'out'), placeholders=True)['door']['y'] == 170    # follows an overridden floor


def test_an_open_door_still_is_optional_and_snapped_to_the_bedroom(tmp_path):
    src = _real_src(tmp_path); out = str(tmp_path / 'out')
    m = bi.build(str(src), out)
    assert 'D_door_open' not in m['images'] and m['placeholder'] is False
    a = np.asarray(Image.open(src / 'D_bedroom_vga.png').convert('RGB')).astype(np.int16)
    a = np.clip(a + np.random.default_rng(1).integers(-8, 9, a.shape), 0, 255).astype(np.uint8); a[100:300, 500:600] = (4, 4, 10)
    Image.fromarray(a, 'RGB').save(src / 'D_door_open.png')
    m = bi.build(str(src), out)
    d = (_px(out, m, 'D_door_open') != _px(out, m, 'D_bedroom_vga')).any(axis=2); ys, xs = np.nonzero(d)
    assert ys.min() >= 49 and ys.max() <= 150 and xs.min() >= 249 and xs.max() <= 300
    os.remove(src / 'D_door_open.png')
    assert 'D_door_open' not in bi.build(str(src), out)['images'] and not os.path.exists(os.path.join(out, 'D_door_open.png'))


def test_wordmark_carries_the_numeral_after_quest():
    plain = np.asarray(bi.wall_logo(numeral=False)); num = np.asarray(bi.wall_logo(numeral=True))
    assert plain.shape == num.shape                                    # the I sits inside the wordmark's own width
    hh = plain.shape[0]
    def right_edge(a): return int(np.nonzero((a[hh * 6 // 10:hh * 85 // 100, :, 3] > 0).any(axis=0))[0].max())    # QUEST's row, above the Q's tail
    def top_rows(a): return a[:hh * 4 // 10]
    assert right_edge(num) >= right_edge(plain) + 8
    assert (top_rows(num)[..., 3] == top_rows(plain)[..., 3]).all()    # OBSERVABILITY untouched (colours may shift a shade in the shared palette)
    assert np.abs(top_rows(num).astype(int) - top_rows(plain).astype(int)).mean() < 8
    extra = num[hh * 6 // 10:hh * 85 // 100, right_edge(plain) + 2:, :]
    op = extra[..., 3] > 0; r, g, b = extra[..., 0][op].astype(int), extra[..., 1][op].astype(int), extra[..., 2][op].astype(int)
    assert op.sum() > 40 and ((b >= r) & (b >= g - 12)).mean() > 0.99  # the same blue lettering, not a new font


def test_manifest_places_the_item_on_the_dresser(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert set(m['item']) == {'x', 'y'}
    src = tmp_path / 'src'; os.makedirs(src); json.dump({'item': {'x': 190, 'y': 120}}, open(src / 'intro.overrides.json', 'w'))
    assert bi.build(str(src), str(tmp_path / 'out'), placeholders=True)['item'] == {'x': 190, 'y': 120}


# ---- bedroom round 2: the laptop is painted on the dresser; taking it and opening the door are chained edits ----
def test_laptop_gone_and_door_open_chain(tmp_path):
    src = _real_src(tmp_path); out = str(tmp_path / 'out')
    base = np.asarray(Image.open(src / 'D_bedroom_vga.png').convert('RGB')).copy()
    base[160:200, 360:420] = (200, 200, 210)                            # a laptop on the dresser
    Image.fromarray(base, 'RGB').save(src / 'D_bedroom_vga.png')
    gone = base.copy(); gone[160:200, 360:420] = (90, 60, 30)           # ...taken
    Image.fromarray(gone, 'RGB').save(src / 'D_laptop_gone.png')
    door = gone.copy(); door[100:300, 500:600] = (4, 4, 10)             # the door open, built on the laptop-less room
    Image.fromarray(door, 'RGB').save(src / 'D_door_open.png')
    m = bi.build(str(src), out)
    assert {'D_laptop_gone', 'D_door_open'} <= set(m['images'])
    g, d, b = _px(out, m, 'D_laptop_gone'), _px(out, m, 'D_door_open'), _px(out, m, 'D_bedroom_vga')
    ys, xs = np.nonzero((g != b).any(axis=2)); assert xs.min() >= 179 and xs.max() <= 210 and ys.min() >= 79 and ys.max() <= 100
    ys, xs = np.nonzero((d != g).any(axis=2)); assert xs.min() >= 249 and xs.max() <= 300      # against the laptop-less room: only the door
    os.remove(src / 'D_laptop_gone.png')                                # without it, the door edit is cut against the bedroom itself
    m = bi.build(str(src), out)
    assert 'D_laptop_gone' not in m['images'] and 'D_door_open' in m['images']


def test_the_vga_bedroom_keeps_its_small_colours(tmp_path):
    """A green plant and a yellow lampshade are a few dozen pixels in a brown room: 32 colours greys them out."""
    src = _real_src(tmp_path); rng = np.random.default_rng(5)
    a = np.zeros((400, 640, 3), np.uint8)
    for i in range(40): a[i * 10:(i + 1) * 10] = (60 + i * 3, 36 + i * 2, 20 + i)              # many browns
    a[:, 0:200] = rng.integers(20, 200, (400, 200, 3), dtype=np.uint8)                          # a busy area eating palette slots
    a[300:308, 400:408] = (60, 150, 60); a[100:108, 300:308] = (230, 200, 120)                 # plant, lampshade: 16 px each at game size
    Image.fromarray(a, 'RGB').save(src / 'D_bedroom_vga.png')
    out = str(tmp_path / 'out'); m = bi.build(str(src), out)
    px = _px(out, m, 'D_bedroom_vga').astype(int)
    r, g, b = px[152, 202]; assert g > r + 50 and g > b + 50, ('plant', r, g, b)
    r, g, b = px[52, 152]; assert r > 200 and g > 170 and b < 150, ('shade', r, g, b)
    assert np.abs(px - np.asarray(bi.downsample(Image.open(src / 'D_bedroom_vga.png'))).astype(int)).max() <= 48      # no colour anywhere is far off


def test_the_lamp_close_up_is_no_longer_built(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert not any('lamp' in n for n in m['images'])
    assert 'B_lamp' not in bi.SOURCES


def test_numeral_stands_on_quests_baseline_and_the_lines_are_apart():
    a = np.asarray(bi.wall_logo(width=400)); op = a[..., 3] > 0; hh, ww = op.shape
    rows = op.sum(axis=1)
    mid = [y for y in range(hh * 3 // 10, hh * 7 // 10) if rows[y] == 0]
    assert len(mid) >= 3, 'OBSERVABILITY and QUEST still touch'
    bottom = op[max(mid):]                                               # QUEST I
    cols = np.nonzero(bottom.any(axis=0))[0]
    runs = bi._runs(bottom.any(axis=0))
    i_run, t_run = runs[-1], runs[-2]                                    # the numeral, and the letter before it
    def foot(r): return int(np.nonzero(bottom[:, r[0]:r[1] + 1].any(axis=1))[0].max())
    def head(r): return int(np.nonzero(bottom[:, r[0]:r[1] + 1].any(axis=1))[0].min())
    assert abs(foot(i_run) - foot((t_run[1] - 30, t_run[1]))) <= 2, (foot(i_run), foot(t_run))     # not below the T's foot
    assert abs(head(i_run) - head((t_run[1] - 30, t_run[1]))) <= 2


def test_dark_title_is_off_unless_the_overrides_turn_it_on(tmp_path):
    assert bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)['darkTitle'] is False
    src = tmp_path / 'src'; os.makedirs(src); json.dump({'darkTitle': True}, open(src / 'intro.overrides.json', 'w'))
    assert bi.build(str(src), str(tmp_path / 'out'), placeholders=True)['darkTitle'] is True
