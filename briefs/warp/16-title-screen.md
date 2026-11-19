# Warp brief 16: the title screen

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/title-screen` from
`origin/era-look`; the pull request's base is `era-look`.

## Why

The title is still a placeholder: black, two lines of type. Rick, 2026-11-16: "Lets have Art Claude or Claude
Design take a crack at the title screen. Again using SQ and KQ as inspirations." Art Claude painted it (art
brief 07) and Rick picked picture A, "Before the page": the night sky over the game's city from an open
bedroom window, and the intro's pager on its nightstand, not gone off yet. His other calls, in his words:

- On the wordmark's glow: "the banding fits better. it can ever have some needless aliasing checker pattern at
  the edge to fit the genre better."
- On the subtitle: "Subhead needs to be larger if its gonna be legible on mobile."
- On the sparkle (2026-11-18): "I asked for glints on the title."

What those title screens do, and what this one does: one picture, almost still, the logo big across the quiet
sky, and one or two small things alive. Here the stars twinkle, the logo's glow breathes, glints run across
its letters, and the pager goes off when you press Start.

`title-screen-as-briefed.png` and `title-screen-with-glint.png` (sent to Rick) are the screen below, mocked on
the real page; the second has one glint at its largest.

## A. What is built

`assets/title/` and `assets/title/title.json` (`tools/build_title.py`; do not edit or rebuild). Every number in
the manifest is in the game's 320×200 pixels.

| File | Size | What |
|---|---|---|
| `T_title.png` | 320×200 | The picture, pager dark. No lettering. |
| `T_pager_lit.png` | 104×49 | The pager gone off: opaque only where it differs from the picture (the lit screen, the glow on the nightstand), clear everywhere else. Draw it at `pager.x, pager.y`. |
| `T_wordmark.png` | 194×68 | The letters OBSERVABILITY QUEST I, the game's own `wall_logo`, with a clear 8-pixel margin. |
| `T_wordmark_glow.png` | 194×68 | The glow Rick chose, the same size, to sit under the letters. Three hard steps of one blue with checker edges. |
| `T_glint.png` | 88×22 | The glint: four frames side by side, 22×22 each, small, larger, largest, small again. |

```
layer    { x: -8.5, y: 5, w: 291, h: 102, scale: 1.5 }   where both wordmark layers go
letters  { x: 3.5, y: 17, w: 267, h: 78 }                the letters inside them
pager    { x: 213, y: 114, w: 104, h: 49 }               where T_pager_lit goes
screen   { x: 245, y: 128, w: 42, h: 18 }                the pager's screen
stars    [ { x, y, on, cross, arm? } × 12 ]              the stars that twinkle
glint    { frames: 4, size: 22, points: [ [x, y] × 9 ] }  where a glint plays: the centre of its frame, in the
                                                         wordmark layer's own 194×68 pixels, not the picture's
quiet    { x: 20, y: 5, w: 250, h: 73 }                  sky with nothing in it but stars
frame    { x: 275, w: 13 }                               the window's frame, a hard edge
print    { x: 8, w: 182 }                                the dark stretch of the bottom rows
```

**The wordmark is 1.5 game pixels to a letter pixel.** That is the size Rick approved, and it cannot be drawn
into the 320×200 canvas without making some letter pixels one wide and some two. So the wordmark is not drawn
on the canvas: it is two `<img>` layers over the picture (C).

## B. The picture (canvas)

1. On entering, draw `T_title.png` at 0, 0. Until it has loaded the canvas is black.
2. **Stars.** Each of the twelve twinkles by itself: on for about 400 ms, then off for 3 to 6 s, its own
   rhythm from its index (a hash, not `Math.random`, so a test can ask what is on at a given time). Never more
   than three on at once.
   - On: the pixel at `(x, y)` in `on`; if `cross`, the four pixels beside it in `arm`.
   - Off: the picture's own pixels back (redraw that 3×3 from `T_title.png`). Every star is already in the
     picture; the twinkle only brightens it.
3. **The pager is dark** for as long as the title waits. See D.
4. With `ctx.reducedMotion`: no twinkle.

## C. Over the picture (the overlay)

Everything here is positioned in per cent of the scene box, so it holds at every screen size. Use the
manifest's numbers; do not hard-code them.

1. **The glow**, then **the letters** on top of it: two `<img>`, both at `layer` (left `x/320`, top `y/200`,
   width `w/320`, height `h/200`), `image-rendering: pixelated`. The glow runs off the left edge; the scene box
   already clips it.
   - The glow breathes: its opacity goes 1.0, 0.9, 0.8, 0.7, 0.8, 0.9 and round again, one step every 500 ms.
     Set it from the screen's `tick`; no CSS transition, the steps are meant to show.
   - With `ctx.reducedMotion`: steady at 1.0.
   - The letters' `alt` is `Observability Quest I`; the glow's is empty.
2. **The glints**: a sparkle on a light edge of a letter, one at a time, running across the wordmark.
   - One element over the letters. **A glint pixel is the size of a letter pixel**, so its arms are as thick
     as the letters' edges: put it in the same box as the two layers, `size/194` of that box wide and
     `size/68` high, its top left at `(x − 11)/194`, `(y − 11)/68` of the box for the point `[x, y]`.
     `image-rendering: pixelated`. Show one frame of `T_glint.png` at a time.
   - Do not clip it to the layers' box: the first point's top arm reaches a pixel above it.
   - A pass: the nine points in order, a new glint every 450 ms. Each glint shows frames 1, 2, 3, 4 for 90 ms
     each and is gone. The first pass starts 1.5 s after the title appears, and a pass starts every 8 s.
   - With `ctx.reducedMotion`: no glints.
3. **The subtitle**, *So you want to be on-call?*, one line, the game's read font:
   - `font-size: calc(var(--scene-h) * 0.115)`, `line-height: 1`, `white-space: nowrap`, colour `#DCF0FF`,
     a hard shadow of one game pixel down and right in black (`calc(var(--scene-h) / 200)`).
   - Centred on the letters: left `letters.x/320`, width `letters.w/320`, `text-align: center`.
   - Its box's top at 47.25 % of the scene's height.
   - Why these numbers: the letters end at y 95 and the nightstand's top edge is at y 116 from x 214 on. At
     this size and place the type runs y 100 to 113 (the y of "you" reaches 116, over the city) and x 18 to
     255: five pixels under the letters, three above the nightstand, left of the window frame. It is the
     largest one centred line that touches neither. On an 844×390 phone it is 42 px type.
4. **The small print**, bottom left: one block, its left at `print.x/320`, its bottom 2 % above the scene's
   bottom edge, two things stacked with a gap of 0.015 of the scene's height:
   - **The Honeycomb logo**: `assets/hc_logo_white.png`, the official file, as an `<img>` with
     `alt="Honeycomb"`, 7 % of the scene high, `image-rendering: auto`. Never drawn, recoloured or generated.
     (The file is 163×48 and will be a little soft on a phone; Rick has been asked for the official SVG. If it
     arrives, it is a change of `src`.)
   - **The credit** the README has promised here since the first build: the script's `title.credit`, in two
     lines, broken after "(CC BY-SA)." Split it in code at that sentence's end; the script is generated
     from `script/script.md` and is not edited. The read
     font, `font-size: calc(var(--scene-h) * 0.046)` (16 px on the smallest phone we test), `line-height: 1`,
     `white-space: nowrap`, colour `var(--dim)`.
   - The block then fills x 8 to 181, y 161 to 196: the dark stretch left of the nightstand.
5. Start and Sound stay where they are, in the side columns.

## D. Start: the page arrives

Pressing Start is the page. Inside the tap, as today: `ctx.fullscreen?.()`. Then:

| At | What |
|---|---|
| 0 ms | The pager lights: draw `T_pager_lit.png`. The intro's beep (`createSfx({ sound: ctx.sound })`, `unlock()` inside the tap, then `beep()`). Start is disabled. |
| 300 ms | A second beep. The pager stays lit. |
| 600 ms | `game.go('CREATOR')`. |

- Nothing flashes, so reduced motion needs no other path.
- A second tap during those 600 ms does nothing.
- If the art has not loaded, Start goes to the creator at once, as today.
- Every browser test that clicks `#btn-start` and expects the creator in the same breath now has to wait for
  it. `tests/e2e/_play.js` is the place for most of them.

## E. When something is missing

The title is the first thing a visitor sees on a conference network. If `title.json`, the picture, the lit
pager or either wordmark layer fails or takes more than 6 s (as `preloadIntro` does it), show today's
placeholder: the black card with the title lettered in type. If only the glint's picture fails, show the title
without glints. Start works either way.

## F. What goes

- The placeholder's drawing in `js/screens/title.js` stays only as E's fallback.
- `js/anim/title.js` is the v0.1 title's animation. If nothing imports it, delete it.
- `assets/title_screen.png` stays: `tools/build_intro.py` cuts the wordmark from it.

## Tests

Pure functions, in a new `js/title/timeline.js`, with unit tests written first:

- `starsOn(t)`: which of the twelve are on at time `t`. Each star is on about 400 ms in every cycle of its own;
  over a minute every star has been on; never more than three at once; the same `t` gives the same answer.
- `glowAt(t)`: 1.0, 0.9, 0.8, 0.7, 0.8, 0.9 by 500 ms steps; 1.0 with reduced motion.
- `glintAt(t)`: `{ point, frame }` or nothing. Nothing before 1.5 s; then point 0's four frames by 90 ms,
  point 1 from 450 ms later, and so on to point 8; nothing for the rest of the 8 s; then again. Never two at
  once. Nothing with reduced motion.
- `startBeat(t)`: `{ lit, beeps, go }` for the time since the tap: lit from 0; one beep by 0, two by 300; go
  at 600.

In a browser (`tests/e2e/title.test.js`), at 844×390 and 667×375:

- The canvas shows the picture: a sky pixel, an orange nightstand pixel, and the pager's screen dark.
- Both wordmark layers are loaded, at the manifest's `layer` within a CSS pixel, the glow under the letters.
  The letters' right edge is left of `frame.x`.
- The subtitle's type is 0.115 of the scene's height, in one line, inside the scene, and its box does not
  touch the pager's `screen` rectangle or the small print.
- The logo is the official file, inside `print`'s stretch, at least 24 CSS px high. The credit is the script's
  words in two lines, at least 16 CSS px type, inside `print`'s stretch, under the logo.
- Over two seconds the glow's opacity takes at least three different values, all from the list.
- Over the first six seconds a glint has shown at five or more of the nine points and in all four frames,
  each time with its centre on the manifest's point within a CSS pixel, and it is whole inside the scene.
- Start: within 100 ms the centre of the pager's screen is `#06F805` and one beep has sounded; the creator
  opens between 500 and 900 ms after the tap; a second tap in between changes nothing.
- Reduced motion: the glow stays at 1, no star changes and no glint shows over three seconds, Start still
  lights the pager.
- With `assets/title/T_title.png` refused: the lettered placeholder shows and Start opens the creator.

Expose what the tests need on `window.__oq.title`: `loaded`, `lit`, `glow`, `stars` (the indexes on now),
`glint` (`{ point, frame }` or null), `beeps`.

Run all three suites, the browser files one at a time.

## Files

`js/screens/title.js`, new `js/title/timeline.js`, `css/game.css`, `tests/title-timeline.test.js`,
`tests/e2e/title.test.js`, `tests/e2e/_play.js` and whichever browser tests click Start. Nothing in `tools/`,
nothing in `assets/`.

## Hand-back

`handbacks/<date>-warp-title-screen.md`: what you built, the judgment calls, the three suites' counts, and a
capture of the title at 844×390 and 667×375 for Cloud Claude's review.

## Review (Cloud Claude, 2026-11-18)

Built as briefed (`handbacks/2026-11-18-warp-title-screen.md`); reviewed in
`handbacks/2026-11-18-cloud-title-screen-review.md`. What differs from the text above:

- **The glints were added in review.** Warp built from this brief before they were in it. They are as C.2
  describes, with `glintAt` in `js/title/timeline.js`.
- **All of the title's pictures load together**, the glint's among them: if any fails, the placeholder shows.
  E's "show the title without glints" is not built; one small file from the same place as the rest is not
  worth a second path.
- **The credit's type has a 16 px floor** (Warp's call): on the smallest phone the scene is 346 px high, not
  355, so 0.046 of it is a hair under 16.
- **The subtitle is a script slot**, `title.subtitle` (Warp's suggestion), read by the title and the intro.
- `js/anim/title.js` stays: `js/anim/scenes.js` imports it.
