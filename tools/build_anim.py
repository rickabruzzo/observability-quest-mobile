#!/usr/bin/env python3
"""Build animation assets from the approved stills and the Gemini edit frames.

Inputs  (gitignored):  assets/*.png (stills), scratch/anim_gen/*.png (JPEG frames, 1264x848)
Outputs (committed):   assets/anim/*.png + *.json (sprites and "blank" patches that clear moving parts
                       off the still — no full plates are shipped), scratch/anim_review.png

Coordinates are in 640x428 export space, from docs/animation-handoff.md.
Run:  python3 tools/build_anim.py
"""
import json
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tools import palette, composite, plates  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
OUT = os.path.join(ASSETS, "anim")
GEN = os.path.join(ROOT, "scratch", "anim_gen")
REVIEW = os.path.join(ROOT, "scratch", "anim_review.png")
W, H = 640, 428

PORTRAITS = ["christine", "emily", "graham", "matt", "charity", "jessitron"]
# search windows for the changed region (x, y, w, h) — heads are centred in frame
EYES_WIN = (140, 60, 360, 190)
MOUTH_WIN = (160, 170, 320, 170)

# S3: left product panel (product + price), from handoff
S3_PRODUCT = (24, 92, 182, 208)
# S5: coins and PAY2 box, from handoff
S5_COINS = [(70, 216, 32, 28), (189, 216, 32, 28), (305, 216, 33, 28), (424, 216, 32, 28), (540, 216, 33, 28)]
S5_PAY2 = (391, 135, 94, 76)
# S4: "!!" above the character
S4_BANG = (518, 280, 70, 46)   # the two "!!" (with outline) plus the right sparkle; the left sparkle stays on the panel


def load(path):
    return np.array(Image.open(path).convert("RGB"))


def load_frame(name):
    """Gemini frame (JPEG despite .png) → 640x428 nearest-neighbour."""
    im = Image.open(os.path.join(GEN, name)).convert("RGB")
    if im.size != (W, H):
        im = im.resize((W, H), Image.NEAREST)
    return np.array(im)


def save_png(arr, path, alpha=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if alpha is None:
        Image.fromarray(arr.astype(np.uint8), "RGB").save(path, optimize=True)
    else:
        rgba = np.dstack([arr.astype(np.uint8), alpha.astype(np.uint8)])
        Image.fromarray(rgba, "RGBA").save(path, optimize=True)


def save_sprite(name, patch, bbox, alpha=None, extra=None):
    save_png(patch, os.path.join(OUT, f"{name}.png"), alpha)
    meta = {"x": bbox[0], "y": bbox[1], "w": bbox[2], "h": bbox[3]}
    if extra:
        meta.update(extra)
    with open(os.path.join(OUT, f"{name}.json"), "w") as f:
        json.dump(meta, f)


def shift(img, dx, dy):
    """Return img translated so that content at (x+dx, y+dy) lands at (x, y)."""
    out = np.zeros_like(img)
    H_, W_ = img.shape[:2]
    sx0, sx1 = max(0, dx), min(W_, W_ + dx)
    sy0, sy1 = max(0, dy), min(H_, H_ + dy)
    out[sy0 - dy:sy1 - dy, sx0 - dx:sx1 - dx] = img[sy0:sy1, sx0:sx1]
    return out


def diff_mask(a, b, thresh):
    import cv2
    d = np.abs(a.astype(np.int32) - b.astype(np.int32)).sum(axis=2)
    m = (d > thresh).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    return m


def union_bbox(mask, within, min_area=60, pad=8, grid=2):
    import cv2
    wx, wy, ww, wh = within
    m = np.zeros_like(mask)
    m[wy:wy + wh, wx:wx + ww] = mask[wy:wy + wh, wx:wx + ww]
    n, labels, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    boxes = [stats[i, :4] for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= min_area]
    if not boxes:
        return None
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
    x1 = max(b[0] + b[2] for b in boxes); y1 = max(b[1] + b[3] for b in boxes)
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(W, x1 + pad), min(H, y1 + pad)
    x0 -= x0 % grid; y0 -= y0 % grid; x1 += (-x1) % grid; y1 += (-y1) % grid
    return (int(x0), int(y0), int(min(W, x1) - x0), int(min(H, y1) - y0))


def build_portraits(review):
    for who in PORTRAITS:
        plate = load(os.path.join(ASSETS, f"portrait_{who}.png"))
        tiles = [plate]
        for kind, win, thresh in (("blink", EYES_WIN, 110), ("talk1", MOUTH_WIN, 110), ("talk2", MOUTH_WIN, 110)):
            if not os.path.exists(os.path.join(GEN, f"{who}_{kind}.png")):
                print(f"  -- {who}_{kind}: no frame yet (static portrait)")
                continue
            fr = load_frame(f"{who}_{kind}.png")
            dx, dy = composite.align(plate, fr, region=(120, 40, 400, 340), search=4)
            fr = shift(fr, dx, dy)
            bbox = union_bbox(diff_mask(plate, fr, thresh), win)
            if bbox is None:
                print(f"  !! {who}_{kind}: no change found — removing any stale output", file=sys.stderr)
                for ext in ("png", "json"):
                    try: os.remove(os.path.join(OUT, f"portrait_{who}_{kind}.{ext}"))
                    except FileNotFoundError: pass
                continue
            x, y, w, h = bbox
            region_plate = plate[y:y + h, x:x + w]
            patch = palette.snap(fr[y:y + h, x:x + w], palette.local_palette(plate, bbox))
            # only paint pixels the model actually changed (dilated), so the rectangle never shows
            alpha = composite.changed_alpha(region_plate, fr[y:y + h, x:x + w], thresh=thresh, dilate=2)
            save_sprite(f"portrait_{who}_{kind}", patch, bbox, alpha)
            shown = np.where(alpha[..., None] > 0, patch, region_plate)
            tiles.append(composite.paste(plate, shown, bbox))
            print(f"  {who}_{kind}: shift=({dx},{dy}) bbox={bbox}")
        review.append(("portrait_" + who, tiles))


def build_s3(review):
    plate = load(os.path.join(ASSETS, "s3_ecommerce.png"))
    base_pal = palette.local_palette(plate, S3_PRODUCT, margin=0)
    x, y, w, h = S3_PRODUCT
    tiles = [plate]
    # guitar = the still itself
    save_sprite("s3_product_guitar", plate[y:y + h, x:x + w], S3_PRODUCT)
    for prod, fname in (("drums", "s3_drums_1.png"), ("keys", "s3_keys_1.png")):
        fr = load_frame(fname)
        dx, dy = composite.align(plate, fr, region=(220, 80, 380, 300), search=4)  # align on the unchanged right 2/3
        fr = shift(fr, dx, dy)
        region = fr[y:y + h, x:x + w]
        # quantise the new product's own colours (32) and add them to the panel palette, so e.g. the
        # drum shells keep their red instead of snapping to the guitar's orange
        q = Image.fromarray(region).quantize(32, method=Image.Quantize.MEDIANCUT).convert("RGB")
        pal = np.unique(np.vstack([base_pal, palette.extract(np.array(q), max_colors=32)]), axis=0)
        patch = palette.snap(region, pal)
        save_sprite(f"s3_product_{prod}", patch, S3_PRODUCT)
        tiles.append(composite.paste(plate, patch, S3_PRODUCT))
        print(f"  s3_{prod}: shift=({dx},{dy})")
    # plate with the product panel emptied: inpaint from the panel's own background
    inner = plate[y:y + h, x:x + w]
    mask = (inner.astype(int).sum(axis=2) > 0).astype(np.uint8)  # anything not pure black
    # the panel background is a dark blue field; fill the whole product region with its median colour
    bg = np.median(inner.reshape(-1, 3), axis=0).astype(np.uint8)
    cleared = plate.copy(); cleared[y:y + h, x:x + w] = bg
    save_sprite("s3_product_blank", cleared[y:y + h, x:x + w], S3_PRODUCT)
    tiles.append(cleared)
    review.append(("s3", tiles))


def key_alpha(patch, keep):
    """Alpha mask from a boolean keep array."""
    return (keep.astype(np.uint8) * 255)


def lum_remap(img, keep, ramp, levels=12):
    """Map the kept pixels' colours onto `ramp` by relative luminance (dark→light), keeping shading structure."""
    src = palette.extract(img[keep], max_colors=levels)
    L = src.astype(float) @ np.array([0.299, 0.587, 0.114])
    t = (L - L.min()) / max(1e-6, (L.max() - L.min()))
    ramp = np.array(ramp, dtype=float)
    pos = t * (len(ramp) - 1)
    lo = np.floor(pos).astype(int); hi = np.minimum(lo + 1, len(ramp) - 1); f = (pos - lo)[:, None]
    dst = (ramp[lo] * (1 - f) + ramp[hi] * f).round().astype(np.uint8)
    return palette.remap(img, src, dst)


def build_s5(review):
    plate = load(os.path.join(ASSETS, "s5_payments.png"))
    x, y, w, h = S5_COINS[0]
    coin = plate[y:y + h, x:x + w]
    # key: keep pixels that are not black and not the blue dither
    r, g, b = coin[:, :, 0].astype(int), coin[:, :, 1].astype(int), coin[:, :, 2].astype(int)
    keep = (coin.sum(axis=2) > 30) & ~((b > r + 40) & (b > g + 20))
    alpha = key_alpha(coin, keep)
    save_sprite("s5_coin_gold", coin, S5_COINS[0], alpha)
    silver = lum_remap(coin, keep, [(40, 44, 56), (104, 110, 124), (164, 170, 184), (210, 216, 228), (250, 252, 255)])
    save_sprite("s5_coin_silver", silver, S5_COINS[0], alpha)
    copper = lum_remap(coin, keep, [(48, 18, 6), (116, 52, 18), (166, 86, 32), (210, 128, 60), (242, 182, 118)])
    save_sprite("s5_coin_copper", copper, S5_COINS[0], alpha)
    # PAY2 box sprite (opaque) and the clean plate
    px, py, pw, ph = S5_PAY2
    save_sprite("s5_pay2", plate[py:py + ph, px:px + pw], S5_PAY2)
    cleared = plates.remove(plate, [S5_PAY2])
    for (cx, cy, cw, ch) in S5_COINS:
        region = cleared[cy:cy + ch, cx:cx + cw]
        rr, gg, bb = region[:, :, 0].astype(int), region[:, :, 1].astype(int), region[:, :, 2].astype(int)
        k = (region.sum(axis=2) > 30) & ~((bb > rr + 40) & (bb > gg + 20))
        region[k] = (0, 0, 0)
    for i, (cx, cy, cw, ch) in enumerate(S5_COINS):
        save_sprite(f"s5_coin_blank_{i}", cleared[cy:cy + ch, cx:cx + cw], (cx, cy, cw, ch))
    with open(os.path.join(OUT, "s5_layout.json"), "w") as f:
        json.dump({"coins": [{"x": c[0], "y": c[1], "w": c[2], "h": c[3]} for c in S5_COINS],
                   "pay2": {"x": px, "y": py, "w": pw, "h": ph}}, f)
    tiles = [plate, cleared, composite.paste(cleared, silver, S5_COINS[1]), composite.paste(cleared, copper, S5_COINS[3])]
    review.append(("s5", tiles))


def build_s4(review):
    plate = load(os.path.join(ASSETS, "s4_spaghetti.png"))
    x, y, w, h = S4_BANG
    region = plate[y:y + h, x:x + w]
    bright = (region.min(axis=2) > 120)  # white marks and sparkle dots (incl. light anti-aliased edges)
    alpha = key_alpha(region, bright)
    save_sprite("s4_bang", region, S4_BANG, alpha)
    # Clear the whole rect. It straddles the INFRA panel's right bevel (ends x=531; black from 532)
    # and the panel's bottom border (y 316–321). Panel side: copy from above in two bands (the rect
    # is taller than the clean strip above it); bottom border rows copy from 40px left; below the
    # panel and right of it is black.
    PANEL_RIGHT = 531
    rect = np.zeros((H, W), dtype=np.uint8); rect[y:y + h, x:x + w] = 255
    xs = np.arange(W)[None, :].repeat(H, 0); ys = np.arange(H)[:, None].repeat(W, 1)
    m_panel = (rect > 0) & (xs <= PANEL_RIGHT)
    # panel interior strip above the "!!" is y 261–279 (top bevel ends at 260): 19-row bands
    cleared = plates.fill_from_offset(plate, (m_panel & (ys < 299)).astype(np.uint8), dx=0, dy=-19)
    cleared = plates.fill_from_offset(cleared, (m_panel & (ys >= 299) & (ys < 318)).astype(np.uint8), dx=0, dy=-19)
    cleared = plates.fill_from_offset(cleared, (m_panel & (ys >= 318)).astype(np.uint8), dx=0, dy=-19)
    cleared = plates.fill_from_offset(cleared, (m_panel & (ys >= 316) & (ys <= 321)).astype(np.uint8), dx=-40, dy=0)
    cleared[(rect > 0) & ((xs > PANEL_RIGHT) | (ys >= 322))] = (0, 0, 0)
    save_sprite("s4_bang_blank", cleared[y:y + h, x:x + w], S4_BANG)
    bounced = cleared.copy()
    sub = bounced[y - 6:y - 6 + h, x:x + w]
    bounced[y - 6:y - 6 + h, x:x + w] = np.where(alpha[..., None] > 0, region, sub)
    review.append(("s4", [plate, cleared, bounced]))


def write_review(review):
    rows = []
    for name, tiles in review:
        row = Image.new("RGB", (len(tiles) * (W // 2 + 6), H // 2), (40, 40, 40))
        for i, t in enumerate(tiles):
            row.paste(Image.fromarray(t.astype(np.uint8)).resize((W // 2, H // 2), Image.NEAREST), (i * (W // 2 + 6), 0))
        rows.append(row)
    sheet = Image.new("RGB", (max(r.width for r in rows), sum(r.height + 6 for r in rows)), (40, 40, 40))
    yy = 0
    for r in rows:
        sheet.paste(r, (0, yy)); yy += r.height + 6
    sheet.save(REVIEW)
    print(f"review sheet: {REVIEW}")


def main():
    os.makedirs(OUT, exist_ok=True)
    review = []
    print("portraits"); build_portraits(review)
    print("s3"); build_s3(review)
    print("s5"); build_s5(review)
    print("s4"); build_s4(review)
    write_review(review)


if __name__ == "__main__":
    main()
