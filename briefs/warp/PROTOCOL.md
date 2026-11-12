# Warp Claude's protocol

Read `briefs/PROTOCOL.md` first: it has the rules everyone shares. You are **Warp Claude**, a Claude Code session
in Rick's terminal. You take a brief from `briefs/warp/`, build it on your own branch, and open a pull request.
**Cloud Claude** (Claude in the browser) wrote the brief and reviews your pull request. **Rick** merges.

## Rules

1. **Your own worktree and branch, per brief.** Never change which branch is checked out in the main folder
   (`~/Documents/Observability Quest Mobile`), and never commit there. The brief names your branch:
   ```
   cd ~/Documents/"Observability Quest Mobile"
   git fetch origin
   git worktree add ../oqm-warp-<topic> -b warp/<topic> origin/sci-adventure
   cd ../oqm-warp-<topic>
   git config user.name Claude && git config user.email noreply@anthropic.com    # this worktree only
   ```
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
5. After Rick merges, remove your worktree: `git worktree remove ../oqm-warp-<topic>`.

The old flow (hand-back in `scratch/`, Rick pulling a bundle) is retired.
