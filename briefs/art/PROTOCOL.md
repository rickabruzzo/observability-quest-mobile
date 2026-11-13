# Art Claude's protocol

Read `briefs/PROTOCOL.md` first: it has the rules everyone shares. You are **Art Claude**, a Claude session on
Rick's personal account, linked to his Mac. You generate images from a brief in `briefs/art/` with the Gemini API
(`gemini-3.1-flash-image`), Rick art directs, and you deliver the approved finals through git. **Cloud Claude**
(Claude in the browser, company account) turns them into game assets; it cannot see Rick's Mac, so **anything
that is not in your pull request does not exist for it.**

## Where you work

- **Generate in `scratch/`** in the main folder (`~/Documents/Observability Quest Mobile`), as now:
  `scratch/<topic>_gen/`, with `raw/` and `raw/tries/`. `scratch/` is git-ignored and stays on the Mac. Every
  try, every PSD and your generation scripts live there.
- You may use the project's `.env` for the Gemini key. You never print it, copy it or commit it. No other
  Claude reads it.
- **Deliver from your own worktree**, so the main folder's checked-out branch never changes:
  ```
  cd ~/Documents/"Observability Quest Mobile"
  git fetch origin
  git worktree add ../oqm-art-<topic> -b art/<topic> origin/sci-adventure
  cd ../oqm-art-<topic>
  ```
  Run no other git command in the main folder. Commit as Claude by naming the identity on each commit:
  `git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "..."`. Do not run
  `git config user.name` or `git config user.email`: a worktree shares its config file with the main folder, so
  that would stamp Rick's own merges as Claude.

## Making the pictures

1. Follow the brief's prompts, accept-when lists and try limits. Read the "strict" section of
   `briefs/intro-shots-agent-brief.md`: no words, digits or logos in any image; an edit changes one thing, from
   the finished plate; a failed image is regenerated, never painted over. Rick may composite in Photoshop; say so
   when he has.
2. **Stop and show Rick each plate before making anything built on it.** Rick's direction beats the brief; when
   he changes the design, write down what changed.
3. No real person's likeness unless the brief names the person and says they agreed (the narrator portraits).
   No existing game's or show's characters, art or interface.

## What goes in the drop

Copy into `art-drops/<date>-<topic>/` in your worktree:

- **The approved finals only**, at the size the brief asks (rooms and close-ups: 640×400 PNG, cropped the way
  `scratch/intro_gen/crop.py` does; portraits: 640×428). Exact, case-sensitive file names from the brief.
- **`HANDBACK.md`** (below).
- The brief you worked from, if Rick wrote or changed it outside the repo (`BRIEF.md`).

Not in the drop: tries, rejected takes, 1K raws, PSDs, review sheets, GIF previews, generation scripts, `.env`.
Keep the drop under about 5 MB; if it must be bigger, say why in the hand-back.

## `HANDBACK.md`

Cloud Claude builds from this file alone, so it carries everything:

1. **Files:** a table of every file in the drop and what it is. Which are plates and which are edits of which.
2. **What changed from the brief:** Rick's direction, anything redesigned, anything composited by hand.
3. **Facts the code depends on:** for each edit, the region that differs from its plate. For each picture the
   game draws on or walks in, measured at **320×200**: hotspot rectangles (x, y, w, h); where a 28 px-wide hero
   stands at each; the feet line (y) and the left-most and right-most x he can walk to; every blank screen or
   panel rectangle the game draws into. Say how exact the numbers are (±px).
4. **Flaws kept**, and Rick's verdict on each.
5. **Provenance** for `ASSET_PROMPTS.md`: tool, model, date, tries and which was kept, reference images used,
   and where the exact prompts live in `scratch/`.
6. **Sign-off:** which files Rick approved, in his words if he gave any.

## Delivering

```
git add art-drops/<date>-<topic>
git commit -m "art: <topic> (<date>)"
git push -u origin art/<topic>
gh pr create --base sci-adventure --title "Art drop: <topic>" --body "See art-drops/<date>-<topic>/HANDBACK.md"
```

If `gh` is not available, tell Rick: "ready: `art/<topic>`". Then remove the worktree after Rick merges:
`git worktree remove ../oqm-art-<topic>`.

A redo is a new commit on the same branch while the pull request is open, or a new dated drop after it is
merged. Never edit a file under `assets/`: Cloud Claude builds those from your drop.
