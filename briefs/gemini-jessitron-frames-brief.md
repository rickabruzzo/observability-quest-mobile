# Brief: blink + talk frames for the Jessitron portrait (Gemini image edit)

You are producing three edited versions of one approved pixel-art portrait so a game can animate it:
eyes closed, mouth slightly open, mouth open wide. Five other portraits already have these frames,
made with the exact prompts below; match that process so hers looks the same.

## Attached files (expected)
- `portrait_jessitron.png` — the approved still, 640×428. **This is the source image for every edit.**
- `christine_blink.png`, `christine_talk2.png` — examples of what finished frames look like (optional, for reference only).

## Model and call
Use **Gemini 3.1 Flash Image** (`gemini-3.1-flash-image`) via `generateContent`, with the still as an
inline image part plus the text prompt, `responseModalities: ["IMAGE"]`, `imageConfig.aspectRatio: "3:2"`.
This is the same call the other frames came from (the script that made them is `scratch/anim_gen/gen.py`
in the project folder; you can reuse it: set `GEMINI_API_KEY`, and add a `jessitron` entry).

## The three prompts (use verbatim; each ends with the same KEEP sentence)

KEEP = `Keep exactly the same pixel-art style, palette, pixel size and lighting. Change nothing else in the image: every other part must stay identical. Keep the same framing and composition.`

1. **blink** → `Edit this portrait: the person is mid-blink, with both eyes fully closed (eyelids down, lashes as a dark line). Only the eyes change.` + KEEP
2. **talk1** → `Edit this portrait: the person is talking, mouth slightly open mid-word (lips parted a little, a dark gap between them). Only the mouth changes; the expression otherwise stays the same.` + KEEP
3. **talk2** → `Edit this portrait: the person is talking, mouth open wider mid-word as if saying 'ah' (open mouth showing a dark inside and a hint of teeth). Only the mouth and jaw change slightly; the expression otherwise stays the same.` + KEEP

## Deliverables — exact filenames
Save the raw model outputs, unresized, as:
- `jessitron_blink.png`
- `jessitron_talk1.png`
- `jessitron_talk2.png`

They will probably come back as JPEG data at 1264×848 even with a `.png` name — that is fine and
expected; the build pipeline resizes, aligns, cuts only the changed pixels, and snaps colours.
Do not resize, crop, or re-encode them.

Put them in the project folder at `scratch/anim_gen/` (next to the other narrators' frames).

## Acceptance check before you call it done
Open each output next to the still and confirm:
- Everything outside the eyes (blink) or mouth/jaw (talk) is visually identical — hair, top, background.
- The blink is a real closed eye (a lid with a dark lash line), not a squint and not a different face.
- talk2 is clearly more open than talk1. If talk1 is indistinguishable from the still, regenerate talk1 once;
  if it still barely differs, keep it anyway (Christine's talk1 is like that and the game copes).
- Her smile teeth: talk frames should keep the same warmth — not a frown, not a shout.

If an output changes the hair colour, redraws the top, or shifts the whole face, regenerate that one
(up to 3 tries). Write one line per frame saying which attempt you kept.

## Do not
- Do not generate a new portrait or restyle the still — these are edits of the approved image.
- Do not produce frames for anyone else; the other five are done.
