# Warp brief 13 — the game on a real phone: full screen where a phone allows it, sound on an iPhone, and a deploy that serves only the game

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/phone-shell` from `origin/era-look`;
the pull request's base is `era-look`. No new art is needed: the three icons are built (`assets/icons/`).

## Why

Rick played the era-look build on his iPhone on 2026-11-14 (a Vercel preview, set up by Art Claude:
`handbacks/2026-11-14-art-playtest-requests.md`). Two things, in his words:

> "It would be nice if the game took up the entire screen, also if it could force full screen instead of showing
> the browser"

> "I hear sound in the browser desktop but not the mobile"

## What a phone allows (checked 2026-11-14; do not build against anything else)

| | iPhone, any browser | Android Chrome |
|---|---|---|
| Hide the browser from a page | **No.** There is no Fullscreen API for a page on iPhone (iPad only). | Yes: `requestFullscreen()` inside a tap. |
| Turn the screen for the player | No. | Yes, once full screen: `screen.orientation.lock('landscape')`. |
| Added to the Home Screen | Opens with no browser bars. iOS reads the manifest but treats `display: fullscreen` as `standalone` and ignores `orientation`; `apple-mobile-web-app-status-bar-style: black-translucent` is what lets the page fill the screen. | Opens full screen and landscape from the manifest. |
| Web Audio and the ring switch | **The switch on silent mutes Web Audio.** `navigator.audioSession.type = 'playback'` (Safari 16.4 and later) is the documented way to make it play anyway; Rick's phone confirms it (hand-back, item 2). | Plays. `navigator.audioSession` does not exist. |

Sources: firt.dev's iOS web-app compatibility notes (updated 2026-10-13), caniuse (`requestFullscreen`,
`AudioSession.type`), MDN, WebKit bug 237322, Vercel's `.vercelignore` reference.

So on an iPhone at the booth (a QR code, a browser tab) the bars stay, whatever we do. What we can do: go full
screen on Android, be a proper Home Screen app for testers and booth demo phones, lose nothing to the notch,
and make the sound heard.

## A. The deploy serves the game and nothing else

The Vercel project serves the repo's root, so today every brief, hand-back and art drop is served beside the
game (and 34 MB of art drops are uploaded on every build). The game loads only `index.html`, `css/`, `js/`
and `assets/`.

- **`.vercelignore`** at the root, in the allow-list form:
  ```
  /*
  !index.html
  !manifest.webmanifest
  !css
  !js
  !assets
  ```
- **`tests/e2e/_server.js` serves the same list and nothing else**: read `.vercelignore`, 404 anything outside
  it. Every browser test then proves the deployed files are enough. Give it the types it lacks: `.webp`
  `image/webp`, `.webmanifest` `application/manifest+json`, `.otf` `font/otf`.
- If a test needs a file outside the list, move the fixture or load it from disk; do not widen the list. Say
  which in the hand-back.

## B. A Home Screen web app

- **`manifest.webmanifest`** at the root:
  `name` "Observability Quest", `short_name` "o11y Quest", `description` as `index.html`'s, `start_url` "./",
  `scope` "./", `display` "fullscreen", `orientation` "landscape", `background_color` and `theme_color`
  "#000000", `icons`: `assets/icons/icon-192.png` (192x192) and `assets/icons/icon-512.png` (512x512), both
  `image/png`, `purpose` "any" (not maskable: a round mask would cut the mark).
- **`index.html`**, in the head:
  ```html
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="apple-touch-icon" href="assets/icons/icon-180.png">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="o11y Quest">
  ```
- The icons are the official Honeycomb hexagons on black, built by `tools/build_icons.py` (Cloud Claude's;
  house rule 6). Do not make, edit or resize an icon.
- No "Add to Home Screen" prompt in the game. A booth player has three minutes and will not install anything;
  Rick tells testers how.

## C. Full screen and landscape where the phone allows it

New `js/engine/fullscreen.js`:

- `shouldGoFullscreen({ coarsePointer, standalone, fullscreenNow, canFullscreen })` → boolean. True only on a
  touch screen (`(pointer: coarse)`), with the API present, not already full screen, and not opened from the
  Home Screen (`(display-mode: fullscreen), (display-mode: standalone)`, or `navigator.standalone`).
  **Never on a desktop**: Rick's laptop and the test runs stay windowed.
- `goFullscreen()` → asks for `document.documentElement.requestFullscreen({ navigationUI: 'hide' })`, then
  `screen.orientation.lock('landscape')`. Every failure is swallowed: no error, no message, the game goes on.
- Called from inside three taps, and **the screen change never waits for it**: Start on the title, Start on the
  creator, and a tap on the rotate gate.
- Refit the stage on `visualViewport`'s `resize` as well as the window's.

**The rotate gate** (`#rotate` in `index.html`). Many phones have rotation lock on, and today the gate just
says to turn the phone, which then does nothing. Under "Turn your phone sideways to play", one smaller line:

- where full screen exists (Android): "Or tap here to turn the screen." The tap calls `goFullscreen()`, and the
  lock turns the screen whatever the phone's own setting;
- where it does not (iPhone): "Screen not turning? Switch off rotation lock."

Set `body[data-fs="yes|no"]` once at boot and let CSS show the right line.

## D. Nothing lost to the notch

`index.html` already has `viewport-fit=cover` and the columns pad for the safe areas. The status bar does not:
its title starts 10 px from the edge, under the notch on the side the phone is turned to.

- `#statusbar` pads `max(10px, env(safe-area-inset-left))` on the left and the same with `-right` on the right.
- The bar stays 20 px tall and stays on every screen: it is the Sierra bar. `fitStage` does not change.

## E. Sound on phones

Today each visit to the intro makes its own `AudioContext` (`js/intro/sfx.js`, made and resumed in the Start
tap at `js/screens/intro.js:237`) and closes it on the way out. That works on a desktop. On an iPhone it is
silent whenever the ring switch is on silent, which is how most phones at a conference are carried.

New `js/engine/sound.js`, one for the whole game, on the game's `ctx` as `ctx.sound`:

- `createSound({ AudioContextCtor, audioSession, storage })`, the three injected for tests (defaults: the
  browser's, `navigator.audioSession`, `sessionStorage`).
- `unlock()`: **called inside a tap.** The first call sets `audioSession.type = 'playback'` where
  `audioSession` exists, makes the one `AudioContext`, and makes `out`, a master `GainNode` wired to the
  destination. Every call resumes the context if it is not `running`. Nothing here may throw.
- `context()` → the context, or null before the first unlock or where there is no Web Audio. `out` → the master
  gain. **Everything that makes sound connects to `out`, never to `destination`.**
- `muted` and `setMuted(bool)`: the master gain goes to 0 or 1, and the choice is kept in `storage` under
  `oq.muted` ("1" or "0", the key `js/audio.js` used).
- `suspend()` and `resume()`; `info` → `{ state, session, sampleRate, contexts }` where `state` is `none`,
  `suspended`, `running` or `muted`, `session` is the audio session's type or null, and `contexts` is how many
  `AudioContext`s this page has made (it must stay 1).

Wiring:

- `js/game.js`: one capture listener on `document` for `touchend`, `click` and `keydown` calls
  `ctx.sound.unlock()`. The first tap anywhere unlocks; any later tap brings sound back after a phone call or
  a trip to another app. `visibilitychange`: hidden suspends, visible resumes.
- `js/intro/sfx.js`: `createSfx({ sound, muted })` uses `sound.context()` and `sound.out`; its `unlock()` calls
  `sound.unlock()`; its `close()` leaves the shared context alone.
- **A Sound button**, `#btn-sound`, in the shell (`index.html`), at the top of the left column on every
  screen. It says "Sound" with "on" or "off" under it ("Snd" when the column is narrow), `aria-pressed` is true
  when sound is on, it is at least 44×44, and it never overlaps a screen's own controls (the creator's tabs and
  Random are the tight case, at 667×375 and 800×360). It is needed because the ring switch no longer silences
  the game.
- **A readout for Rick's phone.** With `?stats=1`, the status bar's title reads
  `Observability Quest · sound: <state> · <session or "no session API"> · <sampleRate>`, kept current. That
  line tells us from one photo what his phone is doing.

Not in this brief: the cues themselves. Several are below what a phone speaker can play (the step is a 110 Hz
triangle). They are stand-ins until the soundtrack; leave `SOUNDS` alone. `js/audio.js` (the old title loop)
is not used and stays untouched.

## F. One experiment, behind `?swipe=1`

On an iPhone, Safari shrinks its own bar when a page scrolls. The game cannot scroll, so the bar never
shrinks. **Unverified on current iOS**; Rick tries it on his phone and we keep it or delete it.

- With `?swipe=1` only: the document is 80 px taller than the viewport and can scroll; the stage, the status
  bar and the gate stay fixed where they are. Nothing else changes, and nothing changes without the flag.

## Tests

Unit:
- `sound`: one context however many unlocks; a suspended context is resumed on unlock; `audioSession.type`
  becomes `playback`, and a missing or throwing `audioSession` is harmless; no `AudioContext` gives `state`
  `none` and no throw; `setMuted` sets the gain, flips `state` to `muted` and survives a new `createSound` on
  the same storage; `info.contexts` is 1.
- `sfx`: two `createSfx` on one `sound` share its context and connect to `out`; `close()` does not close it.
  `tests/intro-sfx.test.js` keeps every behaviour it checks; where it builds `createSfx({ AudioContextCtor })`,
  build `createSfx({ sound: createSound({ AudioContextCtor }) })`. That one change to an existing test is
  allowed; say so in the hand-back.
- `fullscreen`: the truth table of `shouldGoFullscreen`; `goFullscreen` with a missing API, a rejecting
  `requestFullscreen` and a rejecting `lock` never throws and reports what happened.
- `deploy`: `.vercelignore` is the allow-list above, each allowed path exists, and `briefs`, `handbacks`,
  `docs`, `script`, `source`, `tests`, `tools`, `art-drops`, `README.md` and `package.json` are outside it.
- `manifest`: it parses; the fields above; each icon file exists at the size it claims; `index.html` carries
  the six tags.
- `css/game.css`: `#statusbar` pads with both safe-area insets.

Browser (one file at a time, as always):
- the server: `/briefs/PROTOCOL.md` and `/handbacks/2026-11-14-art-playtest-requests.md` are 404;
  `/js/game.js` and `/manifest.webmanifest` are 200 with the right type.
- on a phone-sized touch context with `requestFullscreen` and `screen.orientation.lock` stubbed before load:
  tapping Start asks for full screen once, then the lock; the game is on the creator whether the stubs resolve
  or reject; on a desktop context neither is called; tapping the gate in portrait calls them.
- after the first tap `window.__oq.sound.info.state` is `running`; after title → creator → intro
  `info.contexts` is still 1; `#btn-sound` turns it to `muted` and back, and the choice survives a reload.
- `#btn-sound` is on screen, at least 44×44 and clear of every other control on the title, the creator and a
  room at 844×390, 667×375 and 800×360.
- `?stats=1` shows the readout; without it the title is unchanged.
- `?swipe=1`: the document scrolls and `#scene`'s box does not move when it does; without the flag the
  document is exactly the viewport's height.

## Files

**Yours:** `index.html`, `manifest.webmanifest`, `.vercelignore`, `css/game.css`, `js/game.js`,
`js/engine/sound.js`, `js/engine/fullscreen.js`, `js/intro/sfx.js`, `js/screens/intro.js`,
`js/screens/title.js`, `js/screens/creator.js`, `tests/`.
**Not yours:** `assets/` (the icons are built), `tools/`, `script/script.md`, `js/audio.js`, the hero.

## Hand-back

`handbacks/<date>-warp-phone-shell.md`: what you built; the three suites' counts; every call you made; and
this list for Rick's phones, as checkboxes he can answer in a line each:

1. iPhone, Safari tab, landscape: is the status bar's title clear of the notch?
2. iPhone, ring switch on silent: do the intro's beeps play? What does the `?stats=1` line read?
3. iPhone: Share → Add to Home Screen. Does it open with no browser bars, and is the icon the hexagons?
4. Android Chrome: does Start go full screen and landscape? Does the gate's tap turn the screen?
5. iPhone, Safari tab, `?swipe=1`: swipe up on the game. Does Safari's bar shrink and the scene grow?
