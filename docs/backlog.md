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
