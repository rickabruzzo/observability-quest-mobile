import json, os
import numpy as np
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


def _painting(size=(640, 400)):
    """A picture with more colours than any palette holds: a smooth two-way gradient with a flat block on it."""
    w, h = size
    im = Image.new('RGB', size)
    im.putdata([(x * 255 // (w - 1), y * 255 // (h - 1), (x + y) % 256) for y in range(h) for x in range(w)])
    im.paste((200, 60, 60), (100, 100, 300, 300))
    return im


def test_cards_keep_the_arts_own_size_and_colours(tmp_path):
    """Rick, 2026-11-14: the cards "look bad since they were de-rezed"; he would rather have the original look.
    A card is its source at the source's size, not cut to a palette and not shrunk."""
    src = tmp_path / 'c.png'; im = _painting(); im.save(src)
    m = br.build_cards(str(tmp_path / 'out'), {'P9': str(src)})
    assert m == {'size': [640, 400], 'cards': {'P9': 'P9_card.webp'}, 'frames': {}}
    out = Image.open(tmp_path / 'out' / 'P9_card.webp').convert('RGB')
    assert out.size == (640, 400)
    assert len(out.getcolors(1 << 24)) > 5000                                        # no palette
    diff = np.abs(np.asarray(out).astype(int) - np.asarray(im).astype(int))
    assert diff.mean() < 2.0, diff.mean()                                            # the same picture
    assert max(abs(a - b) for a, b in zip(out.getpixel((200, 200)), (200, 60, 60))) <= 4
    assert json.load(open(tmp_path / 'out' / 'cards.json')) == m


def test_exact_edits_keep_every_changed_pixel_however_small(tmp_path):
    # An art drop's figure frame is the plate with only the figure pasted back, so every difference is meant:
    # a turned torso with the plate's legs under it is a man cut off at the waist.
    src = tmp_path / 'src'; src.mkdir()
    plate = Image.new('RGB', (640, 400), (90, 80, 70)); plate.save(src / 'P.png')
    e = plate.copy(); e.paste((200, 40, 40), (200, 100, 260, 160))                  # the torso: a big change
    for y in range(240, 340, 20): e.paste((70, 60, 50), (220, y, 222, y + 2))       # the legs: faint, scattered
    e.save(src / 'E.png')
    loose = br.build(str(src), str(tmp_path / 'a'), 'chX', plates=['P'], edits={'E': 'P'})
    exact = br.build(str(src), str(tmp_path / 'b'), 'chX', plates=['P'], edits={'E': 'P'}, exact=True)
    assert loose['patches']['P'] == {'x': 100, 'y': 50, 'w': 30, 'h': 30}             # the old rule drops the legs
    assert exact['patches']['P'] == {'x': 100, 'y': 50, 'w': 30, 'h': 111}            # down to the last leg pixel
    got = Image.open(tmp_path / 'b' / 'E.png').convert('RGB')
    assert got.size == (30, 111) and got.getpixel((10, 110)) == (70, 60, 50) and got.getpixel((0, 110)) == (90, 80, 70)


def test_a_cards_frames_are_named_after_their_sources(tmp_path):
    base = Image.new('RGB', (640, 400), (20, 30, 60)); base.save(tmp_path / 'c.png')
    f = base.copy(); f.paste((255, 230, 120), (400, 50, 450, 100)); f.save(tmp_path / 'Q7_card_fx_2.png')
    m = br.build_cards(str(tmp_path / 'out'), {'Q7': str(tmp_path / 'c.png')}, {'Q7': [str(tmp_path / 'Q7_card_fx_2.png')]})
    assert m['frames'] == {'Q7': ['Q7_card_fx_2.webp']} and os.path.exists(tmp_path / 'out' / 'Q7_card_fx_2.webp')


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


def test_a_cards_extra_frames_are_overlays_painted_only_where_their_source_changed(tmp_path):
    """A frame is drawn over the card, so it is the card's size and see-through wherever its source is the card's;
    where the source differs it holds the source's picture."""
    base = _painting(); base.save(tmp_path / 'c.png')
    f1 = base.copy(); f1.paste((255, 230, 120), (400, 50, 450, 100)); f1.save(tmp_path / 'P9_card_sparkle_1.png')
    f2 = base.copy(); f2.paste((255, 255, 255), (420, 60, 440, 80)); f2.save(tmp_path / 'P9_card_sparkle_2.png')
    out = tmp_path / 'out'
    m = br.build_cards(str(out), {'P9': str(tmp_path / 'c.png')}, {'P9': [str(tmp_path / 'P9_card_sparkle_1.png'), str(tmp_path / 'P9_card_sparkle_2.png')]})
    assert m['frames'] == {'P9': ['P9_card_sparkle_1.webp', 'P9_card_sparkle_2.webp']}
    for i, (box, colour) in enumerate([((400, 50, 450, 100), (255, 230, 120)), ((420, 60, 440, 80), (255, 255, 255))], 1):
        f = Image.open(out / f'P9_card_sparkle_{i}.webp')
        assert f.mode == 'RGBA' and f.size == (640, 400)
        a = np.asarray(f)
        inside = np.zeros((400, 640), bool); inside[box[1]:box[3], box[0]:box[2]] = True
        assert (a[..., 3][inside] == 255).all() and (a[..., 3][~inside] == 0).all(), i
        err = np.abs(a[..., :3][inside].astype(int) - colour)                             # the source's picture, at the card's quality:
        assert err.mean() <= 3 and np.median(err) <= 2, (i, err.mean())                    # no dark fringe from the see-through part
    assert json.load(open(out / 'cards.json')) == m


def test_the_fork_builds_the_era_look_and_can_go_back_to_the_painted_one():
    assert br.LOOK == 'era' and br.ROOMS == br.rooms('era')
    era, painted = br.rooms('era'), br.rooms('painted')
    assert set(era) == set(painted) == {'ch1', 'ch2', 'ch3', 'ch4', 'ch5'}
    for ch in era:
        # the same file names in both looks, so nothing in the game changes when the look does
        assert era[ch]['plates'] == painted[ch]['plates'] and era[ch]['edits'] == painted[ch]['edits'], ch
        assert era[ch]['src'] == 'art-drops/2026-11-13-era-look-rooms' and era[ch]['exact'] is True
        for n in list(era[ch]['plates']) + list(era[ch]['edits']):
            assert os.path.exists(os.path.join(br.ROOT, era[ch]['src'], n + '.png')), n
    assert painted['ch1']['src'] == 'scratch/room_gen' and not painted['ch1'].get('exact')
    assert painted['ch2']['src'] == 'art-drops/2026-11-12-room-ch2' and painted['ch5']['src'] == 'art-drops/2026-11-12-room-ch5'
    try: br.rooms('sepia')
    except KeyError: pass
    else: raise AssertionError('an unknown look was accepted')


def test_every_room_and_card_in_the_drops_is_listed_with_its_source():
    for ch in ('ch2', 'ch3', 'ch4', 'ch5'):
        r = br.ROOMS[ch]
        for n in list(r['plates']) + list(r['edits']):
            assert os.path.exists(os.path.join(br.ROOT, r['src'], n + '.png')), n
        assert len(r['plates']) == (4 if ch == 'ch2' else 3) and set(r['edits'].values()) == {r['plates'][0]}   # room 2: a second wall close-up
    assert sorted(br.CARDS) == ['P1', 'P2', 'P3', 'P4', 'P5']
    for f in br.CARDS.values(): assert os.path.exists(os.path.join(br.ROOT, f)), f
    assert sorted(br.CARD_FRAMES) == ['P1', 'P2', 'P3', 'P5']                        # P4's phone is animated in code
    for fs in br.CARD_FRAMES.values():
        assert len(fs) == 3
        for f in fs: assert os.path.exists(os.path.join(br.ROOT, f)), f
    for ch in ('ch2', 'ch3', 'ch4', 'ch5'):                                          # every drop room has a win frame
        r = br.ROOMS[ch]; assert r.get('exact') is True and any(n.endswith('_npc_win') for n in r['edits']), ch
    assert 'R2_wall_closeup_fixed' in br.ROOMS['ch2']['plates'] and 'crops' not in br.ROOMS['ch5']


# ---- art that is not part of a room's own drop: extra plates and sprite sheets (art brief 04, 2026-11-14) ----

def test_a_plate_from_another_drop_is_built_beside_the_rooms_own(tmp_path):
    other = tmp_path / 'elsewhere.png'
    Image.new('RGB', (640, 400), (40, 90, 140)).save(other)
    out = tmp_path / 'out'
    m = br.build(str(_src(tmp_path)), str(out), 'chX', plates=['P'], edits={}, extra={'B': str(other)})
    assert m['images'] == {'P': 'P.png', 'B': 'B.png'}
    built = Image.open(out / 'B.png').convert('RGB')
    assert built.size == (320, 200) and built.getpixel((5, 5)) == (40, 90, 140)


def _twice(colours):
    """A sprite drawn at twice its size: each colour of the grid fills a 2×2 block. None is transparent."""
    h, w = len(colours), len(colours[0])
    im = Image.new('RGBA', (w * 2, h * 2), (0, 0, 0, 0))
    for y in range(h):
        for x in range(w):
            if colours[y][x]: im.paste(colours[y][x] + (255,), (x * 2, y * 2, x * 2 + 2, y * 2 + 2))
    return im


def test_a_sprite_drawn_at_twice_its_size_comes_down_exactly():
    R, B = (220, 40, 40), (40, 60, 220)
    small = br.shrink(_twice([[R, None, B], [None, B, R]]), 2)
    assert small.size == (3, 2) and small.mode == 'RGBA'
    assert [small.getpixel((x, 0)) for x in range(3)] == [R + (255,), (0, 0, 0, 0), B + (255,)]
    assert small.getpixel((1, 1)) == B + (255,) and small.getpixel((0, 1))[3] == 0
    bad = _twice([[R, B]]); bad.putpixel((1, 1), (0, 255, 0, 255))        # one block is not one colour: not drawn at 2×
    try: br.shrink(bad, 2)
    except ValueError as e: assert '2' in str(e)
    else: raise AssertionError('a sprite that is not at twice its size was accepted')


def _disc(size=40, fill=(230, 150, 40), edge=(26, 20, 36)):
    """A painted product as Art Claude delivers one: a hard-edged shape on transparency with a 1-px dark outline
    put round it (every clear pixel that touches the shape)."""
    c = (size - 1) / 2
    solid = np.array([[((x - c) ** 2 + (y - c) ** 2) ** 0.5 <= size / 2 - 3 for x in range(size)] for y in range(size)])
    pad = np.pad(solid, 1); near = np.zeros_like(solid)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1): near |= pad[1 + dy:1 + dy + size, 1 + dx:1 + dx + size]
    a = np.zeros((size, size, 4), np.uint8)
    a[solid] = fill + (255,); a[near & ~solid] = edge + (255,)
    return Image.fromarray(a, 'RGBA')


def test_a_painted_sprite_is_shrunk_hard_edged_with_one_clean_outline():
    edge = (26, 20, 36)
    small = br.shrink(_disc(), 2, outline='#1A1424')
    assert small.size == (22, 22)                                           # half the size, and a pixel all round for the outline
    a = np.asarray(small)
    assert set(np.unique(a[..., 3])) == {0, 255}                            # no soft edge
    opaque = a[..., 3] == 255
    pad = np.pad(opaque, 1)
    beside_nothing = np.zeros_like(opaque)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        beside_nothing |= ~pad[1 + dy:1 + dy + 22, 1 + dx:1 + dx + 22]
    is_edge = (a[..., :3] == edge).all(axis=2) & opaque
    assert (is_edge[opaque & beside_nothing]).all()                         # the rim is the outline, unbroken
    assert not is_edge[opaque & ~beside_nothing].any()                      # and the outline is only the rim: 1 px
    assert not opaque[0, 0] and opaque[11, 11] and tuple(a[11, 11, :3]) == (230, 150, 40)


def test_sprites_share_one_sheet_and_the_manifest_says_where_each_is(tmp_path):
    R, G = (220, 40, 40), (40, 200, 90)
    a = tmp_path / 'a.png'; _twice([[R, R, R], [R, None, R]]).save(a)
    b = tmp_path / 'b.png'; _twice([[G], [G], [G], [G]]).save(b)
    c = tmp_path / 'c.png'; _disc().save(c)
    out = tmp_path / 'out'
    m = br.build(str(_src(tmp_path)), str(out), 'chX', plates=['P'], edits={}, sprites={'SX': [
        {'name': 'a', 'file': str(a), 'shrink': 2}, {'name': 'b', 'file': str(b), 'shrink': 2},
        {'name': 'c', 'file': str(c), 'shrink': 2, 'outline': '#1A1424'}, {'name': 'c_small', 'file': str(c), 'shrink': 4, 'outline': '#1A1424'}]})
    assert m['images']['SX'] == 'SX.png'
    sheet = Image.open(out / 'SX.png').convert('RGBA')
    assert set(m['sprites']) == {'a', 'b', 'c', 'c_small'}
    for n, by, src, outline in (('a', 2, a, None), ('b', 2, b, None), ('c', 2, c, '#1A1424'), ('c_small', 4, c, '#1A1424')):
        s = m['sprites'][n]
        assert s['image'] == 'SX'
        want = br.shrink(Image.open(src), by, outline=outline)
        assert (s['w'], s['h']) == want.size, n
        got = sheet.crop((s['x'], s['y'], s['x'] + s['w'], s['y'] + s['h']))
        assert np.array_equal(np.asarray(got), np.asarray(want)), n          # exactly the sprite, nothing of its neighbours
    boxes = [(s['x'], s['y'], s['x'] + s['w'], s['y'] + s['h']) for s in m['sprites'].values()]
    for i, p in enumerate(boxes):
        for q in boxes[i + 1:]:
            assert p[2] <= q[0] or q[2] <= p[0] or p[3] <= q[1] or q[3] <= p[1], (p, q)   # no two overlap
    assert (m['sprites']['a']['w'], m['sprites']['a']['h']) == (3, 2) and (m['sprites']['b']['w'], m['sprites']['b']['h']) == (1, 4)
    assert json.load(open(out / 'chX.json')) == m


def test_the_feedback_art_is_listed_with_its_sources_and_the_brand_marks_are_not():
    """Art brief 04: the board without the sheet and the wiped board (room 2), the shop's five products at two
    sizes (room 3), the phone and the battle's sprites (room 4). The four brand marks wait for Rick's yes."""
    drop = 'art-drops/2026-11-14-feedback-1114'
    r2, r3, r4 = br.ROOMS['ch2'], br.ROOMS['ch3'], br.ROOMS['ch4']
    assert r2['extra'] == {'R2_board': f'{drop}/R2_wall_closeup.png', 'R2_board_wiped': f'{drop}/R2_wall_closeup_fixed.png'}
    assert r4['extra'] == {'R4_phone_closeup': f'{drop}/R4_phone_closeup.png'}
    products = r3['sprites']['S3_products']
    assert [s['name'] for s in products] == [f'product_{n}{size}' for size in ('', '_small') for n in ('ukulele', 'banjo', 'acoustic', 'bass', 'southpaw')]
    assert {s['shrink'] for s in products[:5]} == {2} and {s['shrink'] for s in products[5:]} == {4}
    assert all(s['outline'] == '#1A1424' for s in products)
    battle = r4['sprites']['S4_sprites']
    assert len(battle) == 16 and all(s['shrink'] == 2 and not s.get('outline') for s in battle)
    assert {s['name'] for s in battle} >= {'ship_a_small', 'ship_b_big', 'bolt', 'missile', 'boom_1', 'boom_4', 'warp_3', 'gate'}
    every = list(r2['extra'].values()) + list(r4['extra'].values()) + [s['file'] for s in products + battle]
    for f in every:
        assert os.path.exists(os.path.join(br.ROOT, f)), f
        assert '/M_' not in f                                              # no brand mark is built yet
    for ch in ('ch1', 'ch5'): assert not br.ROOMS[ch].get('extra') and not br.ROOMS[ch].get('sprites')
    assert br.rooms('painted')['ch2']['extra'] == r2['extra']             # a figureless plate is the same in both looks


def test_the_built_rooms_hold_the_feedback_art_at_game_size():
    rooms = os.path.join(br.ROOT, 'assets', 'rooms')
    m2, m3, m4 = (json.load(open(os.path.join(rooms, f'ch{n}.json'))) for n in (2, 3, 4))
    for m, n in ((m2, 'R2_board'), (m2, 'R2_board_wiped'), (m4, 'R4_phone_closeup')):
        assert Image.open(os.path.join(rooms, m['images'][n])).size == (320, 200), n
    assert 'R2_wall_closeup' in m2['images']                               # the old board stays until the game stops using it
    big = [m3['sprites'][f'product_{n}'] for n in ('ukulele', 'banjo', 'acoustic', 'bass', 'southpaw')]
    small = [m3['sprites'][f'product_{n}_small'] for n in ('ukulele', 'banjo', 'acoustic', 'bass', 'southpaw')]
    assert {(s['w'], s['h']) for s in big} == {(112, 72)} and {(s['w'], s['h']) for s in small} == {(57, 37)}
    sizes = {'ship_a_small': (7, 5), 'ship_a_mid': (11, 7), 'ship_a_big': (19, 9), 'ship_b_small': (7, 5), 'ship_b_mid': (11, 7),
             'ship_b_big': (19, 9), 'bolt': (5, 1), 'missile': (5, 3), 'boom_1': (11, 11), 'boom_2': (11, 11), 'boom_3': (11, 11),
             'boom_4': (11, 11), 'warp_1': (9, 9), 'warp_2': (9, 9), 'warp_3': (9, 9), 'gate': (23, 23)}
    assert {n: (s['w'], s['h']) for n, s in m4['sprites'].items()} == sizes
    for m, sheet in ((m3, 'S3_products'), (m4, 'S4_sprites')):
        im = Image.open(os.path.join(rooms, m['images'][sheet])).convert('RGBA')
        assert set(np.unique(np.asarray(im)[..., 3])) <= {0, 255}, sheet     # hard edges only
        for n, s in m['sprites'].items():
            assert s['image'] == sheet and s['x'] + s['w'] <= im.width and s['y'] + s['h'] <= im.height, n
