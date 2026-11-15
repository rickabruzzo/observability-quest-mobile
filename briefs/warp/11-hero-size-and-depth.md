# Warp brief 11 — the hero's size and depth: scaled by each room, a floor to walk into, legs in bed

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first (**the worktree rule changed on 2026-11-14: your
worktree now lives inside the project folder**). Brief 12 is done and reviewed (`handbacks/2026-11-14-cloud-feedback-review.md`). Branch `warp/hero-depth` from
`origin/era-look` **after Rick has merged `desktop/feedback-review`**, which carries brief 12 and the review's
fix; the pull request's base is `era-look`.

## Why

Rick played all five scenarios on 2026-11-14:

- "The biggest issue now is that the hero is way too big in relation to the scene. He looks 7 ft tall."
- Scenario 5: "there is no Z component to their walking; it's one-dimensional along the X-axis. You can't walk
  to the pinball machine to click on its gag. There should be a perspective change so the character gets
  smaller as they walk deeper into the room."
- Intro: "Character is missing legs in intro scene."

What is wrong, measured:

- **His build as well as his height.** His head is 40 px of his 136 (3.4 heads tall) and he is 48 px wide. The
  cloud engineer in room 2 is 115 px tall with an 18-px head (6.4 heads) and 30-px shoulders. A figure with
  twice the head reads as nearer and bigger. This brief fixes his height and where he stands (section A).
- **One size for five rooms.** Brief 09 gave every room 136 px. The rooms are drawn at different camera
  distances: a standing adult is 115 px in room 2 and 95 px in room 4 on about the same floor line.
- **One floor line.** He walks along y 192, the nearest line in the picture, in front of everything.

Rick's rule stands: **the room's furniture sets his scale.**

## A. His size is the fix; his look waits

Rick was shown the hero beside the cloud engineer at 136 px and shrunk to the engineer's 115 px, and said: "The
hero shrunk looks better." So this brief's job is to make him the right size everywhere. Earlier the same day he
had also said "the hero characters just look blocky and odd in contrast to the NPCs"; a test of a painted hero
is written (`briefs/art/05-hero-painted-test.md`) and **on hold** until Rick has seen him at the right size in the
rooms. **Do not redraw the figure here.** Keep the 56×144 canvas and the 136-px figure at scale 1, and keep
everything in this brief independent of how the figure is drawn, so a painted one could replace the generated one
later without touching the walking or the rooms.

## B. Depth (`js/engine/walk.js`, `js/engine/room.js`, `js/screens/chapter.js`, `js/chapters/chN.js`)

1. **A floor, not a line.** Each room's data replaces `floorY` and `walk: [minX, maxX]` with a floor polygon in
   scene pixels: where his feet may be. Trace it from the picture: bare floor only, never through furniture or
   the persona.
2. **He gets smaller with depth.** Scale is linear in his feet's y and is zero at the room's horizon line. Each
   room gives two anchors; these are measured from the built plates, so start from them and nudge against the
   picture:

   | Room | His figure's height when his feet are on this line | What says so |
   |---|---|---|
   | 1 | 108 px at y 182 | the office chair's back reaches his waist |
   | 2 | 115 px at y 170 | the cloud engineer's own height on his own line |
   | 3 | 119 px at y 180 | the standing desk's top is at his waist; the guitar's head at his chest |
   | 4 | 95 px at y 172 | the SRE's own height on her line |
   | 5 | 130 px at y 195, 76 px at y 127 | the man on the couch; the pinball machine's backglass just over his head |

   Room 5's two anchors put its horizon at about y 38. For rooms 1 to 4 start with a horizon at y 40 and adjust
   until furniture at the back agrees (a whiteboard's top edge and a TV's top edge are above his head when he
   stands under them).
3. **Walking.** A tap on bare floor walks him to that point, or to the nearest point of the floor. A tap on a
   thing walks him to its stand point, now `{ x, y }`. He walks in a straight line when the line stays on the
   floor and otherwise goes round by the floor's corners; no pathfinding library. His speed in scene pixels
   follows his scale, so the stride still matches the ground and the feet do not slide.
4. **What is nearer covers him.** Each room lists the furniture he can stand behind as pieces of the plate with
   a base line (`fronts: [{ poly, baseY }]`); a piece is redrawn over him when his feet are above its base
   line. If a room's floor never takes him behind anything, it lists none.
5. **Stand points and the start.** Every thing in a room that is an object (computer, persona, guitar, sign,
   pinball machine) gets a stand point on the floor in front of it, and he walks there before the line plays.
   The wall display keeps `walk: false`: you read a wall from where you stand. He starts on bare floor where he
   covers neither the wall display nor the persona.
6. **Scenario 5's pinball machine** is the acceptance case: tap it, he walks up the room getting smaller,
   stops in front of it, and `ch5.look.pinball` plays.

The floors, in words (trace the exact corners from the plates):

- **Room 1:** the aisle between the cubicle (left, to x 135) and the CTO's desk (right, from x 205), from the
  back wall at y 135 to the front; plus the strip across the front below y 186.
- **Room 2:** the open middle from x 135 to about x 260 (the engineer stands at x 268–300), from the
  whiteboard wall at y 138 to the front. He can walk right up to the whiteboard.
- **Room 3:** between the standing desk (left, to x 100) and the desk with the laptop (right, from x 215),
  from y 135 to the front. The guitar stand is at x 188–208, base y 158.
- **Room 4:** between the curved console (left, to x 135) and the old desk (right, from x 205), from y 140 to
  the front.
- **Room 5:** the middle of the atrium from x 115 to x 230, from the back at y 130 to the front, and a way
  through to the pinball machine at the back right (stand at about x 236, y 134). The coffee table (front
  left) and the couch (right) are not floor.

## C. The intro's bedroom (`js/intro/timeline.js`, `js/screens/intro.js`, the sitting pose)

- **Legs.** Sitting up, he is a torso that ends at the mattress edge beside the pillow. Put him in the bed:
  his hips under the blanket, and the blanket rising over his legs toward the foot of the bed (a shape in the
  blanket's own colours, drawn by the game over the plate).
- **The subtitle.** His hair crosses "So you want to be on-call?" both sitting and standing. Keep him at the
  door's scale (a standing adult is about seven eighths of the 132-px door) and move whichever is easier, the
  subtitle or where he stands, so they never overlap.

## D. Two things from the review of brief 12

1. **The verdict portrait is cut in a straight line on its right.** Cropping the picture to 45% of the scene
   chops the narrator's far shoulder, and Charity's hair, with a vertical edge in the middle of the screen. Keep
   the crop on the left (it centres the face in the left 45%) but draw the picture through to its own right
   edge, and let the words' window sit over it. Same for Charity's `<img>`. The tests that say the window is
   wholly to the portrait's right change to: the window is wholly to the right of the face's 45%, and no
   portrait pixel ends in a vertical line left of the window.
2. **`persona.covers` stays.** The review replaced the clip round the persona's whole patch with small
   rectangles where the plate's figure stands in front of the wall display (`js/chapters/ch3.js`, `ch4.js`;
   `tests/covers.test.js`, and the room 3 and room 4 tests in `tests/e2e/chapter.test.js`). When you rework
   `paintRoom` for depth, keep it, and keep those tests passing unchanged.

## Tests

- Unit: scale from y for a room's anchors; nearest floor point for a tap off the floor; a planned path never
  leaves the polygon; which fronts cover him at a given y.
- e2e: in scenario 5 a tap on the pinball machine walks him there and shows the line; in every scenario, at the
  persona's stand point his drawn height is the room's anchor within 2 px and he overlaps neither the persona's
  patch nor the wall display at the start; in the intro his box never meets the subtitle's box, and the sitting
  pose has painted pixels below the blanket line.
- Where the walk-speed and stride tests change because speed now follows scale, say what changed and why.

## Files

**Yours:** `js/engine/hero.js` (the sitting pose and drawing at a scale only), `js/engine/walk.js`, `js/engine/room.js`,
`js/screens/chapter.js`, `js/screens/intro.js`, `js/intro/timeline.js`, `js/screens/creator.js` and
`js/screens/preview.js` where the figure's size shows, `js/chapters/ch1.js`–`ch5.js` (room data only), `tests/`.
**Not yours:** `script/script.md`, `assets/`, `art-drops/`, `tools/build_*.py`.

## Hand-back

`handbacks/<date>-warp-hero-depth.md`: one screenshot per room with him at
the persona's stand point and one with him at the back of the floor; the anchors and polygons you ended with;
the suites' counts; every number of this brief you changed and why.
