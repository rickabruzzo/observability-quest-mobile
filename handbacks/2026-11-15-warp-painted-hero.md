# Hand-back: Warp brief 15 — the painted hero

Branch `warp/painted-hero` from `origin/era-look` (at `129d073`); pull request against `era-look`. **Brief 14
(`warp/feedback-art`, PR #28) is not on `era-look` yet.** Both change `js/screens/chapter.js`; the overlap is one line
(brief 14's `drawHero(…, { flip: false })` against this branch's `drawHero(g, hero, pose, x, y, scale, { flip, dy: bob })`),
and this branch's line is the right resolution: the painted front view never mirrors (brief 15 C), which is what brief
14's F.2 wanted. Whichever merges second will show that one conflict.

No pixel of the hero is drawn by code. Everything is placed from `assets/hero/hero.json` and `hero.png`.

## What I built

**`js/engine/hero.js`** (rewritten): the sheet (`setHeroSheet`, `loadHero`, `heroReady`), the figure (`composeFigure`,
`composeProp`, `silhouette`, `bodyFor`), drawn smaller (`scaleFigure`, `evenLines`, `blit`), placed by his feet
(`placeHero`, `drawHero`), and the creator's two pictures (`drawPreview`, `drawHeadThumb`, with `PREVIEW` 56×148 and
`THUMB` 40×44 from (ax − 20, ay − 36)). `HERO_W`/`HERO_H` stay 56×144: the nominal canvas the rooms scale by
(`heroScaleAt` is untouched; the painted figure stands 136 rows on it, as the brief says not to correct).

- `loadHero()` fetches the manifest, draws the PNG to a canvas and keeps every fourth byte (the red channel; the PNG is
  a greyscale palette, so the code survives the canvas). Never throws; resolves false and the game draws no hero.
- `composeFigure(cfg, body, outfit, { mark })`: the body, `heads[style][view]`, the beard and the glasses when he has
  them and the view shows them, stacked anchor on anchor (0 leaves, 255 clears, else replaces); each code looked up in
  the six ramps (`pj.top`/`pj.bottom` for the first two in pyjamas); the Honeycomb mark's 32 pixels at
  `(ax + mark.dx + mx, ay + mark.dy + my)` on `mark.bodies` in the hoodie only. `mark: false` is what the fixtures are.
  Figures are kept per look and body (96), scaled copies per figure by size and flip (48).
- `scaleFigure(fig, scale, flip)`: whole rows and columns, evenly spaced, slid over 20 offsets; the last row must be
  kept; each eye row and each eye column kept scores 10 000; otherwise colour changes. Never above 1. `flip` mirrors
  the result and the anchor's column with it. The scaled anchor is the destination line the anchor's line landed on.
- `placeHero`: the anchor's column on `feetX`, the last row the row above `feetY` (so `box.y + box.h` is the floor
  line, as every room and test already counts it), `dy` × scale rounded; side bodies mirror when asked, front and back
  never. Returns the drawn box with `ax`, `ay`, `scale`, `fig`.

**`js/engine/walk.js`**: `WALKS` (the manifest's three walks; `tests/walk.test.js` holds the two equal), `ADVANCE`
13.5, `walkKind(p, q)` (further across than up or down → `side`, else `toward`/`away`), `walkFrame(kind, ground)`.
`planWalk` gives each leg its kind; `stepWalk` returns the frame's body as `pose`, its `dy`, and `view` `side`/`front`/
`back`; on arrival the stance is held `SETTLE_MS`: `stand` after a side walk, `back` after walking away, `idle` after
walking toward. `STRIDE_PX` and the eight-frame tables are gone.

**`js/engine/hero-parts.js`**: `OPTIONS` without `body`, `style` `['standard', 'long', 'fro', 'mohawk']`, `beard`
`['none', 'short']`; `DEFAULT_HERO` (today's masc preset without `body`); `MIGRATE`; the colour tables untouched (the
Python test reads them). `PRESETS`, `BODIES`, `WALK`, `SIDE_*`, `EYES`, `DRAWSTRINGS`, `HC_MARK_AT`, `PJ`, `SIT_*` gone.

**`js/creator-state.js`**: no Body row, no presets; `sanitizeHero` maps `shoulder → long`, a `long` beard → `short`,
drops `body`. **`js/screens/creator.js`**: `drawPreview` on a 56×148 canvas, `drawHeadThumb` thumbnails; if the sheet
is not in when the creator opens it draws once the load settles. **`js/screens/chapter.js`**: draws from his feet with
the frame's `dy`; `heroBox` is the drawn box (`x, y, w, h, ax, ay, scale, body`; a nominal box without the sheet);
`window.__oq.chapter` gains `pose` and `flip`. **`js/screens/preview.js`** likewise (x stays the sprite's left edge
there). **`js/screens/intro.js`**: `pj_front`/`pj_sit` in the pyjama ramps; `pj_sit`'s last row on `sitY` with the
plate's blanket drawn back over him from the blanket line (the cut never shows); the heap is `props.clothes` in his
ramps at his scale, centred and bottomed where the drawn heap's were; the flash is the figure's silhouette. **`js/game.js`**
starts `loadHero()` at boot (`ctx.heroLoading`, `ctx.heroReady`); the title does not wait.

**Deleted:** `js/engine/hero-side.js`, `tests/hero-side.test.js`, `tests/fixtures/hero/`, `tests/fixtures/hero-side/`,
the composing half of `hero.js`, the drawing tables of `hero-parts.js`, `drawSilhouette`/`drawClothes`' rectangles and
the opaque-row helpers in `intro.js`.

**One file outside the list changed: `js/intro/timeline.js`.** It imported `SIDE_POSES` from the deleted module and
`STRIDE_PX` from `walk.js`; `exitAt` now takes its frame from `walkFrame('side', px / heroScale)` (body and `dy`),
`stand` at the door as before. The way out stays side on.

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **359 passed** (361 on `era-look` before: the side view's 25 and the old hero's fixtures went, the painted hero's came) |
| `python3 -m pytest tools/tests -q` (the main folder's `scratch/venv`) | **165 passed** (unchanged) |
| `npm run e2e` | **149 passed** (139 on `era-look` before; +10 in `tests/e2e/painted-hero.test.js`) |

## Tests rewritten to the painted hero (none deleted except the side view's, with its module)

- `tests/hero.test.js`: the ten fixtures byte for byte with `w, h, ax, ay`; the sheet installed from `sheet.codes`;
  every body's last row is the body's; the mark on the three bodies and nowhere else nor in pyjamas; `bodyFor`;
  every option composes; pyjamas the same on everyone; `placeHero` (anchor, last row, `dy`, no mirror front, mirror
  side, never above 1); `drawHero`/`drawPreview`/`drawHeadThumb`/`silhouette`/the heap; nothing without the sheet.
- `tests/hero-scaling.test.js`: front and side with each head at 0.6, 0.7, 0.8, 0.9, 0.95: last row kept, each pupil's
  pixel kept at its row and column, every pixel the figure's own, `flip` the mirror; `evenLines`; the scaled anchor;
  the twelve room sizes stand on their last row.
- `tests/walk.test.js`: the table equals the manifest's; the kinds for right, left, toward, away (equal across and up
  is not a side walk); the frame after 0, 13.4, 13.5, 27, 54 px in all three walks with `dy`; feet do not slide; left
  is the mirror; the settle holds `stand` / `back` / `idle`.
- `tests/creator-state.test.js`: the options, the default, `pick` refusing `body`, `randomHero` rolling only what
  exists, the migration (shoulder, long beard, body).
- `tests/depth.test.js`: the frame names (`walk_contact`, `away_l`), `ADVANCE × 4` for the stride, `back` held.
- `tests/intro-timeline.test.js`: the side walk's bodies and `ADVANCE`.
- `tests/e2e/creator.test.js`: four FACE rows and no Body row (15 options); the 56×148 preview; `beard: none`; Random
  rolls only what exists; the migration of a stored hero; the desktop frame at 56/148.
- `tests/e2e/walk-preview.test.js`, `tests/e2e/intro.test.js`: the pose regex is the four side bodies; the intro's
  "clothes are still on the floor" sample box moved to where the painted heap lies (centred 43 px right of the
  manifest's x, 30 × 20 at 0.85), since the old box sampled the left of the old, wider drawn heap.
- `tests/e2e/weight.test.js`: `assets/hero/hero.json` and `hero.png` (12 KB and 30 KB) are boot requests now, so
  they are in the allowed list and the boot budget (still under 600 KB).
- `tests/e2e/chapter.test.js`: the CTO's window ends above his shoulders, taken as the figure's anchor (the neck) + 6
  rows at his depth, instead of the old sprite's row 44.
- `tests/e2e/scenarios.test.js`: at the persona's stand point his drawn height is the painted figure's at the room's
  scale (136 × `heroScaleAt`) within 1 px, not the anchor's 144-row height.

New: `tests/e2e/painted-hero.test.js` (10): the page's codes equal `sheet.codes`; the creator (no Body row, the preview
changes with every option, thumbnails differ, Random and Start); nothing overflows at the three sizes; a room walk
(the four side bodies in order, mirrored left, facing us at the end, `heroBox` the drawn pixels, soles on the floor
row); the mark on his chest and the same pixels after a walk left or right; room 5 away frames and `back`; the intro
(pale blue pyjamas, nothing below the blanket line, standing in pyjamas, the heap in his colours, then dressed); the
game with `hero.png` blocked.

## Calls I made

1. **The last row is the row above the floor y** (`box.y + box.h === y`), as every room, `heroScaleAt` and the existing
   tests count a floor line. Reading the brief's "its last row on that y" literally would have moved him down a pixel
   everywhere and changed every depth test for nothing visible.
2. **The pinball machine's walk is a side walk.** Its one leg is 67 across and 57 up; by the brief's own rule (further
   across than up) that is side on, so the browser test for the away frames walks him straight up the room instead.
   If Rick wants diagonal legs like this one to read as walking away, `walkKind` wants a bias (e.g. side only when
   `|dx| > 1.5 |dy|`); one line, and the tests say which legs change.
3. **Equal across and up is `toward`/`away`**, not side.
4. **`toward` arrives without a held stance** (he is already facing us); `away` holds `back` for `SETTLE_MS`.
5. **`pose` carries the body's name** (`walk_contact` …) rather than frame numbers; `stand`, `back`, `idle`, `situp`
   are the states table C names, and `bodyFor` maps them.
6. **The heap keeps `drawClothes(g, cfg, x, y, k)`'s signature** so the intro's call is unchanged: the new heap is
   drawn at `k / 2` (the old shapes were sized for a 28-px hero) with its centre and bottom where the old heap's were.
7. **The creator's CTO-window test** uses the anchor + 6 rows for "his shoulders"; the old test used a row of the
   drawn sprite that no longer exists.
8. **An unknown style or colour falls back to the default's**, so an odd saved hero still draws.
9. **The e2e room tests avoid tapping where his box would leave the canvas** (he can stand at x 10 with a 39-px figure).
10. **Sitting up, his last row is on `sitY + 1`, one row below the brief's `sitY`.** The painted sitting figure is a row
    taller than the old one (hair to waist, 81 rows at 0.85), and on `sitY` his hair's top row met the subtitle's box,
    which brief 11's test forbids. `sitY` lives in `js/intro/timeline.js`'s shot data (not mine); one row down is
    invisible and the blanket still covers the cut. Cost if wrong: one pixel.

## Screenshots (844×390), in `scratch/painted-hero/` (git-ignored; copied to the main folder's `scratch/`)

`creator-face.png`, `creator-kit.png`; `room2-front.png`, `room2-beside-engineer.png`, `room2-back-wall.png`;
`walk-1-walk_contact.png`, `walk-2-walk_down.png`, `walk-3-walk_pass.png`; `room5-walking-away.png`;
`intro-sitting-up.png`, `intro-standing-pj.png`; `figure-x6-at-0.8.png` (the front figure at 0.8, enlarged ×6: both
eyes keep a white and a pupil).

## For Cloud Claude

- `tools/hero_gen.py` and `tools/tests/test_hero_gen.py` still run (165 Python tests); they are yours to retire.
- `js/intro/timeline.js` (above) is the one change outside the list.
- The one-line `chapter.js` overlap with PR #28 (above).
