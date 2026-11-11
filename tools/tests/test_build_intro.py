import json, os
from PIL import Image
from tools import build_intro as bi

ALL = ['A_room_dark', 'B_nightstand', 'B_arm', 'B_lamp', 'B_lamp_lit', 'C_face_asleep', 'C_eye_crack',
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
        y0, y1, x0, x1 = (50, 70, 100, 140) if n == 'C_misery' else (20, 40, 20, 60)
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
    for n in ('B_arm', 'B_lamp'): os.remove(src / f'{n}.png')
    m = bi.build(str(src), str(tmp_path / 'out'))
    assert m['lcdFound'] is False and 'lcd' in capsys.readouterr().err.lower()


def test_wrong_aspect_source_is_refused_by_name(tmp_path):
    src = _real_src(tmp_path); Image.new('RGB', (1024, 1024), (9, 9, 9)).save(src / 'B_arm.png')
    with pytest.raises(SystemExit) as e: bi.build(str(src), str(tmp_path / 'out'))
    assert 'B_arm' in str(e.value.code) and '1024' in str(e.value.code)


def test_unrecognised_files_are_called_out(tmp_path, capsys):
    src = _real_src(tmp_path); os.rename(src / 'B_arm.png', src / 'B_arm.jpg'); open(src / 'b_lamp.PNG', 'wb').close()
    os.remove(src / 'B_lamp.png')
    bi.build(str(src), str(tmp_path / 'out'))
    err = capsys.readouterr().err
    assert 'B_arm.jpg' in err and 'b_lamp.PNG' in err


def test_manifest_has_a_stand_spot_and_overrides_move_it(tmp_path):
    m = bi.build(str(tmp_path / 'nosrc'), str(tmp_path / 'out'), placeholders=True)
    assert m['stand'] == {'x': 90}
    src = tmp_path / 'src'; os.makedirs(src); json.dump({'stand': {'x': 150}}, open(src / 'intro.overrides.json', 'w'))
    assert bi.build(str(src), str(tmp_path / 'out'), placeholders=True)['stand'] == {'x': 150}
