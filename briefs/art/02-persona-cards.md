# Art brief 02 — the persona cards (five card pictures)

Read `briefs/art/PROTOCOL.md` first. For **Art Claude** on Rick's personal account (Gemini API
`gemini-3.1-flash-image`). Rick art directs; his direction beats this brief.

## What you are making

Each scenario has a **persona**: the person in the room whose problem the player solves. The first time the
player talks to them, a **trading card** pops up: the persona in a silly fantasy outfit for their "class", in an
action pose, with their stats underneath. The game draws the card (frame, name, stats, text). **You make the
picture that goes in the card's window**, one per persona:

| File | Persona | Class |
|---|---|---|
| `P1_card` | the CTO (scenario 1) | Archmage of the Budget |
| `P2_card` | the Cloud Engineer (scenario 2) | Druid of the Monolith (**redo**, see below) |
| `P3_card` | the Frontend Developer (scenario 3) | Bard of the Browser |
| `P4_card` | the SRE on call (scenario 4) | Knight of the Pager |
| `P5_card` | the Release Engineer (scenario 5) | Rogue of the Friday Deploy |

## Order of work

- **`P1_card` now**: the CTO exists (`scratch/room_gen/raw/R1_exec_floor.png`).
- **Each of the others after its room plate is approved** (art brief 01), because the card must show the same
  person as the room. Make the card straight after that room's talk frames, and put it in that room's drop.
  `P1_card` goes in its own drop, `art-drops/<date>-card-ch1/`.

## Rules for every card picture

- **16:10, delivered at 640×400**, cropped the way the rooms are. In the game it is shown small (128×80 game
  pixels, about the size of a postage stamp on a phone), so:
  - **one person, large**: from about the knees up, or a full figure filling at least 70% of the height;
  - a **strong silhouette** and two or three big costume shapes; no fine detail that disappears when shrunk;
  - a **simple backdrop** in two or three tones, darker or lighter than the figure;
  - **check it shrunk**: resize to 128×80 with nearest-neighbour and look. If you cannot tell what the costume
    is and what they are doing, it is a redo.
- **The same person as the room plate.** Attach the approved room plate as the character reference and keep
  the face, hair, age and build; let a hint of their real clothes show under the costume.
- **An action pose**: mid-spell, mid-swing, mid-chord, mid-leap. Never standing and facing the camera.
- **Silly, and affectionate.** The joke is the costume; the person is not a caricature.
- **No words, letters, numbers, runes that look like writing, or logos.** Scrolls, shields and books are blank.
- **No card frame, border, banner, symbols or text box in the picture.** The game draws the card around it.
  Keep the outer 6% free of anything that matters.
- **Original.** Not a character, costume or creature from any game, film, book or card game, and not "in the
  style of" any card game or named artist. No real person's likeness.

Open every prompt with:

> Sierra On-Line SCI VGA adventure game close-up, 320x200, 1991 era, 256-color hand-painted pixel art, soft
> dithered shading. The same person as in the reference image, as a fantasy hero:

and close it with:

> One person only. Dynamic action pose, large in the frame, strong clear silhouette, simple background. No
> text, no letters, no numbers, no logos, no border, no frame.

At most 5 tries a card.

## The five pictures

### `P1_card` — the CTO, Archmage of the Budget
> a woman executive in her fifties with short silver hair, wearing flowing deep-blue wizard's robes over her
> dark blazer and a tall pointed hat. She thrusts a wizard's staff forward, mid-spell; the staff is topped with
> a large glowing fountain-pen nib. A long blank contract scroll with a red ribbon whirls through the air
> around her, caught in the spell. Sparks of gold light. Behind her, a night city skyline through tall glass,
> in dark blues.

### `P2_card` — the Cloud Engineer, Druid of the Monolith (redo, Rick 2026-11-13)

**This replaces the armoured "Slayer of the Monolith" picture** in `art-drops/2026-11-12-room-ch2/`. Rick: a druid
at a Stonehenge-like monolith, in a nature setting, not a paladin. Attach `R2_war_room` (from that drop) as the
character reference: the same man in his fifties, greying hair, glasses pushed up on his head.

> [the person from the room 2 plate], as a druid: a hooded moss-green robe worn over his jacket, a crown of
> leaves, and a gnarled wooden staff with a length of grey cable wound round it and one small green light near
> the top. He stands inside a circle of tall weathered standing stones with stone lintels across their tops,
> on grass, at dusk. Mid-incantation: staff raised high in one hand, the other hand thrown out toward the
> tallest stone in the middle of the circle, a single huge grey monolith with two small blinking lights, moss
> on its base and ivy climbing it. His robe and the grass are caught in a rising wind, and a swirl of low
> cloud gathers above the stones. Behind, rolling green hills and a darkening sky.

It is a stone circle of the game's own, not a copy of any particular monument: do not reproduce a real site's
exact arrangement. No runes, carvings or writing on the stones.

Deliver it on its own: branch `art/card-ch2`, drop `art-drops/<date>-card-ch2/P2_card.png` with a short
`HANDBACK.md`. Leave the old picture where it is.

### `P3_card` — the Frontend Developer, Bard of the Browser
> [the person from the room 3 plate], with her glasses, in a bard's feathered cap, a short cape and a tunic
> worn over her cardigan. She strikes a huge chord on a lute-shaped electric guitar, one boot up on a small
> amplifier, hair flying, bright sparks bursting from the strings. Behind, a tavern stage with a string of warm
> bulbs.

The instrument is a generic shape, not a recognisable real guitar model. Sparks, not musical notation.

### `P4_card` — the SRE on call, Knight of the Pager
> [the person from the room 4 plate], in full plate armour with no helmet, her headset round her neck, standing
> guard on a castle rampart at night. Sword raised high in one hand, a tall shield on the other arm bearing a
> plain bell shape. A small old pager hangs from her belt, glowing green, its screen blank. A lantern at her
> feet. Behind, a dark sky full of stars.

### `P5_card` — the Release Engineer, Rogue of the Friday Deploy
> [the person from the room 5 plate], bearded, his beanie showing under the hood of a rogue's dark cloak worn
> over his hoodie. Mid-leap between two rooftops, firing a small crossbow whose bolt trails a rocket's flame. A
> belt pouch spills blank rolled scrolls into the air behind him. Behind, a huge orange sunset over small
> rooftops.

## Accept when

- one fictional person, recognisably the persona from the room plate;
- the class reads at a glance at 128×80: wizard, armoured hammer-swinger, bard, knight, rogue;
- an action pose, face visible;
- no writing, no logo, no frame; nothing that matters in the outer 6%;
- it sits with the rooms: the same VGA look, no smooth gradients, no photo-realism.

## Hand-back

In the drop's `HANDBACK.md`, per card: the file, the reference image used, tries and which was kept, any flaw
kept, and Rick's sign-off. No measurements are needed: the game crops nothing and draws nothing on these.
