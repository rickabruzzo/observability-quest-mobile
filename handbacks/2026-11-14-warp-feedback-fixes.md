# Hand-back: Warp brief 12 — Rick's play-through of 2026-11-14, the fixes that need no new art

Branch `warp/feedback-fixes` from `origin/era-look`; pull request against `era-look`. The brief itself is on
`origin/desktop/feedback-1114` (not yet on `era-look`), so this branch does not carry it; nothing here depends on
that branch's other changes.

## 0. Housekeeping: the folders are gone

All seven `oqm-warp-*` folders beside the project are removed, none with `--force`; `git worktree list` shows only
the main folder, and `git worktree prune` also dropped a stale entry from an old art session. Before removing:

- Every worktree's branch was merged into `origin/era-look` (`git branch --merged origin/era-look` listed all
  seven, `chapter-one` and `profile-walk` included).
- The only untracked files were my `node_modules` symlinks (deleted; symlinks only) and the oldest worktree's
  real Playwright install, which I **moved into the project's own `node_modules/`** (git-ignored) so the e2e
  suite still runs. Nothing else needs installing.
- Worth keeping, now in the main folder's `scratch/warp/`: the era-hero contact sheets and room screenshots
  (`era-hero/`), the conversation-window screenshots (`era-conversations/`), the card screenshots and the
  scripted-timings player (`persona-card/`), the scenario screenshots and the all-five timings player
  (`scenarios/`).

This brief's worktree is `.worktrees/warp-feedback-fixes` inside the project (the new protocol); `.worktrees/`
is git-ignored on `desktop/feedback-1114`, and until that merges it simply shows as untracked in the main folder.

## 1. The stopwatch is for play-tests

After the verdict the player sees `after.prompt` and the two buttons (`after.claim`, `after.more`), centred
(`#after`); no table, no Copy. With `?stats=1` the screen is exactly as before (`#summary`, the grid, Copy). The
flag is `ctx.stats` in `js/game.js`, read from the address once. `window.__oq.run` and the console's JSON line
are unchanged; the tests that read the table open with the flag.

## 2. The verdict for a phone on its side

`js/engine/verdict.js` gained three pure helpers (the brief's screens both need them, and `charity.js` already
imports that module): `narratorLine` (the shouted name off the front of the line), `portraitLayout` (the
portrait on the left, 45 % of the scene wide, its bottom on the scene's bottom edge, the whole height — the art
already crops at the shoulders — cropped sideways round the figure, never past the picture's edges; where the
words may start) and `figureCentre` (the figure's centre column from a 64-px copy of the picture, so each
narrator is framed on their own face).

- **The scenario's verdict** (`paintPortrait`): the portrait drawn by that layout; the words in one window
  on the right (`where: 'right'`, vertically centred, `maxWidth` the space left, up to 12 lines a page), the
  narrator's name above them in the accent colour. At 844×390 every verdict is one page; at 667×375 scenario
  1's is one page of nine lines too.
- **Charity on Claim**: her `<img>` stays (the menu test reads its natural width) and is placed by CSS: left
  0, bottom 0, 45 % wide, 86 % tall, `object-fit: cover`, `object-position` set from `figureCentre`. Her lines
  go in the same window on the right; her header stays across the top. She has no name prefix to strip.
- `js/engine/window.js` gained two options, `name` (a name above the words without a portrait, the same
  `.msg-name`) and `maxLines`; a window without them renders exactly as before.

## 3. Room 3's TV

The dithered halo is gone from the room and the close-up (`GLOW`, `halo`, `flicker`, `glowColour` deleted). The
page's pale background now shifts between three tints laid over the screen — the white as painted, a cooler white
(`rgba(196,214,255,0.22)`), a slightly dimmer one (`rgba(20,30,50,0.10)`) — holding each for 200–600 ms on an
irregular schedule that never repeats a tint twice running (`pageTint`, `TINTS`, `TINT_MS` exported for the
test). Reduced motion: the first tint, still. The guitar picture and the page's colours wait for brief 13.

## 4. The wall stays behind the persona, in every room

Fixed in the engine rather than in `ch4-wall.js`: `paintRoom` clips the wall painter's drawing to the scene less
the persona's patch (`g.clip('evenodd')` round the manifest's rectangle) before the persona's frame is drawn. So
whatever a painter does, the plate's figure shows, frame or no frame. What I found in the other rooms (the clip
now covers them all):

| Room | Wall areas that overlap the persona's patch | Before this fix |
|---|---|---|
| 1 | none | — |
| 2 | the board (x 115–307) overlaps his patch (234–309) | only the path is drawn there, and it stops at 233: no overlap in practice |
| 3 | the page tint (x 102–217) overlaps her patch (9–134) | the tint (and, earlier, the halo) painted over her shoulder |
| 4 | the star map, the chat column and the lane all overlap her patch (209–318) | the chat's grey bars across her hair and forehead (Rick's report) |
| 5 | the monitor's right edge (x 204) touches his patch (204–319) | one column of the chart and inbox bars over his hair |

## The suites, as last run

| Suite | Result |
|---|---|
| `npm test` | **317 passed** (`tests/feedback-fixes.test.js`: the tint schedule, the narrator's name, the portrait's crop) |
| `python3 -m pytest tools/tests -q` | **126 passed** |
| `npm run e2e`, one file at a time | **117 passed**: chapter 33 (4 new), menu 7, scenarios 24, creator 14, intro 17, walk-preview 9, shell 9, weight 4 |

New e2e: no table and no Copy without the flag, the prompt and both buttons centred, the table with `?stats=1`;
at 844×390 and 667×375 the verdict's portrait box ends on the scene's bottom edge in its left half (asserted on
the layout and on the canvas's pixels by region), the window is wholly to its right and inside the scene, the name
is above the words and off the line, and at 844×390 the verdict is one page; Charity's portrait sits on the
scene's left and bottom edges at 45 % with her window wholly to its right; in scenario 4 the star map changes
over 450 ms while not one pixel inside her patch does, with her at rest.

## Screenshots

`scratch/shots/` in this worktree: `verdict-844.png`, `verdict-667.png`, `after-667.png`, `charity-844.png`,
`charity-667.png`, `stats-flag-667.png`, `room3-tv-a.png` / `room3-tv-b.png` (two tints), `room4-wall.png`.

## Calls I made (and what each costs if wrong)

1. **Three files outside the brief's list were touched**: `js/engine/verdict.js` (the pure helpers both screens
   use), `js/engine/window.js` (the `name` and `maxLines` options; additive), and `index.html` (the cache-bust,
   `css?v=18`, `js?v=29`, so phones that cached the old files get these). Without the window options the
   verdict would have needed its own typewriter or DOM poking after `say()`.
2. **The portrait is 86 % of the scene tall** (`PORTRAIT_H` 172 of 200), which at 45 % wide shows about 358 of
   the picture's 640 columns round the figure. If Rick wants more shoulder, lower the height.
3. **The verdict pages at 12 lines**, which no verdict reaches at either size; the ordinary windows keep their
   5–7 line pages.
4. **The clip is in the engine**, so `ch4-wall.js` is unchanged; a painter can no longer paint over a persona.
5. **The TV's tints are overlays**, not repaints of the page, so the art's own frames and panel outlines stay.

## Nothing left over

No string needs a slot; no rectangle was nudged; `script/script.md`, `assets/`, `tools/build_*.py` and the hero
untouched.
