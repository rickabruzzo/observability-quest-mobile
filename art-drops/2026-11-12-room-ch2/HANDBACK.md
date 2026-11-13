# Art drop: Room 2, the migration war room (cloud engineer) (2026-11-12)

From `briefs/art/01-rooms-2-5.md` (room 2) and `briefs/art/02-persona-cards.md` (`P2_card`). Made by Art Claude on Rick's personal account. **Rick's direction replaced the brief's room 2 picture**; see below.

## Files (all 640×400)

| File | What |
|---|---|
| `R2_war_room.png` | Room plate |
| `R2_npc_talk_1.png`, `R2_npc_talk_2.png` | Talking: the frames to loop while he speaks |
| `R2_npc_look.png`, `R2_npc_scratch.png`, `R2_npc_mark.png` | Idle: turned to the board studying it; scratching his head; making a pen mark |
| `R2_wall_closeup.png` | The whiteboard service map straight on |
| `R2_pc_closeup.png` | The hero's monitor on its arm, blank screen, blank sticky notes |
| `P2_card.png` | Slayer of the Monolith: armour of server parts and cable, a wrench war hammer mid-swing, a boot on a cracked monolith with two red lights, a cable coiled on his arm, a cavern of green lights. Reads at 128×80. |

## Changes from the brief (Rick's direction, 2026-11-12)

- **No status wall display, no server cabinet, no plug.** Rick: a monolith is a codebase, not a box to unplug. The patient's display is **the whiteboard service map**, moved up onto the back wall. Its right-hand window was turned into wall so the board isn't floating in front of glass.
- **The persona is a "cloud engineer"** (Rick's name for him), a man in his fifties with greying hair, glasses pushed up, in a jacket over a shirt. He stands at the board, not behind a desk, in 3/4 view toward the player.
- **The hero's desk is a cubicle desk** on the left, with a monitor on an arm, cans, takeaway and an empty chair.
- **Idle behaviour (Rick):** the earlier tight talk loop looked creepy. **Mostly hold `R2_npc_look`** (turned to the map, trying to understand it). Every so often, at random spacing (say every 4–10 s), show `R2_npc_scratch` or `R2_npc_mark` for about 0.6–1 s, then back to `look`. Use `talk_1`/`talk_2` only while he's speaking. The plate itself is a fine rest frame too.
- **The new story** (two credit unions on one node still call the monolith) fits this room: the code can draw the filtered service map and the stuck path over the whiteboard close-up. The board has no writing.

## Facts the code depends on (320×200, about ±3 px)

### Hotspots and walking

| Hotspot | Rect (x, y, w, h) | Hero stands at (left edge, 28 px hero) |
|---|---|---|
| `pc`: cubicle desk with monitor and chair (left) | 0, 76, 136, 112 | x 96 |
| `board`: whiteboard service map | 113, 26, 197, 92 | no walk; the tap opens the close-up |
| `npc`: cloud engineer at the board's right end | 255, 52, 48, 120 | x 222 |

**Walking:** feet on y 192; hero's left edge from x 0 to x 292. Open floor x 136–255. His feet are at about y 170, upstage of the hero's walking line.

### The board

| | Room (`R2_war_room`) | Close-up (`R2_wall_closeup`) |
|---|---|---|
| White drawing area | x 115–307, y 28–115 (he covers x 260–300 of it) | x 13–307, y 25–191 |

Box and circle centres on the close-up are not measured. If the code wants to draw a path through the existing drawing rather than over it, ask and I'll list them.

**PC close-up (`R2_pc_closeup`) screen:** x 80–240, y 31–136. Sticky notes along y 140–160.

### NPC frames

Every NPC frame differs from the plate only inside **x 240–309, y 48–173** (his figure).

## Flaws kept

- **The cans on the cubicle desk read as a well-known energy drink** (blue, silver and red) when you look closely at full size. At 320×200 there's no legible logo. The close-ups use a plain silver can instead. Worth a Photoshop repaint of the colours if it bothers anyone.
- **The PC close-up's screen is about 50% of the frame's width and 53% of its height**, below the brief's 60%.
- **The whiteboard close-up** has a few boxes with ruled lines inside (like little documents). None are letters.

## Provenance

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12, on Rick's personal account.
- **Plate:** `R2c`: an edit of try 3 of the redesigned room (`R2b`) with try 1 as a second reference, turning the right window into wall (`scratch/room_gen/edit_r2.py`). Try 2 of that edit kept. Rick picked the desk, board, figure and wall in rounds.
- **NPC frames:** edits of the plate (`scratch/room_gen/gen_r2talk.py`), 2 tries each; only his figure composited back. Kept: talk_1 and talk_2 t1; look; scratch t2 (from "study"); mark t2.
- **Close-ups and card:** `scratch/room_gen/gen_set.py`, the plate attached as the reference. Whiteboard: 2 tries, t2 kept. PC: 4 tries; tries 1–2 drew branded energy drink cans and were rejected; t3 kept. Card: 2 tries, t1 kept.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400.

## Sign-off

Rick approved the plate, the talk frames and the idle design on 2026-11-12. He says the room 2 story may still change as he grounds it, which could mean reworking the art. The close-ups and the card were picked by Art Claude against the brief and have not been reviewed by Rick yet.
