# Hand-back: brief 05, the hero painted (test), 2026-11-14

For **Cloud Claude**, from Art Claude. Branch `art/hero-painted-test` from `origin/era-look`. Model `gemini-3.1-flash-image`, 9:16, edits only.

## What is here

| File | Size | Figure | Pose |
|---|---|---|---|
| `H_front.png` | 112×288 | 94×272, centred | front, standing, arms relaxed |
| `H_side.png` | 112×288 | 70×272, centred | side facing right, standing |
| `H_walk_contact.png` | **148×288** | 148×272 | side, long stride: front heel down, back leg trailing, arms swung opposite |
| `H_walk_pass.png` | 112×288 | 81×272, centred | side, passing: one leg straight with the foot flat, the other bent with its foot lifted beside it |

- Every figure is 272 px tall, its feet on the bottom row, and the background is flat yellow `#FAD73C`, used nowhere on the figure.
- Edges are hard. The figure was downscaled with LANCZOS from about 1250 px, and the background then keyed out at alpha ≥ 128.
- Yellow fringe pixels from the background are removed, and the soles' cream tint is pulled to neutral grey.
- **The long-stride frame is 148 wide, not 112.** The stride is wider than the canvas, so it fills its own width; that is 74 px at game size. Line the frames up by the feet's centre, or pad it to the walk's widest frame.
- **The frames are all scaled to the same 272 px.** In the stride the head would really sit a few pixels lower than standing. Move it down 2–4 px at game size if the bob reads as missing.

## Colour families

The parts are painted in these families: hoodie green, jeans blue, skin orange-tan, hair and beard magenta, shoes neutral grey with a pale sole, outline a dark neutral.

Sorting by hue (green 70–170°, blue 170–255°, magenta 255–345°, everything warmer is skin, saturation under 0.18 or lightness under 0.12 is neutral) splits the front figure cleanly, by eye. A quick recolour that keeps each pixel's lightness and swaps the hue (navy hoodie, denim, light skin, brown hair) kept the shading, and Rick saw it in room 2 beside the cloud engineer. The script is `scratch/hero05/repaint.py`, on the laptop, not committed.

- **The drawstrings and the pocket seam are dark green.** They are part of the hoodie family.
- **The outline is dark neutral.** It is not inside any part's family, so leave it alone.
- **Check:** the darkest jeans tone and the darkest hoodie tone are close to the outline. A hue-only split can call a few of those pixels neutral. If a recolour leaves dark specks, widen the hoodie and jeans families down to lightness 0.08.

## How they were made

1. **Front.** An edit of the approved profile hero from `art-drops/2026-11-13-era-look-test/R2_era_test.png`: x 280–414, y 98–370 of the 640×400 file, upscaled ×4 NEAREST. The cloud engineer cropped from `R2_war_room.png` (x 500–620, y 105–345, ×4) was attached second, for the level of detail.
2. **Side and walk frames.** Edits of the chosen front figure, with the profile hero attached second for his side-on shape.
3. **Passing frame, second round.** All three tries of the first passing prompt drew a shorter stride, not the legs-together moment. A second prompt, with the chosen side figure attached, got it.

## Tries

Picks: front t1, side t1, long stride t1, passing (second round) t1. 3 + 3 + 3 + 3 + 2 = 14 images.

| Figure | Tries | Pick | Why |
|---|---|---|---|
| front | 3 | t1 | Most fold shading, softest outline, face closest to the engineer's. **Rick: "1 it is."** |
| side | 3 | t1 | Same build and hood as the front; t2 and t3 are slimmer. |
| long stride | 3 | t1 | The same head as the side figure; the clearest heel strike. |
| passing | 3 + 2 | second round, t1 | The legs overlap and one foot is lifted beside the other ankle. That is 5 tries for this figure, the cap. |

## Rick's reaction

- **Front tries in room 2 beside the engineer** (painted, and recoloured to a default look): "1 it is."
- **The side and walk frames** are delivered for his review in the game. He has not reacted to them yet.

## Prompts, exactly

### Front
```
The first image is a pixel-art character from a 1990s point-and-click adventure game, seen in profile. Draw the same man, in the same drawing style, facing the viewer: standing straight, full length from the top of his head to his shoes, arms relaxed at his sides, hands empty. Keep his build, realistic adult proportions (the head about one seventh of his height), his short hair and short beard, his amount of shading, and his soft dark outline. Match the second image's character for the level of detail: a few tones on each garment, a face with simple features, not a cartoon. Recolour him into flat colour families, one per part and nowhere else: the hoodie bright green (hood down, a few green tones from light to shadow), the jeans bright blue, the skin orange-tan, the hair and beard magenta, the sneakers neutral grey with a pale sole. Nothing on the hoodie's chest: plain fabric, no logo, no print. No glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure is centred and fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached, in order: ref_hero.png, ref_eng.png

### Side
```
The first image is a pixel-art character from a 1990s point-and-click adventure game, painted in flat colour families: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, on a flat yellow background. The second image is the same man in profile in the original game's colours, for his build and side-on shape. Draw the first image's man again: the same person, the same drawing style, the same shading, the same soft dark outline, the same height and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Now show him in full profile facing right, full length, standing straight, arms relaxed at his sides. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached, in order: front_t1.png, ref_hero.png

### Long stride (contact)
```
The first image is a pixel-art character from a 1990s point-and-click adventure game, painted in flat colour families: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, on a flat yellow background. The second image is the same man in profile in the original game's colours, for his build and side-on shape. Draw the first image's man again: the same person, the same drawing style, the same shading, the same soft dark outline, the same height and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Now show him in full profile facing right, full length, walking to the right, at the moment of the long stride: his front (right-hand) leg reaching forward with the heel just touching the ground and the toe raised, his back leg trailing behind with only the toe on the ground, his arms swung opposite to the legs. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached, in order: front_t1.png, ref_hero.png

### Passing, first round (3 tries, none used)
```
The first image is a pixel-art character from a 1990s point-and-click adventure game, painted in flat colour families: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, on a flat yellow background. The second image is the same man in profile in the original game's colours, for his build and side-on shape. Draw the first image's man again: the same person, the same drawing style, the same shading, the same soft dark outline, the same height and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Now show him in full profile facing right, full length, walking to the right, at the passing moment of the stride: the supporting leg straight under him with its foot flat on the ground, the other leg bent with its foot lifted a little off the ground beside the supporting ankle, the arms close to his sides, mid-swing. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached, in order: front_t1.png, ref_hero.png

### Passing, second round (used)
```
The first image is a pixel-art character from a 1990s point-and-click adventure game, painted in flat colour families: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, on a flat yellow background. The second image is the same man in profile in the original game's colours, for his build and side-on shape. Draw the first image's man again: the same person, the same drawing style, the same shading, the same soft dark outline, the same height and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Now show him in full profile facing right, full length, walking to the right, caught at the passing position of a walk cycle, where the legs are almost together and NOT spread apart: one leg straight and vertical under his hips with its foot flat on the ground; the other leg bent at the knee, its knee just in front of the straight leg's knee, its foot lifted a hand's height off the ground, directly beside the straight leg's ankle, toe pointing down. Seen from the side, the two legs overlap and form a narrow shape, with no gap between the feet front to back. His arms hang close to his sides, nearly straight down. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached, in order: side_t1.png, ref_hero.png
