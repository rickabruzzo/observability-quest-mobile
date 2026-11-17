# Art brief 07 — The title screen: one painted picture, Space Quest's joke or King's Quest's promise

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account. Rick art directs; his
direction beats this brief. Branch `art/title-screen` from `origin/era-look`; the pull request goes into
`era-look`.

Rick, 2026-11-16: "Lets have Art Claude or Claude Design take a crack at the title screen. Again using SQ and KQ
as inspirations."

The title today is a placeholder: black, with two lines of type. It is the first thing a person sees after
scanning the code at the booth, and it has about two seconds to say *this is a 1990s adventure game, and tonight
you are on call*.

## What the game puts on the picture (you do not paint any of it)

- **The wordmark**, large in the upper half: OBSERVABILITY QUEST I, the blue chrome block letters you can see in
  `assets/title_screen.png`. It is bright blue with a dark edge, so it needs dark behind it.
- **The subtitle** under it, in the game's own type: *So you want to be on-call?*
- **A line of small print** along the bottom edge.
- Start and Sound are buttons in the columns beside the picture, not on it.

So the picture has **no lettering of any kind**, and two quiet places (measured on the 640×400 plate):

| Quiet place | Where | What may be there |
|---|---|---|
| For the wordmark and subtitle | x 40 to 600, y 20 to 210 | dark sky or dark air: stars, faint cloud, nothing bright, no hard edges |
| For the small print | the bottom 32 rows, y 368 to 400 | dark and plain |

Everything the picture is *about* sits between them, in the lower half.

## What those games' title screens do

Looked at and described in words; never used as art, never given to the generator.

- **One picture that promises the adventure**, with the logo big across the top over the quietest part of it
  (sky, space) and the subject in the lower half.
- **King's Quest** paints a storybook view with the place you are going far off in it: a castle on its rock, a
  road, the sea. It is earnest. The promise is *a long way to go, and worth it*.
- **Space Quest** paints the cosmos, vast and serious, and puts one small unheroic person's problem in it. The
  promise is *this will go badly, and it will be funny*.
- **Both are almost still**, with one or two small things alive: a star that twinkles, a light that blinks, a
  glint that runs across the logo.
- Our subtitle is the joke Hero's Quest made with its own ("So You Want to Be a Hero").

## Two pictures to try

**One plate of each, then stop and show Rick both.** He picks one, or sends one back, or asks for a third. At
most 5 tries a picture. Both are **night**: the sunrise is how the game ends.

### A. "Before the page" (Space Quest's joke)

The whole sky, the sleeping city, and one small pager about to ruin somebody's night.

We are at an open bedroom window, looking out. A huge night sky fills the top of the picture: deep blue-black,
many small stars, one faint band of cloud. Below it, along the lower third, the city from rooms 1 and 5: dark
glass towers, a few windows lit amber, small and far off. In the lower right corner, close to us and large, the
corner of the orange nightstand from the intro with **the intro's pager** lying on it: the same dark green
pager, its screen blank and **unlit**. (In the intro that screen lights up green and wakes the sleeper; here it
has not gone off yet.) A sliver of the lamp's base may show at the frame's edge. No person.

Start from this and adjust the style words with Rick:

> A title painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette
> and visible pixels. Night. A vast deep blue-black sky full of small stars fills the upper two thirds, with one
> faint band of cloud. Along the lower third, far away, a modern city skyline of dark glass office towers with a
> few small amber-lit windows. In the lower right corner, close to the viewer, the corner of an orange wooden
> nightstand seen from above and to the side; on it lies a dark green 1990s pager with a blank, unlit, dark
> screen. Nothing else in the foreground. Calm, still, a little ominous, a little funny.
> No text, no letters, no numbers, no logos.

Accept when: the upper half is calm enough to carry big blue letters; the city reads as the game's own city at
320×200; the pager is plainly a pager, plainly the intro's, and the thing the eye lands on; nothing in the
bottom 32 rows but nightstand and dark.

### B. "The road to the castle" (King's Quest's promise)

The storybook view, with a data centre where the castle should be.

A wide night landscape. Far off on a hill stands a data centre drawn as a fairy-tale castle would be: a great
windowless block with cooling towers and antenna masts for turrets, rows of tiny green and amber status lights
for windows, a dark storm cloud sitting over it. A road lined with small orange lamps winds toward it from the
front of the picture. At the lower left, small and seen from behind, one figure stands at the start of the
road: a dark hoodie with the hood down, a backpack, hands at their sides. No face, nothing on the hoodie, and
dark enough to be anybody. The sky above is deep blue-violet with stars and the far glow of a city on the
horizon.

> A title painting for a 1990s point-and-click adventure game, painted at low resolution with a limited palette
> and visible pixels, in the manner of a storybook landscape. Night. A deep blue-violet sky with small stars
> fills the upper half. In the distance on a hill, a large modern data centre building standing like a castle:
> a huge windowless block with cooling towers and antenna masts like turrets, rows of tiny green and amber
> lights, and a dark storm cloud above it. A winding road lined with small orange street lamps leads toward it
> from the foreground. At the lower left, small, seen from behind, a lone figure in a plain dark hoodie with a
> backpack stands at the start of the road. No face visible. Earnest and grand, with the joke that the castle
> is a data centre.
> No text, no letters, no numbers, no logos.

Accept when: it reads as *castle* first and *data centre* second; the figure is small, from behind, and nobody
in particular; the road leads the eye from the figure to the building; the upper half carries the letters; the
bottom 32 rows are dark ground.

## Then, for the one Rick picks

1. **The plate** is `T_title.png`.
2. **Two edits of it, each changing one thing**, so the game can keep the picture alive:

   | Picked | Edit | The one thing that changes |
   |---|---|---|
   | A | `T_title_light.png` | the pager's screen is **lit**, the intro's bright green, still blank, with its green glow on the nightstand |
   | A or B | `T_title_stars.png` | about a dozen stars, spread over the sky, one step brighter; nothing else |
   | B | `T_title_flash.png` | lightning: one fork from the storm cloud, the cloud's underside and the near edges of the building lit |

3. **A glint**, if Rick wants one: `T_glint_1.png` to `T_glint_4.png`, a four-frame sparkle, white with a
   little blue, each 22×22 on a transparent background (the game shows it at 11×11 and runs it across the
   wordmark). Small to large to gone.

## Rules

- **The hand is the game's own**: the era-look rooms and the intro's bedroom. The style words that worked are in
  `briefs/art/03-era-look-test.md`. Give the generator **our own plates** as references and nothing else:
  `art-drops/2026-11-13-era-look-rooms/R1_exec_floor.png` (the night city, the window light),
  `assets/intro/B_nightstand.png` (the pager and the nightstand), `assets/intro/D_bedroom_vga.png` (the
  palette).
- **Original.** No screenshot from any game goes to the generator, and nothing is traced or copied: no existing
  game's castle, ship, character, logo, lettering or interface.
- **No words, digits or logos**, as always. No Honeycomb mark, and no hexagons arranged so that they read as
  one: the game adds the official logo itself.
- **Nobody real**, and no face at all in B.
- 640×400 PNG, cropped and resized the usual way.

## Deliver

`art-drops/<date>-title-screen/` with `T_title.png`, its edits, the glint frames if made, and `HANDBACK.md`.
If Rick wants to keep the picture he did not pick, add it as `T_title_other.png` and say so.

Facts the code depends on, measured at **320×200**:

- The rectangle that is truly quiet enough for the wordmark and subtitle, if it differs from x 20 to 300,
  y 10 to 105. Say what is in it (stars only, cloud, a tower top).
- How many rows at the bottom are dark and plain.
- For each edit: the region that differs from the plate. For the pager: its screen's rectangle and how far
  the glow reaches.
- Anything in the picture Rick would like the game to move that this brief did not ask for.
