# Art drop: Room 5: the loft (Build & Release Engineer) (2026-11-12)

From `briefs/art/01-rooms-2-5.md` (room 5) and `briefs/art/02-persona-cards.md` (`P5_card`). Made by Art Claude on Rick's personal account.

## Files (all 640×400)

| File | What |
|---|---|
| `R5_loft.png` | Room plate |
| `R5_npc_talk_1.png`, `R5_npc_talk_2.png` | The persona in two other moments; differ from the plate only in the region below |
| `R5_wall_closeup.png` | The wall display straight on, all panels blank |
| `R5_pc_closeup.png` | The hero's computer screen straight on, blank |
| `P5_card.png` | `P5_card`: Rogue of the Friday Deploy. Hooded cloak over the hoodie, beanie under the hood, mid-leap over rooftops at sunset, firing a crossbow whose bolt trails rocket flame, blank scrolls spilling from his pouch. Reads at 128×80. |

## Changes from the brief

- **The projector layout has two extra boxes.** Along with the chart, the column of three small boxes and the chat panel, there is a wide box under the chart. Use it or leave it empty.
- **The small boxes are small:** in the close-up about 26×19, 26×23 and 26×38, below the brief's 55×40.
- **The hero's computer is on the left and the persona on the right**, as briefed.
- **The pager** lies at about x 196–210, y 155–163, and doesn't change in any frame. The hero's feet at y 192 pass in front of it.
- **Talk 2:** he points at the projector screen, on his left.

## Facts the code depends on (320×200, about ±3 px)

### Hotspots and walking

| Hotspot | Rect (x, y, w, h) | Hero stands at (left edge, 28 px hero) |
|---|---|---|
| `pc`: door desk with the laptop on books, and the stool (left) | 8, 88, 114, 100 | x 96 |
| `monitor`: projector screen on its stand | 155, 22, 94, 100 | no walk; the tap opens the close-up |
| `npc`: Release Engineer on the couch (right) | 230, 80, 90, 108 | x 196 |
| `pager` (optional) | 196, 155, 15, 9 | — |

**Walking:** feet on y 192; hero's left edge from x 0 to x 292. The open gap is x 122–229.

### Display panels (the art is blank; the code draws in these)

| Panel | Room (`R5_loft`) | Close-up (`R5_wall_closeup`) |
|---|---|---|
| Whole screen | x 162–244, y 32–81 | x 63–264, y 32–138 |
| Chart (sign-ups, with grid lines) | x 165–206, y 36–56 | x 69–178, y 38–87 |
| Wide box under the chart (spare) | x 165–204, y 60–78 | x 69–178, y 94–132 |
| Small box 1 | x 209–219, y 36–42 | x 184–210, y 38–57 |
| Small box 2 | x 209–219, y 46–56 | x 184–210, y 64–87 |
| Small box 3 | x 208–219, y 60–78 | x 184–210, y 94–132 |
| Chat panel (support inbox) | x 223–240, y 36–78 | x 216–257, y 38–132 |

**PC close-up (`R5_pc_closeup`) screen:** x 66–255, y 23–143.

### Talk frames

The loop plate → talk_1 → plate → talk_2 swaps cleanly. Changed region: talk_1: x 232–320, y 63–189. talk_2: x 232–320, y 63–189. (the region includes a few stray pixels round the figure that match the plate to within a shade).

## Flaws kept

See "Changes from the brief". Nothing else known.

## Provenance

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12, on Rick's personal account.
- **Plate:** the brief's room prompt with its opening and closing lines, `scratch/room_gen/raw/R1_exec_floor.png` attached as the style reference (`scratch/room_gen/gen_rooms.py`).
- **Talk frames:** edits of the approved plate with the brief's edit wording (`scratch/room_gen/gen_set.py`), 2 tries each. Only the person's changed pixels were composited back onto the plate (a diff mask inside a box round the person), so each frame differs from the plate in one region.
- **Close-ups:** new plates, the room plate attached as the style reference, the brief's opening and closing lines, 2 tries each.
- **Card:** brief 02's prompt with its opening and closing lines, the room plate attached as the character reference, plus: knees-up, face visible, outer edge free, original costume, avoid text/runes/frame. 2 tries.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400, as for R1.
- **Tries:** Plate: try 5 of 5. Talk 1: t1. Talk 2: t2. Wall close-up: t1. PC close-up: t2. Card: t1 of 2.

## Sign-off

Rick approved the plate on 2026-11-12 ("go with the plates till we deep dive on how it's all gonna come together"): the room story may still change after that deep dive. The talk frames, close-ups and card were picked by Art Claude against the brief and have not been reviewed by Rick yet.
