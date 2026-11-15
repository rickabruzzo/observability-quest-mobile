# Warp brief 12 — Rick's play-through of 2026-11-14: the fixes that need no new art

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first. Branch `warp/feedback-fixes` from
`origin/era-look`; the pull request's base is `era-look`. **Do this brief before brief 11**, and section 0 before
anything.

## 0. Housekeeping: your folders are in Rick's Documents

Rick, 2026-11-14: "Warp is writing files outside of the folder. Let's ask it to fix that and tell it to put files
where they make sense in the file structure." Seven `oqm-warp-*` folders sit beside the project. They are the
worktrees the old protocol told you to make at `../oqm-warp-<topic>`, so this was the protocol's fault, and the
protocol is fixed: worktrees now live in `.worktrees/` inside the project (git-ignored).

Do this once, from the main folder, before starting:

```
cd ~/Documents/"Observability Quest Mobile"
git fetch origin
git worktree list
```

For each of `oqm-warp-chapter-one`, `-profile-walk`, `-hc-solution`, `-era-hero`, `-era-conversations`,
`-persona-card`, `-scenarios-2-5`: confirm its branch is merged (`git branch -r --merged origin/era-look`), move
anything in it worth keeping into the main folder's `scratch/`, then `git worktree remove ../oqm-warp-<topic>`.
Finish with `git worktree prune`. Never `--force`: if a removal is refused, list what it is holding in the
hand-back and leave it. Say in the hand-back which folders are gone.

## 1. The stopwatch is not for players

Rick: "I don't understand the stats after the scenario completes. Why are they there?" They are brief 02's
stopwatch, built to time play-tests. It was never meant to ship on the player's screen.

- After the verdict, the player sees `after.prompt` and the two buttons (`after.claim`, `after.more`), centred.
  No table, no Copy button.
- With `?stats=1` in the address the screen is exactly as it is now, for play-tests.
- `window.__oq.run` and the console's JSON line stay as they are; tests that read the table open it with the flag.

## 2. The verdict is laid out for a phone on its side

Rick: "Having the recap with the copy below doesn't work, this will be played landscape and that recap is
portrait. Better to [have] the portrait off centre with the bottom at the edge so the shoulder crop looks
normal. We can increase the line length for the recap if it fits in the space left over by moving the portrait."

For the scenario's verdict (`paintPortrait` in `js/screens/chapter.js`) and Charity's on Claim
(`js/screens/charity.js`):

- The narrator's portrait is on the **left**, scaled so the **bottom of the picture is the bottom edge of the
  scene**: the shoulders run off the bottom, as a portrait's do. Crop the 640×428 picture to head and shoulders
  so it takes about 45% of the scene's width.
- The words are **one window on the right**, in the space that is left, vertically centred. Use the longest
  line that fits there at the house font. At 844×390 a verdict should fit without paging; page only if it must
  at 667×375.
- The narrator's name comes off the front of the line (`CHRISTINE YEN:`) and goes above the words in the accent
  colour, the way the conversation window shows a persona's name.
- Charity's header stays across the top.

## 3. Room 3's TV: no halo; the page flickers

Rick: "I don't understand what that white fuzz is around the screen. Is that supposed to be monitor glow? It
looks bad. Better to have the screen background white change tint to represent monitor flicker."

- Remove the dithered halo round the bezel (`GLOW` in `js/chapters/ch3-wall.js`), in the room and the close-up.
- The page's pale background shifts between two or three close tints (the white, a cooler white, a slightly
  dimmer one) at irregular intervals of 200 to 600 ms. Small: nobody should read it as a strobe. Reduced
  motion: one tint, still.
- The guitar picture, the page's colours and the instruments cycling through are brief 13, once the art is in.

## 4. Room 4: the wall's animation is painted over the SRE

In the room the chat column's grey bars (`js/chapters/ch4-wall.js`) draw across her hair and forehead. Whatever
the wall paints must stay behind the persona: draw her current frame after the wall, or clip the wall's painting
to its own area less her patch (`assets/rooms/ch4.json`, x 209, y 59, 110×126). Check the other four rooms for
the same overlap and say what you found.

## Tests

- e2e: no summary table without the flag, the table with it; at 844×390 and 667×375 the verdict's portrait box
  touches the scene's bottom edge and its left half, the window is wholly to its right and inside the scene,
  and at 844×390 the verdict is one page; in scenario 4 no pixel inside the persona's patch changes while the
  wall animates and she is not talking.
- Unit: the tint picked at a given time; reduced motion gives one tint.

## Files

**Yours:** `js/screens/chapter.js`, `js/screens/charity.js`, `js/chapters/ch3-wall.js`,
`js/chapters/ch4-wall.js`, `js/game.js` (the flag), `css/game.css`, `tests/`.
**Not yours:** `script/script.md`, `assets/`, `tools/build_*.py`, the hero (brief 11).

## Hand-back

`handbacks/<date>-warp-feedback-fixes.md`: the folders removed; a screenshot of the verdict at both sizes, of
room 3's TV, and of room 4 with the wall running; the suites' counts; every call you made.
