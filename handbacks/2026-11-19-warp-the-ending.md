# Hand-back: Warp brief 17 — the ending (the sunrise, the staff screen, Play more)

Branch `warp/the-ending` from `origin/era-look` (at `befd302`); pull request against `era-look`. Nothing in `tools/`,
`assets/` or `script/` changed. No form: `js/claim.js` is untouched (only its `redeemed` is read).

## What I built

**The flow.** Claim (after a scenario, or the menu's button) → Charity's two lines → `CODA` → `COMPLETE` → Play more →
`MENU`. Entering `COMPLETE` sets `ctx.claimed` and keeps it in `sessionStorage` under `oq.claimed` (`js/menu.js`:
`CLAIMED_KEY`, `parseClaimed`, `serializeClaimed`); `js/game.js` loads it at boot. Once claimed the menu's column button
reads `complete.show` ("My prize") and opens `COMPLETE` directly (`menuButton(done, claimed)` → `claim` / `show` /
null). `claim.soon` is said nowhere; the slot stays.

**`js/coda/timeline.js`** (pure): `codaPlan(m)` (the legs from the manifest at the bedroom's pace, 100 px/s across and
66 down; the door clear at `door.x + door.w + 20`), `beat1At(plan, t, reduced)` (the door opens 350 ms, he stands in the
doorway facing us 300 ms, walks down with the toward frames then right with the side frames, the door shuts once he is
clear, he stops at `stand.x` on `floorY` and holds `stand`; `done` after `SETTLE_MS`), `sunAt(m, t, reduced)` (the top
edge from `y0` to `y1` over 4 s in whole pixels, never back; the frame 0/1/2/3 at the thirds), `beat3At(t)` (facing us;
shades at 400 ms). Reduced motion: each beat's end at once.

**`js/screens/coda.js`**: `preloadCoda()` fetches `coda.json` and its pictures once (its own loader: the manifest's
`images.frames` is a list, which `loadManifest` does not read), 6 s limit, forgets a failure so a later visit retries.
`play()` runs the beats: 600 ms dark, beat 1 to `coda.1`, the sun to `coda.2`, the turn and the shades to `coda.3`,
then `COMPLETE`. Each line is one window top left, no portrait, `maxLines` chosen so it ends above `windowBottom` at
the scene's scale. The canvas: the frame, the sun clipped to `sky`, the door patch when open, the hero through
`placeHero` at `heroScale` with `shades` in beat 3. Sounds: `door`, `shut`, `step` once each. Skip in the right
column (the intro's `#btn-skip`) finishes from any beat; a refused `go()` (the tap guard) is retried from `tick`, as
the intro does. Without the pictures: the three windows over black, then `COMPLETE`. `window.__oq.coda`: `loaded`,
`failed`, `beat`, `frame`, `sun`, `hero` (`x, y, pose, view, visible, shades`), `doorOpen`, `done`, `waiting`,
`manifest`.

**`js/engine/hero.js`**: `shades` beside `mark` in `composeFigure`'s options, passed through by `placeHero` and
`drawHero`; with it, `m.shades[view]` is laid where the glasses would be, instead of them; the cache key carries it;
no entry, nothing added. Today's manifest has none, so the coda plays without them.

**`js/screens/complete.js`**: the dawn's last frame if the coda's pictures loaded (black otherwise); a card
(`.complete`) with `complete.title`, `complete.instr`, `#btn-redeem` (→ `complete.redeemed`, disabled, kept by
`redeemed` in `localStorage`), `#btn-again` with `complete.again.note`. **`js/screens/charity.js`**: the third line
is optional (`soon = null`). **`js/screens/chapter.js`**, **`js/screens/menu.js`**: after Charity, `game.go('CODA')`.

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **415 passed** (404 on `era-look` before; +6 coda timeline, +2 menu, +1 shades, and the title's 5 are not on this base) |
| `python3 -m pytest tools/tests -q` (the main folder's `scratch/venv`) | **149 passed** (unchanged on this base) |
| `npm run e2e` | **168 passed** (162 on `era-look` before; +6 in `tests/e2e/ending.test.js`) |

## Tests changed

- `tests/e2e/_play.js` `charitySays`: reads her lines until her layer is gone (two now) instead of exactly three.
- `tests/e2e/menu.test.js` "Claim: …": two lines, then `CODA`, Skip, `COMPLETE`, Play more, the menu's button "My
  prize", which opens `COMPLETE` with no Charity. The other menu test that clicks Claim still checks her first line.
- New: `tests/coda-timeline.test.js` (6), `tests/e2e/ending.test.js` (6), the shades test in `tests/hero.test.js`,
  the claimed and `menuButton` tests in `tests/menu.test.js`.

## Calls I made

1. **The coda has its own loader.** `coda.json` lists `images.frames` as a list; `loadManifest` reads `images` as
   name → file. `preloadCoda` names the pictures `frame_0 … frame_3`, `door`, `sun`.
2. **Reduced motion still has the 600 ms dark beat** before the door is open with him standing; the brief lists
   only the walk and the slide as what goes.
3. **The narration's `maxLines`** is computed from `windowBottom` and the scene's scale (window top 6 px, 27 px a
   line at 24 px type), floor 2; at both phone sizes the two-line windows end well above row 60.
4. **He holds `stand` through beat 2** (the sun) and turns in beat 3, as the table reads.
5. **`step` sounds once, when he stops**; `door` when it opens, `shut` when it shuts.
6. **The staff card is the window style** (white, black border, hard shadow), 20 px display heading, 18 px text,
   16 px note, buttons 44 px; it fits 667×375 with room.
7. **Three browser tests wait 400 ms before a tap that follows a screen change** (Skip right after `CODA`, Play more
   right after `COMPLETE`): the game's double-tap guard refuses a `go()` within 350 ms of the last, and a person does
   not tap that fast. The coda's own Skip retries from `tick`, so a real early tap still lands.
8. **`menuButton({}, true)` is `show`**: a claimed prize with an emptied `oq.done` still shows "My prize".

## Captures (844×390), in `scratch/the-ending/` (copied to the main folder's `scratch/`)

`1-charity`, `2-beat0-dark-street`, `3-beat1-doorway`, `4-beat1-walking-out`, `5-beat1-coda-line-1`,
`6-beat2-sun-rising`, `7-beat2-sun-up-line-2`, `8-beat3-facing-us-line-3`, `9-complete`, `10-complete-redeemed`.
The pictures are the stand-ins; the real ones arrive with the same names.
