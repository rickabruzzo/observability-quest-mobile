"""The Home Screen icons are the official Honeycomb mark, never drawn or generated.

tools/build_icons.py takes the four hexagons of assets/hc_logomark.png exactly as the file has them (the small
dark 'h' of the wordmark left out, as tools/hc_mark.py leaves it out), enlarges them by a whole number so no
pixel is invented, and centres them on black: assets/icons/icon-180.png (iPhone), icon-192.png and
icon-512.png (the web app manifest)."""
import os
from PIL import Image, ImageChops
from tools import build_icons, hc_mark

OFFICIAL = 'assets/hc_logomark.png'
BRAND = [tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in hc_mark.HC_MARK.values()]


def _mark_box(icon):
    """The box of everything that is not background."""
    return ImageChops.difference(icon, Image.new('RGB', icon.size, build_icons.BACKGROUND)).getbbox()


def test_sizes_are_the_three_the_phones_ask_for():
    assert build_icons.SIZES == (180, 192, 512)
    for size in build_icons.SIZES:
        icon = build_icons.icon(OFFICIAL, size)
        assert icon.size == (size, size)
        assert icon.mode == 'RGB'                                   # opaque: an iPhone paints a transparent icon's gaps black anyway


def test_the_mark_is_the_official_hexagons_in_their_own_colours_without_the_h():
    icon = build_icons.icon(OFFICIAL, 512)
    colours = {c for _, c in icon.getcolors(1 << 16)}
    for brand in BRAND:
        assert brand in colours, brand                              # blue, green, orange and honey, untouched
    assert hc_mark.INK not in colours                               # the wordmark's 'h' is not part of the mark
    assert colours & {build_icons.BACKGROUND} == {build_icons.BACKGROUND}
    assert icon.getpixel((0, 0)) == build_icons.BACKGROUND and icon.getpixel((511, 511)) == build_icons.BACKGROUND


def test_the_mark_is_enlarged_by_a_whole_number_so_no_pixel_is_invented():
    hexagons = build_icons.hexagons(OFFICIAL)
    for size in build_icons.SIZES:
        icon = build_icons.icon(OFFICIAL, size)
        x0, y0, x1, y1 = _mark_box(icon)
        k = build_icons.scale_for(size, hexagons.size)
        assert k >= 1 and (x1 - x0, y1 - y0) == (hexagons.width * k, hexagons.height * k)
        cut = icon.crop((x0, y0, x1, y1))
        small = cut.resize(hexagons.size, Image.NEAREST)
        assert ImageChops.difference(cut, small.resize(cut.size, Image.NEAREST)).getbbox() is None   # every k×k block is one colour


def test_the_mark_is_centred_with_clear_space_round_it():
    for size in build_icons.SIZES:
        x0, y0, x1, y1 = _mark_box(build_icons.icon(OFFICIAL, size))
        assert abs(x0 - (size - x1)) <= 1 and abs(y0 - (size - y1)) <= 1
        assert min(x0, y0, size - x1, size - y1) >= size // 10      # a tenth of the icon clear on every side


def test_the_files_in_the_repo_are_a_fresh_build():
    for size in build_icons.SIZES:
        path = os.path.join('assets', 'icons', f'icon-{size}.png')
        assert os.path.exists(path), path
        on_disk = Image.open(path).convert('RGB')
        assert ImageChops.difference(on_disk, build_icons.icon(OFFICIAL, size)).getbbox() is None, path
