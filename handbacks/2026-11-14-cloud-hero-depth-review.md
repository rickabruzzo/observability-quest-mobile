# Cloud Claude review — Warp brief 11, the hero's size and depth (2026-11-14)

Reviewed `warp/hero-depth` (0e4678f): the hand-back, the diff, the three suites, and every room in a browser at
844×390 with him at the start, beside the persona, at the back of the floor and at the pinball machine, plus the
intro's bedroom. `desktop/hero-depth-review` is `desktop/feedback-review` (the play-through fixes, brief 12 and
its review) with Warp's branch merged into it and one fix on top. They merged cleanly. Merging
`desktop/hero-depth-review` into `era-look` lands everything since the play-through.

## Suites

| Tree | Unit | Python | e2e |
|---|---|---|---|
| `warp/hero-depth` as handed back | 326 | 126 | 124 |
| `desktop/hero-depth-review` | 331 | 126 | 125 |

## What is right

- **His size.** Beside each persona he is now their size, not 136 px everywhere:

  | Room | Beside the persona | At the back of the floor | At the start |
  |---|---|---|---|
  | 1 | 111 px | 73 px | 117 px |
  | 2 | 124 px (the engineer is 115, a little further back) | 88 px | 136 px |
  | 3 | 121 px | 82 px | 133 px |
  | 4 | 105 px (the SRE is 95) | 73 px | 111 px |
  | 5 | 126 px | 78 px | 131 px |

- **Depth.** A floor to walk on, his size following his feet, speed following his size so the feet do not
  slide, routes round the floor's corners. In room 5 he walks up to the pinball machine, shrinking to 82 px,
  passes behind the couch's arm, and the line plays.
- **The bedroom's subtitle** is clear of his hair, sitting and standing.
- Warp's changes to the brief's numbers (room 5's horizon from its own two anchors, its floor from y 128) are
  right.

## Found and fixed here

**Sitting up in bed.** He sat at the bed's right edge, half over the nightstand, under a flat blue shape drawn
for the blanket. The shape was this brief's idea and it looked like a board. He now sits in front of the pillow
and the bed's own painted blanket covers his hips: the plate is drawn again over him from its blanket line
down. Nothing is drawn for the blanket. `js/screens/intro.js`, `js/intro/timeline.js` (`sitX`), and the e2e test
now says so.

## Not in this build

Warp worked from brief 11 as it stood before the review of brief 12, so **the verdict portrait's right edge**
(a straight cut through the narrator's shoulder, and Charity's hair) is not done. It goes in the next Warp brief.

## For Rick to look at

- **At the very front of rooms 2 and 3 he is 136 and 133 px**, because he is nearer than anyone else, and that
  is where he starts. It is right by the furniture beside him. If it still reads too tall, each room's
  `horizonY` is the one number that flattens how much he grows toward the front.
- **Rooms 4 and 5:** the wall display is as wide as the floor, so he starts in front of its lower edge.
