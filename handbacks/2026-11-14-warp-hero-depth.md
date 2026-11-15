# Hand-back: Warp brief 11 — the hero's size and depth (2026-11-14)

Branch `warp/hero-depth`, pull request against `era-look`, **stacked on brief 12** (`warp/feedback-fixes`, #21),
as the brief says to do when 12 is not yet merged; the diff shrinks to this brief's once #21 merges. The figure is
untouched (section A): the 56×144 canvas and the 136-px figure at scale 1 are as brief 09 left them, and nothing
here depends on how he is drawn.

## B. Depth

**The engine.** `js/engine/room.js`: a room's `floor` is a polygon of where his feet may be; `insideFloor`,
`nearestFloorPoint` (a tap off the floor goes to the nearest point of it), `segmentOnFloor` and `planPath` (a
straight line when it stays on the floor, otherwise the shortest route through the floor's corners — a visibility
graph over the polygon's vertices with Dijkstra, by hand); `heroHeightAt` / `heroScaleAt` (linear in his feet's y,
zero at the horizon: one anchor plus `horizonY`, or two anchors, which fix the horizon themselves); `frontsOver`
(the plate pieces whose base line is nearer than his feet); `checkRoom` now wants a floor, an anchor, a start and
stand points on the floor. `js/engine/walk.js`: a walk is the path's legs; **his speed in scene px on each leg is
`WALK_SPEED × his scale` there**, and the frame comes from the ground covered in his own pixels, so the stride
matches the floor whether he is near or far. The one-dimensional form (`planWalk(x0, x1)`) still works for the
preview room and the old tests.

**The screen** (`js/screens/chapter.js`): his position is his feet's centre `{ x, y }`; the sprite is drawn at
`heroScaleAt(room, y)` with its feet on y; after him, every front whose base line he is above is redrawn from the
plate, clipped to its polygon. A tap on bare floor walks him to that point (or the nearest floor point); a tap on
a thing walks him to its stand point. `window.__oq.chapter` exposes `y` and `heroBox` ({ x, y, w, h, scale }) for
the tests.

**The rooms.** Floors traced from the plates on a 10-px grid (`scratch/depth/*_grid.png` in this worktree);
anchors are the brief's; the horizon is y 40 for rooms 1–4 and 31.3 for room 5 (its two anchors fix it: the
brief's "about 38" came out at 31 by the arithmetic, and I kept the anchors rather than the estimate).

| Room | Floor polygon (feet, scene px) | Anchor(s) | His height at the front (y 199) · at the back | Fronts |
|---|---|---|---|---|
| 1 | (136,135) (204,135) (204,186) (319,186) (319,199) (0,199) (0,186) (136,186) | 108 @ 182, horizon 40 | 121 · 72 @ 135 | none |
| 2 | (135,138) (260,138) (260,186) (319,186) (319,199) (0,199) (0,186) (135,186) | 115 @ 170, horizon 40 | 141 · 87 @ 138 | none |
| 3 | (101,135) (187,135) (187,160) (214,160) (214,186) (319,186) (319,199) (0,199) (0,186) (101,186) | 119 @ 180, horizon 40 | 135 · 81 @ 135 | none |
| 4 | (136,140) (204,140) (204,186) (319,186) (319,199) (0,199) (0,186) (136,186) | 95 @ 172, horizon 40 | 114 · 72 @ 140 | none |
| 5 | (115,128) (248,128) (248,138) (232,138) (232,199) (115,199) | 130 @ 195 and 76 @ 127 (horizon 31.3) | 133 · 77 @ 128 | the couch's left arm, (232,118)–(251,162), base y 160 |

The strip across the front (below y 186) is floor in rooms 1–4; in room 5 the coffee table and the couch take it,
so the floor is the middle of the atrium plus the way through to the pinball machine at the back right.

**Stand points and starts** (feet; the hero was at a left edge before, so these are new numbers, not nudges):

| Room | Computer | Persona | Other things | Start |
|---|---|---|---|---|
| 1 | (101, 188) | (176, 186) | — | (70, 194) in front of the cubicle |
| 2 | (110, 188) | (206, 180) | — | (80, 194) |
| 3 | (262, 190) | (158, 182) | guitar (200, 172); sign (278, 190) | (246, 196) in front of the laptop desk |
| 4 | (109, 190) | (176, 186) | — | (164, 194) |
| 5 | (130, 186), the table's right end | (180, 190) | pinball (238, 134) | (164, 196) |

The guitar, the sign and the pinball machine now have stand points and he walks to them before their lines; the
wall display keeps `walk: false`. **The pinball machine** (the acceptance case): tapped, he walks up the atrium
getting smaller, passes behind the couch's arm, stops in front of the machine at 82 px under its backglass, and
`ch5.look.pinball` plays (`scratch/shots/room5-pinball.png`).

**Where he starts.** Rooms 1–3: on bare floor covering neither the wall display nor the persona (asserted).
Rooms 4 and 5: the wall display spans the floor's whole width (the wall of space is x 30–290; the atrium monitor
x 115–204 over a floor of x 115–232), so **no floor point keeps a figure of his height clear of it**; he starts
clear of the persona, and the e2e asserts the wall only for rooms 1–3. If Rick wants him clear in 4 and 5 too,
the start would have to be off the floor or the floor would have to reach past the wall's edge.

## C. The intro's bedroom

- **Legs.** He sits ten pixels into the bed (`sitY` 143 against the plate's blanket line 131, data on the bedroom
  shot in `js/intro/timeline.js`) and the game draws the blanket over his hips and rising over his legs toward the
  foot of the bed: a shape in the blanket's own colours read from the plate (its lit top, its base, its shade),
  with a lit ridge and a shaded fold (`drawBlanket` in `js/screens/intro.js`). `scratch/shots/bedroom-sitting.png`.
- **The subtitle.** He now stands at the front of the room (`standY` 196; the manifest's floor line 178 stays
  for everything else), still at the door's scale (0.85: 116 px against the 132-px door), so his hair clears "So
  you want to be on-call?" by two pixels standing and sitting. The walk out runs from y 196 up to the door's
  threshold as before. Moving the subtitle was the other option; the logo sits right above it, so there was
  nowhere for it to go.

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **326 passed** (`tests/depth.test.js`: scale from y, inside the floor, nearest floor point, paths that never leave the floor, fronts, the checker, the walk in two dimensions, the one-dimensional form) |
| `python3 -m pytest tools/tests -q` | **126 passed** |
| `npm run e2e`, one file at a time | **124 passed**: chapter 33, scenarios 30 (6 new), intro 18 (1 new), menu 7, creator 14, walk-preview 9, shell 9, weight 4 |

New e2e: in every scenario, at the persona's stand point his drawn height is the room's anchor within 2 px and his
feet are on the stand point, and at the start he covers neither the persona's patch nor (rooms 1–3) the wall
display and his feet are on the floor; in scenario 5 a tap on the pinball machine walks him there, shrinking on the
way, and shows its line; in the intro his box never meets the subtitle's box sitting or standing, and sitting, the
pixels below the plate's blanket line inside his columns are painted (his hips and the blanket).

## Numbers of the brief I changed, and why

- **Room 5's horizon is 31.3, not "about 38"**: two anchors (130 @ 195, 76 @ 127) fix it at
  195 − 130 / ((130 − 76) / (195 − 127)) = 31.3. I kept the anchors, which are measured, over the estimate.
- **Room 5's floor starts at y 128, not 130**, so the pinball stand point (238, 134) and the way through at
  (232–248, 128–138) are inside it.
- **Room 3's guitar is listed after the pc** as before; its stand point (200, 172) is in the floor's notch below
  the stand (y ≥ 160).
- **The bedroom's `sitY` 143 and `standY` 196** are new numbers (section C explains them); the plate's own lines
  (bed.y 131, floorY 178) are unchanged in the manifest.
- **Walk tests.** `tests/walk.test.js` is unchanged in meaning: its one-dimensional calls still run at scale 1, and
  the "a full room in a little over two seconds" figure holds for a flat floor. The two-dimensional rules are in
  `tests/depth.test.js`: speed follows scale (100 px along the front takes less time than 50 px at the back), and
  one eight-frame cycle per `STRIDE_PX × scale` scene px. `tests/room.test.js` lost `walkTarget`/`clampWalk`
  (gone with the floor line) for `nearestFloorPoint`.

## Screenshots

`scratch/shots/` in this worktree: `roomN-start.png`, `roomN-persona.png` (at the persona's stand point, the
options up), `roomN-back.png` (at the back of the floor), `room5-pinball.png`, `bedroom-sitting.png`,
`bedroom-standing.png`.

## Calls I made (and what each costs if wrong)

1. **Paths route through the polygon's corners pulled one pixel inward**, so a walk along an edge counts as on the
   floor; a tap off the floor is first brought to the nearest floor point. No pathfinding library.
2. **`WALK_SPEED` keeps its meaning as his speed at scale 1** (120 px/s); at the back of room 1 (scale 0.53) he
   moves at 64 scene px/s and still takes three steps a second.
3. **Fronts are plate pieces clipped by polygon**, redrawn whole over him; only room 5 needs one. If the art's
   couch arm edge disagrees with (232–251, 118–162), the rectangle is one line of data.
4. **The hero's box in the intro is the figure's own** (hair to soles), not the canvas's, for the subtitle test.
5. **`index.html` cache-bust** bumped (`css?v=19`, `js?v=30`), outside the brief's list as before.
6. `js/screens/creator.js` is untouched: the sheet shows the figure at scale 1, which the brief keeps.
