# Warp brief 04 — Honeycomb reads as the solution: real SLO screens, no penalties inside it, apply the fix

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. Branch: **`warp/hc-solution`**, from `origin/sci-adventure`.

> **Updated 2026-11-12, later the same day.** Section 2 (the SLO screens) is **replaced by brief 06**: scenario 1 is now
> solved with Canvas and Agent Timeline, and its screens are ready-made pictures. Section 1 (no penalties inside Honeycomb,
> found → deployed, apply the fix) stands, read together with brief 05 (no score).

## Why

Rick played scenario 1 (2026-11-12). Two things were wrong with the Honeycomb screen:

- **It did not read as the solution.** Two of its three prompts were jokes, so Honeycomb looked as silly as Cave Logs.
- **It did not look like Service Level Objectives.** One orange curve on a dark panel says nothing to someone
  who knows the product, and less to someone who doesn't.

His direction: the screens look like Honeycomb's SLO page; "Service Level Objective" is spelled out on first use;
the last result says "Using Honeycomb SLOs, you found … without switching tools"; then the player goes back to
the PC, picks **[Apply the fix and deploy]**, and *that* is what brings Otto back, with a joke from Otto.

## Read first

- Spec › **The gamified Honeycomb** (rewritten), **Scoring** (rewritten), **Chapters › 1** (Flow, Decision).
- `script/script.md` › Chapter 1: `ch1.hc.*` (rewritten; the `jab` slots are now nudges), and the new slots
  `ch1.pc.menu.deploy`, `ch1.pc.deploy`, `ch1.otto.recovered`, `ch1.pc.vitals.found`. Already built into `js/script.js`.

## Build

### 1. Rules (pure modules first)
- **Nothing inside a Honeycomb screen costs points.** A non-direct prompt still shows its line (the `jab` key)
  and greys out, but it no longer counts as wrong. `scenarioScore` is 100, or 50 if `[Sign the contract]` was
  tried. Keep counting the nudges in the stopwatch; relabel that count "Honeycomb nudges".
- **Otto's state** is now three-way: `critical` → cause **found** (investigation finished) → **deployed**.
  The monitor turns OK on **deployed**, not on found. `[Check Otto's vitals]` shows `.before`, `.old`,
  `ch1.pc.vitals.found` (found, not deployed) or `.hc` (deployed).
- **[Apply the fix and deploy]** (`ch1.pc.menu.deploy`) appears on the PC menu once the cause is found, and
  goes away once used. Picking it: `ch1.pc.deploy`, then the scene cuts to the **monitor close-up** so the
  player watches the recovery (heartbeat steadies, lights go green, Otto types `ch1.vitals.output.ok`), then
  `ch1.otto.recovered` as a message window, then back to the PC menu. Reduced motion: the OK still, then the line.
- **The win needs deployed.** At the CTO, `[Get Honeycomb]`: deployed → win. Cause found but not deployed →
  `ch1.decide.hc.show`, then the deploy prompt on the spot (one prompt over the PC close-up), the same recovery
  sequence, then the win. Cause not found → `ch1.decide.hc.show`, the Honeycomb screen, and when it finishes,
  the deploy prompt and recovery as above, then the win. Backing out returns to the room, progress kept.

### 2. The Honeycomb screen looks like the SLO page
Replace `paintHc`. **Light UI**: page `#F4F5F7`, white cards with a 1 px `#C9CED6` border, text `#2B2F36`,
passing blue `#3158B8`, failing yellow `#F5B83D`, threshold orange `#F28C28`, alert red `#D64545`. The picture
keeps the left half of the scene; the prompts keep the right. Labels are real text (overlay elements placed from
scene rectangles, as the monitor close-up does), VT323, legible at 667×375. Keep them few and short:

- **Stage 0, the SLO's page.** Heading "Service Level Objective"; under it the SLO's name "Otto answers in
  under 5 seconds"; a row "Target 99% · 30 days"; a red status chip "Burning". Two cards side by side:
  **Budget Burndown** with a big "-3%" and a small line chart, and **Historical Compliance** with "98.6%" and a
  small line sliding under an orange target line.
- **Stage 1, after `[Open the burning SLO]`: Budget Burndown, large.** Y axis 100% at the top to -20%, light
  grid lines, an orange line at 0%. A blue line starts at 100% and goes down in **steps, one drop a night**,
  crossing 0% near the right; a pale orange band marks the last night. The reveal draws the line left to right.
  Label "Budget Burndown" and the big "-3%".
- **Stage 2, after BubbleUp.** Top: two small heatmaps side by side, "SLO Success Rate" (blue marks in a few
  horizontal bands) and "SLO Failure Rate" (yellow marks in one band). Under them a 3×2 grid of **dimension
  cards**, each a tiny bar chart with blue and yellow bars of similar height, except one, where the yellow
  bar towers: that card gets an orange outline that pulses during the reveal and its label reads
  "job = nightly-export". The other cards' labels are short greyed field names ("model", "region", "tenant",
  "tool", "version").

Dimension names are invented and generic; use no real customer or vendor names. Do not copy Honeycomb's logo or
draw one; the title bar's words are enough.

### 3. Housekeeping
- The scripted timing runs and the e2e paths gain the deploy step; report the two timings again.
- `UI` strings: none new should be needed; if one is, list it.

## Tests (first)

- Unit: the score (nudges free; sign → 50); Otto's three states and which vitals line each gives; the deploy
  item's visibility; the three `[Get Honeycomb]` outcomes.
- E2E: shortest path (PC → Honeycomb → deploy → watch recovery → leave → CTO → Get Honeycomb → 100); all four
  nudges tried still scores 100; found-but-not-deployed at the CTO; not-found at the CTO; the monitor is still
  critical between found and deployed; labels stay inside their cards at 667×375 and 844×390; reduced motion.

## Yours / off limits

**Yours:** `js/chapters/ch1.js`, `js/screens/chapter.js`, `js/engine/{scenario,prompts,runlog,vitals}.js`, new
files under `js/engine/`, `css/game.css` (chapter rules), `index.html` (cache-bust numbers), tests, a few lines
in `README.md` and `docs/backlog.md`.

**Off limits:** `script/script.md`, the spec, `assets/**`, `tools/**`, the intro, `js/menu.js`,
`js/engine/window.js` and `js/engine/message.js` (the message window was just narrowed to a readable measure;
leave its sizing alone).

## Hand back

`handbacks/2026-11-12-warp-hc-solution.md` on your branch, push, pull request into `sci-adventure`. Include a
screenshot description of each of the three stages at 667×375, the timings, your calls, and any label that
would not fit.
