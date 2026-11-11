# Task for a Claude session with image-generator access: a lived-in bedroom and an open door

Round 2 of the intro stills (round 1: `briefs/intro-shots-agent-brief.md` — read its "strict" section,
the same rules apply). Two images, both for the last shot of the intro, where the player's hero gets
out of bed, dresses and leaves through the bedroom door.

Work in the project folder. Do not run `git`; change nothing outside `scratch/intro_gen/`. No words,
digits or logos in any image. Any failed image is regenerated, never painted over.

## 1. `D_bedroom_vga` — the same room, lived in

Make this as an **edit of the current `scratch/intro_gen/raw/D_bedroom_vga.png`** (the approved
plate), not a fresh generation, so the bed, nightstand, lamp, door and floor stay where they are:

> Identical image — same framing, same bed, nightstand, lamp, door, wall and floor, same Sierra SCI
> VGA 256-color pixel-art style — except the room is now furnished and lived in. Add: a wooden
> dresser against the wall between the nightstand and the door, about waist high, with one or two
> drawers pulled partly open and clothes spilling out of them and hanging over the drawer fronts;
> the dresser's top is flat and has a clear empty space in the middle; a small round rug on the
> floor in front of the bed; a tall narrow bookshelf with books at the far left behind the bed's
> headboard; a small framed picture or two low on the wall near the dresser; a houseplant in a pot
> beside the door. Keep the upper half of the wall above the bed and dresser completely plain and
> empty. Keep the floor in front of the door and a wide strip of floor from the bed to the door
> clear and bare. The door stays closed. No people, no laptop or computer, no clothing or shoes on
> the floor, no text.

Accept when:
- bed, nightstand, lamp and door have **not moved or changed size** (flip between old and new);
- the **dresser is partly open with clothes spilling out**, stands against the back wall between
  the nightstand and the door, is about waist high for a person (the door is the height guide: the
  dresser top should be around 40–50% of the door's height), and its **top has an empty flat patch
  at least 12 px wide on the 320×200 picture** — the game sets the hero's laptop (or coffee, phone…)
  there itself and makes it vanish into their hand, so **do not** put a laptop or anything else in
  that space;
- the **top half of the wall from the nightstand's column to the door frame is still plain** — the
  game puts its title there (on the 320×200 picture: x 41–239, y 0–100);
- nothing else is taller than about half the wall under the title;
- the floor has a clear walking strip from beside the nightstand to the door, and a bare patch of
  floor about 55×12 px in the middle — the game draws the hero's jeans, hoodie and shoes there in
  the player's own colours, so **do not** add clothes or shoes to the floor;
- the door is closed; no person; no text, posters with lettering, clocks with digits, or logos.

At most 5 tries. Save the raw download as `raw/D_bedroom_vga.png` (move the old one to
`raw/tries/D_bedroom_vga_round1.png` first).

## 2. `D_door_open` — an edit of the new bedroom

Open the accepted new `D_bedroom_vga` as the image to edit:

> Identical image, pixel for pixel, except the bedroom door is now open: it has swung inward on its
> hinges and a dark hallway is visible through the doorway. Same framing, same colors. Do not
> redraw, restyle, move or relight anything else.

Accept when only the door and doorway changed; the opening is dark and tall enough for a person; the
door frame is in the same place. At most 5 tries. Save as `raw/D_door_open.png`.

## 3. Crop, build, check

Add `'D_door_open'` to the `NAMES` list in `scratch/intro_gen/crop.py`, run it, then:

```
python3 tools/build_intro.py
```

Expect `real art`, no `FALLBACK`, and a line like `D_door_open: 6% of the frame changed, x 240-310,
y 20-155` — a box around the door only. A box covering the room means the edit drifted: redo it.

## 4. Report to Rick

- Both files, tool/model/date, tries, anything kept despite a flaw.
- The build output.
- Measured on `assets/intro/D_bedroom_vga.png` (320×200), because furniture may have shifted things:
  the plain wall rectangle still free for the title (x, y, w, h); the bed's blanket line (y) and a
  spot to sit (x); an x beside the bed/nightstand where a person can stand clear of furniture; an
  empty floor spot for a 55×12 px row of clothes (x of its left edge, y of the floor row under it);
  the empty patch on the dresser top (x of its left edge, y of the dresser's top surface);
  the door opening (x, y, w, h), the x that centres a 28 px-wide person in it, and the y of the
  threshold; the y of the floor row a person walks along.
