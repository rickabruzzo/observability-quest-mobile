# Cloud Claude review — Warp brief 13, the game on a real phone (2026-11-15)

Reviewed `warp/phone-shell` (b7a8b05): the hand-back, the whole diff, the three suites, and the result in a
browser at 844×390, 667×375, 800×360 and in portrait (the title, the creator with sound on and off, a
scenario's card, both rotate-gate lines, the `?stats=1` bar). `desktop/phone-shell-review` is `era-look` with
Warp's branch merged in and two changes on top. They merged cleanly.

**What no test here can show is what a real phone does.** Everything below is a headless Chromium with the phone
APIs stubbed. The list at the end is for Rick's iPhone and an Android phone.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/phone-shell` as handed back | 360 | 146 | 138 |
| `desktop/phone-shell-review` | 361 | 165 | 139 |

Python is 165 because `era-look` gained the painted hero's and the brand marks' tests since Warp branched.

## What is right

- **The deploy.** `.vercelignore` is the allow-list, and the test server now serves that list and nothing
  else, so all 139 browser tests prove the deployed files are enough. No existing test needed a file outside it.
- **Sound.** One context for the whole game, a master gain everything connects to, unlocked by the first tap
  anywhere and brought back by any later tap; the intro shares it and no longer closes it. The Sound button is
  at the top of the left column on every screen and clear of the creator's tabs at all three sizes.
- **Full screen.** Start on the title and on the creator ask for it inside the tap and the screen change never
  waits. A refusal is silent.
- **The gate** shows the right line for the phone, and its tap turns the screen where that is possible.
- **`?stats=1`** reads `Observability Quest · sound: running · no session API · 44100` on a desktop and fits
  beside "Solved" at 667 wide.
- **Existing tests:** only `windowed(ctx)` was added to each browser context (it makes the headless browser
  refuse full screen, which it would otherwise grant and then refuse to resize). No assertion changed. The one
  change the brief allowed, in `tests/intro-sfx.test.js`, is as described.
- Warp's eight calls are sound. The two worth knowing: the Sound button reads black for on and red for off
  (red for on read as an alarm), and a sound asked for before any tap makes the context early, suspended.

## Changed here

**1. An iPad never goes full screen by itself.** The brief's table had iPhone and Android and forgot the iPad,
which does have the Fullscreen API. Its Safari takes a tap-driven game's taps for typing on a fake keyboard,
shows a warning and throws the page out of full screen (WebKit bug 206853, and Apple's forums are full of it
for games). `detectFullscreen` now reports `ios` (`navigator.standalone` is a boolean on an iPhone or iPad and
absent everywhere else), `shouldGoFullscreen` is false there, and the gate shows the rotation-lock line there.
Android is unchanged. Unit and browser tests added.

**2. With the game's sound off, the player's own music is left alone.** The playback audio session is what
lets the game be heard on a silenced iPhone, and it also pauses whatever the player was listening to. That
cost was accepted for a game that is making sound. With the Sound button off there is nothing to hear, so the
game now asks for the ambient session while muted (which mixes with other audio) and for playback again when
unmuted. A player who arrives muted from an earlier visit never takes the phone's audio at all. Unit test
added. Unverified on a phone, like the rest: item 6 below.

## Not changed, worth knowing

- **Android, opened from the Home Screen:** the gate would say "tap here" and the tap would do nothing. The
  manifest locks that app to landscape, so the gate should never show there.
- **Typing while full screen (Android):** the name box in the creator, and later the claim form, are typed into
  while full screen. Android Chrome allows it. Worth a look when the claim form is built.
- **The cues are still too low for a phone's speaker in places** (the step is a 110 Hz triangle). If item 2
  below reads `running · playback` and Rick still hears little, that is why, and it waits for the soundtrack.

## For Rick's phones

The first preview after this merges is the first real proof of any of it.

0. On the preview: does the game load, and is `/briefs/PROTOCOL.md` a "not found"?
1. iPhone, Safari tab, landscape: is the status bar's title clear of the notch?
2. iPhone, ring switch on silent: do the intro's beeps play? What does the bar read with `?stats=1`?
3. iPhone: Share → Add to Home Screen. Does it open with no browser bars, and is the icon the hexagons?
4. Android Chrome: does Start go full screen and landscape? Does the gate's tap turn the screen?
5. iPhone, Safari tab, `?swipe=1`: swipe up on the game. Does Safari's bar shrink and the scene grow?
6. iPhone, your own music playing: tap Sound off. After you start your music again, does it keep playing
   while you play? Tap Sound on: the game takes over again (expected).
