# Hand-back: brief 09, the sunrise (2026-11-19)

For **Cloud Claude**, from Art Claude. Branch `art/the-sunrise` from `origin/era-look`; the PR goes into
`era-look`.

## Files

| File | Size | What |
|---|---|---|
| `E_dawn.png` | 640×400 | The street just after sunrise, with no sun. A glass-grid office building on the left with a glass double door, shut. A wide pavement and a flat horizon. Sky from orange-gold through pink to pale blue. Two distant towers at the far right. |
| `E_dawn_door.png` | 640×400 | The same picture with the doorway open onto the dark lobby. Only the doorway differs. |
| `E_sun.png` | 80×80, RGBA | Drawn in code. A disc in three hard steps (pale centre `#FFE18C`, gold `#FFAA3C`, orange rim `#F07828`), with a one-pixel checker at each step edge like the title's glow. Hard edged, no halo. |
| `HD_shades_front.png` | 112×288 | `HD_clean_front` wearing dark sunglasses: the frame in the outline's dark neutral, the lenses flat near-black. |
| `HD_shades_side.png` | 112×288 | The same, side view. |

## Rick's calls

- **The street:** "right for ending. building looks more like an office." That is **try 2**.
  - Try 3 was calmer, but its door was about 230 tall, shorter than the hero's 232.
  - Two edits did not make it taller, so that picture was used up at 5 tries.
- **The sunglasses:** "I can't even tell the diff." The picks stand: front t3, side t2.
- **The sun and the horizon:** "that's not how the sun works in regards to horizons", on Art Claude's first mock,
  which drew the whole disc over the ground. **The sun must be clipped at the horizon:** draw only the part above
  the horizon row and slide it up from behind. `sunrise_mock` in the PR description shows it done right.

## Facts, at 320×200

Values at 640×400 are in brackets.

- **The horizon:** **y 115** (640: 230) is the first ground row; the sky ends at y 114. In the clear stretch the
  horizon is flat and level.
  - **Clip the sun to y < 115.** In the clear stretch nothing but sky stands above the horizon, so the row alone is
    enough. No mask is needed.
- **The clear stretch of sky:** **x 123 to 297** (640: 246–594). Every column there is pure sky from the top
  down to the horizon.
  - **Where the sun goes:** brief rule 4 wants 160 px (640) between the door's right edge and the sun. Keep the
    sun's left edge at x 155 or more at 320.
  - **As mocked:** the sun's centre at **x 225** (640: 450), the hero standing at about x 132.
  - **Size:** the sun shows at 40×40, so it rises from y 115 until its bottom edge is level with the horizon.
- **The door:**
  - **Where:** x 10 to 75, y 47 to 176 (640: x 20–150, y 95–352).
  - **Perspective:** it is drawn in slight perspective, so its bottom edge runs from y 176 at the left to about
    y 163 at the right (640: 352 to 326).
  - **The doorway's dark opening** in `E_dawn_door`: x 13–66, y 45–175 (640: 26–131, 90–350).
  - **Bottom on the pavement:** **yes.**
  - **Height:** about 128 at 320 (255 at 640), against the hero's 116 (232). It passes rule 1.
- **The edit region:** `E_dawn_door` differs from `E_dawn` only within x 4–80, y 44–183 (640: 9–160, 89–365).
- **Where his feet walk:** **y 186** (640: 372) is pavement.
  - **Nothing stands on the pavement:** only painted tile lines, cracks and a diagonal kerb line toward the right.
    The strip y 165 to the bottom is clear from the door to x 300.
- **The top 60 rows:**
  - **Left, x 0 to 122:** the building's glass curtain wall, a grid of window panes reflecting the sky, and the
    blank sign band.
  - **Right of that:** plain sky.
  - **Under the narration window:** the panes are mid-blue and fairly busy behind white text, so the window needs
    its own solid fill.
- **The sunglasses, rows each painting changes** against `HD_clean_*` (at 112×288):
  - **front:** rows 38 to 50;
  - **side:** rows 37 to 51.

  Nothing below row 51 changes, so lift them off the clean head as the glasses were.

## Hand edits

- **`E_dawn_door`:** a Gemini edit of the plate, with only the door region pasted back.
  - **The paste mask:** pixels differing by more than 45, inside x 10–160, y 90–365, MaxFilter(7) then MinFilter(3).
  - **Picked:** t2 of 3, which had the least change outside the door. t1 and t3 showed a swung leaf that the paste
    box cut straight.
- **The sunglasses:** Gemini edits of the clean head at full resolution, with only the changed pixels pasted back
  onto `HD_clean_*` in its exact frame, the brief 06 method.
- **`E_sun`:** entirely code.
- **The crop:** Gemini's 1376×768 output, centre 1229×768, NEAREST to 640×400.

## Tries

| Picture | Tries | Pick |
|---|---|---|
| street | 3, then 2 edits of t3 | **t2** (Rick). t1 had a satellite in the sky and a short door. t3's door was too short, and the edits didn't move it. |
| sunglasses front | 3 | **t3**: the solidest black lenses |
| sunglasses side | 3 | **t2** |
| door open | 3 | **t2** |

Model `gemini-3.1-flash-image`: 16:9 for the street, 9:16 for the heads.

## Prompts, exactly

### The street
Attached: `art-drops/2026-11-13-era-look-rooms/R1_exec_floor.png`, `art-drops/2026-11-17-title-screen/T_title.png`,
`assets/intro/D_bedroom_vga.png`.
```
The attached pictures are scenes from the same game: paint in exactly their hand, palette and amount of detail; the first two show the game's own city. Do not copy their framing. A background painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette and visible pixels. Just after sunrise, a quiet empty city street seen from the pavement. On the left third, the front of a modern office building facing the viewer, with one tall glass double door, shut, reaching from the pavement to well over a person's height, and a plain wall; a plain blank panel above the door with nothing written on it. A wide level pavement runs across the whole bottom of the picture with nothing standing on it: no lamp posts, no bins, no benches. On the right two thirds, the street runs away to a low flat horizon a little below the middle of the picture; above it a wide open sky, a band of orange and gold light along the horizon rising through pink to pale clear blue, with no sun visible and no clouds. A few distant dark glass towers at the far right edge only; the middle of the horizon is completely flat and empty with only sky above it. The top of the picture is plain sky and plain wall. Warm low light from the right on the building and the pavement, long soft shadows. Calm, empty, hopeful. No people, no cars, no text, no letters, no numbers, no logos.
```
### Taller door, edit of t3 (2 tries, not used)
```
Edit this picture. Change only the glass double door on the building at the left: make it taller, so that it reaches all the way down to the pavement at the very bottom of the building and up to just under the blank panel above it, about one and a half times its present height, the same width, still shut, the same glass, frame and handles. Lower the building's dark base so the door's bottom meets the pavement. Keep everything else exactly the same, pixel for pixel: the sky, the horizon, the distant towers, the pavement, the light and shadows, the blank panel and the wall. No people, no text, no letters, no numbers, no logos.
```
### The door open (edit of t2)
```
Edit this picture. Change only the glass double door on the building at the left: both door leaves now stand wide open, swung inwards into the building, and through the open doorway we see the dark, unlit lobby inside, deep shadowy blue-grey with only a faint hint of a floor. Keep everything else exactly the same, pixel for pixel: the door frame, the building's walls and windows, the sky, the horizon, the distant towers, the pavement, the light and shadows. No people, no text, no letters, no numbers, no logos.
```
### Sunglasses
Front and side use the same words. Attached: the clean face, `scratch/hero06/clean_front_raw.png` or
`clean_side_raw.png`.
```
Edit this picture. It is a pixel-art game character painted in flat colour families on a flat yellow background. Change only one thing: give him a pair of dark sunglasses. The frame is a dark neutral grey, almost black, the same colour as his outline; the lenses are flat, solid near-black, so his eyes do not show at all; the arms of the sunglasses run back to his ears. Use no other colour for the sunglasses, no shine, no reflection. Keep everything else exactly the same: the same pose, the same size and position in the frame, the same face, hair, ears and neck, clean-shaven, the same hoodie, jeans, shoes and flat yellow background, pixel for pixel. No text, no letters, no logos.
```

No people (other than the hero's own head), words, digits, logos or Honeycomb mark in any picture.
