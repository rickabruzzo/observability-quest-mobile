"""Clean plates: stills with the moving parts removed."""
import numpy as np


def remove(img: np.ndarray, rects, bg=(0, 0, 0)) -> np.ndarray:
    """Fill each (x, y, w, h) rect with bg. Returns a copy."""
    out = img.copy()
    for (x, y, w, h) in rects:
        out[y:y + h, x:x + w, :3] = bg
    return out


def inpaint(img: np.ndarray, mask: np.ndarray, radius: int = 3) -> np.ndarray:
    """OpenCV Telea inpainting; mask is uint8 HxW with 255 where to fill."""
    import cv2
    src = np.ascontiguousarray(img[:, :, :3].astype(np.uint8))
    return cv2.inpaint(src, mask.astype(np.uint8), radius, cv2.INPAINT_TELEA)


def rect_mask(shape, rects) -> np.ndarray:
    m = np.zeros(shape[:2], dtype=np.uint8)
    for (x, y, w, h) in rects:
        m[y:y + h, x:x + w] = 255
    return m


def fill_from_offset(img: np.ndarray, mask: np.ndarray, dx: int = 0, dy: int = 0) -> np.ndarray:
    """Fill masked pixels (mask>0) with the pixel at (x+dx, y+dy). Returns a copy."""
    out = img.copy()
    ys, xs = np.nonzero(mask)
    H, W = img.shape[:2]
    sx = np.clip(xs + dx, 0, W - 1)
    sy = np.clip(ys + dy, 0, H - 1)
    out[ys, xs, :3] = img[sy, sx, :3]
    return out
