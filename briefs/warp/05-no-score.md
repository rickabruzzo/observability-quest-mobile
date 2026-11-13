# Warp brief 05 — no score

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. **Do this after brief 04.** If 04 is not merged
yet, add this to the same branch (`warp/hc-solution`) and say so in the hand-back; otherwise branch
**`warp/no-score`** from `origin/sci-adventure`.

## Why

Rick, 2026-11-12: **ditch the score.** Points were the badge game's achievement badges; chasing a higher number
means nothing here. A scenario can only be finished by choosing correctly; the player decides when to end the
game, and Charity gives them some grief at the end if they made wrong choices on the way. Brief 04's "100, or 50
if signed" rule is replaced by this brief.

## Read first

- Spec › **No score** (replaces Scoring), **The scenario menu**, **Interface** (status bar).
- `script/script.md`: `status.done` ("Solved: {n} of 5") replaces `status.score`; `complete.score` is gone;
  **Final — Charity Majors** is rewritten (`final.clean`, `final.grief`, `final.count.one|some|all`). Built into
  `js/script.js`.

## Build

1. **Remove scoring everywhere**: `CLEAN`/`MESSY`/`toolScore` (`js/engine/prompts.js`), `scenarioScore`
   (`js/engine/scenario.js`), `PER_SCENARIO`/`MAX_SCORE`/`totalScore` (`js/menu.js`), the score in the runlog and
   the summary screen, `ctx.setScore`, and every "of 500". No number that reads as points appears anywhere.
2. **Status bar**: right side shows `status.done` with `{n}` = scenarios solved. It ticks up at the win.
3. **Missteps instead of points.** A scenario's missteps = old-tool prompts picked + wrong advice given
   (scenario 1: `[Sign the contract]`). Nothing inside a Honeycomb screen is a misstep. `oq.done` becomes
   scenario → missteps; a replay keeps the fewer. Read an old-format `oq.done` (scenario → score) without
   crashing: treat a stored 100 as 0 missteps and anything else as 1.
4. **Menu**: a solved scenario shows its tick and `menu.done`, no number.
5. **Charity's verdict, as a pure function** (suggest `js/engine/verdict.js`): given `oq.done`, return the mood
   key (`final.clean` if every solved scenario has 0 missteps, else `final.grief`) and the count key
   (`final.count.one` for 1, `.all` for 5, `.some` otherwise, with `{n}` filled). **Wire it into the claim stub**:
   the summary's Claim button shows Charity's portrait takeover (`assets/portrait_charity.png`, as the scenario
   verdict does) with `final.header`, the mood line, then the count line, then the existing "prize desk opens in
   a later build" line and back to the menu. The claim form itself and the coda stay out of scope.
6. **The stopwatch summary** keeps its times and counts (it is a tuning tool for Rick); drop the Score row and
   add a Missteps row.

## Tests (first)

- Unit: the verdict function (clean, grief, each count key, `{n}`); missteps counting; old-format `oq.done`;
  menu rows carry no score; nothing exported named score.
- E2E: the status bar reads "Solved: 0 of 5" then "Solved: 1 of 5" after the win; the menu shows the tick and no
  number; clean run → `final.clean` + `final.count.one` at Claim; a run that signed or picked a Cave Logs prompt
  → `final.grief`; the page contains no "Score" text on any screen of scenario 1.

## Yours / off limits

**Yours:** `js/menu.js`, `js/game.js` (status bar wiring only), `js/screens/{menu,chapter}.js`,
`js/engine/{prompts,scenario,runlog}.js`, new files under `js/engine/`, `css/game.css`, `index.html`
(cache-bust), tests, a few lines in `README.md` and `docs/backlog.md`.

**Off limits:** `script/script.md`, the spec, `assets/**`, `tools/**`, the intro, the creator,
`js/engine/window.js`, `js/engine/message.js`, `js/claim.js`.

## Hand back

`handbacks/2026-11-12-warp-no-score.md` (or a section in brief 04's hand-back if you combined them), push, pull
request into `sci-adventure`.
