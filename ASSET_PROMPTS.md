# Asset Prompts — Observability Quest

Provenance for every generated image. Fill in the full text from Firefly history for the
existing images; the UI truncates prompts, so expand each one before copying.

**Tool:** Adobe Firefly → model **Gemini 3.1 (Nano Banana 2)**, aspect **3:2**, size **1K**.
**Post-processing:** Photoshop → Image Size → 640×428 (mobile) / 320×214 (badge), Resample =
Nearest Neighbor → Export PNG sRGB.

Common preamble used on all scenes:
> Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era.

Honeycomb palette named in prompts: Slate #25303E, Cobalt #0278CD, Pacific #0298EC,
Lime #64BA00, Honey #FFB000, Tango #F96E10, Indigo #51368D, Denim #01487B.

---

## title_screen.png
**Prompt:** _(copy full text from Firefly)_

## s1_llm.png — S1 LLM Server Room
**Prompt (partial, from Firefly history):** Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era. … five terminal monitors … _(copy full text)_

## s2_microservices.png — S2 Microservices
**Prompt (partial):** Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era. Cobalt (#0278CD) background with Slate (#25303E) dithered panel lines suggesting server infrastructure. Large Pacific (#0298EC) pixel cloud shape top center, hard pixel outline, Cobalt-on-Slate dithered inner shading. Single-pixel Pacific blue connection lines branch from cloud to 8 labeled service boxes in two rows: Auth, Payments, Orders, Inventory top row; … _(copy full text)_

## s3_ecommerce.png — S3 E-Commerce
**Prompt:** _(copy full text from Firefly)_

## s4_spaghetti.png — S4 Spaghetti
**Prompt (partial):** Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era. Nine labeled tool panels in a 3x3 grid: LOGS, APM, METRICS row one; DASH, TRACES, ALERTS row two; SIEM, LOGS2, INFRA row three. Each panel flat filled — Cobalt (#0278CD), Pacific (#0298EC), Lime (#64BA00), Tango (#F96E10), Honey (#FFB000), Indigo (#51368D) — 2-pixel black outline, white … _(copy full text)_

## s5_payments.png — S5 Payments Flow
**Prompt (partial):** Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era. Black background. Five labeled service boxes in horizontal flow across upper half: USER filled Lime (#64BA00), APP filled Cobalt (#0278CD), PAY1 filled Honey (#FFB000), PAY2 filled Tango (#F96E10), BANK filled Pacific (#0298EC). Each box has 2-pixel black outline, flat color fill, white monospace label centered inside. Between each adjacent box a 3-pixel-wide white … _(copy full text)_

## portrait_christine.png / portrait_emily.png / portrait_graham.png / portrait_matt.png / portrait_charity.png
**Prompt:** _(copy full text from Firefly; note whether a reference photo was attached)_

---

## portrait_jessitron.png — NEW (2026-11-09)

**On-screen:** JESSITRON · ENG MANAGER OF DEVELOPER RELATIONS

**Reference image:** `source/reference/jessitron_reference.jpg` — attach in Firefly as a
composition/style reference so the likeness carries. The rainbow wall in the photo is intentionally
replaced with solid black to match the other portraits.

**Prompt:**
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

**Negative prompt (if the model takes one):** rainbow, colorful background, wall art, gradients,
blur, soft shading, anti-aliasing, photorealistic, 3D render, text, watermark, honeycomb pattern,
hex tiles.

**Post-process:** Export at 1K → Photoshop → crop to 3:2 if needed → Image Size 640×428, Nearest
Neighbor → Export PNG → `scratch/exports/portrait_jessitron.png`. Compare against
`source/badge/assets/portrait_christine.png` and `portrait_charity.png` for palette and dither
consistency before approving.

**Notes:** Generate 4 variants; pick for likeness first, palette second. If hair reads too neon,
add "muted, desaturated" before the hair colors. If the model insists on the rainbow wall, remove
the reference image's background in Photoshop first (quick select → fill black) and re-attach.

## portrait_jessitron.png — Jessitron (generated 2026-11-09)
**Tool:** Adobe Firefly → **Gemini 3.1 (Nano Banana 2)**, aspect **Wide (3:2)**, resolution **1K** (output 1264×848). Gemini API was not reachable from the build environment, so Firefly was used (same model as the other portraits).
**Reference images (3):** (1) `source/reference/jessitron_reference.jpg` (likeness), (2) `portrait_christine.png`, (3) `portrait_charity.png` (style).
**Variants:** 4 generated, one per run (`scratch/exports/jessitron/portrait_jessitron_1k_1..4.png`). **Jess picked variant 3** (2026-11-12); installed as `assets/portrait_jessitron.png`.
**Post-processing:** center-crop to 1264×843 (exact 3:2), then Pillow `resize((640, 428), Image.NEAREST)`.
**Changes from the brief's starting prompt:** added the sentence tying reference 1 to likeness and references 2–3 to style; added "no rainbows" to the background clause; replaced em dashes with colons (Firefly's prompt box dropped the first paste). No negative prompt (Firefly has no field for this model).
**Prompt:**
> Sierra On-Line EGA pixel art adventure game portrait, 320x200, 1989 era. Head-and-shoulders portrait of the person in the first reference image (the photo), drawn in exactly the same art style as the second and third reference images (the two pixel-art portraits): same pure black background, same outline weight, same dither density, same framing. Centered, facing the viewer, warm confident smile showing teeth, direct eye contact. Likeness is the priority: keep her face shape, brow line, eyes, and smile exactly as the reference photo. Hair: very short dark cropped sides with a tall swept-up fringe, rendered in Pacific (#0298EC) blending into Cobalt (#0278CD) and Indigo (#51368D) at the tips, with chunky single-pixel highlight strands and ordered dithering between the three colors, no gradients. Skin in warm EGA tones (light tan, orange-tan, brown-orange) with coarse 2x2 dithering for shading under the cheekbones and jaw. Lips Tango (#F96E10). Subtle Honey (#FFB000) eyeshadow accent. Small stud earrings, one pixel each. Sleeveless top in Slate (#25303E) with a loose scattered Honey (#FFB000) floral motif rendered as 3-5 pixel clusters. Background: solid pure black, nothing else: no wall, no artwork, no rainbows, no gradient, no vignette. Composition: head occupies the upper two-thirds of the frame, shoulders exit the bottom edge, leaving a clear black band across the bottom quarter for a text box. Style: EGA 16-color palette only, hard pixel edges, flat color fills, visible ordered dithering, 1-pixel dark outlines on the figure, no anti-aliasing, no blur, no gradients, no photorealism, no 3D shading, no text.

### s2_microservices.png — label fix (2026-11-09)
The approved original had a garbled "Paymeıts" label. Fixed with **Gemini API `gemini-3.1-flash-image`** (image edit, original attached) using:
> Edit this image. In the green box in the top row that currently reads 'Paymeıts' (the 'n' is garbled), correct the label so it reads exactly 'Payments'. Match the existing pixel font, letter size, color and spacing of the other labels exactly. Change nothing else in the image: keep every other pixel, color, label, line, the cloud and the background identical. Keep the same 3:2 framing.

Gemini re-renders the whole frame (~9% of pixels drift), so only the corrected lettering inside the Payments box was composited back onto the approved 1536×1024 original; 0.5% of pixels changed, all inside that box. Files: `scratch/s2_fix/`.

---

## Animation frames (`scratch/anim_gen/*`, consumed by `tools/build_anim.py`)

Generated 2026-11-09 with **Gemini 3.1 Flash Image** (`gemini-3.1-flash-image`, generateContent,
aspect 3:2) as *edits* of the approved stills. Output is JPEG at 1264×848 despite the `.png`
names; the build resizes to 640×428 (nearest), aligns, cuts the changed region and snaps it to the
colours present in the still around that region.

Common suffix on every edit prompt:
> Keep exactly the same pixel-art style, palette, pixel size and lighting. Change nothing else in
> the image: every other part must stay identical. Keep the same framing and composition.

### S3 product variants (source: `_1k_s3_ecommerce.png`)
- **drums** (pick: `s3_drums_1`): *Edit this image. In the left product panel, replace the orange
  electric guitar with a pixel-art acoustic drum kit (bass drum with a red shell, snare, two toms, one
  hi-hat and one crash cymbal) at the same size and position as the guitar, and change the price text
  '$1299' to '$899' in the identical white pixel font, size and position. Do not change the BUY NOW
  button, the middle panel, the right warning panel or the window.*
- **keys** (pick: `s3_keys_1`): *… replace the orange electric guitar with a pixel-art synthesizer
  keyboard (about 3 octaves of black and white keys, a dark grey body with a few small colored knobs),
  shown at a slight angle at the same size and position as the guitar, and change the price text
  '$1299' to '$649' …*

### Portrait frames (source: each 640×428 portrait; christine, emily, graham, matt, charity)
- **blink**: *Edit this portrait: the person is mid-blink, with both eyes fully closed (eyelids down,
  lashes as a dark line). Only the eyes change.*
- **talk1**: *Edit this portrait: the person is talking, mouth slightly open mid-word (lips parted a
  little, a dark gap between them). Only the mouth changes; the expression otherwise stays the same.*
- **talk2**: *Edit this portrait: the person is talking, mouth open wider mid-word as if saying 'ah'
  (open mouth showing a dark inside and a hint of teeth). Only the mouth and jaw change slightly; the
  expression otherwise stays the same.*

Notes: christine_talk1 barely differs from her still (the game alternates still/talk1/talk2 so it
reads as a two-frame flap); graham's talk frames carry a slight skin-tone shift inside the patch.
Jessitron's frames: Gemini API `gemini-3.1-flash-image`, 2026-11-12, on Rick's personal account; each an edit of the chosen 1K portrait, 2 tries each (kept: blink t1, talk1 t1, talk2 t2), only the changed pixels composited back. Exact prompts in `scratch/jess_anim/gen.py`; tries in `scratch/jess_anim/tries/`.

### Derived in code (`tools/build_anim.py`, no model)
- `s5_coin_gold` cut from the still; `s5_coin_silver` / `s5_coin_copper` by luminance-mapping the
  gold coin's shading onto 5-stop ramps.
- `s4_bang` keyed from the still (bright pixels); `s4_bang_blank` fills the "!!" rect from measured
  panel geometry (INFRA panel bevel ends x=531, interior strip y 261–279).
- `s3_product_blank`, `s5_coin_blank_*`: the stills with the moving part removed.

All PNGs are losslessly recompressed with `tools/optimize_png.py` (oxipng).

## Intro stills (v2, branch `sci-adventure`)

Prompts and the single-change edit rules: `briefs/intro-shots-brief.md` (for a person) and
`briefs/intro-shots-agent-brief.md` (the same task as step-by-step instructions for a Claude session driving the generator). Nine images, generated in Firefly/Gemini
to match the narrator portraits, exported 640×400 into `scratch/intro_gen/`, built by `tools/build_intro.py`.

All nine: **Gemini API, model `gemini-3.1-flash-image`**, 3:2, 1K, 2026-11-11, generated on Rick's personal account by a
Claude session following `briefs/intro-shots-agent-brief.md`. Prompts exactly as in the brief (preamble on A/B/C and their
edits; the negative list appended as "Avoid: …"). Plates A–C also carried a narrator portrait as a style reference
(`portrait_christine.png` on odd tries, `portrait_graham.png` on even) with: "Match the art style of the attached reference
image exactly (pixel size, dithering, outline weight, palette); do not copy its subject." Each edit attached only its plate.
Raw downloads (1264×848) and every rejected try are kept in `scratch/intro_gen/raw/` on Rick's machine.

| File | What | Tries → kept | Notes |
|---|---|---|---|
| `A_room_dark` | plate: dark bedroom, nightstand, lamp, sleeper | 2 → #1 | |
| `B_nightstand` | plate: pager close-up, **blank** green LCD | 5 → #3 | Tries 3–5 added a framing sentence (straight-on, pager about half the frame wide, right third empty). LCD is 35% of the width, not 40%. Buttons differ from the prompt. |
| `B_arm` | edit of B: arm reaching for the pager | 2 → #1 | #2 rejected: fingers covered the LCD |
| `B_lamp` | edit of B: hand on the lamp chain, pager gone | 2 → #2 | **Cut 2026-11-11** — no longer built or shown. |
| `C_face_asleep` | plate: sleeping face, drool | 2 → #2 | |
| `C_eye_crack` | edit of C: one eye cracked open | 2 → #1 | |
| `C_awake` | edit of C: eyes half open | 2 → #1 | |
| `C_misery` | edit of C_awake: brows and mouth | 3 → #2 | #1 rejected: the eyes moved |
| `D_bedroom_vga` | plate: VGA bedroom, empty wall, no person | 2 → #2 | no preamble, no style reference. Blanket runs off the bottom-left corner. |

Plates approved by Rick 2026-11-11; the five edits are awaiting his review.

`C_awake_lit` and `B_lamp_lit` are derived by the build (palette lifts), not generated. The LCD text is drawn by the game. The wall title
is the app's Observability Quest wordmark, cut from `assets/title_screen.png` by the build (`wall_logo.png`).

### Bedroom round 2 (2026-11-11)

Gemini API `gemini-3.1-flash-image`, 3:2, 1K, on Rick's personal account, following `briefs/intro-bedroom-round2-agent-brief.md`
plus Rick's direction in the session. Every frame is an edit of the one before it; exact text in `scratch/intro_gen/gen.py`
(`FULL` entries `D_bedroom_vga`, `D_bedroom_r3`, `D_laptop_gone`, `D_door_open`). Earlier versions are in `scratch/intro_gen/raw/tries/`.

| File | Built on | Tries → kept | Notes |
|---|---|---|---|
| `D_bedroom_vga` (final) | round-2 furnished room, itself an edit of the round-1 plate | 5 → `D_bedroom_r3_t3` | Wall shelf and two pictures on the left side wall; dresser one drawer taller, top drawer open with clothes spilling out, an open laptop on top; rug and plant. Title area is now 188×89. Pictures sit just below the shelf. |
| `D_laptop_gone` | final `D_bedroom_vga` | 3 → t1 | Only the laptop removed (a faint mark remains on the wall above the dresser). |
| `D_door_open` | `D_laptop_gone` | 3 → t9 | Door swung into the room, dark hallway. The leaf reaches the floor at y 171. |

Not yet signed off by Rick. The clothes on the floor, the Honeycomb mark on the hoodie, and any carried item other than
a laptop are drawn by the game.

### Round 3 (2026-11-11)

Gemini API `gemini-3.1-flash-image`, 3:2, 1K, on Rick's personal account, following `briefs/intro-round3-agent-brief.md`.
Exact text in `scratch/intro_gen/gen.py` (`FULL['A_room_dark']`, `FULL['B_arm']`, `P['B_nightstand']` and its `EXTRA`).
Earlier versions are in `scratch/intro_gen/raw/tries/` (`*_round1`).

| File | Built on | Tries → kept | Notes |
|---|---|---|---|
| `A_room_dark` | `D_bedroom_vga` | 3 → t3 | The bedroom with the light off; lines up with the lit room at zero offset. Prompt plus one sentence keeping the wall plain. |
| `B_nightstand` | — (plate) | 5 → t7, Rick's pick | Smaller pager, lamp at the right. LCD is about 67×23 clean green (brief asked 80×24); the nightstand looks lamp-lit; cyan/purple rim on the pager. Tries 9–10 added a size sentence. |
| `B_arm` | new `B_nightstand` | 3 → t4 | Arm from the left, hand cupping the pager's left end; LCD untouched. |

`B_lamp` is retired (not generated again, not built).

## Chapter 1 room: the exec floor (2026-11-12)

Gemini API `gemini-3.1-flash-image`, 3:2, 1K, on Rick's personal account, following `scratch/room-ch1-round2-agent-brief.md`
(round 2; round 1's room is retired). Exact text in `scratch/room_gen/gen_room.py` and `gen_r2.py`; every try in
`scratch/room_gen/raw/tries/`. Built into `assets/rooms/` by `tools/build_rooms.py`.

| File | Built on | Tries → kept | Notes |
|---|---|---|---|
| `R1_exec_floor` | — (plate; the bedroom as style reference) | 5 → t4 | **Rick's Photoshop composite**: the try 4 room with the try 5 cubicle (`scratch/room_gen/psd/`). A little fringe on the cables and in tight corners; the shadow edge lacks the checker dither. Accepted as is. |
| `R1_cto_talk_1`, `R1_cto_talk_2` | the composite plate | 2 each → t1 | Only the CTO's figure differs; the game swaps one 63×40 patch. The CTO is a fictional person. |
| `R1_pc_closeup` | — (plate as style reference) | 2 → t1 | Blank screen; the game draws on it. |
| `R1_monitor_closeup` | — (plate as style reference) | 3 → t3 | All panels blank; the game draws the vitals. |

## Scenario 1's Honeycomb screens (2026-11-12): drawn in code, no model

`assets/screens/ch1_hc_0.png` (Canvas: the automatic investigation), `ch1_hc_1.png` (Agent Timeline) and `ch1_hc_2.png`
(one LLM call opened) are pixel art drawn by `tools/build_hc_screens.py` with the game's own 5x7 font. They are modelled on
Honeycomb's own demo video, "Debugging agentic workflows" (Ken Rimple, Innovation Week 2026), which Rick supplied: the
layouts, the lane structure and the demo's numbers (11.2 minutes, 19 LLM calls, 97 tool calls, 411,448 tokens, 57,293 input
tokens, 97 orders, 145 KB). They are not screenshots, the video is not in the repo, and no Honeycomb logo is drawn.
