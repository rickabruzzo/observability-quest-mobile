# Art drop: Room 4: the ops room (SRE on call) (2026-11-12)

From `briefs/art/01-rooms-2-5.md` (room 4) and `briefs/art/02-persona-cards.md` (`P4_card`). Made by Art Claude on Rick's personal account.

## Files (all 640×400)

| File | What |
|---|---|
| `R4_ops_room.png` | Room plate |
| `R4_npc_talk_1.png`, `R4_npc_talk_2.png` | The persona in two other moments; differ from the plate only in the region below |
| `R4_wall_closeup.png` | The wall display straight on, all panels blank |
| `R4_pc_closeup.png` | The hero's computer screen straight on, blank |
| `P4_card.png` | `P4_card`: Knight of the Pager. Plate armour, no helmet, headset round her neck, sword raised, a shield with a plain bell, a green pager on her belt, a lantern at her feet, a rampart at night. Reads at 128×80. |

## Changes from the brief

- **The lane under the star map is thin:** about 5 px tall in the room. In the close-up it's 12 px.
- **The chat column has a thin header strip** at its top (room y 8–14, close-up y 8–14). The close-up also has a small strip under the chat column (x 244–303, y 176–180); ignore it or use it.
- **Plate:** the SRE's hand is at her forehead and the phone is in her other hand, as briefed.
- **Card:** the sword's tip touches the top edge; inside the outer 6%, but only steel.

## Facts the code depends on (320×200, about ±3 px)

### Hotspots and walking

| Hotspot | Rect (x, y, w, h) | Hero stands at (left edge, 28 px hero) |
|---|---|---|
| `pc`: console desk, ultrawide, gaming chair (left) | 10, 88, 126, 98 | x 95 |
| `monitor`: the wall of space | 30, 2, 260, 100 | no walk; the tap opens the close-up |
| `npc`: SRE at the old desk with the CRT (right) | 205, 78, 98, 107 | x 172 |

**Walking:** feet on y 192; hero's left edge from x 0 to x 292. The open gap is x 136–204.

### Display panels (the art is blank; the code draws in these)

| Panel | Room (`R4_ops_room`) | Close-up (`R4_wall_closeup`) |
|---|---|---|
| Star map (fleet dots) | x 34–234, y 7–80 | x 13–242, y 7–161 |
| Lane under it (health line) | x 34–234, y 84–88 | x 13–239, y 171–182 |
| Chat column (lag reports) | x 236–285, y 15–98 | x 244–304, y 16–172 |

**PC close-up (`R4_pc_closeup`) screen:** x 33–287, y 34–147.

### Talk frames

The loop plate → talk_1 → plate → talk_2 swaps cleanly. Changed region: talk_1: x 227–318, y 78–181. talk_2: x 227–318, y 78–182. (the region includes a few stray pixels round the figure that match the plate to within a shade).

## Flaws kept

See "Changes from the brief". Nothing else known.

## Provenance

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12, on Rick's personal account.
- **Plate:** the brief's room prompt with its opening and closing lines, `scratch/room_gen/raw/R1_exec_floor.png` attached as the style reference (`scratch/room_gen/gen_rooms.py`).
- **Talk frames:** edits of the approved plate with the brief's edit wording (`scratch/room_gen/gen_set.py`), 2 tries each. Only the person's changed pixels were composited back onto the plate (a diff mask inside a box round the person), so each frame differs from the plate in one region.
- **Close-ups:** new plates, the room plate attached as the style reference, the brief's opening and closing lines, 2 tries each.
- **Card:** brief 02's prompt with its opening and closing lines, the room plate attached as the character reference, plus: knees-up, face visible, outer edge free, original costume, avoid text/runes/frame. 2 tries.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400, as for R1.
- **Tries:** Plate: try 4 of 5. Talk 1: t1. Talk 2: t1. Wall close-up: t2. PC close-up: t2. Card: t1 of 2.

## Sign-off

Rick approved the plate on 2026-11-12 ("go with the plates till we deep dive on how it's all gonna come together"): the room story may still change after that deep dive. The talk frames, close-ups and card were picked by Art Claude against the brief and have not been reviewed by Rick yet.
