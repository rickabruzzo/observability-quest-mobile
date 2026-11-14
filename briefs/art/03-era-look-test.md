# Art brief 03 — era-look test: room 2 with both people drawn as the references draw them (one image)

> **Done, 2026-11-13.** Rick approved the test's style (try 2, "getting close enough") and Art Claude carried it
> through all five rooms, the close-ups, five conversation portraits and a hero model sheet. See
> `handbacks/2026-11-13-art-final.md` and the three `art-drops/2026-11-13-era-look-*/HANDBACK.md` files. The
> style words that worked are the ones below plus "the moderate detail of a 1990s point-and-click game character
> standing in a room, not a modern cartoon".

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account (Gemini API
`gemini-3.1-flash-image`). Rick art directs; his direction beats this brief.

**This belongs to the `era-look` fork**, not the main build. Branch from `origin/era-look`. Nothing on
`sci-adventure` changes: the approved art stays exactly as it is (tag `v0.2-painted-rooms`). This is an
experiment that may be thrown away.

## Why

Rick, 2026-11-13: the rooms and personas look "too nice" for a 1990s Sierra game, the hero looks older than
they do, and next to a persona "there is still a huge difference in detail levels". His references are
**King's Quest VI** (1992) and **Space Quest 6** (1995); he sent about sixty screenshots of the two.

What those screenshots have in common, measured:

- **Everyone standing in a room is drawn the same simple way**: flat colour, two to four tones a garment, a
  dark outline, a face of a few marks. The hero and the people he talks to are the same kind of drawing.
- **The backgrounds are richer than the people**: saturated, textured, detailed paintings.
- **Faces with real detail appear only in close-ups**: a framed portrait beside the text, or a full-screen shot.
- Camera distance varies. King's Quest VI keeps people at about a quarter of the screen's height. Space Quest 6
  has close rooms where they are about two fifths of the picture, which is near our framing.

Our rooms break the first rule: the persona is painted at portrait level and the hero is a simple figure. So
this test keeps the room and changes **only the people**.

## What to make

**One image:** the approved room 2, unchanged, with the cloud engineer redrawn as a simple figure and the hero
added beside him, both by the same hand. Edit from the approved `R2_war_room`.

Start from this and adjust the style words with Rick:

> Keep this scene exactly as it is: every object, every colour, the framing, and the painting of the room.
> Change only the man. Redraw him as a simple hand-drawn cartoon figure of the kind 1990s adventure games used
> for their characters: flat colour with two or three tones on each piece of clothing, a clean dark outline,
> no fine shading, no wrinkles, no texture, and a simple face made of a few marks. Same pose, same clothes,
> same size, same place.
> Add one more person drawn in exactly the same simple way and the same height: a software developer in their
> thirties standing a body's width to his left and a little nearer the viewer, in pure side profile facing
> him, arms relaxed, in a plain dark navy hoodie with the hood down, blue jeans and dark sneakers, short dark
> hair and a short beard.
> No text, no letters, no numbers, no logos.

## Rules

- **The room does not change.** Paste only the two figures back onto the approved plate (the diff-mask method
  you use for the talk frames), so the picture differs from `R2_war_room` only where the people are.
- **The two people must match each other**: outline weight, number of tones, amount of face. That is the test.
- **The hero:** side profile, standing, relaxed, nothing in his hands, **nothing on the hoodie's chest**. The
  game adds the Honeycomb mark from the official file. Never generate a logo. Nobody real.
- **Original.** Rick's screenshots are for looking at. Describe what you see in words; do not attach a
  screenshot from any game to the generator, and do not trace or copy one.
- At most 5 tries. Show Rick the best two beside the approved room.

## Deliver

- Branch `art/era-look-test` from `origin/era-look`.
- `art-drops/<date>-era-look-test/R2_era_test.png` at 640×400 (the usual crop and nearest-neighbour resize).
- `HANDBACK.md`: the exact prompt that worked, the style words you and Rick settled on, tries and which was
  kept, the region each figure occupies (320×200), and Rick's reaction.
- The hand-off goes to Cloud Claude, who builds it to game size and puts the portrait conversation on it,
  using the approved painted engineer for the portrait.

## What this does not settle

If Rick likes it: the same pass over the other personas and their talk and win frames, and a hero generator
that draws in this style. A flat figure with a few tones is something code can draw, so the character creator
and the walk can stay.
