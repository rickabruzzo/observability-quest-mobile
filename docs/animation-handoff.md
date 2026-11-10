# Scene & portrait animation — handoff

Status as of 2026-11-09. All Gemini work is finished; no further step below needs the Gemini API.
Remaining work (compositing, data, JS) is to be done from the company Claude account.

## Rick's direction (approved concept)

Animations are a code-driven layer drawn over the approved still art. The approved PNGs stay the base;
nothing about the stills is re-approved except new frames listed under "New art".

| Scene | What moves |
|---|---|
| Title | Stars twinkle, slow glow pulse on the logo, shimmer along the orange horizon line |
| S1 LLM server room | Text scrolling on the monitors, one screen glitching now and then, status LEDs blinking, character idling (small bob). **Plus:** a few light flashes travelling through the cables at the top |
| S2 Microservices | Request dots flowing from the cloud down the lines to the services; one service flashes red occasionally |
| S3 E-commerce | Product panel cycles **drum kit → keyboard → guitar**. Drum kit and keyboard: progress bar loads to 100%, right panel shows **SOLD**. Guitar: bar crawls and stalls at 13%, right panel shows the existing WARNING / page-load times |
| S4 Tool spaghetti | Panels/alerts flashing out of sync, the "!!" above the character bouncing. **Plus:** flashes of light travelling through the tubes |
| S5 Payments | Coins start **silver**. Data moves left→right; each coin in turn pops up, spins, turns **gold**, lands and twinkles. **PAY2 wobbles and its coin turns copper** |
| Portraits | Occasional blink; mouth flaps while the narrator text types out |

Open decision (Claude's default, Rick can override): after PAY2 turns copper, the BANK coin turns gold after a longer pause.

## Rendering approach (recommended)

- One canvas at 640×428 (the export size). Art pixels are ~2 px, so snap all overlay drawing to a 2 px grid (320×214 logical cells).
- Draw order per frame: clean plate → animated sprites/overlays. Then scale the whole canvas to phone width (spec: fill width, fractional scale OK) with `image-rendering: pixelated`. Drawing before scaling keeps overlays on the same grid as the art.
- Step the animation at 8–12 fps (quantise time) for the 1989 feel.
- `prefers-reduced-motion: reduce` → draw the still image only.
- "Clean plates" = the still with the moving parts removed (e.g. S5 without coins/PAY2 box, S4 without "!!"). Background behind S5 coins/PAY2 is pure black; small areas elsewhere can be filled with `cv2.inpaint` (OpenCV is available in the cloud workspace).

## Coordinates found (640×428 export space)

**S5 payments** — coins (x0,x1,y0,y1): USER 70–101, APP 189–220, PAY1 305–337, PAY2 424–455, BANK 540–572, all y 216–243. PAY2 box: x 391–484, y 135–210 (arrow into it ends at x 389, arrow out starts at x 485). Coin shadow dither band: y 240–287. Coin sprite idea: cut the existing gold coin; silver = desaturate + cool tint; copper = hue shift; spin = horizontal squash 100/66/33/edge/33/66 %.

**S1 LLM** — monitor screens: x 87–160, 198–271, 309–383, 422–495, 533–606; y 133–196. Large orange LEDs (≈6×7): x 138, 248, 361, 473, 585 at y 238; small LEDs on the bezels around y 195–212. Character: x 107–142, y 238–300. Cables: blue pixels in y < 105 (exclude x < 62, the wall edge).

**S2 microservices** — routes (polyline points), cloud → service:
- Auth (165,141)→(105,141)→(105,194)
- Payments (197,144)→(197,194) and (271,144)→(271,193)
- Orders (359,144)→(359,194) and (441,144)→(441,194)
- Inventory (482,141)→(538,141)→(538,194)
- Auth→Billing (103,256)→(103,285)→(82,285)→(82,306); branch (103,285)→(191,285)
- Payments→Notifications (191,256)→(191,306) and (271,256)→(271,300)
- Orders→Catalog (387,256)→(387,306)
- Inventory→Shipping (531,256)→(531,286)→(559,286)→(559,306); branch (531,286)→(432,286)→(432,306)

Lines are ~4 px wide light blue (≈ rgb 40,160,250). Verify each against the image before shipping.

**S3 e-commerce** — left product panel inner area ≈ x 24–206, y 92–300 (product + price; BUY NOW at y ≈ 305–340). Progress bar frame ≈ x 232–392, y 148–172 (fill is orange, "13%" text at y ≈ 180–196). Right black screen ≈ x 425–593, y 100–348 (warning triangle, WARNING!, page-load times).

**S4 spaghetti** — panel rects (x0,y0,x1,y1): LOGS 100,80,224,145 · APM 251,80,377,144 · METRICS 404,80,532,145 · DASH 99,168,224,232 · TRACES 250,167,377,232 · ALERTS 404,168,532,231 · SIEM 99,254,224,321 · LOGS2 250,254,377,321 · INFRA 404,253,532,321. "!!" ≈ x 522–560, y 288–318 (overlaps the INFRA panel's corner). Character below it, x ≈ 505–580, y 315–412.

**Title** — logo y ≈ 175–315, horizon line y ≈ 320–326 (orange), stars = isolated bright pixels in the sky above y 320.

## Data already extracted (`scratch/anim_data/`)

- `s1_paths.json`, `s4_paths.json` — cable/tube strands for the light flashes. Each path is a list of `[x, y]` cells on the **320×214 logical grid** (multiply by 2 for export pixels), ordered along the strand. A flash = light the cells around a moving index (bright head, short fading tail). S4 also includes the panel rects.
- `paths.py` — the skeleton-walk code that produced them (scikit-image + numpy), for regenerating or adding S2 strands.

## New art (Gemini 3.1 Flash Image edits, raw outputs in `scratch/anim_gen/`)

All are full-frame edits of the approved images (1264×848). **Gemini redraws the whole frame**, so composite only the changed region back onto the approved art, as done for the s2 label fix: resize to 640×428, find the small x/y offset that best aligns the region, then paste just that region.

| File | Use | Region to composite |
|---|---|---|
| `s3_drums_1.png` (**pick**) | S3 product: drum kit, $899 | left panel product + price |
| `s3_keys_1.png` (**pick**) | S3 product: keyboard, $649 | left panel product + price |
| `s3_drums_2.png`, `s3_keys_2.png` | alternates (drums #2 rejected: odd bass-drum head) | — |
| `<name>_blink.png` × 5 | eyes closed | eye band only |
| `<name>_talk1.png` × 5 | mouth slightly open | mouth/jaw only |
| `<name>_talk2.png` × 5 | mouth open wide | mouth/jaw only |

Names: christine, emily, graham, matt, charity. Christine's talk1 barely differs from her still; use talk2 plus the still, or a 2-frame flap. Graham's talk frames shift skin tone slightly; keep the composite region tight.

Prompts used are in `scratch/anim_gen/gen.py`.

## Still to do (company account)

1. Composite the picks above into sprite frames; build clean plates.
2. Build the canvas animation layer and a preview page showing every scene and portrait.
3. Check visually, then record the new frames in `ASSET_PROMPTS.md` and add the animation decision to the design spec.

## Not possible without Gemini

- **Jessitron blink/talk frames**: wait for Jess's pick; needs Gemini edits (or hand-pixelling in Aseprite) from Rick's personal setup.
- Any regeneration of S3 products or portrait frames.
