"""Region compositing: align a model-edited frame to the approved plate and cut the changed region."""
import numpy as np
from . import palette


def _crop(img, x, y, w, h):
    return img[y:y + h, x:x + w, :3].astype(np.int32)


def align(plate: np.ndarray, edit: np.ndarray, region, search: int = 6):
    """Find (dx, dy) in [-search, search] that minimises mean abs error between plate[region]
    and edit shifted by (dx, dy). Content in edit at (x+dx, y+dy) corresponds to plate (x, y)."""
    x, y, w, h = region
    H, W = plate.shape[:2]
    best, best_err = (0, 0), None
    ref = _crop(plate, x, y, w, h)
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            sx, sy = x + dx, y + dy
            if sx < 0 or sy < 0 or sx + w > W or sy + h > H:
                continue
            err = np.abs(_crop(edit, sx, sy, w, h) - ref).mean()
            if best_err is None or err < best_err - 1e-9:
                best, best_err = (dx, dy), err
    return best


def cut(plate: np.ndarray, edit: np.ndarray, region, search: int = 6, snap_to=None, pal_colors: int = 64):
    """Return (patch, bbox): the region of `edit` (after alignment) palette-snapped to the plate.
    bbox is the region in plate coordinates. snap_to defaults to the plate itself."""
    x, y, w, h = region
    dx, dy = align(plate, edit, region, search) if search > 0 else (0, 0)
    sx, sy = x + dx, y + dy
    patch = edit[sy:sy + h, sx:sx + w, :3].astype(np.uint8)
    src = plate if snap_to is None else snap_to
    pal = palette.extract(src[y:y + h, x:x + w] if snap_to is None else src, max_colors=pal_colors)
    # Always include the whole plate palette too, so new colors inside the patch map sensibly.
    pal = np.unique(np.vstack([pal, palette.extract(plate, max_colors=pal_colors)]), axis=0)
    return palette.snap(patch, pal), (x, y, w, h)


def paste(plate: np.ndarray, patch: np.ndarray, bbox) -> np.ndarray:
    x, y, w, h = bbox
    out = plate.copy()
    out[y:y + h, x:x + w, :3] = patch
    return out


def changed_bbox(a: np.ndarray, b: np.ndarray, thresh: int = 40, pad: int = 4, grid: int = 2, within=None):
    """Bounding box (x, y, w, h) of the largest changed blob between a and b, padded and snapped to grid.
    `within` = (x, y, w, h) limits the search to a sub-rectangle."""
    import cv2
    diff = np.abs(a[:, :, :3].astype(np.int32) - b[:, :, :3].astype(np.int32)).sum(axis=2)
    mask = (diff > thresh).astype(np.uint8) * 255
    if within is not None:
        wx, wy, ww, wh = within
        m2 = np.zeros_like(mask); m2[wy:wy + wh, wx:wx + ww] = mask[wy:wy + wh, wx:wx + ww]; mask = m2
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    if n <= 1:
        return None
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = [int(v) for v in stats[i, :4]]
    x0, y0 = max(0, x - pad), max(0, y - pad)
    x1, y1 = min(a.shape[1], x + w + pad), min(a.shape[0], y + h + pad)
    x0 -= x0 % grid; y0 -= y0 % grid
    x1 += (-x1) % grid; y1 += (-y1) % grid
    return (x0, y0, min(a.shape[1], x1) - x0, min(a.shape[0], y1) - y0)
