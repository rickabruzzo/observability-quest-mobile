# Hand-back: Art Claude, briefs 07 and 08 (2026-11-17), and where everything stands

For **Cloud Claude**, from Art Claude (Rick's personal account). The full detail is in each drop's
`HANDBACK.md`. This note is the summary, Rick's calls, and the open items.

## Pull requests

| PR | Base | State | What |
|---|---|---|---|
| #31 | `era-look` | open | **Brief 08:** yesterday's clothes dropped on the floor. This branch also carries this note. |
| #30 | `era-look` | open | **Brief 07:** the title screen. |
| #24 | `era-look` | **open** | Brief 05: the four test figures (`H_front`, `H_side`, `H_walk_contact`, `H_walk_pass`). |
| #15 | `sci-adventure` | open | The art hand-back from the end of 2026-11-13. |
| #23, #25, #26 | `era-look` | merged | Brief 04; the playtest notes; brief 06. |

**#24 needs merging.** Brief 06's heads (merged in #26) are cut to fit #24's `H_front` and `H_side`, and its
hand-back takes the walk frames from #24. Those four files are not on `era-look` yet.

## Brief 07: the title screen (PR #30, `art-drops/2026-11-17-title-screen/`)

**Rick picked picture A, "Before the page":** "A fits better, the castle is way out of place in terms of genre
and feel." The data-centre castle (B) is dropped, and there is no `T_title_other.png`.

| File | What |
|---|---|
| `T_title.png` | 640×400. A night sky over the game's city from an open window. The intro's orange nightstand is at lower right, with the green pager dark and the lamp off. No lettering. |
| `T_title_light.png` | The pager gone off: the screen in the intro's `#06F805` and a stepped, dithered glow on the nightstand. Drawn in code, because Gemini's glow was an airbrushed blur. |
| `T_title_stars.png` | 12 stars a step brighter, for a twinkle. Drawn in code. |
| `T_wordmark.png` | The game's own `assets/intro/wall_logo.png` at ×3 NEAREST (letters 534×156), on a 582×204 transparent layer. Nothing generated. |
| `T_wordmark_glow.png` | The glow, a separate layer the same size. |
| `T_glint_1` to `4` | An optional sparkle for the logo, 22×22. Rick has not asked for it. |

**About the glow:**
- Rick chose banding with checker edges: "the banding fits better. it can ever have some needless aliasing
  checker pattern at the edge to fit the genre better."
- It is built on the wordmark's 1× grid, so every checker square is a letter pixel.
- The game can pulse the whole layer with `globalAlpha`.

**Rick asked for a larger subtitle:** "Subhead needs to be larger if its gonna be legible on mobile." It is game
text, so that is yours. Mocked at about 3× today's size, about 15 px tall at 320×200, it fits 12 px below the
letters and still reads over the tower tops.

**Placement facts (at 320×200; the drop's hand-back has the rest):**
- **The quiet sky:** x 20 to 270, y 5 to 78.
- **The window frame:** a dark vertical bar at x 275 to 287. It is the one hard edge behind the logo.
- **The bottom rows:** the bottom 16 rows are dark only on the left. The small print belongs at x 8 to 190.
- **The pager screen:** x 245 to 285, y 128 to 145.

## Brief 08: the clothes on the floor (PR #31, `art-drops/2026-11-17-clothes-on-the-floor/`)

`B_clothes.png` replaces brief 06's folded heap, which Rick had not asked for.

- **What it shows:** the hoodie dropped front up with a sleeve flung out, the jeans crumpled askew, and the
  sneakers kicked off apart, one on its side.
- **Rick:** "2 is fine."
- **Size:** 200×75 on yellow. The game shows it at about 100×38.
- **The mark's point on the hoodie's chest:** (60, 27).
- **One hand edit:** the cream soles were turned light grey so they don't key out as holes.

Next, per the brief: cut it to game size, place it on the bedroom floor, put the mark on the hoodie, and film the
intro again.

## Still open

- **#24** is unmerged (above).
- **The walk:** brief 06's open items still apply. The weak `B_walk_down` frame, and the walk's up-and-down bob
  in code. See `handbacks/2026-11-15-art-hero-painted-set.md`.
- **Sound on Rick's iPhone** with the silent switch on ring is still unanswered (PR #25's note).
- **The Vercel project** is named `observability-quest-mobile-tools`. Rename it before any QR code is printed.
- **There is no art brief 09 yet.**

## Working files

On the laptop, not committed: `scratch/title07/` and `scratch/clothes08/` hold the prompts, the tries and the
generator script.
