# Hand-back: Warp brief 09 — era-look hero, redrawn to the model sheet at the personas' size (2026-11-13)

Branch `warp/era-hero` from `origin/era-look`; pull request against `era-look`. Nothing touches `sci-adventure`.

## What I built

**The hero is 56×144, a 136-px figure, redrawn in both views** to `hero_model_sheet.png`'s level of finish: a dark
outline round the figure and between its parts (new `seam` pass: sleeves against the torso, leg against leg), four
tones a garment, a face with eyes that have a glint, brows, a nose and a mouth, hands below the sleeves with a finger
line, a hood with a V opening and two drawstrings with aglets, a kangaroo pocket with slanted openings, a hem, jeans
with an outer seam, a knee and a cuff, shoes with a two-row pale sole. Every option and both outfits draw in both
views; `PRESETS` and `OPTIONS` are unchanged. Head about 30 px, shoulders 46 across, about four and a half heads.

- `tools/hero_gen.py` is still the reference; `js/engine/hero.js`, `hero-side.js`, `hero-parts.js` match it byte for
  byte on all 31 regenerated fixtures (`tests/fixtures/hero`, `hero-side`; same names as before).
- **The Honeycomb mark comes from the official file.** New `tools/hc_mark.py` reduces `assets/hc_logomark.png` (the
  four hexagons; the small dark `h` beside them is left out) to a 9×9 table and writes it twice: `tools/hc_mark.json`
  (read by `hero_gen.py`) and `js/engine/hc-mark.js` (imported by `hero-parts.js`). `tools/tests/test_hc_mark.py`
  checks both files against a fresh reduction. Nothing draws the mark by hand any more.
- **Size from the constants everywhere.** New `tests/hero-size.test.js` greps `js/` for a 28, 72, 56 or 144 on any
  line that mentions the hero or a canvas. The creator's canvas is `${HERO_W}×${HERO_H}`; `walkTarget`, `clampWalk`,
  chapter 1's walk range and the preview room all use `HERO_W`.
- **`heroScale`** on a room (`room.heroScale`, default 1) and on an intro shot (`SHOTS[i].heroScale`). The hero is
  drawn by a new `blit` (in `hero.js`, shared by the side view): nearest neighbour, whole destination pixels, one
  `fillRect` per run of colour, so a fractional scale stays crisp and the room draw is cheaper than before. The feet
  land on `floorY` at any scale (`floorY - round(HERO_H × scale)`).
- **Walking speed doubled with the stride:** `WALK_SPEED` 120, `STRIDE_PX` 76 (three steps a second as before; a room
  is crossed in 2.2 s instead of 4.9 s). The intro's amble is 100 px/s across, 66 up.
- **Chapter 1 stand points** for the wider hero: walk `[0, 264]`, start 128, PC 73, CTO 148 (brief table).
- **Bedroom** at `heroScale: 0.85`; `exitPlan` takes the scale so the walk-out's frames come from distance in the
  hero's own pixels (no sliding feet). The clothes heap scales with him (2 × heroScale of its old shapes) and the
  flash into day clothes is the scaled silhouette.

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **242 passed**, 0 failed (was 235) |
| `python3 -m pytest tools/tests -q` | **126 passed** (was 109), from a scratch venv built from `tools/requirements.txt` |
| `npm run e2e`, one file at a time | **79 passed**: creator 14, intro 17, chapter 19, walk-preview 9, menu 7, shell 9, weight 4 |

## Contact sheet

`scratch/era-hero/contact.png` (front: idle, walk1–4, situp, pyjamas) and `scratch/era-hero/contact-side.png`
(side: stand, w1–w8, pyjamas), one row per look of the model sheet's five (`hero_gen.SHEET`: the three presets, the
afro-and-long-beard look in lime, the ginger shoulder-length look in indigo). `scratch/` is not pushed; anyone can
remake them with `python3 tools/hero_gen.py --contact DIR`. Screenshots of room 1 and the bedroom are in the same
folder (`room1-*.png`, `bedroom-*.png`, `creator.png`).

## Stand points moved, checked in play (667×375 and 844×390)

| Room 1 | Was | Now | In play |
|---|---|---|---|
| start | 142 | 128 | between the cube and the desk, clear of both |
| at the computer | 87 | 73 | over the cube's right half, in front of the chair; nothing of the PC is hidden that matters |
| at the CTO | 176 | 148 | his right edge is x 204; the desk's hotspot starts at 206. He does not overlap the CTO or her raised hand (she is at x 229+) |

Known and accepted, as the brief said: his head reaches y 56, so at the CTO and at the start he stands in front
of the lower part of the wall monitor; the CTO reads small beside him.

## How the bedroom looks at 0.85

He is 116 px tall and 48 wide. Standing at x 160 his head top is y 62, so his hair touches the last rows of the
subtitle's box (60–76) under "on-call?"; the door (132 px) is taller than him and he walks up to its threshold and
through without touching the frame. The walk out at 100 px/s is a stroll, about a step and a half a second.
**Sitting up:** with the covers at his hips the whole torso was above the blanket and his head sat in the middle of
the subtitle, so the sitting pose now stops at the waist (`SIT_CUT` 78: covers to the chest, arms under them). His
head top is then y 70, still into the subtitle's last rows. **If Rick wants him clear of the title, 0.75 does it**
(head at y 76 standing); the door would still be taller than him. I left it at 0.85 as asked.

## Calls I made (and what each costs if wrong)

1. **The figure sits 4 rows down the canvas (`TOP = 4`), so the soles are on row 143, the canvas's last.** Drawing a
   136-px figure at the top of a 144 canvas would have floated him 4 px above every floor line with the
   `floorY - HERO_H` arithmetic the screens use. Cost if wrong: none to the screens; the sprite's own coordinates
   (eyes at row 19, hem at 91…) are figure rows, image row = figure row + 4, and the tests say so.
2. **`SIDE_FOOT_DY` is 0** now: both views stand on the same row. Kept as a named constant so the screens read as
   before.
3. **`SIDE_BOB` is `[3, 1, 0, 2, 3, 1, 0, 2]`** (was `[1, 0, 0, 1, 1, 0, 0, 1]`): measured so the planted shoe is on
   one row in every frame at the new limb lengths (22/22/20/18, leg 10 wide, arm 8).
4. **The side torso is 27 deep for masc/nb (x 15–41), 25 for fem,** one more than the brief's "about 26", so the
   mark (at x 32–40) clears the near arm's outline when he stands. The mark is on the chest's leading side, as before.
5. **The mark's reduction keeps a cell when 40 % of it is hexagon** (`COVER = 0.4`); at 50 % the hexagons were
   ragged. 32 pixels; blue is the big hexagon top right, green beside it, orange left, honey below, as before.
6. **Walk tests changed, not weakened.** `tests/walk.test.js` asserted a full room takes 4–5.8 s; with the doubled
   speed it is 2.2 s, and the test now says so with the reason. `tests/intro-timeline.test.js` capped the walk out at
   70 px/s for the 38-px stride; at the 76-px stride the same cadence is about 100 px/s, so the cap is now 130 with a
   floor of 80 (slower would be slow motion at this stride). Both are cadence-preserving, which is what the brief's
   "walking speed doubles with the stride" asks for.
7. **The drawHero / drawHeroSide tests now rasterise the `fillRect` calls** and compare pixel maps (plain, flipped,
   at 1, 2 and 0.85), instead of asserting every call is a scale-sized square. The blitter merges runs, which the old
   shape check could not express; the new check is stronger (it proves every pixel, not just the rect shape).
8. **Creator thumbnails are drawn at 1 sprite px per canvas px** (`HEAD_CROP` 40×42 at 8,4); on screen they are the
   same size as the old 20×21 at 2×, with twice the detail. The big hero canvas is CSS-fitted as before.
9. **Pyjama stripes run vertically every fourth column** (the model sheet's pyjamas), not every third row as before.
10. **Clipped sitting pose** (call 1 under "the bedroom", above). Cost if Rick preferred the hands showing: one
    constant, `SIT_CUT`, in both generators.

## What I could not reach in code from the model sheet

- The sheet's figures have rounder, tapered sleeves and a torso that narrows at the waist; mine are stepped
  rectangles (shoulders slope over four rows; waist is two px in on fem/nb). A softer silhouette needs curves the
  mask helpers do not have.
- The sheet's shoes are two-tone with a lace detail; mine are one tone plus the sole.
- Long hair on the sheet has strands and a parting; mine has a few darker pixels.
- The side-view walk's hoodie does not swing; the arms do.

## For Cloud Claude / Rick to look at

- `js/intro/timeline.js:19` — `heroScale: 0.85` on the bedroom shot; see "How the bedroom looks" for 0.75.
- `tools/hc_mark.py:17` — `COVER = 0.4`, the only tuning in the mark's reduction.
- `js/chapters/ch1.js:17–23` — the new stand points.
- Brief 08's rooms 2–5 numbers are superseded by brief 09's table on this fork; I only changed room 1 (built).
- No script slot is needed.

## Housekeeping

- `node_modules` in this worktree is a symlink to `../oqm-warp-profile-walk/node_modules` (Playwright), not committed.
- The Python suite ran from a scratch venv (`/private/tmp/.../scratchpad/venv`), as in briefs 02 and 03.
