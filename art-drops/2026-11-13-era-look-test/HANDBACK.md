# Art drop: era-look test, room 2 (2026-11-13)

For **Cloud Claude**. From `briefs/art/03-era-look-test.md` (on `desktop/era-look`). Branch `art/era-look-test` from `origin/era-look`. Nothing on `sci-adventure` changes.

## File

| File | Size | What |
|---|---|---|
| `R2_era_test.png` | 640×400 | The approved `R2_war_room`, unchanged, with the cloud engineer redrawn in a simpler game-character style and the hero added, in profile, facing him |

## The prompt that was used (the brief's starting text, unchanged)

> Keep this scene exactly as it is: every object, every colour, the framing, and the painting of the room. Change only the man. Redraw him as a simple hand-drawn cartoon figure of the kind 1990s adventure games used for their characters: flat colour with two or three tones on each piece of clothing, a clean dark outline, no fine shading, no wrinkles, no texture, and a simple face made of a few marks. Same pose, same clothes, same size, same place. Add one more person drawn in exactly the same simple way and the same height: a software developer in their thirties standing a body's width to his left and a little nearer the viewer, in pure side profile facing him, arms relaxed, in a plain dark navy hoodie with the hood down, blue jeans and dark sneakers, short dark hair and a short beard. No text, no letters, no numbers, no logos.

Attached: `scratch/room_gen/raw/R2_war_room.png` only. No game screenshot was attached or looked at; Rick judged the tries by eye.

## Style words settled on

The brief's words, unchanged. Rick picked between two tries:
- **Kept: try 2.** "Getting close enough." The figures are simplified but keep some shading: a few tones on each garment, a soft outline, a face with simple features.
- **Rejected: try 1.** "Looks like a cartoon more than a game." It had flatter colour, heavier outlines and rounder faces.

So the next pass should aim at **try 2's level**: simple and few-toned, but not flat cartoon. If the words are tuned, add something like "the moderate detail of a 1990s point-and-click game character, not a cartoon", and drop "simple hand-drawn cartoon".

## Facts the code depends on (320×200, about ±3 px)

- **Hero:** x 140–207, y 49–185; feet at about y 185; side profile, facing right. Nothing is on the hoodie's chest; the game adds the Honeycomb mark from the official file.
- **Cloud engineer:** x 257–310, y 44–173, the same place and pose as the approved plate.
- **Only these two regions differ** from the approved `R2_war_room`; the room is pixel-identical.
- The hero stands about 70 px left of the engineer, not "a body's width". That leaves open floor for the walk.

## Flaws kept

- **The two figures don't match exactly.** The engineer stays a little more detailed than the hero (more shading on his jacket and face), so the test is "close", not identical.
- **The engineer's glasses** are on his face here; in the approved plate they're pushed up on his head.

## Provenance

- Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-13. `scratch/room_gen/gen_set.py`, `J['R2_era']`.
- 2 tries (t2 kept), within the brief's 5. Only the two figures were composited onto the approved plate: diff > 40 inside a box round each figure, MaxFilter(11), MinFilter(5). The first composite cut off the hero's front; the box was widened.
- Crop: centre 16:10 (1264×790), nearest-neighbour to 640×400.

## Sign-off

Rick, 2026-11-13: try 2 "getting close enough".
