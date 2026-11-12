# Warp hand-back — brief 03: scenario 1 on its real room (the PC, Otto's vitals, the CTO)

Branch `warp/ch1-room` (worktree `~/Documents/oqm-warp-ch1-room`). Built on `f0de0c2`, then rebased onto `origin/sci-adventure` at `afe4a69` (the protocol change, docs only) before pushing. Three build commits plus this hand-back:

- feat(ch1): pure parts: `js/engine/vitals.js`, `js/engine/scenario.js`, the three hotspots, the runlog's new phases and counts, their tests
- feat(ch1): the real room, the PC and its menu, the monitor close-up, the CTO's decision; the eight retired slots deleted; e2e rewritten
- fix(ch1): lights onto the art's chips, traces inside their frames; README and backlog

## Suites (last run, in the worktree)

- `npm test`: **215 pass, 0 fail**. New: `tests/vitals.test.js` (12), `tests/scenario.test.js` (6). `room.test.js` and `runlog.test.js` are updated for the new room and phases.
- `python3 -m pytest tools/tests -q`: **82 passed**. As in brief 02, this ran from a scratch venv built from `tools/requirements.txt`.
- `npm run e2e`: **76 pass, 0 fail**. `tests/e2e/chapter.test.js` is rewritten (17 tests) and `_play.js` has new moves. `menu.test.js` is unchanged and passes on the new shortest path.
- `git diff sci-adventure -- assets tools js/intro js/screens/intro.js js/menu.js docs/superpowers tests/fixtures script` shows only `script/script.md`, with 24 lines deleted: the eight slots, and no other words touched.

## What I built

- **Room.**
  - `R1_exec_floor` with three hotspots, using the brief's rects and stand points. Feet are on y 192, the walk range is 0–292, and the hero starts at 142.
  - Hotspots are listed pc, cto, monitor, so the monitor wins the overlap. `monitor` is `walk: false`.
  - The engine gained only `use: { scene }`, `use: { action }` and `walk: false`. `checkRoom` doesn't ask a non-walking hotspot for a stand point.
  - `js/engine/images.js` loads `assets/rooms/ch1.json` and its five PNGs when the class card opens. Dismissing the card waits for them, up to 6 s; if they fail, the room plays on a flat fill.
  - The code-drawn placeholder room is deleted.
- **Otto's vitals.** `js/engine/vitals.js` is a pure function of the elapsed ms, the state, the pools and any taps.
  - Boxes: one event per step at most, 0.6–1.2 s apart, never the same box twice running, never a stat already showing, and one garble step per change.
  - Lights: three blink rhythms, red. OK state: steady green.
  - Output: critical types, holds with a blinking cursor, glitches and starts over. OK types the whole answer and holds.
  - Heartbeat: critical is erratic with flat stretches; OK is one fixed rhythm.
  - Reduced motion gives one still per state, and a tap still steps a box.
  - **In the room** it's motion only: the trace, the lights, and a cursor plus typed dots in the output panel.
  - **Close up**: the full readout. Stats and output are DOM text placed from the brief's rectangles, VT323 at `18px × --ui-scale`. `ch1.monitor.chart` shows once per visit. A tap on a box steps it. **Back** in the right column, or a tap off the glass, returns to the room.
- **PC.** The `R1_pc_closeup` scene; the title and menu sit inside the CRT rectangle, green on dark, every item 44 px.
  - **Email** lists the five subjects; opening any shows the reply and returns to the menu.
  - **Vitals** shows `.before`, then `.old`, then `.hc`.
  - **Cave Logs / Honeycomb**: the existing tool screens, rules and words unchanged. Progress is kept per tool. Each has a close button.
  - Closing Cave Logs shows `ch1.old.exit` over the PC menu. Finishing Honeycomb shows its result and returns to the PC menu, and Otto goes OK at that moment.
  - **Leave computer** shows `ch1.pc.leave.locked` until a prompt has been picked in either tool, right or wrong; opening and backing out doesn't count. It's never greyed. Leaving puts the hero at x 87.
- **CTO.**
  - Talk loop: plate, talk_1, plate, talk_2, at 320 ms a frame. She holds on the plate while any window about her is open, during the decision, and after the win. Reduced motion shows the plate only.
  - Before a try: `ch1.cto.call.1..3`, with the last repeating. After: `ch1.cto.ask`, then the two prompts over the cube, clear of the hero and of her.
  - **Sign**: the jab; it counts against the score (`scenarioScore`: 50 if any wrong Honeycomb prompt or a signature); the prompt greys out and the choice comes back.
  - **Get Honeycomb**: the win if the investigation is finished. Otherwise `ch1.decide.hc.show`, and the Honeycomb screen opens with progress kept. Finishing it goes straight to the win; closing it returns to the room.
- **Stopwatch.**
  - Phases: card, room, pc, old, hc, monitor, cto, win.
  - New counts: emails, vitals checks, monitor visits, signed.
  - The summary keeps its shape but now has three columns (phases plus score, then two halves of the counts), so twelve counts fit at 667×375. Copy results is unchanged.

## Scripted timings (Copy results)

Same model as brief 02: a script, not a person. It reads every window at **200 wpm**, takes **1.2 s** per choice, at 844×390.

**Shortest:** card → entry line → PC → Honeycomb (clean) → Leave → CTO → Get Honeycomb → win → verdict.
```
Observability Quest · scenario 1 · 1:41
Class card: 0:11
Room: 0:23
PC: 0:08
Old tool: 0:00
Honeycomb screen: 0:32
Monitor: 0:00
CTO: 0:06
Win + verdict: 0:21
Message windows: 10
Taps: 19
Walks: 2
Walking time: 0:03
Wrong HC prompts: 0
Old-tool prompts: 0
Look uses: 0
Hotspots visited: 2
Emails opened: 0
Vitals checks: 0
Monitor visits: 0
Signed: 0
Score: 100
```

**Everything:**
- Look at all three hotspots. The monitor close-up: chart, about 4 s watching, tap a box, Back. The CTO's first call.
- At the PC: two emails, vitals, Leave (locked), all three Cave Logs prompts and exit, vitals again.
- Honeycomb with one wrong prompt at each step, then vitals a third time, then Leave.
- At the CTO: Sign, then Get Honeycomb.
```
Observability Quest · scenario 1 · 4:10
Class card: 0:11
Room: 0:59
PC: 0:54
Old tool: 0:27
Honeycomb screen: 0:42
Monitor: 0:16
CTO: 0:20
Win + verdict: 0:21
Message windows: 29
Taps: 64
Walks: 3
Walking time: 0:04
Wrong HC prompts: 2
Old-tool prompts: 3
Look uses: 3
Hotspots visited: 3
Emails opened: 2
Vitals checks: 3
Monitor visits: 1
Signed: 1
Score: 50
```

Compared with brief 02 (1:16 / 3:03), the shortest path gained 25 s:
- The entry line grew from 216 to 301 characters.
- The PC menu and the Leave line add about 8 s.
- The CTO's question and the decision add about 6 s.
- The longer win line adds about 3 s.

The full poke-around, at 4:10, is over the 2–3 minute target. The PC phase alone is 54 s of it (emails, three vitals checks, the locked joke).

## Calls I made (and what each costs if wrong)

1. **The tool screens still take over the whole scene**, as in brief 02, rather than drawing inside the PC's CRT. "Opens on the spot (on the PC close-up)" I read as "the same Honeycomb screen you'd get from the PC". A tool inside the CRT rectangle (188×132) can't fit the picture plus three 44-px prompts plus the close button at 667×375. If Rick wants the CRT frame around them, the picture can go in the CRT and the prompts over the bezel, but it gets tight.
2. **The intro line shows once per tool.** Re-opening a tool goes straight to its prompts. A finished Honeycomb screen re-opens with its final picture and only the close button.
3. **Cave Logs keeps its greyed prompts between visits**, for consistency with Honeycomb's kept progress. Brief 02 rebuilt it on every open.
4. **The vitals clock keeps running everywhere**, including in the PC and tool screens, so the monitor has moved on when you come back. It resets to 0 when Otto goes OK, so the answer types in from the start.
5. **The CTO's phases.** Use on her puts the clock in `cto`. A call line returns to `room` when it closes. The question and decision stay `cto` until the win (→ win) or "show me" (→ hc). Look at her counts as `room`.
6. **Talk frame 320 ms.**
7. **Monitor close-up: "a tap outside the screen"** means outside the glass, 18–301 × 16–174. A tap on the heartbeat lane does nothing.
8. **Close-up text that is wider than its box is condensed sideways** (`scaleX`) rather than shrunk below 18 px. Only `CONFIDENCE 100%` (15 characters) needs it, at about 0.96.
9. **The PC menu and email list are two columns** of 44-px items. One column can't fit five items plus the title inside the CRT at 667×375.
10. **Room output panel**: typed characters show as dots, at most 7 rows. The OK answer (48 characters) fills the panel and stops; it doesn't spill.
11. **The sign jab stays in the `cto` phase**, and `signed` is counted separately from `wrong` (wrong is Honeycomb-screen prompts only).

## Positions I nudged (measured on the built PNGs)

All of these are in `js/chapters/ch1.js`, on the `MONITOR` comment.

- **Room lights** (120,54) (142,54) (164,54) → **(119,54) (141,54) (163,54)**, 4×2. The art's chips sit 1 px left of the hand-back's numbers.
- **Close-up lights** (31,104) (100,104) (169,104) → **(31,105) (100,105) (169,105)**, 10×5. The chips' fill is rows 105–109 inside a rim at 104 and 110. An unlit light is now drawn dark, not left as the art's idle green chip.
- **Heartbeat lanes** are inset so the trace stays inside the panel frame, and the art's grid shows through (I no longer paint over it):
  - room 118–180 × 30–50 → **120–178 × 32–48**
  - close-up 27–224 × 26–91 → **29–222 × 29–88**
- **Not nudged:** the readout boxes, the output panel, the PC screen, the CTO patch at (241, 89). The patches composite with no seams.

## Strings that need a script slot (mine)

- `[Close Cave Logs]`: replaces brief 02's `[Close the terminal]`; the exit line now says "You close Cave Logs".
- `[Close Honeycomb]`
- `Back`: the monitor close-up.
- Still from brief 02: Look / Use / Help, Copy results / Copied, the claim placeholder line, "coming soon", and the summary's labels (now including PC, Monitor, CTO, Emails opened, Vitals checks, Monitor visits, Signed, "Wrong HC prompts").

They live in `UI` at `js/screens/chapter.js:27` and in `js/engine/runlog.js:6-12`.

## What reads awkwardly (for Rick)

- **Two pages on a 667×375 phone:**
  - On both phones: `ch1.room.enter` (now 301 characters) and `ch1.hc.step2.result`.
  - At 667 only: `ch1.look.monitor`, `ch1.monitor.chart`, `ch1.look.cto`, `ch1.pc.vitals.before`, `ch1.hc.step1.result`, `ch1.win` and `ch1.verdict`.
- **"I'm looking at the man who is going to fix it"** (`ch1.cto.call.2`) genders the player's hero, whom the player built and named. The spec keeps the hero's gender open. Worth a neutral line.
- **The PC phase is the new time sink** when poking around: three vitals checks and the locked joke are 4 windows. Nothing is gated on them, so the shortest path never pays.
- **`ch1.pc.email.reply` is the same for all five emails.** Fine for the joke; a player who opens two learns there's nothing there.
- **No dead ends.** Tested: you can't get stuck at the PC before a try (the locked line plus the tools), at the CTO (Get Honeycomb always works), or inside "show me" (its close button returns to the room).

## Could not do / not done

- I didn't test on a real phone; I used Chromium phone emulation at 844×390 and 667×375.
- No sound for the monitor or the call. Not in the brief.

## For Cloud Claude / Rick to look at

- `js/screens/chapter.js` was rewritten around a few states: card, room, pc, monitor, tool, decide, ending, verdict, summary. `leaveTool` returns to the PC or the room depending on where the tool was opened from (`toolFrom`).
- `css/game.css`: the new block at the end is `.scene-ui`, `.mon-*`, `.pc-*` and `.decide-prompts`. The PC grid's view classes are `view-menu` / `view-email`, because a bare `menu` class matched the scenario menu's `.menu` rule and painted the CRT white.
- `js/engine/window.js` gained a `serial` (windows opened) so the tests can tell two windows with the same words apart.
- `index.html` is bumped to `css ?v=11` / `js ?v=22`.
- The worktree's `node_modules` is an untracked symlink to `../oqm-warp-profile-walk/node_modules`, for Playwright; it isn't committed.
