# Hand-back: Warp brief 07 — the persona card (2026-11-13)

Branch `warp/persona-card`, pull request against `era-look`. **Stacked on briefs 09 and 10** (`warp/era-hero` #16,
`warp/era-conversations` #17): the brief says to do it after 10, and the CTO's lines after the card go through
brief 10's conversation window. Until those merge the pull request shows all three diffs.

## What I built

- **The title card** shows `card.title` and `card.line` only; the stats grid is gone, `ch1.card.stats` is gone from
  the chapter's data, and the five `chN.card.stats` slots are deleted from `script/script.md` (`js/script.js`
  rebuilt: 462 slots; no words changed).
- **`js/engine/persona.js`** (pure): `parseStats` (four `Name number` pairs split at ` · `, never throws),
  `cardPicture` (the card art when the chapter names one and it exists, else the persona cropped from the room
  plate), `personaOptions` (before a tool is tried: show the card, leave; after: the wrong instinct, Honeycomb, show
  the card), `OPTION_KEYS` (`persona.show`, `persona.leave`). `scenario.js` gains `cardSeen` and `firstTalk(s)`,
  true once per visit. `runlog.js` counts `cards` (label "Card views").
- **The card** (`showPersonaCard` in `js/screens/chapter.js`): a DOM overlay (`#persona-card`, a dimmed backdrop over
  the whole scene) holding `.pcard`, built from `ch.persona` (`name`, `class`, `stats`, `flavor`, `art`, `crop`).
  5:7, 94 % of the scene's height, centred; the brief's CSS, with every px size scaled by `--k`, the scene's height
  over a 667×375 phone's (346 px). The picture is `assets/cards/P1_card.png` (128×80, it exists on this branch),
  and if that file fails to load the CTO cropped from `R1_exec_floor` at 192, 62, 112×70 takes its place: the card
  is never empty and never waits. A tap anywhere (the backdrop is the target), Enter or Escape closes it; nothing
  else is tappable, the hero does not walk, no hotspot fires. Entrance: a 200 ms flip (`rotateY`); reduced motion:
  it just appears (`.still`). The CTO holds her plate frame while it is up.
- **When it opens:** the first Use on the CTO this visit, after the walk over; closing it starts her line. Every
  later Use goes straight to her line. **Every conversation ends in an option list**, drawn like the decision
  prompts (`#decide-<id>`): before a tool is tried, `[Show me your card again]` and `[I'll go and take a look]`
  after her call line; after, `[Sign the contract]`, `[Get Honeycomb]` and `[Show me your card again]` after her
  question. Show opens the card and returns to the same options; leave ends the conversation (back to the room).
  Showing the card is never a misstep. Look on her is unchanged.
- **The stopwatch** counts card views; the card's time falls in the `cto` phase (it opens inside `useCto`).
- **The strings that were waiting for slots** now come from the script: `ui.look`, `ui.use`, `ui.help`,
  `ui.back`, `ui.copy`, `ui.copied`, `claim.soon` in the chapter screen, `menu.soon` in the menu
  (`MENU_UI` deleted), and the tool close label per tool: `tools.old.close: 'ch1.old.close'`, `ui.close.hc` by
  default. `UI` keeps only `summaryTitle` (the summary is Rick's tuning tool).
- README's flow line and a backlog line (the card's picture is still until brief 08). Cache-bust `css?v=15`,
  `js?v=26`.

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **259 passed** (was 252: `tests/persona.test.js`, 7 tests) |
| `python3 -m pytest tools/tests -q` | **126 passed** (the script build test passes on the rebuilt `js/script.js`) |
| `npm run e2e`, one file at a time | **89 passed**: chapter 29 (7 new), creator 14, intro 17, walk-preview 9, menu 7, shell 9, weight 4 |

New e2e: the title card has no stats; the first Use opens the card (no line, the CTO still, a picture with a size),
a tap closes it without walking, her line follows; the second Use does not open it; `[Show me your card again]`
does and returns to the same options; after a tool is tried the options are sign / Honeycomb / show, and showing
the card is not a misstep; at 667×375 and 844×390 every text node is inside the card, nothing is clipped, no font
is under 14 CSS px, the card is 5:7 at 94 %, the art is the 128×80 file; with the art blocked the crop canvas is
painted; reduced motion: the card appears still and Escape closes it. The shortest path still wins (one more tap).
Helpers: `talkToCto`, `closeCard`, `pickOption` in `tests/e2e/_play.js`.

## How the card looks at 667×375

`scratch/persona-card/persona-card-667.png` (the art), `persona-card-crop-667.png` (the stand-in crop),
`title-card-667.png`, `options-667.png`, and the 844 pair. With the art: the frame fills the scene's height, the
picture is the whole 16:10 panel, the four stats fit on one line each with the numbers right-aligned, the flavor
takes two lines at 14 px. **With the stand-in crop:** the CTO at her desk with the lamp, slightly stretched to
16:10 (the crop is 112×70 = 1.6, so no distortion), readable. Nothing is clipped and no line is cut; the name and
class lines carry `text-overflow: ellipsis` as a guard, which no chapter's words trigger (the longest class,
"Rogue of the Friday Deploy", fits at 667).

## Scripted timings (Copy results)

Same scripted player as briefs 02–04: 200 wpm, a 1.2 s think before every choice, 844×390, the recovery watched
to the end. `scratch/persona-card/timings.mjs`.

**Shortest** (title card → entry → PC → Honeycomb direct → deploy → recovery → Leave → CTO: her card, her
question → Get Honeycomb → win → verdict): **2:08** (brief 04's 2:10). Class card 0:11 · Room 0:23 · PC 0:10 ·
Honeycomb 0:34 · Deploy + recovery 0:22 · CTO 0:06 · Win + verdict 0:22 · 13 windows · 22 taps · 1 card view.

**Everything** (plus the monitor and a box, the CTO's first call and leave, three emails, three vitals checks, all
three Cave Logs prompts, all four Honeycomb nudges, sign first): **4:32** (brief 04's 5:15: the title card lost its
stats and the CTO's call is one conversation now). Class card 0:11 · Room 0:26 · PC 0:57 · Old tool 0:28 ·
Honeycomb 1:10 · Deploy + recovery 0:22 · Monitor 0:13 · CTO 0:23 · Win + verdict 0:22 · 31 windows · 64 taps ·
1 card view · 4 missteps.

The card adds about 3 s to the shortest path (the flip, a look, the close) and the title card lost about 3 s.

## Calls I made (and what each costs if wrong)

1. **The card's scale base is 346 px**, the scene's height on a 667×375 phone (the brief said 347). At 347 the
   flavor line measured 13.96 px there; at 346 it is 14.0.
2. **Stats numbers are dark red (`#8A2E1C`)**, not the body's ink, so they read as values; the rest is the
   brief's palette.
3. **`[Sign the contract]` greys after the jab** as before; the option list rebuilds from `personaOptions` each
   time, so the greyed state and the three/two option shapes come from the same place.
4. **The whole scene is the card's close target**, including the thumb columns' buttons? No: Look/Use/Help are
   removed while the card is up only insofar as `state === 'pcard'` makes them inert (they check for `room`); a
   tap on one of them does not close the card. Cost if Rick wants them to: one line in the key/tap handler.
5. **Leave ends the conversation and re-enters the room** (`enterRoom`), which resets the icons and marks the
   phase `room`; her talk loop resumes.
6. **The card's picture is still** on this branch; brief 08 brings the painted frames and Knight Watch's phone
   (the backlog says so).

## Lines that would not fit

None at 667×375 or 844×390: every text node is inside the card and unclipped (asserted). Checked by eye for the
other chapters' slots with `parseStats` (four pairs each, the longest stat name "Patience with RUM tools" fits).

## Off-limits files touched

`script/script.md` (the five `chN.card.stats` deletions the brief allows; `js/script.js` rebuilt) and
`js/screens/menu.js` (the one `MENU_UI.soon` line item 5 names). Nothing else outside the list.
