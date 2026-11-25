# Cloud Claude review: Warp brief 18, the conversation window clears the hero's head (2026-11-25)

Reviewed `warp/talk-window` (24251ae, pull request #35): the hand-back, the whole diff, the suites, and all five
rooms at 844×390 and 667×375 with the persona's first line up. `desktop/talk-window-review` is `era-look` with
Warp's branch merged in and two changes on top. The merge was clean.

Warp's work is right and is the brief: the rule is pure and tested (`talkLines` in `js/engine/conversation.js`),
the window measures itself instead of copying numbers, and it settles the name and the portrait together.

## Changed here

**1. Room 3's name no longer wraps.** THE FRONTEND DEVELOPER did not fit the words column in that narrow window,
took two lines, and put the window on his hair even at two lines (Warp's table: 1.0 and 8.9 px). A name wider than
the column is now set smaller, a pixel at a time, never below 16 px (the floor for read text), so it stays on one
line. Only that name changes; the others are as they were. The browser test now requires every room to clear him,
with no two-line exception, and the name to be one line at 16 px or more. It failed on Warp's code in room 3 at both
sizes and passes now.

**2. The portrait only shrinks.** My brief said today's portrait was the height of the name and four lines. It was
four lines (Warp caught it). Following my wording, a four-line window's portrait grew from 106 to about 123 px and
took width from the words. Rick asked for the window to shrink to clear the hero, so the portrait is now as tall as
the name and the lines but never taller than today's four lines: a four-line window looks exactly as before. The
browser test checks that.

## As built, the persona's first line

| Room | 844×390 | 667×375 |
|---|---|---|
| 1 | 3 lines, clear by 10 | 3 lines, clear by 5 |
| 2 | 2 lines, clear by 6 | 2 lines, clear by 2 |
| 3 | 2 lines, clear by 11 | 2 lines, clear by 9 |
| 4 | 3 lines, clear by 16 | 3 lines, clear by 11 |
| 5 | 2 lines, clear by 14 | 2 lines, clear by 10 |

Room px (320×200) between the window's bottom edge and the top of his hair. No room gets four lines on a phone.

## Suites

| Tree | Unit | Python | Browser |
|---|---|---|---|
| `warp/talk-window` as handed back | 438 | 151 | 185 |
| `desktop/talk-window-review` | 438 | 151 | 185 |

## For Rick's eye, on a phone

Talk to each persona. Rooms 2, 3 and 5 page two lines at a time, so they take more taps.

## Next

Nothing is waiting on me. Still unbriefed: the soundtrack, and going live.
