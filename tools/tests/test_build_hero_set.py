"""The painted hero's full set (art brief 06): one body set, and the head as a layer.

Nothing here draws. Each painting is sorted into parts and halved to game size (tools/build_hero_painted.py);
then the head is lifted off every body, each hair style becomes a head layer, and the beard and the glasses
become overlays. The proof that the cutting is right is that the pieces, put back together, are the painting."""
import json
import os
import re
import numpy as np
from PIL import Image
from tools import build_hero_painted as hp

P = hp.PARTS.index
SET, TEST = hp.SET, hp.DROP


# ---- halving ----

def test_halving_is_the_house_reduction_done_fast():
    """halve() must agree with to_size() (majority part, mean lightness, under half covered is not his)."""
    parts, light = hp.classify(Image.open(os.path.join(hp.ROOT, TEST, 'H_front.png')))
    a, al = hp.halve(parts, light)
    b, bl = hp.to_size(parts, light, 56, 144)
    assert a.shape == (144, 56) and np.array_equal(a, b) and np.allclose(al, bl)


def test_a_phase_moves_the_blocks_by_one_source_pixel():
    parts = np.zeros((4, 4), np.uint8); parts[1:3, 1:3] = P('hoodie'); light = np.where(parts > 0, 0.5, 0.0)
    plain, _ = hp.halve(parts, light)
    assert (plain > 0).sum() == 0                                         # every block is a quarter covered: nothing survives
    moved, ml = hp.halve(parts, light, phase=(1, 1))
    assert moved.shape == (2, 2) and moved[0, 0] == P('hoodie') and ml[0, 0] == 0.5 and (moved > 0).sum() == 1


# ---- the head ----

def _figure():
    """A small front figure at game size: hair, a face with an eye and an outline, a neck, a hoodie with a hood
    rising beside the neck, and a hand."""
    g = np.zeros((16, 9), np.uint8)
    H, S, O, G, C = P('hair'), P('skin'), P('outline'), P('grey'), P('hoodie')
    g[0, 3:6] = O
    g[1, 2] = O; g[1, 3:6] = H; g[1, 6] = O
    g[2, 2] = O; g[2, 3] = S; g[2, 4] = G; g[2, 5] = S; g[2, 6] = O      # the eye's white, inside the face
    g[3, 2] = O; g[3, 3:6] = S; g[3, 6] = O
    g[4, 1] = C; g[4, 2] = O; g[4, 3:6] = S; g[4, 6] = O; g[4, 7] = C     # the neck, the hood beside it
    g[5, 0] = O; g[5, 1:8] = C; g[5, 8] = O
    g[6:12, 1:8] = C; g[6:12, 0] = O; g[6:12, 8] = O
    g[12, 1] = S; g[12, 7] = S                                            # hands
    return g


def test_the_head_is_hair_face_and_their_outline_and_nothing_of_the_body():
    g = _figure()
    m = hp.head_mask(g, neck_row=4)
    assert m[1, 4] and m[3, 4] and m[4, 4]                                # hair, face, neck
    assert m[2, 4]                                                        # the eye's white, enclosed by the face
    assert m[0, 4] and m[2, 2] and m[2, 6]                                # the head's own outline
    assert not m[12, 1] and not m[12, 7]                                  # hands are skin, but not head
    assert not m[4, 1] and not m[5, 4] and not m[8, 4]                    # the hood and the hoodie stay with the body
    assert not m[5, 0] and not m[8, 0]                                    # and so does the body's outline


def test_long_hair_is_head_however_far_down_it_falls():
    g = _figure(); g[5:9, 1] = P('hair')
    m = hp.head_mask(g, neck_row=4)
    assert m[5:9, 1].all()


# ---- the paintings, cut and put back together ----

def _same(a, b):
    """Two (parts, light) pictures of one size are the same picture."""
    return np.array_equal(a[0], b[0]) and np.allclose(a[1], b[1])


def _on(canvas_shape, anchor, pieces):
    """`pieces` placed with their anchors at `anchor` on a canvas of `canvas_shape`."""
    parts, light, ax, ay = hp.place(pieces)
    Pc = np.zeros(canvas_shape, np.uint8); Lc = np.zeros(canvas_shape)
    x0, y0 = anchor[0] - ax, anchor[1] - ay
    Pc[y0:y0 + parts.shape[0], x0:x0 + parts.shape[1]] = parts; Lc[y0:y0 + parts.shape[0], x0:x0 + parts.shape[1]] = light
    return Pc, Lc


def test_body_head_and_beard_put_back_together_are_the_approved_figure():
    """Front, side and back: the headless body, the clean-shaven head and the beard over it are the figure Rick
    approved. From behind, pixel for pixel. From the front and the side, all but a stray pixel or two at the
    hair's edge, where the clean-shaven painting and the approved one differ and the beard has no business."""
    bodies, heads, over = hp.bodies(), hp.heads(), hp.overlays()
    for view, path in (('front', f'{TEST}/H_front.png'), ('side', f'{TEST}/H_side.png'), ('back', f'{SET}/H_back.png')):
        want = hp.full(path)
        pieces = [bodies[view], heads['standard'][view]] + ([over['beard'][view]] if view != 'back' else [])
        got = _on(want[0].shape, hp.ANCHOR, pieces)
        differ = (got[0] != want[0]) | ~np.isclose(got[1], want[1])
        assert differ.sum() <= (0 if view == 'back' else 6), (view, int(differ.sum()))
        assert not differ[_mid(view) + 3:].any(), view                          # from the nose down he is exact: the beard, the neck, the body


def test_each_hair_style_on_the_standing_body_is_its_painting():
    """A head painting is the whole standing figure with only the head changed, so the standing body with that
    head layer must give the painting back (all but a few pixels of edge blending beside long hair)."""
    bodies, heads = hp.bodies(), hp.heads()
    for style in ('long', 'mohawk'):                                              # the afro is cut smaller than its painting: its own test, below
        for view in ('front', 'side', 'back'):
            want = hp.full(f'{SET}/HD_{style}_{view}.png')
            got = _on(want[0].shape, hp.ANCHOR, [bodies[view], heads[style][view]])
            streak = (got[0] == P('hair')) & (want[0] == P('skin'))               # a light streak in hanging hair, sorted as hair on purpose
            differ = ((got[0] != want[0]) & ~streak).sum()
            assert differ <= 12 and streak.sum() <= 12, (style, view, int(differ), int(streak.sum()))
            assert ((got[0] > 0) != (want[0] > 0)).sum() <= 4, (style, view)      # and the silhouette is the painting's


def _extent(mask):
    ys, xs = np.nonzero(mask)
    return int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)


def test_the_afro_is_its_paintings_hair_made_smaller_round_an_untouched_face():
    """Rick, 2026-11-16: "Those afros are way too large. Shrink those if possible." The painted hair is taken down
    to HAIR_SCALE of its size about the middle of his skull; nothing is drawn. The face, the neck and everything
    below are the painting's, pixel for pixel; the hair never leaves his skull bare; and it keeps an outline."""
    bodies, heads, k = hp.bodies(), hp.heads(), hp.HAIR_SCALE['fro']
    assert 0.7 <= k <= 0.9
    for view in ('front', 'side', 'back'):
        want = hp.full(f'{SET}/HD_fro_{view}.png')
        got = _on(want[0].shape, hp.ANCHOR, [bodies[view], heads['fro'][view]])
        was, now = want[0] == P('hair'), got[0] == P('hair')
        (w0, h0), (w1, h1) = _extent(was), _extent(now)
        assert abs(w1 - k * w0) <= 1.5 and k * h0 - 1.5 <= h1 < h0, (view, (w0, h0), (w1, h1))     # smaller, by about k
        assert now.sum() < 0.8 * was.sum(), (view, int(was.sum()), int(now.sum()))
        # hair only where the painting had hair, its outline or nothing: never over his face or his clothes
        assert not (now & np.isin(want[0], (P('skin'), P('grey'), P('hoodie'), P('jeans')))).any(), view
        # the face is the painting's own: every skin and grey pixel, as light as it was painted
        face = np.isin(want[0], (P('skin'), P('grey')))
        assert np.array_equal(got[0][face], want[0][face]) and np.allclose(got[1][face], want[1][face]), view
        # his skull is never bare: wherever the approved head is, what the painting had there is still something
        # (the approved head is bearded; in profile its chin reaches three pixels past this clean-shaven one's)
        assert (got[0][hp._base_mask(view) & (want[0] > 0)] > 0).all(), view
        # the hair keeps an outline all the way round: no hair pixel touches the background
        assert not (now & hp._near(got[0] == 0, diagonal=False)).any(), view
        # from the collar down nothing has changed (all but the few edge pixels every head painting differs by)
        low = np.s_[hp.NECK[view] + 3:]
        assert (got[0][low] != want[0][low]).sum() <= 12, view


def test_no_other_hair_style_is_scaled():
    assert set(hp.HAIR_SCALE) == {'fro'}


def test_the_glasses_are_the_frames_of_the_glasses_painting_and_nothing_else():
    """Over the clean face the frames land exactly where the painting has them. A frame is half a pixel thick at
    game size, so most of it is a face pixel painted darker; those count as frame. The painting with glasses
    also shades the rest of the face a little differently and redraws some hair: that is left out."""
    bodies, heads, over = hp.bodies(), hp.heads(), hp.overlays()
    for view in ('front', 'side'):
        want = hp.full(f'{SET}/HD_glasses_{view}.png')
        clean = _on(want[0].shape, hp.ANCHOR, [bodies[view], heads['standard'][view]])
        got = _on(want[0].shape, hp.ANCHOR, [bodies[view], heads['standard'][view], over['glasses'][view]])
        g = over['glasses'][view]; top = hp.ANCHOR[1] - g['ay']                  # the rows the glasses themselves span
        band = np.zeros(want[0].shape, bool); band[top:top + g['parts'].shape[0]] = True
        frame = np.isin(want[0], (P('outline'), P('grey')))
        assert np.array_equal(got[0][band & frame], want[0][band & frame]) and np.allclose(got[1][band & frame], want[1][band & frame]), view
        assert set(np.unique(g['parts'])) <= {0, P('outline'), P('grey'), P('skin')} and 'erase' not in g, view
        changed = (got[0] != clean[0]) | ~np.isclose(got[1], clean[1])
        dark = got[1] < clean[1] - hp.FRAME
        assert (np.isin(got[0], (P('outline'), P('grey'))) | dark)[changed].all(), view      # all it changes becomes frame, or darker
        assert 30 <= changed.sum() <= 70, (view, int(changed.sum()))                          # a pair of glasses, not a new face
    assert 'back' not in over['glasses'] and 'back' not in over['beard']         # neither shows from behind


def _mid(view):
    """The row half way down the head, in the standing figure of that view."""
    rows = np.nonzero(hp.head_mask(hp.full(hp.BASE[view])[0], hp.NECK[view]).any(axis=1))[0]
    return int((rows[0] + min(rows[-1], hp.NECK[view])) // 2)


def test_the_beard_and_the_glasses_sit_right_on_every_hair_style():
    """An overlay is cut from paintings of the short-haired head. Laid on another style it adds nothing outside
    the figure; the beard changes nothing in the top half of the head; the glasses leave the hair alone but for the arm that crosses it."""
    bodies, heads, over = hp.bodies(), hp.heads(), hp.overlays()
    for style in ('standard', 'long', 'fro', 'mohawk'):
        for view in ('front', 'side'):
            plain = hp.place([bodies[view], heads[style][view]])
            top = plain[3] - hp.ANCHOR[1]                                               # the canvas row of the standing figure's row 0
            for what in ('beard', 'glasses'):
                both = hp.place([bodies[view], heads[style][view], over[what][view]])
                assert both[0].shape == plain[0].shape, (style, view, what)
                changed = both[0] != plain[0]
                if what == 'beard': assert not changed[:top + _mid(view)].any(), (style, view)
                else: assert ((plain[0] == P('hair')) & (both[0] == P('skin'))).sum() <= 8, (style, view)   # the arm crossing the hair to the ear, no more


BASE_CLEAN = {'front': f'{SET}/HD_clean_front.png', 'side': f'{SET}/HD_clean_side.png'}


def test_every_body_has_lost_its_head_and_kept_everything_else():
    bodies = hp.bodies()
    assert set(bodies) == {'front', 'side', 'back', 'walk_contact', 'walk_down', 'walk_pass', 'walk_up',
                           'toward_l', 'toward_r', 'away_l', 'away_r', 'pj_front', 'pj_sit'}
    for name, b in bodies.items():
        parts = b['parts']
        assert (parts == P('hair')).sum() == 0, name                          # no hair, no beard
        head_rows = parts[:max(0, b['ay'] - 1)]                                 # above the collar
        assert (head_rows == P('skin')).sum() == 0, name                      # no face
        assert (parts == P('hoodie')).sum() > 300, name                       # the top is all there
        assert b['view'] in ('front', 'side', 'back')
        if name != 'pj_sit':
            assert parts[-1].any() and parts.shape[0] >= 100, name              # he stands on the frame's last row
    assert (bodies['pj_front']['parts'] == P('skin')).sum() > (bodies['front']['parts'] == P('skin')).sum()   # bare feet


def test_a_walking_bodys_head_was_found_where_it_is_and_lifted_off_whole():
    """Each walk frame's own head is the approved head, somewhere else in the frame. Found there, it leaves no
    floating scraps, and the standard head sits back on at the frame's anchor."""
    bodies, heads, over = hp.bodies(), hp.heads(), hp.overlays()
    for name in ('walk_contact', 'walk_down', 'walk_pass', 'walk_up', 'toward_l', 'toward_r', 'away_l', 'away_r', 'pj_front', 'pj_sit'):
        b = bodies[name]
        pieces = [b, heads['standard'][b['view']]] + ([over['beard'][b['view']]] if b['view'] != 'back' else [])
        parts, light, ax, ay = hp.place(pieces)
        blobs = hp._pieces(parts > 0)
        assert len(blobs) == 1, (name, len(blobs))                              # one figure, nothing floating, no gap at the neck
        assert (parts == P('hair')).sum() > 40, name
    # the stride frames are wider than the standing ones, and their anchor is still the neck
    assert bodies['walk_contact']['parts'].shape[1] > bodies['side']['parts'].shape[1]


def test_the_beard_and_the_glasses_are_small_and_sit_on_the_face():
    over, heads = hp.overlays(), hp.heads()
    for view in ('front', 'side'):
        beard, glasses, head = over['beard'][view], over['glasses'][view], heads['standard'][view]
        assert 20 <= (beard['parts'] == P('hair')).sum() <= 160, view
        assert (glasses['parts'] == P('outline')).sum() >= 4, view             # dark frames, a pixel thick at this size
        for o in (beard, glasses):
            assert o['parts'].shape[0] <= head['parts'].shape[0] + 4 and o['parts'].shape[1] <= head['parts'].shape[1] + 4


def test_the_clothes_heap_is_a_prop_in_the_same_parts():
    heap = hp.props()['clothes']
    assert heap['parts'].shape == (23, 35)
    assert (heap['parts'] == P('hoodie')).sum() > 60 and (heap['parts'] == P('jeans')).sum() > 40 and (heap['parts'] == P('hair')).sum() == 0


# ---- the form the game reads: one sheet of codes, ramps to look colours up in ----

def test_a_pixel_is_coded_as_its_part_and_one_of_32_tones():
    ref = {'hoodie': 0.4, 'jeans': 0.4, 'skin': 0.6, 'hair': 0.3, 'grey': 0.5, 'outline': 0.1}
    parts = np.array([[0, P('hoodie'), P('hoodie'), P('grey'), P('outline')]], np.uint8)
    light = np.array([[0.0, 0.4, 0.2, 1.0, 0.1]])
    codes = hp.encode(parts, light, ref)
    assert codes.dtype == np.uint8 and codes[0, 0] == 0                        # clear
    part, tone = hp.decode(codes)
    assert [hp.PARTS[p] for p in part[0]] == ['none', 'hoodie', 'hoodie', 'grey', 'outline']
    assert tone[0, 1] == hp.TONE_OF_1 == 17 and tone[0, 2] == 7                # as light as the part usually is: tone 17; half as light: 7
    assert tone[0, 3] == 31                                                    # grey is coded by its own lightness: white is the top tone
    assert codes.max() <= 192


def test_painting_from_codes_matches_the_continuous_repaint_closely():
    parts, light = hp.full(f'{TEST}/H_front.png')
    ref = hp.REF()
    for _, look in hp.LOOKS:
        a = np.asarray(hp.repaint(parts, light, look, ref)).astype(int)
        b = np.asarray(hp.paint(hp.encode(parts, light, ref), look)).astype(int)
        assert np.array_equal(a[..., 3], b[..., 3])
        d = np.abs(a[..., :3] - b[..., :3])[a[..., 3] > 0]
        assert d.mean() < 2.5 and d.max() <= 24, (d.mean(), d.max())
        assert tuple(b[0, 0]) == (0, 0, 0, 0)


def _js_table(name):
    src = open(os.path.join(hp.ROOT, 'js/engine/hero-parts.js'), encoding='utf-8').read()
    body = re.search(r'export const %s = ([\[{][^;]*);' % name, src).group(1)
    return re.findall(r"#[0-9A-Fa-f]{6}", body), re.findall(r"(\w+):\s*'#", body)


def test_the_ramps_cover_every_colour_the_creator_offers():
    """The game looks colours up; it does no colour maths. So every creator colour needs its ramp, and the lists
    here must be the game's (js/engine/hero-parts.js)."""
    for table, mine in (('HOODIE', hp.HOODIE), ('JEANS', hp.JEANS), ('HAIR', hp.HAIR)):
        hexes, names = _js_table(table)
        assert names == list(mine) and [h.upper() for h in hexes] == [v.upper() for v in mine.values()], table
    assert [h.upper() for h in _js_table('SKIN')[0]] == [s.upper() for s in hp.SKIN]
    ramps = hp.ramps()
    assert set(ramps['hoodie']) == set(hp.HOODIE) and set(ramps['jeans']) == set(hp.JEANS) and set(ramps['hair']) == set(hp.HAIR)
    assert len(ramps['skin']) == 4 and all(len(ramps['hair'][h]) == 4 for h in hp.HAIR)       # hair thins toward the skin under it
    for r in [ramps['grey'], ramps['outline'], ramps['skin'][0], ramps['hoodie']['honey'], ramps['hair']['black'][2]]:
        assert len(r) == 32 * 6 and re.fullmatch(r'[0-9a-f]+', r)                              # 32 tones, rrggbb each
    assert ramps['hoodie']['honey'][17 * 6:18 * 6] == 'e8a000'                                 # tone 17 is the colour itself
    look = {'hoodie': 'honey', 'jeans': 'black', 'skin': 2, 'hair': 'brown'}
    lut = hp.lut(look)
    assert lut.shape == (256, 4) and tuple(lut[0]) == (0, 0, 0, 0) and tuple(lut[1 + 17]) == (0xE8, 0xA0, 0x00, 255)
    # pyjamas are the same pale blue on everyone (js/engine/hero-parts.js, PJ): the top is painted in the hoodie's
    # family and the trousers in the jeans', so in pyjamas those two parts take the pyjamas' colours instead
    assert set(ramps['pj']) == {'top', 'bottom'} and ramps['pj']['top'][17 * 6:18 * 6] == 'a9c4ec'
    pj = hp.lut(look, outfit='pj')
    assert tuple(pj[1 + 17]) == (0xA9, 0xC4, 0xEC, 255) and tuple(pj[1 + 32 + 17]) == (0xA9, 0xC4, 0xEC, 255)
    assert np.array_equal(pj[1 + 64:], lut[1 + 64:])                                           # skin, hair, grey and outline are his own


def test_the_outline_is_never_lighter_than_it_was_painted():
    """An outline pixel takes the mean lightness of what its block of the painting held, so one on the figure's edge
    can come out a little lighter than the outline usually is. The ramp used to lift such a pixel toward white, as
    it does a highlight on cloth, and it showed as a pale speck on his outline (review, 2026-11-16). An outline has
    no highlights: lighter than usual is the outline colour scaled up, which is still dark."""
    r = hp.ramps()['outline']
    base = [int(hp.OUTLINE[i:i + 2], 16) for i in (1, 3, 5)]
    tones = [[int(r[t * 6 + j:t * 6 + j + 2], 16) for j in (0, 2, 4)] for t in range(hp.TONES)]
    for t, rgb in enumerate(tones):
        ratio = min(max(hp.TONE_0 + hp.TONE_STEP * t, 0.6), 1.6)
        assert rgb == [min(255, round(v * ratio)) for v in base], (t, rgb)
    assert tones[hp.TONE_OF_1] == base and max(max(c) for c in tones) < 64                  # the lightest was 146
    # and a figure painted from the codes has no pale pixel in its outline
    b = hp.bodies()['front']; codes = hp.coded(b); parts, _ = hp.decode(codes)
    px = np.asarray(hp.paint(codes, {'hoodie': 'ink', 'jeans': 'indigo', 'skin': 0, 'hair': 'black'}))
    assert px[parts == P('outline')][:, :3].max() < 64


def test_the_built_sheet_and_manifest_are_what_the_game_needs():
    d = os.path.join(hp.ROOT, 'assets', 'hero')
    m = json.load(open(os.path.join(d, 'hero.json')))
    sheet = Image.open(os.path.join(d, m['image']))
    assert sheet.mode == 'P' and os.path.getsize(os.path.join(d, m['image'])) < 60_000
    codes = np.asarray(sheet)
    rgba = np.asarray(sheet.convert('RGBA'))
    assert np.array_equal(rgba[..., 0], np.where(codes > 0, codes, rgba[..., 0])) and np.array_equal(rgba[..., 3] > 0, codes > 0)   # a browser reads the code from red
    assert m['tones'] == 32 and m['parts'] == ['hoodie', 'jeans', 'skin', 'hair', 'grey', 'outline']
    assert set(m['bodies']) == set(hp.bodies()) and set(m['heads']) == {'standard', 'long', 'fro', 'mohawk'}
    assert all(set(v) == {'front', 'side', 'back'} for v in m['heads'].values())
    assert set(m['beard']) == {'front', 'side'} and set(m['glasses']) == {'front', 'side'} and set(m['props']) == {'clothes'}
    boxes = []
    def box(e):
        assert e['x'] >= 0 and e['y'] >= 0 and e['x'] + e['w'] <= sheet.width and e['y'] + e['h'] <= sheet.height
        boxes.append((e['x'], e['y'], e['x'] + e['w'], e['y'] + e['h']))
    for e in m['bodies'].values(): box(e); assert {'ax', 'ay', 'view'} <= set(e)
    for v in m['heads'].values():
        for e in v.values(): box(e); assert {'ax', 'ay'} <= set(e)
    for k in ('beard', 'glasses'):
        for e in m[k].values(): box(e)
    box(m['props']['clothes'])
    for i, p in enumerate(boxes):
        for q in boxes[i + 1:]:
            assert p[2] <= q[0] or q[2] <= p[0] or p[3] <= q[1] or q[3] <= p[1], (p, q)
    # the sheet holds exactly the pieces
    b = hp.bodies()['walk_up']; e = m['bodies']['walk_up']
    assert np.array_equal(codes[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']], hp.encode(b['parts'], b['light'], hp.REF()))
    assert (e['ax'], e['ay'], e['view']) == (b['ax'], b['ay'], 'side')
    # the walks: which frames, how far the whole figure dips, how far he travels a frame
    assert [f['body'] for f in m['walk']['side']['frames']] == ['walk_contact', 'walk_down', 'walk_pass', 'walk_up']
    assert [f['body'] for f in m['walk']['toward']['frames']] == ['toward_l', 'front', 'toward_r', 'front']
    assert [f['body'] for f in m['walk']['away']['frames']] == ['away_l', 'back', 'away_r', 'back']
    assert all(isinstance(f['dy'], int) and -2 <= f['dy'] <= 3 for w in m['walk'].values() for f in w['frames'])
    assert 8 <= m['walk']['side']['advance'] <= 20
    assert m['ramps'] == hp.ramps()
    # the Honeycomb mark's place on the chest, for the three frames that face us in the hoodie
    for name in ('front', 'toward_l', 'toward_r'):
        e, body = m['bodies'][name], hp.bodies()[name]
        x, y = e['ax'] + m['mark']['dx'], e['ay'] + m['mark']['dy']
        assert (body['parts'][y:y + 9, x:x + 9] == P('hoodie')).all(), name      # the 9x9 mark lands wholly on the hoodie
    assert 'mark' not in m['bodies']['pj_front']
    # the pupils, from the anchor: what a smaller drawing of him must not drop (two facing us, one in profile, none from behind)
    assert set(m['eyes']) == {'front', 'side'} and len(m['eyes']['front']) == 2 and len(m['eyes']['side']) == 1
    (lx, ly), (rx, ry) = m['eyes']['front']
    assert ly == ry and lx < 0 < rx and -18 <= ly <= -10
    for style, views in m['heads'].items():
        for view, pts in m['eyes'].items():
            e = views[view]; head = codes[e['y']:e['y'] + e['h'], e['x']:e['x'] + e['w']]
            for dx, dy in pts:
                part, _ = hp.decode(head[e['ay'] + dy, e['ax'] + dx])
                assert hp.PARTS[int(part)] == 'outline', (style, view)                    # every style has the same face


def test_fixtures_for_the_games_tests_are_python_compositions():
    """tests/fixtures/hero-painted/: the sheet's codes as raw bytes (Node has no PNG decoder) and a few finished
    figures the game's composer must reproduce byte for byte."""
    d = os.path.join(hp.ROOT, 'tests', 'fixtures', 'hero-painted')
    m = json.load(open(os.path.join(hp.ROOT, 'assets', 'hero', 'hero.json')))
    codes = np.asarray(Image.open(os.path.join(hp.ROOT, 'assets', 'hero', m['image'])))
    raw = np.frombuffer(open(os.path.join(d, 'sheet.codes'), 'rb').read(), np.uint8)
    assert np.array_equal(raw.reshape(codes.shape), codes)
    cases = sorted(f[:-5] for f in os.listdir(d) if f.endswith('.json'))
    assert len(cases) >= 8
    seen = set()
    for c in cases:
        spec = json.load(open(os.path.join(d, c + '.json')))
        img, ax, ay = hp.compose(m, codes, spec['body'], spec['style'], spec['beard'], spec['glasses'], spec['look'], spec['outfit'])
        assert spec['outfit'] == ('pj' if spec['body'].startswith('pj_') else 'hoodie'), c
        want = np.frombuffer(open(os.path.join(d, c + '.rgba'), 'rb').read(), np.uint8).reshape(spec['h'], spec['w'], 4)
        assert np.array_equal(np.asarray(img), want), c
        assert (spec['ax'], spec['ay']) == (ax, ay), c
        seen |= {spec['body'], spec['style']}
    assert {'front', 'side', 'back', 'walk_contact', 'toward_l', 'away_l', 'pj_sit', 'long', 'fro', 'mohawk', 'standard'} <= seen


def test_composing_from_the_built_files_is_placing_the_pieces():
    m = json.load(open(os.path.join(hp.ROOT, 'assets', 'hero', 'hero.json')))
    codes = np.asarray(Image.open(os.path.join(hp.ROOT, 'assets', 'hero', m['image'])))
    look = {'hoodie': 'teal', 'jeans': 'khaki', 'skin': 1, 'hair': 'ginger'}
    img, ax, ay = hp.compose(m, codes, 'walk_pass', 'fro', True, True, look)
    b, heads, over = hp.bodies()['walk_pass'], hp.heads(), hp.overlays()
    parts, light, px, py = hp.place([b, heads['fro']['side'], over['beard']['side'], over['glasses']['side']])
    assert (ax, ay) == (px, py)
    assert np.array_equal(np.asarray(img), np.asarray(hp.paint(hp.encode(parts, light, hp.REF()), look)))
    # from behind there is no beard and no glasses, whatever was asked for
    img2, _, _ = hp.compose(m, codes, 'back', 'standard', True, True, look)
    img3, _, _ = hp.compose(m, codes, 'back', 'standard', False, False, look)
    assert np.array_equal(np.asarray(img2), np.asarray(img3))
