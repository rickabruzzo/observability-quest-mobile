"""The personas' conversation portraits: a still and three small patches each, in the narrators' format."""
import json, os
import numpy as np
from PIL import Image
from tools import build_persona_portraits as bp


def _src(tmp_path):
    src = tmp_path / 'src'; src.mkdir()
    plate = Image.new('RGB', (640, 428), (0, 0, 0)); plate.paste((200, 150, 120), (220, 60, 420, 360)); plate.save(src / 'P9_portrait.png')
    for kind, box, colour in (('blink', (260, 150, 380, 170), (120, 80, 60)), ('talk1', (290, 262, 350, 276), (90, 30, 30)), ('talk2', (286, 258, 354, 290), (60, 10, 10))):
        f = plate.copy(); f.paste(colour, box); f.save(src / f'P9_portrait_{kind}.png')
    return str(src / 'P9_portrait')


def test_a_portrait_becomes_a_still_and_three_patches_in_the_narrators_format(tmp_path):
    out = tmp_path / 'assets'
    made = bp.build({'p9': _src(tmp_path)}, assets=str(out))
    assert made == ['portrait_p9', 'portrait_p9_blink', 'portrait_p9_talk1', 'portrait_p9_talk2']
    still = Image.open(out / 'portrait_p9.png')
    assert still.size == (640, 428) and len(still.convert('RGB').getcolors(1 << 24)) <= 256
    for kind, box, colour in (('blink', (260, 150, 380, 170), (120, 80, 60)), ('talk1', (290, 262, 350, 276), (90, 30, 30)), ('talk2', (286, 258, 354, 290), (60, 10, 10))):
        m = json.load(open(out / 'anim' / f'portrait_p9_{kind}.json')); im = np.asarray(Image.open(out / 'anim' / f'portrait_p9_{kind}.png').convert('RGBA'))
        assert im.shape[:2] == (m['h'], m['w'])
        assert m['x'] <= box[0] and m['y'] <= box[1] and m['x'] + m['w'] >= box[2] and m['y'] + m['h'] >= box[3]      # the patch covers the change
        assert m['w'] <= box[2] - box[0] + 24 and m['h'] <= box[3] - box[1] + 24                                        # and little more
        a = im[..., 3]; border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
        assert (border == 0).all() and (a > 0).any()                                  # only what changed is painted
        cx, cy = (box[0] + box[2]) // 2 - m['x'], (box[1] + box[3]) // 2 - m['y']
        assert tuple(im[cy, cx]) == colour + (255,)


def test_a_frame_that_changes_the_wrong_part_of_the_face_is_refused(tmp_path):
    base = _src(tmp_path)
    f = Image.open(base + '.png').copy(); f.paste((255, 0, 0), (20, 20, 80, 80)); f.save(base + '_blink.png')    # a change in the corner
    try: bp.build({'p9': base}, assets=str(tmp_path / 'assets'))
    except ValueError as e: assert 'blink' in str(e)
    else: raise AssertionError('no error')


def test_the_five_personas_are_listed_and_their_files_exist():
    assert sorted(bp.PORTRAITS) == ['p1', 'p2', 'p3', 'p4', 'p5']
    for base in bp.PORTRAITS.values():
        for suffix in ('', '_blink', '_talk1', '_talk2'): assert os.path.exists(os.path.join(bp.ROOT, base + suffix + '.png')), base + suffix
