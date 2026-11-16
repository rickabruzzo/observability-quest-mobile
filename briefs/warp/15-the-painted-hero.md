# Warp brief 15 — the painted hero: Art Claude's figures replace the hero drawn by code

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/painted-hero` from
`origin/era-look`; the pull request's base is `era-look`. **After brief 14** (both change
`js/screens/chapter.js`).

## Why

Rick, five times over two days: the hero's head "looks really weird"; "still a huge difference in detail
levels"; "the hero characters just look blocky and odd in contrast to the NPCs"; once he was the right size,
"still looks really blocky"; and after one more round in code, "Lets not have you make another bad attempt at a
character model." So the hero is no longer drawn by code. Art Claude painted him the way the personas are
painted (art briefs 05 and 06), Rick approved the paintings, and they are cut to game size as parts the game
can recolour.

**You draw nothing.** No pixel of him is made by code. The one thing the game adds is the Honeycomb mark on
his chest, from the official file's table (`js/engine/hc-mark.js`), as it does today.

## A. What is built

`assets/hero/hero.png` and `assets/hero/hero.json` (`tools/build_hero_painted.py`; do not edit or rebuild).

**The sheet is not a picture, it is codes.** Each pixel's red channel is a code: 0 is clear; otherwise
`code − 1` is `part × 32 + tone`, where `part` indexes `parts` (`hoodie, jeans, skin, hair, grey, outline`) and
`tone` is 0–31. Code 255 (`erase`) appears only in the beard: it clears the pixel under it. Read the sheet once
into a `Uint8Array` of codes (draw it to a canvas, take every fourth byte).
  (Changed in review, 2026-11-16: reading a canvas back is not exact in every browser. Brave, Firefox in a
  private window and Safari in places alter what a page reads from a canvas, to guard against fingerprinting,
  and one wrong code is a pixel of the wrong tone or part. The game now reads the codes from the PNG's own bytes,
  `js/engine/png-codes.js`, and uses the canvas only in a browser without `DecompressionStream`.)

**The manifest:**

| Key | What |
|---|---|
| `bodies` | 13 bodies without heads, each `{ x, y, w, h, ax, ay, view }`: its box on the sheet, its anchor (the neck) counted from the box's corner, and `view` (`front`, `side`, `back`) |
| `heads` | `standard`, `long`, `fro`, `mohawk`, each with `front`, `side`, `back`: a whole clean-shaven head, `{ x, y, w, h, ax, ay }` |
| `beard`, `glasses` | overlays, `front` and `side` only (neither shows from behind) |
| `props.clothes` | the heap of day clothes, 35×23 |
| `ramps` | every colour the game can need, as strings of 32 tones × `rrggbb`: `hoodie[name]`, `jeans[name]`, `skin[index]`, `hair[name][skinIndex]` (thin hair shows the skin under it), `grey`, `outline`, and `pj.top`, `pj.bottom` |
| `walk` | `side`, `toward`, `away`: `frames` (`{ body, dy }`) and, for `side`, `advance` |
| `mark` | where the Honeycomb mark's 9×9 table goes: `dx`, `dy` from the anchor, on the `bodies` listed |
| `eyes` | the pupils, `[dx, dy]` from the anchor: two in `front`, one in `side` |

The bodies: `front`, `side`, `back` (standing); `walk_contact`, `walk_down`, `walk_pass`, `walk_up` (the side
walk); `toward_l`, `toward_r`, `away_l`, `away_r` (walking toward us and away); `pj_front`, `pj_sit` (pyjamas).
All side bodies face right.

## B. Putting a figure together

This is the whole of it, and `tests/fixtures/hero-painted/` holds ten finished figures it must reproduce byte
for byte (each `<name>.json` says what to compose and gives `w`, `h`, `ax`, `ay`; `<name>.rgba` is the
result; `sheet.codes` is the sheet's codes row by row, one byte each, for Node, which has no PNG decoder).

1. **Layers**, in this order: the body; `heads[style][body.view]`; `beard[body.view]` if he has a beard and the
   view has one; `glasses[body.view]` likewise.
2. **Stack them anchor on anchor.** With `left = max(ax)` and `top = max(ay)` over the layers, the figure is
   `max(w − ax) + left` wide and `max(h − ay) + top` tall, and a layer's corner goes at
   `(left − ax, top − ay)`. Later layers go over earlier ones: a code of 0 leaves what is under it, 255 clears
   it, anything else replaces it. The figure's anchor is `(left, top)`.
3. **Colour by looking up.** For code `c`, `part = (c − 1) >> 5`, `tone = (c − 1) & 31`, and the colour is tone
   `tone` of that part's ramp: `ramps.hoodie[cfg.hoodie]`, `ramps.jeans[cfg.jeans]`, `ramps.skin[cfg.skin]`,
   `ramps.hair[cfg.hair][cfg.skin]`, `ramps.grey`, `ramps.outline`. **In pyjamas** the first two are
   `ramps.pj.top` and `ramps.pj.bottom`: the pyjamas are the same pale blue on everyone. No colour maths.
4. **The mark.** On a body in `mark.bodies`, in the hoodie, each `[mx, my, colour]` of `HC_MARK_PIXELS` is
   painted at `(ax + mark.dx + mx, ay + mark.dy + my)` of the finished figure. Nowhere else: not in profile,
   not from behind, not on pyjamas.

The figure's last row is always the body's last row: his soles, or for `pj_sit` the cut at his waist.

Keep finished figures (per look and body) the way composed sprites are kept today.

## C. Which body when

| Today | Now |
|---|---|
| standing still, facing the player (`idle`) | `front`; in pyjamas `pj_front` |
| the side-on stance held on arrival (`stand`) | `side` |
| the eight side frames `w1`…`w8` | the four of `walk.side.frames`, in order, repeating |
| sitting up in bed (`situp`, pyjamas) | `pj_sit` |
| (new) walking toward us, walking away | `walk.toward.frames`, `walk.away.frames` |
| (new) arrived after walking away | `back`, held as `stand` is today, then `front` |

**Where he is drawn.** His point in a room is still his feet's centre on the floor. The figure goes with its
anchor's column on that x and its last row on that y. A frame's `dy` moves the whole figure down that many
figure pixels (up when negative): the paintings were all scaled to one height, so the bob is added here.

**Walking** (`js/engine/walk.js`):
- A leg of the path that goes further across than up or down the screen is a side walk, mirrored when it
  heads left. Otherwise it is `toward` when y grows and `away` when y shrinks. The toward and away frames are
  never mirrored (`toward_r` and `away_r` are the other foot).
- The frame comes from the ground he has covered in his own pixels, as now: one frame every
  `walk.side.advance` (13.5) of them, in all three walks. `STRIDE_PX` and the eight-frame tables go.
- `WALK_SPEED`, `SETTLE_MS`, the path planning and reduced motion (no frames; he is simply there) do not change.

**His size.** `heroScaleAt(room, y)` as it is. The painted figure stands 136 rows tall where the old one stood
140; do not correct for it, and never draw him larger than 1.

## D. Drawn smaller

`scaleSprite` and `blit` keep their method (whole rows and columns of the figure, evenly spaced, the offset
that keeps the most detail; no blending, ever) but take a figure of any width and height:

- the last row is always kept (his soles stay on the floor);
- **the eyes are kept**: the row `ay + dy` and each column `ax + dx` of `eyes[view]` are among the kept lines
  whenever some offset allows it; the old rule that looked for an eye-white colour goes;
- otherwise the score is what it is now: the lines with the most colour changes;
- `flip` mirrors the scaled figure; the anchor's column moves with it.

`window.__oq.chapter.heroBox` is the box of what is actually drawn.

## E. The creator

One build, and four hair styles, a beard or none, glasses or none (Rick, 2026-11-14: "lets do it and see how
it goes"). Colours are untouched.

- `OPTIONS`: `body` goes. `style` is `['standard', 'long', 'fro', 'mohawk']`. `beard` is `['none', 'short']`.
  `skin`, `hair`, `hoodie`, `jeans`, `glasses` stay as they are.
- The Body row, `BODY_LABELS`, `applyPreset` and the `fem` and `nb` presets go. The default hero is today's
  `PRESETS.masc` without `body`: the figure Rick approved.
- **A hero saved before this** must still load: `style: 'shoulder'` becomes `'long'`, `beard: 'long'` becomes
  `'short'`, and `body` is ignored.
- The big preview is the `front` figure, centred on its anchor in a canvas 56 wide and 148 tall (the afro
  stands six rows above short hair), his soles on the last row. (Since 2026-11-16 the afro is cut to 78 % of its
  painted size and stands three rows above short hair; the canvas keeps its size.)
- A thumbnail for hair, beard or glasses is the `front` figure with that choice, cropped to 40×44 from
  `(ax − 20, ay − 36)`.

## F. The intro

- Pyjamas: `pj_front` standing, `pj_sit` sitting, in the pyjama ramps (B.3).
- **Sitting up:** `pj_sit` is cut straight across at the waist. Place it as `situp` is placed now: its last
  row on `sitY`, at `sitX`, and the plate's own blanket drawn back over him from the blanket's line down. The
  cut must never show.
- **The heap of clothes** (`drawClothes`) is `props.clothes`, coloured with his hoodie and jeans ramps like any
  figure, at the hero's scale, its bottom edge and centre where the drawn heap's are now.
- The white flash into day clothes takes the silhouette of whatever figure is on screen, as now.

## G. What goes

The hero drawn by code: `js/engine/hero-side.js`, the composing half of `js/engine/hero.js`, and the drawing
tables in `js/engine/hero-parts.js` (`BODIES`, `WALK`, `SIDE_*`, `EYES`, `DRAWSTRINGS`, `HC_MARK_AT`,
`HC_MARK_SIDE_AT`, `PJ`, `SIT_*`, limb sizes); with them `tests/hero.test.js`'s and `tests/hero-side.test.js`'s
comparisons to the Python hero and `tests/fixtures/hero/`, `tests/fixtures/hero-side/`. Keep the colour tables
(`SKIN`, `HAIR`, `HOODIE`, `JEANS`: the creator's swatches read them, and a Python test holds the ramps to
them) and the scaling.

Cloud Claude retires `tools/hero_gen.py` and its tests after your merge. (Retired in the review, 2026-11-16.)

If the sheet or the manifest fails to load, the game still runs: no hero is drawn, everything else works.
Load them before the creator opens; the title does not wait for them.

## Tests

Unit:
- every fixture in `tests/fixtures/hero-painted/` is reproduced byte for byte, with its `w`, `h`, `ax`, `ay`
  (from `sheet.codes` and `assets/hero/hero.json`);
- the mark: on `front`, `toward_l`, `toward_r` in the hoodie its 32 pixels are at the place B.4 gives, in the
  official colours; no mark pixel on any other body or in pyjamas;
- which body for each state in table C; which walk for a leg going right, left, toward and away; the frame
  after 0, 13.4, 13.5, 27 and 54 pixels of ground; `dy` applied;
- scaling at 0.6, 0.7, 0.8, 0.9 and 0.95 of `front` and `side` with each head: the last row is kept, the eyes'
  row and columns are kept, every output pixel is one of the figure's own, and `flip` is the mirror;
- the creator's state: the options above; a saved hero with `shoulder`, a long beard and a `body` loads as
  E says; `randomHero` only rolls what exists.

Browser (one file at a time):
- the codes the page reads from `hero.png` equal `sheet.codes` (read the fixture in Node; the page serves only
  the game);
- the creator: no Body row; the preview changes with every option on both pages; each hair, beard and glasses
  thumbnail differs from its neighbours; Random and Start work; nothing overflows at 844×390, 667×375, 800×360;
- a room: walking right shows the four side frames in order as he travels and he ends facing us; walking left
  is their mirror; a walk deeper into room 5 (the pinball machine) uses the away frames and he ends smaller;
  his last row is on his floor row at every size; `heroBox` matches the drawn pixels;
- the mark is on his chest when he faces us and is the same pixels after a walk to the left as after a walk
  to the right (this is brief 14's F.2, kept true);
- the intro: he sits up in pale blue pyjamas, no pixel of him below the blanket's line, the canvas below it
  equal to the plate; standing in pyjamas; the heap in his colours; then dressed;
- with `hero.png` blocked, the creator and a room still work and no error is thrown.

Existing tests that measure the old hero's pixels (`tests/hero-scaling.test.js`, the creator, intro and
walk-preview files, the room tests that read `heroBox`) are rewritten to the painted hero, not deleted: list
each in the hand-back with what it checks now.

## Files

**Yours:** `js/engine/hero.js`, `js/engine/hero-parts.js`, `js/engine/hero-side.js` (delete),
`js/engine/walk.js`, `js/creator-state.js`, `js/screens/creator.js`, `js/screens/intro.js`,
`js/screens/chapter.js`, `js/screens/preview.js`, `js/game.js` (loading), `css/game.css`, `tests/`.
**Not yours:** `assets/`, `tools/`, `tests/fixtures/hero-painted/` (built; read only), `art-drops/`,
`js/engine/hc-mark.js`.

## Hand-back

`handbacks/<date>-warp-painted-hero.md`: what you built and what you deleted; the three suites' counts; every
call you made; and screenshots at 844×390: the creator's two pages; the hero in room 2 at the front, beside the
engineer, and at the back wall; three frames of a side walk; walking away in room 5; sitting up in bed; and one
figure enlarged ×6 at scale 0.8, face on, so the eyes can be checked.
