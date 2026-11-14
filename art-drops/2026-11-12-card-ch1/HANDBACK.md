# Art drop: P1 card, the CTO (2026-11-12)

From brief `briefs/art/02-persona-cards.md`, P1 only. Made by Art Claude on Rick's personal account.

## Files

| File | Size | What |
|---|---|---|
| `P1_card_sparkle_1.png`, `_2.png`, `_3.png` | 640×400 | Painted sparkle frames (added 2026-11-13): the same card with the gold glints, light trails and nib glow in new positions. |
| `P1_card.png` | 640×400 | The CTO as Archmage of the Budget: blue wizard robes and hat over her dark blazer, a staff topped with a glowing pen nib, and a blank contract scroll with a red ribbon. Night skyline behind her. |

## Changes from the brief

- **None to the picture.** Rick picked try 1 of 3.
- **Rick asked for a small animation or magic sparkle.** Added 2026-11-13: three painted sparkle frames. Each is a Gemini edit of the card; only the magic zones (below) were composited back, so her face, hat and body never change.
  - **Loop:** `P1_card` → `_sparkle_1` → `_sparkle_2` → `_sparkle_3` → `_sparkle_2` → `_sparkle_1`, about 160–200 ms a frame. Reduced motion: `P1_card` only.
  - The code-drawn glints described below are optional now; use them on top for extra twinkle, or skip them.

## Facts the code depends on (320×200, about ±3 px)

- **The sparkle frames differ from `P1_card` only inside** x 220–320, y 8–100 (around the nib), x 50–260, y 128–192 (the trail by the scroll and robe) and x 15–80, y 100–175 (the trail by her cape). The scroll and ribbon sit inside the second zone and may shift a pixel or two between frames.

- **Face:** x 140–185, y 40–75. Keep the card's frame, name and stats off it.
- **Outer 6%:** nothing important. The cape tip reaches about x 30 on the left; the card frame may cover it.
- **Sparkle zones**, where the art already has gold glints and light trails:
  - A, around the pen nib: x 220–300, y 15–100; the nib glow centre is about (272, 42).
  - B, the trail around the scroll and her legs: x 50–260, y 140–192.
- **Suggested glint:** 1 px dot → 3 px plus → 5 px plus → 3 px → dot, about 90 ms per step, centre near white `#FFFFFF`, arms gold `#FFE88C`. About 20 glints, random starts, so the loop never pulses in step. Optional: brighten the nib glow by a step every second or so.
- **Reduced motion:** the still only.
- **Preview:** Rick has a GIF of this effect (`scratch/card_gen/review/P1_card_sparkle_preview.gif`, not committed).

## Flaws kept

- The gold trail crosses the bottom edge at about x 90–190; that's inside the outer 6% but only light, nothing important.

## Provenance

- **Sparkle frames (2026-11-13):** 3 edits of the raw card (`scratch/card_gen/edit_sparkle.py`), all 3 kept, composited back inside the zones above (diff > 70, MaxFilter(7), MinFilter(3)).

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12. The `R1_exec_floor` plate was attached as the reference for the CTO's look and the game style.
- **Prompt:** the brief's opening and closing lines around the P1 description, plus: "She fills most of the height of the picture, seen from about the knees up, her face clearly visible and recognisably the same woman as in the reference. Keep the outer edge of the picture free of anything important. Original costume, not from any game, film or card game. Avoid: text, runes, writing on the scroll, card frame, border, photorealism, smooth gradients."
- **Tries:** 3; try 1 kept. Crop: centre 16:10 (1264×790), then nearest-neighbour to 640×400.
- **Check:** reads at 128×80 nearest-neighbour: her face, the hat, the diagonal staff and the scroll are all clear.

## Sign-off

Rick approved try 1 on 2026-11-12.
