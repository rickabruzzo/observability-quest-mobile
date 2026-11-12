# Task for a Claude session with image-generator access: round 3 — the pager hand, and a dark room that matches the bedroom

Read the "strict" section of `briefs/intro-shots-agent-brief.md` first; the same rules apply (edits are made from
the finished plate, one change each; no words, digits or logos; failed images are regenerated, never painted over).
Work in the project folder, change nothing outside `scratch/intro_gen/`, and do not run `git`.

The lamp close-up (`B_lamp`) is no longer used — do not regenerate it. The intro now goes: pager close-ups and
face shots → **back to the wide dark room** → click → **the same room, lit** (`D_bedroom_vga`).

## 1. `A_room_dark` — the bedroom with the light off

Today's `A_room_dark` is a different room from the bedroom (its bed is on the right). The cut from dark to lit
only works if it is the *same* room. Make it as an **edit of the approved `raw/D_bedroom_vga.png`**:

> Identical image — same room, same framing, same furniture in the same places — except the lamp is off and it
> is night: the whole room is very dark, deep blue-black, shapes barely visible. The only light is a small green
> glow from a pager lying on the nightstand beside the lamp, faintly lighting the nightstand top and the edge of
> the pillow. Someone is asleep in the bed under the blanket, head on the pillow, facing away — a dim shape, no
> detail. The laptop is still on the dresser. Door closed. No text.

Accept when: every piece of furniture, the door, the shelf and the rug are **exactly where they are in
`D_bedroom_vga`** (flip between the two); the room is dark enough that the lit version will feel like a reveal;
the pager glow is on the nightstand; the sleeper is a vague shape (the game draws the real hero once the light
is on); no text. At most 5 tries. Move the old file to `raw/tries/A_room_dark_round1.png` first.

## 2. `B_nightstand` and `B_arm` — hand from the left, sizes that agree

Two problems with the current pair: the arm reaches in from the **right**, but the bed is on the **left** of the
nightstand; and the pager is far too big for the hand.

**`B_nightstand` (new plate).** Regenerate from the round-1 prompt with these changes: the pager is **smaller —
about a third of the frame's width**, lying slightly right of centre; the lamp base and pull chain are at the
**far right** edge; the **left third of the frame is empty dark space** above the nightstand (the arm will come
in there). Everything else as before: straight-on view, blank bright-green LCD that is one clean upright
rectangle, nothing else green, black background, EGA look with the preamble and a portrait as style reference.
The LCD must still be at least **80×24 px on the 320×200 picture** (a quarter of the frame's width) — the game
writes on it.

**`B_arm` (edit of the new `B_nightstand`).**

> Identical image, pixel for pixel, except an arm in a pale-blue striped pyjama sleeve now reaches in from the
> left edge and its hand closes around the pager, fingers over its left end. The hand is life-size against the
> pager: the pager is about as long as the hand is wide, like a deck of cards in a palm. The LCD stays blank
> and fully visible. Do not redraw anything else.

Accept when: the arm enters from the **left**; hand and pager are believable sizes together; the LCD is
unobstructed and unchanged; nothing else moved. At most 5 tries each.

## 3. Crop, build, check

Run `crop.py`, then `python3 tools/build_intro.py`. Expect `real art`, **no `FALLBACK`** (the new LCD was
found), and `B_arm: …% of the frame changed` with a box on the left half only.

## 4. Report to Rick

Files, tool/model/date, tries, flaws kept, the build output — and the new LCD rectangle the build printed.
