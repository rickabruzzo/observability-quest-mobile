# Cloud Claude review: Warp brief 17, the ending (2026-11-19)

Reviewed `warp/the-ending` (479dda0, pull request #33): the hand-back, the whole diff, the suites, and the
ending in a browser at 844×390 and 667×375 with the clock held, beat by beat.

`desktop/the-ending-review` is **the title review** (`desktop/title-screen-review`, not yet merged) **with
Warp's ending merged on top** and three changes of mine. Merging it brings in pull requests #32 and #33 and
both reviews. The merge was clean.

Warp's work is right, and it is the brief: Claim, Charity's two lines, the coda in its four beats, the staff
screen, Play more, "My prize" on the menu once claimed, Skip, reduced motion, and the words over black when
the pictures fail. Every position comes from `coda.json`.

**The pictures are the labelled stand-ins**, as planned. The coda looks like flat blocks until Art Claude's
dawn painting lands (art brief 09); the sunglasses do not show yet for the same reason.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/the-ending` as handed back (on `era-look` without the title) | 415 | 149 | 168 |
| title review + Warp's ending, before my changes | 425 | 149 | 175 |
| `desktop/the-ending-review` | 427 | 149 | 175 |

Browser: all 175 passed on the merged tree. After my changes I reran the five files they touch (ending, menu,
chapter, weight, shell), which pass; the other eight were not rerun.

## Changed here

**1. Each of the coda's lines is one window.** As built, each took two: the window was held to two lines, the
three lines each wrap to three, and the page turned in the middle of a sentence ("…The street is the same
street. You" / "are not the same engineer."). The rule that sized the window took the window's 6 px top margin
as game pixels, which made it a line too cautious; and my stand-in layout left four rows fewer above his head
than it could. Now `windowBottom` is 64 (his head starts at 70; the stand-in sun stops at 66), the window
takes every line that fits above it, and that is three on both phone sizes. Three taps for the three lines,
not six. Tests first: the rule, and in a browser that each line shows whole in one window.

**2. "The Engineer puts on sunglasses."** A hero with no name is "the Engineer", and the third line begins
with the name, so it began with a small letter. A line that begins with the name now begins with a capital.

**3. `claim.soon` is out of the script**, as the brief promised once nothing said it.

## Warp's calls

All sound. The one worth knowing: three browser tests wait 400 ms before a tap that follows a screen change,
because the game refuses a second screen change within 350 ms. A person does not tap that fast, and the
coda's Skip retries by itself, so an early tap is not lost.

## For Rick's eye

1. On the preview: solve a scenario, Claim, and watch it through. The pictures are blocks; the timing, the
   three lines and the staff screen are what to judge. `the-ending-as-built.png` (sent) is eight moments of it.
2. The staff screen is the plain placeholder you asked for.
3. The sunrise replays on every Claim, with Skip. Say if once a session would be better.

## Next

- Art Claude: brief 09. When it lands I cut the paintings in, set the layout's numbers from the hand-back,
  and add the sunglasses to the hero's sheet. No Warp work is needed for that.
- Still unbriefed: the conversation window over the hero's head (four rooms), and the soundtrack.
