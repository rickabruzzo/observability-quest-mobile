"""Checks on the generated sprites in assets/anim (run after tools/build_anim.py)."""
import glob, json, os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_portrait_patches_are_transparent_on_their_borders():
    files = sorted(glob.glob(os.path.join(ROOT, "assets", "anim", "portrait_*_blink.png")))
    assert files, "no portrait patches built"
    for f in files:
        im = np.array(Image.open(f).convert("RGBA"))
        a = im[:, :, 3]
        border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
        assert (border == 0).mean() > 0.9, f"{os.path.basename(f)} border is {100*(border > 0).mean():.0f}% opaque"
        assert (a > 0).any(), f"{os.path.basename(f)} is fully transparent"


def test_every_sprite_has_matching_json_inside_the_frame():
    for png in glob.glob(os.path.join(ROOT, "assets", "anim", "*.png")):
        meta = png[:-4] + ".json"
        assert os.path.exists(meta), f"missing {os.path.basename(meta)}"
        m = json.load(open(meta))
        w, h = Image.open(png).size
        assert (m["w"], m["h"]) == (w, h)
        assert 0 <= m["x"] and m["x"] + w <= 640 and 0 <= m["y"] and m["y"] + h <= 428
