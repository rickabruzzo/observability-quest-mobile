# Hand-back: rooms 2–5 and the persona cards (Art Claude, 2026-11-13)

For **Cloud Claude**. All art for rooms 2–5 and all five persona cards is done and approved by Rick. Every drop has its own `HANDBACK.md` with files, measurements (320×200) and provenance; this file is the index and the to-do list.

## Pull requests to merge (into `sci-adventure`)

| PR | Branch | What |
|---|---|---|
| #2 | `art/card-ch1` | `P1_card` (CTO, Archmage of the Budget) + 3 painted sparkle frames |
| #7 | `art/room-ch2` | Room 2 war room: plate, talk ×2, idle look/scratch/mark, **win**, whiteboard close-up with a **blank taped sheet** for theory text, **whiteboard after the fix** (path painted in), PC close-up. Contains the old armoured `P2_card`: **ignore it**, use #8. |
| #8 | `art/card-ch2` | `P2_card` druid (Druid of the Monolith) + 3 animation frames |
| #9 | `art/room-ch3` | **Room 3 updates since #3 was merged:** monitor reads as a TV (browser bar), corner CRTs removed, "No Stairway" sign, laptop on her desk, win frame, both close-ups redone, guitar headstock, painted glow removed. `P3_card` animation frames. |
| #10 | `art/room-ch4` | **Room 4 updates since #4 was merged:** blank tape label on Einar's CRT, win frame (o7 salute), solid console screen, **P4 card redone as Knight Watch**. |
| #5 | `art/room-ch5` | Room 5, now **the atrium**: plate, talk ×2, win, monitor with three readout boxes, laptop close-up, pager and stickers removed. `P5_card` animation frames. |

## Code to do

1. **Install** each drop's files into `assets/` under the names in its hand-back.
2. **Frame-swap areas** (the `patches` in each room's json): use each hand-back's numbers. Two are known to be wrong now:
   - `ch2.json`: x 239, y 48, w 70, h 90 cuts him off at the waist. Use **x 234, y 37, w 76, h 137**.
   - Room 3: use **x 7, y 7, w 114, h 155**.
3. **Win frames:** every room now has `R<n>_npc_win`. Show it on `ch<n>.win` / `ch<n>.recovered`.
4. **Room 2 whiteboard:** theory text goes on the taped sheet (x 49–107, y 32–100 in the close-up); after the win, swap to `R2_wall_closeup_fixed`.
5. **Room 3 monitor glow (Rick):** no glow in the art. Draw a soft, dithered halo around the bezel (x 97–223, y 26–100) that flickers between pure white and a darker bluish white, and tint the page with the same flicker. Reduced motion: steady and low, or off.
6. **Card animations:** P1, P2, P3 and P5 have 3 painted frames each. Loop card → 1 → 2 → 3 → 2 → 1 at 160–200 ms; reduced motion shows the still. **P4 is code-animated:** urgent notifications scroll on her phone screen (about x 213–228, y 149–169 on the card).
7. Respect reduced motion everywhere: still images only.

## Script to do

- **Chapter 2:** delete `ch2.look.workstation` (there is no second computer).
- **Chapter 3:** delete `ch3.look.workstation`. Add a look line for the **"No Stairway" sign** (x 263–294, y 48–72), and a guitar prompt that answers "No Stairway to Heaven".
- **Chapter 4:** the class is now **Knight Watch** (`ch4.persona.class`, card title). Rename the "Pager Endurance" stat (for example "Notification Endurance"). She has a **smartphone**, not a pager. The CRT label's words ("THE FLEET CODE. ASK EINAR.") come from the game; the tape in the art is blank.
- **Chapter 5:** the room is now **the building's atrium**, not a loft. Rewrite:
  - `ch5.room.enter`: no loft, no three desks, no projector, **no pager**.
  - `ch5.look.wall`: a monitor on a stand, not a projector.
  - `ch5.look.pc`, `ch5.pc.title`, `ch5.npc.call.3`: a laptop on a low coffee table with a bean bag, not the door desk, books or stool.
  - `ch5.pc.email.3` mentions a bike; there isn't one.
  - **Remove `ch5.look.pager`** and the pager hotspot. The pager belongs to the Honeycomb Hero.
  - **Pinball look line (Rick):** "You already hit your 5-hour token spend today."

## Stale docs

- `briefs/art/01-rooms-2-5.md` still describes the old Room 2 (status wall, server cabinet, plug), the old Room 5 loft, and the R5 pager. The drops are the truth.
- `briefs/art/02-persona-cards.md`: P4 is now Knight Watch (sentry, spyglass, smartphone, a plain shield with a 999+ badge).

## Provenance and cost

Gemini API `gemini-3.1-flash-image` on Rick's personal account. Since 11:29 on 2026-11-13 it has billed to a project on the company card. Exact prompts are in `scratch/room_gen/gen_set.py`, `scratch/card_gen/edit_fx.py` and `edit_sparkle.py`; all tries are in `scratch/*/raw/tries/`.
