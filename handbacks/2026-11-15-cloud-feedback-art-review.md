# Cloud Claude review — Warp brief 14, the feedback art in the game (2026-11-15)

Reviewed `warp/feedback-art` (b16e041): the hand-back, the whole diff, the three suites, and the result in a
browser at 844×390 and 667×375, every picture looked at enlarged. `desktop/feedback-art-review` is `era-look`
(129d073) with Warp's branch merged in and three changes on top. They merged cleanly.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/feedback-art` as handed back | 352 | 147 | 133 |
| merged onto `era-look`, before my changes | 376 | 165 | 147 |
| `desktop/feedback-art-review` | 377 | 165 | 150 |

The middle row is higher than Warp's because `era-look` gained the phone shell's and the painted hero's tests
after Warp branched.

## What I looked at

- **Room 2, the board:** theories 1, 3, 4, 5 and 6, round to 1 again with all six rings left on, and the wiped
  board after the fix, at both sizes.
- **Room 3, the shop:** each of the four products close up, the cart at 13 %, the order stuck, the order through
  after the fix; the room with the banjo and with the stuck guitar on the TV; the small phone size.
- **Room 4:** the battle close up at three moments while broken, three moments during the fix and after it; the
  room view; the phone ringing (blink on and off); the small phone size.
- **The marks:** the workstation's button and the tool's title bar in scenarios 1 to 3 at 844×390, 667×375 and
  800×360.
- **The portraits:** the verdict and Charity's Claim at both sizes.
- **The hero** standing after a walk left and after a walk right.

## What is right

- **The board.** Rings, question marks, the arrow and the corner's words are where the brief puts them; the rings
  stay; the wiped board shows the new theory above and below the path.
- **The shop.** The header carries the shop's name in its colour while a customer browses and turns into the
  progress bar when they order; the products are in colour with name and price in the corner each one leaves
  empty; nothing overlaps at either size.
- **The battle.** It reads at a glance: blue flying right for the gate, amber crossing, shots, a boom always
  somewhere on the left, and four of ours hanging at the gate with their red ticks. During the fix they go in
  one after another. The room view is the same battle in small ships.
- **The phone** is the painted plate with EINAR and ASLEEP on its bars and two rings growing from the call
  button.
- **The portraits** run through to their own right edge under the words' window: no shoulder cut in a straight
  line, for Christine or for Charity.
- **The hero's chest mark** is the same way round whichever way he walked.
- **Warp's fix to the wall's words** (calls, 7) is a real bug found and fixed with a test: the layer only laid
  its boxes out again when their number changed, so room 3's header kept the shop's pale ink over the progress
  bar.
- **`js/chapters/ch1.js`**, the one file outside the brief's list: one token, needed, nothing else moved.
- **The battle's numbers** are Warp's and they work: nine of ours, six of theirs, hits kept left of the gate so
  no boom reads as one of the stuck ones being shot.

## Changed here

**1. A workstation button's words spilled out of the button on smaller phones.** With the mark on it, "[Open
Pretty Good Metrics]" took three lines at 667×375 and at 800×360, and the third line landed on the "[Leave
computer]" button below; "[Open Old Artifact]" spilled by a few pixels. The cause is my brief, which asked for a
mark 28 px tall: taller than a line of words, it pushed the words down, and the workstation's grid has no spare
height on a short phone. The mark on the button is now one line of words tall (22 px beside 20-px words) and
adds no height. The three marked buttons are two lines each at all three sizes. The title bar's mark is unchanged. A
browser test now checks, at three phone sizes and in all five scenarios, that no button's words leave the
button; Warp's test of the mark's size follows the new size.

**2. Theory 5's question marks sat in the arrow's way.** Also my brief's number. At (240, 130) they were where
every arrow leaves the words: theory 5's own arrow ran a pixel under them and theory 6's went straight through
them. They are now below their ring at (221, 156), the emptiest spot beside it. A unit test checks that at
every tap no arrow comes within 3 px of any question marks on the board.

**3. The board with the taped sheet is retired.** `R2_wall_closeup` and `R2_wall_closeup_fixed` are out of
`tools/build_rooms.py`, `assets/rooms/` and room 2's manifest, as brief 14 said they would be once the game
stopped using them. Room 2 loads 84 KB less.

Brief 14 carries a note at each of the two numbers I changed, so it still describes the game.

## Not changed, worth knowing

- **The marks on the canvas are small.** Doggy Dashboards' mark under room 4's map is 18 px: a paw with green
  toes, readable as a paw, not much more. That is the size the strip allows.
- **Theory 3's question marks sit on two of the diagram's boxes.** Red on dark lines, still readable; left
  where the approved picture had them.
- **An old tool's screen now redraws ten times a second** so the phone can ring. Only room 4's moves; the cost
  on the others is a repaint of a still picture.

## For Rick's eye

No test can judge these; they need a look on the preview.

1. The battle in motion: is it busy enough, too busy, and do the four at the gate read as stuck?
2. The mark on the workstation's button at its new size: is it still easy to see?
3. The shop's 14-second visit: is each product up long enough to register?

## Next

Brief 15, the painted hero (`briefs/warp/15-the-painted-hero.md`), is ready for Warp once this is merged.
