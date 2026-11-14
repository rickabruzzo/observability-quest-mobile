# Art brief 03 — era-look test: room 2 repainted as a painting (one image)

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account (Gemini API
`gemini-3.1-flash-image`). Rick art directs; his direction beats this brief.

**This belongs to the `era-look` fork**, not the main build. Branch from `origin/era-look`, and if you open a
pull request its base is `era-look`. Nothing on `sci-adventure` changes. The approved art stays exactly as it
is (tag `v0.2-painted-rooms`); this is an experiment that may be thrown away.

## Why

Rick, 2026-11-13: the rooms and personas look "too nice" for a 1990s Sierra game, and the hero looks older than
they do. The yardstick he picked is **King's Quest VI (1992)**: a middle ground between the two.

That game's rooms were **paintings**: painted by hand, scanned, and reduced to 320×200 in 256 colours. They have
no line work. Ours were generated as pixel art, with dark outlines and crisp shading, and no filter turns one
into the other (blurring smears the outlines; cutting colours goes grey). So this test does what Sierra did:
**you make the painting, and the build does the scanner's job.**

## What to make

**One image:** the approved room 2 plate, `R2_war_room`, repainted as a painting. Edit from its **full-size
original** (the 1264×790 crop, before the resize to 640×400), not from the pixel version.

> Repaint this exact scene as a hand-painted background for a 1992 VGA adventure game: gouache and acrylic on
> board, visible brushwork, soft painted edges. No black outlines, no ink lines and no pixel-art line work
> anywhere: edges are made by one colour meeting another. Rich, saturated colour; the same night lighting.
> Keep every object, its position and its size, the man's pose and clothes, and the framing exactly as in the
> reference. Add nothing and remove nothing. No text, no letters, no numbers, no logos.

## Rules

- **Same picture, different hand.** If the desk, the whiteboard or the man moves or changes size, it is a
  redo: the hotspots and the talk frames depend on them.
- **A painting, not pixel art.** Do not pixelate it and do not ask for "pixel art", "16-bit" or "retro game
  sprite" in the prompt. The pixels come from the build.
- **Original.** Describe the style in words only. Do not attach, trace or imitate any image from a Sierra game
  or any other game, and do not name an artist.
- The whiteboard keeps its drawing as loose painted marks; it must still read as a tangle of boxes and arrows.
- At most 4 tries. Show Rick the best two.

## Deliver

- Branch `art/era-look-test` from `origin/era-look`.
- `art-drops/<date>-era-look-test/R2_war_room_painted.png` at **full size** (the 16:10 crop, about 1264×790).
  **Do not resize it to 640×400** and do not use nearest-neighbour on it.
- A short `HANDBACK.md`: tries and which was kept, anything that moved, the exact prompt, Rick's reaction.
- The hand-off goes to Cloud Claude, who reduces it to game size and mocks the hero and a portrait
  conversation on it for Rick to compare with the approved room.
