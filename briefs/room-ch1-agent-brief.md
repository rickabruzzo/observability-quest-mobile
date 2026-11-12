# Task for a Claude session with image-generator access: the chapter 1 room

One picture: the room for chapter 1 of *Observability Quest*. Read the "strict" section of
`briefs/intro-shots-agent-brief.md` first; the same rules apply (no words, digits or logos anywhere; a failed
image is regenerated, never painted over; work only in `scratch/room_gen/`; do not run `git`).

The game's hero (drawn by the game, 72 px tall on the 320×200 picture) walks along the floor and taps on five
things in this room. The picture is the stage; it has **no people in it**.

## `R1_exec_floor` — a glass-walled executive floor at 3 AM

Same look as the approved bedroom, `scratch/intro_gen/raw/D_bedroom_vga.png` — attach it as the **style
reference** (Sierra SCI VGA 256-colour pixel art, soft dithered shading, seen side-on like a stage, the same
camera height and the same floor band across the bottom third). Aspect 3:2, 1K.

> Sierra On-Line SCI VGA point-and-click adventure game room, 320x200, 1991 era, 256-color hand-painted pixel
> art, soft dithered shading. The executive floor of a tech company at night, seen from the side like a stage.
> Back wall of floor-to-ceiling glass with a dark city skyline and a few lit windows beyond. One warm desk
> lamp is the main light. From left to right along the back: a small side table with an old beige CRT
> terminal, its screen dark; a large flat wall screen mounted on a pillar, glowing pale blue and completely
> blank; a wide executive desk with an open laptop and, beside it, a single sheet of paper with a pen lying
> on it; at the far right a modern workstation with a dark, blank monitor on a standing desk. A clear flat
> floor band across the bottom third, empty, wide enough to walk the whole width. No people, no text, no
> logos, no numbers.

Accept when:
- the five things are **separate and unmistakable**, left to right: CRT terminal, wall screen, desk with
  laptop, the sheet of paper with a pen on that desk, the workstation. None overlaps another; each is at least
  about 24 px wide on the 320×200 picture so a thumb can hit it;
- **every screen is blank** — no text, icons, charts or logos (the game draws on them). The wall screen is a
  plain pale glow; the terminal and workstation screens are dark;
- the **floor band is empty from edge to edge** and its top edge is one straight horizontal line, at about
  the same height as in the bedroom, so the hero can stand in front of each thing;
- nothing important sits in the top 20 px (the game's status bar is above the picture, but leave air);
- side-on stage view, not top-down, no strong perspective; it reads as night; no people.

At most 5 tries. Save the raw download as `scratch/room_gen/raw/R1_exec_floor.png`, then crop it to 16:10 and
640×400 the same way `scratch/intro_gen/crop.py` does, into `scratch/room_gen/R1_exec_floor.png`.

## Report to Rick

- The file, tool/model/date, tries, anything kept despite a flaw.
- Measured on the picture at 320×200: the rectangle (x, y, w, h) of each of the five things; for each, the x
  where a 28 px-wide person would stand in front of it; the y of the floor row a person walks along; the
  left-most and right-most x a person can walk to.
