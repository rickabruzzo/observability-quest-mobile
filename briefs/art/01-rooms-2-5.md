# Art brief 01 — the rooms for scenarios 2, 3, 4 and 5

Read `briefs/art/PROTOCOL.md` first. This brief is for **Art Claude** on Rick's personal account
(Gemini API `gemini-3.1-flash-image`, 3:2, 1K). Rick art directs; his direction beats this brief.

## What you are making

Four rooms, each built like scenario 1's exec floor (`assets/rooms/R1_*.png`, raw in
`scratch/room_gen/raw/`), because the game engine now plays that shape:

1. **The patient's display**: a big screen on the back wall showing whatever is failing, with **blank panels the
   game draws into**. Tapping it opens a close-up.
2. **The hero's computer**: a desk the hero has been lent, where the player sits to try the old tool and Honeycomb. Tapping it opens a close-up
   of its screen.
3. **The persona**: one fictional person, mid-conversation, about to make the wrong call. This is whose problem
   the scenario is about; the player's hero is always the outsider who was paged to help, and the scenario ends
   when the hero walks over and tells them what to do.

So each room is **five files**:

| File | What |
|---|---|
| `R<n>_<room>` | the room plate |
| `R<n>_npc_talk_1`, `R<n>_npc_talk_2` | edits of the plate: the person in two other moments of the same conversation |
| `R<n>_wall_closeup` | the patient's display filling the frame, all panels blank (a new plate) |
| `R<n>_pc_closeup` | the hero's computer screen filling the frame, blank (a new plate) |

Twenty images in all. Work in `scratch/room_gen/` as before.

## Order of work

1. **All four room plates first.** Then stop and show Rick the four together, with the R1 plate beside them, so
   he can judge them as a set.
2. For each approved plate: the two talk edits, then the two close-ups.
3. **One drop per room**, each on its own branch and pull request, as soon as that room is approved:
   `art/room-ch2` → `art-drops/<date>-room-ch2/`, and so on. Do not wait for all four; the code for a room
   starts when its drop lands.

## Rules for every room plate

Start every room prompt with this, and attach **`scratch/room_gen/raw/R1_exec_floor.png`** as the style
reference:

> Sierra On-Line SCI VGA point-and-click adventure game room, 320x200, 1991 era, 256-color hand-painted pixel
> art, soft dithered shading. Seen from the side like a stage, at the same camera height as the reference
> image. Night.

and end it with:

> A clear flat floor band across the bottom of the picture, empty from edge to edge. Every screen in the room
> is dark and blank. No other people, no text, no letters, no numbers, no logos.

Accept a plate when **all** of these hold (they are what made R1 work, and what failed in its early tries):

- **Three things, separate and easy to tell apart**: the hero's computer on one side, the display on the back
  wall, the person on the other side. Each at least about **60 px wide** at 320×200. The computer and the person
  are on opposite sides so the hero has somewhere to walk.
- **Room to stand and walk.** A floor strip at least 15 px tall runs the full width at the bottom, with a
  straight top edge at about the same height as R1's. Between the two pieces of furniture there is an open gap
  at least **70 px wide** where a 28×72 px hero can stand without covering the computer, the display or the
  person.
- **An empty seat or standing spot at the hero's computer**, with nobody in it.
- **The display's panels are blank and clearly laid out** as its room section describes, with thin borders.
  Nothing is drawn inside them: no lines, bars, dots, digits or glare shapes. The smallest panel is at least
  about 18×20 px at 320×200.
- **It is not a copy of any show's or game's interface** (no LCARS elbows and pills), and each room's display
  looks different from Otto's monitor in R1.
- **The person is one fictional adult**, not a likeness of anyone real, clearly in the middle of the action
  described, facing toward the hero's side of the room, and is the only person in the picture.
- **Signs, sticky notes, whiteboards, mugs and labels carry no writing.** A whiteboard may have arrows, boxes
  and scribbled lines, never letters. Where the story needs words on a sign, leave it blank: the game says them.
- Nothing important in the top 20 px. It reads as night, lit by one or two warm lamps and the screens' glow.

At most 5 tries a plate. If Rick composites two tries in Photoshop, as he did for R1, say so in the hand-back.

## The four rooms

Use the prompt text between the opening and closing lines above. Names of the fictional companies are for your
context only; nothing is written in the picture.

### Room 2 — `R2_war_room` (Kestrel Bank: the migration war room)

> **Superseded 2026-11-12.** Rick redirected this room: the persona is the **Cloud Engineer** standing at a
> **whiteboard** (a hand-drawn service map), which is the room's wall display; the monolith is a codebase, so
> there is **no server cabinet and no plug**; the hero's computer is a cubicle desk on the left. The delivered
> art and its measurements are in `art-drops/2026-11-12-room-ch2/HANDBACK.md`. The description below is the
> original brief, kept for the record.

*Story:* a bank that hosts online banking for three hundred credit unions has "finished" a two-year move off
its old monolith. Members of two credit unions cannot move money, but two in three hundred is one percent, so
every dashboard is green. (What Honeycomb finds: for those two, one node still calls the old monolith.) The
persona is the **Platform Engineer** who ran the migration, ready to pull the old monolith's plug to prove it
is finished.

> A bank's migration war room. Left: a long project table with a modern flat-panel monitor on an arm, a
> keyboard, energy drink cans and takeaway boxes, and one empty office chair pulled out. In the middle of the
> back wall, a very large status wall display: its left three quarters is one big panel divided into a regular
> grid of small identical empty square tiles, many rows and columns, all dark; below the grid, one long thin
> empty lane; the right quarter is one tall empty panel. Beside the display, a whiteboard covered in arrows,
> boxes and loops in three marker colors, no writing. Right: an old beige tower server cabinet as tall as a
> person, with vents and two small lights, a blank laminated sign taped to its front, and a thick power cable
> running from it to a wall socket; standing next to it, facing left, a man in his forties in rolled
> shirtsleeves with a lanyard, one hand gripping the cable's plug at the socket, the other raised as he argues
> his case, impatient.

Display panels the game draws into: the tile grid (350 green tiles, all of them green), the long lane (a
support-ticket counter, climbing), the tall panel (one stuck transfer). Talk edits: (1) mouth open wide, free hand pointing at the status wall; (2) mouth
half open, free hand palm-up, shrugging. The hand on the plug does not move.

`R2_wall_closeup`: the status wall straight on: the empty tile grid, the lane under it, the tall panel.
`R2_pc_closeup`: a modern flat-panel monitor on an arm, thin dark bezel, blank screen, a row of blank sticky
notes along its bottom edge, the war room dark and out of focus behind.

### Room 3 — `R3_bullpen` (Twang & Co.: the dev bullpen)

*Story:* an online guitar store's checkout takes fourteen seconds for about one shopper in twelve, and sales are
sliding, but the monitoring tool's average says everything is fine. (What Honeycomb finds: every slow order has a
left-handed guitar in the cart.) The persona is the **Frontend Developer**, who is about to
ship a loading spinner and blame the CDN.

> A software team's bullpen in a converted warehouse. Right: a developer's desk with a laptop on a stand, its
> lid covered in blank stickers, a second small monitor, headphones, a coffee mug, and one empty chair; a
> generic solid-body electric guitar leans against the desk. In the middle of the back wall, a large wall
> monitor showing a web store's checkout page as empty outlines: across the top, one long thin empty bar; below it
> on the left, one large empty rectangle; to its right, three smaller empty rectangles in a column; along the
> bottom, one long thin empty lane. Brick wall, exposed pipes, a string of warm bulbs. Left: a standing desk
> with a small lamp; behind it, facing right, a woman in her thirties with dark curly hair, glasses and a
> cardigan, holding a phone in one hand and gesturing at the wall monitor with the other, anxious, mid-sentence.

The guitar must be a generic shape, **not a recognisable real model**: no brand headstock, no logo. The story
calls it left-handed; ask for that if the generator will do it, but do not spend tries on it. Display panels:
the top bar (the checkout's "placing your order" progress bar, stuck at 13%), the large rectangle (the item in
the cart: the game draws a guitar there), the three small rectangles (shopper readouts), the bottom lane (a
conversions line sliding down).
Talk edits: (1) mouth open, pointing hand jabbing at the monitor; (2) mouth half open, looking down at the
phone held up in front of her. Note this room is mirrored: the hero's computer is on the **right**.

`R3_wall_closeup`: the wall monitor straight on with the same empty outlines.
`R3_pc_closeup`: a laptop screen straight on, the lid's edge and hinge visible, blank stickers around the
bezel, blank screen, a mug and the guitar's neck out of focus at the side.

### Room 4 — `R4_ops_room` (Nullpoint Games: the ops room)

*Story:* the biggest space battle in an online game's history is live, with 8,000 players in one place. Pilots
say they cannot get in and call it lag; every dashboard says the servers are healthy. (What Honeycomb finds:
seven fleet joins in a hundred fail, and always have.) Only one engineer understands the 23-year-old fleet code,
and he is asleep in another time zone. The persona is the **Site Reliability Engineer on call**, tonight's incident
commander, about to phone him.

> A game studio's operations room, dark, lit mostly by its screens. Left: a low curved console desk with an
> ultrawide monitor, a mechanical keyboard with a soft glow, a headset, and one empty gaming chair. The back
> wall is almost entirely one enormous display, like a wall of space: its left two thirds is one wide very dark
> panel with a faint star-map grid of thin lines and a few tiny dim stars, no ships; under it one long thin
> empty lane; its right third is one tall empty panel like a chat column. Right: an old wooden desk in the
> corner with a bulky old CRT monitor under a layer of dust, a blank paper label taped to it, and a mug; in
> front of it, standing and facing left, a woman in her forties with a short ponytail, a studio hoodie and a
> headset around her neck, holding a phone up in one hand with her thumb hovering over it, the other hand
> pressed to her forehead, torn.

Display panels: the star map (the fleet as moving dots, with some stuck outside), the lane under it (a health
line that stays flat and green while the pilots complain), the chat column (lag reports scrolling). A few dim stars in the map panel are fine; anything that looks like a
ship, a planet with a name, or a known game's interface is a redo. Talk edits: (1) mouth open, phone lowered,
free hand flung toward the wall; (2) phone raised to her ear, eyes shut, wincing.

`R4_wall_closeup`: the wall display straight on: the star-map panel with its grid, the lane, the chat column.
`R4_pc_closeup`: an ultrawide monitor straight on, thin bezel, blank screen, the glow of the keyboard along the
bottom edge, the wall of space out of focus behind. (The game shows the team's coding agent on it.)

### Room 5 — `R5_loft` (a three-person AI startup: the loft)

> **Superseded 2026-11-13.** Rick redirected this room: it is now the building's **atrium** (night windows, bean
> bags, plants, a pinball machine, a monitor on a stand with two small boxes, the lent laptop on a coffee
> table). The delivered art and its measurements are in `art-drops/2026-11-12-room-ch5/HANDBACK.md`; the file
> names are unchanged. The description below is the original brief, kept for the record.

*Story:* Friday's release tightened sign-up validation. Since then eleven people have told support they cannot
create an account, but the error rate is normal and nothing alerted. (What Honeycomb's Team Agent found on
Friday evening: names with an apostrophe are rejected.) The persona is the **Build & Release Engineer** who
shipped it, about to roll back everything.

> A tiny startup's loft office. Left: a desk made from an old door on trestles, with a laptop on a stack of
> books, an external keyboard, a desk plant and a takeaway cup, and one empty stool. Two more small desks
> further back, both empty, chairs pushed in. In the middle of the back wall, a projector screen on a rolling
> stand showing a dashboard as empty outlines: on the left, one tall wide empty chart panel with thin grid
> lines; to its right, a column of three small empty boxes; at the far right, one tall empty panel like a chat
> window. A small old pager lies face-down on the floor near the middle. Sloped ceiling with a skylight showing
> night sky, a bicycle on the wall, a warm floor lamp. Right: a sagging couch with a blanket; sitting on its
> edge, facing left, a man in his late twenties with a beard, a beanie and a hoodie, a laptop open on his
> knees, one finger raised over its keyboard about to press a key, the other hand gripping his hair, panicked.

Display panels: the chart (sign-ups: a calm, healthy line), the three boxes (release readouts), the chat panel
(the support inbox: eleven messages). It must look different from Otto's monitor in R1: a projector screen on a stand, chart on the
left. Talk edits: (1) mouth open wide, both hands thrown up, the laptop balanced on his knees; (2) mouth half
open, pointing at the projector screen. The pager stays where it is in every frame.

`R5_wall_closeup`: the projector screen straight on with the same empty outlines.
`R5_pc_closeup`: a laptop screen straight on, propped on a stack of books, blank stickers on the bezel, blank
screen, the plant's leaves at one edge.

## The talk edits (all rooms)

Edit the **approved plate**, never a different take:

> Identical image, pixel for pixel, except the [person] is in a different moment of the same conversation:
> [the change]. Same framing, same colors, same lighting. Do not redraw, restyle, move or relight anything else.

Accept when only the person's figure changed and nothing else moved. Then composite only the changed figure
back onto the plate, as you did for the CTO, so the frames differ from the plate in one region. At most 5 tries.

## The close-ups (all rooms)

New plates, with the approved room plate attached as the style reference. Open the prompt with "Sierra On-Line
SCI VGA point-and-click adventure game close-up, 320x200, 1991 era, 256-color hand-painted pixel art.
Straight-on view of …" and close it with "No text, no letters, no numbers, no logos."

- **Wall close-up:** the same panels as in the room, in the same arrangement, upright and blank, filling the
  frame inside the display's own bezel. Each small box at least about 55×40 px at 320×200.
- **PC close-up:** one dark, blank, upright screen covering at least 60% of the frame's width and height.

At most 5 tries each.

## Size and names

Crop every file to 16:10 at 640×400 with the same crop as R1 (`scratch/intro_gen/crop.py`'s method). A plate and
its edits must share one crop. Names are exact and case-sensitive: `R2_war_room`, `R3_bullpen`, `R4_ops_room`,
`R5_loft`, and for each `R<n>_npc_talk_1`, `R<n>_npc_talk_2`, `R<n>_wall_closeup`, `R<n>_pc_closeup`.

## Hand-back, per room

Follow `HANDBACK.md` in the protocol. For these rooms the measurements Cloud Claude needs, at 320×200, are:

- **Hotspots:** the rectangle of the hero's computer (desk and machine), of the wall display, and of the person
  (with their furniture). Where the hero's left edge stands for the computer and for the person.
- **Walking:** the feet line (y), and the left-most and right-most x of the hero's left edge.
- **Wall display in the room:** the rectangle of every blank panel, named as in that room's section.
- **Wall close-up:** the same panels' rectangles.
- **PC close-up:** the screen's rectangle.
- **Talk frames:** the region that differs from the plate.
- Anything in the room Rick changed from this brief: who the person is, what they are doing, what the display
  shows. The script for the room is written after the drop, from what the picture actually shows.
