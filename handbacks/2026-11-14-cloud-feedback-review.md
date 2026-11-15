# Cloud Claude review — Warp brief 12, the play-through fixes (2026-11-14)

Reviewed `warp/feedback-fixes` (ca549c8): the hand-back, the diff, the three suites, and the screens in a browser
at 844×390 and 667×375 (the after-scenario screen, three narrators' verdicts, Charity on Claim, rooms 3, 4, 5
and 2). `desktop/feedback-review` is `desktop/feedback-1114` (the script fixes, the cards, the protocol, the
briefs) with Warp's branch merged into it and one fix on top. The two merged cleanly. Merging
`desktop/feedback-review` into `era-look` lands all of it.

## Suites

| Tree | Unit | Python | e2e |
|---|---|---|---|
| `warp/feedback-fixes` as handed back | 317 | 126 | 117 |
| `desktop/feedback-review` | 322 | 126 | 118 |

## What is right

- **After a scenario:** the prompt and two buttons, no table; the table with `?stats=1`.
- **The verdict:** the portrait on the left with its bottom on the scene's edge, the words in one window beside
  it under the narrator's name, one page at both sizes. Charity the same, with her header.
- **Room 3:** no halo; the page shifts between three close tints.
- **Housekeeping:** the seven sibling folders are gone.
- The three files outside the brief's list (`verdict.js`, `window.js`, `index.html`) are fair calls.

## Found and fixed here

**The wall was kept out of far more than the persona.** Brief 12 said to keep the wall's painting off the
persona's patch. The patch is the box the talk frames move in, and it is much bigger than the figure. So in
room 3 a strip of the TV inside that box never took the page's tint (a pale stripe down the left of the
screen), and in room 4 the chat column and the green health line stopped short of the panel's edge. That was
the brief's wording, not Warp's mistake.

Now a room's data lists the few rectangles where the plate's figure really stands in front of the display
(`persona.covers`): her fingertips in room 3, the SRE's head, hand and shoulder in room 4. Rooms 1, 2 and 5
need none. The wall stays out of those and nothing else. Warp's room 4 test is replaced by two that say this
(`tests/e2e/chapter.test.js`), plus `tests/covers.test.js`.

## For Warp, in brief 11

- The verdict portrait is cut in a straight line on its right, most visibly through Charity's hair. Brief 11,
  section D, asks for the picture to run to its own right edge under the window.
- `persona.covers` and its tests stay when `paintRoom` is reworked for depth.
