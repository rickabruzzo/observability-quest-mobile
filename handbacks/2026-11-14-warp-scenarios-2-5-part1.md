# Hand-back: Warp brief 08, part 1 — the engine made general, and scenario 2 (2026-11-14)

Branch `warp/scenarios-2-5`, pull request against `era-look`. **Stacked on briefs 09, 10 and 07** (#16, #17, #18),
as the brief orders them. The brief welcomes two pull requests: this is the first (the engine general plus
scenario 2); scenarios 3 to 5 follow on the same branch as a second pull request.

## What I built

**The chapter screen plays any scenario from data and names none of them.** `js/screens/chapter.js` was
rewritten around one shape (`tests/chapter-data.test.js` holds it, and greps the screen for CTO, Otto, Einar,
monitor, vitals, whiteboard, company names: none):

- `room` (plate, floor, walk range, start, `heroScale`, hotspots whose `use` is `{ scene: 'pc' }`, `{ scene:
  'wall' }` or `{ action: 'persona' }`, plus Look-only or line-only extras);
- `persona` (card fields, portrait, window side, `loop` `'always'` for the CTO's phone call or `'speak'`,
  `frames: { talk, rest, idle, win }`, `calls`, `ask`, `options: { wrong: { id, key, jab }, hc: { key, show } }`);
- `wall` (close-up image, an optional `fixedImage`, the `chart` line, `text` keys, the room's and the close-up's
  rectangles, and a **painter**);
- `pc` (menu items with an `action`: email, status, tool, leave; `status` lines; `deploy`; `leave`; `locked`);
- `tools.old` (with `paint` and `close`), `tools.hc` (its screens), `win` (a list of keys), `verdict`.

**The wall display is one small painter per scenario**, `js/chapters/chN-wall.js`, pure apart from the canvas:
`room(g, s)`, `close(g, s)`, `text(s)` (boxes of real text placed from the close-up's rectangles, VT323, condensed
sideways to fit, never cut), `hits(s)` (taps that step a box), `frameKey(s)`, `recovered(s)`, `image(s)`,
`tone(s)`; `s` is `{ state: broken | found | fixed, t, tAll, reduced, nudges, text, cfg }`. Scenario 1's vitals
monitor moved into `ch1-wall.js` unchanged in behaviour (`tests/wall-painters.test.js`).

**The persona's frames** (`personaFrame` in `js/engine/persona.js`): talk frames alternate with the rest frame at
320 ms only while their own line is on screen; otherwise the rest frame, with the idle frames every 4–10 s for
0.6–1 s on the scenario's own schedule; the win frame from the win on, reduced motion included; reduced motion
rests. The CTO keeps her phone loop (`loop: 'always'`, quiet while a line about her is open or the card is up).

**The cards' animations:** `cardFrameAt` cycles card → 1 → 2 → 3 → 2 → 1 at 180 ms from `assets/cards/cards.json`'s
`frames` (fetched once; nothing in the code names a card); the picture is drawn on a 128×80 canvas so the frames
swap without a flicker; `phoneRows` scrolls Knight Watch's notifications (a per-card `overlay: { kind: 'phone',
x, y, w, h }` in the data, used by scenario 4 in part 2). Reduced motion: the still card.

**Scenario rules renamed generically** in `js/engine/scenario.js`: `personaUse`, `wallState` (broken / found /
fixed), `statusLine`, `decide(s, 'wrong' | 'hc')`, `s.wrong`. The stopwatch's phases are `wall` and `persona`
(labels "Wall display", "Persona"), the counts `status`, `wall`, `wrong`, `cards`; it reports per scenario as
before. `CHAPTERS` lives in `js/chapters/index.js`.

**Scenario 2** (`js/chapters/ch2.js`, `ch2-wall.js`): the war room from brief 08's table (pc 0,76,136×112; wall
113,26,197×92, Look only; npc 255,52,48×120; the persona over the wall where they overlap), stand points from
brief 09 (pc 82, npc 184, start 156). The Cloud Engineer studies the board (`R2_npc_look`), scratches his head or
makes a mark now and then, talks only while his words show, caps his marker for the win (`R2_npc_win`). **The
whiteboard:** the blank sheet (close-up x 49–107, y 32–100) carries one theory at a time in marker ink
(`#2B2F36`), two lines split at ` / `, a tap steps to the next; nothing moves while it is broken; fixed, the
close-up is `R2_wall_closeup_fixed` and the sheet cycles `wall.ok`; in the room the path (126,75)…(233,71) draws
itself in over 1.2 s in `#E2FE52`, 1 px, under his frame (reduced motion: at once). Old Artifact is 350 green
tiles. Its Honeycomb screens are `assets/screens/ch2_hc.json`.

**The menu:** `AVAILABLE` is `[1, 2]`; `?ch=2` works; rows 3–5 still show "coming soon" until part 2.

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **284 passed**, 1 skipped (the scenarios 3–5 data test, until part 2) |
| `python3 -m pytest tools/tests -q` | **126 passed** |
| `npm run e2e`, one file at a time | **94 passed**: chapter 29, scenarios 5 (scenario 2), creator 14, intro 17, walk-preview 9, menu 7, shell 9, weight 4 |

`tests/e2e/scenarios.test.js` is data-driven over every built scenario above 1: the shortest path wins, the
persona holds the win frame, Solved ticks; the persona's calls in order with the card first; Leave locked before a
tool is tried; the old tool's prompt is a misstep and its close label is the scenario's; the wrong advice gets its
jab and comes back greyed; "show me" opens the investigation; the wall close-up opens with its line, its text
inside its boxes at ≥ 14 px, closes by Back and by a tap off the glass; the PC text stays inside its screen at
667×375 and 844×390; reduced motion plays through with the persona at rest and the wall still. Scenario 1's tests
pass unchanged in meaning (the debug hooks are now `wall` and `personaFrame`; the stopwatch keys renamed).

## Scenario 2: how the wall display looks at 667×375

`scratch/scenarios/ch2-*.png`. **Broken:** the board as painted, the sheet reads THEORY 1 / IT'S DNS; a tap steps
it (…COSMIC RAYS); the room shows the board as the art has it. **Found:** the same (a whiteboard learns nothing).
**Fixed:** the close-up is the painted board with the glowing path and the sheet reads THEORY 7 / NODE 17; in the
room a thin yellow-green line runs from the board's left edge to his patch. The sheet text is 17 px VT323 at
667×375, two lines, centred, condensed sideways only if a line is wider than the sheet (none is).

## Timings

Scripted timings for every scenario come with part 2 (the script, `scratch/persona-card/timings.mjs`, is written
for scenario 1's menu ids; part 2 generalises it and reports all five).

## Rectangles I nudged, lines that would not fit, strings that need a slot

- None nudged in scenario 2. The brief's rectangles were checked against the built files and fit.
- No line would not fit: the sheet's theories are two short lines; the PC menu in the smallest screen (160×105)
  holds five items at 44 px.
- Strings: scenario 4's coding-agent close label (`[Close Claw Codez]`) will need a slot, `ch4.hc.close`; noted
  in the backlog for part 2.

## Calls I made (and what each costs if wrong)

1. **Hotspots are typed by `use`, not by id**, so scenario 1 keeps its ids (`cto`, `monitor`) and its tests, and
   2–5 use `npc`, `wall`. Cost if wrong: none to players.
2. **Scenario 1's wrong option keeps its id `sign`** (`options.wrong.id`); 2–5 use `wrong`. The engine maps either
   to `decide(s, 'wrong')`.
3. **The wall's clock restarts on the fix** (`s.t`), as scenario 1's did; `s.tAll` runs from entering the room.
   Scenario 2's path uses `s.t`.
4. **The card's picture is a canvas** (so frames and overlays draw without flicker); the brief-07 e2e now expects
   `CANVAS` 128×80 for the art, and the crop fallback is still a 112×70 canvas.
5. **A tap on a sheet steps the theory immediately** (the nudge's step is the current step, as before).
6. **Scenario 2's card crop fallback** is the persona's patch top (234,34,76×48) from the plate, for the case where
   `P2_card.png` fails to load.

## For Cloud Claude / Rick

- The persona's frame chooser's idle schedule is per scenario (`seed: ch.id`); if a scratch and a mark land too
  close together for Rick's eye, the gap and hold ranges are two constants in `js/engine/persona.js`.
- Off-limits files untouched: `assets/**`, `art-drops/**`, `tools/**`, `script/script.md`, the spec, the intro,
  the creator, `js/engine/window.js`, `js/engine/message.js`, `js/claim.js`. `js/menu.js` (`AVAILABLE`) is in the
  brief's list.
