# Observability Quest Mobile

Mobile web port of Honeycomb's *Observability Quest* badge game (Pimoroni Tufty 2350 / BadgeOS).
Scan a QR at the booth, play five customer-story scenarios, claim a prize.

Plain HTML/CSS/JS, no build step, no framework. Design: `docs/superpowers/specs/`. Plan:
`docs/superpowers/plans/`. Animation concept and coordinates: `docs/animation-handoff.md`.

## v2 (branch `sci-adventure`)

This branch is the SCI-style point-and-click rebuild — landscape, a hero you create, rooms
you click, a gamified Honeycomb. Spec: `docs/superpowers/specs/2026-11-10-sci-adventure-design.md`.
The v0.1 choose-your-own-adventure port stays deployable from `main` (tag `v0.1-cyoa`); its
game loop and end-to-end tests were retired here. Modules both versions share (prize claim,
text engine, audio, portrait animation, asset tooling) are unchanged.

## Run it

```
npm run serve          # http://localhost:8080  (any static server works)
```

v2 is played **landscape**: on a desktop browser make the window wider than it is tall; on a phone on the
same Wi-Fi open `http://<your-laptop-ip>:8080` and turn the phone sideways (portrait shows the rotate screen).
Flow today: title → character sheet → intro cutscene (tap to advance, **Skip** to jump) → preview room (tap the floor to walk). `anim-preview.html` still shows
the v0.1 portrait animations.

## Test

```
npm test               # unit tests: hero renderer vs Python fixtures, stage math, walk, creator state, fonts, shared v0.1 modules
npm run e2e            # Playwright: landscape shell + rotate gate, character sheet, intro cutscene, preview walk, weight budgets
python3 -m pytest tools/tests -q   # asset tooling + the reference hero generator (regenerate fixtures: python3 tools/hero_gen.py --fixtures tests/fixtures/hero)
```

`npm run e2e` needs Playwright: `npm i -D playwright && npx playwright install chromium`
(or symlink a global install into `node_modules/`).

## Intro art (when the generated images land)

The intro cuts between nine stills. Until the real ones exist the game shows labelled placeholders.

1. Generate the nine images from `briefs/intro-shots-brief.md` and export them at 640×400 into `scratch/intro_gen/`
   (`A_room_dark`, `B_nightstand`, `B_arm`, `B_lamp`, `C_face_asleep`, `C_eye_crack`, `C_awake`, `C_misery`, `D_bedroom_vga`, all `.png`).
2. `python3 tools/build_intro.py` — writes `assets/intro/*.png` + `intro.json` and prints `real art` or `PLACEHOLDERS`.
   Any image that is missing stays a placeholder (the build lists them); an edit whose plate is missing is ignored.
   Sources must be 16:10 `.png` with exactly these names; anything else in the folder is called out and skipped.
   Each edit prints how much of the frame it changed and where — a quick check that only the intended part moved.
3. If it stops with *"differs from … over N% of the frame"*, that edit drifted from its plate — regenerate it as an
   edit of the plate (same picture, one change). Edits are snapped onto their plate so cuts don't shimmer.
   Generators redraw the whole frame on an edit, so the build keeps only the real change (stray flecks elsewhere
   are dropped, a removed object leaves no ghost). An edit is refused only when over half the frame changed.
4. Positions the code needs come from `intro.json`. The pager LCD is found automatically (the plate's bright-green
   rectangle). The rest are defaults — set them for the real bedroom in `scratch/intro_gen/intro.overrides.json`:

   ```json
   { "wall": { "x": 24, "y": 14, "w": 232, "h": 44 },   "the empty wall the title is lettered on"
     "bed": { "x": 60, "y": 96 },                       "hero's left edge in bed; y = the blanket line"
     "stand": { "x": 90 },                              "hero's left edge once out of bed (clear of the bed)"
     "door": { "x": 286 }, "floorY": 176,               "where the hero walks to; the row their feet stand on"
     "lcd": { "x": 92, "y": 62, "w": 136, "h": 36 } }   "only if the LCD isn't found"
   ```
   (Plain JSON — leave the quoted notes out.) Coordinates are in 320×200 pixels.

The title on the bedroom wall is the app's own **Observability Quest wordmark**, cut by the build out of
`assets/title_screen.png` (letters only — no starscape, glow, rule or blue panel), sized to the `wall` rectangle, with
the subtitle lettered under it. Replace that picture and rebuild to change the logo.

Shot order and timings: `js/intro/timeline.js`. LCD copy lives there too.

## Layout of the code

```
index.html            one page; <canvas id="art"> + text box + control bar
css/game.css          palette tokens, Sierra text box, buttons, claim form, completion screen
js/game.js            state machine: TITLE HOWTO INTRO CHOICE WIN LOSE FINAL CLAIM COMPLETE
js/scenarios.js       all copy (verbatim from the badge) + roster; edit titles/names here
js/text.js            wrap / paginate / intro header (ported from the badge's start_text)
js/screen.js          text box DOM, typewriter, choice menu, preload
js/audio.js           Web Audio synth: title loop + UI blips + mute
js/audio/title-loop.js  the original chiptune, as note data (render with tools/render-loop.mjs)
js/claim.js           prize claim: placeholder form, HubSpot slot, redeem flag
js/anim/              canvas scene layer: layer.js, sprites.js, one module per scene, portraits
assets/               12 stills at 640×428 (nearest-neighbour from the Firefly 1K originals), logos, fonts
assets/anim/          sprite patches + "blank" patches that clear moving parts off a still
tools/                build_anim.py (frames → patches), optimize_png.py, render-loop.mjs, stamp.mjs
```

## Common edits

- **Change a title or swap a narrator:** `js/scenarios.js` → `narrator: { name, title, portrait }`.
  Drop the new `portrait_<name>.png` (640×428) in `assets/`; blink/talk frames are optional.
- **Wire the HubSpot form:** `js/claim.js` → `HUBSPOT = { portalId, formId, region }`. Use the script
  embed's ids. Hidden fields `quest_score` and `quest_event` are filled if the form has them.
  Styling for the embedded form lives under `.hs-form` in `css/game.css`.
- **Per-event QR attribution:** link to `/?e=<eventcode>` — it is passed to HubSpot as `quest_event`.
- **Music:** edit `js/audio/title-loop.js`; preview with `node tools/render-loop.mjs out.wav`.
- **Fonts (v2):** tokens `--font-text` / `--font-display` in `css/game.css`. **VT323** (SIL OFL,
  `assets/fonts/LICENSE-vt323.txt`) for everything a player reads; **GloryQuest** for headings and the
  character sheet's labels — a FontStruction by **the12thdoctor**, https://fontstruct.com/fontstructions/show/115072,
  licensed CC BY-SA 3.0; its `license.txt` and `readme.txt` ship beside it in `assets/fonts/gloryquest/`
  and the credit appears in the title's small print. The other OFL files in `assets/fonts/` are v0.1 leftovers.
- **Regenerate animation patches:** put Gemini edit frames in `scratch/anim_gen/`, run
  `python3 tools/build_anim.py`, check `scratch/anim_review.png`, then `python3 tools/optimize_png.py`.

## Deploy (Vercel)

Static site, framework preset "Other", output directory `/`, production branch `main`. The public URL is
the Vercel-provided `https://<project-name>.vercel.app` (a honeycomb.io subdomain can be added later
without changing anything here). Before deploying, `node tools/stamp.mjs` rewrites `index.html`'s css/js
references with the git sha so caches invalidate cleanly.

Budget: a full run transfers ~2.7 MB (limit 3 MB); the title is interactive in < 2 s on 4G and the
START button enables when the rest of the art is in. Once loaded, the game needs no network until
the claim form (scene sprites load with their scene; if that fails the scene shows its still).

## Status

See `ASSET_PROMPTS.md` for image provenance. Scenario 4's portrait is Jess's pick (variant 2); her blink/talk
frames are pending. The claim form is a placeholder until the HubSpot form exists.
