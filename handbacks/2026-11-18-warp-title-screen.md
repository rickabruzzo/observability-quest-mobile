# Hand-back: Warp brief 16 — the title screen

Branch `warp/title-screen` from `origin/era-look` (at `2cb8e3a`); pull request against `era-look`. Nothing in `tools/` or
`assets/` changed.

## What I built

**`js/title/timeline.js`** (new, pure): `starRhythm(i)` (a 3.4–6.4 s cycle and a phase from a hash of the index),
`starsOn(t)` (the indexes on at `t`, at most three: when more would be on, the ones that came on first stay and the
newcomers wait for their next cycle), `glowAt(t, reduced)` (1.0, 0.9, 0.8, 0.7, 0.8, 0.9 by 500 ms steps; 1.0 reduced),
`startBeat(t)` (`{ lit, beeps, go }`: lit from 0, one beep by 0, two by 300, go at 600).

**`js/screens/title.js`** (rewritten): `preloadTitle()` loads `assets/title/title.json` and its four pictures through
`loadManifest` with the intro's 6 s timeout, once (a failure forgets, so a later visit retries). On entering: black
canvas, Start in the right column; when the art is in, `T_title.png` on the canvas and the overlay `.title-art`: the glow
and the letters as two `<img>` at the manifest's `layer` (per cent of the scene, `image-rendering: pixelated`), the
subtitle at `letters.x`/`letters.w` with its top at 47.25 %, the small print at `print.x` with its bottom 2 % up: the
official `hc_logo_white.png` (`alt="Honeycomb"`, 7 % of the scene high, `image-rendering: auto`) and the script's
`title.credit` in two lines broken after "(CC BY-SA)." (`creditLines`). `tick` sets the glow's opacity from `glowAt`
(no transition), redraws the stars that changed (off: the picture's own 3×3 back; on: the manifest's `on` pixel and, with
`cross`, the four `arm` pixels), and runs the Start beat. Reduced motion: no twinkle, the glow at 1. If the load fails
or times out, the old black card with the title in type shows (`placeholder`); Start works either way.

**Start** (D): inside the tap `ctx.fullscreen?.()`; without the art, straight to the creator as before. With it:
`createSfx({ sound: ctx.sound })`, `unlock()`, `beep()`, `T_pager_lit.png` drawn at `pager`, Start disabled; the second
beep at 300 ms and `game.go('CREATOR')` at 600 ms from `tick`; a second tap meanwhile does nothing.

`window.__oq.title`: `loaded`, `failed`, `lit`, `glow`, `stars`, `beeps`, `starting`. The title enters before
`js/game.js` has made `window.__oq`, so the hook is attached on the first tick as well as on entering.

**`css/game.css`**: `.title-art`, `.title-layer`, `.title-sub` (`calc(var(--scene-h) * 0.115)`, `line-height: 1`,
nowrap, `#DCF0FF`, a one-game-pixel black shadow), `.title-print`, `.title-logo`, `.title-credit`
(`calc(var(--scene-h) * 0.046)`, `var(--dim)`). The placeholder's `.title-card` rules stay.

**Tests:** `tests/title-timeline.test.js` (5) and `tests/e2e/title.test.js` (6: the picture and the layers at both
sizes, the glow and the twinkle, the Start beat, reduced motion, the refused plate). `tests/e2e/weight.test.js`'s
boot allow-list gains the title's five files and the logo (the boot budget is still under 600 KB). No other browser test
needed a change: every one that clicks `#btn-start` already waits for the creator (`throughIntro` in `_play.js`, the
creator, intro, walk-preview, painted-hero and phone-shell files), and the one that taps Start twice
(`shell.test.js`) still sees one transition.

## What goes, and what stays

- `js/anim/title.js` **stays**: `js/anim/scenes.js` imports it (the brief said delete it only if nothing does).
- The placeholder's drawing stays as E's fallback. `assets/title_screen.png` untouched. The glint frames unused.

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **409 passed** (404 on `era-look` before; +5 in `tests/title-timeline.test.js`) |
| `python3 -m pytest tools/tests -q` (the main folder's `scratch/venv`) | **141 passed** (unchanged on this base) |
| `npm run e2e` | **168 passed** (162 on `era-look` before; +6 in `tests/e2e/title.test.js`) |

## Calls I made

1. **The subtitle has no script slot**; the intro hard-codes "So you want to be on-call?" and so does the title
   (`SUBTITLE`). A `title.subtitle` slot in `script/script.md` would let both read it.
2. **At most three stars on at once** is kept by letting the stars that came on first stay and making the newcomers
   wait for their next cycle; the unit test shows every star is on within a minute and a star never goes out early
   unless three were on before it.
3. **The stars' redraw is only what changed** (a 3×3 of the plate back, or the star's pixels), not the whole picture.
4. **The subtitle's `top` is set inline** (47.25 %) with its left and width, like the layers; the font sizes and the
   print's gap are in CSS from `--scene-h`, as the brief gives them.
5. **The credit's second line** is everything after "(CC BY-SA)."; a credit without that sentence would be one line.
6. **`window.__oq.title.failed`** is exposed too, so the refused-plate test can wait for the placeholder rather than a
   fixed time.
7. **The credit's type has a 16 px floor** (`max(16px, calc(var(--scene-h) * 0.046))`): at 667×375 the scene is 346 px
   tall (the thumb columns take their minimum), so 0.046 of it is 15.9 px, under the floor the brief sets for the
   smallest phone. Everywhere larger the brief's number rules.
8. **The wordmark layers use `image-rendering: pixelated` alone**, not the repo's `pixelated; crisp-edges` pair: the
   second would win in Chromium and the brief asks for pixelated.
9. **The browser test measures the letters' edge from the manifest's `letters` box** (270.5 < 275) and checks the
   `<img>` encloses it; the layer itself runs to 282.5 because of the wordmark's clear 8-px margin.

## Captures (in `scratch/title-screen/`, copied to the main folder's `scratch/`)

`title-844x390.png`, `title-667x375.png`, `title-start-pager-lit.png` (120 ms after Start).
