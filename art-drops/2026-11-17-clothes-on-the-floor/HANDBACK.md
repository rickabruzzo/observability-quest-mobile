# Hand-back: brief 08, yesterday's clothes on the floor (2026-11-17)

For **Cloud Claude**, from Art Claude. Branch `art/clothes-on-the-floor` from `origin/era-look`.

## The file

`B_clothes.png` replaces brief 06's folded heap.

- **What it shows:**
  - the green hoodie dropped front up, one sleeve flung out, the hood flopped over;
  - the blue jeans crumpled flat with the legs askew, partly under the hoodie's hem;
  - the two grey sneakers kicked off a little apart at the right, one on its side.
- **Background:** flat yellow `#FAD73C` everywhere, between the garments too. Hard edges.
- **Colour families:** hoodie greens, jeans blues, sneakers neutral greys.

## Rick's reaction

"2 is fine" (2026-11-17, 09:42), on seeing the pick at real size and at half size.

## Facts

- **Size: 200×75.** That is a little taller than the brief's 200×64, because the flung sleeve and the shoes
  spread the picture. The game shows it at half size, 100×38.
- **The mark's point on the hoodie's chest: (60, 27)**, at 200×75.
  - The flat chest area runs about x 48–75, y 22–32, between the drawstrings and the pocket.
  - The hoodie lies tilted about 15° up to the right, so a small tilt on the mark would sit naturally. Flat
    will do at this size.

## Hand edits

- **The soles came out cream**, which against the yellow background would show as holes. 433 pixels with a
  yellow or cream tint (hue 25–75°, saturation above 0.12) were turned to neutral grey of the same lightness, so
  the soles are light grey.
- **Background fringe pixels were removed.** The picture was keyed off the background, downscaled with LANCZOS
  to 200 wide, and the alpha thresholded at 128.

## Tries

| Try | Note |
|---|---|
| t1 | The hoodie and jeans were laid end to end like a body's outline; it reads as a flat-lay. |
| **t2** | **The pick.** The most askew; the shoes kicked apart, one tipped. |
| t3 | Body-shaped like t1. |

## Prompt, exactly

Model `gemini-3.1-flash-image`, aspect 21:9. The one attachment is `H_front.png` from
`art-drops/2026-11-14-hero-painted-test/`, enlarged ×4 NEAREST.

```
The image is a pixel-art game character painted in flat colour families: a green hoodie, blue jeans, grey sneakers, with a soft dark outline. In exactly that drawing style, shading and colour families, draw only his clothes from yesterday lying on the floor where he dropped them at bedtime, seen from the front and a little above, with no person: the blue jeans dropped flat and crumpled with the legs askew; beside them and partly over one leg, the green hoodie tossed down front side up, one sleeve flung out, the hood flopped to one side; the two grey sneakers kicked off separately, a little apart, one tipped on its side. Nothing is folded, stacked or tidy. The clothes are spread wide and low across the picture, the same size they are on him. The hoodie only in tones of green, the jeans only in tones of blue, the sneakers only in neutral greys with light grey soles. Nothing printed on the hoodie, no logo. Background: one flat solid pure yellow colour everywhere, with no floor, no rug, no shadow and no other object; yellow shows between the garments. No text, no letters, no numbers, no logos.
```
