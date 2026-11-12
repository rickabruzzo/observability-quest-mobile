# Warp brief 03 — scenario 1 on its real room: the PC, Otto's vitals, the CTO

Read `briefs/warp/PROTOCOL.md` first. Branch: **`warp/ch1-room`**, cut from `sci-adventure`.

```
cd ~/Documents/"Observability Quest Mobile"
git worktree add ../oqm-warp-ch1-room -b warp/ch1-room sci-adventure
cd ../oqm-warp-ch1-room
git config user.name Claude && git config user.email noreply@anthropic.com    # this worktree only
```

## Why

Your brief 02 build runs scenario 1 in a placeholder room with five hotspots. The real art is in, and Rick
redesigned the scene with it (2026-11-12). The chapter is still LLM Observability and the two tool screens are
unchanged, but how the player reaches them is new:

- **Otto is the patient.** A wall monitor shows his vitals like a sci-fi sickbay readout.
- The hero (the Technical Decision Maker) works at an **80s PC** in a cube. Both tools open from its menu.
- The **CTO** sits at her desk on the phone with the Cave Logs renewal. The scenario ends when the hero walks
  over and advises her: **[Sign the contract]** or **[Get Honeycomb]**.

Three hotspots instead of five, all thumb-sized. The 2–3 minute target stands: report the scripted timings as
you did in brief 02.

## Read first

- `docs/superpowers/specs/2026-11-10-sci-adventure-design.md` › **Chapters › 1** (rewritten: Cast, Room, Flow,
  Decision). The spec is the authority.
- `script/script.md` › **Chapter 1**. The new slots are in place and built into `js/script.js`:
  `ch1.look.{monitor,pc,cto}`, `ch1.monitor.chart`, `ch1.vitals.stat.1..10`, `ch1.vitals.ok.1..5`,
  `ch1.vitals.output`, `ch1.vitals.output.ok`, `ch1.cto.call.1..3`, `ch1.pc.title`, `ch1.pc.menu.*`,
  `ch1.pc.email.1..5`, `ch1.pc.email.reply`, `ch1.pc.vitals.{before,old,hc}`, `ch1.pc.leave.locked`,
  `ch1.pc.leave`, `ch1.cto.ask`, `ch1.decide.{sign,hc}`, `ch1.decide.sign.jab`, `ch1.decide.hc.show`.
  A vitals stat is two lines split at ` / `.
- `assets/rooms/ch1.json` and the five PNGs beside it (built by `tools/build_rooms.py`; do not rebuild them).
- Your own `js/screens/chapter.js`, `js/chapters/ch1.js`, `js/engine/{room,prompts,runlog,window}.js`.
- `js/intro/timeline.js` + `js/screens/intro.js` for how the intro swaps a changed region over a plate.

## The art and its numbers (320×200 scene px)

| File | What |
|---|---|
| `R1_exec_floor.png` | the room, 320×200 |
| `R1_cto_talk_1.png`, `R1_cto_talk_2.png` | 63×40 patches; draw at `patches.R1_exec_floor` (x 241, y 89) over the room |
| `R1_monitor_closeup.png` | the vitals monitor filling the frame, all panels blank |
| `R1_pc_closeup.png` | the PC's CRT filling the frame, screen blank |

Room: feet on **y 192**; the hero's left edge may go from **x 0 to 292**; start him between the cube and the
CTO's desk (x 142 is fine).

| Hotspot | Rect (x, y, w, h) | Hero's left edge |
|---|---|---|
| `pc` | 0, 75, 135, 111 | walks to 87, then the PC close-up opens |
| `monitor` | 114, 26, 92, 50 | no walk; the tap opens the monitor close-up |
| `cto` | 206, 82, 100, 102 | walks to 176 |

`pc` and `monitor` overlap by a few px at the corner; where they do, `monitor` wins.

Screen areas the game draws into (x0–x1, y0–y1):

| Area | In the room | In the monitor close-up |
|---|---|---|
| Heartbeat lane | 118–180, 30–50 | 27–224, 26–91 |
| Readout boxes 1 / 2 / 3 | 118–136 / 140–158 / 162–180, 52–72 | 27–87 / 95–156 / 164–224, 116–164 |
| Box lights (4×2 in the room, 10×5 close up) | (120,54) (142,54) (164,54) | (31,104) (100,104) (169,104) |
| Otto's output panel | 183–203, 30–72 | 232–293, 26–164 |
| PC screen (on `R1_pc_closeup`) | — | 66–254, 30–162 |

These are the art hand-back's measurements, checked by eye against the built files to about ±2 px. If something
sits visibly off, nudge it and say so in the hand-back.

## Build

### 1. The room
Replace the placeholder `ROOM`: paint `R1_exec_floor.png`, the three hotspots above, `floorY` 192. Preload the
chapter's images before the class card is dismissed (the manifest lists them). Delete the code-drawn placeholder
room and its labels. The room engine gains what this needs and no more: a hotspot may open a **scene** (a
close-up) instead of a line or a tool, and a hotspot may skip the walk.

Look still reads from where the hero stands (`ch1.look.*`). Use: `pc` → walk, then the PC scene; `monitor` → the
monitor scene; `cto` → walk, then section 4.

### 2. Otto's vitals (pure module + drawing)
A pure module (suggest `js/engine/vitals.js`) that, given elapsed ms and a state (`critical` | `ok`), returns
what to draw: the heartbeat samples, each box's current stat and whether it is garbling, each light on/off, and
how much of the output line is typed. Tested without a browser.

- **Critical** (until the Honeycomb investigation is finished): the heartbeat scrolls left, erratic, flat now and
  then. The three boxes cycle the `ch1.vitals.stat.*` pool, each on its own timer so they never change together,
  never showing the same stat in two boxes; a box garbles for one step between stats. Lights blink red. The
  output panel types `ch1.vitals.output`, holds with a blinking cursor, glitches, starts over.
- **OK** (after it): a steady rhythm, the `ch1.vitals.ok.*` pool, green lights, and the output panel types
  `ch1.vitals.output.ok` and holds.
- Stepped at about 10 fps. **Reduced motion: one still frame per state.**

Drawn in two places from the same state:
- **In the room**, motion only (heartbeat, lights, a cursor in the output panel). No text: the boxes are 18 px.
- **In the monitor close-up** (`monitor` hotspot): the full readout on `R1_monitor_closeup.png`, with the stats
  and Otto's output as text. On entry, show `ch1.monitor.chart` once per visit as a message window. A tap on a
  readout box steps that box to its next stat; a **Back** control (or a tap outside the screen) returns to the
  room. Nothing depends on reading the stats.

Text on these close-ups is your call between canvas and overlay elements positioned from the scene rectangles
(as your tool screens do); it must stay inside its rectangle at every `--ui-scale`, in VT323, and be legible on
a 667×375 phone. A stat line is at most 15 characters.

### 3. The PC (`pc` hotspot)
A scene on `R1_pc_closeup.png`; everything is drawn inside the screen rectangle, VT323, green or amber on dark.
`ch1.pc.title` on top, then the menu from `ch1.pc.menu.*`:

- **[Read email]**: lists the five `ch1.pc.email.*` subjects. Opening any of them shows `ch1.pc.email.reply`
  and returns to the menu.
- **[Check Otto's vitals]**: shows `ch1.pc.vitals.before`, `.old` or `.hc`: `.hc` once the Honeycomb
  investigation is finished, else `.old` once a Cave Logs prompt has been tried, else `.before`.
- **[Open Cave Logs]** / **[Open Honeycomb]**: your existing two tool screens, unchanged in rules and words.
  Closing Cave Logs (`ch1.old.exit`) returns to the PC menu. Finishing the Honeycomb investigation shows its
  result and returns to the PC menu: **it no longer ends the scenario.** Add a way back to the menu from an
  unfinished Honeycomb screen (brief 02 had none); its progress is kept.
- **[Leave computer]**: locked until **a tool has been tried**: at least one Cave Logs prompt or one Honeycomb
  prompt picked (opening a tool and backing out does not count). Locked, it shows `ch1.pc.leave.locked` and
  stays on the menu; it is never greyed out, the line is the joke. Unlocked, it shows `ch1.pc.leave` and returns
  to the room with the hero standing at the PC.

### 4. The CTO
- **Talk loop** in the room: room → `talk_1` → room → `talk_2`, about 250–400 ms a frame, while she is on the
  call. Reduced motion: the plate only. Hold her on the plate while a message window about her is open.
- **Before a tool has been tried**: Use shows the next of `ch1.cto.call.1..3` (in order, the last one repeats).
- **After**: Use shows `ch1.cto.ask`, then the two prompts `ch1.decide.sign` and `ch1.decide.hc`.
  - **[Sign the contract]**: `ch1.decide.sign.jab`; it counts as a wrong Honeycomb prompt for the score (so a
    clean 100 becomes 50); the prompt greys out and the choice comes back. It never blocks.
  - **[Get Honeycomb]**, investigation finished: the win. `ch1.win`, `ch1.hero.line`, the verdict, the summary,
    exactly as today, and the monitor is in its OK state behind the win lines.
  - **[Get Honeycomb]**, investigation not finished: `ch1.decide.hc.show`, then the Honeycomb screen opens on
    the spot (on the PC close-up, progress kept). Finishing it goes straight to the win; backing out returns
    to the room.

Score, `oq.done` and the status bar are recorded at the win as today.

### 5. The stopwatch
Phases become: card, room, pc (menu, email, vitals), old, hc, monitor, cto, win. Counts gain: emails opened,
vitals checks, monitor visits, signed (0 or 1). Keep the summary screen's shape and "Copy results".

### 6. The script
`script/script.md` is normally off limits. For this brief only: **delete** the slot `ch1.retired` and the seven
under it (`ch1.look.laptop`, `ch1.use.laptop`, `ch1.look.contract`, `ch1.use.contract`, `ch1.look.wallscreen`,
`ch1.look.terminal`, `ch1.look.workstation`) once nothing reads them, and rebuild `js/script.js`. Change no
words. Any string you need that has no slot goes in the `UI` table in `chapter.js` and in the hand-back, as
before.

## Tests (first, as always)

- Unit: the vitals module (boxes never change on the same step, never share a stat, the two states, the
  reduced-motion still); the gate (what counts as "tried"); the decision outcomes and the score after signing;
  the three hotspots are reachable, at least `MIN_HIT` in both directions, and every key the chapter names
  exists (`checkRoom`); the runlog's new phases.
- E2E (`tests/e2e/chapter.test.js`, `_play.js`): the shortest path (PC → Honeycomb clean → leave → CTO → Get
  Honeycomb → 100); Cave Logs only → leave → Get Honeycomb → "show me" → win; Sign first → 50, and the choice
  returns; Leave locked before any tool; the monitor close-up opens and closes; reduced motion plays through.
- Update the scripted timing runs (shortest / everything at 200 wpm) and report both.

## Yours / off limits

**Yours:** `js/chapters/ch1.js`, `js/screens/chapter.js`, `js/engine/{room,prompts,runlog,window,message}.js`,
new files under `js/engine/` and `js/screens/`, `css/game.css` (chapter rules only), `index.html` (cache-bust
numbers only), the tests above, `README.md` and `docs/backlog.md` (a few lines each).

**Off limits:** `assets/**`, `tools/build_rooms.py`, `tools/build_intro.py`, the intro (`js/intro/**`,
`js/screens/intro.js`), the hero generators and fixtures, `js/menu.js` rules, the spec, and `script/script.md`
apart from the eight deletions above.

## Hand back

`scratch/warp-ch1-room-handback.md` in the main folder, then tell Rick: "ready — push `warp/ch1-room`". Include
the two scripted timings, every call you made, any position you nudged, and any string that needs a script slot.
