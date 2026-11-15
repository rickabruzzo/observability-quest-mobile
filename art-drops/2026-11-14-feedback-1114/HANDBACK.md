# Art drop: feedback from Rick's play-through (2026-11-14)

For **Cloud Claude**. From `briefs/art/04-feedback-plates-sprites-and-marks.md`. Branch `art/feedback-1114` from `origin/era-look`. Rick saw and OK'd groups 1–4 one at a time; group 5 is shown with this drop.

## 1. Room 2 whiteboard (replaces the era-look ones in `art-drops/2026-11-13-era-look-rooms/`)

| File | What |
|---|---|
| `R2_wall_closeup.png` | The board with **no sheet and no tape**. The diagram carries on where the sheet was. The game circles things and writes the theories and `???` itself. |
| `R2_wall_closeup_fixed.png` | After the win: a band **wiped by hand** (pale smear, ghost marks, finger streaks, ragged edges) with one fresh path of five boxes and arrows traced in yellow highlighter. No words. |

At 320×200, about ±3 px:
- **Wiped band:** x 29–300, y 56–142 (ragged; this is its bounding box). Everything outside it is identical to `R2_wall_closeup`.
- **Path boxes, left to right** (each about 14 wide × 14 tall, centres on y ≈ 106): x 80–95, 112–130, 151–168, 187–207, 223–239.
- **Writing space** for the theories: plenty of board between the boxes, as Rick asked ("written on the whiteboard pointing to things"). There's no reserved area.

## 2. Room 3 shop products

`S3_product_ukulele.png`, `_banjo.png`, `_acoustic.png`, `_bass.png`, `_southpaw.png`.
- **Format:** 220×140, transparent background, **no partly transparent pixels**, with a 1 px dark outline (#1A1424) round each. Shown at 110×70.
- **Pose:** all at the same angle (body lower left, neck to upper right) and fitted to the same box.
- **`S3_product_southpaw`** is the star: a metallic sea-foam teal sparkle **left-handed** electric (checked upright: its controls and cutaway are on the left).
- **Original shapes:** a first bass that came out as a recognisable Fender Precision, and a southpaw take that was a Stratocaster copy, were both rejected.
- **Suggested cycle on the page:** ukulele → banjo → acoustic → bass → southpaw (stall).

## 3. Room 4 battle sprites

**Delivered at 2× the game size; draw at 1×.** No partly transparent pixels anywhere. All face right.

| File | Game size | File size |
|---|---|---|
| `S4_ship_a_small`, `_a_mid`, `_a_big` (blue-white darts, cyan engines) | 7×5, 11×7, 19×9 | 14×10, 22×14, 38×18 |
| `S4_ship_b_small`, `_b_mid`, `_b_big` (amber hammerheads, red thrusters) | 7×5, 11×7, 19×9 | 14×10, 22×14, 38×18 |
| `S4_bolt` | 5×1 | 10×2 |
| `S4_missile` | 5×3 | 10×6 |
| `S4_boom_1` … `_4` (flash, fireball, burst, smoke with embers) | 11×11 | 22×22 |
| `S4_warp_1` … `_3` (streak, starburst, fading ring) | 9×9 | 18×18 |
| `S4_gate` (segmented ring, green beacons, purple-blue swirl) | 23×23 | 46×46 |

Hand-placed pixel by pixel (no generator), so the sizes are exact and the designs are original. Script: `scratch/fb1114/s4.py`.

## 4. Room 4 phone

`R4_phone_closeup.png`, 640×400. The hand and the whole phone sit inside x 8–384, y 40–392 of the file; the rest is solid dark (#0A0C14). In the game's 188×176 box (file coords ÷ 2, box origin 4, 20), at 320×200 / full-file ÷ 2:
- **Screen** (pale #E1E4E9): x 63–132, y 35–180
- **Avatar circle** (blank grey silhouette): x 78–117, y 52–84
- **Bar 1** (name): x 67–128, y 99–109
- **Bar 2** (line of text): x 67–128, y 113–123
- **Green call button:** x 88–107, y 150–170 (centre about 97, 160)

No words, digits or lettered icons. The game writes the name and makes it ring. Light-skinned hand, to match the SRE.

## 5. Brand marks (shown to Rick with this drop)

`M_cave_logs.png`, `M_old_artifact.png`, `M_pretty_good_metrics.png`, `M_doggy_dashboards.png`.
- **Format:** 128×128, transparent, no partly transparent pixels, the mark inside a 4 px margin. Checked shrunk to 16×16.
- **Cave Logs:** a stone cave mouth with stacked cut logs.
- **Old Artifact:** a cracked terracotta amphora on a plinth.
- **Pretty Good Metrics:** a blue participation rosette with a gauge, its needle just past the middle.
- **Doggy Dashboards:** a paw print whose toes are green status lights, with a rising bar chart in the big pad; no dog face.
- **No letters.** Original marks, made from text only. No real company's logo was looked up, described or attached. The game sets the company names in its own font.
- **At 16×16,** Cave Logs and Old Artifact read best; the rosette and the paw read by shape and colour.

## Provenance

Gemini API `gemini-3.1-flash-image`, company-card project, 2026-11-14. Scripts: `scratch/fb1114/edit.py`, `gen2.py`, `gen4.py`, `gen5.py`, and `s4.py` (hand-drawn). Every try is in `scratch/fb1114/tries/`.
- **Group 1:** sheet removal, 2 tries (t2, composited only where the sheet was; two leftover tape corners painted out). Wipe, 3 tries (t2, composited inside the band).
- **Group 2:** 2 tries each plus 2 for the bass. Kept: uke t2, banjo t2, acoustic t2, bass2 t2, southpaw t1. Keyed from a flat magenta background, downscaled, outlined.
- **Group 4:** 3 tries (t3; three extra grey boxes painted out).
- **Group 5:** 2 tries each. Kept: cave t1, artifact t1, metrics t1, doggy t2. Artifact t2 was rejected because it drew a frame.
