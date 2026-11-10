"""Palette utilities for pixel-art assets."""
import numpy as np


def extract(img: np.ndarray, max_colors: int = 64) -> np.ndarray:
    """Distinct colors in img ordered by frequency (most common first), truncated to max_colors."""
    flat = img.reshape(-1, img.shape[-1])[:, :3]
    colors, counts = np.unique(flat, axis=0, return_counts=True)
    order = np.argsort(-counts, kind="stable")
    return colors[order][:max_colors].astype(np.uint8)


def snap(img: np.ndarray, pal: np.ndarray) -> np.ndarray:
    """Map every pixel to the nearest palette color (Euclidean RGB). Returns uint8 HxWx3."""
    h, w = img.shape[:2]
    flat = img.reshape(-1, img.shape[-1])[:, :3].astype(np.int32)
    p = pal[:, :3].astype(np.int32)
    # chunk to bound memory on big images
    out = np.empty((flat.shape[0], 3), dtype=np.uint8)
    step = 65536
    for i in range(0, flat.shape[0], step):
        chunk = flat[i:i + step]
        d = ((chunk[:, None, :] - p[None, :, :]) ** 2).sum(axis=2)
        out[i:i + step] = p[np.argmin(d, axis=1)].astype(np.uint8)
    return out.reshape(h, w, 3)


def recolor(img: np.ndarray, hue_shift: float = 0.0, sat_scale: float = 1.0, val_scale: float = 1.0) -> np.ndarray:
    """HSV adjust an RGB uint8 image (hue_shift in degrees)."""
    from PIL import Image
    im = Image.fromarray(img[:, :, :3].astype(np.uint8), "RGB").convert("HSV")
    a = np.array(im).astype(np.int32)
    a[:, :, 0] = (a[:, :, 0] + int(round(hue_shift * 255 / 360))) % 256
    a[:, :, 1] = np.clip(a[:, :, 1] * sat_scale, 0, 255)
    a[:, :, 2] = np.clip(a[:, :, 2] * val_scale, 0, 255)
    return np.array(Image.fromarray(a.astype(np.uint8), "HSV").convert("RGB"))


def local_palette(img: np.ndarray, bbox, margin: int = 24, max_colors: int = 4096) -> np.ndarray:
    """Colors actually present in img within bbox expanded by margin — the right snap target for a
    patch that must blend into that neighbourhood. Ordered by frequency, capped at max_colors."""
    x, y, w, h = bbox
    H, W = img.shape[:2]
    x0, y0 = max(0, x - margin), max(0, y - margin)
    x1, y1 = min(W, x + w + margin), min(H, y + h + margin)
    return extract(img[y0:y1, x0:x1], max_colors=max_colors)


def remap(img: np.ndarray, src: np.ndarray, dst: np.ndarray) -> np.ndarray:
    """Snap img to src palette, then replace each src color with the dst color of the same index."""
    flat = img.reshape(-1, img.shape[-1])[:, :3].astype(np.int32)
    p = src[:, :3].astype(np.int32)
    idx = np.argmin(((flat[:, None, :] - p[None, :, :]) ** 2).sum(axis=2), axis=1)
    return dst[idx].astype(np.uint8).reshape(img.shape[0], img.shape[1], 3)
