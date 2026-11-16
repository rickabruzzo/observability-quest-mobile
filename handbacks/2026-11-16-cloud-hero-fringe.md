# Cloud Claude — the fringe round his legs and feet, and a perspective check (2026-11-16)

Rick, on the merged painted hero: "Seeing fringe around the legs and feet. I can clean it up in PS and save out
a PNG/Webp if thats easier." It was easier to fix in the build, because the cause was how the build read the
paintings, and a fix there holds for all thirteen bodies. `desktop/hero-fringe` is `era-look` (59c33ea) with one
commit on top. Asset build only: no game code changed.

## What the fringe was

Two things, both at his feet.

- **The outline round the shoes is a dark grey in the paintings**, a little lighter than the line my build drew
  between "outline" and "grey". Taken for grey, it was painted at its own lightness: a mid grey line round his
  shoes and a few grey pixels sticking out at his ankles. On a dark floor that reads as fringe.
- **The soles were painted in the background's yellow**, each shut in between the shoe and its outline. The
  build took every yellow pixel for background, so each sole was a slit you could see the floor through, with
  the sole's own outline hanging under the shoe as a separate grey line.

## What the build does now (`tools/build_hero_painted.py`)

- A neutral pixel darker than 0.33 is outline (`OUTLINE_BELOW`; it was 0.25). Between the outline's darks and
  the shoes' own grey the paintings have next to nothing, so the line sits in that gap.
- A pixel shared evenly by shoe and outline is outline, and so is a grey pixel on his silhouette that came out
  as dark as a line when the figure was made smaller.
- A patch of the background's colour that cannot reach the outside and has only shoe and outline round it is
  the sole: grey, a little lighter than the shoe above it (`SOLE`). A gap between his legs or under his arm has
  cloth round it and stays a gap.

**What changed in the sheet:** legs and feet only. No head, beard or glasses piece changed by a single pixel.
Above his waist nothing changed; between waist and shins, a few single stray pixels per body became outline.
`legs-and-feet-before-and-after.png` (sent to Rick) shows the standing figure and the long stride.

**His pace is pinned.** The side walk's 13.5 px a frame was measured from the shoes' grey pixels, and re-sorting
them moved the measurement to 13.8, which would have changed how fast he walks and where his feet land. The
approved number is now a constant (`ADVANCE`), and a test keeps the measurement within half a pixel of it.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `era-look` (59c33ea) | 380 | 128 | 162 |
| `desktop/hero-fringe` | 380 | 133 | 162 |

Five new Python tests: a dark grey line is outline; shoe and outline evenly is outline; a sole is a sole and a
gap is a gap; on every body no shoe has a slit and no dark grey sits on his silhouette; his pace is 13.5.

## The perspective check

Rick: "we will have to check the perspective to see if their size change feels normal relative to how closer
to the VP they are moving too."

**The rule is the right one.** His height is in proportion to how far his feet are below the room's horizon,
which is what perspective does to a figure standing on a flat floor. Lines through his head and through his
feet at any depths meet on that horizon.

**The horizons are close to the paintings', not exact.** Each room's horizon is a number in its chapter file:
y 40 in rooms 1 to 4 (a default, never measured), y 31 in room 5 (worked out from two heights in the picture).
What the paintings' own receding lines say, where I could measure them:

| Room | The game's horizon | The painting's | How measured |
|---|---|---|---|
| 5 | y 31 | y 41 | the coffee table's four edges (top and feet) meet at (185, 41); well conditioned |
| 4 | y 40 | about y 24 | the two side walls' floor lines meet at about (157, 24); short lines, give or take 8 |
| 1 | y 40 | about y 50 | a cubicle edge against a desk edge; rough |
| 2, 3 | y 40 | not measured | the same furniture as rooms 1 and 4; no long receding lines of their own |

Ten pixels of horizon is about 4 % of his height at the back of a room and nothing at the front. In room 5 he
is 74 px tall at the back wall; by the table's vanishing point he would be 71. `room-5-perspective-check.png`
(sent to Rick) shows him at three depths with both sets of lines.

**Not changed.** Whether 3 px at the back of room 5 matters is Rick's eye to say. Moving a room's horizon is
one number in `js/chapters/chN.js`.
