# Intro shots — generation brief (Firefly → Gemini 3.1 Nano Banana 2, 3:2, 1K)

Source of truth for the sequence: `docs/intro-storyboard.md`. Look: the narrator portraits — large EGA
close-ups, coarse ordered dithering, 1-pixel dark outlines.

## The rule: limited animation (Rick, 2026-11-11)

This is a late-80s / early-90s PC cutscene. The animator is saving disk space: **nothing moves**. Every
beat is a **cut between stills**, and each still is the previous one **recycled with the smallest
possible change** — the same nightstand with an arm added, the same face with one eyelid changed.
The only things that change over time are done in code: a light that blinks by swapping palette, text
that flashes, text that scrolls.

So there are only **four plates**. Everything else is an **edit of a plate**: attach the plate as the
reference and ask for the one change, exactly as the portrait blink/talk frames were made
("identical image, pixel for pixel, except…"). If a variant drifts — framing, hair, pillow, nightstand
edge — reject it; the cut only works if the rest of the frame does not move.

**Common preamble (plates A–C and their edits):**
> Sierra On-Line EGA pixel art adventure game cutscene, 320x200, 1989 era. EGA 16-color palette
> only, hard pixel edges, flat color fills, visible coarse ordered dithering, 1-pixel dark outlines,
> no anti-aliasing, no blur, no gradients, no photorealism, no 3D shading, no text, no letters.

**Negative prompt:** text, letters, numbers, watermark, logo, gradients, blur, soft shading,
anti-aliasing, photorealistic, 3D render, smartphone, modern phone, honeycomb pattern.

The sleeper is generic and half in shadow (the player's own hero appears in the VGA bedroom): an adult
of ambiguous gender, short dark messy hair, medium skin tone, pale-blue striped pyjamas.

## Plates (generate these four first; pick keepers before making any edit)

| File → `scratch/intro_gen/` | Used for | Prompt (after the preamble) |
|---|---|---|
| `A_room_dark.png` | Shot 1 | A dark bedroom at night, wide shot. Center: a wooden nightstand with a table lamp (off) and a small 1990s pager. Right: a bed with a person asleep under a blanket, head on a pillow. Lit only by a faint green glow from the pager, so the nightstand, lamp and sleeper are dim shapes in dark blue and dark grey dithering; everything else pure black. |
| `B_nightstand.png` | Shots 2, 4, 6, 8 | Close-up of the top of a wooden nightstand in a dark bedroom, seen from the front. A 1990s pager lies on it, large, slightly left of center: dark grey plastic, two round buttons, and a wide rectangular LCD with a bright green backlight that is **completely blank — no text, no symbols**, a clean straight-edged rectangle. At the far left edge, the base and lower stem of a table lamp with a pull chain, lamp off. The **right third of the frame is empty dark space** above the nightstand (an arm will be added there). Black background. |
| `C_face_asleep.png` | Shots 3, 5, 7 | Close-up of a sleeping person's face on a white pillow, three-quarter view, head turned toward the viewer, filling the frame. Eyes closed, mouth slightly open, a small line of drool at the corner of the mouth, messy short dark hair, pale-blue striped pyjama collar. Dark room: face dim, lit faintly from the lower left by a green glow, cool blue-grey shadows, black background. |
| `D_bedroom_vga.png` | Shot 9 | *(No preamble — different look.)* Sierra On-Line SCI VGA point-and-click adventure game room, 320x200, 1991 era, 256-color hand-painted pixel art, soft dithered shading. A small bedroom at night with the lamp on, seen from the side like a stage. Left: a single bed with rumpled blue blanket and white pillow, **empty, nobody in it**. Beside it a wooden nightstand with a lit table lamp. Above the bed a **large empty stretch of plain wall**, uniform color, no posters, no pictures, no window. Right: a closed wooden door. A clear flat wooden floor band across the bottom third. No people, no text. |

## Edits (attach the plate; "identical image, pixel for pixel, except…")

| File | Plate | The one change |
|---|---|---|
| `B_arm.png` | `B_nightstand.png` | …except an arm in a pale-blue striped pyjama sleeve now enters from the right edge and its hand rests on the pager, gripping it. Nightstand, pager, lamp base and background unchanged. |
| `B_lamp.png` | `B_nightstand.png` | …except a hand in the same pyjama sleeve enters from the upper left and holds the lamp's pull chain, and the pager is gone from the nightstand. Lamp still off. *(The lamp turning on is a palette change in code.)* |
| `C_eye_crack.png` | `C_face_asleep.png` | …except the eye nearer the viewer is barely cracked open, bleary. Everything else — other eye, mouth, drool, hair, pillow, lighting — unchanged. |
| `C_awake.png` | `C_face_asleep.png` | …except both eyes are half open, squinting down toward the lower left, and the mouth is closed. Hair, pillow, collar, framing unchanged. |
| `C_misery.png` | `C_awake.png` | …except the eyebrows are pinched up in the middle and the mouth is pulled down: misery and hopelessness. Eyes, hair, pillow, framing unchanged. |

That is nine images: four plates, five edits.

## What the code does (no new art)

- **Shot 1:** black ↔ `A_room_dark` on the pager's blink. Two states, no fade.
- **Shot 2:** `B_nightstand`, "Help!" flashing on the LCD in a pixel font.
- **Shot 3:** cut `C_face_asleep` → `C_eye_crack`.
- **Shot 4:** cut to `B_arm`. The arm does not travel; it is simply there.
- **Shot 5:** `C_awake`, the green light "flashing" as a two-state palette swap of the same still.
- **Shot 6:** `B_nightstand` again, the CTO message scrolling across the LCD.
- **Shot 7:** cut to `C_misery`.
- **Shot 8:** cut to `B_lamp`; one beat later the whole frame swaps to a warm lit palette — the click.
- **Shot 9:** `D_bedroom_vga`, title lettered on the wall, theme. This is where the game's real animation starts: the player's hero gets up, changes, walks out.

**Post-process (each):** export at 1K → crop to 16:10 with the *same crop box for a plate and all its
edits* → Image Size **640×400**, Nearest Neighbor → PNG into `scratch/intro_gen/`. I downsample to
320×200, check every edit against its plate, and keep only the pixels that changed (as with the
portrait frames), so an edit that drifted shows up immediately.
