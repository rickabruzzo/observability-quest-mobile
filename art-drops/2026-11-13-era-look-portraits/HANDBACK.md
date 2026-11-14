# Art drop: persona dialogue portraits and the hero model sheet (era look, 2026-11-13)

For **Cloud Claude**, era-look fork. Approved by Rick on 2026-11-13. Rick: the intro cut scenes stay as they are, and they are the reference the rest of the game should match.

## Files

| File | Size | What |
|---|---|---|
| `P1_portrait.png` … `P5_portrait.png` | 640×428 | Head-and-shoulders dialogue portraits of the five personas (CTO, cloud engineer, frontend developer, SRE, release engineer), in the same style, size and black background as the narrator portraits (`assets/portrait_*.png`) |
| `P<n>_portrait_blink.png`, `_talk1.png`, `_talk2.png` | 640×428 | Eyes closed; mouth slightly open; mouth open wider |
| `hero_model_sheet.png` | 1584×672 | Style reference for the hero generator (not a game asset) |

## Portraits: facts the code depends on

- **Only the eyes (blink) or the mouth (talk) differ** from each portrait, so the frames swap cleanly, the same as `portrait_jessitron`. Changed areas, at 640×428, about ±4 px:

| | Blink (eyes) | Talk (mouth) |
|---|---|---|
| P1 | x 238–388, y 141–185 | x 246–382, y 234–329 |
| P2 | x 221–416, y 111–183 | x 261–379, y 236–339 |
| P3 | x 247–392, y 125–193 | x 257–379, y 241–323 |
| P4 | x 246–388, y 149–183 | x 264–377, y 241–316 |
| P5 | x 253–386, y 147–206 | x 253–391, y 237–348 |

- **Loop** (as for the narrators): rest → talk1 → talk2 → talk1 while speaking, about 110–140 ms a frame, with a blink every few seconds. Reduced motion: rest only.
- **Use these in conversations** instead of cropping the room plates (brief 03 suggested cropping the painted engineer; at room size he's about 50×100 game px, too small for a portrait).
- **Likeness:** each portrait was made with the painted room plate as the reference. The CTO and the release engineer wear **no glasses**, as in their rooms; the first tries added glasses and were rejected.

## Hero model sheet: for `tools/hero_gen.py` / `js/engine/hero.js`

A drawing of the hero in the approved era style (the R2 era test), for the generator to match. It's not to be traced pixel for pixel.

- **Figures, left to right:** the hero front, side (facing right) and walking; then a long-haired woman with glasses (honey hoodie, black jeans), an androgynous person with a violet mohawk and glasses (teal hoodie, grey jeans), a man with dark skin, an afro and a long beard (lime hoodie), a woman with pale skin and shoulder-length ginger hair (indigo hoodie, light jeans), and the hero in striped pyjamas. These map onto the generator's existing `OPTIONS` and `PRESETS`.
- **The style to hit:** a dark outline, three or four tones on each garment (light, base, shade, dark: the generator's `ramp` already has this), a simple face of a few marks, visible hands, a hood with drawstrings, a front pocket, and jeans with a seam and a cuff.
- **Scale: this is the big change.** The current sprite is 28×72. The era-look personas and the era-test hero stand about **130–136 px tall at 320×200** (the R2 test hero: x 140–207, y 49–185). The generator needs about **double the resolution**, around 56×136, to sit with the redrawn personas. The walk positions and stand points in the room hand-backs assume the hero's left edge; recheck them for the wider hero.
- **Hoodies stay blank on the chest.** The game adds the Honeycomb mark from the official file (`HC_MARK`).
- **Intro (Rick):** the hero getting out of bed must be upgraded to the new model too. The `pj` outfit and the `situp` pose come from the same generator, so upgrading it covers the bedroom. The intro's painted cut scenes (C_*) stay as they are.

## Provenance

Gemini API `gemini-3.1-flash-image`, 2026-11-13, billed to the company-card project. Script: `scratch/portrait_gen/gen.py` and `frames.py`.
- **Portraits:** two images attached (the painted room plate for the likeness, `assets/portrait_graham.png` for the style). 2 tries each, plus 2 more for P1 and P5 without glasses. Kept: P1 t3, P2 t1, P3 t2, P4 t2, P5 t4. Crop: centre 3:2, nearest-neighbour to 640×428.
- **Frames:** one edit each of the kept raw portrait. Only the eye or mouth area was composited back (diff > 70 inside a face band, MaxFilter(9), MinFilter(3)).
- **Hero sheet:** the R2 era-test composite attached as the style reference, 21:9. 2 tries, t2 kept.
