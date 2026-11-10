# Asset Prompts — Observability Quest Mobile

Provenance for every generated image. The master copy with the original Firefly prompts lives in
Rick's working folder (`ASSET_PROMPTS.md` there); this file records what the repo's build consumes.

## Stills (`assets/*.png`, 640×428)

Generated in Adobe Firefly with **Gemini 3.1 (Nano Banana 2)**, 3:2, 1K; exported at 640×428
nearest-neighbour. Common preamble: *"Sierra On-Line EGA pixel art adventure game scene, 320x200,
1989 era."* Honeycomb palette named by hex in each prompt. `s2_microservices.png` had its
"Paymeits" label fixed with a Gemini region edit (2026-11-09). `portrait_jessitron.png` is Jess's pick,
variant 2 of 4 (2026-11-10).

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
Jessitron has no frames yet (static until her variant is picked).

### Derived in code (`tools/build_anim.py`, no model)
- `s5_coin_gold` cut from the still; `s5_coin_silver` / `s5_coin_copper` by luminance-mapping the
  gold coin's shading onto 5-stop ramps.
- `s4_bang` keyed from the still (bright pixels); `s4_bang_blank` fills the "!!" rect from measured
  panel geometry (INFRA panel bevel ends x=531, interior strip y 261–279).
- `s3_product_blank`, `s5_coin_blank_*`: the stills with the moving part removed.

All PNGs are losslessly recompressed with `tools/optimize_png.py` (oxipng).
