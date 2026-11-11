# Intro shots — generation brief (Firefly → Gemini 3.1 Nano Banana 2, 3:2, 1K)

Source of truth for the sequence: `docs/intro-storyboard.md`. Eight images, in the same look as the
narrator portraits (large EGA close-ups, coarse ordered dithering, 1-pixel dark outlines), plus one
bedroom in the gameplay VGA look. The pager's text is drawn in code, so its LCD must be **blank**.

**Consistency is the whole job.** Shots 3, 5 and 7 are the same person in the same bed. Generate shot 3
first, pick the keeper, then attach it as the reference image for 3b, 5 and 7 and say "same person,
same angle, same framing". Likewise attach shot 2 when generating nothing else — it is reused for
shot 6 in code.

The sleeper is deliberately generic and half in shadow (the player's own hero appears in shot 9):
an adult of ambiguous gender, short dark messy hair, medium skin tone, plain pale-blue striped pyjamas.

**Common preamble (paste first in every prompt for shots 1–8):**
> Sierra On-Line EGA pixel art adventure game cutscene, 320x200, 1989 era. EGA 16-color palette
> only, hard pixel edges, flat color fills, visible coarse ordered dithering, 1-pixel dark outlines,
> no anti-aliasing, no blur, no gradients, no photorealism, no 3D shading, no text, no letters.

**Negative prompt:** text, letters, numbers, watermark, logo, gradients, blur, soft shading,
anti-aliasing, photorealistic, 3D render, smartphone, modern phone, honeycomb pattern.

| File (save into `scratch/intro_gen/`) | Shot | Prompt (after the preamble) |
|---|---|---|
| `intro_01_dark.png` | 1 — the room in the dark | A dark bedroom at night, wide shot, almost entirely black. In the center a wooden nightstand with a table lamp (off) and a small 1990s pager; to the right a bed with a person asleep under a blanket, head on a pillow. The only light is a faint green glow from the pager, dimly revealing the nightstand, the lamp and the sleeper's outline in dark blue and dark grey dithering. Everything else pure black. |
| `intro_02_pager.png` | 2 and 6 — pager close-up | Extreme close-up of a 1990s pager lying on a wooden nightstand, seen from the front, filling most of the frame. Dark grey plastic body, two round buttons, a belt clip. A wide rectangular LCD screen with a bright green backlight, **completely blank, no text, no symbols**, flat solid green. Dark room behind. The screen must be a clean straight-edged rectangle occupying the upper middle of the pager. |
| `intro_03_face_asleep.png` | 3 — asleep | Close-up of a sleeping person's face on a white pillow, three-quarter view, head turned toward the viewer, filling the frame. Eyes closed, mouth slightly open, a small line of drool at the corner of the mouth, messy short dark hair, pale-blue striped pyjama collar. Dark room: the face is dim, lit faintly from the lower left by a green glow, cool blue-grey shadows elsewhere, black background. |
| `intro_03b_eye_cracks.png` | 3 — the eye opens | *(attach `intro_03_face_asleep.png`)* Same person, same angle, same framing, same lighting. One eye is now barely cracked open, bleary and unfocused; the other still shut. Drool still there. |
| `intro_04_arm.png` | 4 — the reach | Close-up of an arm in a pale-blue striped pyjama sleeve reaching from the right edge of the frame toward a 1990s pager on a wooden nightstand at the left, fingers outstretched, about to grab it. The pager's blank green LCD glows and lights the hand green. Dark room, black background. |
| `intro_05_face_lit.png` | 5 — lit by the pager | *(attach `intro_03_face_asleep.png`)* Same person, same angle, same framing. Now awake, eyes half open and squinting down toward the lower left at something glowing out of frame. The face is lit strongly from the lower left in bright green with hard dithered shadows; the far side of the face falls into black. |
| `intro_07_face_misery.png` | 7 — misery | *(attach `intro_05_face_lit.png`)* Same person, same angle, same framing, same green light. Expression changed to pure misery and hopelessness: eyebrows pinched up in the middle, eyes wide and hollow, mouth pulled down, a hand holding a pager with a blank green LCD entering at the bottom left corner. |
| `intro_08_lamp.png` | 8 — the lamp | Close-up of a hand in a pale-blue striped pyjama sleeve reaching in from the right to pull the chain of a table lamp on a wooden nightstand. The lamp has just switched on: warm yellow light floods out of the shade, lighting the hand and the top of the nightstand; the edges of the frame still dark. |

**Shot 9 — the VGA bedroom (different look; do not use the preamble above):**

| File | Prompt |
|---|---|
| `intro_09_bedroom.png` | Sierra On-Line SCI VGA point-and-click adventure game room, 320x200, 1991 era, 256-color hand-painted pixel art, soft dithered shading. A small bedroom at night with the lamp on, seen from the side like a stage. Left: a single bed with rumpled blue blanket and white pillow, **empty, nobody in it**. Beside it a wooden nightstand with a lit table lamp. Above the bed a **large empty stretch of plain wall**, uniform color, no posters, no pictures, no window — reserved for a title. Right: a closed wooden door. A clear, flat, uncluttered wooden floor band across the bottom third where a character can walk from the bed to the door. No people, no text, no letters. |

**Post-process (each):** export at 1K → crop to 16:10 → Image Size **640×400**, Nearest Neighbor →
PNG into `scratch/intro_gen/`. I downsample to 320×200 and palette-reduce in the tooling.

**What I do with them:** measure the LCD rectangle in `intro_02_pager.png` and draw "Help!" and the
scrolling CTO message into it with a pixel font; cut 3 → 3b on the eye; pulse the green light on 5
by palette; letter the title on the wall of 9 and walk the player's hero from the bed to the door.
