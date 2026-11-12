# Warp brief 02 — the scenario menu and scenario 1, playable, with a stopwatch

Read `briefs/warp/PROTOCOL.md` first. Branch: **`warp/chapter-one`**, cut from `sci-adventure`.

```
cd ~/Documents/"Observability Quest Mobile"
git worktree add ../oqm-warp-chapter-one -b warp/chapter-one sci-adventure
cd ../oqm-warp-chapter-one
git config user.name Claude && git config user.email noreply@anthropic.com    # this worktree only
```

## Why

Rick has read the script (`script/script.md`) and timed it by word count: one scenario is about 2¼ minutes on
the shortest path and about 4 if you poke at everything, so the old plan — three scenarios per run — came to
seven minutes or more. **His decision (2026-11-11): one finished scenario is a win.** After the intro the player
**picks a scenario from a menu**; finishing it offers the prize; playing more is optional; the game tracks which
are done. That makes it a 2–3 minute engagement.

Nothing after the intro is playable yet, so this brief builds the menu, the first real room — the smallest
honest version of the room engine — scenario 1 on top of it, and a **stopwatch**, so Rick and his team can play
scenario 1 exactly as written and see what the clock says.

This is a **timing build with placeholder pictures**. The room's real art is being generated separately; your
room is flat code-drawn shapes. Do not spend time on looks. Spend it on the mechanics being the real ones, so
the time it measures is the time the finished game will take — and so the engine is the one the other four
chapters get built on.

## Read first

- `docs/superpowers/specs/2026-11-10-sci-adventure-design.md` — sections **Flow** (steps 4–6), **The scenario
  menu**, **Interface**, **The gamified Honeycomb**, **Chapters › 1**, **Scoring**. The spec is the authority; where this brief and
  the spec disagree, say so in the hand-back and follow the spec.
- `script/script.md` — its header (conventions), **Scenario menu** (`menu.*`, `after.*`) and **Chapter 1**
  (`ch1.*` slots). Every word the player reads
  comes from there, unchanged.
- The existing engine: `js/game.js` (state machine, `go()`, `ctx`, `window.__oq`), `js/engine/walk.js`,
  `js/engine/hero.js` + `hero-side.js`, `js/engine/cursor.js` (`actionAt`, tap marker, hover cursors),
  `js/engine/ui.js` (`colButton`), `js/screens/preview.js` (tap-to-walk and a hotspot — the pattern to grow
  from), `css/game.css` (landscape shell, thumb columns, `--ui-scale`).

## Build

### 1. The script becomes data
`tools/build_script.py` reads `script/script.md` and writes `js/script.js` (`export const SCRIPT = { 'ch1.room.enter': '…', … }`),
one entry per `###` slot, text exactly as written (trimmed; internal line breaks kept as spaces). It fails
loudly on a duplicate key or an empty slot. `js/script.js` is committed (the game has no build step at run
time). A test proves the committed file matches the markdown, so a script edit without a rebuild fails.
(The script header says `tools/build_script.mjs`; Python is fine — the other tools are Python — fix that line.)

### 2. Room engine, v1 — `js/engine/room.js` (+ helpers as you see fit)
A room is **data**: background painter (or image, later), floor row, walk range, hero start, and hotspots
`{ id, rect {x,y,w,h}, standX, look: scriptKey, use: scriptKey | action }`. The engine gives, per the spec:
- **Tap to act.** Floor tap → walk there. Hotspot tap → walk to its `standX`, then act. Side-on walk, front
  view at rest, tap marker and hover cursors — all already built; reuse them. Reduced motion teleports.
- **Icon bar** in the right thumb column: **Look**, **Use**, **Help** (44 px targets, must fit 667×375).
  Use is the default; Look then a hotspot gives the `look` line and the mode returns to Use; Help shows one
  window explaining the three.
- **Message window** over the scene, SCI-style (white, black border, hard shadow), VT323, typewriter at
  25 ms/char, tap completes, tap again dismisses; paginates when the text does not fit (three lines on a
  375-px-tall phone). Hero lines keep their class prefix from the script. While a window is open, taps do
  not walk.
- **Tool screen**: takes over the scene box — a title bar, a simple code-drawn picture, an intro line, and
  up to three bracketed prompt buttons. A wrong prompt shows its jab and greys out; a right one shows the
  result. Multi-step (the Honeycomb screen has two steps). The old-tool screen has only wrong prompts and an
  exit.
- **Score** in the status bar, `Score: N of 500`, per the spec's Scoring section (100 clean; 50 if any wrong
  prompt was tried inside the Honeycomb screen; the old tool is free; never goes down).
Keep the pure parts pure and unit-tested (hotspot lookup, the prompt/score state machine, pagination,
typewriter progress); the screen module does DOM and canvas.

### 3. Chapter 1 — `js/chapters/ch1.js`
Per spec **Chapters › 1** and the `ch1.*` slots:
- **Class card** (title, stats, line; tap to continue) → **room** with `ch1.room.enter` on entry.
- Hotspots: **laptop** (look / use → the situation), **contract** (look / use), **wall screen** (look),
  **terminal** → the **Cave Logs Inc.** old-tool screen (`ch1.old.*`: three wrong prompts, jabs, exit line),
  **workstation** (look; use → the **Honeycomb · SLOs** screen, `ch1.hc.*`: step 1 and step 2, each with one
  right prompt — the first listed — and two wrong ones with jabs).
- On the second right answer: `ch1.win`, then `ch1.hero.line`, then the **verdict** window with Christine's
  portrait (`assets/portrait_christine.png`) and `ch1.verdict`, then the summary below.
- The player is never stuck and never forced through the optional things: the shortest path is card → enter
  line → workstation → two right prompts → win → verdict. (The spec does not require using the laptop first;
  do not add a gate.)
- Placeholder room: a flat wall, a floor band, and labelled flat blocks where the five things are. Put the
  rectangles and stand points in one data object so real art can replace the painter later without touching
  logic. Product-screen pictures: a few flat shapes are enough (a burn line going up; a row of twelve bars
  with one that glows on the right answer). The result may "animate" by a 1.5–2 s reveal; no more.

### 4. The stopwatch — the point of the exercise
`js/engine/runlog.js`: records, with `performance.now()`, when each phase starts and ends — **card, room
(first entry until the Honeycomb screen opens), old tool, Honeycomb screen, win + verdict** — plus counts:
message windows shown, taps, walks and total walking time, wrong prompts, Look uses, hotspots visited. Time
spent under the rotate gate or with the tab hidden does not count.
- After the verdict, a **summary window**: total time for the scenario as `m:ss`, the per-phase breakdown, the
  counts, the score, and the buttons described in section 5, including **Copy results** (plain text to the clipboard, also printed to the console as one JSON line so several people's
  runs can be pasted into a chat and compared).
- `window.__oq.run` exposes the same object for the tests.

### 5. The scenario menu and the flow
Title → sheet → intro (Skip works as now) → **scenario menu** → the chosen scenario → verdict → the choice.
- **Menu** (`js/menu.js` for the pure part, a screen for the rest), per the spec's *The scenario menu*: a
  Sierra window titled `menu.title` with `menu.hint`, and five rows — `menu.chN.name` and `menu.chN.hook`.
  Rows are ≥ 44 px, the list fits 667×375 without scrolling. **Only scenario 1 exists**: rows 2–5 are shown
  but disabled, visibly ("coming soon" is fine — that string is yours, flag it in the hand-back).
- **Completion** in `sessionStorage` under `oq.done` (scenario → best score), surviving a reload. A finished
  scenario's row shows `menu.done` and its score, and can be replayed; a replay keeps the better score. The
  status-bar score is the sum of best scores.
- **After the verdict**: the timing summary (section 4), whose buttons are `after.claim` and `after.more`
  under `after.prompt`, plus **Copy results**. `after.more` returns to the menu. `after.claim` has nowhere to
  go yet (Charity's final and the claim form are a later brief): show a one-line placeholder window saying so
  and return to the menu. Once one scenario is done and the prize is unclaimed, the menu itself also carries
  the claim button.
- `?ch=1` skips the menu and goes straight into scenario 1 after the intro; any other value shows the menu.
- Keep the preview room reachable at `?preview=1` for the walk and cursor tests.

### 6. Tests
Unit tests for every pure part. Browser tests, at 844×390 touch and at 667×375:
- shortest path end to end: score 100, summary shows a time, `__oq.run` phases add up to the total (±50 ms);
- one wrong Honeycomb prompt first → 50, the prompt greys out and cannot be chosen again;
- the old tool: all three jabs, exit, score unchanged, time recorded under "old tool";
- Look mode gives the look line and returns to Use; Help opens and closes;
- a long line paginates at 667×375 and nothing overflows the scene; all icon-bar and prompt targets ≥ 44 px;
- rotate to portrait mid-room: paused, the clock stops, resumes on rotate back;
- reduced motion: no walking animation, same results;
- the menu: five rows, only the first enabled; finishing scenario 1 ticks it and shows its score; the mark and
  score survive a reload; a replay with a worse result keeps the better score; `?ch=1` skips the menu;
- replaying from the menu starts at the class card with the clock reset.
Update the existing tests that expect the intro to land in the preview room.

## Yours / not yours

**Yours:** `tools/build_script.py` (+ test), `js/script.js`, `js/menu.js`, `js/engine/room.js` and any new engine modules,
`js/engine/runlog.js`, `js/chapters/ch1.js`, new `js/screens/menu.js` and `js/screens/chapter.js`, the wiring in `js/game.js`, the one
line in `js/screens/intro.js` that names the next screen, `css/game.css` (additions for the window, icon bar,
tool screen, summary), `index.html` `?v=`, tests, README, `docs/backlog.md`, the one tool-name line in the
script header.

**Off limits:** every word of `script/script.md` below its header (Rick is editing it — if a slot is missing or
unusable, list it in the hand-back and work around it); `assets/` (read only); `tests/fixtures/`; the hero
renderers and `tools/hero_gen.py`; `js/intro/`, `tools/build_intro.py`; `js/creator-state.js`,
`js/screens/creator.js`; `docs/superpowers/`; `scratch/`; `main`, `sci-adventure`.

## Done when

- All three suites pass in your worktree; `git diff sci-adventure -- tests/fixtures script/script.md assets`
  shows only the script's one header line.
- `npm run serve` → title → sheet → Start → Skip → chapter 1 is playable start to finish on a phone-sized
  landscape window by tapping only, and ends on the timing summary.
- Hand-back at the main folder's `scratch/warp-chapter-one-handback.md`, including **your own two timed runs**
  pasted from Copy results — one shortest path, one doing everything — and anything in the spec or script that
  made the chapter awkward to play (dead ends, lines too long for the window, prompts that read as equally
  right).

## Not in this brief

Scenarios 2–5, Charity's final, claim/complete, real room art, the product-screen kit beyond the two
simple pictures, music, the hand-pulse on entering a room. Do not cut or rewrite script lines to make the
chapter shorter — measuring it as written is the whole point.
