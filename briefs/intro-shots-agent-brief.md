# Task for a Claude session with browser access: generate the nine intro stills

You are producing nine pixel-art stills for the intro of a small web game, *Observability Quest*, by
driving an image generator in the browser (Adobe Firefly with the Gemini image model, or Gemini
directly — whichever is signed in). You make no art yourself; you prompt, judge, redo, crop and save.
Rick is the owner; he approves the four base pictures before you make the edits.

Work in the project folder `Observability Quest Mobile` on Rick's computer. Do not run `git` there and
do not change any file outside `scratch/intro_gen/`.

## What you are making and why it is strict

The intro imitates a 1989–91 PC cutscene: **nothing moves**. The game cuts between stills, and each
still is the previous one with the smallest possible change (the same nightstand, now with an arm on
it). The cut only works if everything else in the frame is identical. So there are:

- **4 plates** — generated fresh.
- **5 edits** — each made by giving the generator the finished plate and asking for **one change**.
  Never generate an edit from text alone, and never from a different take of the plate.

Text is never part of the art. The pager's screen must be blank; the game draws the words.

## Before you start

1. Open `assets/portrait_christine.png` and `assets/portrait_graham.png` from the project folder.
   These are the look to match for plates A–C: large EGA close-ups, coarse ordered dithering, flat
   fills, 1-pixel dark outlines. Attach one as a **style reference** when the generator allows it.
2. Settings for every generation: aspect **3:2**, size **1K**, one subject per prompt, no upscaling.
3. Create `scratch/intro_gen/` and `scratch/intro_gen/raw/` if they do not exist. Save every
   generator download, untouched, into `raw/` under the names below; the finished 640×400 files go
   in `scratch/intro_gen/`.

**Preamble — put this in front of every prompt for A, B and C (plates and edits):**

> Sierra On-Line EGA pixel art adventure game cutscene, 320x200, 1989 era. EGA 16-color palette only,
> hard pixel edges, flat color fills, visible coarse ordered dithering, 1-pixel dark outlines, no
> anti-aliasing, no blur, no gradients, no photorealism, no 3D shading, no text, no letters.

**Negative prompt (where the tool has a field for it; otherwise append "Avoid: …"):**

> text, letters, numbers, watermark, logo, gradients, blur, soft shading, anti-aliasing,
> photorealistic, 3D render, smartphone, modern phone, honeycomb pattern

The sleeper is the same generic person in every shot: an adult of ambiguous gender, short dark messy
hair, medium skin tone, pale-blue striped pyjamas, half in shadow.

## Step 1 — the four plates

Generate each, judge it against its checklist, and regenerate until one passes (at most **5 tries per
plate**; if none passes, keep the closest and say what is wrong with it).

### `A_room_dark`
> [preamble] A dark bedroom at night, wide shot. Center: a wooden nightstand with a table lamp (off)
> and a small 1990s pager. Right: a bed with a person asleep under a blanket, head on a pillow. Lit
> only by a faint green glow from the pager, so the nightstand, lamp and sleeper are dim shapes in
> dark blue and dark grey dithering; everything else pure black.

Accept when: nightstand, lamp, pager and sleeper are all readable; the room is dark (mostly black and
deep blue); the lamp is off; no text anywhere.

### `B_nightstand`
> [preamble] Close-up of the top of a wooden nightstand in a dark bedroom, seen from the front. A
> 1990s pager lies on it, large, slightly left of center: dark grey plastic, two round buttons, and a
> wide rectangular LCD with a bright green backlight that is completely blank — no text, no symbols —
> a clean straight-edged rectangle. At the far left edge, the base and lower stem of a table lamp
> with a pull chain, lamp off. The right third of the frame is empty dark space above the nightstand.
> Black background.

Accept when — this one matters most, the game writes on it:
- the LCD is **one clean rectangle, bright green, completely empty** (no digits, icons, lines, glare
  shapes), with straight horizontal and vertical edges — not tilted, not in perspective;
- the LCD is **wide**: at least about 40% of the frame's width and 15% of its height;
- nothing else in the picture is bright green;
- the lamp base and pull chain are visible at the left; the right third is empty and dark.

### `C_face_asleep`
> [preamble] Close-up of a sleeping person's face on a white pillow, three-quarter view, head turned
> toward the viewer, filling the frame. Eyes closed, mouth slightly open, a small line of drool at
> the corner of the mouth, messy short dark hair, pale-blue striped pyjama collar. Dark room: face
> dim, lit faintly from the lower left by a green glow, cool blue-grey shadows, black background.

Accept when: both eyes are clearly visible and closed; mouth slightly open with drool; the face fills
the frame; it reads as the same person as in A; no text.

### `D_bedroom_vga`  — different look, **no preamble**
> Sierra On-Line SCI VGA point-and-click adventure game room, 320x200, 1991 era, 256-color
> hand-painted pixel art, soft dithered shading. A small bedroom at night with the lamp on, seen from
> the side like a stage. Left: a single bed with rumpled blue blanket and white pillow, empty, nobody
> in it. Beside it a wooden nightstand with a lit table lamp. Above the bed a large empty stretch of
> plain wall, uniform color, no posters, no pictures, no window. Right: a closed wooden door. A clear
> flat wooden floor band across the bottom third. No people, no text.

Accept when: **no person anywhere**; the bed is on the left and empty; a closed door is on the right;
a **large plain wall area** (roughly 70% of the width, a fifth of the height) is free for a title; a
flat floor band runs the full width at the bottom, clear enough for a character to walk from the bed
to the door; side-on view, not a top-down or steep perspective.

## Step 2 — stop and show Rick the four plates

Post the four keepers to Rick and wait for a yes (or a redo request) on each. Every edit is built on
a plate, so a plate swapped later means redoing its edits.

## Step 3 — the five edits

For each: open the approved plate **as the image to edit** (Firefly: generative edit / "edit image"
with the plate loaded; Gemini: attach the plate and ask for the change), and send:

> Identical image, pixel for pixel, except [the change]. Same framing, same crop, same colors, same
> dithering. Do not redraw, restyle, move or relight anything else.

| Save as | Edit this plate | The change |
|---|---|---|
| `B_arm` | `B_nightstand` | an arm in a pale-blue striped pyjama sleeve now enters from the right edge and its hand rests on the pager, gripping it. Nightstand, pager, LCD, lamp base and background unchanged. The LCD stays blank and fully visible. |
| `B_lamp` | `B_nightstand` | a hand in the same pyjama sleeve enters from the upper left and holds the lamp's pull chain, and the pager is gone from the nightstand. Lamp still off. |
| `C_eye_crack` | `C_face_asleep` | the eye nearer the viewer is barely cracked open, bleary. Other eye, mouth, drool, hair, pillow, lighting unchanged. |
| `C_awake` | `C_face_asleep` | both eyes are half open, squinting down toward the lower left, and the mouth is closed. Hair, pillow, collar, framing unchanged. |
| `C_misery` | **`C_awake`** (the finished edit, not the asleep plate) | the eyebrows are pinched up in the middle and the mouth is pulled down: misery and hopelessness. Eyes, hair, pillow, framing unchanged. |

Judge each edit by flipping between it and its plate at the same zoom. Accept when **only the named
thing changed**: the head, pillow, nightstand edge, pager and background sit in exactly the same
place. Reject on any shift, re-crop, restyle or colour drift of the rest. At most **5 tries per
edit**; then keep the closest and report it.

## Step 4 — crop and size (same box for a plate and its edits)

The downloads are 3:2; the game needs 16:10 at 640×400. Crop every file the same way — full width,
centred vertically — so a plate and its edits stay aligned. From the project folder:

```python
# scratch/intro_gen/crop.py — run: python3 scratch/intro_gen/crop.py
import os
from PIL import Image
RAW, OUT = 'scratch/intro_gen/raw', 'scratch/intro_gen'
NAMES = ['A_room_dark', 'B_nightstand', 'B_arm', 'B_lamp', 'C_face_asleep', 'C_eye_crack', 'C_awake', 'C_misery', 'D_bedroom_vga']
for n in NAMES:
    p = os.path.join(RAW, n + '.png')
    if not os.path.exists(p): print('missing', n); continue
    im = Image.open(p).convert('RGB'); w, h = im.size
    ch = round(w / 1.6); top = (h - ch) // 2
    assert ch <= h, f'{n}: {w}x{h} is wider than 16:10'
    im.crop((0, top, w, top + ch)).resize((640, 400), Image.NEAREST).save(os.path.join(OUT, n + '.png'))
    print('ok', n, f'{w}x{h}')
```

If a download is not PNG, convert it to PNG first. A plate and its edits must have the **same pixel
size** before cropping; if the generator returned an edit at a different size, that edit is a redo.
If the centred crop cuts off something that matters (the lamp base, the door), tell Rick rather than
cropping that file differently.

File names are exact and case-sensitive: `A_room_dark.png`, `B_nightstand.png`, `B_arm.png`,
`B_lamp.png`, `C_face_asleep.png`, `C_eye_crack.png`, `C_awake.png`, `C_misery.png`,
`D_bedroom_vga.png`.

## Step 5 — check with the game's own build

From the project folder run:

```
python3 tools/build_intro.py
```

It is safe to run as often as you like. Read its output:

- Last line should end **`real art`** and must not say `FALLBACK`. `FALLBACK` means it could not find
  the green LCD in `B_nightstand` — the LCD is too small, not green enough, or broken up; redo that
  plate (and then its two edits).
- One line per edit: `B_arm: 9.4% of the frame changed, x 190-319, y 40-170`. The box should cover
  only the thing you changed — the arm on the right; the hand and chain at upper left plus the spot
  where the pager was; just the eye; eyes and mouth; brows and mouth. A box that spans nearly the
  whole frame means the edit drifted: redo it.
- `… differs from … over N% of the frame` — the edit is a different picture. Redo it from the plate.
- `… is WxH; it must be 16:10` or `… is not one of the expected files` — fix the size or the name.
- `placeholders used for: …` — those files are still missing.

Then look at the results in `assets/intro/` (320×200) to confirm they still read at game size.

## Step 6 — report to Rick

- The nine finished files (or which are missing and why).
- For each: the tool and model used, the date, and how many tries it took — Rick records this in
  `ASSET_PROMPTS.md`.
- The build's output from step 5, pasted.
- For `D_bedroom_vga`, measured on the 320×200 version in `assets/intro/`: the empty wall rectangle
  (x, y, width, height), the x where the bed's blanket starts and the y of the blanket's top edge, an
  x just right of the bed where a person could stand, the x of the door, and the y of the floor line
  a character's feet would stand on. Rick needs these to place the title and the hero.
- Anything you kept despite a flaw.

## Do not

- Put any words, digits or logos in any image, or ask for a honeycomb pattern.
- Use a real person's likeness, or any existing game's characters or artwork.
- Fix an image by painting on it yourself or compositing two takes; a failed image is regenerated.
- Commit, push, or edit files outside `scratch/intro_gen/` (the build writes `assets/intro/` itself).
