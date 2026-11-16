# Cloud Claude review — Warp brief 15, the painted hero (2026-11-16)

Reviewed `warp/painted-hero` (63ba9e6): the hand-back, the whole diff, the three suites, and the result both as
figures composed by the game's own code and in a browser, every picture looked at enlarged.
`desktop/painted-hero-review` is `era-look` (c2ba376) with Warp's branch merged in and four changes on top. The
merge had the one conflict Warp's hand-back foretold, in `js/screens/chapter.js` where the hero is drawn; Warp's
line is the right one and was taken.

Warp's work is right. Three of the four changes below fix things that were mine (a rule in my brief, a fault in
my asset build) or answer Rick's note of this morning; the fourth is the retirement brief 15 left to me.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/painted-hero` as handed back | 359 | 165 | 149 |
| merged onto `era-look`, before my changes | 375 | 165 | 160 |
| `desktop/painted-hero-review` | 380 | 128 | 162 |

Python is lower because the retired generator's 40 tests went with it (165, plus 3 new, less 40).

## What I looked at

- **The figures themselves**, composed by `js/engine/hero.js` from the sheet: front, side and back at eleven
  sizes from full size down to half (the rooms use 0.50 to 0.98); all four hair styles with and without the
  beard and the glasses, in three views, at full size and at 0.8; every hair colour on the lightest and darkest
  skin; all thirteen bodies.
- **In the rooms:** standing at the start of each of the five; room 2's side walk right and left, a capture at
  each new frame; room 5 walking away to the back wall and turning round.
- **The creator:** both pages at 844×390 and 667×375.
- **The intro's bedroom:** sitting up, standing in pyjamas beside the heap, dressed, the walk to the door, the
  door open.
- **Room 2 as a phone shows it**, at both sizes.

## What is right

- **He is the paintings.** Every figure is the pieces stacked on the neck and looked up in the ramps; the ten
  fixtures match byte for byte. No colour maths, nothing drawn.
- **Smaller, he stays himself.** Whole rows and columns, no blending: at every size down to half, both eyes are
  there, the soles sit on the floor line, and nothing smears.
- **The walks.** Side on, toward us and away each use their own pictures; the frame comes from the ground he
  has covered, so the feet do not slide; left is the mirror and the chest mark is never mirrored. He holds the
  stance he arrived in for a beat before facing us.
- **The creator** has four heads, beard or none, glasses or none, and no Body row; a hero saved before today
  still loads.
- **The intro**: pale blue pyjamas the same on everyone, the waist cut hidden under the blanket, the heap of
  clothes in his own colours.
- **`js/intro/timeline.js`**, the one file outside the brief's list, had to change (it imported the deleted
  side view) and changed only that.
- **Warp's ten calls** are sound. The one for Rick is below (the diagonal walk).

## Changed here

**1. The sheet is read from the file, not back from a canvas.** My brief told Warp to draw the sheet to a
canvas and read the codes off it. That is exact in the browser our tests use. It is not exact everywhere: Brave
by default, Firefox in a private window or in strict mode, and Safari in places change what a page reads back
from a canvas by a little, to stop sites fingerprinting the machine. For a photo that is invisible. The sheet is
codes, so a value that is off by one is a pixel of the wrong tone or the wrong part. With a stand-in for such a
browser (every third pixel's lowest bit flipped on read-back) a third of the hero's pixels came out wrong. The
game now reads the codes from the PNG's own bytes (`js/engine/png-codes.js`, 60 lines: the file's chunks, the
browser's own decompressor, the row filters undone) and no canvas is involved. A browser too old to do that
(before Safari 16.4) still uses the canvas; those browsers do not alter it. Tests: the reader against the real
sheet and against a picture written by another encoder with all five PNG filters; a browser test with the
stand-in above, which failed before and passes now; a browser test of the old-browser path.

**Not proven on those browsers themselves.** I have none of them here. The stand-in shows the old way breaks
under such a guard and the new way cannot be touched by one, because it never asks a canvas for anything.

**2. Pale specks on his outline are gone.** Enlarged on a dark ground, every figure had light grey pixels
scattered along its edge, from three to a dozen or more, different ones in each walk frame. The cause was in my asset build: an
outline pixel a little lighter than usual was lifted toward white, the way a highlight on cloth is. An outline
has no highlights; it is now the outline colour scaled and always dark. Only the manifest's outline ramp
changed, not the sheet. A test holds every outline tone dark.

**3. The afro is smaller.** Rick, this morning: "Those afros are way too large. Shrink those if possible." The
build now cuts the painted hair to 78 % of its size about the middle of his skull (`HAIR_SCALE` in
`tools/build_hero_painted.py`). Nothing is drawn: every hair pixel is one of the painting's. The face, the neck
and everything below are the painting's own, pixel for pixel; the hair never leaves his skull bare; and it gets
the same one-pixel outline round its new edge. He now stands three rows above short hair, where the afro stood
six. Front, side and back are in `afro-before-and-after.png`, sent to Rick. If 78 % is not small enough it is
one number.

**4. The code-drawn hero's generator is retired**: `tools/hero_gen.py` and its tests, as brief 15 said. The
README and the backlog no longer describe it.

Also: the tests that stated the sheet's size (506×253) now read it from the PNG's header, since the size is the
build's to choose and the smaller afro repacked the sheet (511×248). Brief 15, the spec and the asset log carry
a note at each thing that changed.

## Not changed, worth knowing

- **A walk that is more across than up is side on, however far up it goes** (Warp's call 2). The walk to room
  5's pinball machine is 67 across and 57 up, so he goes there in profile. A bias toward the away walk on
  diagonals is one line if Rick wants it.
- **The tap marker draws over him when he walks away.** The little walking figure marks where he is headed;
  when that spot is behind him on screen it sits on his back for half a second. It should go behind him. Small,
  and not from this brief.
- **The chest mark loses pieces as he gets smaller**, as it did on the old hero: at the back of a room it is
  a few coloured pixels. Whole rows and columns are dropped, and the mark is nine pixels wide.
- **He casts no shadow.** The personas stand on a soft shadow painted into the room; he does not. It did not
  stand out to me, and it is the same as before.

## For Rick's eye

1. The afro at its new size (`afro-before-and-after.png`).
2. On the preview: the hero walking in a dark room (room 4 is the darkest). His edge should be clean.
3. If you or anyone at Honeycomb uses Brave, or Firefox in a private window: open the preview there and look at
   the hero. He should look exactly as he does in Chrome or Safari.
4. The walk to the pinball machine in room 5: is side on right, or should a diagonal like that show his back?

## Next

Nothing is waiting for Warp or Art Claude from me. Still open with Rick, from earlier: a hand edit of the weak
walk frame, the mohawk's sides in hair colour, a second creator build, which screens go into the menu design
pass, the phone checklist in `handbacks/2026-11-15-cloud-phone-shell-review.md`.
