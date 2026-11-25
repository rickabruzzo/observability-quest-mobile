# Warp hand-back: brief 18, the conversation window clears the hero's head (2026-11-25)

Branch `warp/talk-window` from `origin/era-look` (efbb02b). Pull request into `era-look`.

## What I built

- **The rule** (`talkLines` in `js/engine/conversation.js`, with `TALK_MAX` 4, `TALK_MIN` 2, `HEAD_CLEAR` 2): from his
  drawn box in scene px (`heroBox()`, `y` the top of his hair), the scene's scale, and the window as measured in CSS px
  (its outline's top, left and right; the chrome: outline, border and padding; the name with its margin; one line), the
  number of lines whose window ends 2 CSS px above his head, held between two and four. Four when the window's left and
  right edges do not overlap his box, or when he is not there.
- **The window** (`js/engine/window.js`): `say()` takes `clear: { hero, scale }`. Every measurement is read from the
  element (computed outline, border, padding, the body's line height, the name's height as set at the window's width),
  nothing copied from the coda. Because the portrait's size changes the words column's width, which can rewrap the
  name, which changes the height, it settles in at most four passes (it takes two everywhere today).
- **The portrait** is as tall as the name and the lines, still square: its border box is the words column's height,
  rounded down to a whole CSS px. The words column's minimum height is that many lines, so a short last page does not
  shrink the window. The words column keeps its width rule (whatever the portrait leaves, up to `MAX_LINE_PX`).
- **The chapter** (`js/screens/chapter.js`) passes `clear` when the persona speaks with him in the room (`room`,
  `decide`, `ending`). In any other state (the card, the PC, a tool screen, the wall) it passes nothing: four lines.
- **For the tests:** the element carries `data-lines`, and `window.__oq.chapter.window.lines` exposes it.
- `css/game.css`: a comment only. The 4.4em rules stay as the default the script overrides.

## Lines each room got

His head's top against the window's bottom (outline included), in CSS px. "Clear" means at least 2.

| Room | 844×390 | 667×375 |
|---|---|---|
| 1, the CTO | **3**, clear by 16.6 | **3**, clear by 7.3 |
| 2 | **2**, clear by 9.8 | **2**, clear by 2.5 |
| 3 (window top right) | **2**, covers by 1.0 | **2**, covers by 8.9 |
| 4 | **3**, clear by 27.8 | **3**, clear by 17.7 |
| 5 | **2**, clear by 24.5 | **2**, clear by 16.3 |

Every window in these rooms is over him, so none keeps four. In each room, one more line would cover him.

**Room 3 does not clear him with two lines** (brief: "use two anyway and say so"). Its name, THE FRONTEND DEVELOPER,
wraps onto two lines in the narrow window beside the persona (322 CSS px wide at 844, 300 at 667), which adds 20 px.
Two lines end at 126.8 CSS px, and his hair starts at 125.8 (844) and 117.9 (667): it covers about 0.5 and 5 room px
of his hair. The fixes are all outside this brief: a shorter name on the window, his talk spot a little lower or to
the side, or tighter letter spacing on the name.

## Judgment calls

1. **The portrait is the height of the name *and* the lines, four-line windows included.** The brief says that today
   4.4em is "the height of the name and four lines". In fact it is four lines alone (1.1em each): the portrait was
   105.6 CSS px inside, against a 127.6 px words column. I followed the brief's rule and its test, so a four-line
   window's portrait now fills the column (about 123 px inside). *If wrong:* a four-line window's words column is about
   18 px narrower where its width is capped. Going back to "lines only" is one term in `fitTo` (`js/engine/window.js`),
   but a two-line portrait would then be 53 px, small for a face.
2. **"Crisp."** The portrait is 300 canvas px shown at 74 to 101 CSS px. That is a downscale, so it is not whole-pixel
   scaling, then or now. I size it in whole CSS px (rounded down) and keep `image-rendering: pixelated`. *Cost:* the
   portrait can be up to 1 px shorter than the words column.
3. **"Over him"** compares the window's outline box with his drawn box (`heroBox`: `x` to `x + w`), not his feet's
   column.
4. **Room 4 at 844×390 gets three.** The brief's table had it clear by 2 with four, but four lines end 1.4 CSS px above
   his hair once the 2 px outline is counted, and the rule asks for 2.
5. **Room 5 gets two at both sizes.** The brief guessed three or four; three would end 1.9 CSS px into his hair at
   844×390.
6. The rule sees his box at the moment the line opens. If he were still walking, the count would be for that frame.
   Today every persona line opens after the walk.

## Tests

- Unit (`tests/conversation.test.js`): four when it fits, fewer as his head rises (never growing), never under two,
  never over four; four when the window is not over him (both sides, and one pixel in), or he is not there.
- Browser (`tests/e2e/talk-window.test.js`), all five rooms at both phone sizes, seeded with `?ch=N`. It walks to the
  persona and opens their first line, then checks:
  - the window takes two to four lines;
  - it clears his head by 2 CSS px with the outline counted (or sits at the floor of two), and one more line would not
    clear;
  - four when not over him;
  - it stays off the persona's patch;
  - the portrait is square and as tall as the name and the lines;
  - every page but the last holds exactly that many lines, and the last up to that many.
  It fails on `era-look` as it was and passes now.
- No existing test assumed four lines. Room 1's "ends above his shoulders" and "portrait ≥ 96 px" still hold.

## Suites (as last run)

| Suite | Result |
|---|---|
| `npm test` | **438 passed** |
| `python3 -m pytest tools/tests -q` (the main folder's `scratch/venv`) | **151 passed** |
| `npm run e2e`, one file at a time | **185 passed**: chapter 34, creator 14, ending 6, feedback-art 11, intro 18, menu 7, painted-hero 12, phone-shell 14, scenarios 30, shell 9, **talk-window 10** (new), title 7, walk-preview 9, weight 4 |

## Captures (667×375, the first line typed out)

In `scratch/talk-window/`, copied to the main folder's `scratch/talk-window/`: `room1-667x375.png` to
`room5-667x375.png`.

## Files

`js/engine/conversation.js`, `js/engine/window.js`, `js/screens/chapter.js`, `css/game.css` (comment),
`tests/conversation.test.js`, `tests/e2e/talk-window.test.js`, this hand-back. Nothing in `tools/`, `assets/` or
`script/`.

## No script slot needed.
