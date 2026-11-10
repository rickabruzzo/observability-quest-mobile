import numpy as np
from tools import plates


def test_remove_fills_rects_black():
    img = np.full((20, 20, 3), 200, dtype=np.uint8)
    out = plates.remove(img, [(2, 2, 5, 5), (10, 10, 4, 3)])
    assert (out[2:7, 2:7] == 0).all()
    assert (out[10:13, 10:14] == 0).all()
    assert (out[0, 0] == 200).all()
    assert (img[2, 2] == 200).all()  # input untouched


def test_inpaint_fills_mask_without_black_hole():
    img = np.zeros((32, 32, 3), dtype=np.uint8)
    img[:, :] = (37, 48, 62)
    img[12:20, 12:20] = (255, 255, 255)
    mask = np.zeros((32, 32), dtype=np.uint8)
    mask[12:20, 12:20] = 255
    out = plates.inpaint(img, mask)
    centre = out[14:18, 14:18].reshape(-1, 3)
    assert (centre.max(axis=1) < 120).all()           # no longer white
    assert (centre.sum(axis=1) > 0).all()              # not a black hole


def test_fill_from_offset_copies_neighbour_pixels_into_mask():
    img = np.zeros((10, 10, 3), dtype=np.uint8)
    img[:, :5] = (10, 20, 30)          # left half one colour
    img[:, 5:] = (200, 200, 200)       # right half another
    mask = np.zeros((10, 10), dtype=np.uint8)
    mask[4:6, 3:7] = 255               # hole straddling the boundary
    out = plates.fill_from_offset(img, mask, dx=0, dy=-3)   # copy from 3 rows above
    assert (out[4:6, 3:5] == (10, 20, 30)).all()
    assert (out[4:6, 5:7] == (200, 200, 200)).all()
    assert (img[4, 3] == (10, 20, 30)).all()   # input untouched (it was already that colour, so check mask semantics)
    out2 = plates.fill_from_offset(img, mask, dx=4, dy=0)   # copy from 4 px to the right → all right-half colour
    assert (out2[4:6, 3:7] == (200, 200, 200)).all()
