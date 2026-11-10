#!/usr/bin/env python3
"""Losslessly recompress every PNG under assets/ (pixel data unchanged). Needs `pip install pyoxipng`."""
import glob, os, sys
try:
    import oxipng
except ImportError:
    sys.exit("pip install --break-system-packages pyoxipng")
before = after = 0
for p in sorted(glob.glob('assets/**/*.png', recursive=True)):
    b = os.path.getsize(p); before += b
    oxipng.optimize(p, level=4, strip=oxipng.StripChunks.safe())
    after += os.path.getsize(p)
print(f"{before/1024:.0f}K -> {after/1024:.0f}K ({100*(1-after/before):.1f}% smaller)")
