"""The painted hero (art brief 05): Art Claude's figures cut to game size as parts the game can repaint."""
import os
import numpy as np
from PIL import Image
from tools import build_hero_painted as hp

KEY = hp.KEY


def _img(rows):
    return Image.fromarray(np.array(rows, np.uint8), 'RGB')


def test_a_pixel_is_sorted_into_its_part_by_its_colour_family():
    px = [[KEY, (60, 200, 70), (30, 150, 235), (150, 40, 120), (225, 150, 95), (150, 150, 152), (238, 238, 240), (22, 20, 28)]]
    parts, light = hp.classify(_img(px), speck=0)
    assert [hp.PARTS[p] for p in parts[0]] == ['none', 'hoodie', 'jeans', 'hair', 'skin', 'grey', 'grey', 'outline']
    assert light[0, 6] > light[0, 5] > light[0, 7]                      # lightness is kept for the shading


def test_a_dark_green_fold_is_still_hoodie_not_outline():
    """The hand-back's warning: the darkest hoodie and jeans tones sit close to the outline."""
    parts, _ = hp.classify(_img([[(18, 62, 26), (14, 40, 78), (20, 19, 24)]]), speck=0)
    assert [hp.PARTS[p] for p in parts[0]] == ['hoodie', 'jeans', 'outline']


def test_game_size_takes_each_pixels_majority_part_and_the_mean_lightness_of_what_it_covers():
    g, b = (60, 200, 70), (30, 150, 235)
    # 4x4 -> 2x2: top-left mostly hoodie with one jeans pixel; top-right all background; bottom-left half background; bottom-right jeans
    rows = [[g, g, KEY, KEY], [g, b, KEY, KEY], [g, KEY, b, b], [KEY, KEY, b, b]]
    parts, light = hp.classify(_img(rows), speck=0)
    p, l = hp.to_size(parts, light, 2, 2)
    assert [[hp.PARTS[x] for x in r] for r in p] == [['hoodie', 'none'], ['none', 'jeans']]      # under half covered is not his
    assert abs(l[0, 0] - light[:2, :2].mean()) < 1e-6 and abs(l[1, 1] - light[2, 2]) < 1e-6


def test_repainting_puts_the_players_colour_where_the_parts_usual_tone_was_and_keeps_the_shading():
    parts = np.array([[1, 1, 1, 5, 6]], np.uint8); light = np.array([[0.45, 0.30, 0.60, 0.9, 0.1]])
    out = np.asarray(hp.repaint(parts, light, {'hoodie': '#2B3647'}, ref={'hoodie': 0.45, 'outline': 0.1}))
    assert tuple(out[0, 0][:3]) == (0x2B, 0x36, 0x47)                              # the usual tone is the chosen colour
    assert all(out[0, 1][:3] < out[0, 0][:3]) and all(out[0, 2][:3] > out[0, 0][:3])   # folds darker, lit side lighter
    assert abs(int(out[0, 3][0]) - int(out[0, 3][2])) <= 6 and out[0, 3][0] > 200   # neutral stays neutral: an eye's white, a sole
    assert out[0, 4][0] < 60 and (out[..., 3] == 255).all()


def test_the_four_delivered_figures_build_to_the_games_canvas():
    drop = os.path.join(hp.ROOT, hp.DROP)
    for name, w in (('H_front', 56), ('H_side', 56), ('H_walk_pass', 56), ('H_walk_contact', 74)):
        parts, light = hp.figure(os.path.join(drop, name + '.png'))                 # game size: 136 px tall on a 144-row canvas
        assert parts.shape == (144, w), (name, parts.shape)
        rows = np.nonzero(parts.any(axis=1))[0]
        assert rows.max() == 143 and 134 <= rows.max() - rows.min() + 1 <= 138, (name, rows.min(), rows.max())
        present = {hp.PARTS[p] for p in np.unique(parts)}
        assert {'hoodie', 'jeans', 'skin', 'hair', 'grey', 'outline'} <= present, (name, present)
    front, _ = hp.figure(os.path.join(drop, 'H_front.png'))
    assert (front == hp.PARTS.index('hoodie')).sum() > 900 and (front == hp.PARTS.index('jeans')).sum() > 600


def test_the_yellow_fringe_where_a_part_meets_the_background_is_not_skin():
    """Where green cloth was blended into the yellow background the edge pixel is a yellow-green: read as skin by
    hue alone, and repainted as a pale rim round a dark hoodie. It is the figure's edge: outline."""
    g, fringe = (60, 200, 70), (202, 211, 62)
    rows = [[KEY] * 6] + [[KEY, fringe, g, g, g, g] for _ in range(6)] + [[KEY] * 6]
    parts, _ = hp.classify(_img(rows))
    assert {hp.PARTS[p] for p in parts[1:7, 1]} == {'outline'}
    assert {hp.PARTS[p] for p in parts[1:7, 2:].ravel()} == {'hoodie'}


def test_a_speck_of_one_family_inside_another_part_is_not_that_family():
    """The eyes are painted a dark blue: a few pixels of the jeans' family in the face. Khaki jeans must not give
    him khaki eyes. A dark speck is outline; a lighter one belongs to the part round it."""
    s, g, iris, stray = (225, 150, 95), (60, 200, 70), (30, 50, 110), (90, 170, 235)
    rows = [[s] * 9 for _ in range(9)] + [[g] * 9 for _ in range(9)]
    rows[4][4] = iris; rows[4][5] = iris
    rows[13][4] = stray
    parts, _ = hp.classify(_img(rows))
    assert hp.PARTS[parts[4, 4]] == 'outline' and hp.PARTS[parts[4, 5]] == 'outline'
    assert hp.PARTS[parts[13, 4]] == 'hoodie'
    assert (parts[:9] != hp.PARTS.index('jeans')).all() and (parts[9:] != hp.PARTS.index('jeans')).all()


def test_a_small_patch_of_the_jeans_family_inside_the_hoodie_is_hoodie():
    """The hood's inner shadow is painted a blue-green that sorts as jeans by hue: with khaki jeans it would be a
    khaki patch in the hood. A patch of a clothing family that is a sliver of that family's whole is not that
    garment: it belongs to what it sits in."""
    g, b, shade = (60, 200, 70), (30, 150, 235), (20, 120, 130)
    rows = [[g] * 30 for _ in range(30)] + [[b] * 30 for _ in range(30)]
    for y in range(8, 13):
        for x in range(10, 16): rows[y][x] = shade                      # 30 px of blue-green in the middle of the hoodie
    parts, _ = hp.classify(_img(rows))
    assert (parts[:30] == hp.PARTS.index('hoodie')).all()
    assert (parts[30:] == hp.PARTS.index('jeans')).all()


def test_hair_painted_lighter_than_usual_is_thinner_hair_over_skin_not_grey():
    """The beard is painted a lighter tone of the hair's family: stubble. Lifted toward white it comes out grey on a
    brown-skinned, brown-haired hero; it is hair over skin, so it moves toward the skin's colour."""
    parts = np.array([[4, 4, 3]], np.uint8); light = np.array([[0.34, 0.58, 0.52]])
    look = {'hair': '#5C3A1E', 'skin': '#8F5B38'}
    out = np.asarray(hp.repaint(parts, light, look, ref={'hair': 0.34, 'skin': 0.52})).astype(int)
    hair, beard, skin = out[0, 0][:3], out[0, 1][:3], out[0, 2][:3]
    assert tuple(hair) == (0x5C, 0x3A, 0x1E) and tuple(skin) == (0x8F, 0x5B, 0x38)
    assert all(min(h, s) <= b <= max(h, s) for h, b, s in zip(hair, beard, skin)), beard     # between hair and skin, on every channel
    assert beard[0] - beard[2] > 40, beard                                                    # still warm: not grey
