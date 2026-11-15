# Art brief 04 — Rick's play-through of 2026-11-14: two whiteboard plates, shop products, a space battle, a phone, four brand marks

Read `briefs/art/PROTOCOL.md` first (**the worktree now lives inside the project folder, `.worktrees/art-<topic>`**).
For **Art Claude** on Rick's personal account. Rick art directs; his direction beats this brief. Branch
`art/feedback-1114` from `origin/era-look`. Everything is in the era look's hand: the style words that worked are
in `briefs/art/03-era-look-test.md`.

The five groups are independent. Do them in this order and show Rick each before the next. At most 5 tries a
picture.

## 1. Room 2: the whiteboard close-up without the sheet of paper (two plates)

Rick: "The 'theory' sheet is way too big and isn't working, drop. The theory can be just written on the
whiteboard pointing to things. Or just circled a bunch with ??? everywhere. After the 'win', it can look like it
was clearly wiped with a hand and the new theory was written in its place."

Both are edits of the approved `R2_wall_closeup` in `art-drops/2026-11-13-era-look-rooms/`.

- **`R2_wall_closeup.png`** (replaces the approved one): the same board with **no taped sheet of paper**. Where
  the sheet was, the diagram carries on: more boxes and arrows in the same three marker colours. Nothing else
  changes. The game circles things and writes the theories and question marks itself.
- **`R2_wall_closeup_fixed.png`**, edited from the new plate: a wide band across the middle of the board has
  been **wiped with a hand**. Inside it the board is smeared pale, with faint ghosts of the old marks and
  finger streaks at its edges; the mess is untouched above and below. Drawn fresh in the wiped band, one clean
  path: a few boxes in a row joined by arrows, traced over in yellow highlighter, as the approved fixed plate
  has it. No words.

Accept when: no sheet and no tape anywhere; the frame, the sticky notes and the marker tray are where they were;
the wiped band reads as a hand's work at 320×200, not as a white rectangle.

## 2. Room 3: what the shop sells (five sprites)

Rick: "The guitar image on the monitor looks absolutely awful. If we need to build a transparent sprite instead
of having it code drawn that's fine… Can we have it cycle through other instruments before it reaches the
guitar and stalls."

The shop is Twang & Co., an invented guitar maker. Five product pictures, as a shop would photograph them: the
instrument alone, lying at a slight angle, no hands, no stand, no text, no maker's mark on the headstock.

`S3_product_ukulele.png`, `S3_product_banjo.png`, `S3_product_acoustic.png`, `S3_product_bass.png`, and
`S3_product_southpaw.png`: a **left-handed electric guitar**, the mirror image of an ordinary one. It is the one
the page stalls on, so it gets the most care and a colour of its own.

Each: 220×140 PNG with a transparent background (the game shows it at 110×70), saturated, with a dark outline
so it reads on a pale page. All five the same scale and the same angle. Original instruments: no real maker's
body shape copied closely enough to name.

## 3. Room 4: a battle worth watching (sprites)

Rick: "The space battle looks super boring. It needs to be spiced up. We can do sprites if necessary but just
red dots is kinda bland."

For the wall of space (`R4_wall_closeup`, a dark star map). Tiny pixel sprites on transparent backgrounds,
delivered at twice the game size given here, all facing right (the game flips them):

| File | Game size | What |
|---|---|---|
| `S4_ship_a_small.png`, `_a_mid.png`, `_a_big.png` | 7×5, 11×7, 19×9 | one fleet: cool blue-white hulls |
| `S4_ship_b_small.png`, `_b_mid.png`, `_b_big.png` | the same | the other fleet: warm amber hulls |
| `S4_bolt.png`, `S4_missile.png` | 5×1, 5×3 | weapons fire |
| `S4_boom_1.png` … `S4_boom_4.png` | 11×11 | an explosion, four frames, small to large to smoke |
| `S4_warp_1.png` … `S4_warp_3.png` | 9×9 | the flash of a ship arriving |
| `S4_gate.png` | 23×23 | the fleet's gate: a ring the stuck ships keep trying to enter |

Original ships: simple, readable silhouettes of your own design, not any existing game's, film's or show's.

## 4. Room 4: the phone (one plate)

Rick: "The mobile phone graphic is pretty disappointing."

**`R4_phone_closeup.png`**, 640×400: a hand holding a phone up in the dark ops room, the screen facing us. The
game shows only a box of this picture, 188×176 at game size starting 4 px in and 20 px down, with its buttons
to the right of it: so keep the hand and the whole phone inside x 8–384, y 40–392 of the file and leave the
rest dark. On the screen: a contact page with a round blank avatar (a plain silhouette, nobody real), two blank
bars where a name and a line of text go, and a green call button. No words, digits or icons with letters. The
game writes the name and makes it ring.

## 5. Brand marks for the four old tools (four sprites)

Rick: "The competitor tools should have some sort of branding on their screens… Easy to miss them currently."

The tools are invented companies with joke names. Each gets a small mark that illustrates **its own name**, on
a transparent background, 128×128, that still reads at 16×16. No letters: the game sets the names in its font.

| File | Company | The mark |
|---|---|---|
| `M_cave_logs.png` | Cave Logs Inc. | a cave mouth with a neat stack of cut logs inside, drawn like a cave painting, ochre on dark stone |
| `M_old_artifact.png` | Old Artifact | a cracked clay amphora on a small museum plinth |
| `M_pretty_good_metrics.png` | Pretty Good Metrics | a prize rosette, the kind handed out for taking part, with a gauge face in its centre and the needle just past the middle |
| `M_doggy_dashboards.png` | Doggy Dashboards | a paw print whose four toe pads are round status lights, all green, and whose big pad holds a tiny bar chart; no dog's face or body |

**A hard rule for this group.** Rick asked whether these could be takes on real companies' logos. They cannot.
These are original marks for invented companies: do not look up, describe to the generator, attach or imitate
any real company's logo, mascot, colours or lettering, and discard any result that could be mistaken for one.
The joke is in our names.

## Deliver

`art-drops/<date>-feedback-1114/` with the files above and `HANDBACK.md`. For the code: at 320×200, the wiped
band's rectangle and the path's boxes on the fixed whiteboard; the phone screen's rectangle and each blank bar
and button on it; for every sprite, its exact size and whether any pixel is partly transparent (none should be).
