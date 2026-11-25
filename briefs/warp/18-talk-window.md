# Warp brief 18: the conversation window clears the hero's head

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/talk-window` from `origin/era-look`;
the pull request's base is `era-look`.

## Why

When a persona speaks, their window parks at the top of the room on the side away from them (brief 10,
`talkWindow` in `js/engine/conversation.js`). It is four lines tall, and the hero stands under it. Measured on
`era-look` (1775824) with the hero at each persona's talk spot, the window's bottom edge against the top of his
head, in the room's 320×200 pixels:

| Room | 844×390 | 667×375 |
|---|---|---|
| 1, the CTO | covers 4 | covers 10 |
| 2 | covers 22 | covers 28 |
| 3 (window top right) | covers 28 | covers 35 |
| 4 | clear by 2 | covers 4 |
| 5 | covers 14 | covers 32 |

There is no room beside him for a window with the portrait: the widest gap between him and the scene's edge,
away from the persona, is 142 to 186 room px, about 13 characters a line once the portrait is in.

Rick, 2026-11-25, choosing between this and smaller type for everyone: **fit it per room.**

## What changes

**A conversation window takes as many lines as fit above the hero's head, at most four, at least two.**

- Worked out when the persona's line opens, from where the hero is actually drawn at that moment:
  `heroBox()` in `js/screens/chapter.js` (its `y` is the top of his hair) and the scene's scale. The bedroom's
  coda does the same sum for its narration (`narrationLines` in `js/coda/timeline.js`); use that as the pattern,
  but measure the window's chrome and the name's height from the element rather than copying the coda's
  constants, because the conversation window has the name above the words.
- **Clear means:** the window's border box, its 2 px outline included, ends at least 2 CSS px above the top of
  his head. The drop shadow may touch his hair.
- **Only where the window is over him.** If the window's left and right edges do not overlap his box, it keeps
  four lines.
- **When he is not in the room** (a close-up, a tool screen, the persona's card), four lines, as now.
- **Never fewer than two.** If two do not clear him on some screen size, use two anyway and say so in the
  hand-back with the numbers.
- The window pages by that number: a line that needs more pages gets them. Nothing about the words changes.

**The portrait matches the window's height.** Today it is 4.4em square, the height of the name and four lines.
With fewer lines it is the height of the name and that many lines, still square, still crisp (whole-pixel
scaling as now, or the nearest crisp size below). The words column keeps its width rule.

What this should come out as, from the numbers above (yours to confirm): rooms 1, 4 and 5 three or four lines,
rooms 2 and 3 two, depending on the phone.

## Not in this brief

- Narration windows (no portrait) and their placement.
- The persona's side, the window's width rule (`talkWindow`'s `maxWidth`), the type size, the hero's talk spots.
- The verdict and Charity's windows.

## Tests

Pure first, then the browser.

- A unit test for the rule (lines from the head's top, the scale and the window's measurements): four when it
  all fits, fewer as his head rises, never under two, never over four, four when the window does not overlap him.
- `tests/e2e/`, at **844×390 and 667×375, all five rooms**: walk to the persona, open their first line, and assert
  the window's bottom edge (outline included) is at least 2 CSS px above `heroBox().y`, the window is still clear
  of the persona's patch, the portrait is square and as tall as the name and the lines, and the page shows the
  expected number of lines. Seed the room with `?ch=N`, as the scenario tests do.
- Every existing test that assumes four lines in a conversation window is updated to read the number from the
  window, not removed.

Expose what the tests need on `window.__oq.chapter` (for example the open window's line count).

Run all three suites, the browser files one at a time.

## Files

Likely: `js/engine/conversation.js`, `js/engine/window.js`, `js/screens/chapter.js`, `css/game.css`, their tests,
and a browser test file. Nothing in `tools/`, `assets/` or `script/`.

## Hand-back

`handbacks/<date>-warp-talk-window.md`: what you built, the judgment calls, the three suites' counts, the line
count each room got at both phone sizes, and one capture per room at 667×375 with the persona's first line up.

## Review (Cloud Claude, 2026-11-25)

Built as briefed (`handbacks/2026-11-25-warp-talk-window.md`); reviewed in
`handbacks/2026-11-25-cloud-talk-window-review.md`. What differs from the text above:

- **A name wider than the words column is set smaller, down to 16 px, so it stays on one line.** Room 3's name
  wrapped and put the window on his hair; every room now clears him at both phone sizes.
- **The portrait never grows past today's four lines.** This brief said today's portrait was the name and four
  lines; it was four lines. It now shrinks to the name and the lines and a four-line window is as before.
