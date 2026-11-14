# Hand-back: Warp brief 08, part 2 — scenarios 3, 4 and 5 (2026-11-14)

Branch `warp/scenarios-3-5`, pull request against `era-look`. **Stacked on part 1** (`warp/scenarios-2-5`, #19)
and, through it, on briefs 09, 10 and 07 (#16, #17, #18). The diff shrinks to this part's once #19 merges.

## What I built

**All five rows of the menu play, from data.** `js/chapters/ch3.js`, `ch4.js`, `ch5.js` in the shape part 1
fixed, each with one wall painter (`ch3-wall.js`, `ch4-wall.js`, `ch5-wall.js`) and one code-drawn old-tool
picture. `AVAILABLE` is all five; "coming soon" is gone from the menu; `?ch=N` works for 1–5; the stopwatch
reports per scenario with its generic labels. The chapter screen did not change except for nothing: part 1's
engine plays them as it plays 1 and 2.

**Scenario 3 (the bullpen, mirrored).** Hotspots: wall (Look only), pc (190,78,130×108; the hero stands at 248),
guitar (187,84,42×72, listed after the pc so the smaller target wins; Look and Use lines), sign (263,46,32×28:
the brief's 32×25 padded to the 28-px minimum, Look only), npc (8,45,94×141; the hero at 116; the conversation
window top right). **The checkout page:** the progress bar stuck at 13 % with a two-pixel spinner going round
(`wall.progress` as text; fixed: full, green, `wall.progress.ok`), the cart (a right-handed guitar from
rectangles, `wall.cart` under it), three small boxes with one `wall.stat` each on its own timer (a tap steps a
box; fixed: `wall.ok`), the sales line sliding down (fixed: climbing). In the room: a thin bar in the address bar,
the guitar, three bars, the line. **The TV's glow (Rick):** a halo round the bezel (x 97–223, y 26–100) fading
out over 8 px, dithered — translucent bluish-white pixels whose share thins with the square of the distance, so
the brick shows through lit, no hard edge and no gradient — flickering irregularly between white and a dimmer,
bluer white every 100 ms, with the page tinted by the same flicker in the room and the close-up. Reduced motion:
steady and low. Pretty Good Metrics: one big 2.1 s and a flat line.

**Scenario 4 (the ops room).** Hotspots: wall first (30,2,260×100) so the pc (10,88,126×98; stand 81) and the npc
(205,78,98×107; stand 148) win where they overlap it. **The wall of space:** 320 dots drifting toward the centre
on their own phases, one in fourteen stuck at the edge jittering in red; fixed, the stuck ones jump in over 1.5 s.
The flat green health line in both states. The chat column scrolls `wall.stat` up a line every 700 ms (eight
lines showing; a tap steps it); fixed, `wall.ok` in green. In the room the chat is grey bars. Page Einar: a phone
with one contact, three buttons and a ringing mark. The coding-agent tool's close button reads
**`[Close Claw Codez]`** from the data (the string, not a slot: see below). The win is `win`, `hero.line`, then
`manager.line`. Knight Watch's card has no painted frames; her **phone** (x 84–89, y 56–61 on the 128×80 card) is
a per-card overlay in the data: `#DFF4FF`, 1-px rows every other pixel, each a dark bar with a red dot at its left
end, moving up 1 px every 120 ms, clipped to the screen; still under reduced motion.

**Scenario 5 (the atrium).** Hotspots: wall (115,24,90×104), pc (0,128,118×68; stand 104), pinball (250,42,68×40,
Look only), npc (232,85,88×113; stand 176). **The monitor:** the sign-ups chart, a calm line with a small wobble
over the art's grid, both states; the inbox with `wall.stat` newest on top, a new line every 1.8 s (fixed: the
three `wall.ok` thanks, and few); the three readouts `wall.box.1` (0.4 %) and `wall.box.2` (5:52) unchanged in both
states, `wall.box.3` (11, red) → `wall.box.ok.3` (0, green); the chat panel's grey bars, the strip under it
empty. In the room: the line, red bars stacking up (two green once fixed), lights 1 and 2 steady green, 3 red then
green, grey chat bars. Friday's diff: a wall of red and green lines.

**The cards' animations** (part 1's code, now exercised): P2, P3 and P5 loop their painted frames card → 1 → 2 →
3 → 2 → 1 at 180 ms from `cards.json`; P4 runs the phone overlay; P1 its sparkle. Reduced motion: the still.

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **303 passed**, 0 skipped |
| `python3 -m pytest tools/tests -q` | **126 passed** |
| `npm run e2e`, one file at a time | **109 passed**: chapter 29, scenarios 20 (5 each for 2–5), creator 14, intro 17, walk-preview 9, menu 7, shell 9, weight 4 |

`tests/chapter-data.test.js` now asserts all five, brief 09's stand points for all of them, scenario 3's mirror
and extras, scenario 5's pinball, scenario 4's manager line. `tests/e2e/scenarios.test.js` runs its five tests
against each of 2–5 from the data alone.

## Scripted timings (Copy results), all five

200 wpm, a 1.2 s think before every choice, 844×390, the recovery watched to the end; `scratch/scenarios/timings.mjs`.

**Shortest** (title card → entry → PC → Honeycomb direct → deploy → recovery → Leave → persona: card, question → Get Honeycomb → win → verdict):

| Scenario | Total | Title card | Room | PC | Old tool | Honeycomb | Deploy + recovery | Wall display | Persona | Win + verdict | Windows | Taps | Missteps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **2:08** | 0:11 | 0:23 | 0:10 | 0:00 | 0:34 | 0:22 | 0:00 | 0:06 | 0:22 | 13 | 22 | 0 |
| 2 | **2:04** | 0:09 | 0:17 | 0:08 | 0:00 | 0:38 | 0:19 | 0:00 | 0:08 | 0:26 | 13 | 24 | 0 |
| 3 | **1:54** | 0:10 | 0:18 | 0:08 | 0:00 | 0:34 | 0:15 | 0:00 | 0:07 | 0:22 | 13 | 22 | 0 |
| 4 | **2:11** | 0:12 | 0:17 | 0:08 | 0:00 | 0:37 | 0:18 | 0:00 | 0:08 | 0:31 | 14 | 23 | 0 |
| 5 | **1:57** | 0:09 | 0:15 | 0:07 | 0:00 | 0:35 | 0:17 | 0:00 | 0:08 | 0:25 | 13 | 24 | 0 |

**Everything** (plus the wall close-up and a box, the persona's first call, three emails, status before, after the old tool, after the fix and after the deploy, all three old-tool prompts, all four Honeycomb nudges, the wrong advice first):

| Scenario | Total | Title card | Room | PC | Old tool | Honeycomb | Deploy + recovery | Wall display | Persona | Win + verdict | Windows | Taps | Missteps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **4:31** | 0:11 | 0:26 | 0:57 | 0:28 | 1:10 | 0:22 | 0:13 | 0:23 | 0:22 | 31 | 64 | 4 |
| 2 | **4:16** | 0:09 | 0:20 | 0:51 | 0:25 | 1:13 | 0:19 | 0:12 | 0:22 | 0:26 | 31 | 66 | 4 |
| 3 | **4:16** | 0:10 | 0:21 | 0:55 | 0:27 | 1:10 | 0:15 | 0:12 | 0:24 | 0:22 | 31 | 64 | 4 |
| 4 | **4:34** | 0:12 | 0:20 | 0:58 | 0:26 | 1:10 | 0:18 | 0:15 | 0:25 | 0:31 | 32 | 65 | 4 |
| 5 | **4:10** | 0:09 | 0:19 | 0:48 | 0:27 | 1:10 | 0:17 | 0:13 | 0:23 | 0:25 | 31 | 66 | 4 |

Every shortest path is inside the 2–3 minute target; every everything path is a minute or two over it, as
scenario 1's was. Scenario 4 is the longest both ways: the manager's line and the longest Honeycomb results.

## How the wall displays look at 667×375 (`scratch/scenarios/chN-*.png`)

- **3, broken:** the pale page with a short blue bar and the dark words over it, the spinner turning, the guitar
  in its panel, WAITING: 14 S / CARTS: ABANDONED / SALES: SLIDING changing on their own, a red line sliding
  down. **Found:** the same. **Fixed:** the bar full and green, "Order placed. Thank you!", the kind stats, the
  line climbing in green. In the room the TV is ringed by a sparse, flickering light on the brick.
- **4, broken:** the spiral of white dots turning inward with red ones stuck round the rim, the green line, the
  chat scrolling lag in nine languages. **Fixed:** the red dots scattered inside, the chat o7 / in! / finally / gf.
- **5, broken:** the calm line, the inbox filling with can't-sign-up mail, 0.4 %, 5:52 and a red 11. **Fixed:**
  the same line and readouts, the inbox three thanks, a green 0.

## Rectangles I nudged

- Scenario 3's `sign`: 263,48,32×25 → 263,46,32×28 (the 28-px minimum the room checker enforces; the brief
  asked for the padding).
- Nothing else. The brief's rectangles were checked against the built files and fit; the PC screens hold five
  items at 44 px in all four (scenario 2's 160×105 is the tightest).

## Lines that would not fit

None at 667×375 or 844×390 (asserted: every wall box's text inside its box, no font under 14 px, the PC text
inside its screen). The chat and inbox lines condense sideways if a name is long; none needs it.

## Strings that need a slot

- **`ch4.hc.close` — "[Close Claw Codez]"**: the coding-agent tool's close button. Carried as a literal in
  `js/chapters/ch4.js` until the slot exists; the data reads `close: 'ch4.hc.close'` the moment it does.

## Calls I made (and what each costs if wrong)

1. **The halo is translucent light on the brick, not white pixels** (the brief: "dithered in the room's own
   colours"). Two constants in `ch3-wall.js` (`GLOW` 8 px, the lit share) if Rick wants it softer or wider.
2. **Scenario 4's chat shows eight lines** at 14 px; the column could hold more but they would crowd.
3. **Scenario 5's inbox fills one line every 1.8 s** and keeps six; fixed, it shows the three thanks only (few).
4. **The star map's stuck dots are red** (`#FF6A4A`) so "never getting in" reads at room size; the brief did not
   name a colour.
5. **Scenario 3's old tool letters "2.1 s" and "avg page load" on the canvas** (VT323): the brief says none needs
   new words; these are the brief's own.
6. **Card crops for 3–5** (the fallback when the card art fails) are the persona's patch top from the plate.

## For Cloud Claude / Rick

- The TV glow's look is the one open aesthetic call; the screenshot `ch3-room.png` is the current state.
- `menu.soon` is unused now; the backlog notes it.
