# Warp brief 08 — scenarios 2 to 5, playable

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. Do this **after brief 07** (the persona card).
Branch **`warp/scenarios-2-5`** from `origin/sci-adventure`. This is a large job; **two pull requests are
welcome**: the engine made general plus scenario 2, then scenarios 3 to 5.

> **Changed 2026-11-13 (second art drop).** If you started from the earlier version of this brief, these moved:
> - **Room 5 is new art**, the building's atrium (same file names). Its column in the rooms table, its wall
>   display (now **two** small boxes, so `wall.box.3` and `wall.box.ok.3` are gone from the script), the pager's
>   rectangle and a new optional `pinball` hotspot (`look.pinball`) are all below.
> - **Scenario 1's card sparkle is painted frames now**, not code-drawn glints: see "The card's sparkle".
> - Room 2's plate and frames were rebuilt (desk cans recoloured); its numbers did not change.
> - The script has 467 slots.

## Why

The art for rooms 2 to 5 and all five persona cards has landed, the four scenarios' solves are grounded in
Honeycomb's own material, and their scripts are written in scenario 1's shape. What is missing is the code:
today only scenario 1 plays, and its screen knows about "the CTO" and "Otto" by name.

**Goal:** all five rows of the menu play start to finish, from data. `js/screens/chapter.js` has no scenario's
name in it; each scenario is a data module plus one small painter for its wall display.

## Read first

- Spec › **The shape every scenario shares**, **The persona card**, and **Chapters › 2, 3, 4, 5**.
- `script/script.md` › Chapters 2 to 5. Every scenario 2–5 uses the same key names (below); scenario 1 keeps
  its own (`cto.*`, `vitals.*`, `decide.sign`, `otto.recovered`). Your data modules map keys to the engine's
  fields, so the engine never builds a key from a scenario's name.
- The art hand-backs, for anything this brief leaves out: `art-drops/2026-11-12-room-ch{2,3,4,5}/HANDBACK.md`
  and `art-drops/2026-11-12-card-ch1/HANDBACK.md`.

## What is ready

- **Rooms:** `assets/rooms/ch{2,3,4,5}.json` and their PNGs (`tools/build_rooms.py`; do not rebuild). Each
  manifest has `images` and `patches` (the one rectangle every figure frame is cut to; draw a frame at that
  rectangle over the room plate, as you do for the CTO).
- **Honeycomb screens:** `assets/screens/ch{2,3,4,5}_hc.json` and PNGs, same format as scenario 1's.
- **Cards:** `assets/cards/P{1..5}_card.png` (128×80) and `cards.json`, whose `frames` lists a card's extra
  frames (only `P1` has any: `P1_card_sparkle_1..3.png`, same size and palette as the card).
- **Narrator portraits** for the verdicts: scenario 2 `portrait_emily`, 3 `portrait_graham`, 4
  `portrait_jessitron`, 5 `portrait_matt` (frames in `assets/anim/`, as for Christine).

## The keys scenarios 2–5 share (`chN.` in front of each)

| Part | Keys |
|---|---|
| Title card | `card.title`, `card.line` |
| Persona card | `persona.name`, `persona.class`, `persona.stats`, `persona.flavor` |
| Room | `room.enter`, `look.wall`, `look.pc`, `look.npc` (scenario 5 also `look.pager`, `look.pinball`) |
| Wall close-up | `wall.chart` (shown on entering, once per visit), `wall.stat.1…` (the pool while things are broken), `wall.ok.1…` (the pool after the fix); scenario 3 also `wall.progress`, `wall.progress.ok`, `wall.cart`; scenario 5 also `wall.box.1`, `wall.box.2` |
| Persona | `npc.call.1..3` (before a tool is tried; the last repeats), `npc.ask`, `decide.wrong`, `decide.hc`, `decide.wrong.jab`, `decide.hc.show` |
| Computer | `pc.title`, `pc.menu.email`, `pc.menu.status`, `pc.menu.old`, `pc.menu.hc`, `pc.menu.deploy`, `pc.menu.leave`, `pc.email.1..3`, `pc.email.reply`, `pc.status.before`, `.old`, `.found`, `.hc`, `pc.leave.locked`, `pc.leave`, `pc.deploy` |
| After the fix | `recovered` (the line shown over the recovering wall display) |
| Old tool | `old.title`, `old.intro`, `old.prompt.1..3`, `old.jab.1..3`, `old.close`, `old.exit` |
| Honeycomb | `hc.title`, `hc.intro`, `hc.stepS.prompt.1..3` (1 is the direct one), `hc.stepS.jab.2..3`, `hc.stepS.result` for S = 1, 2 |
| Ending | `win`, `hero.line` (the persona's last word), scenario 4 also `manager.line` after it, `verdict` |

A `wall.stat`/`wall.ok` entry with ` / ` in it is two lines.

## The rooms (320×200; feet on y 192; the hero's left edge runs 0–292 in every room)

| | Scenario 2 | Scenario 3 | Scenario 4 | Scenario 5 |
|---|---|---|---|---|
| Room plate | `R2_war_room` | `R3_bullpen` | `R4_ops_room` | `R5_loft` |
| `pc` rect (x, y, w, h) | 0, 76, 136, 112 | 190, 78, 130, 108 | 10, 88, 126, 98 | 0, 128, 118, 68 |
| hero at the pc (left edge) | 96 | 262 | 95 | 96 |
| `wall` rect | 113, 26, 197, 92 | 100, 30, 120, 65 | 30, 2, 260, 100 | 115, 24, 90, 104 |
| `npc` rect | 255, 52, 48, 120 | 8, 45, 94, 141 | 205, 78, 98, 107 | 232, 85, 88, 113 |
| hero at the persona | 222 | 104 | 172 | 200 |
| hero starts at | 170 | 146 | 150 | 150 |
| PC close-up, screen (x0–x1, y0–y1) | 80–240, 31–136 | 81–237, 39–137 | 33–287, 34–147 | 67–254, 32–152 |
| Wall close-up file | `R2_wall_closeup` | `R3_wall_closeup` | `R4_wall_closeup` | `R5_wall_closeup` |

- `wall` never walks; where `wall` and another hotspot overlap, the smaller target wins (scenario 2: `npc` over
  `wall`; scenario 4: `pc` and `npc` over `wall`).
- Scenario 3 is mirrored: the computer is on the right and the persona on the left.
- Scenario 5 is the atrium: the "wall" is a big monitor on a stand, the computer a laptop on a coffee table
  (the hero stands at its right end; the open floor is x 118–232), the persona on the couch. It has two
  optional Look-only hotspots with no walk: `pager` (194, 173, 18, 11; pad its hit area to the 44 px minimum;
  the hero standing at the persona is right beside it) and `pinball` (250, 42, 68, 40: the backglass and the
  top of the table, kept clear of the persona's head so a tap on him is never a tap on the machine).
- The PC menu is drawn inside each close-up's screen rectangle. They differ in size; scenario 2's is the
  smallest (160×105). Check all four at 667×375.

## The wall displays: one small painter each

Each painter draws into its room's blank panels, in the room (shapes and motion only) and in the close-up
(with text). Three states: **broken** (until the fix is deployed), and **fixed**; the close-up also shows
whatever "found" needs, noted below. Stepped at about 10 fps; reduced motion: one still per state. Text is
real text placed from these rectangles, VT323, at least 14 CSS px on a 667×375 phone; where a panel is too small
for that, draw shapes.

**Scenario 2: the whiteboard.** The art already holds the drawing; the game draws *over* it.
- Area: room x 115–307, y 28–115 (the persona covers x 260–300); close-up x 13–307, y 25–191.
- Broken: nothing moves on the board. In the close-up, a caption strip along the bottom shows one
  `wall.stat` "theory" at a time; a tap steps to the next.
- Found (cause known, fix not deployed): a red marker line, 2 px, runs across the board through three circled
  points, ending in a red cross. Suggested close-up points: (58, 150) → (128, 112) → (196, 124) → (262, 62).
  In the room, the same line scaled into the room area.
- Fixed: the line is green and ends in a tick; the caption cycles `wall.ok`.

**Scenario 3: the checkout page** (pale screen: draw in dark ink, `#2B2F36`).

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Top bar | 111–208, 34–42 | 54–264, 31–50 | a progress bar stuck at 13% with a small spinner; close-up text `wall.progress`. Fixed: full, `wall.progress.ok` |
| Large rectangle | 111–171, 46–80 | 54–182, 60–137 | the cart: a simple guitar shape drawn from rectangles; close-up text `wall.cart` under it |
| Small 1, 2, 3 | 176–208 × 46–55, 59–68, 72–80 | 192–264 × 60–80, 88–108, 117–137 | one `wall.stat` line each, each box on its own timer; fixed: `wall.ok` |
| Bottom lane | 111–208, 84–90 | 54–264, 147–160 | a sales line sliding down; fixed: turning up |

**Scenario 4: the wall of space.**

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Star map | 34–234, 7–80 | 13–242, 7–161 | the fleet: a few hundred dots drifting toward the centre; about one in fourteen sits at the edge, jittering, never getting in. Fixed: they jump in |
| Lane | 34–234, 84–88 | 13–239, 171–182 | a flat green health line, both states. That is the joke |
| Chat column | 236–285, 15–98 | 244–304, 16–172 | lines from `wall.stat` scrolling up; fixed: `wall.ok`. In the room: grey bars |

**Scenario 5: the atrium monitor.** Whole screen: room x 115–204, y 24–84; close-up x 41–280, y 19–181.

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Chart | 119–179, 27–44 | 50–214, 27–74 | sign-ups: a calm line with a small wobble, both states. The art already has faint grid lines; draw over them |
| Large panel under it | 119–157, 48–81 | 50–156, 84–174 | the support inbox: `wall.stat` lines, newest on top; fixed: `wall.ok`. In the room: short bars stacking up, red while broken, green and few once fixed |
| Small 1, 2 | 162–179 × 48–63, 67–81 | 165–214 × 84–124, 134–174 | `wall.box.1` (the error rate) and `wall.box.2` (when Friday's release shipped), the same in both states: they are the readouts that noticed nothing. Each close-up box has a small grey tab at its top left (about 10×4); leave it showing. In the room: steady green lights |
| Chat panel | 183–200, 27–81 | 223–272, 27–174 | grey bars (too narrow for text); the art has a divider at close-up y 159, leave the strip under it empty |

The only thing on this display that changes when the fix lands is the inbox. That is the point of the scenario:
everything else said "normal" all along.

Entering a close-up shows `wall.chart` once per visit; a **Back** control or a tap off the display returns to
the room, as in scenario 1.

## The persona's frames

Rick, 2026-11-12: a tight talk loop looked creepy. For scenarios 2–5:

- **While the persona's own line is on screen** (`npc.call.*`, `npc.ask`, `decide.*.jab`, `decide.hc.show`,
  `hero.line`): alternate `talk_1` and `talk_2` with the rest frame, about 320 ms a frame.
- **Otherwise they rest.** Scenarios 3, 4, 5: the plate. Scenario 2: **`R2_npc_look`** (turned to the board),
  and every 4–10 s, at random, `R2_npc_scratch` or `R2_npc_mark` for 0.6–1 s, then back.
- Reduced motion: the rest frame only.
- Scenario 1's CTO keeps her loop; she is on a call, and Rick approved it.

## The rest

- **Old tools.** Each gets a simple code-drawn picture in the tool's picture rectangle, as Cave Logs has: Old
  Artifact, a grid of 350 green tiles; Pretty Good Metrics, one big "2.1 s" and a flat line; Page Einar, a
  phone screen with a contact and a ringing mark; Friday's diff, a wall of red and green lines. Your call on
  the details; none needs new words.
- **Scenario 4's tool is the coding agent.** Its menu item reads `[Open Claw Codez]` and its close button
  should not say "Honeycomb": add a per-tool close label (`ui.close.hc` by default; say what string you need
  for this one in the hand-back and use "[Close Claw Codez]" meanwhile).
- **The fix.** `pc.menu.deploy` → `pc.deploy` → cut to the wall close-up recovering → `recovered` → back to
  the menu, exactly as scenario 1 does with Otto. "Show me" at the persona works the same way too.
- **The decision.** `decide.wrong` is that scenario's wrong instinct (a misstep, a jab, greyed, the choice
  comes back); `decide.hc` wins once the fix is deployed.
- **The card's sparkle (scenario 1's card only, Rick's request).** Painted frames, not code: while the CTO's
  card is open, swap its picture through `P1_card` → `_sparkle_1` → `_sparkle_2` → `_sparkle_3` → `_sparkle_2`
  → `_sparkle_1` and round again, about 180 ms a frame (file names from `cards.json` › `frames.P1`, in that
  order). The frames are whole 128×80 pictures in the card's own palette and differ from it only where the
  magic is, so nothing else flickers. Preload them with the card. Reduced motion: `P1_card` only. No
  code-drawn glints.
- **The menu.** All five rows play; "coming soon" goes. `?ch=N` works for 1–5.
- **The stopwatch.** Its labels become generic (Wall display, Persona) and it reports per scenario.

## Tests (first)

- Unit: every scenario's data passes `checkRoom` (targets at least `MIN_HIT`, stand points on the floor, every
  key exists in `SCRIPT`); the persona's frame chooser (rest, idle, talking, reduced motion); each wall
  painter's state for broken, found and fixed; no scenario name in `js/screens/chapter.js` (a test that greps).
- E2E, for each of scenarios 2–5: the shortest path wins and ticks the menu; the wrong advice gets its jab and
  the choice returns; Leave is locked before a tool is tried; the wall close-up opens and closes; all text on
  the PC and wall close-ups stays inside its rectangle at 667×375 and 844×390; reduced motion plays through.
  Scenario 1's tests still pass unchanged in meaning.
- Report the scripted shortest and everything timings for all five.

## Yours / off limits

**Yours:** `js/chapters/**`, `js/screens/chapter.js`, `js/screens/menu.js`, `js/menu.js`, `js/engine/**`
(not `window.js` or `message.js`), `css/game.css`, `index.html` (cache-bust), tests, a few lines in
`README.md` and `docs/backlog.md`.

**Off limits:** `assets/**`, `art-drops/**`, `tools/**`, `script/script.md`, the spec, the intro, the creator,
`js/engine/window.js`, `js/engine/message.js`, `js/claim.js`.

## Hand back

`handbacks/<date>-warp-scenarios-2-5.md` on your branch, push, pull request into `sci-adventure`. For each
scenario: the two timings, how the wall display looks in its three states at 667×375, any rectangle you
nudged, any line that would not fit, and any string that needs a slot.
