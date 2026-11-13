# Art drop: P1 card, the CTO (2026-11-12)

From brief `briefs/art/02-persona-cards.md`, P1 only. Made by Art Claude on Rick's personal account.

## Files

| File | Size | What |
|---|---|---|
| `P1_card.png` | 640×400 | The CTO as Archmage of the Budget: blue wizard robes and hat over her dark blazer, a staff topped with a glowing pen nib, and a blank contract scroll with a red ribbon. Night skyline behind her. |

## Changes from the brief

- **None to the picture.** Rick picked try 1 of 3.
- **Rick asked for a small animation or magic sparkle.** Gemini frames could not be made: the API project hit its monthly spending cap mid-session. So for now the sparkle is **code**: twinkling glints drawn over the still (see below). If Rick raises the cap, painted sparkle frames can replace this; they would differ from `P1_card.png` only inside the zones below.

## Facts the code depends on (320×200, about ±3 px)

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

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-12. The `R1_exec_floor` plate was attached as the reference for the CTO's look and the game style.
- **Prompt:** the brief's opening and closing lines around the P1 description, plus: "She fills most of the height of the picture, seen from about the knees up, her face clearly visible and recognisably the same woman as in the reference. Keep the outer edge of the picture free of anything important. Original costume, not from any game, film or card game. Avoid: text, runes, writing on the scroll, card frame, border, photorealism, smooth gradients."
- **Tries:** 3; try 1 kept. Crop: centre 16:10 (1264×790), then nearest-neighbour to 640×400.
- **Check:** reads at 128×80 nearest-neighbour: her face, the hat, the diagonal staff and the scroll are all clear.

## Sign-off

Rick approved try 1 on 2026-11-12.
