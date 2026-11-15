# Art brief 05 — test: the hero painted by the hand that painted the personas, in colours the game can swap (four figures)

> **On hold (Rick, 2026-11-14, evening).** Shown the hero shrunk to a persona's height, Rick said "the hero
> shrunk looks better." Warp brief 11 makes him that size in every room. Run this test only if he still reads
> as blocky beside the personas once that has landed.

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account. Rick art directs. Branch
`art/hero-painted-test` from `origin/era-look`. This is a test, like brief 03: it may be thrown away.

## Why

The hero is drawn by code and the personas are painted. Rick has said it three ways: the hero's head "looks
really weird"; "still a huge difference in detail levels"; and on 2026-11-14, "the hero characters just look
blocky and odd in contrast to the NPCs." Two rounds of redrawing him in code have not closed it. Measured, he is
also built differently: his head is 3.4 heads into his height, the cloud engineer's is 6.4.

The test: can the hero be **painted**, like everyone else in the room, and still be the player's own character?
Colours are the cheap part of the character creator: if each part of him is painted in its own colour family,
the game can repaint the hoodie, the jeans, the skin and the hair to whatever the player chose.

## What to make

Four figures of the same person, the same height, in the same hand as the cloud engineer in
`art-drops/2026-11-13-era-look-rooms/R2_war_room.png`:

1. **front**, standing, arms relaxed at his sides;
2. **side**, facing right, standing;
3. **side, walking**: the front leg reaching out, heel down, the back leg trailing, arms swung opposite;
4. **side, walking**: the legs passing, one foot flat, the other lifted beside it.

He is an ordinary adult: **the head about a sixth to a seventh of his height**, shoulders about a quarter of his
height wide. Hoodie with the hood down, plain jeans, sneakers, short hair, no beard, no glasses, nothing in his
hands, **nothing on the chest** (the game adds the Honeycomb mark from the official file; never generate a
logo). Nobody real.

**Paint him in these colour families, one family per part, and nowhere else:**

| Part | Paint it | Tones |
|---|---|---|
| Hoodie | green | three: light, mid, shadow |
| Jeans | blue | three |
| Skin | orange-tan | three |
| Hair | magenta | two or three |
| Shoes | neutral grey | two, plus a pale sole |
| Outline | near black | one |
| Background | flat yellow | one, used nowhere on the figure |

No gradients, no texture, no anti-aliased edge between a part and the background: a pixel is one part's tone or
it is outline. It will look odd. That is the point: the game swaps each family for the player's colours.

Each figure: 112×288 PNG, the figure 272 px tall with his feet on the bottom row (the game halves it: a 136-px
figure on a 56×144 canvas). The standing figures centred; the walking ones may use the full width.

Start from this and adjust the words with Rick:

> A full-length figure for a 1990s point-and-click adventure game, hand-drawn pixel art: flat colour with three
> tones on each piece of clothing, a clean dark outline, no fine shading, no texture, and a simple face made of
> a few marks. An ordinary adult in his thirties with realistic proportions, standing, arms relaxed. A bright
> green hoodie with the hood down, bright blue jeans, grey sneakers, short magenta hair, orange-tan skin. A
> flat yellow background. No text, no letters, no numbers, no logos.

Edit from the approved front figure for the other three, so all four are plainly the same person.

## Accept when

- Beside the cloud engineer at the same height, the two look drawn by one hand: outline weight, number of
  tones, amount of face, size of head.
- Every part is one colour family, with no stray pixels of another family inside it.
- The two walking figures read as two moments of one stride.

At most 5 tries a figure. Show Rick the best front figure beside the engineer before making the other three.

## Deliver

`art-drops/<date>-hero-painted-test/`: `H_front.png`, `H_side.png`, `H_walk_contact.png`, `H_walk_pass.png`,
and `HANDBACK.md` with the exact prompts, the tries, and Rick's reaction.

Cloud Claude then builds them to game size, repaints them as three of the creator's looks, stands them in
room 2 beside the engineer, and shows Rick.

## What this does not settle

If Rick likes it: the full set. That is the eight-frame walk, the front-view frames, sitting up in bed, the
pyjamas, and whatever the creator keeps that is a shape and not a colour (hair styles, beards, glasses, body
types). Shapes cost a painting each, so that brief will come with a shorter list for Rick to choose from.
