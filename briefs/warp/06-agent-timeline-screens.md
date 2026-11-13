# Warp brief 06 — scenario 1's Honeycomb screens: Canvas, Agent Timeline, the LLM call

Read `briefs/PROTOCOL.md` and `briefs/warp/PROTOCOL.md` first. This **replaces section 2 of brief 04** (the SLO
screens). If briefs 04 and 05 are not merged yet, do this on the same branch and hand back once; if they are,
branch **`warp/agent-timeline`** from `origin/sci-adventure`.

## Why

Rick, 2026-11-12: solving an LLM chatbot with Service Level Objectives is the wrong story. The way you actually
debug an errant chatbot in Honeycomb is the one in Honeycomb's own agent-observability demo: an alert starts an
**automatic investigation in Canvas**; you open the worst conversation in **Agent Timeline**; you open one **LLM
call** and see what the model was sent. Scenario 1's script is rewritten that way (`ch1.hc.*`, the vitals lines,
the win and the verdict; keys unchanged), and the three screens are **drawn already**.

## What is ready

- `assets/screens/ch1_hc_0.png`, `ch1_hc_1.png`, `ch1_hc_2.png`: 188×176 pixel-art pictures (64 colours, text baked in
  with the game's 5x7 font). Stage 0 is the Canvas investigation, stage 1 is Agent Timeline, stage 2 is the LLM call.
- `assets/screens/ch1_hc.json`: `pic` (where the picture sits on the 320×200 scene: x 4, y 20, w 188, h 176) and,
  per stage, `image`, `what`, and `highlights` (rectangles in picture coordinates).
- They are built by `tools/build_hc_screens.py`. Do not rebuild or edit them; if one needs changing, say so.

## Build

1. **Draw the pictures.** `paintHc(g, stage, p)` draws stage `stage`'s picture at `pic` with a 2 px `#2A3346`
   frame around it, on black. Load the three PNGs and the manifest with the room images (same loader, same
   wait), so the Honeycomb screen never opens on an empty frame. Delete the code-drawn chart.
2. **The reveal** (`p` from 0 to 1 over `REVEAL_MS`, after a direct prompt): the new stage's picture wipes in
   left to right over the old one. When it is in, the new stage's `highlights` pulse: a 2 px `#F28C28` outline,
   on/off four times, ending on. They stay outlined while that stage is showing. Stage 0's highlight shows from
   the moment the screen opens (it is where the summary points). Reduced motion: the new picture and its
   outlines at once.
3. **Layout.** The picture is wider than before, so the prompts column starts at 61.5% instead of 50%
   (`.tool-prompts { left: 61.5% }`) for **both** tools. Cave Logs' code-drawn JSON wall moves to the same `pic`
   rectangle. Check at 667×375 that three prompts (the longest wraps to three lines) and the close button all
   fit under the title bar with 44 px targets; if they do not, reduce the gap before you reduce the font.
4. **No overlay labels.** The pictures carry their own text. Remove any label elements a brief 04 build added
   for the SLO screens.
5. **Words.** Nothing new: `ch1.hc.title` is now "HONEYCOMB · LLM OBSERVABILITY", and every prompt, nudge and
   result is in the script under the same keys. The nudges are free (brief 04) and nothing is scored (brief 05).

## Tests (first)

- Unit: the manifest's stages match the tool's steps + 1; highlights sit inside `pic`; `paintHc` asks for the
  right image per stage (inject the image table).
- E2E: the Honeycomb screen opens on stage 0 with its picture drawn (sample a pixel inside `pic` that is not
  black); each direct prompt advances the stage; after the reveal the canvas differs from the previous stage;
  prompts and the close button stay inside the scene and clear of the picture at 667×375 and 844×390; reduced
  motion plays through; the full shortest path still wins.
- Report the two scripted timings again.

## Yours / off limits

**Yours:** `js/chapters/ch1.js`, `js/screens/chapter.js`, `js/engine/images.js`, `css/game.css` (tool rules),
`index.html` (cache-bust), tests, a few lines in `README.md` and `docs/backlog.md`.

**Off limits:** `assets/**`, `tools/**`, `script/script.md`, the spec, the intro, `js/engine/window.js`,
`js/engine/message.js`.

## Hand back

`handbacks/2026-11-12-warp-agent-timeline.md` (or a section in the combined hand-back), push, pull request into
`sci-adventure`. Say how the three stages look at 667×375 and whether any baked text is hard to read there.
