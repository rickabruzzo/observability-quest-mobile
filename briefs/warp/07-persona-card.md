# Warp brief 07 — the persona card

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. Do this **after briefs 04–06**. Branch
**`warp/persona-card`** from **`origin/era-look`** and open the pull request against `era-look` (the fork rule
in `briefs/PROTOCOL.md`; the card itself is the same in both looks).

## Why

Rick, 2026-11-12: the player is always the Honeycomb Hero, and each scenario's **persona is the person in the
room** (scenario 1: the CTO). Their stats no longer belong on the scenario's title card. Instead:

- The **first time** the player talks to the persona, **their card pops up**: a fantasy trading card with the
  persona in a silly class outfit, their name, class, four stats and a line of flavor.
- **Closing the card starts their dialogue.**
- The card opens by itself only that first time. After that, the persona's dialogue has an option to **show
  the card again**.
- The scenario's **title card loses the stats**.

## Read first

- Spec › **The persona card**, and › Flow (the title card).
- `script/script.md` › **The persona card** (`persona.show`, `persona.leave`) and, per chapter,
  `chN.persona.name`, `.class`, `.stats` (four stats split at ` · `, each "Name number") and `.flavor`. Built
  into `js/script.js`.
- `briefs/art/02-persona-cards.md` for what the picture will be. The art is not here yet.

## Build

### 1. The title card
The scenario's opening card shows `card.title` and `card.line` only. Remove the stats grid from it.

### 2. The card
A DOM overlay over the dimmed room, built from the chapter's data (`persona: { name, class, stats, flavor, art,
crop }` in `js/chapters/ch1.js`): a portrait card, **5:7, 94% of the scene's height**, centred. Top to bottom:
the name bar; the picture (16:10); the class line; a box with the four stats, one per line, name left and
number right; the flavor line in italics under a rule.

- **The frame is ours, in CSS**: it is *a* trading card, not a copy of any real card game's frame, symbols or
  wording. This starting point fits a 667×375 phone (scene 555×347) with every line inside; sizes are in px
  for that case, so scale them with the card (a custom property from the scene height, as `--ui-scale` does):

  ```css
  .pcard { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); height: 94%; aspect-ratio: 5 / 7;
           box-sizing: border-box; padding: 6px; background: #2A3346; border: 3px solid #0E1220;
           box-shadow: 0 0 0 2px #C9A227, 4px 5px 0 #000; font-family: var(--font-text); color: #1A1C22;
           display: flex; flex-direction: column; gap: 4px; }
  .pcard .name   { background: #E9DDB8; border: 2px solid #0E1220; padding: 1px 6px; font-size: 20px; line-height: 22px; }
  .pcard .art    { border: 2px solid #0E1220; background: #000; aspect-ratio: 16 / 10; }
  .pcard .art img, .pcard .art canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; }
  .pcard .class  { background: #E9DDB8; border: 2px solid #0E1220; padding: 0 6px; font-size: 17px; line-height: 20px; }
  .pcard .body   { flex: 1; background: #F3EBD2; border: 2px solid #0E1220; padding: 3px 6px;
                   display: flex; flex-direction: column; justify-content: space-between; }
  .pcard .stat   { display: flex; justify-content: space-between; font-size: 16px; line-height: 17px; }
  .pcard .flavor { font-style: italic; font-size: 14px; line-height: 15px; color: #4A4636; border-top: 1px solid #B9AE8A; padding-top: 2px; }
  ```
- **The picture.** If `assets/cards/P<n>_card.png` exists (128×80), show it. Until it does, show the persona
  cropped from the room plate: for scenario 1, `R1_exec_floor.png` at x 192, y 62, w 112, h 70. The card must
  never be empty and never wait on a missing file.
- **Closing.** A tap anywhere (on the card or off it), or Enter/Escape, closes it. The whole scene is the
  target. Nothing else is tappable while it is up.
- **Entrance.** A short flip or slide (about 200 ms). Reduced motion: it just appears.
- The CTO holds on her plate frame while the card is up.

### 3. When it opens, and the dialogue
- **First Use on the persona in this visit to the scenario**: the hero walks over, the card opens. On close,
  the conversation starts as it would have.
- **Every later Use**: straight to the conversation.
- **Every conversation with the persona ends in an option list**, drawn like the decision prompts:
  - before a tool has been tried: the next `ch1.cto.call.*` line, then `[persona.show]` and `[persona.leave]`;
  - after: `ch1.cto.ask`, then `[ch1.decide.sign]`, `[ch1.decide.hc]` and `[persona.show]`.
  `persona.show` opens the card; closing it returns to the same options. `persona.leave` ends the
  conversation. Showing the card is never a wrong choice.
- Look on the persona is unchanged (the narrator's line, no card).

### 4. The rest
- The stopwatch counts card views; the card's time belongs to the `cto` phase.
- `script/script.md` is off limits except: **delete the five `chN.card.stats` slots** once nothing reads them,
  and rebuild `js/script.js`. Change no words.

### 5. The strings that were waiting for slots
They have slots now: `ui.look`, `ui.use`, `ui.help`, `ui.back`, `ui.close.hc`, `ch1.old.close`, `ui.copy`,
`ui.copied`, `menu.soon`, `claim.soon`. Read them from `SCRIPT` and delete those entries from the `UI` and
`MENU_UI` tables. The stopwatch summary's own labels stay in code: the summary is Rick's tuning tool and comes
out before the booth build.

## Tests (first)

- Unit: the card opens on the first Use only; which options each state offers; `persona.show` returns to the
  same options; stats parse into four name/number pairs for all five chapters' slots; the picture falls back
  to the crop when the card art is missing.
- E2E: the title card shows no stats; first Use on the CTO opens the card and closing it shows her line; a
  second Use does not open it; `[Show me your card again]` does; every text node of the card is inside the
  card at 667×375 and 844×390, and no font on it is under 14 CSS px at 667×375; reduced motion; the shortest
  path still wins (it gains one tap: closing the card). Report the two scripted timings again.

## Yours / off limits

**Yours:** `js/chapters/ch1.js`, `js/screens/chapter.js`, `js/engine/` (new files, `scenario.js`, `runlog.js`),
`css/game.css`, `index.html` (cache-bust), tests, a few lines in `README.md` and `docs/backlog.md`.

**Off limits:** `assets/**`, `tools/**`, the spec, the intro, `js/engine/window.js`, `js/engine/message.js`,
and `script/script.md` apart from the five deletions.

## Hand back

`handbacks/<date>-warp-persona-card.md`, push, pull request into `sci-adventure`. Say how the card looks at
667×375 with the stand-in crop, and list any line that would not fit.
