# Art drop: Room 3: the dev bullpen (Frontend Developer) (2026-11-12)

From `briefs/art/01-rooms-2-5.md` (room 3) and `briefs/art/02-persona-cards.md` (`P3_card`). Made by Art Claude on Rick's personal account.

## Files (all 640×400)

| File | What |
|---|---|
| `R3_bullpen.png` | Room plate |
| `R3_npc_talk_1.png`, `R3_npc_talk_2.png` | The persona in two other moments; differ from the plate only in the region below |
| `R3_npc_win.png` | **New 2026-11-13.** Win frame: she hangs up the phone, relieved, with a small fist pump (`ch3.recovered`, `ch3.win`) |
| `R3_wall_closeup.png` | The wall display straight on, all panels blank |
| `R3_pc_closeup.png` | The hero's computer screen straight on, blank |
| `P3_card.png` | `P3_card`: Bard of the Browser. Feathered cap, cape, tunic over the cardigan, striking a chord on a lute-shaped guitar with one boot on an amp, sparks off the strings. Reads at 128×80. |

## Changes from the brief

- **The wall monitor is pale, not dark.** Every take drew the checkout page as a lit white screen; Rick approved the plate as is. Its outlines are thin dark lines on pale blue-white, so draw in dark ink.
- **The three small rectangles are short:** about 33×10 in the room and 73×21 in the close-up, below the brief's minimums (18×20 and 55×40). One line of text each.
- **The guitar is right-handed** (the brief said not to spend tries on it).
- **The PC close-up's screen is about 49% of the frame's width and height**, below the brief's 60%. Both tries were the same size.
- **Talk 2:** she looks down at the phone held up in both hands; the cord phone handset is gone from her ear.

## Facts the code depends on (320×200, about ±3 px)

### Hotspots and walking

| Hotspot | Rect (x, y, w, h) | Hero stands at (left edge, 28 px hero) |
|---|---|---|
| `pc`: developer desk, laptop, monitors, chair, guitar (right) | 190, 78, 130, 108 | x 262 |
| `monitor`: wall monitor | 100, 30, 120, 65 | no walk; the tap opens the close-up |
| `npc`: Frontend Developer at the standing desk (left) | 8, 45, 94, 141 | x 104 |

**Walking:** feet on y 192; hero's left edge from x 0 to x 292. The open gap is x 102–188.

### Display panels (the art is blank; the code draws in these)

| Panel | Room (`R3_bullpen`) | Close-up (`R3_wall_closeup`) |
|---|---|---|
| Whole screen | x 100–219, y 30–94 | x 31–287, y 22–171 |
| Top bar (progress, stuck at 13%) | x 111–208, y 34–42 | x 54–264, y 31–50 |
| Large rectangle (the cart item: the guitar) | x 111–171, y 46–80 | x 54–182, y 60–137 |
| Small rectangle 1 | x 176–208, y 46–55 | x 192–264, y 60–80 |
| Small rectangle 2 | x 176–208, y 59–68 | x 192–264, y 88–108 |
| Small rectangle 3 | x 176–208, y 72–80 | x 192–264, y 117–137 |
| Bottom lane (conversions) | x 111–208, y 84–90 | x 54–264, y 147–160 |

**PC close-up (`R3_pc_closeup`) screen:** x 81–237, y 39–137.

### Talk frames

The loop plate → talk_1 → plate → talk_2 swaps cleanly. Changed region: talk_1: x 27–117, y 20–135. talk_2: x 27–112, y 20–135. (the region includes a few stray pixels round the figure that match the plate to within a shade).


## Updates for the revised script (2026-11-13)

Cloud Claude rewrote chapter 3 around this drop. These changes fit the art to it:
- **A laptop on her standing desk.** `ch3.look.npc` says "On her screen is a pull request: a nicer spinner", but her desk had no screen. A small laptop now sits there, lid toward the viewer (about x 40–70, y 100–118). It's in the plate, both talk frames and the win frame.
- **The sticker in the middle of the spare laptop's lid** looked like a well-known fruit logo. It's now a plain orange sticker.
- **New `R3_npc_win`** differs from the plate only inside **x 10–113, y 14–138**. With the talk frames, the frame-swap area for this room is **x 10, y 14, w 108, h 125**.
- **The guitar is right-handed,** which the script now uses ("Right-handed, like nine in ten of them").
- **Script loose end:** `ch3.look.workstation` describes a separate workstation with a sticky note. The room has only the spare desk.


## Round 2 (Rick, 2026-11-13)

- **The wall display now clearly reads as a TV monitor,** not a whiteboard. It has a thick black bezel and a power light. (A painted glow on the bricks was tried and removed: Rick said it read as errant paint. See "Screen glow" below.) The page has a **browser title bar** (three dots and an empty address bar). The same change is in `R3_wall_closeup`.
  - **Wide shot:** the browser bar replaced the old top progress bar. In the room view, draw the progress in the address bar (**x 120–209, y 36–40**) or skip it, since text is too small at that size anyway. The other panels are unchanged: large x 111–171, y 46–80; small x 176–208 at y 46–55, 58–67, 71–80; lane x 111–208, y 84–90; whole screen x 102–217, y 34–94.
  - **Close-up:** title bar y 22–32 with the address bar x 97–223, y 24–30; **top bar (progress) x 54–265, y 39–51**; large x 54–183, y 60–137; small x 192–265 at y 60–80, 88–109, 117–137; lane x 54–265, y 147–160. The page is pale, so draw in dark ink.
- **The two old CRT monitors and their cabinet in the back right corner are gone.** Rick: they looked like 80s portable TVs. Only brick wall is behind the chair now.
- **New sign: a handwritten "No Stairway" sheet** taped on the right wall at **x 263–294, y 48–72**. It's the only writing in the room, at Rick's request, so the guitar can get the prompt "No Stairway to Heaven". It could be its own small hotspot.
- **`R3_npc_talk_2` and `R3_npc_win` were remade** on the new plate. Her figure now changes inside **x 7–120, y 7–161** across all three frames. **The frame-swap area for this room is x 7, y 7, w 114, h 155.**

- **Screen glow is the code's job (Rick, 2026-11-13).** The art has no glow. Draw a soft halo around the monitor's bezel (**x 97–223, y 26–100**), fading out over about 6–10 px, dithered to fit the palette rather than a smooth gradient, with no hard edge. Animate its intensity, flickering irregularly between pure white and a slightly darker bluish white, the way a TV lights a dark room. Tint the screen's pale page with the same flicker. Reduced motion: hold it steady at a low level, or leave it off.
- Also cleaned in this pass: a duplicate set of tiny browser dots above the title bar, and a stray white motion-arrow by her wrist in `R3_npc_win`.

## Flaws kept

See "Changes from the brief". Nothing else known.

## Provenance

- **Round 2 (2026-11-13):** one edit of the plate for the monitor, the corner and the sign (2 tries, t2 kept; only those three areas composited back). Close-up: an edit, 2 tries, t2 kept. Talk 2 and the win frame: new edits of the new plate, 2 tries each, t1 kept, with only her figure composited. Script: `scratch/room_gen/gen_set.py` (`R3_fix2`, `R3_wall2`, `R3_npc_talk_2b`, `R3_npc_win_b`). Earlier versions are in `raw/tries/R3_before_fix2/`.

- **2026-11-13 updates:** one edit of the plate for the laptop and the sticker (2 tries, t1 kept; only those two areas composited back, then pasted into the talk frames). Win frame: an edit of the plate, 2 tries, t1 kept; only her figure composited. Script: `scratch/room_gen/gen_set.py` (`R3_fix`, `R3_npc_win`). The earlier versions are in `scratch/room_gen/raw/tries/R3_before_update/`.

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12, on Rick's personal account.
- **Plate:** the brief's room prompt with its opening and closing lines, `scratch/room_gen/raw/R1_exec_floor.png` attached as the style reference (`scratch/room_gen/gen_rooms.py`).
- **Talk frames:** edits of the approved plate with the brief's edit wording (`scratch/room_gen/gen_set.py`), 2 tries each. Only the person's changed pixels were composited back onto the plate (a diff mask inside a box round the person), so each frame differs from the plate in one region.
- **Close-ups:** new plates, the room plate attached as the style reference, the brief's opening and closing lines, 2 tries each.
- **Card:** brief 02's prompt with its opening and closing lines, the room plate attached as the character reference, plus: knees-up, face visible, outer edge free, original costume, avoid text/runes/frame. 2 tries.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400, as for R1.
- **Tries:** Plate: try 5 of 5. Talk 1: t1. Talk 2: t2. Wall close-up: t1. PC close-up: t2. Card: t2 of 2.

## Sign-off

Rick approved the plate on 2026-11-12 ("go with the plates till we deep dive on how it's all gonna come together"): the room story may still change after that deep dive. The talk frames, close-ups and card were picked by Art Claude against the brief and have not been reviewed by Rick yet.
