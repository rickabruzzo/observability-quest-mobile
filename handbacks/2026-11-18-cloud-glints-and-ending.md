# Cloud Claude: glints on the title, and the ending briefed (2026-11-18, evening)

`desktop/glints-and-ending` is `era-look` (2cb8e3a) with four commits on top. No game code changes: asset
builds, the script, three briefs.

## Rick's calls today

- "I asked for glints on the title." Done: see below. Brief 16 had left them out, repeating a line in Art
  Claude's hand-back that they had not been asked for.
- "The HS form isn't coming into play until this is approved, so shelve it. The show-to-staff screen can be
  whatever since it's just a placeholder, but the sunrise animation and play more screen can be built."
- "5 horizon is fine as is." Room 5's horizon stays at y 31. Closed.
- The intro's close-ups against the creator's hero: not a concern, the intro is one film for everyone. Closed.

## The glints

- `tools/build_title.py` now also writes `assets/title/T_glint.png` (Art Claude's four frames, untouched) and
  nine places for a glint in `title.json`: light edges of the letters, across the top line and then the
  bottom one, each placed so the whole sparkle stays on the picture. Two tests.
- Brief 16 gains them: a glint pixel is shown the size of a letter pixel, so its arms are as thick as the
  letters' edges; one at a time, nine in a pass, a pass every 8 s; none with reduced motion.
- `title-screen-with-glint.png` (sent to Rick) is the title with one glint at its largest.

## The ending

Claim today ends at Charity. The plan, in three pieces that can all start now:

- **Art brief 09** (`briefs/art/09-the-sunrise.md`), for Art Claude: the street outside the building just after
  sunrise, the same with the door open, the sun as its own stepped disc, and sunglasses for the hero made the
  way the glasses were.
- **Warp brief 17** (`briefs/warp/17-the-ending.md`): Charity, then the sunrise (the door opens, the hero walks
  out and stops, the sun comes up beside them while the street lightens in four cuts, the sunglasses go on,
  with the script's three coda lines), then the staff screen as a plain placeholder with the staff's REDEEMED
  tap and Play more. No form. Once claimed, the menu's button reads "My prize" and opens the staff screen.
- **Stand-ins** (`tools/build_coda.py`, `assets/coda/`, six tests): flat blocks labelled STAND-IN, drawn to
  the layout the art brief asks for, so Warp can build before the paintings exist. The game reads every
  position from `coda.json`; when the art lands I cut it in and change the numbers, and the game does not
  change.
- **Script**: `complete.again` now reads "Play more"; a new `complete.show`, "My prize"; a note that the form
  is shelved.

## Suites

| Tree | Unit | Python |
|---|---|---|
| `era-look` (2cb8e3a) | 404 | 141 |
| `desktop/glints-and-ending` | 404 | 149 |

Browser: the three files the new assets and the script could touch (weight, shell, menu) pass, 20 tests. The
other eight were not rerun: no game code changed.

## Order of work from here

1. Warp: brief 16 (title) and brief 17 (ending). They do not depend on each other.
2. Art Claude: brief 09.
3. Me: review each as it comes back; cut the sunrise art in when it lands.
