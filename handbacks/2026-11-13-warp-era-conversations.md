# Hand-back: Warp brief 10 — the persona speaks from a close-up portrait (2026-11-13)

Branch `warp/era-conversations`, pull request against `era-look`. **Stacked on brief 09** (`warp/era-hero`, PR #16):
the window's placement is measured against the 56-px hero, so this branch was cut from that one rather than from
`origin/era-look`. Until #16 merges the pull request shows both diffs; after it, only this brief's.

## What I built

- **`js/engine/conversation.js`** (pure): `speakerOf(name)` (the script's prefix is the persona's name without its
  article: `THE CTO` → `CTO`), `personaLine(text, title)` (a line starting with `CTO:` is theirs and is shown
  without the prefix; narration that quotes them, another speaker, or `CTO` without a colon is not), `portraitFrame`
  (rest → talk1 → talk2 → talk1 at 120 ms while typing, the narrators' `blinkOpen` with the persona's own seed, the
  still under reduced motion), `PORTRAIT_CROP` (x 170–470, y 20–320 of the 640×428 picture) and `talkWindow(where,
  patch, scale)` (where the window goes and how wide it may be so it stays off the persona's patch).
- **`js/engine/window.js`**: `say(text, { portrait, maxWidth })` grows the message window a portrait on the left
  (a 300×300 canvas of the crop, shown at the height of four lines, 2 px dark frame, the window's own colours), the
  persona's name above the words in the accent blue, the words to the right with the usual line cap, **paging by
  four lines** so the window keeps the portrait's height. `tick` drives the mouth while the words type and the
  blink on its schedule; the canvas is repainted only when the frame changes.
- **`js/chapters/ch1.js`**: `persona: { name: 'ch1.persona.name', portrait: 'p1', where: 'top-left' }`. Nothing in
  the window's or the engine's code names a persona.
- **`js/screens/chapter.js`**: `line(key)` asks `personaLine`; the persona's lines open the conversation window
  with her portrait (still from `assets/portrait_p1.png`, patches from `assets/anim/portrait_p1_*` via the sprite
  loader, optional, loaded when the scenario starts). The CTO's calls, her question, "show me" and her last word
  go through it; the jab, the win, the room's and Look's narration stay ordinary windows. **She keeps talking in the
  room while her own words show** (brief item 4): her calls no longer quiet her; `look.cto`'s narration still does.
- CSS: `.msg.talk`, `.msg-portrait`, `.msg-name`, `.msg.top-left`, `.msg.top-right` (6 px from the top edge).
  Cache-bust: `css?v=14`, `js?v=25`.

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **252 passed** (was 242: `tests/conversation.test.js`, 10 tests) |
| `python3 -m pytest tools/tests -q` | **126 passed** (unchanged) |
| `npm run e2e`, one file at a time | **82 passed**: chapter 22 (3 new), creator 14, intro 17, walk-preview 9, menu 7, shell 9, weight 4 |

New e2e (both phone sizes): the CTO's first line shows the window with her name, a painted portrait of non-zero
size at ≥ 96 CSS px, inside the scene, clear of her patch, ending above the hero's shoulders; her room talk frames
keep playing while it is up; Look's narration shows no portrait and no name. Reduced motion: the still does not
change over 700 ms. Existing tests that compared her lines to the script now compare to what is shown (the prefix
dropped): `shown()` in `tests/e2e/_play.js`.

## Screenshots

`scratch/era-conversations/`: `cto-call-667.png`, `cto-call-844.png` (typing), `cto-call-typed-*.png` (complete),
`cto-look-*.png` (narration, an ordinary window). Only room 1 exists on this branch, so this is one room at two
sizes; room 3's top-right placement is data (`where: 'top-right'`) and is covered by the unit test, not a picture.

## What I changed in the brief's numbers, and what to look at

1. **The window covers the hero's head while he stands at the CTO.** The brief wants it where it hides neither
   figure. With the 56-px hero at x 148 (brief 09) and the CTO's patch at x 229, the two figures span x 148–305 and
   the hero's hair starts at y 52; a four-line window with the name is about 150 CSS px tall (≈ 87 scene px at
   667×375), so any window readable at the house 24 px font reaches his head. I kept the brief's layout and
   placement and made the window **clear of the persona** (its right edge stops at her patch: `talkWindow`'s
   `maxWidth`) and **end above the hero's shoulders** (y 92), which the e2e asserts. His head is under it. If Rick
   wants both figures clear, the only room is the column left of the hero (x 0–148 ≈ 257 CSS px at 667×375): a
   window with the portrait above the words would fit there at about 21 characters a line. That is a different
   layout from the brief's, so I did not build it; one line in the hand-back is the right place for the call.
2. **Top inset 6 px, not 10.** At 667×375 the window's bottom landed 2 px over the hero's shoulders at 10.
3. **Four lines a page** for conversation windows (the brief: "shown at the height of four lines of text"); the
   ordinary windows keep `linesFor` (5–7).
4. **The name is measured** so the text column is never narrower than it (`THE CLOUD ENGINEER` is wider than a
   short line); otherwise the column hugs the longest line, as windows do.
5. **The seed** for the blink schedule is the portrait id's last character code (`p1` → 49 … `p5` → 53), so the
   five personas blink on their own schedules without anything naming them.
6. `js/engine/window.js` was edited (it was off limits in briefs 07 and 08; this brief's "the message window grows a
   portrait" needs it). The change is additive: a window without `portrait` renders exactly as before.

## Not done / for Cloud Claude

- Scenarios 2–5 get the window when brief 08 lands by setting `persona.portrait` and `persona.where` (`top-right`
  for room 3) in their data; the `npc.call.*` lines in the script already carry the `CLOUD ENGINEER:` style prefix.
- No script slot is needed.
