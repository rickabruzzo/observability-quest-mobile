# For Cloud Claude: phone playtest set-up, and Rick's first requests from it (2026-11-14)

From Art Claude. Rick asked for this to go to **Cloud Claude**, the central build thread. It is code work, so it
probably becomes a Warp brief; that is your call. Nothing in the game was changed. The only commit outside this
file is an empty commit on `art/hero-painted-test` that triggered the first preview build.

## 1. Where the playtest build runs (set up tonight)

- **Vercel project:** `observability-quest-mobile-tools`, on the Hobby plan, connected to
  `rickabruzzo/observability-quest-mobile`.
- **Settings, which I checked in the dashboard:**
  - Preset: Other.
  - Root Directory `./`, Output Directory `.` (override on).
  - Build and Install commands: none.
  - The production branch is still Vercel's default, `main`, which is the v0.1 game.
- **The playtest URL** is the branch preview of `art/hero-painted-test` (era-look plus brief 05):
  `https://observability-quest-mobile-to-git-1ca41d-rick-abruzzos-projects.vercel.app`.
  It stays the same across pushes to that branch.
  - Once PRs #23 and #24 are merged, the **era-look** branch gets its own preview on its next push. That is the
    URL to give testers from then on.
- **Vercel Authentication is on (standard protection).** Visitors must be logged in to Vercel, so other testers
  need a shareable link (Share on the deployment page). I did not change it.
- **The project name will become the production URL.** It reads `observability-quest-mobile-tools` because
  the project was first imported with root `tools`. `docs/infra-requirements.md` wants `observability-quest`.
  Rick should rename it (Settings → General) before any QR code is printed. Tell him if he hasn't.

## 2. Rick's requests from playing on his iPhone

His two screenshots show the creator and the CTO's card in a landscape browser tab. The browser bar takes the
top of the screen, and the scene is pillar-boxed with the button columns beside it.

> "It would be nice if the game took up the entire screen, also if it could force full screen instead of showing
> the browser"

> (earlier) "I hear sound in the browser desktop but not the mobile"

## 3. What I told him, and what the code does today

**What the code already does:**
- `index.html` has `viewport-fit=cover`.
- The columns pad for the safe areas: `css/game.css` lines 32–33.
- `fitStage` in `js/engine/stage.js` already sizes the scene height-first: viewport height minus the status bar,
  at 16:10.

So the game already fills the height it is given. The height is lost to two things: the browser's own bars, and
the 30-ish-px status bar (`--status-h`). The 16:10 scene can never fill a 19.5:9 phone's width; that space goes to
the button columns.

**What browsers allow (please verify before building on it):**
- **iPhone:** a web page cannot hide the browser bars, in any browser. They all run on WebKit, and iPhone WebKit
  has no Fullscreen API for elements; iPad does.
  - The way to get no bars on iPhone is a **Home Screen web app**: a web app manifest with
    `"display": "fullscreen"` (or `standalone`), plus `apple-mobile-web-app-capable` and
    `apple-mobile-web-app-status-bar-style`, plus an icon.
  - It opens with no bars when launched from the icon.
- **Android Chrome:** `document.documentElement.requestFullscreen()` from a user tap works. After it,
  `screen.orientation.lock('landscape')` works too. Back or a swipe exits.

**Sound:**
- In era-look the only sound in play is the intro's beeps and lamp click: `js/intro/sfx.js`, created and resumed
  in the Start tap (`js/screens/intro.js:237`).
- The title-loop synth in `js/audio.js` is not called anywhere.
- On an iPhone with the ring/silent switch on silent, Web Audio is muted. I asked Rick to check the switch; he
  has not answered.
- If sound should play regardless of the switch (a loud booth), `navigator.audioSession.type = 'playback'`, set
  in the Start tap, does that on Safari versions that support it.
- Each intro entry also makes a new `AudioContext`. One shared context, created and resumed in the first tap,
  is safer on phones.

## 4. Suggested scope for the brief

These are my suggestions; Rick has not ruled on them.

1. **A Home Screen web app.**
   - Add a manifest (`display: fullscreen`, `orientation: landscape`, black theme and background, name and
     short name).
   - Add the Apple meta tags.
   - Use an icon from the official Honeycomb files in `assets/` only; never a generated logo (house rule 6).
2. **Android:** on the first real tap (Start on the title or creator), request full screen and lock landscape,
   ignoring failures quietly.
3. **iPhone in a browser tab:** a one-time, dismissible hint, "Add to Home Screen to play full screen". It must
   never appear in standalone mode (`navigator.standalone` / `display-mode: fullscreen|standalone`).
4. **More height for the scene.**
   - In full-screen or standalone mode, make the status bar thinner or move "Solved: N of 5" into a column.
   - Let `fitStage` use the freed height.
   - Keep the 44 px touch targets (`uiScale`).
5. **Sound on phones:**
   - one shared `AudioContext`, unlocked in the first tap;
   - `audioSession.type = 'playback'` where supported;
   - an e2e check that the context is `running` after Start.

**Before booth use:** the booth flow is a QR code that opens the game in the browser, not an installed app. On
iPhone, (1) and (3) help playtesters; booth players will mostly get (4) and the browser bars.
