# Warp brief 14 — the feedback art goes into the game: the whiteboard without its sheet, a shop that sells things, a battle worth watching, a painted phone

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/feedback-art` from
`origin/era-look`; the pull request's base is `era-look`. **Brief 13 (the phone shell) comes first**; this one
does not depend on it.

Everything here is from Rick's play-through of 2026-11-14 (spec: "Rick's play-through of the fork"). Art Claude
painted it (`art-drops/2026-11-14-feedback-1114/`), Rick approved it, and it is built to game size in
`assets/rooms/`. **You draw no art and rebuild none**: you place what is built, by the numbers below. All
positions are on the 320×200 canvas; areas `{ x0, x1, y0, y1 }` are inclusive, as in the chapters' data.

Brief 12 called this "brief 13". The four brand marks for the old tools are not in this brief: Rick has not
said yes to them.

## A. What is built, and how a painter reaches it

| Room | In the manifest | What |
|---|---|---|
| 2 | `images.R2_board`, `images.R2_board_wiped` | 320×200 plates: the whiteboard with no taped sheet, and the same board after a hand has wiped a band across it and drawn the path |
| 3 | `sprites.product_ukulele`, `_banjo`, `_acoustic`, `_bass`, `_southpaw` (each 112×72) and the same five with `_small` (57×37) | the shop's products, on one sheet `images.S3_products` |
| 4 | `images.R4_phone_closeup` | 320×200 plate: a hand holding a phone |
| 4 | `sprites.ship_a_small` 7×5, `ship_a_mid` 11×7, `ship_a_big` 19×9, `ship_b_small`, `ship_b_mid`, `ship_b_big` (the same sizes), `bolt` 5×1, `missile` 5×3, `boom_1`…`boom_4` 11×11, `warp_1`…`warp_3` 9×9, `gate` 23×23 | the battle, on one sheet `images.S4_sprites`; every ship faces right |

A manifest's new `sprites` map is `{ name: { image, x, y, w, h } }`: the sheet's name in `images` and the
sprite's box on it. All five products share one box size, so one swaps for another in place. Every sprite has
hard edges (alpha 0 or 255).

- `js/screens/chapter.js`: the state a wall painter gets (`wall(ctx)`) gains `art`, with
  `art.image(name)` → the loaded image or undefined, and `art.draw(g, spriteName, x, y, { flip })` → draws that
  sprite with its top-left at (x, y), mirrored about its own centre when `flip`; it draws nothing, and does
  not throw, when the art has not loaded. An old tool's `paint` gets the same: `def.paint(g, { art, t, reduced, text })`
  where `t` is the ms the tool screen has been open and `text` resolves a script key.
- Nothing else about the manifest loader changes: it already loads every image a manifest lists.

## B. Room 2: theories on the board itself

Rick: "The 'theory' sheet is way too big and isn't working, drop. The theory can be just written on the
whiteboard pointing to things. Or just circled a bunch with ??? everywhere. After the 'win', it can look like
it was clearly wiped with a hand and the new theory was written in its place."

`js/chapters/ch2.js`: `WALL_DISPLAY.image` is `R2_board`, `fixedImage` is `R2_board_wiped`; `close.sheet` goes.

**Before the fix**, close up. A theory is a red marker ring round one box of the diagram, question marks beside
it, the theory's words in the one clean corner of the board, and an arrow from the words to the ring. A tap on
the board steps to the next theory, as a tap on the sheet did. Rings already made stay: after six taps the
board is "circled a bunch with ??? everywhere."

- Marker red `#C81E1E`, 1 px, on the canvas.
- The rings, in theory order (centre and radii), and where each one's `???` goes (top-left; draw it with
  `js/intro/font5x7.js` at scale 1, in the same red):

  | Theory | Ring `cx, cy, rx, ry` | `???` at |
  |---|---|---|
  | 1 | 90, 35, 11, 8 | 104, 27 |
  | 2 | 223, 76, 10, 11 | 235, 60 |
  | 3 | 48, 79, 11, 9 | 58, 64 |
  | 4 | 90, 36, 14, 10 (a second ring round theory 1's box: it is DNS again) | 58, 27 |
  | 5 | 229, 144, 9, 9 | 240, 130 |
  | 6 | 107, 81, 11, 11 | 119, 66 |

- The words: a text box at `close.theory = { x0: 262, x1: 304, y0: 128, y1: 186 }`, the same red, centred,
  17 px × the UI scale as the sheet's were. The part before " / " is the first line; the rest wraps at spaces
  inside the box (CSS wrapping, no breaks in the script): "THEORY 4", "IT'S DNS", "AGAIN".
- The arrow: a 1-px red line from (261, 136) to the current ring's nearest edge, stopping 2 px short, with a
  5-px two-stroke head at the ring. Only the current theory has an arrow.
- Which theory is current: `nudges.length % 6`, as now. Rings 1 to current are drawn; once all six have been
  seen, all six stay.
- The whole board is the tap target (`close.screen` is still the way back to the room, outside it).

**After the fix**, close up: the plate does the wiping and the path. The new theory is written in the wiped
band in dark marker `#1E2A5A`, 24 px × the UI scale: the part before " / " at
`{ x0: 84, x1: 236, y0: 80, y1: 97 }` above the path, the rest at `{ x0: 84, x1: 236, y0: 116, y1: 133 }`
below it. Taps step through `okPool` as now. No rings, no question marks.

**In the room**: unchanged (the path draws itself across the small board once fixed).

`.wall-box.sheet` in `css/game.css` goes with the sheet; name the new classes for what they are.

## C. Room 3: the shop sells things, in colour

Rick: "The guitar image on the monitor looks absolutely awful… Adding color to the screen would be nice too…
Can we have it cycle through other instruments before it reaches the guitar and stalls."

The `guitar()` drawn from rectangles goes, close up and in the room. The page becomes a customer's visit, over
and over: four products browsed, then the left-handed guitar, then the order that sticks.

**The loop, while broken** (from `tAll`; one visit is 14 000 ms):

| ms into the visit | Picture | Header (the box at `progress`) | Words beside the picture |
|---|---|---|---|
| 0–1099, 1100–2199, 2200–3299, 3300–4399 | ukulele, banjo, acoustic, bass | filled in the shop's colour with `ch3.wall.shop` | `ch3.wall.product.1`…`.4`: the name, then the price on its own line |
| 4400–4999 | southpaw | the progress bar running from 0 to 13 % | `ch3.wall.cart` |
| 5000–13999 | southpaw | stuck at 13 % with the spinner and `ch3.wall.progress`, as today | `ch3.wall.cart` |

**Fixed**: the southpaw stays, the bar fills over `RECOVER_MS` and says `ch3.wall.progress.ok`, as today. No
more browsing. **Reduced motion**: the southpaw at 13 %, still, as today.

Close up (`js/chapters/ch3.js`, `close`):

- The picture: `product_<name>` at (62, 63), inside `large`.
- The words: a text box at `close.tag = { x0: 126, x1: 181, y0: 97, y1: 135 }`, the corner every product
  leaves empty. `close.cart` goes. Name in the page's ink; the price line in the shop's colour.
- The shop's colour is `#8C3A1C`; its name on the header is `#F4E9D0`.
- Each of the three small boxes gets a 3-px tab down its left edge inside its frame: `#C0392B` while broken,
  `#2E9A3A` once fixed.

In the room (`room`): `product_<name>_small` at (113, 45), inside `room.large`; the thin bar at
`room.progress` is the shop's colour while browsing, and as today while ordering. The page's tint and
`persona.covers` work as they do now, and the tint is drawn under the picture.

`frameKey` must change whenever the picture or the header does.

## D. Room 4: a battle worth watching

Rick: "The space battle looks super boring. It needs to be spiced up. We can do sprites if necessary but just
red dots is kinda bland."

The wall of space keeps its three parts (the map, the flat green health line, the chat column). The map
changes. Where each thing goes is yours to choreograph; this is what must be true:

- **The gate** (`gate`) sits at 78 % of the map's width and half its height, in both views.
- **Two fleets.** Ours is blue (`ship_a_*`), flying right toward the gate; theirs is amber (`ship_b_*`,
  drawn flipped), coming in from the right edge above and below the gate and crossing our lanes. About nine of
  ours and six of theirs on the map at once, small ones the most common, one big one a side.
- **Fire.** Ours fire `bolt`s, theirs `missile`s (flipped). A ship that is hit becomes `boom_1` to `boom_4`
  at 90 ms a frame and comes back in from its own edge a moment later. There is always something being shot
  at: no two seconds pass without a boom somewhere.
- **Ships of ours that reach the gate go in**: `warp_1` to `warp_3` at 90 ms a frame at the gate, and they
  are gone.
- **The stuck ones are the story.** While broken, four of ours (one mid, three small) hang in an arc just
  left of the gate and cannot get in: each jitters a pixel, and every second and a half or so flashes `warp_1`
  alone, the door not opening. A 3×1 tick in `#FF6A4A` blinks above each so the eye finds them. They are
  never shot.
- **The fix**: over `RECOVER_MS` the four go in one after another, each with the full `warp_1`–`3`, and
  `recovered` is true when the last is in. After that nobody waits at the gate.
- **The far fleet** stays as dots: about 120 of today's dots, drifting toward the gate instead of the map's
  centre. Eight thousand ships cannot all be sprites.
- **The room view** uses the same cast with only the small ships; the gate, booms and warps as they are.
- **Everything is clipped to the map's area.** Nothing is drawn over the health line, the chat column or the
  SRE's `covers`.
- **Deterministic**: the picture is a function of the painter's state (`tAll`, `t`, `state`), as it is now.
  Export the cast as data, `cast(s, area)` → `[{ sprite, x, y, flip, stuck }]` (ships, shots, booms, warps, the
  gate), so a test can ask what is on the map at a given time; the painter draws exactly that list.
  **Reduced motion**: one still picture, the cast in place, no shots or booms; the four at the gate while
  broken, gone once fixed.

## E. Room 4: the phone

Rick: "The mobile phone graphic is pretty disappointing."

`paintOld` in `js/chapters/ch4.js` stops drawing a phone from rectangles. Inside the tool's picture box
(`TOOL_PIC`: x 4, y 20, 188×176) it draws that same box of `R4_phone_closeup` (the plate's coordinates are the
canvas's), keeping the frame round it. On the plate:

| On the phone | Area |
|---|---|
| The screen | x 63–132, y 35–180 |
| The contact's picture (a blank grey silhouette, painted) | x 78–117, y 52–84 |
| The name's bar | x 67–128, y 99–108 |
| The second bar | x 67–128, y 113–122 |
| The green call button | x 88–107, y 150–170 (centre 97, 160) |

- The name's bar reads `ch4.old.phone.name`, the second bar `ch4.old.phone.line`, both in
  `js/intro/font5x7.js` at scale 1, ink `#2B2F36`, centred in their bars.
- **It rings**: two rings round the call button, 1 px, `#25B03A`, growing from radius 12 to 20 and fading in
  three steps, one starting every 600 ms; the name's bar blinks to a pale green (`#D6F5DC`) in time. Reduced
  motion: one ring at radius 14, still.
- If the plate has not loaded, today's rectangles are the fallback: keep them behind a check.

## F. Two things left over

1. **The verdict portrait's right edge** (brief 11, section D, item 1; not built). Cropping the picture to
   45 % of the scene cuts the narrator's far shoulder, and Charity's hair, in a straight vertical line. Keep
   the crop on the left (it centres the face in the left 45 %) but draw the picture through to its own right
   edge, and let the words' window sit over it. The same for Charity's `<img>` on Claim. The tests that say
   the window is wholly to the portrait's right change to: the window is wholly to the right of the face's
   45 %, and no portrait pixel ends in a vertical line left of the window.
2. **The Honeycomb mark is never mirrored.** After a walk to the left the hero's front view is drawn flipped
   (`js/screens/chapter.js:92`), which mirrors the mark on his chest. The front view is always drawn
   unflipped; the side view flips as now. Change nothing else about how he is drawn.

## Tests

Unit:
- `art.draw`: the sprite's box from the manifest lands at (x, y); `flip` mirrors it; missing art draws nothing.
- Room 2: the ring and `???` for each of the six theories; rings accumulate and stop at six; the arrow ends
  2 px short of the current ring; fixed has no rings; `text()` returns the theory box before the fix and the
  two band boxes after.
- Room 3: which product and which header at 0, 1100, 4399, 4400, 5000, 13999 and 14000 ms; fixed and reduced
  motion show the southpaw; `frameKey` differs across each change.
- Room 4 (`cast`): while broken exactly four ships are `stuck`, each within 40 px left of the gate's centre
  and moving at most a pixel from one step to the next; once `t ≥ RECOVER_MS` none is; every item's box lies
  inside the map's area; the same state gives the same list; reduced motion has no shots or booms; over any
  2000 ms there is a boom; the gate is where section D puts it in both views.
- The phone: with the plate, its box is drawn and the two words are on their bars; without it, the fallback.

Browser (one file at a time):
- Scenario 2: the close-up shows `R2_board`; a tap adds a ring (red pixels where the table says) and changes
  the words in the corner box, which lies inside the board at 844×390 and 667×375; after the fix the plate is
  `R2_board_wiped` and the two lines sit above and below the path.
- Scenario 3: with the clock advanced, the picture area holds each product in turn (compare the canvas to the
  sprite's own pixels), then the southpaw with the bar at 13 %; the words box never overlaps the picture's
  painted pixels; in the room no pixel inside `persona.covers` changes while the page cycles.
- Scenario 4: the map changes from frame to frame; no pixel outside the map's area changes because of the
  battle; the room test "the chat column scrolls beside the SRE and never over her" passes unchanged; the old
  tool shows the plate, the name on its bar, and a ring round the button.
- The verdict at 844×390 and 667×375, and Charity's Claim screen, as item F.1 says.
- The hero standing at one spot looks the same whichever way he walked there: walk him left to a spot, read
  the canvas inside his box, walk him away and back to it from the left, and the pixels are identical.

**Tests that describe what this brief replaces** (the sheet and its tap area, the guitar from rectangles, the
fleet as dots only, the phone from rectangles; `tests/wall-painters.test.js` and the room tests in
`tests/e2e/`) are rewritten to the new behaviour, not deleted: list each one in the hand-back with what it
checks now. Two of Cloud Claude's room tests keep their point and may need their pixels moved: room 3's "the
TV's page tints as one piece" (compare the page outside the picture's box) and room 4's "the chat column
scrolls beside the SRE and never over her" (must pass unchanged).

## Files

**Yours:** `js/screens/chapter.js`, `js/screens/charity.js`, `js/chapters/ch2.js`, `ch2-wall.js`, `ch3.js`,
`ch3-wall.js`, `ch4.js`, `ch4-wall.js`, `css/game.css`, `tests/`.
**Not yours:** `assets/`, `tools/`, `script/script.md` and `js/script.js` (the new slots are in:
`ch3.wall.shop`, `ch3.wall.product.1`–`4`, `ch4.old.phone.name`, `ch4.old.phone.line`), the hero's drawing
(`js/engine/hero*.js`), `art-drops/`.

## Hand-back

`handbacks/<date>-warp-feedback-art.md`: what you built; the three suites' counts; every call you made, the
battle's choreography above all (how many of each ship, the lanes, the timings); and screenshots at 844×390 of
the board with three theories circled, the wiped board, the shop on the banjo and on the stuck southpaw, the
battle while broken and just after the fix, and the phone ringing.

Once this is merged, Cloud Claude retires `R2_wall_closeup` and `R2_wall_closeup_fixed`: they stay in the
manifest until then so the game is whole at every merge. Do not delete them.
