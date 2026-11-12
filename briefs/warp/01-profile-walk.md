# Warp brief 01 — put the profile walk in the game

Read `briefs/warp/PROTOCOL.md` first. Branch: **`warp/profile-walk`**, cut from `sci-adventure`.

```
cd ~/Documents/"Observability Quest Mobile"
git worktree add ../oqm-warp-profile-walk -b warp/profile-walk sci-adventure
cd ../oqm-warp-profile-walk        # work only here
```
(`node_modules` is not shared between worktrees: the browser tests need Playwright resolvable from here — see
how the main folder does it and do the same.)

## Why

*Observability Quest* is a Sierra-style point-and-click for phones (landscape, 320×200 canvas scaled up). The
hero is drawn procedurally from the player's choices on a character sheet. Today the hero only has a **front
view**, so walking is the front-facing figure sliding sideways while its legs shuffle. Rick wants what the
Sierra games did: a **side-on figure with a proper walk**. He has approved the look (2026-11-11) from a draft
that exists only in the Python reference generator. Your job is to make that draft the game's walk.

## What exists

- `tools/hero_gen.py` — the **reference** renderer (Python + Pillow). `hero(...)` is the front view;
  **`hero_side(...)`** is the approved profile draft: `SIDE_POSES = ['stand', 'w1' … 'w8']`, joint angles in
  `SIDE_LEG` / `SIDE_BOB`, limbs built by `_limb`, `_leg`, `_arm`. 28×72 px, facing right.
- `js/engine/hero.js` + `js/engine/hero-parts.js` — the game's **pixel-exact port** of the front view:
  `composeHero(cfg, pose, outfit)` → RGBA `Uint8ClampedArray` (28×72), `drawHero(ctx, cfg, pose, x, y, scale,
  { flip, outfit })`. `tests/hero.test.js` proves it byte-for-byte against fixtures in `tests/fixtures/hero/`
  that `python3 tools/hero_gen.py --fixtures tests/fixtures/hero` writes. **That parity discipline is the
  pattern to follow.**
- `js/engine/walk.js` — `planWalk` / `stepWalk`: position and a pose name over time (`walk1..4`, 6 fps,
  110 px/s). Used by `js/screens/preview.js` (tap-to-walk test room).
- `js/intro/timeline.js` — `exitPlan` / `exitAt` drive the hero's walk to the bedroom door in the intro
  (60 px/s across, 40 px/s up to the threshold), drawn by `js/screens/intro.js`.

To see the approved look: `python3 - <<'PY'` … call `hero_gen.hero_side(**hero_gen.PRESETS['nb'], pose=p)` for
each pose and save them enlarged; step through `w1..w8`.

## Build

1. **Port `hero_side` to the game**, pixel-exact, in a new module `js/engine/hero-side.js`:
   - `composeHeroSide(cfg, pose = 'stand', outfit = 'hoodie')` → the same RGBA shape as `composeHero`;
   - `drawHeroSide(ctx, cfg, pose, x, y, scale = 1, { flip = false, outfit = 'hoodie' } = {})` — `flip` mirrors
     for walking left, exactly as `drawHero` does;
   - `SIDE_POSES` exported; shared colour tables and the canvas/shade/outline helpers come from the existing
     modules — export what you need from `hero.js` rather than copying it.
2. **Fixtures and parity.** Extend `hero_gen.py --fixtures` (or add `--side-fixtures DIR`) to write
   `tests/fixtures/hero-side/*.{json,rgba,png}`: all nine poses for one hero, and at least one fixture for every
   hair style, each beard, glasses on, each body, and the pyjama outfit. `tests/hero-side.test.js` compares
   byte-for-byte, like `tests/hero.test.js`.
   - **Rounding is the trap.** `_limb` uses `math.sin/cos` and Python's `round()` (banker's rounding);
     `Math.round` differs at .5. Give both sides one explicit rule (e.g. `floor(x + 0.5)`) and use it everywhere
     in the side view. You may change `hero_side`'s arithmetic for this **only if the pictures do not visibly
     change** — render the nine poses for the three presets before and after and diff them; list any pixel that
     moved in the hand-back.
3. **Use it for walking.**
   - `walk.js`: walking returns side poses `w1..w8`; standing still stays the **front** view (`idle`).
     Choose the frame from **distance travelled**, not the clock, so feet do not slide: one full cycle (8 frames,
     two steps) per `STRIDE_PX` of travel. Start from `STRIDE_PX = 38` (what the leg angles work out to) and
     export it. Callers must be able to tell which view to draw (e.g. `stepWalk` returns `{ view: 'side' }`).
   - `preview.js`: draw the side view while walking (mirrored when heading left), front view when stopped.
   - Intro exit (`timeline.js` `exitAt`, `screens/intro.js`): side view walking across the floor **and** for the
     few steps up to the door (there is no back view); front view before the walk starts.
   - Keep reduced motion behaving as now (no walk animation; the hero is simply there).
4. **Tests.** Unit: frame-by-distance (a cycle per `STRIDE_PX`, same frame for the same distance at any speed,
   direction/flip, done → `idle`/front). Update the tests that name `walk1..4` (`tests/walk.test.js`,
   `tests/intro-timeline.test.js`, `tests/e2e/walk-preview.test.js`, `tests/e2e/intro.test.js`) to the new
   contract — change what they expect, do not loosen them. Add an e2e check that the preview room reports the
   side view while walking and the front view at rest.
5. **Docs.** README "Layout of the code" gets the new module; `docs/backlog.md` — replace the two "Profile"
   notes with what shipped and what is left.

## Yours / not yours

**Yours:** `js/engine/hero-side.js` (new), `js/engine/walk.js`, `js/engine/hero.js` and `hero-parts.js`
(exports and shared helpers only — the front view's output must not change), `js/screens/preview.js`, the walk
parts of `js/intro/timeline.js` (`exitPlan`, `exitAt`) and the hero-drawing lines of `js/screens/intro.js`,
`tools/hero_gen.py` (`hero_side` and fixtures only), `tools/tests/test_hero_gen.py`, the tests above,
`tests/fixtures/hero-side/`, README, `docs/backlog.md`, the `?v=` numbers in `index.html`.

**Off limits:** `tests/fixtures/hero/` (must stay byte-identical — that is the proof the front view did not
change), `assets/`, `tools/build_intro.py` and its tests, `scratch/`, `script/`, `docs/superpowers/`,
`js/engine/cursor.js`, `js/creator-state.js`, `js/screens/creator.js`, everything else in `js/intro/` and
`js/screens/intro.js` beyond the lines named above, `main`, `sci-adventure`.

## Done when

- `npm test`, `python3 -m pytest tools/tests -q`, `npm run e2e` all pass in your worktree.
- `git diff sci-adventure -- tests/fixtures/hero` is empty.
- In `npm run serve`: in the preview room the hero walks side-on both ways with feet that do not slide and
  stands facing you when stopped; in the intro the hero walks side-on to the door and through it.
- Hand-back written to the main folder's `scratch/warp-profile-walk-handback.md`, including:
  - how the walk looks at 110 px/s with `STRIDE_PX = 38` (the legs cycle about three times a second — if that
    reads as scurrying, say so and say what speed/stride you would pick; do not change the speeds yourself);
  - any pixel differences from the approved draft;
  - two or three enlarged screenshots or a short GIF of the walk saved beside the hand-back.

## Not in this brief

Thicker legs, a livelier standing pose, back or three-quarter views, the room engine, hotspots. Note ideas in
the hand-back; do not build them.
