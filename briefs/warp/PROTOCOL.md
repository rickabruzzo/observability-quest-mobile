# Working agreement: Warp Claude and Desktop Claude

Two Claude sessions work on this repo for Rick.

- **Desktop Claude** — the session in the Claude desktop app. Owns the plan, the art loop with Rick, merging and
  staging. It cannot run git in Rick's folder, so it hands Rick a bundle to pull.
- **Warp Claude** — you, a Claude Code session in Rick's terminal (Warp). You take a brief, build it on your own
  branch in your own folder, and hand back.
- **Rick** — decides, reviews, and is the only one who pushes.

## Rules for Warp Claude

1. **Your own worktree and branch, per brief.** Never work in, commit to, merge into, rebase or reset
   `sci-adventure` or `main`, and never change which branch is checked out in the main folder
   (`~/Documents/Observability Quest Mobile`). Rick pulls Desktop Claude's bundles into `sci-adventure` there
   while you work. The brief names your branch; create it as a worktree beside the main folder:
   `git -C "<main folder>" worktree add ../oqm-warp-<topic> -b warp/<topic> sci-adventure`
2. **Do not push, do not open PRs, do not merge.** Commit on your branch as you go. Rick pushes your branch when
   you hand back; Desktop Claude fetches it, reviews, merges into `sci-adventure`, reruns every suite and stages
   the result for Rick.
3. **Stay inside the brief's file list.** Each brief says which files are yours and which are off limits.
   If the job needs an off-limits file changed, stop and say so in the hand-back — do not edit it.
4. **Tests are the contract.** Test first (watch it fail, then pass). All three suites green before hand-back:
   `npm test`, `python3 -m pytest tools/tests -q`, `npm run e2e`. Never weaken or delete an existing test to get
   green; if one is wrong, say why in the hand-back.
5. **House rules.** Static ES modules, no build step, no new dependencies. No real competitor names; no Sierra
   or other third-party art or code; the Honeycomb logo comes only from the official assets in `assets/`.
   Rick's email address is private. Do not read or use `.env`.
6. **Decide, and write it down.** Where the brief is silent, make the sensible call and list it in the hand-back
   with what it costs if wrong. Stop and ask Rick only for something destructive or outside your worktree.
7. **Hand back** by writing `scratch/warp-<topic>-handback.md` in the **main folder** (it is git-ignored there),
   then tell Rick: "ready — push `warp/<topic>`". The hand-back says: what you built; the commit range; the
   three suites' results as you last ran them; every call you made; anything you could not do; anything Desktop
   Claude or Rick must look at (with file and line).

## What Desktop Claude does with a hand-back

Fetches `warp/<topic>` from GitHub, reads the hand-back and the diff, runs the suites, has a fresh reviewer look
at anything substantial, merges into `sci-adventure`, and sends Rick a bundle. Follow-up work comes as a new
brief or an addendum in `briefs/warp/`.
