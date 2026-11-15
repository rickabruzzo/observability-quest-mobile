# Hand-back: Warp brief 14 — the feedback art goes into the game

Branch `warp/feedback-art` from `origin/era-look` (at `dd162f9`, which carries section G's marks); pull request against
`era-look`. No art drawn, rebuilt or moved: everything is placed by the brief's numbers from `assets/rooms/` and
`assets/marks/`. Brief 13 (`warp/phone-shell`, PR #27) is a separate branch; this one does not depend on it.

## A. How a painter reaches the art

`js/screens/chapter.js` exports `makeArt(loaded)`: `art.image(name)` is the loaded picture or undefined; `art.draw(g, sprite,
x, y, { flip })` draws the sprite's box from its sheet (the manifest's `sprites` map) with its top-left at (x, y), mirrored
about its own centre when `flip`; nothing loaded or no such sprite draws nothing and never throws. The wall painters get it
as `s.art`; an old tool's `paint(g, { art, t, reduced, text })` gets it too, with `t` the ms the tool screen has been open
(`toolT`, reset on `openTool`, in `window.__oq.chapter.toolT`). An old tool is redrawn every 100 ms unless reduced motion,
so room 4's phone can ring. The manifest loader is untouched.

## B. Room 2: theories on the board itself

`js/chapters/ch2.js`: `image` is `R2_board`, `fixedImage` `R2_board_wiped`; `close.sheet` is gone; new `close.board` (the
whole board, the tap target: it equals `close.screen`, so a tap on the frame goes back to the room), `close.theory` (the
clean corner), `close.band` (the two boxes in the wiped band) and `close.arrowFrom` ([261, 136]).

`js/chapters/ch2-wall.js`: `THEORIES` (the six rings and their `???` positions, as the brief's table), `current(s)`,
`ringsShown(s)` (1 to the current one; six for good once `nudges.length >= 5`), `arrow(s)` (from the words to the current
ring's nearest edge along the line to the words, stopping 2 px short, with a 5-px two-stroke head turned ±30° back toward
the words) and `boardMarks(s)` for the tests. The marker is `#C81E1E`, 1 px, the `???` in `font5x7` at scale 1. The text
before the fix is one box `theory` (two lines, `wrap: true`, so the rest of the words wrap at spaces inside it, CSS
`.wall-box.theory`, 17 px × the UI scale, the same red); after the fix `band1` and `band2` (`.wall-box.band`, `#1E2A5A`,
24 px × the UI scale). The room is unchanged. `.wall-box.sheet` is gone from the CSS.

## C. Room 3: the shop sells things

`js/chapters/ch3-wall.js` exports `visit(s)` → `{ phase, product, progress }`: from `tAll` in a 14 000 ms loop, `browse`
(ukulele, banjo, acoustic, bass at 1 100 ms each), `cart` (4 400–4 999 ms, the southpaw, the bar running 0 → 13 %), `stuck`
(the southpaw at 13 % with the spinner); fixed is `order` (the bar filling over `RECOVER_MS`); reduced motion is `stuck`.
The painter exposes it as `frame(s)` so `window.__oq.chapter.wall.frame` says what is on the page. The guitar from
rectangles is gone, close up and in the room. Close up the product sprite goes at `close.picture` (62, 63); the header
box is filled `#8C3A1C` with `ch3.wall.shop` in `#F4E9D0` while browsing (`.wall-box.page.shop`), else the bar as before;
the words beside the picture are the new box `tag` at (126–181, 97–135): the product's name and price (the price line in
the shop's colour, `.wall-box.page.tag .fit:nth-child(2)`), or the cart's line split at " / ". `close.cart` is gone. Each
small box gets a 3-px tab inside its left edge, `#C0392B` broken, `#2E9A3A` fixed. In the room the small sprite goes at
`room.picture` (113, 45), the thin bar is the shop's colour while browsing. The tint is drawn first, under everything.
`frameKey` carries the phase, the product and the rounded progress.

I checked the sheet: no product has an opaque pixel inside the tag's corner (the brief is right).

## D. Room 4: the battle

`js/chapters/ch4-wall.js` exports `cast(s, area, { small })` → `[{ sprite, x, y, flip, stuck }]` (top-lefts; every box
inside the area, clamped), and the painter draws exactly that list, clipped to the map, through `art.draw`; `dot` and
`tick` are the painter's own pixels (1×1 `#DCE8FF`, 3×1 `#FF6A4A`). `DIMS` holds every sprite's size so the cast is data
without the manifest. The choreography:

- **The gate** (`gateAt`): x at 78 % of the map's width, y at half its height, the 23×23 sprite centred there.
- **Ours** (`OURS`, nine lanes: one big, three mid, five small): each lane has a height (a share of the map), a run time
  (big 9 000 ms, mids 5 800–6 400, smalls 3 800–4 600), a phase and a firing interval (900/700/500 ms). A ship starts at the
  left edge at its lane's height and flies to the gate, converging on it quadratically (it holds its lane, then bends in).
  A clean run ends in `warp_1`–`3` at the gate (90 ms a frame) and a 400 ms gap before the lane's next ship. One run in
  three (one in five for the big one) is cut short by a hit, between a quarter and six tenths of the way across (always
  well left of the gate and the stuck arc): `boom_1`–`4` at the ship's spot, then 500 ms gone, then the next ship from the
  left edge. Runs follow one another from `tAll + phase`, so the picture is a pure function of the state.
- **Theirs** (`THEIRS`, six: one big, two mid, three small), drawn flipped: each comes in at the right edge at `from` (a
  share of the height, above or below the gate) and flies straight to the left edge at `to`, crossing our lanes (runs
  8 000 / 5 200–5 600 / 2 200–4 400 ms). One in three runs is cut by a hit after they have crossed past the gate (55–89 %
  of the way). The small one at `from 0.96 → to 0.45` is **shot on every run** at 60 % (a 2 180 ms cycle), so no two
  seconds ever pass without a boom; the others add theirs on top.
- **Fire**: ours fire a `bolt` every lane interval (offset 40 % in), 110 px/s, alive 420 ms; theirs a `missile`
  (flipped), 80 px/s, 520 ms. A shot that would leave the map is not drawn.
- **The stuck ones** (`STUCK_ONES`): an arc at (−30, −18) mid, (−34, −6), (−34, +8), (−30, +20) small, from the gate's
  centre. Each jitters 0 or 1 px per axis per 100 ms step (so never more than a pixel between steps), flashes `warp_1`
  alone for 90 ms every 1 500 ms (offset 370 ms each), and has a 3×1 tick 3 px above it blinking 300 ms on, 300 off. They
  are never in the hit schedule, and hits are kept left of them.
- **The fix**: stuck `i` goes in at `i × 375` ms (`RECOVER_MS / 4`) with the full `warp_1`–`3` at the gate; the last is in
  at 1 395 ms and `recovered` is `t ≥ RECOVER_MS` (1 500). Then nobody waits.
- **The far fleet**: 120 dots, each on its own ray from the map's edge to the gate, drifting in at its own speed and phase.
- **The room** uses the same cast with every ship small. **Reduced motion**: `tAll` is taken as 0, no shots or booms, the
  four at the gate while broken, gone once fixed.

Close up `art.draw(g, 'mark_doggy_dashboards', 16, 167)` and the health line starts at x 38; the room's line is unchanged.

## E. Room 4: the phone

`js/chapters/ch4.js`: `PHONE` (the brief's areas on the plate), `paintOld(g, { art, t, reduced, text })` draws the plate's
`TOOL_PIC` box into the same box (clipped), keeps the frame, writes `ch4.old.phone.name` and `ch4.old.phone.line` centred
on their bars in `font5x7` scale 1 in `#2B2F36` (`barTextAt`), and rings: `phoneRings(t)` gives two 1-px rings round
(97, 160) growing 12 → 20 px over 1 200 ms, one starting every 600 ms, fading in three alpha steps (1, 0.66, 0.33); the
name's bar blinks `#D6F5DC` 300 ms on, 300 off. Reduced motion: one still ring at 14, no blink. No plate: the old
rectangles (`paintOldFallback`).

## F. Two things left over

1. **The verdict portrait's right edge.** `verdictLayout()` in `chapter.js` keeps `portraitLayout`'s crop (the face
   centred in the left 45 %) and adds `fullSw`/`fullDw`: the source and drawn widths through to the picture's own right
   edge; `paintPortrait` draws those, and the window keeps its place (so it sits over the picture). Charity's `<img>` on
   Claim keeps its natural proportions at 86 % height; `charity.js` sets its `left` from the same `portraitLayout` so her
   face is centred in the left 45 %, and `.charity` clips at the scene's edge. `js/engine/verdict.js` is untouched.
2. **The mark is never mirrored.** `paintRoom` draws the front view with `flip: false` always; the side view flips as
   before. Nothing else about his drawing changed.

## G. The old tools wear their marks

`tools.old.mark` is `'cave_logs'`, `'old_artifact'`, `'pretty_good_metrics'` in scenarios 1–3; absent in 4 and 5.
`chapter.js` loads the mark with the chapter's art (`loadMark`, on `enter`); the title bar is now
`<div class="tool-title"><img class="tool-mark" alt=""><span class="tool-title-text">…</span></div>` and the workstation's
old-tool button gets `<img class="pc-mark" alt="">` before its words; both `image-rendering: auto`. A mark that fails
to load (then or later) is removed and the words stay. CSS: `.tool-mark` 80 % of the bar tall with a right margin of a
third of that (`calc(max(24px, 0.09 * var(--scene-h)) * 0.8 / 3)`); `.pc-mark` 28 px × the UI scale.

**One file outside the brief's list changed: `js/chapters/ch1.js`**, one token, `mark: 'cave_logs'` on its old tool.
Section G needs it and the file list predates section G. Nothing else in it moved.

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **352 passed** (337 on `era-look` before this branch; +15 in `tests/feedback-art.test.js`) |
| `python3 -m pytest tools/tests -q` (scratch venv, as in earlier briefs: `pytest` is not installed for the Mac's Python) | **147 passed** (unchanged) |
| `npm run e2e` | **133 passed** (125 on `era-look` before; +8 in `tests/e2e/feedback-art.test.js`) |

## Tests rewritten to the new behaviour (none deleted)

- `tests/wall-painters.test.js`, "scenario 2: the sheet carries one theory at a time…" → "the theories go on the board
  itself in red marker; after the fix the close-up is the wiped board and the room gets the path": the one text box is now
  `theory` at (262–304, 128–186) with `wrap`, the fixed state is the two `band` boxes, the images are `R2_board` /
  `R2_board_wiped`, the hit area is the whole board, `close.sheet` is gone; the room's path checks are as they were;
  fixed close-up draws nothing, broken draws the marker.
- `tests/e2e/chapter.test.js`, the two "the verdict is laid out for a phone on its side" tests: `litRight < 0.05` (black
  right of the portrait) became: `fullDw > dw`; every column between the face's 45 % and the window is lit (no vertical
  cut), nothing is lit past the picture's own right edge; the window is wholly right of the face's 45 %.
- `tests/e2e/menu.test.js`, "Claim: Charity's portrait…": "about 45 % wide" became: her picture is at its own
  proportions, its crop starts at or left of the scene's edge, it runs past the 45 % line, the window is wholly right of
  the 45 % line, the layer clips.
- Room 3's "the TV's page tints as one piece" and room 4's "the chat column scrolls beside the SRE" pass unchanged (room
  3's sample points were already outside the picture).

New: `tests/feedback-art.test.js` (15 unit tests: `art.draw`, the manifests' sprite sizes, room 2's rings/arrow/accumulation,
room 3's schedule and drawing, room 4's gate/stuck/inside/fleets/booms/reduced/painter, the phone, the marks) and
`tests/e2e/feedback-art.test.js` (8 browser tests: room 2 at both sizes, room 3, room 4, the marks at both sizes, a
404 mark, the hero's facing).

## Calls I made

1. **`close.board` equals `close.screen`** (13–307 × 25–191: the board fills the plate to its frame), so a tap anywhere on
   the board steps the theory and a tap on the frame or wall goes back. Cost: none visible; the e2e "off the glass" tap at
   y 197 still returns to the room.
2. **The arrow's head** is two 5-px strokes turned ±30° back toward the words; the tip is 2 px outside the ring along the
   line from the ring's centre to the words.
3. **The battle's numbers** (above) are mine; the brief fixed only the gate, the fleets' sizes, the stuck arc's rules and
   the frame rate. Hits are kept to the left side of the map so a boom never lands beside the stuck arc and reads as one
   of them being shot.
4. **Reduced motion takes `tAll` as 0** for the battle (a still), with the stuck ticks on.
5. **Dots and ticks are in the cast** as `dot` and `tick` items (the painter draws exactly the list); they are not in the
   manifest, so `DIMS` gives their sizes.
6. **Room 3's small sprite at (113, 45)** as the brief says: it stands 1 px above and 2 px below `room.large`
   (46–80) but inside the TV's screen and clear of the lane and boxes. Left as given.
7. **The wall text layer now re-lays its boxes when a box's class or area changes**, not only when their number does:
   room 3's header changes class between browsing and ordering. Before this the header kept the shop's pale colour over
   the progress bar.
8. **The marks' button image is inline** (`vertical-align: middle`) rather than making `.pc-item` a flex box, so the
   existing button layout and its tests hold; "[Open Cave Logs]" wraps to two lines beside its mark at 844×390 and stays
   inside its button.
9. **The 404 mark test aborts the request** rather than serving a 404 body; the result for the page is the same (an
   `error` event).

## Screenshots (844×390), in `scratch/feedback-art/` (git-ignored, copied to the main folder's `scratch/`)

`board-three-theories.png`, `board-wiped.png`, `shop-banjo.png`, `shop-southpaw-stuck.png`, `shop-room.png`,
`battle-room.png`, `battle-broken.png`, `battle-just-fixed.png`, `phone-ringing.png`, `cave-logs-title.png`,
`cave-logs-button.png`.

## For Cloud Claude

- `R2_wall_closeup` and `R2_wall_closeup_fixed` stay in `ch2.json` and are still loaded; nothing references them now.
- `js/chapters/ch1.js` (above) is the one change outside the list.
