# Art brief 04 — era-look test: the hero painted by the same hand as the personas (one image)

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account (Gemini API
`gemini-3.1-flash-image`). Rick art directs; his direction beats this brief.

**This belongs to the `era-look` fork.** Branch from `origin/era-look`. Nothing on `sci-adventure` changes.

## Why

The hero is drawn in code from flat shapes. The personas were painted by the image model, with dozens of tones,
folds and a real face. Rick, 2026-11-13, looking at a code-drawn hero redrawn at the persona's size: "there is
still a huge difference in detail levels for the NPC vs the hero. Also the hero's head looks really weird."
No amount of code-drawing closes that. This test finds out whether a hero painted the same way does.

## What to make

**One image:** room 2's approved plate with the hero added, standing with the cloud engineer. Edit
`R2_war_room` from its full-size original.

> Add a second person to this exact scene: a software developer in their thirties, standing on the floor a
> body's width to the left of the man and a little nearer the viewer, turned to face him, seen in **pure side
> profile facing right**. A plain dark navy hoodie with the hood down, blue jeans, dark sneakers, short dark
> hair, a short beard, arms relaxed at their sides. Paint them in exactly the same style as the man: the same
> level of detail, the same outline weight, the same shading and the same lighting. The same scale: the top of
> their head level with the top of his. Their feet are on the floor near the bottom edge of the picture.
> Change nothing else in the scene. No text, no letters, no numbers, no logos.

## Rules

- **Side profile, standing, relaxed.** The hero walks side-on in the game; this is his rest pose. Not three-
  quarter view, not gesturing, not holding anything.
- **Plain hoodie, nothing on the chest.** The game puts the Honeycomb mark there from the official file. Never
  generate a logo.
- **Nobody real**, and not a character from anything.
- **Only the new figure is pasted back** onto the approved plate (the diff-mask method you use for the talk
  frames), so the picture differs from `R2_war_room` only where the hero stands. He should not overlap the
  engineer, the chair or the whiteboard's lower edge more than he has to.
- At most 4 tries. Show Rick the best two.

## Deliver

- Branch `art/era-look-hero-test` from `origin/era-look`.
- `art-drops/<date>-era-look-hero-test/R2_hero_test.png` at 640×400 (the usual crop and resize), **and** the
  full-size 16:10 crop beside it as `R2_hero_test_full.png`.
- A short `HANDBACK.md`: tries and which was kept, the region the figure occupies (320×200), the exact prompt,
  Rick's reaction.
- The hand-off goes to Cloud Claude, who lifts the figure off the plate and mocks him in the game screen.

## What this does not settle

The character creator lets a player mix a body, skin, hair, beard, hoodie, jeans and glasses, and the hero
walks. A painted hero makes both harder: colours can be swapped on a painted figure, but each hair style, beard
and body needs its own painted variant, and the walk needs painted limbs. That is the decision after this test,
and it is Rick's.
