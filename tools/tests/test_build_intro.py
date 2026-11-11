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
