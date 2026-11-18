# Cloud Claude: art briefs 07 and 08 reviewed, the clothes built in, the title briefed (2026-11-18)

Acting on `handbacks/2026-11-18-art-title-and-clothes.md`. `desktop/clothes-and-title` is `era-look` (67b00fa)
with both of Art Claude's branches merged in (`art/clothes-on-the-floor`, `art/title-screen`) and my work on
top. Merging it brings in everything in pull requests #30 and #31.

**Pull request #24 does not need merging.** Its four figures (`H_front`, `H_side`, `H_walk_contact`,
`H_walk_pass`) have been on `era-look` since the painted hero was built (commit b143a68). The only thing on
that branch that is not on `era-look` is the commit that triggered a Vercel preview. It can be closed.

## Brief 08: yesterday's clothes

**The painting is right for the build**: the three garments each in their own colour family, no yellow or
cream left in the soles, nothing read as skin, hard edges. At game size it is 100×38.

It does read a little like a figure lying down (the jeans come straight out of the hoodie's hem). Rick saw it
at both sizes and said "2 is fine", so it stands.

**Built in** (asset build and two small changes to the game):

- `tools/build_hero_painted.py` cuts `props.clothes` from the new painting in place of the folded stack.
- **The mark is back on the hoodie.** The clothes the game drew before the painted hero had the Honeycomb
  mark face up; the folded stack lost it. The manifest now gives the mark's place on the prop, centred on the
  chest point from the hand-back (60, 27 on the painting), and `composeProp` puts the official mark's pixels
  there, as it does on the figure. Every pixel of the mark lies on the hoodie.
- **They lie on the open floor to the right of where he stands** (`intro.json`: clothes 251, 195, now the
  middle of their bottom edge). At the folded stack's old spot beside the rug, a spread 85 pixels wide went
  behind him: only the hood showed. Where they are now they are seen whole both while he sits up in bed and
  while he stands beside them, and the shoes end up by the door.
- The intro is filmed again with them (`observability-quest-intro.mp4`, sent to Rick).

## Brief 07: the title screen

**The art is right.** The plate is the picture the brief asked for, with no lettering, no logo and nobody in
it. Three things differ from what the brief hoped, all stated in the hand-back and all fine:

- The quiet sky is x 20 to 270, y 5 to 78 (the brief asked to x 300, y 105): the window's frame stands at
  x 275 to 287 and the towers start at y 97. The wordmark fits left of the frame.
- The bottom rows are dark only left of the nightstand (x 8 to 190). The small print goes there.
- The lit pager and the brighter stars were drawn in code by Art Claude, because the generator painted the
  glow as an airbrushed blur. Both are in the game's hand and both hold up at game size.

**Asset build** (`tools/build_title.py`, new, 7 tests): `assets/title/` and `title.json`.

- The plate at 320×200 in 192 colours, as the rooms are.
- The lit pager as a patch of only the pixels that changed, so nothing but the pager moves when it lights.
- The twelve twinkling stars as places and colours. Halving the painting would have skipped eleven of them
  (it keeps every other pixel, and a star is one pixel), so each is put back in the plate in the painting's own
  colour, and the game brightens it.
- The wordmark's two layers at one letter pixel per pixel (194×68). The drop holds them three times that
  size; they come down without loss, and the letters are byte for byte the game's own `wall_logo`.

**One thing to know about the wordmark.** At the size Rick approved, a letter pixel is 1.5 game pixels. That
cannot be drawn into the 320×200 canvas without making some letter pixels one wide and some two, so brief 16
has the game lay the wordmark over the picture as its own layer. On a phone a game pixel is already five or six
screen pixels, so the letters stay sharp.

**The subtitle.** Rick: "Subhead needs to be larger if its gonna be legible on mobile." The letters end at
y 95 and the nightstand's top edge is at y 116, so a centred line has 21 pixels. At 0.115 of the scene's height
(42 px type on an 844×390 phone, a third larger than the intro's subtitle and twice the placeholder's) the
type runs y 100 to 113: five pixels under the letters, three above the nightstand, left of the window frame.
That is the largest one centred line that touches neither.

**The small print** is the official Honeycomb logo (`assets/hc_logo_white.png`) and, under it, the font
credit the README has promised on the title since the first build (`title.credit` in the script), in two
lines at bottom left.

**The pager goes off when you press Start** (my call, for Rick to overrule): it stays dark while the title
waits, which is the joke of "Before the page"; Start lights it with the intro's beep twice, and 600 ms later
the creator opens.

`briefs/warp/16-title-screen.md` is the brief. `title-screen-as-briefed.png` (sent to Rick) is that screen
mocked on the real page with the real fonts.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `era-look` (67b00fa) | 381 | 133 | 162 |
| `desktop/clothes-and-title` | 404 | 141 | 162 |

Unit: two new tests for where the clothes lie; the other 21 are the hero's sheet tests, which the new file
loads the sheet through and so runs again. Python: one for the mark, seven for the title's build.

## For Rick's eye

1. The film from 0:22: the clothes on the floor, and where they lie.
2. `title-screen-as-briefed.png`: the subtitle's size, the small print, the whole.
3. The pager dark until Start. If you would rather it blink while the title waits, it is one line of the brief.
4. The logo file in the repo is 163×48 and will be a little soft on a phone. The official SVG, or a large
   PNG, in `assets/` would fix that.
5. The glint for the wordmark is delivered and not used. Say if you want it.

## Worth knowing, not changed

- **On a phone the conversation window covers the top of the hero's head in four of the five rooms.** Found
  while making the repository's social card, then measured at 844×390: the window parks at the top, on the
  side away from the persona, and he stands under it. Its bottom edge is at y 85 (y 96 in room 3). His head
  starts at y 81 in room 1 (4 pixels covered), 63 in room 2 (22), 68 in room 3 (28), 71 in room 5 (14); room 4
  clears it by 2. The tests keep the window off the persona, not off him. A fix is a small Warp brief: a
  shorter window, or one that parks beside him.
- **The intro's placements live outside the repository.** `assets/intro/intro.json` is built from
  `scratch/intro_gen/intro.overrides.json`, which is not committed. The build is repeatable only on the
  machine that has that folder (this one). Worth moving the overrides and the stills into `art-drops/`.
- Art Claude's own open items stand: the weak `B_walk_down` frame, sound on Rick's iPhone with the switch on
  ring, and the Vercel project's name.

## Next

Rick: merge, then hand Warp `briefs/warp/16-title-screen.md` (branch `warp/title-screen`). Nothing is waiting
for Art Claude from me.
