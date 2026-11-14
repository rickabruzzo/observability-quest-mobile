# Art drop: Room 4: the ops room (SRE on call) (2026-11-12)

From `briefs/art/01-rooms-2-5.md` (room 4) and `briefs/art/02-persona-cards.md` (`P4_card`). Made by Art Claude on Rick's personal account.

## Files (all 640×400)

| File | What |
|---|---|
| `R4_ops_room.png` | Room plate |
| `R4_npc_talk_1.png`, `R4_npc_talk_2.png` | The persona in two other moments; differ from the plate only in the region below |
| `R4_npc_win.png` | **New 2026-11-13.** Win frame: phone lowered, a two-finger salute (o7) and a tired grin (`ch4.recovered`, `ch4.win`) |
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

## Updates for the revised script (2026-11-13)

Cloud Claude rewrote chapter 4 around this drop; these changes fit the art to it:
- **A blank masking-tape label on the old CRT** at about **x 217–256, y 88–119**, for `ch4.look.npc`'s "a label: THE FLEET CODE. ASK EINAR." The words are left to the game, as the brief asks: draw them on the tape in the close-up of a look, or just say them. (A try with the words painted in came out misspelled.) It's in the plate and every NPC frame.
- **New `R4_npc_win`:** the pilots' "o7" salute. With the talk frames, the frame-swap area is **x 227, y 77, w 92, h 106**.
- **`R4_pc_closeup` redone:** the old screen was see-through (the wall of space showed through its top half). The screen is now solid, even and blank, at x 33–285, y 34–147. This is where Claw Codez's chat goes.
- **The wall display needed no change:** the star map (fleet dots), the lane under it (the smug flat green health line) and the chat column (lag in nine languages, then o7) all match `ch4.wall.*`.

## P4 card redone: Knight Watch (Rick, 2026-11-13)

`P4_card.png` is replaced. Rick's direction:
- **Class: "Knight Watch"** (was Knight of the Pager). She's on sentry duty at the top of the walls, at night, scanning with a brass spyglass.
- **No pager.** The pager belongs to the Honeycomb Hero. She carries a **smartphone** in a holster on her belt, with its screen blank and glowing. **Card animation: a scroll of urgent notifications on that screen.** The screen is about **x 213–228, y 149–169** (320×200); the code draws the scrolling alerts there.
- **Shield:** a plain steel shield wearing a big red app-icon notification badge, **999+**, on its top right corner (about x 253–290, y 77–113). The badge is the only text in the picture, at Rick's request. At 128×80 the number doesn't read; if the small card should show it, draw it over the badge in code.
- **For the script:** rename `ch4.persona.class` and the card title line to Knight Watch, and replace "Pager Endurance" in `ch4.card.stats` / `ch4.persona.stats` (for example "Notification Endurance"). `ch4.persona.flavor` ("Sworn to answer the call") still fits.
- Provenance: a new card (3 tries, brief 02's frame lines plus Rick's watch direction, `R4_ops_room` as the reference); t1 kept, then two edits of it for the badge and a plain shield (`gen_set.py`: `P4_watch`, `P4_badge`, `P4_plain`). t2 of the first round was rejected for drawing a third arm.

## Flaws kept

See "Changes from the brief". Nothing else known.

## Provenance

- **2026-11-13 updates:** label: an edit of the plate, 2 tries, t2 (blank tape) kept, only the label composited. Win frame: an edit, 2 tries, t1 kept, only her figure composited. PC close-up: an edit of the old close-up, 2 tries, t1 kept. Script: `gen_set.py` (`R4_label`, `R4_npc_win`, `R4_pc2`).

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12, on Rick's personal account.
- **Plate:** the brief's room prompt with its opening and closing lines, `scratch/room_gen/raw/R1_exec_floor.png` attached as the style reference (`scratch/room_gen/gen_rooms.py`).
- **Talk frames:** edits of the approved plate with the brief's edit wording (`scratch/room_gen/gen_set.py`), 2 tries each. Only the person's changed pixels were composited back onto the plate (a diff mask inside a box round the person), so each frame differs from the plate in one region.
- **Close-ups:** new plates, the room plate attached as the style reference, the brief's opening and closing lines, 2 tries each.
- **Card:** brief 02's prompt with its opening and closing lines, the room plate attached as the character reference, plus: knees-up, face visible, outer edge free, original costume, avoid text/runes/frame. 2 tries.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400, as for R1.
- **Tries:** Plate: try 4 of 5. Talk 1: t1. Talk 2: t1. Wall close-up: t2. PC close-up: t2. Card: t1 of 2.

## Sign-off

Rick approved the plate on 2026-11-12 ("go with the plates till we deep dive on how it's all gonna come together"): the room story may still change after that deep dive. The talk frames, close-ups and card were picked by Art Claude against the brief and have not been reviewed by Rick yet.
