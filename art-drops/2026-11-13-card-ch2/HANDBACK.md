# Art drop: P2 card redo, the Cloud Engineer, Druid of the Monolith (2026-11-13)

For **Cloud Claude**. From `briefs/art/02-persona-cards.md`, section "P2_card — the Cloud Engineer, Druid of the Monolith". Made by Art Claude on Rick's personal account.

## Files

| File | Size | What |
|---|---|---|
| `P2_card.png` | 640×400 | The Cloud Engineer as a druid: a moss-green hooded robe, glasses pushed up on his greying hair, a gnarled staff with a glowing green crystal, casting toward a cracked monolith with two small lights (one green, one red), inside a ring of standing stones under a full moon. Cables and roots twist across the grass. |

**This replaces** the armoured "Slayer of the Monolith" picture at `art-drops/2026-11-12-room-ch2/P2_card.png` (PR #7). That file is left where it is; use this one.

## Changes from the brief

Rick picked this take (2026-11-13, "4 works") from a round made just before the brief's druid prompt landed. So it differs from the brief's prompt in these ways:
- **No crown of leaves.** The robe is decorated with leaves instead.
- **Night with a full moon, not dusk.** No swirl of cloud and no rolling hills.
- **The staff has a glowing green crystal at the top.** The cable is wound round the staff's base and runs into the stone, rather than one small green light near the top.
- **The pose is calmer than "staff raised high":** the staff is raised, the other hand reaches toward the stone, and he faces the viewer.
- **The stone circle has lintels** and leans toward the famous real one. Rick asked for "a Stonehenge monolith nature space". There are no runes, carvings or writing on the stones.

## Checks

- One person, recognisably the man from `R2_war_room`.
- Reads as a druid at 128×80 (nearest-neighbour): the green robe, the staff and the glowing stone are all clear.
- No writing, logos or frame. Nothing important in the outer 6%.

## P2 card animation (2026-11-13)

`P2_card_fx_1.png`, `_2.png`, `_3.png` (640×400): the same card with the effect in new positions: the green glow on the staff crystal and the cables pulses, the light veins on the monolith shift, the two stone lights alternate green and red, and the fireflies move. Each is a Gemini edit of the card's full-size original; only the effect areas were composited back, so the person never moves. Changed area: the stone circle, staff top and fireflies; the druid himself never changes (x 70–175, y 25–200 is untouched).
- **Loop:** `P2_card` → `_fx_1` → `_fx_2` → `_fx_3` → `_fx_2` → `_fx_1`, about 160–200 ms a frame, the same as the CTO's sparkle. Reduced motion: `P2_card` only.
- Provenance: `scratch/card_gen/edit_fx.py` (`P2_fx`), 3 tries, all 3 kept.

## Provenance

- **Tool:** Gemini API `gemini-3.1-flash-image`, 3:2, 1K, 2026-11-13. The plate `R2_war_room` was attached as the character reference.
- **Prompt:** brief 02's opening and closing lines around Rick's druid direction (a hooded moss-green robe over his cardigan, a gnarled staff wound with a glowing green cable, a ring of standing stones with lintels, a cracked central monolith with two small blinking lights, moon, fireflies, roots and cables), plus the knees-up / face visible / outer edge free / original costume additions. The exact text is in `scratch/room_gen/gen_set.py` (`J['P2_card']`).
- **Tries:** 3 druid tries (the round's t3–t5); **t4 kept**. t3 drew the man twice; t5 had a brown monk-like robe and no lights in the stone.
- **Crop:** centre 16:10 (1264×790), nearest-neighbour to 640×400.

## Sign-off

Rick picked t4 on 2026-11-13.
