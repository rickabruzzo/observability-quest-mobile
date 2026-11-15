# Hand-back: brief 06, the painted hero, full set (2026-11-15)

For **Cloud Claude**, from Art Claude. Branch `art/hero-painted-set` from `origin/era-look`. Model
`gemini-3.1-flash-image`; every picture is an edit.

**Rick approved the clean-shaven face** ("concur", on front try 1 and side try 1). At 23:24 he went to bed with
"build it all out and go with your recs. I will check in the morning". **Every other pick below is mine, and
none has his approval yet.**

## Files

All are on flat yellow `#FAD73C`, with hard edges and each part in its own colour family, as in brief 05.

**Heads.** Each head is a whole figure, 112×288, in exactly the frame of the approved `H_front` or `H_side`. Only
the head differs; every pixel below the changed rows is the approved figure's.

| Style | Front | Side |
|---|---|---|
| clean-shaven face (the base) | `HD_clean_front.png` | `HD_clean_side.png` |
| standard short hair, no beard | `HD_standard_front.png` | `HD_standard_side.png` |
| long | `HD_long_front.png` | `HD_long_side.png` |
| afro | `HD_fro_front.png` | `HD_fro_side.png` |
| mohawk | `HD_mohawk_front.png` | `HD_mohawk_side.png` |
| glasses (on standard hair) | `HD_glasses_front.png` | `HD_glasses_side.png` |

- **`HD_standard_*` is the same picture as `HD_clean_*`.** The brief defines standard as the clean face with
  the approved short hair, which is what the clean face already has. The copy is there so every style has a file.
- **The bearded standard look is the approved `H_front` and `H_side`.** The beard layer is the difference between
  them and the clean face.

**Body.**

| File | Size | What |
|---|---|---|
| `B_walk_down.png` | **148×288** | side, after the long stride, weight onto the front foot |
| `B_walk_up.png` | 112×288 | side, after passing: up on the back foot, the front leg swinging forward in the air |
| `B_pj_front.png` | 112×288 | front, pyjamas: a top striped in two greens, blue trousers, bare feet |
| `B_pj_sit.png` | 112×288 | front, sitting up in bed, cut straight below the waist (rows 16–177; the rest is yellow). The head and shoulders are at the standing figure's size and place. |
| `B_clothes.png` | 70×46 | the hoodie folded on the jeans, sneakers beside them |

The walk is four pictures: `H_walk_contact` → `B_walk_down` → `H_walk_pass` → `B_walk_up`, repeated for the
other leg.

## Neck points

The middle of the neck where it meets the collar, as (x, y) in each figure's own canvas. For the 148-wide stride
frames, x counts from that canvas's left edge.

| Figure | Neck (x, y) |
|---|---|
| `H_front.png` | 56, 70 |
| `H_side.png` | 56, 72 |
| `H_walk_contact.png` | 74, 71 |
| `H_walk_pass.png` | 64, 72 |
| `B_walk_down.png` | 74, 71 |
| `B_walk_up.png` | 52, 72 |
| `B_pj_front.png` | 56, 76 |
| `B_pj_sit.png` | 55, 76 |

**`H_front` is set by hand to (56, 70).** Seen from the front, the neck is behind the beard; 70 is the row where
the collar starts. The rest were found from the colour families and checked by eye.

## The rows each head changes

The first and last rows changed against the approved figure (`H_front` / `H_side`), at 112×288. Everything below
the last row is the approved body.

| Head | File | First row | Last row |
|---|---|---|---|
| clean front | `HD_clean_front.png` | 22 | **71** |
| clean side | `HD_clean_side.png` | 16 | **70** |
| long front | `HD_long_front.png` | 16 | **105** |
| long side | `HD_long_side.png` | 16 | **128** |
| fro front | `HD_fro_front.png` | 1 | **71** |
| fro side | `HD_fro_side.png` | 5 | **74** |
| mohawk front | `HD_mohawk_front.png` | 8 | **71** |
| mohawk side | `HD_mohawk_side.png` | 15 | **70** |
| glasses front | `HD_glasses_front.png` | 22 | **71** |
| glasses side | `HD_glasses_side.png` | 16 | **70** |

- **Clean, standard, afro, mohawk and glasses** end at the collar (rows 70–74). They are the beard's area, or the
  hair above it.
- **Long hair reaches down the body: to row 105 front and 128 side.** It lies over the hoodie's shoulders and back
  as the brief asks. That is the one head the game must draw over the body.

## How they were made

**Heads:**
1. The edit is done on the full-resolution approved picture (brief 05's front t1 or side t1).
2. Only what changed is pasted back onto it: a mask of pixels that differ by more than 60 inside a box round the
   head, opened with MaxFilter(7) then MinFilter(3).
3. The result is brought down to 112×288 at the approved figure's exact scale and position.
4. The rows that differ from that are pasted onto the approved `H_*` file.

The styles were made from the chosen clean face, not from the bearded one.

**Bodies** are fresh edits of brief 05's walk and front figures, keyed and scaled to 272 tall like brief 05.

## Picks and tries

| Picture | Tries | Pick | Why |
|---|---|---|---|
| clean face, front | 3 | t1 | **Rick: "concur."** Same plain closed mouth as the approved face. |
| clean face, side | 3 | t1 | **Rick: "concur."** The same jaw and nose line; t2 and t3 pushed the chin forward. |
| long, front | 3 | t2 | Cleanest fall over the shoulders. |
| long, side | 3 | t3 | Keeps the hood visible under the hair, so the body layer stays true. t1 was cut straight by the paste box. |
| afro, front | 3 | t1 | Round and even, and matches the side's size. |
| afro, side | 3 | t1 | Same size and texture as the front. |
| mohawk, front | 3 | t1 | The buzzed sides are a pale pink. Most of it sorts as skin (a shaved scalp), so it follows the player's skin colour. In t2 and t3 they are grey, which would stay grey for every player. |
| mohawk, side | 3 | t1 | Same reason. |
| glasses, front | 3 | t1 | Darkest, cleanest frame, the eyes clear. |
| glasses, side | 3 | t1 | Same. |
| walk down | 3 + 2 | second round, t2 | **Weakest picture in the set; see below.** |
| walk up | 3 | t3 | Clearly up on the back toes, front leg in the air. t1 repeated the long stride. |
| pyjamas, standing | 3 | t2 | Stripes in both a lighter and a darker green, as asked. t3 made the trousers pale with a drawstring. |
| pyjamas, sitting | 3 | t1 | No blanket line; t2 and t3 drew one. |
| clothes heap | 3 | t3 | Clearest fold, sneakers beside the heap. |

That is 47 images in all.

## Known weak spots, for Rick and for the build

1. **`B_walk_down` is close to `H_walk_contact`.** Gemini kept redrawing the long stride. Five tries is the cap;
   the pick has a slightly shorter stride and a flatter front foot. Two ways out:
   - Cloud Claude drops the whole body (head included) 2–3 px in that frame, so the step still dips.
   - A hand edit of the legs later.
2. **The walk does not bob.** Like brief 05, every walk frame is scaled to 272 px tall, so the head height is
   the same in all four. If the step looks flat, lower down and contact 2–3 px and raise up 1–2 px at game size.
3. **Colour families to watch when sorting:**
   - **The mohawk's buzzed sides sort mostly as skin, not hair.** With the brief 05 hue split, about 60 % of the
     changed pixels are skin and 40 % hair, on the front and back heads alike. They read as a shaved scalp in the
     player's skin colour, with hair-coloured stubble at the strip's edge. If Rick wants the sides in the hair
     colour, push those pixels into the hair family in the build. (Corrected 2026-11-15; the first version of this
     hand-back said they sort as hair.)
   - The glasses' frames are dark neutral. They become outline, which is right.
   - Long hair over the hoodie leaves a few green and blue pixels in its changed area (rows of edge
     anti-aliasing): 124 green and 12 blue on the front. They belong to the body's colours and should sort that
     way.
4. **`B_pj_sit` is cut off at the waist with no blanket.** The scene's bed blanket must cover the bottom edge,
   row 177.

## Prompts, exactly

### Clean-shaven face (front and side, same words)
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only one thing: remove his beard and moustache completely, so he is clean-shaven. Where the beard was, paint his skin, in the same orange-tan colour family and with the same shading style as the rest of his face, with a natural jaw and chin and a simple mouth. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same eyes, nose, ears, eyebrows and short magenta hair, the same neck, hoodie, jeans, shoes, outline and yellow background, pixel for pixel. No text, no letters, no logos.
```
Attached: `hero05/tries/front_t1.png` · aspect 9:16

### Long hair (front and side, same words; attached the chosen clean face)
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only his hair: long straight hair that falls past his shoulders; from the front it falls behind his shoulders with a few strands lying over the front of each shoulder; from the side it hangs down his back to below the shoulder blades. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same face, eyes, nose, mouth, ears and neck, clean-shaven, the same hoodie, jeans, shoes and flat yellow background, pixel for pixel. No text, no letters, no logos.
```
Attached: `hero06/clean_front_raw.png` · aspect 9:16

### Afro
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only his hair: a full, round afro of tight curls, standing out evenly around his whole head, about twice the size of his head's outline. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same face, eyes, nose, mouth, ears and neck, clean-shaven, the same hoodie, jeans, shoes and flat yellow background, pixel for pixel. No text, no letters, no logos.
```
Attached: `hero06/clean_front_raw.png` · aspect 9:16

### Mohawk
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only his hair: a mohawk: the sides of his head buzzed very short so the scalp shows through as a light shadow, and a short, textured strip of hair along the middle of the top of his head, from his forehead to the back, standing up a few centimetres. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same face, eyes, nose, mouth, ears and neck, clean-shaven, the same hoodie, jeans, shoes and flat yellow background, pixel for pixel. No text, no letters, no logos.
```
Attached: `hero06/clean_front_raw.png` · aspect 9:16

### Glasses
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only one thing: give him a pair of glasses, with thin frames in a dark neutral grey, almost black, and clear lenses so his eyes show through them clearly; the arms of the glasses run back to his ears. Use no other colour for the glasses. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same face, eyes, hair, ears and neck, clean-shaven, the same hoodie, jeans, shoes and flat yellow background, pixel for pixel. No text, no letters, no logos.
```
Attached: `hero06/clean_front_raw.png` · aspect 9:16

### Walk down, first round (3 tries, none used)
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues) and keeping his head, face, hair and beard exactly as they are. He is in full profile facing right, walking, at the moment just after the long stride lands: his weight has come onto the front (right-hand) leg, its foot now flat on the ground and its knee a little bent, so his whole body is at its lowest point of the step; the back leg is behind him with its heel lifted and only the toes about to leave the ground; the arms are swung opposite to the legs, a little less far than at the long stride. The second image shows his passing step, for reference only. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/walk_contact_t1.png`, `hero05/tries/walk_pass2_t1.png` · aspect 9:16

### Walk down, second round (used)
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues) and keeping his head, face, hair and beard exactly as they are. He is in full profile facing right, walking, in the 'down' position of a walk cycle, which comes just after the heel strike in the second image: the stride is now SHORTER than in the second image. His front (right-hand) foot is planted flat on the ground, sole fully down, a little in front of his hips, and that front knee is clearly bent to take his weight, so his hips and head sit lower than when he stands. His back leg is behind him, also bent at the knee, with its heel lifted well off the ground and only the toes touching. Both feet touch the ground. His arms swing opposite to his legs, a little. The first image is the same man at another moment of the walk, for his look. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/walk_pass2_t1.png`, `hero05/tries/walk_contact_t1.png` · aspect 9:16

### Walk up
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues) and keeping his head, face, hair and beard exactly as they are. He is in full profile facing right, walking, at the moment just after the legs pass each other: he is pushing up onto the ball of the back foot, heel raised high, the back leg straight, so his whole body is at its highest point of the step; the other leg swings forward with the knee bent and its foot in the air in front of him, not yet touching the ground; the arms are swinging, moderately. The second image shows his long stride, for reference only. Hands empty. Hood down, nothing on the hoodie's chest, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/walk_pass2_t1.png`, `hero05/tries/walk_contact_t1.png` · aspect 9:16

### Pyjamas, standing
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues) and keeping his head, face, hair and beard exactly as they are. He stands facing the viewer, arms relaxed at his sides, in pyjamas instead of his clothes: a long-sleeved pyjama top with a collar and buttons, painted only in the green colour family, with vertical stripes in a lighter green and a darker green; long loose pyjama trousers painted only in the blue colour family, with no stripes; bare feet, in the orange-tan skin colour family. No shoes, no hoodie, no jeans. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/front_t1.png` · aspect 9:16

### Pyjamas, sitting up in bed
```
The image is a pixel-art game character painted in flat colour families on a flat yellow background: a striped green pyjama top, blue pyjama trousers, orange-tan skin, magenta hair and beard, a soft dark outline. Draw the same man in the same drawing style, shading, outline and colour families (every pixel of a part is a tone of that part's one colour), at the same scale, keeping his head, face, hair and beard exactly as they are. He is sitting up in bed, facing the viewer, just woken: his upper body upright, wearing the same striped green pyjama top, his forearms resting forward on his lap, hands loose. Show him only from the top of his head down to just below his waist, where the bed's blanket would cover the rest; the picture ends there with a straight horizontal cut and nothing below it. No bed, no blanket, no pillow. Background: one flat solid pure yellow colour everywhere, with no other object. No text, no letters, no numbers, no logos.
```
Attached: `hero06/tries/pj_front_t2.png` · aspect 9:16

### Clothes heap
```
The image is a pixel-art game character painted in flat colour families: a green hoodie, blue jeans, grey sneakers, with a soft dark outline. In exactly that drawing style, shading and colour families, draw only his day clothes lying in a small, low heap on the floor, seen from the front and a little above, with no person: the green hoodie loosely folded on top of the blue jeans, and the pair of grey sneakers with pale soles beside the heap. The hoodie only in tones of green, the jeans only in tones of blue, the sneakers only in neutral greys. Nothing printed on the hoodie, no logo. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The heap is centred and fills most of the width. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/front_t1.png` · aspect 16:9


## Added 2026-11-15: walking into and out of the scene's depth

**Rick, 10:52:** "can I get a turn in and turn out for walking within the depth of the scene". **On seeing the two
loops, 11:02: "approved."** These are frames
for walking straight toward the viewer and straight away into the room. They are the same size and in the same
colour families as the rest.

| File | What | Neck (x, y) |
|---|---|---|
| `H_back.png` | from behind, standing, arms relaxed | 56, 67 |
| `B_walkF_L.png` | toward us, mid-stride, the viewer's-left foot forward and lower | 55, 70 |
| `B_walkF_R.png` | the same, mirrored | 56, 70 |
| `B_walkB_L.png` | away from us, mid-stride, the back foot's sole showing on the viewer's right | 55, 67 |
| `B_walkB_R.png` | the same, mirrored | 56, 67 |

All are 112×288, with the figure 272 tall.

**The loops:**
- **Toward:** `B_walkF_L` → `H_front` → `B_walkF_R` → `H_front`.
- **Away:** `B_walkB_L` → `H_back` → `B_walkB_R` → `H_back`.
- **Scaling with depth:** the game shrinks the figure as he walks away and grows it as he comes back. The same
  depth scaling Warp brief 11 does for the side walk.

**Neck points:**
- The front-walk points are set by hand to the collar row, 70, as for `H_front`. Found automatically, they landed
  on the top of the hood.
- The back points sit where the hair meets the hood.

**Mirrored frames:**
- **Why mirrored:** all six front-walk tries stepped with the same leg, and the figure is symmetrical, so the
  other step is the mirror. The walk-away frame is mirrored the same way.
- **What mirroring changes:** his hair parting and the beard's slight asymmetry. At game size I could not see
  them.

**Picks:**
- back t2 of 3: t3 painted the sneakers black, outside the grey family.
- toward t1 of 3: the clearest step.
- away t1 of 3: the sole shows clearly.

That is 9 more images, 56 in all.

**The head layer from behind, added after Rick's approval:**

| File | Rows changed against `H_back` | Pick |
|---|---|---|
| `HD_long_back.png` | 17–144 | t2 of 3: the hood shows under the hair, as in the side pick |
| `HD_fro_back.png` | 2–68 | t1 of 3: the same size as the front and side afro |
| `HD_mohawk_back.png` | 11–81 | t1 of 3: the pale buzz, as on the front and side |

- **No back head is needed for clean, standard or glasses.** They use `H_back`'s own short hair.
- **Glasses from behind:** the arms over the ears are too small to show.
- **The beard doesn't show from behind**, so `H_back` serves both the bearded and the clean looks.
- **Images:** 9 more for these heads, 65 for brief 06 in all.

### Prompts
#### Back
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Now show him from directly behind, his back to the viewer: standing straight, arms relaxed at his sides, full length. We see the back of his head with his short magenta hair and the back of his neck, the hood of the hoodie lying down flat on his upper back, the back of the hoodie, the back pockets of the jeans and the heels of the grey sneakers. No face is visible. The second image shows him in profile, for reference. Hands empty. Hood down, nothing printed on the hoodie, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/front_t1.png`, `hero05/tries/side_t1.png` · aspect 9:16

#### Walking toward (one leg; the other is the mirror)
```
The first image is a pixel-art game character, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Keep his head, face, hair and beard exactly as they are. He is walking straight towards the viewer, facing us, mid-stride: his left leg (on the viewer's right) is stepping forward towards us, that foot placed lower in the picture and slightly bigger, heel down; the other leg is behind, its heel lifted. His arms swing opposite to his legs, the arm on the same side as the forward leg swung back a little and the other arm swung forward. His body faces us squarely. The second image shows him walking in profile, for the stride. Hands empty. Hood down, nothing printed on the hoodie, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero05/tries/front_t1.png`, `hero05/tries/walk_contact_t1.png` · aspect 9:16

#### Walking away (one leg; the other is the mirror)
```
The first image is a pixel-art game character seen from behind, painted in flat colour families on a flat yellow background: green hoodie, blue jeans, orange-tan skin, magenta hair and beard, grey sneakers, a soft dark outline. Draw the same man again in the same drawing style, the same shading, the same outline, at the same scale and realistic proportions, keeping exactly his colour families (every pixel of a part is a tone of that part's one colour, no other hues). Show him from directly behind, his back to the viewer, walking straight away from us into the distance, mid-stride: his left leg (on the viewer's left) is stepping forward away from us, so that foot is placed a little higher in the picture and we see the back of its heel touching down; his right leg (on the viewer's right) is behind, nearer to us, its heel lifted high so we see the sole of that sneaker. His arms swing opposite to his legs. No face is visible: only the back of his head with his short magenta hair. The second image shows him walking towards us, for the stride. Hands empty. Hood down, nothing printed on the hoodie, no glasses. Background: one flat solid pure yellow colour everywhere, with no floor, no shadow and no other object. The figure fills the height of the image with a small margin. No text, no letters, no numbers, no logos.
```
Attached: `hero06/tries/back_t2.png`, `hero06/tries/walkF_L_t1.png` · aspect 9:16
#### Back heads (long, afro, mohawk)
```
Edit this picture. It is a pixel-art game character seen from behind, painted in flat colour families on a flat yellow background. Change only his hair, as seen from behind: long straight hair hanging down his back from the back of his head, past his shoulders to below his shoulder blades, lying over the hood of the hoodie. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same ears and neck, the same hoodie and hood, jeans, shoes and flat yellow background, pixel for pixel. No face is visible. No text, no letters, no logos.
```
Attached: `hero06/tries/back_t2.png` · aspect 9:16
```
Edit this picture. It is a pixel-art game character seen from behind, painted in flat colour families on a flat yellow background. Change only his hair, as seen from behind: a full, round afro of tight curls, standing out evenly around his whole head, about twice the size of his head's outline. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same ears and neck, the same hoodie and hood, jeans, shoes and flat yellow background, pixel for pixel. No face is visible. No text, no letters, no logos.
```
Attached: `hero06/tries/back_t2.png` · aspect 9:16
```
Edit this picture. It is a pixel-art game character seen from behind, painted in flat colour families on a flat yellow background. Change only his hair, as seen from behind: a mohawk: the sides and back of his head buzzed very short, in a pale tone of the same magenta, and a short, textured strip of hair running up the middle of the back of his head and over the top, standing up a few centimetres. Paint the hair in the same magenta colour family as his current hair (a few tones of magenta, light to shadow, nothing else), with the same soft dark outline and shading style. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same ears and neck, the same hoodie and hood, jeans, shoes and flat yellow background, pixel for pixel. No face is visible. No text, no letters, no logos.
```
Attached: `hero06/tries/back_t2.png` · aspect 9:16
