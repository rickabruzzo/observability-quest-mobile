# Warp brief 08 — scenarios 2 to 5, playable

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. Do this **after brief 07** (the persona card).
Branch **`warp/scenarios-2-5`** from **`origin/era-look`** and open the pull requests against `era-look` (the
fork rule in `briefs/PROTOCOL.md`). This is a large job; **two pull requests are welcome**: the engine made
general plus scenario 2, then scenarios 3 to 5.

> **On the era-look fork (2026-11-13, evening).** Everything below still holds, with these differences:
> - **The room art is the era look**: every persona redrawn as a simple figure, every close-up repainted. Same
>   file names, already built; the rooms, hotspots, panels and screen rectangles did not move. Room 1's art
>   changed too. The figure patches are a little larger again: read them from `chN.json`.
> - **The hero is 56 px wide and 136 tall** (brief 09). Every "hero at" number in the rooms table below is for
>   the old 28 px hero. Use brief 09's table (item 8) in its place, and take his size from the constants.
> - **The persona speaks from a close-up portrait** (brief 10). It is driven by the chapter's data, so give
>   each scenario `persona.portrait` (`p2` to `p5`) and write the persona's lines as the script has them.
> - Do briefs **09, 10 and 07 first**; this one comes last.

> **Changed 2026-11-13, after Rick's art review** (`handbacks/2026-11-13-art-rooms-and-cards.md`). All the art
> for rooms 2–5 and the five cards is now approved. If you started from an earlier version of this brief:
> - **Every room has a win frame**, `R<n>_npc_win`: see "The persona's frames".
> - **The figure patches grew.** The old ones cut the cloud engineer off at the waist. Read `patches` from each
>   `chN.json`; do not hard-code them.
> - **Room 2:** the theories go on a blank sheet taped to the whiteboard, and after the fix the close-up swaps
>   to `R2_wall_closeup_fixed`, which has the path painted in. No code-drawn marker line in the close-up.
> - **Room 3:** the wall monitor is a TV showing a browser page (new panel numbers), the code draws its glow,
>   and there are two small extra hotspots, `sign` and `guitar`. New laptop close-up.
> - **Room 4:** new PC close-up (a solid screen). The persona's class is Knight Watch (script only).
> - **Room 5 is the atrium** (same file names): three readout boxes, no pager, a `pinball` hotspot.
> - **Card animations:** four cards have painted frames, and the fourth scenario's has a phone screen the code
>   animates: see "The cards' animations".
> - The script has 467 slots. `chN.look.workstation` is gone from every chapter.

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
- The art hand-backs, for anything this brief leaves out: `handbacks/2026-11-13-art-rooms-and-cards.md` (the
  index), `art-drops/2026-11-12-room-ch{2,3,4,5}/HANDBACK.md`, `art-drops/2026-11-12-card-ch1/HANDBACK.md` and
  `art-drops/2026-11-13-card-ch2/HANDBACK.md`. Where a hand-back and this brief disagree on a number, this
  brief was checked against the built 320×200 files; say so in your hand-back if one looks wrong.

## What is ready

- **Rooms:** `assets/rooms/ch{2,3,4,5}.json` and their PNGs (`tools/build_rooms.py`; do not rebuild). Each
  manifest has `images` and `patches` (the one rectangle every figure frame is cut to; draw a frame at that
  rectangle over the room plate, as you do for the CTO). Each room has two talk frames and a win frame; room 2
  also has three idle frames and a second wall close-up, `R2_wall_closeup_fixed`.
- **Honeycomb screens:** `assets/screens/ch{2,3,4,5}_hc.json` and PNGs, same format as scenario 1's.
- **Cards:** `assets/cards/P{1..5}_card.png` (128×80) and `cards.json`, whose `frames` lists a card's extra
  frames, three each for `P1`, `P2`, `P3` and `P5`, the same size and palette as the card. `P4` has none.
- **Narrator portraits** for the verdicts: scenario 2 `portrait_emily`, 3 `portrait_graham`, 4
  `portrait_jessitron`, 5 `portrait_matt` (frames in `assets/anim/`, as for Christine).

## The keys scenarios 2–5 share (`chN.` in front of each)

| Part | Keys |
|---|---|
| Title card | `card.title`, `card.line` |
| Persona card | `persona.name`, `persona.class`, `persona.stats`, `persona.flavor` |
| Room | `room.enter`, `look.wall`, `look.pc`, `look.npc` (scenario 3 also `look.sign`, `look.guitar`, `use.guitar`; scenario 5 also `look.pinball`) |
| Wall close-up | `wall.chart` (shown on entering, once per visit), `wall.stat.1…` (the pool while things are broken), `wall.ok.1…` (the pool after the fix); scenario 3 also `wall.progress`, `wall.progress.ok`, `wall.cart`; scenario 5 also `wall.box.1..3`, `wall.box.ok.3` |
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
| PC close-up, screen (x0–x1, y0–y1) | 80–240, 31–136 | 31–204, 44–154 | 33–285, 34–147 | 73–256, 41–159 |
| Wall close-up file | `R2_wall_closeup` | `R3_wall_closeup` | `R4_wall_closeup` | `R5_wall_closeup` |

- `wall` never walks; where `wall` and another hotspot overlap, the smaller target wins (scenario 2: `npc` over
  `wall`; scenario 4: `pc` and `npc` over `wall`).
- Scenario 3 is mirrored: the computer is on the right and the persona on the left. It has two extra hotspots
  with no walk: `sign` (263, 48, 32, 25; Look only, `look.sign`; pad its hit area to the 44 px minimum) and
  `guitar` (187, 84, 42, 72; Look gives `look.guitar`, Use gives `use.guitar`). The guitar leans on the desk
  inside the `pc` rectangle; the smaller target wins there. In the laptop close-up the screen is left of
  centre, with the guitar's headstock on the right.
- Scenario 4: the old monitor on the persona's desk has a blank tape label. Its words are in `look.npc`;
  draw nothing on it.
- Scenario 5 is the atrium: the "wall" is a big monitor on a stand, the computer a laptop on a coffee table
  (the hero stands at its right end; the open floor is x 118–232), the persona on the couch. One extra
  Look-only hotspot with no walk: `pinball` (250, 42, 68, 40: the backglass and the top of the table, kept
  clear of the persona's head so a tap on him is never a tap on the machine). There is no pager in this room.
- The PC menu is drawn inside each close-up's screen rectangle. They differ in size; scenario 2's is the
  smallest (160×105). Check all four at 667×375.

## The wall displays: one small painter each

Each painter draws into its room's blank panels, in the room (shapes and motion only) and in the close-up
(with text). Three states: **broken** (until the fix is deployed), and **fixed**; the close-up also shows
whatever "found" needs, noted below. Stepped at about 10 fps; reduced motion: one still per state. Text is
real text placed from these rectangles, VT323, at least 14 CSS px on a 667×375 phone; where a panel is too small
for that, draw shapes.

**Scenario 2: the whiteboard.** The art holds the drawing, and now the fix too.
- Area: room x 115–307, y 28–115 (the persona covers x 260–300); close-up x 13–307, y 25–191.
- **The sheet.** The close-up has a blank sheet of paper taped to the board: **x 49–107, y 32–100**. One
  `wall.stat` "theory" at a time is written on it (two lines, split at ` / `), in dark ink like marker on
  paper (`#2B2F36`), centred; a tap steps to the next.
- Broken and found: `R2_wall_closeup` with the theories on the sheet. Nothing moves on the board, in the room
  or the close-up. (A whiteboard learns nothing until somebody draws on it.)
- Fixed: the close-up is **`R2_wall_closeup_fixed`**: the same board with one glowing yellow-green path
  painted through the tangle, and the same blank sheet, which now cycles `wall.ok`. Draw no line of your own
  in the close-up.
- Fixed, in the room: draw that path on the room's board, 1 px, `#E2FE52`, under the persona's frame:
  (126, 75) → (144, 75) → (169, 73) → (187, 78) → (206, 73) → (233, 71). It stops at the left edge of his
  patch, where he stands capping his marker. Reduced motion: the same line, drawn at once.

**Scenario 3: the checkout page** (pale screen: draw in dark ink, `#2B2F36`).

The monitor is a wall TV showing a browser window: whole screen room x 102–217, y 34–94; close-up x 31–287,
y 22–171. The art draws the browser's title bar (three dots and an empty address bar); leave it as it is.

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Progress bar | the address bar, 120–209, 36–40 | 54–265, 39–51 | a progress bar stuck at 13% with a small spinner; close-up text `wall.progress`. Fixed: full, `wall.progress.ok`. In the room it is a thin bar inside the address bar, or nothing if that reads badly |
| Large rectangle | 111–171, 46–80 | 54–183, 60–137 | the cart: a simple guitar shape drawn from rectangles; close-up text `wall.cart` under it |
| Small 1, 2, 3 | 176–208 × 46–55, 58–67, 71–80 | 192–265 × 60–80, 88–109, 117–137 | one `wall.stat` line each, each box on its own timer; fixed: `wall.ok` |
| Bottom lane | 111–208, 84–90 | 54–265, 147–160 | a sales line sliding down; fixed: turning up |

**The TV's glow is yours to draw (Rick).** The art has none. In the room, draw a soft halo round the bezel
(x 97–223, y 26–100) that fades out over 6–10 px, dithered in the room's own colours, with no hard edge and
no smooth gradient. Its strength flickers irregularly between pure white and a slightly darker bluish white,
the way a TV lights a dark room, and the pale page is tinted by the same flicker (in the close-up too).
Reduced motion: steady and low, or off.

**Scenario 4: the wall of space.**

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Star map | 34–234, 7–80 | 13–242, 7–161 | the fleet: a few hundred dots drifting toward the centre; about one in fourteen sits at the edge, jittering, never getting in. Fixed: they jump in |
| Lane | 34–234, 84–88 | 13–239, 171–182 | a flat green health line, both states. That is the joke |
| Chat column | 236–285, 15–98 | 244–304, 16–172 | lines from `wall.stat` scrolling up; fixed: `wall.ok`. In the room: grey bars |

**Scenario 5: the atrium monitor.** Whole screen: room x 115–204, y 24–84; close-up x 41–280, y 19–181.

| Panel | Room | Close-up | What goes in it |
|---|---|---|---|
| Chart | 119–179, 27–44 | 50–158, 27–74 | sign-ups: a calm line with a small wobble, both states. The art already has faint grid lines; draw over them |
| Large panel under it | 119–157, 48–81 | 50–156, 84–174 | the support inbox: `wall.stat` lines, newest on top; fixed: `wall.ok`. In the room: short bars stacking up, red while broken, green and few once fixed |
| Small 1, 2, 3 | 162–179 × 48–53, 57–63, 67–81 | 165–214 × 27–74, 84–124, 134–174 | `wall.box.1` (the error rate) and `wall.box.2` (when Friday's release shipped), the same in both states: they are the readouts that noticed nothing. `wall.box.3` is the unread support count; fixed: `wall.box.ok.3`. In the room: lights, 1 and 2 steady green, 3 red while broken and green once fixed |
| Chat panel | 183–200, 27–81 | 223–272, 27–158 | grey bars (too narrow for text); leave the strip under it (y 160–174) empty |

In the close-up the first box sits beside the chart and the other two under it; in the room all three are in a
column. The only things on this display that change when the fix lands are the inbox and its count. That is
the point of the scenario: everything else said "normal" all along.

Entering a close-up shows `wall.chart` once per visit; a **Back** control or a tap off the display returns to
the room, as in scenario 1.

## The persona's frames

Rick, 2026-11-12: a tight talk loop looked creepy. For scenarios 2–5:

- **While the persona's own line is on screen** (`npc.call.*`, `npc.ask`, `decide.*.jab`, `decide.hc.show`,
  `hero.line`): alternate `talk_1` and `talk_2` with the rest frame, about 320 ms a frame.
- **Otherwise they rest.** Scenarios 3, 4, 5: the plate. Scenario 2: **`R2_npc_look`** (turned to the board),
  and every 4–10 s, at random, `R2_npc_scratch` or `R2_npc_mark` for 0.6–1 s, then back.
- **The win frame.** From the moment `win` is shown to the end of the scenario (through `hero.line` and the
  cut to the verdict), the persona holds **`R<n>_npc_win`**, with no talk loop over it: the cloud engineer
  capping his marker, the developer hanging up with a fist pump, the SRE's two-finger salute, the release
  engineer slumped back with his laptop shut. Before that, even once the fix is deployed, they rest and talk
  as above, because they still have a question to ask. Reduced motion shows the win frame too: it is a still.
- Reduced motion: the rest frame only (and the win frame at the end).
- Scenario 1's CTO keeps her loop; she is on a call, and Rick approved it. She has no win frame.

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
- **The cards' animations (Rick's request).** While a card is open its picture moves a little.
  - *Painted frames* (the CTO's sparkle, the druid's stone, the bard's sparks, the rogue's flame): for any
    card that has entries in `cards.json` › `frames`, swap the picture through card → 1 → 2 → 3 → 2 → 1 and
    round again, about 180 ms a frame, in the order the manifest lists them. The frames are whole 128×80
    pictures in the card's own palette and differ from it only where the magic is, so nothing else flickers.
    Preload them with the card. Nothing in the code names a card; it reads the manifest.
  - *Knight Watch's phone* (scenario 4, `P4`, no frames): she has a phone on her belt with a blank glowing
    screen, **x 84–89, y 56–61 in the 128×80 picture** (measured on the built card; the art hand-back's
    rectangle is lower and covers the holster). Fill that rectangle `#DFF4FF`, then draw urgent notifications
    scrolling up it: 1 px rows, each a short dark bar with a red dot at its left end, one new row every other
    pixel, moving up 1 px about every 120 ms, clipped to the screen. Scale it with the picture. It is a
    per-card overlay in the chapter's data (a rectangle and a kind), not a special case in the card code.
  - Reduced motion: the still card, no overlay motion. No code-drawn glints anywhere.
- **The menu.** All five rows play; "coming soon" goes. `?ch=N` works for 1–5.
- **The stopwatch.** Its labels become generic (Wall display, Persona) and it reports per scenario.

## Tests (first)

- Unit: every scenario's data passes `checkRoom` (targets at least `MIN_HIT`, stand points on the floor, every
  key exists in `SCRIPT`); the persona's frame chooser (rest, idle, talking, the win frame, reduced motion);
  each wall painter's state for broken, found and fixed; the card's frame order from the manifest and none for
  a card without frames; no scenario name in `js/screens/chapter.js` (a test that greps).
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
