# Art brief 06 — the painted hero, the full set: one body, the head as a layer

> **Go (Rick, 2026-11-14, 23:20): "lets do it and see how it goes."** The list below stands as written: four
> hair styles, beard or none, glasses or none, one build. Start at step 1 of the order.

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account. Rick art directs; his
direction beats this brief. Branch `art/hero-painted-set` from `origin/era-look`.

## Where this stands

- Brief 05's four figures are approved (Rick, 2026-11-14: "better. approved.") and stay as they are:
  `art-drops/2026-11-14-hero-painted-test/H_front.png`, `H_side.png`, `H_walk_contact.png`, `H_walk_pass.png`.
- Cloud Claude cut them to game size and repainted them in three of the creator's looks beside the cloud
  engineer (`tools/build_hero_painted.py`). The colour families sort cleanly and the shading survives. Three
  things the sorting had to handle, so you know what the painting can and cannot leave to it:
  - a yellowish fringe on some edges against the background (it becomes outline);
  - the eyes' irises are a dark blue, the jeans' family (specks that small become outline);
  - **the hood's inner shadow is a blue-green that sorts as jeans** (a patch that small is given back to the
    hoodie). Where you can, keep a part's shadows inside its own family: a hoodie's shadow is a dark green.
- **Rick chose the head as a separate layer** (2026-11-14, 23:02): one body set, and the head painted on its own
  for hair, beard and glasses, so shapes do not multiply by every frame.

## The list (confirmed by Rick, 2026-11-14)

Colours cost nothing: skin, hair, hoodie and jeans colours all carry over from today's creator. Shapes cost
paintings. This is the list this brief is written for, and Rick has said go on it as it stands. He may still
cut or add as the paintings come in: his word beats the table.

| The creator today | In the painted set | Cost |
|---|---|---|
| Hair style: mohawk, standard, shoulder, long, fro | **standard** (painted), **long**, **fro**, **mohawk** | two small paintings each (front, side) |
| Beard: none, short, long | **none**, **short** (painted) | two paintings for the clean-shaven face |
| Glasses: none, glasses | **none**, **glasses** | two paintings |
| Body: three builds | **one** build | a second build would be a second body set: every frame in part A again |

That is 12 head paintings and 5 body paintings. Dropping two of today's three builds is the one thing here that
takes a choice away from the player and not only a shape. Rick has accepted that for now ("see how it goes"); a
second build, if he wants one later, is its own brief.

## How the layers work, so the paintings line up

Every painting below is an **edit of an approved figure, the same size, with only the named thing changed**.
Paste the change back onto the approved figure (the diff-mask method), so two paintings differ only where they
are meant to. The build then takes the head from one and the body from another:

- a **head** painting is `H_front` or `H_side` with only the head changed: nothing below the collar moves;
- a **body** painting keeps the approved head exactly, on a new body.

Same rules as brief 05 for every picture: the figure 272 px tall with his feet on the bottom row; 112×288, or
wider if the pose needs it; flat yellow `#FAD73C` background used nowhere on the figure; each part in its one
colour family (hoodie green, jeans blue, skin orange-tan, hair and beard magenta, shoes and whites neutral
grey, outline a dark neutral); nothing on the chest; no text or logos; nobody real. At most 5 tries a picture.

## A. The body set (5 paintings)

| File | From | What |
|---|---|---|
| `B_walk_down.png` | `H_walk_contact` | side, the moment after the long stride: weight on the front leg, its knee a little bent, the body at its lowest, the back foot leaving the ground |
| `B_walk_up.png` | `H_walk_pass` | side, the moment after passing: up on the ball of the back foot, the body at its highest, the front leg swinging forward and not yet down |
| `B_pj_front.png` | `H_front` | front, standing, in pyjamas: a long-sleeved top in the **green** family with stripes in a lighter and a darker green, trousers in the **blue** family, bare feet in the skin family |
| `B_pj_sit.png` | `B_pj_front` | front, sitting up in bed: the same pyjama top, arms resting forward on his lap, cut off below the waist (the bed's blanket covers the rest); the head and shoulders where they are standing |
| `B_clothes.png` | new | the day clothes in a small heap on the floor: the green hoodie folded on the blue jeans, the grey sneakers beside them; about 70×36 on yellow |

He only wears the pyjamas facing us (sitting up, then standing by the bed), so there is no side view of them.

With brief 05's four that makes the walk a four-picture step, long stride → down → passing → up, which the game
repeats for the other leg.

**For each body painting give the neck point**: the pixel at the middle of the neck where it meets the collar,
at 112×288. The game hangs the head there, so the head bobs with the walk.

## B. The heads (12 paintings)

All are edits of `H_front` (front) and `H_side` (side). The face, the ears and the neck do not change between
them: only what is named.

| Files | The change |
|---|---|
| `HD_clean_front.png`, `HD_clean_side.png` | no beard: the same face, clean-shaven. This gives the game the face; the beard is the difference between this and the approved figure. |
| `HD_long_front.png`, `HD_long_side.png` | from the clean face: hair past the shoulders, falling behind the shoulders and a little in front, magenta family |
| `HD_fro_front.png`, `HD_fro_side.png` | from the clean face: a full round afro |
| `HD_mohawk_front.png`, `HD_mohawk_side.png` | from the clean face: the sides buzzed short, a short textured strip on top |
| `HD_glasses_front.png`, `HD_glasses_side.png` | from the clean face with the standard short hair: glasses with a thin dark neutral frame, clear lenses (the eyes show) |
| `HD_standard_front.png`, `HD_standard_side.png` | from the clean face: the approved short hair, no beard. (The approved figures are this plus the beard.) |

Long hair is the one that reaches below the collar. Paint it over the shoulders as it would fall; the game draws
the head layer over the body.

## Order, and when to show Rick

1. The clean-shaven face, front and side. Show Rick: every other head is built on it.
2. The other heads. Show Rick each style, front and side together.
3. The two walk pictures. Show Rick the four-picture step as a loop.
4. Pyjamas standing, sitting up in bed, and the clothes heap.

## Deliver

`art-drops/<date>-hero-painted-set/` with the files above and `HANDBACK.md`: the exact prompts, tries and picks,
Rick's reactions, the neck point of every body painting, and for each head the lowest row it changes on the
front and side figures.

Cloud Claude then builds every body and head to the game's sizes as repaintable parts, and writes the Warp
brief that puts the painted hero in the game and brings the creator down to this list.

## Not in this brief

The intro's cut-scene paintings stay untouched: they are the style reference. The Honeycomb mark is never
painted: the game adds it from the official file.
