# Warp brief 09 — era-look fork: the hero redrawn to the model sheet, at the personas' size

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first, **and the fork rule in `briefs/PROTOCOL.md`**:
this brief is for the `era-look` fork. Branch `warp/era-hero` from `origin/era-look` and open the pull request
against `era-look`. Nothing here goes to `sci-adventure`.

## Why

Rick forked the build on 2026-11-13 to try a 1990s look (King's Quest VI and Space Quest 6 were his
references). In those games everyone standing in a room is the same simple kind of drawing, and the detail is in
the close-ups. Art Claude has redrawn every persona that way (already built into `assets/rooms/` on this
branch). What is left is the hero: he is 72 px tall and thin, and the personas are about 130. Rick: "the hero
doesn't even match scale with the desk, let alone the NPC."

## The target

**`art-drops/2026-11-13-era-look-portraits/hero_model_sheet.png`** (1584×672, approved by Rick). It is a style
reference, not something to trace: match its level of finish and its proportions. Left to right it shows the
hero front, side and walking, four other looks (long hair and glasses in a honey hoodie; a violet mohawk and
glasses in teal; dark skin, an afro and a long beard in lime; pale skin and shoulder-length ginger hair in
indigo), and the hero in striped pyjamas. Those map onto the generator's `OPTIONS` and `PRESETS`.

**`art-drops/2026-11-13-era-look-test/R2_era_test.png`** shows the hero standing with the cloud engineer at the
size and finish to hit (hero x 140–207, y 49–185 at 320×200).

What the style is made of:

- a dark outline round the figure and between its parts;
- three or four tones on each garment (`ramp` already gives light, base, shade, dark);
- a simple face: eyes with a highlight, brows, a small nose, a mouth; a beard as a shaded shape;
- hands you can see; a hood with two drawstrings; a front pocket; jeans with a seam and a cuff; shoes with a
  sole;
- about four and a half heads tall, the head about 30 px high, shoulders about 46 px across from the front,
  about 26 px deep from the side.

## What to build

1. **The canvas doubles: `W, H = 56, 144`**, with the standing figure about 136 px tall (as the 28×72 canvas
   holds a 67 px figure today). Doubling exactly keeps every layout that assumed 28×72 simple. This is a
   redraw at the new size, not the old figure scaled up: a 2× of the old hero is what Rick rejected.
2. **Both views, every pose.** `hero()` front: `idle`, `walk1`–`walk4`, `situp`; `hero_side()`: `stand` and
   `w1`–`w8`, with the jointed limbs. The planted shoe still stays on one floor row through the walk (the
   existing test holds it there; keep it, at the new size).
3. **Every option still works**: all of `OPTIONS` (bodies, skin, hair colour, style, beard, hoodie, jeans,
   glasses) and the `pj` outfit, in both views. `PRESETS` unchanged. The creator screen must not lose a choice.
4. **The reference stays in Python and the game port stays pixel-exact.** Redraw in `tools/hero_gen.py`,
   regenerate the fixtures (`tests/fixtures/hero`, `tests/fixtures/hero-side`), and bring
   `js/engine/hero.js`, `hero-side.js` and `hero-parts.js` to match them byte for byte, as now.
5. **The Honeycomb mark comes from the official file, not from a drawing.** The chest is blank in the art. Add
   a small tool step that reduces `assets/hc_logomark.png` to the mark's size on the new chest (about 9×9) and
   writes the result as the pixel table both generators use (today's `HC_MARK_PIXELS`), so Python and the game
   agree exactly. Never hand-draw or generate the mark.
6. **Everything that uses the hero takes the new size from the constants**, never from a number:
   - rooms and the walk (`js/engine/room.js`, `walk.js`, `js/screens/chapter.js`): `HERO_W`, `HERO_H`; the walk
     runs from x 0 to 264; **walking speed doubles with the stride** so the feet do not slide;
   - the creator (`js/screens/creator.js`, `preview.js`): the same size on screen as today, with twice the
     detail;
   - the intro's bedroom (`js/intro/timeline.js`, `js/screens/intro.js`): `situp` in `pj`, standing, dressed,
     walking to the door. The painted cut scenes (`C_*`) do not change.
7. **A hero scale per scene**, default 1, nearest-neighbour: `heroScale` on a room or an intro shot. The
   bedroom's door is 132 px tall, so a 136 px hero is taller than his own door: start the bedroom at **0.85**
   and say in your hand-back how it looks. Rooms 1–5 stay at 1.
8. **Stand points for the wider hero** (left edge, 320×200). Same centres as before except at the persona,
   which I re-measured against the era plates:

   | | Room 1 | Room 2 | Room 3 | Room 4 | Room 5 |
   |---|---|---|---|---|---|
   | at the computer | 73 | 82 | 248 | 81 | 104 |
   | at the persona | 148 | 184 | 116 | 148 | 176 |
   | starts at | old value − 14 | 156 | 132 | 136 | 136 |

   Room 1 is built, so change `js/chapters/ch1.js`. Rooms 2–5 are brief 08's; these replace its numbers on this
   fork. Check each in play: he must not overlap the persona or their gesturing hand. Say what you moved.

## Known and accepted

- At 136 px the hero's head reaches y 56, so when he stands at the persona in rooms 1 and 3 he is in front of
  the lower part of the wall display. That comes with the size Rick chose. Do not shrink him to avoid it.
- Room 1's CTO reads about 15% small beside him (art, left as is).

## Tests

- Python: the generator's existing tests at the new size (`tools/tests/test_hero_gen.py`): canvas size, every
  pose and option draws, the planted shoe's row, the palette; the mark table equals the tool's reduction of the
  official file.
- Unit: the game port equals every fixture byte for byte, both views (`tests/hero.test.js`,
  `tests/hero-side.test.js`); `clampWalk` and the stand points with the new width; a test that greps
  `js/` for a hard-coded 28 or 72 used as the hero's size.
- e2e: the creator still offers every option and its preview fits; the intro's bedroom plays through; scenario
  1 plays from the menu to the verdict with the new hero (walk to the computer, to the CTO, no overlap at
  667×375 and 844×390). Run the files one at a time.

## Hand-back

`handbacks/<date>-warp-era-hero.md` on the branch: what you built, the three suites' counts, a contact sheet of
every pose in both views for the five presets (`scratch/` is fine, say where), each stand point you moved, how
the bedroom looks at 0.85, and anything in the model sheet you could not reach in code.
