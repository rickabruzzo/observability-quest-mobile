# Warp brief 17: the ending (the sunrise, the staff screen, Play more)

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/the-ending` from
`origin/era-look`; the pull request's base is `era-look`. It does not depend on brief 16 (the title) and
touches none of the same files except `css/game.css`.

## Why

Claim does nothing yet: Charity gives her verdict, says the prize desk opens in a later build, and the player
is back at the menu. The spec's ending is Charity, then a **sunrise coda** ("the hero walks out into
daylight, shades on"), then the claim form, then the screen the player shows to booth staff, with a way to
keep playing.

Rick, 2026-11-18: "The HS form isn't coming into play until this is approved, so shelve it. The show-to-staff
screen can be whatever since it's just a placeholder, but the sunrise animation and play more screen can be
built."

So: **no form in this brief.** `js/claim.js` (the email form and its HubSpot slot) stays as it is, unused.

## The flow

```
[Claim your prize]            after a scenario, or the menu's button
  -> Charity's verdict        as today, without the "prize desk opens later" line
  -> CODA                     new screen: the sunrise
  -> COMPLETE                 new screen: show this to booth staff
       [Play more] -> MENU    hero and solved marks kept
```

- Every Claim runs the same three steps, however many times. The coda has a Skip.
- Entering COMPLETE sets `ctx.claimed` and keeps it for the session (`sessionStorage`, key `oq.claimed`,
  beside `oq.done`).
- Once claimed, the menu's column button reads the script's `complete.show` ("My prize") and opens COMPLETE
  directly: a player who chose Play more before finding the booth has to be able to get back to it.
- `claim.soon` is no longer said anywhere. Leave the slot in the script; Cloud Claude removes it.

## A. What is built

`assets/coda/` and `assets/coda/coda.json` (`tools/build_coda.py`; do not edit or rebuild).

**Every picture in it is a labelled stand-in today**: flat blocks with STAND-IN written on them
(`"placeholder": true`). Art Claude is painting the real ones (art brief 09). They arrive with the same names
and a manifest with different numbers, and nothing in the game should have to change. So read every position
from the manifest and hard-code none.

```
images.frames  [4]                       the street at dawn, 320×200, each lighter than the last
images.door                              the door standing open: a patch, drawn at door.x, door.y
images.sun                               the sun, 40×40, clear background
floorY         186                       the pavement line his feet stand on
heroScale      0.85                      as in the bedroom
door           { x, y, w, h }            the doorway
doorway        { x, y }                  the middle of his feet as he stands in the doorway
stand          { x }                     the middle of his feet where he stops, on floorY
sun            { x, y0, y1, w, h }       its left edge; its top edge before it rises and after
sky            { x, y, w, h }            the only place the sun may show: clip it to this
windowBottom   60                        the narration must end above this row
```

The script has the words: `coda.1`, `coda.2`, `coda.3` (with `{name}`: `displayName(hero)` from
`js/creator-state.js`), `complete.title`, `complete.instr`, `complete.redeem`, `complete.redeemed`,
`complete.again`, `complete.again.note`, `complete.show`.

## B. The coda (`js/screens/coda.js`, its rules in `js/coda/timeline.js`)

Built the way the intro is: a pure timeline the screen plays, pictures loaded once (as `preloadIntro` does,
6 s limit), cuts and whole pixels, nothing tweened.

| Beat | What happens | Then |
|---|---|---|
| 0 | Frame 0 (the darkest). Door shut. No hero. The sun below the horizon. 600 ms. | |
| 1 | The door opens (350 ms). He is standing in the doorway, facing us (300 ms). He walks out: down to the pavement line, then right to `stand.x`, with the rooms' own walks and the bedroom's pace (100 px/s across, 66 down). The door shuts when he is 20 px clear of it. He stops and holds his stance, as in a room. | `coda.1` |
| 2 | The sun rises: from `y0` to `y1` in whole pixels over 4 s, drawn clipped to `sky`, so it comes up from behind the horizon. The picture cuts to frame 1 a third of the way up, frame 2 at two thirds, frame 3 when it stops. | `coda.2` |
| 3 | He turns to face us. 400 ms later the sunglasses are on (C). | `coda.3`, then COMPLETE |

- Each line is one narration window, top left, no portrait, the player taps to go on. It must end above
  `windowBottom` on both phone sizes: it sits over the building, clear of his head and of the sun.
- He is the player's hero as made: `placeHero` with `heroScale`, in the hoodie. He only ever walks down and
  right.
- The intro's sounds where the same things happen: `door` when it opens, `shut` when it shuts, `step` when he
  stops.
- **Skip** in the right column, as the intro has it: straight to COMPLETE.
- **Reduced motion**: no walk and no slide. The door opens and he is standing at `stand.x`; at beat 2 the sun
  is at `y1` and the picture is frame 3 at once. The three windows as above.
- **If the pictures fail or take more than 6 s**: the three windows over a black scene, then COMPLETE.

## C. The sunglasses (engine)

Art brief 09 delivers them as a piece like the glasses. The hero's manifest will gain `shades: { front, side }`
with the same shape as `glasses`. Today it has none.

- A `shades` option beside `mark` in `composeFigure`'s options, passed through by `placeHero` and `drawHero`:
  with it, `m.shades[view]` is laid where the glasses would be, and instead of them. The cache key takes it
  into account.
- With no `shades` in the manifest, or none for that view, nothing is added and nothing fails: today the coda
  plays without them.
- Test it with a manifest that has the entry (point `shades.front` at the glasses' own rectangle in a copy of
  the manifest): the figure with shades is the figure with glasses, and without the entry it is the bare face.

## D. The staff screen (`js/screens/complete.js`)

A placeholder. Keep it plain; nobody is judging its look yet.

- The dawn's last frame stays on the canvas if it loaded (black otherwise). Over it, one card in the game's
  window style:
  - `complete.title` as the heading.
  - `complete.instr`.
  - A button, `complete.redeem`, for staff. Tapped, it becomes `complete.redeemed`, disabled, and stays so
    across a reload: use `redeemed` from `js/claim.js` (`localStorage`, as v0.1 did).
  - A button, `complete.again` ("Play more"), with `complete.again.note` under it: to the menu.
- Read type 16 CSS px or more; both buttons at least 44 CSS px high; the card inside the scene at 667×375.

## E. Wiring

- `js/screens/charity.js`: the third line is optional. With none, she says two.
- `js/screens/chapter.js` and `js/screens/menu.js`: after Charity, `game.go('CODA')` in place of the menu.
- `js/screens/menu.js`: the claimed button (see The flow).
- `js/game.js`: the two screens; `ctx.claimed` loaded from and saved to the session.

## Tests

Pure rules first (`tests/coda-timeline.test.js`), then the screens.

- The walk out: at any time he is on the path doorway, pavement line, `stand.x`; never left of the doorway;
  the door is open from the start of beat 1 until he is 20 px clear; he ends at `stand.x` on `floorY`, facing
  right, then holds.
- The sun: `y0` at the start of beat 2, `y1` after 4 s, never moving down, whole pixels; the frame is 0, 1, 2,
  3 at the thirds.
- Reduced motion: the end state of each beat at once.
- `claimed`: false at first; true after COMPLETE; still true after a reload in the same session.
- The menu's button: Claim when something is solved and nothing claimed; "My prize" once claimed; nothing
  when nothing is solved.

In a browser (`tests/e2e/ending.test.js`), at 844×390 and 667×375, starting from a session with one scenario
already solved (seed `oq.done`; do not play a scenario to get there):

- Claim from the menu: Charity's two lines, then the screen is CODA, then COMPLETE. `claim.soon` is never
  shown.
- In the coda: the three lines are the script's, in order, `{name}` filled; each window's bottom edge is
  above `windowBottom`; he ends with the middle of his feet at `stand.x`, `floorY`; the sun ends at `y1`;
  a pixel of the sun is never drawn outside `sky` (read the canvas just outside it while it rises); the frame
  goes 0 to 3.
- Skip goes to COMPLETE from any beat.
- Reduced motion: no walk frames, the sun at `y1` at once.
- COMPLETE: the four strings; the staff button turns to `complete.redeemed` and is still so after a reload;
  Play more opens the menu with the solved mark kept and the button now "My prize", which opens COMPLETE with
  no Charity and no coda.
- With `assets/coda/coda.json` refused: three windows over black, then COMPLETE.

Expose what the tests need on `window.__oq.coda`: `loaded`, `beat`, `frame`, `sun` (its top edge), `hero`
(`x`, `y`, `pose`, `view`, `visible`, `shades`), `doorOpen`, `done`.

Run all three suites, the browser files one at a time.

## Files

New: `js/screens/coda.js`, `js/coda/timeline.js`, `js/screens/complete.js`, `tests/coda-timeline.test.js`,
`tests/e2e/ending.test.js`. Changed: `js/game.js`, `js/menu.js`, `js/screens/menu.js`, `js/screens/chapter.js`,
`js/screens/charity.js`, `js/engine/hero.js`, `css/game.css`, and their tests. Nothing in `tools/`, `assets/`
or `script/`.

## Hand-back

`handbacks/<date>-warp-the-ending.md`: what you built, the judgment calls, the three suites' counts, and a
capture of each beat of the coda and of the staff screen at 844×390.

## Review (Cloud Claude, 2026-11-19)

Built as briefed (`handbacks/2026-11-19-warp-the-ending.md`); reviewed in
`handbacks/2026-11-19-cloud-the-ending-review.md`. What differs from the text above:

- **Each of the coda's lines is one window.** As built each took two, turning the page in the middle of a
  sentence. `windowBottom` is now 64 (the stand-in layout's number; his head starts at 70) and the window takes
  every line that fits above it: three, on both phone sizes (`narrationLines` in `js/coda/timeline.js`).
- **A line that begins with the hero's name begins with a capital** (`codaLine`): "The Engineer puts on
  sunglasses."
- **`claim.soon` is gone from the script.**
- The coda has its own loader (Warp's call): `coda.json` lists its frames as a list.
- **The paintings landed 2026-11-21** (art brief 09; `handbacks/2026-11-21-cloud-sunrise-art.md`). The manifest's
  numbers changed and the game's code did not: `heroScale` 0.8, `doorway` 34, 171, `stand.x` 132, the sun's left
  edge 205 rising from 115 to 75, `sky` x 123 to 297 down to the horizon at 115, `windowBottom` 64. The hero's
  manifest has `shades.front` and `shades.side`.
