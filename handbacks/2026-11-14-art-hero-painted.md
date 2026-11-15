# Hand-back: Art Claude, end of 2026-11-14

For **Cloud Claude**, from Art Claude (Rick's personal account). This covers briefs 04 and 05 and one open
question Rick raised for the next brief.

## Open PRs (Rick merges)

| PR | Base | What |
|---|---|---|
| #23 | `era-look` | Brief 04: R2 plates, S3 products, S4 battle sprites, `R4_phone_closeup`, four brand marks. Rick approved groups 1–4. He saw the marks with the drop but has not said yes or no to them. |
| #24 | `era-look` | Brief 05: the hero painted, four figures. **Rick approved all four: "better. approved."** |
| #15 | `sci-adventure` | The hand-back from the end of 2026-11-13. |

The details are in each drop's `HANDBACK.md`:
- brief 04: `art-drops/2026-11-14-feedback-1114/`
- brief 05: `art-drops/2026-11-14-hero-painted-test/`

## Brief 05 in brief

- **Files:**
  - `H_front.png`, `H_side.png`, `H_walk_pass.png` are 112×288.
  - `H_walk_contact.png` is **148×288**, because the stride is wider than 112.
  - In every file the figure is 272 px tall, its feet on the bottom row, on flat yellow `#FAD73C`.
- **Colour families:**
  - Hoodie green, jeans blue, skin orange-tan, hair and beard magenta, shoes neutral grey, outline dark neutral.
  - Sorting pixels by hue (thresholds in the drop's hand-back) splits the parts cleanly.
- **The recolour works.** A recolour that keeps each pixel's lightness (navy hoodie, denim, light skin, brown hair) kept the shading. Rick saw it beside the cloud engineer in room 2 and picked front try 1 from it.
- **Next for you, per the brief:**
  1. Build the four figures to game size (136 px tall, on a 56×144 canvas; the stride frame is 74 wide).
  2. Repaint them as three of the creator's looks.
  3. Stand them in room 2 beside the engineer, and show Rick.

## Open question for the next brief: shapes, not colours

Rick asked whether Art Claude would paint every part for every combination. What I told him:

- **Colours cost nothing.** The game recolours the same pixels, so one painted set covers every colour choice in any
  combination.
- **Shapes cost a painting each, for every frame.** These are hair styles, beard on or off, glasses, and body
  types. If they were painted as whole figures, the count multiplies: 3 hair × 2 beard × 2 glasses × 2 builds =
  24 versions of every frame, which is hundreds of images. Keeping them all looking like the same man would be
  the hard part.
- **My recommendation: a separate head layer, and a short list.** Paint one body set: the 8-frame walk, the
  front frames, sitting up in bed, and the pyjamas. Paint the head separately; only the head changes with hair,
  beard and glasses. The head is small and barely moves in a walk, so each head option is a handful of
  paintings. A suggested list:
  - about 3 hair styles;
  - beard on or off;
  - glasses on or off;
  - one build.

  That comes to about a dozen head paintings plus one body set. A second build would need its own body set.
- **The other option:** offer only 4–6 complete heroes, each painted once, with colours still free on all of
  them.

**Rick chose option 1, the separate head layer** (2026-11-14, 23:02). Write the full-set brief that way. Put the
short list above in it for Rick to cut or add to; he has not confirmed the exact list. The code needs to draw the head and
body as two layers, with an anchor point per frame; Art Claude can give the neck point for each frame.

## Other notes

- **The intro cut scenes are the style reference and stay untouched.** The hero getting out of bed must be
  repainted to match the new hero model; that is in the full set.
- **Art Claude's working files** are in `scratch/hero05/` on the laptop (prompts, tries, the key-out and recolour
  scripts). They are not committed.
