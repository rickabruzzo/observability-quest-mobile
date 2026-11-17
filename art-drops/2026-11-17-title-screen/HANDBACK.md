# Hand-back: brief 07, the title screen (2026-11-17)

For **Cloud Claude**, from Art Claude. Branch `art/title-screen` from `origin/era-look`; the PR goes into
`era-look`.

## Rick's choice

**Picture A, "Before the page".** Rick: "A fits better, the castle is way out of place in terms of genre and
feel." B (the data-centre castle) is dropped, and there is no `T_title_other.png`.

Rick also said: **"Subhead needs to be larger if its gonna be legible on mobile."** The subtitle is game type,
not paint, so that one is yours; see "For the code" below.

## Files

| File | What |
|---|---|
| `T_title.png` | 640×400. The plate: the night sky over the game's city from an open window, the intro's orange nightstand at lower right with the dark green pager on it, screen **unlit**, lamp off. No lettering. |
| `T_title_light.png` | The plate with the pager **gone off**: screen in the intro's lit green `#06F805` (the colour of `B_nightstand.png`'s LCD), still blank, and a stepped, dithered green glow on the nightstand and the pager's casing. **Drawn in code, not generated** (see below). |
| `T_title_stars.png` | The plate with 12 stars spread over the sky one step brighter, the brightest few with a faint 1-px cross. Nothing else changes. Code. |
| `T_glint_1.png` … `T_glint_4.png` | The glint: a four-frame sparkle, 22×22, transparent, white with a little blue, small → medium → large → small. Hand-pixelled in code. Rick hasn't asked for the glint; use it if he wants it. |

## Why the lit pager is code, not an edit

- **What went wrong:** three Gemini edits lit the screen well, but each painted the glow as a smooth airbrushed
  blur that doesn't belong in this hand. It also reached past any paste box, leaving a hard rectangle at its top.
- **What it is instead:** the screen fill is flat, like the intro's. The glow is three stepped bands, about
  40 %, 26 % and 12 % green over the existing colours, with 4×4 ordered dither at the band edges. It touches only
  the nightstand and the pager, never the window's sky or the city.
- **Option for the code:** you could draw the same glow in the game. It's an ellipse centred on the screen,
  radii 104 × 52 at 640×400.

## Crop note

These plates are 16:9 (1376×768), wider than 16:10. So the crop is the **centre width**, 1229×768, then NEAREST
to 640×400. The usual crop (centre height, `w/1.6`) would have run off the top and bottom and added black bars.

## Facts the code depends on, at 320×200

- **The truly quiet rectangle:** **x 20 to 270, y 5 to 78**.
  - **What's in it:** stars only, plus one faint band of cloud at about y 52–65, x 150–280.
  - **Why it's smaller than the brief's x 20 to 300, y 10 to 105:**
    - On the right, **the window's frame**, a dark vertical bar, runs top to bottom at about x 275–287. Above
      the city it is dark grey on dark blue, so the wordmark can cross it, but it is the one hard edge in the
      sky.
    - Below, the city's tops start at y 81 (a spire at x 36). The towers start at about y 97, and in the middle
      of the picture at y 102–120.
- **Darkness to the right:** past the frame, x 288–320, it is the dark room, almost black, down to the
  nightstand.
- **The bottom 32 rows** (y 184–200 at 320):
  - **Left (x 0–195):** dark: a dark-blue fold of bedding at the very bottom, and the black room.
  - **Right (x 197–320):** the nightstand's orange drawer front.
  - **Small print** therefore belongs at **x 8 to 190**, bottom-left aligned, or over the drawer in a dark
    outline. It is not dark across the whole width as the brief hoped.
- **`T_title_light`:**
  - **Pager screen:** x 245–286, y 128–145 (at 640: x 490–571, y 257–290).
  - **Glow:** reaches x 214–317, y 114–162 (640: 427–634, 229–325).
  - **Everything else is identical to the plate.**
- **`T_title_stars`:**
  - **Where:** the changed pixels lie within x 15–265, y 4–76; at 640 they are x 31–529, y 8–151, 12 stars in
    50-odd pixels.
  - **Star centres at 640:** (443,9), (264,12), (32,17), (528,21), (410,70), (318,114), (108,114), (47,138), (413,150), (208,133), (60,33), (483,66).
  - **How to use it:** flip between the plate and this one to twinkle, or fade one star at a time.

## For the code (Rick's request, not art)

- **Rick: make the subtitle larger for phones.**
  - I mocked it at about three times the size it is now: about 15 px tall at 320×200.
  - It sits centred under the wordmark at y 78–93 and still clears the city.
  - That assumes a wordmark 480 px wide at 640, its top at y 18. The wordmark then fills y 9 to about 68 at
    320×200.
  - A 5×7 bitmap font at scale 2 (14 px) fits the same place.
- **Pager screen lit:** the game could draw the pager's message on `T_title_light`'s screen the way the intro
  does (`drawLcd`, colour `#0F200F`). The brief keeps it blank, so that's Rick's call.

## Tries

| Picture | Tries | Pick |
|---|---|---|
| A | 3 | **t3.** t1 painted the screen already lit, which spends the joke. t2 had a lit white lampshade in the top-right of the wordmark's space. t3 has the lamp off and the most sky. One flaw: a dark-blue fold of bedding in the bottom-left corner, which stays dark. |
| B | 3 + 2 | Rejected by Rick. In the first round the building sat up behind the letters and read as an office block. The second round read castle first but still crossed the wordmark. |
| pager lit (edit) | 3 | None used; replaced by code (above). |

## Prompts, exactly

The 16:9 generator aspect applies throughout.

### A (used: t3)
```
The attached pictures are scenes from the same game: paint in exactly their hand, palette and amount of detail. The first shows the game's night city through office windows; the second shows the orange wooden nightstand and the dark green pager that must appear in this painting; the third shows the game's colours. Do not copy their framing. A title painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette and visible pixels. Night, seen from an open bedroom window, looking out. A vast deep blue-black sky full of small stars fills the upper two thirds, with one faint band of cloud, and nothing bright in it. Along the lower third, far away, a modern city skyline of dark glass office towers with a few small amber-lit windows. In the lower right corner, close to the viewer and large, the corner of the orange wooden nightstand seen from above and to the side; on it lies the dark green 1990s pager with a blank, unlit, dark screen. A sliver of a lamp's base may show at the right edge. Nothing else in the foreground. The bottom edge of the picture is dark. No person. Calm, still, a little ominous, a little funny. No text, no letters, no numbers, no logos.
```
Attached, in order: `art-drops/2026-11-13-era-look-rooms/R1_exec_floor.png`, `assets/intro/B_nightstand.png`,
`assets/intro/D_bedroom_vga.png`.

### B, first round (rejected)
```
The attached pictures are scenes from the same game: paint in exactly their hand, palette and amount of detail. The first shows the game's night city; the second shows the game's colours. Do not copy their framing. A title painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette and visible pixels, in the manner of a storybook landscape. Night. A deep blue-violet sky with small stars fills the upper half, calm and dark, with the faint glow of a far city along the horizon. In the distance on a hill, a large modern data centre building standing like a fairy-tale castle: a huge windowless block with cooling towers and antenna masts like turrets, rows of tiny green and amber status lights for windows, and a dark storm cloud sitting low over it. A winding road lined with small orange street lamps leads toward it from the foreground. At the lower left, small, seen from behind, a lone figure in a plain dark hoodie with the hood down and a backpack stands at the start of the road, hands at the sides. No face visible, nothing printed on the hoodie. The bottom edge of the picture is dark ground. Earnest and grand, with the joke that the castle is a data centre. No text, no letters, no numbers, no logos.
```
Attached: `R1_exec_floor.png`, `assets/intro/D_bedroom_vga.png`.

### B, second round (rejected)
```
The attached pictures are scenes from the same game: paint in exactly their hand, palette and amount of detail. The first shows the game's night city; the second shows the game's colours. Do not copy their framing. A title painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette and visible pixels, in the manner of a storybook landscape. Night. A deep blue-violet sky with small stars fills the upper half, calm and dark, with the faint glow of a far city along the horizon. Everything in the landscape sits in the lower half of the picture: the upper half is only sky. In the middle distance, on a hill whose top is just below the middle of the picture, a large modern data centre building standing exactly like a fairy-tale castle on its rock, with a castle's silhouette: tall square towers at its corners and a taller keep in the middle, but built of blank grey concrete panels, a huge windowless block with cooling towers and antenna masts like turrets, rows of tiny green and amber status lights for windows, and a dark storm cloud sitting low over it, the top of the cloud no higher than the middle of the picture. A winding road lined with small orange street lamps leads toward it from the foreground. At the lower left, small, seen from behind, a lone figure in a plain dark hoodie with the hood down and a backpack stands at the start of the road, hands at the sides. No face visible, nothing printed on the hoodie. The bottom edge of the picture is dark ground. Earnest and grand, with the joke that the castle is a data centre. No text, no letters, no numbers, no logos.
```

### Pager lit, edit of A t3 (not used)
```
Edit this picture. Change only one thing: the small dark green pager lying on the orange nightstand has just gone off. Its screen is now lit a bright glowing green, still completely blank, with no text, digits or symbols on it, and a soft green glow from the screen falls on the top of the nightstand right around the pager and on the pager's own casing. Keep everything else exactly the same, pixel for pixel: the sky, the stars, the city, the window, the lamp (still switched off), the nightstand and the framing. No text, no letters, no numbers, no logos.
```

No game screenshot and no other game's art went to the generator. There is no lettering, no logo, no hexagons and
no person in the picture.
