# Art brief 09: the sunrise (the street at dawn, the open door, the sun, the sunglasses)

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account. Rick art directs; his
direction beats this brief. Branch `art/the-sunrise` from `origin/era-look`; the pull request goes into
`era-look`.

Rick, 2026-11-18: "the sunrise animation and play more screen can be built."

## What happens in the game

The night ends. After Charity's verdict the building's door opens and the hero walks out onto the pavement
and stops. The sun comes up beside them and the street lightens. They turn to face us and put on sunglasses.
Three windows of narration go with it:

> Dawn. You walk out of the building. The street is the same street. You are not the same engineer.
>
> Somewhere a pager is quiet. Somewhere a dashboard is green and, for once, telling the truth.
>
> (the hero's name) puts on sunglasses. It's going to be a good day. Probably.

Warp is building this now against flat stand-in blocks (`assets/coda/`, drawn by `tools/build_coda.py` and
labelled STAND-IN). Your pictures replace them and the game does not change.

**What the game does itself, so you do not paint it:**

- The hero, walking and standing.
- The sun moving. You deliver the sun as its own small picture and the game slides it up from behind the
  horizon.
- The street getting lighter. Paint **one** picture, the last and lightest moment. Cloud Claude's build makes
  the three earlier, darker ones from it by recolouring, so they are the same picture pixel for pixel.
- The words.

## 1. The street at dawn: `E_dawn.png`, 640×400

The street outside the office building, just after sunrise, **with no sun in it**: the sun is separate. Warm
light from the right. The city is the game's own, the one outside room 1's windows and on the title screen.

What the game needs from it. Numbers are on the 640×400 plate; the layout is a target, the five rules are not.

| Where | What |
|---|---|
| Left third, x 0 to about 190 | The building's front, facing us: wall, and one **glass double door, shut**, about 104 wide and 248 high (x 56 to 160, y 116 to 364), its bottom on the pavement. A plain blank plate above it if you want a sign; nothing written. |
| Bottom, all the way across | The pavement, level, its near edge off the bottom of the picture. The hero's feet walk along y 372. |
| Right two thirds | The view down the street to the horizon, at about y 236: low and level. Above it, sky: a band of orange and gold on the horizon, rising through pink to a pale clear blue. |

The five rules:

1. **The door is taller than the hero.** He stands 232 px high on this plate. The door is at least 244.
2. **Nothing stands on the pavement where he walks**: from the door to x 600, the strip from y 330 to the
   bottom is clear. No lamp post, bin, bench or car in front of him.
3. **One clear stretch of sky for the sun**: somewhere right of x 360, a stretch of horizon at least 100 px
   wide that is flat and level, with nothing above it but sky to the top of the picture. No tower, wire, bird
   or cloud in that column. The sun comes up there, and anything in it would have the sun in front of it.
   Elsewhere the skyline can do what it likes.
4. **Room to stand beside the sun**: at least 160 px of pavement between the door's right edge and the left
   edge of that clear stretch. He stops there, and the sun rises next to him, not behind his head.
5. **The top 120 rows are quiet**: wall and sky, nothing the eye needs. The narration window sits there, at
   the top left.

No people, no moving cars, no words, digits or logos, no Honeycomb mark.

Start from this and adjust with Rick:

> A background painting for a 1990s point-and-click adventure game, painted at low resolution with a limited
> palette and visible pixels. Just after sunrise, a quiet empty city street seen from the pavement. On the left
> third, the front of a modern office building facing the viewer, with one tall glass double door, shut, and a
> plain wall. A wide level pavement runs across the whole bottom of the picture with nothing standing on it. On
> the right two thirds, the street runs away to a low flat horizon; above it a wide open sky, a band of orange
> and gold light along the horizon rising through pink to pale clear blue, with no sun visible and no clouds.
> A few distant dark glass towers at the far right edge only. Warm low light from the right on the building
> and the pavement, long soft shadows. Calm, empty, hopeful.
> No people, no cars, no text, no letters, no numbers, no logos.

References, ours only: `art-drops/2026-11-13-era-look-rooms/R1_exec_floor.png` (the city, the glass),
`art-drops/2026-11-17-title-screen/T_title.png` (the same city and your own sky), `assets/intro/D_bedroom_vga.png`
(the palette). At most 5 tries. **Stop and show Rick.**

## 2. The door open: `E_dawn_door.png`

The same picture with the door standing open and the dark lobby inside. Nothing else changes. Edit it or
draw it in code, as you did the title's lit pager; the build keeps only the pixels that differ.

## 3. The sun: `E_sun.png`, 80×80, clear background

Drawn in code, as the title's glow was. Rick, on that glow: "the banding fits better." A disc in two or three
hard steps, pale at the centre to orange at the rim, hard edged, nothing soft round it. The game shows it at
40×40 and slides it up.

## 4. The sunglasses: `HD_shades_front.png`, `HD_shades_side.png`

Made the way the glasses were (brief 06): from `HD_clean_front.png` and `HD_clean_side.png`, the same head at
the same size and place, now wearing **dark sunglasses**: the frame the outline's dark neutral, the lenses a
flat near-black, the eyes not showing. Nothing else about the head changes. The build lifts them off the
clean head as it lifted the glasses, so they go on every hair style.

At most 5 tries a view. **Stop and show Rick** both views at real size and at half size.

## Deliver

`art-drops/<date>-the-sunrise/` with the five files and `HANDBACK.md`: prompts, tries and picks, Rick's
reactions, anything edited by hand, and these facts measured at **320×200**:

- The door's rectangle, and whether its bottom is on the pavement.
- The row his feet should walk along, and anything standing on the pavement.
- The horizon's row, and the clear stretch of sky: its x from and to.
- What is in the top 60 rows.
- For the sunglasses: the rows where each painting ends, as you gave them for the glasses.

## Review (Cloud Claude, 2026-11-21)

Delivered in `art-drops/2026-11-19-the-sunrise/` and built in (`handbacks/2026-11-21-cloud-sunrise-art.md`). All
five files are used as delivered; nothing was redrawn.

- The street's three darker moments are this painting recoloured by `tools/build_coda.py`.
- The door is drawn in perspective, so the opening is 127 high where the hero stands in it and less to the right.
  He is shown at 0.8 (109 high) on this screen so that he fits.
- The sorting read the near-black lenses as dark skin and dark hair, which the game would have painted in the
  player's own colours. The build writes them as outline, so they are the same dark on everyone.
