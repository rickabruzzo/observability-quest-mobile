import numpy as np
from tools import palette


def test_snap_maps_to_nearest_palette_color():
    img = np.full((4, 4, 3), (10, 10, 10), dtype=np.uint8)
    pal = np.array([(0, 0, 0), (255, 255, 255)], dtype=np.uint8)
    out = palette.snap(img, pal)
    assert out.shape == img.shape and out.dtype == np.uint8
    assert (out == 0).all()


def test_snap_output_only_contains_palette_colors():
    rng = np.random.default_rng(1)
    img = rng.integers(0, 256, (16, 16, 3), dtype=np.uint8)
    pal = np.array([(0, 0, 0), (37, 48, 62), (2, 120, 205), (255, 176, 0), (255, 255, 255)], dtype=np.uint8)
    out = palette.snap(img, pal)
    colors = {tuple(c) for c in out.reshape(-1, 3)}
    assert colors <= {tuple(c) for c in pal}


def test_extract_returns_dominant_colors_first():
    img = np.zeros((8, 8, 3), dtype=np.uint8)
    img[:, 4:] = (255, 176, 0)   # half honey
    img[0, 0] = (1, 2, 3)        # one stray pixel
    pal = palette.extract(img, max_colors=2)
    assert len(pal) == 2
    assert {tuple(c) for c in pal} == {(0, 0, 0), (255, 176, 0)}


def test_local_palette_uses_only_colors_near_the_bbox():
    img = np.zeros((40, 40, 3), dtype=np.uint8)
    img[:, :] = (37, 48, 62)
    img[10:20, 10:20] = (255, 176, 0)        # inside bbox
    img[35:40, 35:40] = (2, 120, 205)        # far away: must not appear
    pal = palette.local_palette(img, (10, 10, 10, 10), margin=4)
    cols = {tuple(c) for c in pal}
    assert (255, 176, 0) in cols and (37, 48, 62) in cols
    assert (2, 120, 205) not in cols


def test_remap_replaces_each_palette_color_and_keeps_structure():
    img = np.zeros((4, 4, 3), dtype=np.uint8)
    img[:2] = (255, 200, 0); img[2:] = (120, 90, 0)
    src = np.array([(255, 200, 0), (120, 90, 0)], dtype=np.uint8)
    dst = np.array([(200, 200, 210), (90, 90, 100)], dtype=np.uint8)
    out = palette.remap(img, src, dst)
    assert (out[:2] == (200, 200, 210)).all() and (out[2:] == (90, 90, 100)).all()
