# Art drop: Room 5, the atrium (Build & Release Engineer) (2026-11-12, redone 2026-11-13)

From `briefs/art/01-rooms-2-5.md` (room 5) and `briefs/art/02-persona-cards.md` (`P5_card`). Made by Art Claude on Rick's personal account.

**Redone 2026-11-13 on Rick's direction:** the startup loft felt like a different building, and the hero walks between rooms. Room 5 is now **the building's atrium / hangout space**. The file names are unchanged (`R5_loft` etc.) so the code and brief still match; rename them if you like.

## Files (all 640×400)

| File | What |
|---|---|
| `R5_loft.png` | Room plate: night atrium with city windows, bean bags, plants, a colourful pinball machine, the dashboard monitor on a pedestal stand, the hero's laptop on a coffee table (left), the engineer on a sofa (right), the pager on the floor |
| `R5_npc_talk_1.png` | Mouth open, both hands thrown up, laptop on his knees |
| `R5_npc_talk_2.png` | Pointing at the monitor, one hand on the laptop |
| `R5_wall_closeup.png` | The monitor straight on, all panels blank |
| `R5_pc_closeup.png` | The hero's laptop straight on, blank screen |
| `P5_card.png` | Unchanged from the first drop: Rogue of the Friday Deploy. Same man as the new plate. |

## Changes from the brief (Rick's direction)

- **Atrium, not a loft.** Bean bags, plants, tall night windows, a floor lamp.
- **The display is a big monitor on a fixed pedestal stand**, not a projector on wheels. Rick: a dashboard on casters doesn't make sense.
- **Pinball machine** in the back right, bright and colourful with **original** pulp sci-fi art (ringed planet, rockets). No real characters, franchise, names or logos. Rick rejected a take whose caped hero was too close to a well-known character.
- **The hero's computer** is a laptop on a coffee table, with no seat of its own. A beige bean bag sits at the left edge.
- **The display has two small boxes, not three.** The layout is: the chart across the top left, a large panel under it, two boxes in the middle, and the tall chat panel on the right.

## Facts the code depends on (320×200, about ±3 px)

### Hotspots and walking

| Hotspot | Rect (x, y, w, h) | Hero stands at (left edge, 28 px hero) |
|---|---|---|
| `pc`: coffee table with the laptop (left) | 0, 128, 118, 68 | x 96 |
| `monitor`: dashboard monitor on its stand | 115, 24, 90, 104 | no walk; the tap opens the close-up |
| `npc`: engineer on the sofa (right) | 232, 85, 88, 113 | x 200 |
| `pager` (optional) | 194, 173, 18, 11 | — |
| `pinball` (optional, background) | 250, 42, 68, 83 | — |

**Walking:** feet on y 192; hero's left edge from x 0 to x 292. Open floor x 118–232. The hero standing at x 200 is in front of the pager.

### Display panels (the art is blank; the code draws in these)

| Panel | Room (`R5_loft`) | Close-up (`R5_wall_closeup`) |
|---|---|---|
| Whole screen | x 115–204, y 24–84 | x 41–280, y 19–181 |
| Chart (sign-ups; faint grid lines) | x 119–179, y 27–44 | x 50–214, y 27–74 |
| Large panel under the chart | x 119–157, y 48–81 | x 50–156, y 84–174 |
| Box 1 (release readout) | x 162–179, y 48–63 | x 165–214, y 84–124 |
| Box 2 (release readout) | x 162–179, y 67–81 | x 165–214, y 134–174 |
| Chat panel (support inbox) | x 183–200, y 27–81 | x 223–272, y 27–174 (a divider at y 159) |

The chart's grid lines are drawn in the art. The close-up's two boxes each have a small grey tab at the top left (about 10×4), which the code can treat as a label chip.

**PC close-up (`R5_pc_closeup`) screen:** x 90–230, y 38–129.

### Talk frames

They differ from the plate only inside **x 238–320, y 38–200** (his figure). The loop plate → talk_1 → plate → talk_2 swaps cleanly.

## Flaws kept

- **The pinball machine sits right behind his head**, so his outline is less clear against the bright backglass. Rick accepted it.
- **The PC close-up's screen is about 44% × 46% of the frame**, below the brief's 60%.
- **The wall close-up:** a small magnifier icon that Gemini drew in the large panel was painted out (patched from the same panel).

## Provenance

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-13. Run from Art Claude's cloud workspace with a key Rick made for that session; his laptop link was down.
- **Plate:** 5 tries. Tries 1–3 were new plates with brief 01's opening and closing lines and `assets/rooms/R1_exec_floor.png` as the style reference. Tries 4–5 were edits of try 3: projector → monitor on a pedestal stand, colourful original pinball art, bean bag removed from the floor strip. **Try 4 kept** (Rick's pick).
- **Talk frames:** edits of the plate with brief 01's wording, 2 tries each. Kept: talk_1 t1, talk_2 t2; talk_2 t1 drew text on the monitor. Only his figure was composited back.
- **Close-ups:** 2 tries each, the plate attached. Wall: t2 (t1 was see-through). PC: t1.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400.
- The raw images and tries are in Art Claude's cloud workspace, not yet in Rick's `scratch/`; they'll be copied there when the laptop link is back.

## Sign-off

Rick picked the plate (try 4) on 2026-11-13. The talk frames and close-ups were picked by Art Claude against the brief and have not been reviewed by Rick yet.
