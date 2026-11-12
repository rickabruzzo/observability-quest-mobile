# Backlog

Ideas and deferred items, roughly in priority order. Nothing here blocks launch.

## Title-screen intro (Rick, 2026-11-10)
The title screen's text box is mostly empty space. Use it for a Sierra RPG-style intro: a short
cinematic beat before START — scrolling or typewritten lore ("The year is 2026. Your pager is
screaming…"), maybe a tiny animated vignette, in the style of the Quest-series title cards. Keep it
skippable (any tap → START). Copy TBD; should set up the five stories without explaining the game.

## Jessitron blink/talk frames
Waiting on three Gemini edits (`briefs/gemini-jessitron-frames-brief.md`). Drop into
`scratch/anim_gen/`, run `python3 tools/build_anim.py && python3 tools/optimize_png.py`.

## HubSpot embed
After PMM review: ids into `js/claim.js`, form set to inline thank-you (no redirect), free-email
block on. Test the restyle under `.hs-form` on a real phone.

## Deferred from the 2026-11-09 review (cosmetic)
- Reloading straight onto the completion screen shows black art until phase-2 preload finishes
  (add `portrait_charity` to the title assets, or redraw when loaded).
- `layer.still()` doesn't invalidate a pending `show()`; on very slow wifi Charity could start
  talking over the completion panel.
- `image-rendering: crisp-edges` is listed after `pixelated`; should come first.
- S5 coin/PAY2 sprites sit 1px off the 2px grid (odd x/width from the measured art).
- `aria-live` on the typewriter box is noisy for screen readers; announce on page completion instead.
- `user-scalable=no` blocks pinch-zoom.
- Reduced-motion e2e only checks the title and S1 for stillness.
- Typewriter caret can poke ~10px past a full-width line.
- Graham's talk frames carry the model's lighter jaw tone; regenerate with a stricter prompt or
  hand-pixel the mouth.
- Christine's talk1 ≈ her still, so her flap is effectively two-frame.

## Nice-to-haves
- Vercel Web Analytics for play count / drop-off per screen.
- Score as a HubSpot hidden field (slot exists: `quest_score`).
- Swipe-to-advance as a bonus input (buttons stay).

## Deferred from v2 sub-project 1 (shell + hero + creator), 2026-11-10
- Hero poses `type1/type2`, `turn` — needed by the room engine; add to `tools/hero_gen.py` and the JS port together with new fixtures. (`situp` and the `pj` outfit shipped with the intro.)
- Hand-finishing pass on faces and held items (the generator gives three pixels of expression).
- Hero mirrored by `flip` keeps the left-side laptop on the leading hand; acceptable for now, revisit when rooms have a strong light direction.
- The sheet's Body row uses text buttons (Masc / Fem / Enby); three small silhouettes would read better once we have a spare 44 px.
- Icon bar (Look / Use / Help), message windows and score ticking belong to the room-engine sub-project.
- Desktop (≥ 1024 px): thumb columns may be thinner than 56 px; the icon bar falls back to a row under the scene in the room-engine sub-project.
- `#rotate` gate uses `max-width: 700px`; a small tablet in portrait never sees it (plays letterboxed) — fine, but confirm on an iPad mini.

## Deferred minors from the sub-project 1 review (2026-11-10)
- README claims the GloryQuest credit appears in the title's small print; the placeholder title has none yet — add it with the title art.
- Name input `maxlength="24"` while the copy says 16 — characters 17–24 vanish on Done; set `maxlength="16"` (the clamp stays for paste).
- Safe-area insets pad the thumb columns but `fitStage` doesn't know them; check a notch iPhone, or fold the inset into `minCol`.
- Hero is drawn with ~1,400 `fillRect`s per frame while walking; cache each pose as an offscreen canvas before rooms add backgrounds and sprites.
- `ctx.reducedMotion` is read once at boot; add a `matchMedia` change listener.
- 40×42 thumbnails overdraw the 3-px pressed border by 1–2 px.
- Length thumbnails are identical when style = undercut (the generator ignores length for undercut) — substitute a visible length in the sheet, or decide it in the generator.
- Portrait tablets (> 700 px wide) never see the rotate gate and play letterboxed — fine, but confirm on an iPad mini.

## Roster
- Emily Nakashima is leaving Honeycomb (noted 2026-11-10). She stays as chapter 2's narrator placeholder — portrait, name, verdict — until a replacement is named; then rewrite `ch2.verdict`, generate the new portrait + blink/talk frames, and swap `portrait_emily`.

## Intro (sub-project 2, 2026-11-11)
- **Theme music**: shot 9 has no cue yet; the title theme arrives with the OPL soundtrack sub-project. Every intro action has a WebAudio stand-in in `js/intro/sfx.js` (`SOUNDS`: title, rustle, step, pickup, take, door, shut, plus the pager beep and lamp click) — replace with FM voices then. No footsteps on the walk yet.
- **If the cuts feel too jerky in play-test** (Rick's rollback option): add in-between stills per shot in `js/intro/timeline.js` (`alt`/`altAt` already cut between two) — e.g. a second eyelid frame, the arm half-way — before considering tweened motion.
- CTO message shot runs 8 s (storyboard table said ≈5) so the marquee is readable at ~10 characters/second; tune `ms` in `timeline.js` after play-test.
- Real stills landed 2026-11-11 (Gemini, via the agent brief). Positions for the bedroom are in `scratch/intro_gen/intro.overrides.json` on Rick's machine and baked into `assets/intro/intro.json`.
- The wordmark's I after QUEST is the logo's own letter I enlarged by the build; a hand-finished I (or a redrawn wordmark with the numeral) would be cleaner.
- The sitting hero is drawn over the bed, not tucked behind the blanket; a foreground mask for the blanket would fix it.
- No mute control yet; `createSfx({ muted })` takes one when the audio sub-project adds it.
- After the intro the game goes to the preview room; the chapter deal replaces that in the room-engine sub-project.

## Deferred minors from the intro review (2026-11-11)
- `build_intro.py` prints the total size but does not fail over 400 KB (the e2e weight test does); real dithered art may land near the limit.
- Bedroom plate is cut to 32 colours like the EGA shots; consider 64–128 for `D_bedroom_vga` if it bands.
- `composeHero` runs every frame during sit-up and flash; compute once per cut (and cache poses, as already noted).
- A second load attempt can show up to 6 s of black with only Skip; add a hint or shorten the timeout.
- `js/game.js` frame loop dies if a screen's `tick` throws; wrap in try/catch.
- Intro PNG URLs carry no version; placeholders may be cached when real art lands — add `?v=` from the manifest.
- Pyjama stripes sit on absolute rows, so they shift phase between sit-up and standing.
- LCD copy exists only on canvas; mirror it in an `aria-live` node for screen readers.
- Malformed values inside an override object (e.g. `"bed": {"x": "left"}`) are not validated.
- Bedroom round 2 (2026-11-11): furnished plate and `D_door_open` to come from the personal account (`briefs/intro-bedroom-round2-agent-brief.md`); then re-measure `intro.overrides.json`. Until then the open door is a dark rectangle.
- The 4×4 chest mark disappears into same-coloured hoodies (honey on honey, blue on teal, green on lime) — a pixel of outline or a light patch behind it would fix that.
- Character sheet scales up on big windows now; the thumb-column buttons and the name sheet do not yet.
- Title screen is still a text placeholder; use the wordmark (and title art) there in the title sub-project.
- Furnished bedroom, `D_laptop_gone` and `D_door_open` landed 2026-11-11 and are placed from the hand-back's measurements; awaiting Rick's sign-off. `D_laptop_gone` keeps a faint mark on the wall above the dresser — redo that edit if it shows on a phone.

## From Rick's play-through, 2026-11-11 (for the room-engine sub-project)
- **Profile walk**: Rick likes Sierra's side-on walking figure. The hero walks facing the camera today (leg and arm offsets on the front view). Add a profile view to `tools/hero_gen.py` + the JS port (all hair styles, beard, glasses, hoodie mark on the visible side), 4–6 walk frames, mirrored for left; front view stays for standing and the sheet. Show Rick a contact sheet before porting.
- **Walk and hand cursors**: Sierra's cursor is a walking figure that becomes a hand over things you can use. Phones have no hover, so: on desktop (`@media (hover: hover)`) use those two cursors over floor and hotspots; on touch, show the hand as a brief badge on a hotspot when it is tapped (and optionally pulse hotspots on entering a room), and a small walking-figure marker where a floor tap lands.
- Walk speed is now 110 px/s in rooms (a full room in ~3 s) and 60 px/s in the intro. The spec's "≤ 1.2 s per room" came from booth pacing; revisit if three seconds per crossing makes a three-chapter run too long.
- Everyone takes the painted laptop from the dresser (inventory). The held-item option is gone (Rick, 2026-11-11: "they all look bad"); nothing is drawn in the hero's hand. `item` in the overrides is unused.
- Head redraw 2026-11-11 (awaiting Rick's eye): round glasses frames, mohawk as a flat ridge on a buzzed round skull, standard cut inside the head's outline, shoulder/long hair as a solid mass behind the head with locks in front of the shoulders, ears joined to the face.
- Round 3 art landed 2026-11-11: the dark wide shot is the bedroom unlit (`darkTitle` on), pager hand from the left. The new pager's LCD is small (65×22 clean), so the message scrolls at double-size dots with about five letters showing, over 10 s; a pager plate with a wider LCD would read better.
- Cursor (2026-11-11): `js/engine/cursor.js` — walking-figure and hand icons; a mouse gets them as real cursors, a tap stamps the icon where it lands for 450 ms. Wired into the preview room with one hotspot (the desk) as a stand-in; the room engine should take `actionAt` + hotspots from here. Not yet: pulsing usable things on entering a room.
- Profile hero: `hero_side()` in `tools/hero_gen.py` is a DRAFT for Rick's approval (stand + four walk frames, all options). Not in the game: once approved, port to `js/engine/hero.js` with fixtures, and use it for walking in rooms and the intro.
