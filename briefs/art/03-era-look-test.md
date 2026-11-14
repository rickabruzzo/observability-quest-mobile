# Art brief 03 — era-look test: room 2 and both figures, drawn the 1992–93 way (one image)

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account (Gemini API
`gemini-3.1-flash-image`). Rick art directs; his direction beats this brief.

**This belongs to the `era-look` fork**, not the main build. Branch from `origin/era-look`. Nothing on
`sci-adventure` changes: the approved art stays exactly as it is (tag `v0.2-painted-rooms`). This is an
experiment that may be thrown away.

## Why

Rick, 2026-11-13: the rooms and personas look "too nice" for a 1990s Sierra game, the hero looks older than
they do, and next to a persona "there is still a huge difference in detail levels". His yardsticks are
**King's Quest VI (1992)** and **Space Quest V (1993)**: both 320×200 in 256 colours, both a middle ground
between the hero and today's rooms.

Cloud Claude tried to get there from the existing files and could not: blurring smears, cutting colours goes
grey, and flattening the shading barely moves it. The look has to be drawn in. And Cloud Claude cannot see the
reference screenshots, so **matching the look is done here, by you and Rick, looking at them together.**

## What to make

**One image:** room 2 with the cloud engineer **and the hero**, both drawn by the same hand at that era's level
of finish. Edit from the approved `R2_war_room` so the layout holds.

Start from this, and change the style words to fit what you and Rick see in his references:

> Redraw this exact scene the way a 1993 VGA adventure game drew its screens: 320x200, 256 colours, a bold
> comic-book look. Flat areas of colour with only two or three tones on any surface. Strong dark outlines round
> the figures and the furniture. Simple, confident shapes. No fine texture, no soft gradients, no smooth
> modelling, no anti-aliasing, no tiny clutter. Faces are simple: a few pixels for the eyes and the mouth.
> Keep every object, its position and its size, the man's pose and clothes, and the framing exactly as in the
> reference.
> Add one more person, drawn in exactly the same way and the same height as the man: a software developer in
> their thirties standing a body's width to his left and a little nearer the viewer, in pure side profile
> facing him, arms relaxed, in a plain dark navy hoodie with the hood down, blue jeans and dark sneakers, short
> dark hair and a short beard.
> No text, no letters, no numbers, no logos.

## Rules

- **Same room, different finish.** If the desk, the whiteboard or the engineer moves or changes size, it is a
  redo: the hotspots depend on them.
- **The two people must match each other.** Same outline weight, same number of tones, same amount of face.
  That match is the point of the test.
- **The hero:** side profile, standing, relaxed, nothing in his hands, **nothing on the hoodie's chest**. The
  game adds the Honeycomb mark from the official file. Never generate a logo. Nobody real.
- **Original.** Look at Rick's references and describe what you see in words. Do not attach a screenshot from
  any game to the generator, and do not trace or copy one.
- At most 5 tries. Show Rick the best two beside the approved room.

## Deliver

- Branch `art/era-look-test` from `origin/era-look`.
- `art-drops/<date>-era-look-test/R2_era_test.png` at 640×400 (the usual crop and nearest-neighbour resize),
  and the same picture **without the hero** as `R2_era_test_room.png` if you can get it by pasting the hero's
  area back from a second edit; if not, say so.
- `HANDBACK.md`: the exact prompt that worked, the style words you and Rick settled on, tries and which was
  kept, the region the hero occupies (320×200), anything that moved, and Rick's reaction.
- The hand-off goes to Cloud Claude, who builds it to game size and puts the portrait conversation on it.

## What this does not settle

If Rick likes it, two questions follow, both his: the same pass over the other four rooms and their frames,
and how a drawn hero keeps the character creator (a body, skin, hair, beard, hoodie, jeans and glasses to mix)
and the walk. Colours can be swapped on a drawn figure; hair styles, beards, bodies and walking limbs each need
their own drawing.
