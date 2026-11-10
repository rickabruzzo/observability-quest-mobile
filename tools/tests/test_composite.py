import numpy as np
from tools import composite


def _plate():
    rng = np.random.default_rng(7)
    img = np.zeros((40, 40, 3), dtype=np.uint8)
    # a few hard colors in blocks so alignment has structure
    for y in range(0, 40, 8):
        for x in range(0, 40, 8):
            img[y:y + 8, x:x + 8] = rng.choice([(0, 0, 0), (37, 48, 62), (2, 120, 205), (255, 176, 0)])
    return img


def test_align_recovers_known_shift():
    plate = _plate()
    edit = np.roll(np.roll(plate, 3, axis=1), -2, axis=0)  # content moved right 3, up 2
    dx, dy = composite.align(plate, edit, region=(8, 8, 24, 24), search=4)
    assert (dx, dy) == (3, -2)


def test_cut_returns_region_from_edit_snapped():
    plate = _plate()
    edit = plate.copy().astype(int)
    edit[16:24, 16:24] = (250, 170, 5)          # a "changed" patch, slightly off-palette (JPEG-ish)
    edit = np.clip(edit, 0, 255).astype(np.uint8)
    patch, bbox = composite.cut(plate, edit, region=(16, 16, 8, 8), search=0)
    assert bbox == (16, 16, 8, 8)
    assert patch.shape == (8, 8, 3)
    assert (patch == np.array((255, 176, 0), dtype=np.uint8)).all()   # snapped to plate honey


def test_cut_applies_alignment_offset():
    plate = _plate()
    shifted = np.roll(plate, 2, axis=1)  # edit content is 2px right of plate
    patch, bbox = composite.cut(plate, shifted, region=(8, 8, 16, 16), search=3)
    assert bbox == (8, 8, 16, 16)
    assert (patch == plate[8:24, 8:24]).all()


def test_changed_alpha_is_transparent_where_the_edit_matches_the_plate():
    plate = np.zeros((20, 20, 3), dtype=np.uint8); plate[:, :] = (37, 48, 62)
    edit = plate.copy(); edit[8:12, 8:12] = (255, 176, 0)
    alpha = composite.changed_alpha(plate, edit, thresh=40, dilate=1)
    assert alpha.shape == (20, 20) and alpha.dtype == np.uint8
    assert (alpha[9:11, 9:11] == 255).all()
    assert (alpha[0, :] == 0).all() and (alpha[:, 0] == 0).all()   # border untouched → transparent
    assert alpha[7, 9] == 255 and alpha[5, 9] == 0                  # dilated by one, not more
