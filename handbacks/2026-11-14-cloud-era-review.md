# Cloud Claude review — Warp briefs 09, 10, 07 and 08 on the era-look fork (2026-11-14)

Reviewed the five stacked branches up to `warp/scenarios-3-5` (3d555f5): the hand-backs, the diff against
`era-look`, all three suites, and every scenario in a browser at 844×390 and 667×375 (room, persona card,
first conversation, wall close-up, and the intro's bedroom). This branch, `desktop/era-review`, is that stack
plus one commit. Merging it into `era-look` lands all five.

## Suites

| Tree | Unit | Python | e2e |
|---|---|---|---|
| `warp/scenarios-3-5` as handed back | 303 | 126 | 109 |
| with this branch's commit | 314 | 126 | 113 |

## Found and fixed here

1. **Scenarios 3 and 4 never showed the conversation portrait.** The window recognises a persona's line by a
   prefix built from their card's name without its THE (`speakerOf`). The script wrote `DEVELOPER:` and `SRE:`
   for cards named THE FRONTEND DEVELOPER and THE SRE ON CALL, so their lines came up as narration with the
   prefix still on them. The e2e tests compared against the same function, so they passed. Fixed in the script
   (the twelve lines now start `FRONTEND DEVELOPER:` and `SRE ON CALL:`; the prefix is dropped on screen) and
   the rule is now written in the script's conventions. `tests/script-personas.test.js` holds it for every
   scenario, and `tests/e2e/scenarios.test.js` checks the window in a browser for scenarios 2 to 5.
2. **Room 3's window is the narrow one** (it sits right of the persona), and THE FRONTEND DEVELOPER ran 16 px
   past its edge. The name now wraps at a space when it cannot fit (`css/game.css`, one rule), and the window
   counts the name's letter-spacing when it sizes itself (`js/engine/window.js`, one line), so a name that can
   fit stays on one line. The same e2e test measures both at both phone sizes.
3. **`ch4.hc.close`** is a script slot (`[Close Claw Codez]`) and `js/chapters/ch4.js` names it. The new unit
   test fails if any tool's title, intro, exit or close label is a string in the data instead of a slot.

## The three calls Warp flagged

- **Bedroom at 0.85: keep.** His door is 132 px; at 0.85 he is 116 px, seven eighths of it, which is a person
  beside a door. At 0.75 he would be three quarters of it. His hair crosses the subtitle's bottom rows for the
  two seconds he stands in the middle of the room; if that bothers Rick, move the subtitle, not the hero.
- **The conversation window over the hero's head: keep.** The persona is the one speaking and stays in view.
  The alternative column holds about 21 characters a line, so every line would take more pages to read.
- **Room 3's TV glow: keep.** It is an 8-px dithered halo and reads as light on the brick. `GLOW` in
  `js/chapters/ch3-wall.js` is the number to change if Rick wants it softer.

## For Rick to look at on the fork

- **The hero's build.** He is the right height now, but his torso and arms are straight-edged blocks beside
  personas drawn with curves and shading. Warp's hand-back says the same: the generator reached the model
  sheet's proportions, not its outline.
- **Where he starts.** In every room he begins standing in front of the wall display (monitor, whiteboard, TV,
  star map, atrium monitor). The start points are from brief 09's table, so this is the brief's doing.

`menu.soon` is still a script slot and the menu still reads it for a row that is not enabled; with five
scenarios playable no row shows it.
