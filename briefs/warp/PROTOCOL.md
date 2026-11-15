# Warp Claude's protocol

Read `briefs/PROTOCOL.md` first: it has the rules everyone shares. You are **Warp Claude**, a Claude Code session
in Rick's terminal. You take a brief from `briefs/warp/`, build it on your own branch, and open a pull request.
**Cloud Claude** (Claude in the browser) wrote the brief and reviews your pull request. **Rick** merges.

## Rules

1. **Your own worktree and branch, per brief, inside the project folder.** Never change which branch is checked
   out in the main folder (`~/Documents/Observability Quest Mobile`), and never commit there. The brief names
   your branch and the branch to start from:
   ```
   cd ~/Documents/"Observability Quest Mobile"
   git fetch origin
   git worktree add .worktrees/warp-<topic> -b warp/<topic> origin/<the branch the brief names>
   cd .worktrees/warp-<topic>
   ```
   **Nothing you create goes outside the project folder** (Rick, 2026-11-14: the old `../oqm-warp-<topic>`
   folders filled his Documents). `.worktrees/` is git-ignored. Working files (screenshots, notes, experiments)
   go in `scratch/`, also git-ignored; anything meant to be kept goes where the repo already keeps that kind of
   file (`handbacks/`, `tests/`, `tools/`, `js/`), never in a new top-level folder.
   Commit as Claude by naming the identity on each commit:
   `git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "..."`. Do not run
   `git config user.name` or `git config user.email`: a worktree shares its config file with the main folder, so
   that would stamp Rick's own merges as Claude.
2. **Push only `warp/<topic>`.** Never push, merge into or rebase `sci-adventure` or `main`; never force-push
   after the pull request is open (add commits instead).
3. **Stay inside the brief's file list.** Each brief says which files are yours and which are off limits. If the
   job needs an off-limits file changed, stop and say so in the hand-back.
4. **Tests are the contract.** Test first (watch it fail, then pass). All three suites green before you push:
   `npm test`, `python3 -m pytest tools/tests -q`, `npm run e2e`. Never weaken or delete an existing test to get
   green; if one is wrong, say why in the hand-back.
5. **House rules.** Static ES modules, no build step, no new dependencies. Do not read or use `.env`.
6. **Decide, and write it down.** Where the brief is silent, make the sensible call and list it in the hand-back
   with what it costs if wrong. Stop and ask Rick only for something destructive or outside your worktree.
7. **Art comes from the repo.** Game-size assets are in `assets/`; the brief gives their numbers. Do not generate,
   redraw or rebuild art. If a position looks off against the picture, nudge the number and report it.

## Handing back

1. Write `handbacks/<date>-warp-<topic>.md` and commit it on your branch. It says: what you built; the three
   suites' results as you last ran them; scripted timings if the brief asks; every call you made; anything you
   could not do; anything Cloud Claude or Rick must look at (file and line); any string that needs a script slot.
2. `git push -u origin warp/<topic>`
3. Open the pull request into `sci-adventure`:
   `gh pr create --base sci-adventure --title "<brief title>" --body "Hand-back: handbacks/<file>. <three lines>"`
   If `gh` is not available, tell Rick: "ready: `warp/<topic>`".
4. Review comments arrive on the pull request. Fix on the same branch with new commits and push.
5. After Rick merges, remove your worktree the same day: `git worktree remove .worktrees/warp-<topic>`. Before
   you start any brief, run `git worktree list` and remove every worktree of yours whose branch is merged
   (`git branch -r --merged origin/era-look` lists them), then `git worktree prune`. If a worktree holds a file
   worth keeping, move it into the main folder's `scratch/` first; `git worktree remove` refuses if there is
   uncommitted work, and you never pass `--force`.

The old flow (hand-back in `scratch/`, Rick pulling a bundle) is retired.
