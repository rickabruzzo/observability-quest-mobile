import json
from PIL import Image
from tools import build_rooms as br


def _src(tmp_path):
    src = tmp_path / 'src'; src.mkdir()
    plate = Image.new('RGB', (640, 400), (10, 20, 30))
    plate.save(src / 'P.png')
    a = plate.copy(); a.paste((200, 180, 160), (480, 160, 560, 240)); a.putpixel((9, 9), (13, 22, 33)); a.save(src / 'E1.png')
    b = plate.copy(); b.paste((90, 200, 90), (500, 200, 600, 260)); b.save(src / 'E2.png')
    return src


def test_plates_come_out_at_game_size_and_edits_as_one_shared_patch(tmp_path):
    out = tmp_path / 'out'
    m = br.build(str(_src(tmp_path)), str(out), 'chX', plates=['P'], edits={'E1': 'P', 'E2': 'P'})
    assert m['size'] == [320, 200] and m['images']['P'] == 'P.png'
    assert Image.open(out / 'P.png').size == (320, 200)
    box = m['patches']['P']                                   # the union of what the two edits changed
    assert box == {'x': 240, 'y': 80, 'w': 60, 'h': 50}
    for n in ('E1', 'E2'):
        assert Image.open(out / m['images'][n]).size == (60, 50), n
    assert Image.open(out / 'E1.png').convert('RGB').getpixel((0, 0)) == (200, 180, 160)
    assert Image.open(out / 'E2.png').convert('RGB').getpixel((0, 0)) == (10, 20, 30)      # outside its own change: the plate
    assert json.load(open(out / 'chX.json')) == m


def test_an_edit_that_is_another_picture_is_refused(tmp_path):
    src = _src(tmp_path)
    Image.new('RGB', (640, 400), (250, 250, 250)).save(src / 'E1.png')
    try: br.build(str(src), str(tmp_path / 'out'), 'chX', plates=['P'], edits={'E1': 'P'})
    except ValueError as e: assert 'E1' in str(e)
    else: raise AssertionError('no error')


def test_cards_come_out_at_the_card_window_size_in_few_colours(tmp_path):
    src = tmp_path / 'c.png'
    im = Image.new('RGB', (640, 400), (20, 30, 60)); im.paste((200, 60, 60), (100, 100, 300, 300)); im.save(src)
    m = br.build_cards(str(tmp_path / 'out'), {'P9': str(src)})
    assert m == {'size': [128, 80], 'cards': {'P9': 'P9_card.png'}, 'frames': {}}
    out = Image.open(tmp_path / 'out' / 'P9_card.png')
    assert out.size == (128, 80) and len(out.convert('RGB').getcolors(1 << 16)) <= 64
    assert out.convert('RGB').getpixel((40, 40)) == (200, 60, 60)
    assert json.load(open(tmp_path / 'out' / 'cards.json')) == m


def test_a_plate_can_be_cut_to_a_tighter_window_before_it_is_shrunk(tmp_path):
    src = tmp_path / 'src'; src.mkdir()
    im = Image.new('RGB', (640, 400), (10, 20, 30)); im.paste((240, 240, 240), (80, 30, 560, 330)); im.paste((200, 0, 0), (80, 30, 83, 33))
    im.save(src / 'P.png')
    out = tmp_path / 'out'
    br.build(str(src), str(out), 'chX', plates=['P'], edits={}, crops={'P': (80, 30, 560, 330)})
    got = Image.open(out / 'P.png').convert('RGB')
    assert got.size == (320, 200)
    assert got.getpixel((0, 0)) == (200, 0, 0) and got.getpixel((319, 199)) == (240, 240, 240)      # only the window is left
    try: br.build(str(src), str(out), 'chX', plates=['P'], edits={}, crops={'P': (0, 0, 400, 400)})
    except ValueError as e: assert '16:10' in str(e)
    else: raise AssertionError('no error')


def test_a_cards_extra_frames_change_only_where_their_source_does(tmp_path):
    base = Image.new('RGB', (640, 400), (20, 30, 60)); base.paste((200, 60, 60), (100, 100, 300, 300)); base.save(tmp_path / 'c.png')
    f1 = base.copy(); f1.paste((255, 230, 120), (400, 50, 450, 100)); f1.save(tmp_path / 'f1.png')
    f2 = base.copy(); f2.paste((255, 255, 255), (420, 60, 440, 80)); f2.save(tmp_path / 'f2.png')
    out = tmp_path / 'out'
    m = br.build_cards(str(out), {'P9': str(tmp_path / 'c.png')}, {'P9': [str(tmp_path / 'f1.png'), str(tmp_path / 'f2.png')]})
    assert m['frames'] == {'P9': ['P9_card_sparkle_1.png', 'P9_card_sparkle_2.png']}
    card = Image.open(out / 'P9_card.png').convert('RGB')
    for i, (box, colour) in enumerate([((80, 10, 90, 20), (255, 230, 120)), ((84, 12, 88, 16), (255, 255, 255))], 1):
        f = Image.open(out / f'P9_card_sparkle_{i}.png').convert('RGB')
        assert f.size == (128, 80) and len(f.getcolors(1 << 16)) <= 64
        assert f.getpixel((box[0] + 1, box[1] + 1)) == colour
        for x in range(128):
            for y in range(80):
                if not (box[0] <= x < box[2] and box[1] <= y < box[3]): assert f.getpixel((x, y)) == card.getpixel((x, y)), (i, x, y)
    assert json.load(open(out / 'cards.json')) == m


def test_every_room_and_card_in_the_drops_is_listed_with_its_source():
    import os
    for ch in ('ch2', 'ch3', 'ch4', 'ch5'):
        r = br.ROOMS[ch]
        for n in list(r['plates']) + list(r['edits']):
            assert os.path.exists(os.path.join(br.ROOT, r['src'], n + '.png')), n
        assert len(r['plates']) == 3 and set(r['edits'].values()) == {r['plates'][0]}
    assert sorted(br.CARDS) == ['P1', 'P2', 'P3', 'P4', 'P5']
    for f in br.CARDS.values(): assert os.path.exists(os.path.join(br.ROOT, f)), f
    assert sorted(br.CARD_FRAMES) == ['P1'] and len(br.CARD_FRAMES['P1']) == 3
    for f in br.CARD_FRAMES['P1']: assert os.path.exists(os.path.join(br.ROOT, f)), f
