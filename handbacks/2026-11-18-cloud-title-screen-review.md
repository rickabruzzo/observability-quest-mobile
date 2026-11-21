# Cloud Claude review: Warp brief 16, the title screen (2026-11-18)

Reviewed `warp/title-screen` (a42f510, pull request #32): the hand-back, the whole diff, the suites, and the
screen in a browser at 844×390 and 667×375, with the clock held so each moment could be looked at.
`desktop/title-screen-review` is `era-look` (befd302) with Warp's branch merged in and three changes on top.
The merge was clean.

Warp's work is right, and it is the brief: the picture, the wordmark as two layers at the size Rick approved,
the stepped glow, the twinkling stars, the larger subtitle, the logo and the credit, the pager that goes off
on Start, reduced motion, and the lettered card when the art is missing.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/title-screen` as handed back | 409 | 141 | 168 |
| `desktop/title-screen-review` | 414 | 149 | 169 |

## What I looked at

- Both phone sizes, the whole page: the wordmark and glow where the manifest puts them; the subtitle one line,
  clear of the letters above and the nightstand below; the small print inside the dark stretch at bottom
  left; Start and Sound in their columns.
- The lit pager 30 ms after Start: the flat green screen, the stepped glow on the nightstand, Start disabled.
- The code: the timeline is pure and tested; the screen redraws only the stars that changed; nothing on the
  title can leave the player stuck (the creator opens 600 ms after the tap, past the 350 ms guard on screen
  changes).

## Changed here

**1. The glints.** Rick, this evening: "I asked for glints on the title." Warp built from the brief as it
stood before they were in it, so I added them: `glintAt` in `js/title/timeline.js` (four unit tests), one
element in the title's overlay showing one frame of `T_glint.png` at a time with its centre on the
manifest's place, a glint pixel the size of a letter pixel, and browser tests (a glint shows at its places in
all four frames, centred within a CSS pixel, whole inside the scene; none under reduced motion). Nine places,
one at a time, a pass every eight seconds.

**2. The merged tree failed one test before that**: `era-look` already had the glint's picture in the
title's manifest, Warp's loader fetches every picture the manifest names, and the page-weight test allows only
the files it lists. The glint's picture is now on that list. The boot is still under its 600 KB.

**3. The subtitle is a script slot**, `title.subtitle`, as Warp suggested. The title and the intro both read
it; neither keeps its own copy of the words. One test.

## Warp's calls

All sound. Two worth Rick knowing:

- **The credit's type never goes below 16 px.** On the smallest phone the scene is 346 px high, not the 355
  my brief assumed, so the brief's own number came out a hair under its own floor.
- **All of the title's pictures load together.** If any one fails, the lettered card shows. My brief asked
  for the title without glints if only the glint's picture failed; that is not built and is not worth a
  second path.

## For Rick's eye

1. On the preview, on a phone: the glints, the glow breathing, the subtitle's size, and Start (the pager
   lights, two beeps, then the creator). `title-screen-built.png` (sent) is the screen at 844×390 with a glint
   at its largest.
2. The font credit is on the title, as built. Moving it to Help or the ending, or swapping the font, is
   still open if you want it.
3. The Honeycomb logo is the 163×48 file and is a little soft on a phone. The official SVG or a large PNG
   would fix it.

## Next

Warp: brief 17 (the ending). Art Claude: brief 09 (the sunrise). Nothing else is waiting on me.
