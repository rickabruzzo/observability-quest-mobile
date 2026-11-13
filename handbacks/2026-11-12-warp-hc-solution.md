# Warp hand-back — briefs 04 (section 1), 05 and 06, combined: scenario 1 solved the real way, no score

Branch `warp/hc-solution`, from `origin/sci-adventure` at `a95d9db`. None of 04, 05 or 06 was merged, so all three
are on this one branch and this is the one hand-back, as briefs 05 and 06 allow. Before pushing, I merged the
latest `origin/sci-adventure` (`c80f0db`, scenario 2 grounded) as Rick asked. It merged cleanly. `js/script.js`
did not conflict, and a rebuild (`python3 tools/build_script.py`, 317 slots) gave the same file. The merge
changed only `ch2.*` slots and the `menu.ch2.hook` line.

## Suites (last run, after the merge)

- `npm test`: **235 pass, 0 fail**.
  - New: `tests/verdict.test.js`, `tests/hc-screens.test.js`, `tests/no-score.test.js`.
  - Rewritten: `prompts`, `scenario` and `menu` tests.
  - Updated: `runlog` tests.
- `python3 -m pytest tools/tests -q`: **94 passed** (from a scratch venv built from `tools/requirements.txt`).
- `npm run e2e`: **79 pass, 0 fail**.
  - `tests/e2e/chapter.test.js` is rewritten: 19 tests.
  - `tests/e2e/menu.test.js`: 7 tests.
  - `_play.js` gains `deployAndRecover`, `dismissMsg`, `charitySays`, and a `cave` option on `playShortest`.
- `git diff origin/sci-adventure -- assets tools script docs/superpowers js/intro js/screens/intro.js js/screens/creator.js js/engine/window.js js/engine/message.js js/claim.js` is empty.

## What I built

### Brief 04 §1: Honeycomb is the solution
- **Nudges are free.** A non-direct Honeycomb prompt shows its line, greys out and is counted as a "Honeycomb nudge" in the stopwatch. It is never a misstep.
- **Otto is three-way.** `ottoState`: critical → **found** (investigation finished) → **deployed**.
  - The monitor turns OK only on deployed.
  - `[Check Otto's vitals]` shows, in order: `.before`, `.old` (once Cave Logs is tried), `ch1.pc.vitals.found`, `.hc`.
- **`[Apply the fix and deploy]`** appears on the PC menu once the cause is found, before Leave computer, and is gone once used.
  - Picking it shows `ch1.pc.deploy`, then cuts to the monitor close-up. Otto recovers: steady trace, green lights, the OK stats, and he types `ch1.vitals.output.ok`.
  - Once he has finished his sentence, plus a 0.9 s beat, `ch1.otto.recovered` opens as a message window, then it's back to the PC menu.
  - A tap during the watch skips to his line. Reduced motion: the OK still, then the line.
- **The win needs deployed.** `[Get Honeycomb]` at the CTO:
  - deployed → the win;
  - found → `ch1.decide.hc.show`, then the PC close-up with the deploy prompt alone, the recovery, then the win;
  - not found → `ch1.decide.hc.show`, the Honeycomb screen, and on finishing it the deploy prompt, the recovery, then the win.
  - Closing the Honeycomb screen in "show me" returns to the room with progress kept.

### Brief 05: no score
- **Removed:** `CLEAN`, `MESSY`, `toolScore`, `scenarioScore`, `PER_SCENARIO`, `MAX_SCORE`, `totalScore`, `ctx.setScore`, the runlog's score and the summary's Score row. `tests/no-score.test.js` checks that no module under `js/engine/`, `js/menu.js` or `js/chapters/` exports anything named for a score.
- **Status bar:** `status.done` ("Solved: N of 5"), which ticks up at the win (`ctx.setSolved` / `ctx.showSolved` in `js/game.js`).
- **Missteps** = old-tool prompts picked + `[Sign the contract]`.
  - `oq.done` is now `{"v":2,"done":{scenario: missteps}}`, and a replay keeps the fewer.
  - The old format (unversioned scenario → score) is still read: 100 → 0 missteps, anything else → 1.
- **Menu:** a solved scenario shows a drawn tick and `menu.done`, with no number.
- **Charity:** `js/engine/verdict.js` (`charityVerdict`, `fillN`) and `js/screens/charity.js`.
  - Both Claim buttons (the summary's and the menu's) play her portrait takeover (`assets/portrait_charity.png`) with `final.header` on top.
  - Then the mood line, the count line with `{n}` filled, and the existing "prize desk opens in a later build" line. The summary's Claim then goes to the menu.
- **Stopwatch summary:** the Score row is replaced by a Missteps row. It gains a "Deploy + recovery" phase, and "Wrong HC prompts" becomes "Honeycomb nudges".

### Brief 06: the Honeycomb screens are the pictures
- **Loading.** `js/engine/images.js` now reads a screen manifest's `stages[].image` as well as a room's `images`. The chapter loads `assets/screens/ch1_hc.json` and its three PNGs with the room's pictures, and the class card waits for both (6 s cap; either can fail and the game plays on).
- **Drawing.** `paintHc(g, stage, p, screens, reduced)` in `js/engine/screens.js` draws the stage's picture at `pic` (4, 20, 188×176) with a 2 px `#2A3346` frame on black. The code-drawn chart is gone.
- **The reveal.** A direct prompt starts it. For the first 40% of `REVEAL_MS` (now 2 s) the new picture wipes in left to right over the old one. Then its `highlights` pulse in a 2 px `#F28C28` outline: on, off ×4, ending on. They stay outlined while that stage shows. Stage 0's highlight is on from the moment the screen opens. Reduced motion: picture and outline at once.
- **Layout.**
  - `.tool-prompts` starts at 61.5% for both tools.
  - Cave Logs' JSON wall now fills the same `TOOL_PIC` rectangle (exported from `js/chapters/ch1.js`; a test checks it equals the manifest's `pic`).
  - At 667×375 the three prompts and the close button fit under the title bar, clear of the picture, every target ≥ 44 px, without reducing the gap. The longest prompt wraps to three lines.
- No overlay labels; this build never added the brief 04 §2 SLO labels.

## Scripted timings (Copy results)

As before, these come from a script, not a person: 200 wpm reading, a 1.2 s think before every choice, 844×390. The recovery is watched to the end, not skipped.

**Shortest:** card → entry → PC → Honeycomb (direct) → deploy → recovery → Leave → CTO → Get Honeycomb → win → verdict.
```
Observability Quest · scenario 1 · 2:10
Class card: 0:14
Room: 0:24
PC: 0:09
Old tool: 0:00
Honeycomb screen: 0:33
Deploy + recovery: 0:21
Monitor: 0:00
CTO: 0:06
Win + verdict: 0:22
Message windows: 12
Taps: 21
Walks: 2
Walking time: 0:03
Honeycomb nudges: 0
Old-tool prompts: 0
Look uses: 0
Hotspots visited: 2
Emails opened: 0
Vitals checks: 0
Monitor visits: 0
Signed: 0
Missteps: 0
```

**Everything:** as in brief 03, plus all four Honeycomb nudges and a vitals check before and after the deploy.
```
Observability Quest · scenario 1 · 5:15
Class card: 0:14
Room: 1:01
PC: 1:06
Old tool: 0:27
Honeycomb screen: 1:08
Deploy + recovery: 0:21
Monitor: 0:15
CTO: 0:20
Win + verdict: 0:22
Message windows: 34
Taps: 73
Walks: 3
Walking time: 0:04
Honeycomb nudges: 4
Old-tool prompts: 3
Look uses: 3
Hotspots visited: 3
Emails opened: 2
Vitals checks: 4
Monitor visits: 1
Signed: 1
Missteps: 4
```

Compared with brief 03 (1:41 / 4:10):
- The **deploy + recovery** sequence adds **21 s** to the shortest path: the deploy line, about 5.6 s of Otto typing, and his pod-bay joke.
- The Canvas intro and the results are longer lines.
- The shortest path is now at the top of the 2–3 minute target.
- Doing everything is over it by two minutes; the four nudges alone add about 35 s.

## The three stages at 667×375

All baked text is the 5×7 font at 1.73× (about 9 CSS px per glyph row). I read it in the screenshots: the big numbers are crisp, the small labels are legible but small on a phone.

- **Stage 0, Canvas** ("Canvas / Otto alert"):
  - Left: a column of thumbnail graphs.
  - Right: the Investigation card with Summary, What happened, "Worst: 52262ea7", and the "Strongest signal: order-status tool loop" block outlined in orange.
  - The prompts column sits to the right; the longest prompt wraps to three lines.
  - Readability: "Investigation", "Summary" and "Strongest signal" read well. The grey placeholder lines are decoration.
- **Stage 1, Agent Timeline:**
  - "Duration 11 min" and "Total tokens 411,448" are large and easy to read; "19 LLM calls · 97 tool calls" under them.
  - The timeline rows: supervisor, order-status (agent / LLM / tools), refunds.
  - The grid of tool calls is outlined.
  - Readability: the legend ("agent ■LLM ■tool") is the smallest text and the hardest to read.
- **Stage 2, the LLM call:**
  - Left: the timeline with the slow call selected.
  - Right: "Input tokens 57,293" (large, outlined), "call 1: 1,174", Messages / USER "Where is my order?", and a TOOL block "lookup_orders, 97 orders, 145 KB" (outlined).
  - Readability: everything that matters reads; "Gen AI / Fields" tabs are small.

**Look at this (assets, not mine to change):** `ch1_hc_0.png` and `ch1_hc_2.png` already have `#F28C28` boxes baked in, at or near their manifest highlight rectangles. `ch1_hc_1.png` does not.
- Stage 2's baked boxes sit on the manifest rects, so the drawn pulse lands on top of them and its "off" frames still show orange. The pulse barely reads.
- Stage 0's baked box is inside the manifest rect (76–180 × 100–153 against 75–182 × 88–156), so with the outline on you see two orange boxes, one inside the other.
- The fix is in `tools/build_hc_screens.py`: either drop the baked boxes (my outline then does all the work) or drop the highlights from the manifest.

## Calls I made (and what each costs if wrong)

1. **`REVEAL_MS` 1.6 → 2.0 s:** 0.8 s of wipe, then 1.2 s of pulsing (about 130 ms per half-pulse). At 1.6 s the pulse was a flicker.
2. **A "Deploy + recovery" stopwatch phase,** so Rick can see its cost (21 s). It runs from the deploy line to the end of Otto's line.
3. **The deploy-only PC view** (from "show me") has no way out. The one prompt is the obvious next step, and you can't be stuck there.
4. **A tap during the recovery watch skips to Otto's line.** Without a tap, it waits for him to finish typing, plus 0.9 s.
5. **Charity on the menu's Claim button too,** not only the summary's. The brief names the summary's; the menu's showed the same placeholder before, so it gets the same verdict.
6. **Missteps:** each Cave Logs prompt picked counts once (up to 3), and Sign once, so a scenario can carry up to 4. Only zero vs non-zero matters to Charity today.
7. **The menu's tick is drawn in CSS** (`.mr-tick`), not a glyph: VT323 has no reliable check mark, and no new string is needed.
8. **Two edits outside the brief's file lists, needed to remove the score:**
   - `js/screens/title.js:9`: `ctx.setScore(0)` → `ctx.showSolved()`. That method no longer exists, so the title screen would have thrown.
   - `index.html:13`: the status bar's first text now reads "Solved: 0 of 5", and the span's id is `sb-done`. Before this it said "of 500".
9. **The Honeycomb screen's close button is unchanged** (`[Close Honeycomb]`), and a finished screen re-opens with only the close button.

## Strings

None new. Charity's closing line reuses `UI.claimSoon`; the tick is drawn. Still waiting for slots from earlier briefs: Look / Use / Help, Back, `[Close Cave Logs]`, `[Close Honeycomb]`, Copy results / Copied, "coming soon", the claim placeholder line, and the summary's labels.

## For Cloud Claude / Rick to look at

- **The baked orange in `ch1_hc_0.png` / `ch1_hc_2.png`** (above).
- **`js/claim.js:7, 92`** still fills a hidden `quest_score` field when the claim form is mounted. It isn't wired yet; when it is, that field should carry scenarios solved (or missteps). Off limits here.
- **`js/screens/chapter.js`, the deploy flow:** see `deployFix` and the `recover` state. The tick finishes the watch once Otto has typed his answer.
- **`css/game.css`:** `.tool-prompts` is now `left: 61.5%`. New at the end: `.mr-tick`, `.charity`, `.charity-portrait`, `.charity-head`.
- **`index.html`:** bumped to `css ?v=13` / `js ?v=24`.
