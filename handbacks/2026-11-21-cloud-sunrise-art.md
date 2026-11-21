# Cloud Claude: the sunrise, painted (art brief 09 built into the ending) (2026-11-21)

Reviewed `art/the-sunrise` (pull request #34): the hand-back, the five files enlarged, and the approved mock.
`desktop/sunrise-art` is `era-look` (7d25f92) with Art Claude's branch merged in and the asset build on top.
One merge brings in the art and the build.

The art is right and is used as delivered. Nothing was redrawn, and the game's code did not change: Warp's
ending reads every number from the manifest, as briefed, so the paintings replaced the stand-ins by rebuilding.

## What the build does with it

**The street** (`tools/build_coda.py`, `assets/coda/`)

- `E_dawn` at game size is the last of the four pictures. The three before it are that picture recoloured
  (darker, cooler, less colour), so nothing in the street moves when the light changes.
- The open door is a patch of only the pixels the edit changed, in the first picture's light: the door opens
  before the sun is up.
- The sun is Art Claude's stepped disc at 40×40. It rises from wholly below the horizon to resting on it and
  the game draws it only above the horizon row. Rick, on the first mock: "that's not how the sun works in
  regards to horizons."
- The layout is the hand-back's: feet on row 186, he stops at x 132, the sun's centre at x 225, the clear sky
  x 123 to 297, the horizon at row 115.

**The sunglasses** (`tools/build_hero_painted.py`, `assets/hero/`)

- Lifted off the clean head as the glasses were, front and side, and they sit on every hair style.
- One thing the build had to settle: the sorting read the near-black lenses as dark skin and dark hair, and
  the game would have painted them in the player's own skin and hair colour (brown on one player, violet on
  another). The lenses are written as outline, the one dark that is the same on everyone, at the painting's
  own lightness.
- If the player's hero wears glasses, the sunglasses take their place.

## Two calls of mine

1. **He stands at 0.8 on this screen** (0.85 in the bedroom). The door is drawn in perspective: its opening is
   127 px high where he stands in it and shorter to the right, and at 0.85 he is 116. At 0.8 he is 109 and
   clears it with room.
2. **He stands in the left of the doorway** (x 34), where the opening is tallest, then steps down to the
   pavement and walks right.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `era-look` (7d25f92) | 427 | 149 | 175 |
| `desktop/sunrise-art` | 436 | 151 | 175 |

New tests: the four pictures are the painting and its recolourings; the door patch is only what changed; the
hero fits the doorway in his column; the sun's column is pure sky down to the horizon; the sunglasses are the
dark of the painting, cover the eyes, and are the same colour on another player; three new fixtures (front
over glasses, side with a beard, and from behind, where there are none).

## What I looked at

The ending beat by beat with the clock held, at 844×390 and 667×375: the dark street, the door open with him
in it, the walk, each of the three windows (bottom edge at row 59 and 63, above his head at 77), the sun half
up and clipped at the horizon, and the last frame with the sunglasses on. `the-ending-painted.png` (sent) is
that last frame at 844×390.

## For Rick's eye, on a phone

1. The whole ending from Claim: the door, the walk, the sunrise, the sunglasses.
2. Before the sun is up the street is dark and he is in his usual daylight colours, so he stands out against
   it. If that bothers you, dimming him with the street is a small Warp change.

## Next

Nothing is waiting on me. Still unbriefed and yours to call: the conversation window over the hero's head in
four rooms, the soundtrack, and going live.
