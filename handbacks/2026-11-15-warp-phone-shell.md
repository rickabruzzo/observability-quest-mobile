# Hand-back: Warp brief 13 — the game on a real phone

Branch `warp/phone-shell` from `origin/era-look` (at `8fb37d4`); pull request against `era-look`. No new art; the three
icons in `assets/icons/` are used as built.

## 0. Housekeeping

`git worktree list` showed two worktrees whose branches were merged into `origin/era-look` (`warp/feedback-fixes`,
`warp/hero-depth`). Each held only an empty `node_modules` stub (0 bytes, untracked); I deleted the stubs and removed both
worktrees without `--force`, then pruned. This brief's worktree is `.worktrees/warp-phone-shell`.

`pytest` is not installed for the Mac's Python 3.12 or 3.13; as in earlier briefs the Python suite ran from a scratch venv
(`scratch/venv`, git-ignored) built from `tools/requirements.txt` plus `pytest`.

## A. The deploy serves the game and nothing else

- `.vercelignore` at the root, exactly the allow-list in the brief (`/*`, then `!index.html`, `!manifest.webmanifest`,
  `!css`, `!js`, `!assets`).
- `tests/e2e/_server.js` reads `.vercelignore` at start-up and 404s every request outside the allowed roots; `/` is
  `index.html`. New types: `.webp`, `.webmanifest`, `.otf`. `allowedRoots` and `isServed` are exported for the unit test.
- **No test needed a file outside the list**: all 138 browser tests pass against the restricted server unchanged (apart
  from the `windowed` helper below, which is about full screen, not files).

## B. A Home Screen web app

`manifest.webmanifest` with the fields the brief lists; `index.html` carries the six head tags. No install prompt.

## C. Full screen and landscape where the phone allows it

`js/engine/fullscreen.js`: `shouldGoFullscreen(facts)`, `detectFullscreen(window)` (reads `(pointer: coarse)`, the two
`display-mode` queries plus `navigator.standalone`, `fullscreenElement`, and whether `requestFullscreen` exists) and
`goFullscreen({ doc, screen })`, which asks for `{ navigationUI: 'hide' }` then `lock('landscape')`, swallows every failure
and returns `{ fullscreen, locked }`.

Wiring: `ctx.fullscreen()` in `js/game.js` runs the check and fires `goFullscreen()` without waiting. The title's Start
and the creator's Start call it first thing in their tap handler, then change screen. The rotate gate's tap calls
`goFullscreen()` directly when the API exists and the page is not a Home Screen app. `body[data-fs]` is set once at boot
from whether `requestFullscreen` exists; CSS shows one of the two gate lines (`.fs-yes` "Or tap here to turn the
screen.", `.fs-no` "Screen not turning? Switch off rotation lock."). The stage refits on `visualViewport` `resize` too.

**The test runs had to be kept windowed by hand.** Playwright's touch contexts report `(pointer: coarse)`, so the first
full run of the suite really went full screen in headless Chromium and three existing rotate tests then failed with
"To resize minimized/maximized/fullscreen window, restore it to normal state first". `tests/e2e/_server.js` now exports
`windowed(ctx)`, an init script that makes `Element.prototype.requestFullscreen` reject; every e2e context calls it
(`_play.js`, `creator`, `intro`, `menu`, `shell`, `walk-preview`, `weight`). The API stays present, so `data-fs` still
reads `yes` in tests. No existing assertion changed.

## D. Nothing lost to the notch

`#statusbar` pads `max(10px, env(safe-area-inset-left))` / `-right`. Still 20 px, on every screen; `fitStage` untouched.

## E. Sound on phones

`js/engine/sound.js`: `createSound({ AudioContextCtor, audioSession, storage })`, on the game's `ctx` as `ctx.sound` and on
`window.__oq.sound`. `unlock()` sets `audioSession.type = 'playback'` on its first call (where the API exists), makes the one
`AudioContext` and the master `GainNode` `out`, and resumes on every call; `context()`, `out`, `muted`/`setMuted`,
`suspend()`/`resume()`, `info` as specified; `oq.muted` in `sessionStorage` ("1"/"0"). Nothing throws.

- `js/game.js`: one capture listener each for `touchend`, `click`, `keydown` → `unlock()`; `visibilitychange` suspends and
  resumes. Sound button `#btn-sound` (static, first child of `#col-l`, `margin-bottom: auto` so it sits at the top on every
  screen): "Sound"/"Snd" with "on"/"off" under it, `aria-pressed`, `aria-label` "Sound on/off", min 52 px tall.
- `js/intro/sfx.js`: `createSfx({ sound, muted })`; every voice connects to `sound.out`; `unlock()` → `sound.unlock()`;
  `close()` is a no-op. A `play()` before any unlock still gets a context (it is created suspended and resumes on the next
  tap), so the intro's sounds behave as before.
- `js/screens/intro.js`: `createSfx({ sound: ctx.sound })`.
- `?stats=1`: the bar's title reads `Observability Quest · sound: <state> · <session or "no session API"> · <sampleRate
  or "no context">`, refreshed twice a second from the frame loop; `body[data-stats="1"]` shrinks the title to 16 px so it
  fits beside "Solved" on a 667-wide phone.
- `SOUNDS` and `js/audio.js` untouched.

## F. `?swipe=1`

`html[data-swipe="1"]`: html and body get `overflow: visible; height: auto`, body `min-height: calc(100vh + 80px)`. The
stage, bar and gate are already `position: fixed`. Without the flag nothing changes (the test checks `scrollHeight ===
innerHeight`).

## The three suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **360 passed** (337 before; +9 sound, +4 fullscreen, +3 deploy, +5 manifest/shell, +2 sfx sharing) |
| `python3 -m pytest tools/tests -q` (scratch venv) | **146 passed** (unchanged) |
| `npm run e2e` | **138 passed** (125 before; +13 in `tests/e2e/phone-shell.test.js`) |

One full `npm run e2e` run earlier had the chapter verdict-layout test hang for ten minutes under the parallel load; it
passed alone and on the next full run. Not something this branch touches.

## The one allowed change to an existing test

`tests/intro-sfx.test.js`: where it built `createSfx({ AudioContextCtor })` it now builds
`createSfx({ sound: createSound({ AudioContextCtor, audioSession: null, storage: null }) })` (a local `sfxOn` helper). Every
behaviour it checked is still checked, with one inversion: "beep is two tones" asserted that `close()` closed the context;
it now asserts that `close()` does **not**, since the context is the game's. Two tests added: two `createSfx` on one sound
share its context and connect to `out` (only the master gain reaches the destination); `createSfx()` with no sound is silent.

## Calls I made (brief silent)

1. **`info.state` when muted before the first unlock is `none`**, not `muted`: no context exists yet. After the first tap
   it reads `muted`. Cost if wrong: the readout says `none` for a muted title screen; the button says "off".
2. **The gate's tap calls `goFullscreen()` whenever the API exists** (not through `shouldGoFullscreen`, which also wants a
   coarse pointer): a person tapping "tap here to turn the screen" has asked. The Start buttons keep the full check. Cost: a
   narrow desktop window in portrait could go full screen from the gate; it says so on screen.
3. **`body[data-fs]` comes from the API's existence alone**, so a Home Screen app on Android shows "tap here" (its tap does
   nothing: standalone). Cost: a line that does nothing in a case Rick's testers are unlikely to meet in portrait.
4. **The stats readout refreshes from the frame loop** (every 500 ms) rather than on events, so a context that changes state
   on its own (a phone call) shows too. `sampleRate` null reads `no context`.
5. **The Sound button's "on" state is drawn black, not the red `aria-pressed` style** the tool buttons use; "off" is red.
   Red "on" read as an alarm. Cost: one CSS line to flip.
6. **A `play()` before any unlock creates the context** (suspended) rather than staying silent. Cost: on a desktop a sound
   can begin before any tap; nothing in the game plays before the Start tap anyway.
7. **`windowed()` in every e2e context** (above). The alternative, making the game sniff a headless user agent, would put
   test knowledge in shipped code.
8. **`?stats=1` title at 16 px** rather than the brief's implied 20: the existing fonts test forbids read text below 16, and
   20 px overflowed the bar at 667 wide.

## For Rick's phones

1. [ ] iPhone, Safari tab, landscape: is the status bar's title clear of the notch?
2. [ ] iPhone, ring switch on silent: do the intro's beeps play? What does the `?stats=1` line read?
3. [ ] iPhone: Share → Add to Home Screen. Does it open with no browser bars, and is the icon the hexagons?
4. [ ] Android Chrome: does Start go full screen and landscape? Does the gate's tap turn the screen?
5. [ ] iPhone, Safari tab, `?swipe=1`: swipe up on the game. Does Safari's bar shrink and the scene grow?

Screenshots of the Sound button at 844×390, 667×375 and 800×360 (title, creator, creator muted) and the Android gate are in
the main folder's `scratch/phone-shell/` (git-ignored).

## For Cloud Claude

- `docs/infra-requirements.md` already describes `.vercelignore`; nothing to add there. Vercel honours `.vercelignore`
  only as an upload filter, so the preview after this merges is the first proof that `/briefs/...` is a 404 on the deploy.
- The `.vercelignore` allow-list form hides dotfiles too (`/*` matches them), so `.gitignore` and `.vercelignore` itself are
  not served either.
