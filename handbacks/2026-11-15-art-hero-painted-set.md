# Hand-back: Art Claude, 2026-11-15 — brief 06 done, and where everything stands

For **Cloud Claude**, from Art Claude (Rick's personal account). The full detail for brief 06 is in
`art-drops/2026-11-15-hero-painted-set/HANDBACK.md`. This note is the summary, Rick's calls, and the open items.

## Open PRs (all open, none merged; Rick merges)

| PR | Base | What |
|---|---|---|
| #26 | `era-look` | **Brief 06, the painted hero full set**, plus the walk toward and away and the back-view heads. This branch also carries this note. |
| #25 | `era-look` | For you: the phone playtest set-up (Vercel), and Rick's requests for full screen and for sound on phones. |
| #24 | `era-look` | Brief 05: the four test figures. Rick: "better. approved." |
| #23 | `era-look` | Brief 04: plates, products, battle sprites, the phone, brand marks. Rick approved groups 1–4. **He has not said yes or no to the brand marks.** |
| #15 | `sci-adventure` | The art hand-back from the end of 2026-11-13. |

**Order to merge:** #24 before #26, because #26's heads are cut to #24's `H_front` and `H_side`. The rest are
independent.

## What brief 06 delivered (`art-drops/2026-11-15-hero-painted-set/`)

**Heads:** 15 head layers in all.
- Clean-shaven, standard, long, afro, mohawk and glasses: front and side for each, 12 paintings.
- Back views for long, afro and mohawk, 3 paintings.
- Each file is the approved figure's exact 112×288 frame with only the head changed.
- `HD_standard_*` is the same picture as `HD_clean_*`.
- From behind, clean, standard and glasses all use `H_back`.

**Body:**
- `B_walk_down`, `B_walk_up`: the side walk, which with brief 05's two frames makes a four-picture step.
- `B_pj_front`, `B_pj_sit`, `B_clothes`.

**Depth:** added at Rick's request, 2026-11-15 10:52.
- `H_back`, standing from behind.
- `B_walkF_L` and `B_walkF_R`, walking toward us.
- `B_walkB_L` and `B_walkB_R`, walking away.
- The R frames are mirrors of the L frames.
- The loops: toward is `B_walkF_L → H_front → B_walkF_R → H_front`; away is `B_walkB_L → H_back → B_walkB_R → H_back`.

**Data for the build** (all in the drop's hand-back):
- the neck point of every body figure, brief 05's included;
- the first and last row each head changes;
- exact prompts, tries and picks.

69 images in all.

## Rick's calls

| What | Rick |
|---|---|
| The clean-shaven face, front t1 and side t1 | "concur" |
| The walk toward and away | "approved" |
| Long hair from behind | **t1**. t2 was "a hallucination, hair can't go through a hoodie like that." |
| Afro from behind | **t2**, "the best size overall". The front and side afros were redone to that size: 67 and 61 px wide at 112×288 (back 66). |
| Mohawk from behind | t1, "will do" |
| The overnight picks (long front and side, mohawk front and side, glasses, walk down and up, pyjamas, clothes) | Made by Art Claude after Rick said "build it all out and go with your recs". **He has not reviewed them one by one yet.** |

**Standing preference, stated today:** when two tries differ only in detail no one can see at game size, pick one
and move on. Do not ask Rick to compare them. ("It would take a difference mask for me to see that.")

## Open items for the build

1. **`B_walk_down` is close to `H_walk_contact`.** Gemini kept redrawing the long stride. Fix it in code by
   dropping the whole figure 2–3 px in that frame, or ask Rick about a hand edit.
2. **The walks do not bob.** Every walk frame is scaled to 272 px tall, so the head height is the same in all of
   them. Add the bob in code: down and contact −2 to −3 px, up +1 to +2 px at game size.
3. **The mohawk's buzzed sides sort mostly as skin**, as a shaved scalp, and only the strip's edge as hair. If
   Rick wants the sides in the hair colour, move those pixels into the hair family in the build.
4. **Long hair is the one head that reaches down over the body:** rows 105 front, 128 side, 128 back. The head
   layer must draw over the body.
5. **`B_pj_sit` stops at row 177**, cut straight. The bed's blanket in the scene must cover that edge.
6. **`B_walk_down` and `H_walk_contact` are 148 wide.** Line the walk frames up by the feet's centre, or pad.
7. **A second build (body type) is not painted.** Rick accepted one build for now ("see how it goes"). Another
   would be a whole second body set, every body frame again.

## Still open from earlier

- The **brand marks** in #23: Rick has neither approved nor rejected them.
- In #25:
  - Whether sound came back on Rick's iPhone with the ring/silent switch on ring. Unanswered.
  - The Vercel project is named `observability-quest-mobile-tools`. Rename it before any QR code is printed.
- The intro cut scenes stay untouched; they are the style reference. The hero getting out of bed is to be repainted
  to match the new hero; `B_pj_sit` and `B_pj_front` are the paintings for it.

## Working files (on the laptop, not committed)

- `scratch/hero05/` and `scratch/hero06/`: every prompt (`prompts.json`), all the tries, and the scripts.
  - `comp.py`: the paste-back and the exact-frame scaling.
  - `../hero05/key.py`, `../hero05/repaint.py`: the key-out and the quick recolour preview.
