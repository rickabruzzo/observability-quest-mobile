# Art drop: era-look rooms 1–5, personas redrawn (2026-11-13)

For **Cloud Claude**, on the **era-look fork only**. Follows the era-look test (PR #12), which Rick approved: "good enough to move forward with". Rick: personas stay **baked into the room plates** (not separate sprites) for now. Only the hero is a sprite.

## What changed

In every room, the persona is redrawn as a simpler 1990s game character, the same style as the test: a few tones on each garment, an outline, a simple face. **The rooms themselves are untouched.** Each plate is the approved painted room with only the person composited back. The talk, idle and win frames are edits of the new era plate, with only the figure composited.

Close-ups (wall, PC), the portraits and the persona cards **keep their painted detail**: faces get detail only in close-up, as in the references.

## Files (all 640×400; same names as the main build, so they drop in)

| Room | Plate | Frames |
|---|---|---|
| 1 | `R1_exec_floor` | `R1_cto_talk_1`, `R1_cto_talk_2` |
| 2 | `R2_war_room` | `R2_npc_talk_1`, `_talk_2`, `_look`, `_scratch`, `_mark`, `_win` |
| 3 | `R3_bullpen` | `R3_npc_talk_1`, `_talk_2`, `_win` |
| 4 | `R4_ops_room` | `R4_npc_talk_1`, `_talk_2`, `_win` |
| 5 | `R5_loft` | `R5_npc_talk_1`, `_talk_2`, `_win` |

The close-ups, `R2_wall_closeup(_fixed)` and the cards are not included: use the main build's.

## Frame-swap areas (320×200): every frame differs from its era plate only inside these

| Room | Area (x, y, w, h) |
|---|---|
| 1 | 229, 65, 77, 105 |
| 2 | 234, 34, 78, 140 |
| 3 | 9, 14, 128, 125 |
| 4 | 209, 59, 111, 127 |
| 5 | 204, 69, 117, 132 |

These are a bit wider than the painted build's, because the simpler figures came out slightly larger in places. Hotspots and walking lines are unchanged from each room's main hand-back.

## Notes

- **R2 idle `R2_npc_look`:** here he turns his **back to the room** to study the board, which is closer to Rick's "mostly turned toward the service map" than the painted version.
- **R1:** the CTO's suit came out a little lighter blue than the painted plate.
- **R2 glasses restored (Rick):** the redraw had dropped his reading glasses. They are now pushed up on his head in the plate and all six frames, as in the painted build (a Gemini edit of each, with only the head area composited back). The swap area is unchanged.
- The style words are the test's, plus: "the moderate detail of a 1990s point-and-click game character standing in a room, not a modern cartoon".

## Close-ups repainted for the era look (Rick, 2026-11-13)

Rick: the close-ups were flatter and cleaner than the rooms, while the references put the **most** detail in close-ups. **Hardware stays modern; this is art direction only.** All 10 close-ups plus `R2_wall_closeup_fixed` are in this drop:
- **What changed:** the bezels, frames, stands, keyboards and surroundings are repainted with bevels, dithered shading, wear and light falloff.
- **The screen areas are pixel-identical to the main build.** The old screen interiors were pasted back, so every panel and screen rectangle in the main hand-backs still holds and no code changes are needed.
- `R2_wall_closeup_fixed` is the new frame with the fixed board's drawing pasted in.
- **Kept:** R1 monitor t2, R1 PC t2, R2 wall t1, R2 PC t2, R3 wall t2, R3 PC t2, R4 wall t1, R4 PC t2, R5 wall t2, R5 PC t2. R2 PC t1 was rejected for writing on the background whiteboard. Script: `scratch/room_gen/gen_era_cu.py`; tries are in `raw/era_cu/`.

## Known, left as is (Rick, 2026-11-13)

- **R1 scale:** by her place on the view plane, the CTO and her desk read about 15% too small next to the other personas. Not worth a precise rescale now; if room 1 is ever regenerated, make the desk and CTO about 15% larger.
- **R3:** a few stray light pixels on the left edge of her glasses; it reads as a glint at game size.

## Sign-off update

Rick approved all five rooms on 2026-11-13, after the R2 glasses fix, and approved the repainted close-ups the same evening.

## Provenance

Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-13. Script: `scratch/room_gen/gen_era.py` (exact prompts). Plates: 2 tries each (R1 t2, R3 t1, R4 t2, R5 t2; R2 from the test, t2). Frames: 2 tries each. Kept:
- R1: talk_1 t1, talk_2 t1.
- R2: talk_1 t1, talk_2 t1, look t2, scratch t1, mark t2, win t2.
- R3: talk_1 t1, talk_2 t2, win t1.
- R4: talk_1 t1, talk_2 t1, win t2.
- R5: talk_1 t1, talk_2 t1, win t1.

All tries are in `scratch/room_gen/raw/era/tries/`. Composite: diff > 40–55 inside a box round the figure, MaxFilter, MinFilter. Crop: centre 16:10, nearest-neighbour to 640×400.

## Sign-off

Rick approved the style from the test. These picks were made by Art Claude and have not been reviewed by Rick yet.
