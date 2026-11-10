# Brief: Generate the Jessitron portrait for Observability Quest (Gemini image model)

You are generating one new pixel-art portrait that must sit next to five existing ones without
looking out of place. The project is a Sierra On-Line-style (1989 EGA) choose-your-own-adventure
game for Honeycomb.io. Everything you need is in this file plus the attached images.

## Attached files (expected)
- `jessitron_reference.jpg` — photo of the subject. Likeness source.
- `portrait_christine.png` and `portrait_charity.png` — two of the existing portraits (320×214).
  These define the style target: palette, dithering, outline weight, black background, framing.

## Deliverables
1. `portrait_jessitron_1k.png` — the raw generated image, 3:2 aspect, ~1536×1024 or whatever the
   model's 1K 3:2 output is. Keep the best of 4 variants; keep the other 3 too, numbered.
2. `portrait_jessitron.png` — **640×428 px**, produced from the raw image by **nearest-neighbor
   resampling only** (center-crop to exactly 3:2 first if needed). No bilinear, no sharpening.
3. A short note: which model ID you used, the exact final prompt text, and anything you changed
   from the prompt below. This goes into the project's `ASSET_PROMPTS.md`.

Use Python + Pillow for the resize: `img.resize((640, 428), Image.NEAREST)`.

## Model
The existing portraits were made in Adobe Firefly using the model Firefly labels
"Gemini 3.1 (Nano Banana 2)", 3:2 aspect, 1K size. Use the closest Gemini image-generation model
available to you. List the available image models first and say which one you picked. If the model
supports a reference image input, attach `jessitron_reference.jpg` as the reference.

## Style target (match the two attached portraits)
- Solid pure black background. Nothing else behind the subject.
- Head and shoulders, centered, facing the viewer. Head fills roughly the upper two-thirds of the
  frame; shoulders run off the bottom edge. The bottom quarter stays dark so the game can draw a
  text box over it.
- EGA 16-color feel: flat fills, ordered (checkerboard / 2×2) dithering for shading, hard pixel
  edges, 1-pixel dark outlines, no anti-aliasing, no gradients, no soft shading, no photorealism.
- Hair in the existing portraits is rendered in blues and violets regardless of the real color.
  The subject's real hair is already teal-to-violet, so lean into it.
- Honeycomb palette the project uses in prompts (name them in the prompt, the model responds to
  hex codes): Slate #25303E, Cobalt #0278CD, Pacific #0298EC, Lime #64BA00, Honey #FFB000,
  Tango #F96E10, Indigo #51368D, Denim #01487B.

## Prompt (start here; adjust only if the output misses the style target)
> Sierra On-Line EGA pixel art adventure game portrait, 320x200, 1989 era. Head-and-shoulders
> portrait of the person in the reference photo, centered, facing the viewer, warm confident smile
> showing teeth, direct eye contact. Likeness is the priority: keep her face shape, brow line, eyes,
> and smile exactly as the reference. Hair: very short dark cropped sides with a tall swept-up
> fringe, rendered in Pacific (#0298EC) blending into Cobalt (#0278CD) and Indigo (#51368D) at the
> tips, with chunky single-pixel highlight strands and ordered dithering between the three colors,
> no gradients. Skin in warm EGA tones (light tan, orange-tan, brown-orange) with coarse 2x2
> dithering for shading under the cheekbones and jaw. Lips Tango (#F96E10). Subtle Honey (#FFB000)
> eyeshadow accent. Small stud earrings, one pixel each. Sleeveless top in Slate (#25303E) with a
> loose scattered Honey (#FFB000) floral motif rendered as 3-5 pixel clusters.
> Background: solid pure black, nothing else — no wall, no artwork, no gradient, no vignette.
> Composition: head occupies the upper two-thirds of the frame, shoulders exit the bottom edge,
> leaving a clear black band across the bottom quarter for a text box.
> Style: EGA 16-color palette only, hard pixel edges, flat color fills, visible ordered dithering,
> 1-pixel dark outlines on the figure, no anti-aliasing, no blur, no gradients, no photorealism,
> no 3D shading, no text.

Negative prompt, if the model accepts one: rainbow, colorful background, wall art, gradients, blur,
soft shading, anti-aliasing, photorealistic, 3D render, text, watermark, honeycomb pattern,
hex tiles.

## Iteration rules
- Generate 4. Pick for likeness first, palette/dither match second.
- If the rainbow wall from the photo leaks in: mask the photo's background to black first and
  re-attach it as the reference.
- If the hair reads neon: add "muted, desaturated" before the hair colors.
- If the result is too smooth / painterly: add "chunky visible pixels, 320x200 resolution upscaled
  with nearest neighbor" and reduce any "detail" or "quality" boosters.
- If the face drifts from the reference: shorten the style section and move the likeness sentence
  to the very start.

## Acceptance check (do this before calling it done)
Put `portrait_jessitron.png` (downsampled to 320×214 for this check, nearest-neighbor) side by side
with `portrait_christine.png` and `portrait_charity.png`. They should read as three frames from the
same game: same black, same outline weight, similar dither density, similar head size in frame. If
one looks like a different art style, it fails; iterate.

## Optional, only if asked separately
The same pipeline can regenerate the other 11 game images at 640×428 (title, 5 scenes, 5 other
portraits). Do not do this unless the person asks; those images are already approved and
regenerating them would require re-approval.
