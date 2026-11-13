# How work moves on this repo (from 2026-11-12)

Everything travels through GitHub. Nobody hands files across by folder, and nobody needs the desktop app linked.

| Who | Where it runs | Branches it pushes | Its rules |
|---|---|---|---|
| **Rick** | — | merges pull requests | Decides, art directs, reviews. **The only one who merges into `sci-adventure` or `main`.** |
| **Cloud Claude** (was "Desktop Claude") | Claude in the browser, company account | `desktop/<topic>` | Owns the plan, the script, the spec, asset builds, briefs, and review of every pull request. |
| **Warp Claude** | Claude Code in Rick's terminal | `warp/<topic>` | Builds code from a brief. `briefs/warp/PROTOCOL.md` |
| **Art Claude** | Claude on Rick's personal account, linked to his Mac | `art/<topic>` | Generates images from a brief. `briefs/art/PROTOCOL.md` |

Rules for all three Claudes:

1. **Push only your own branches.** Never push, merge into, rebase, reset or force-push `sci-adventure` or
   `main`. Never rewrite a branch someone else has pulled.
2. **Work lands by pull request into `sci-adventure`**, merged by Rick. One topic per branch.
3. **Start from fresh `origin/sci-adventure`** (`git fetch origin` first).
4. **Hand-backs are files in the repo**, committed on your branch: `handbacks/<date>-<who>-<topic>.md`. The pull
   request description is a short summary that points at it.
5. **Never commit** `.env`, anything under `scratch/`, credentials, or Rick's email address. Do not read or use
   `.env` unless your own protocol says you may.
6. **House rules.** No real competitor names (Cave Logs Inc., Old Artifact, Pretty Good Metrics, Claw Codez).
   No Sierra or other third-party art or code. The Honeycomb logo comes only from the official files in
   `assets/`, never generated.
7. **Commit identity:** `git config user.name Claude && git config user.email noreply@anthropic.com` in your own
   clone or worktree only.

## Who gets what (Rick, 2026-11-13)

- **Every hand-off comes to Cloud Claude**, the company-account Claude in the browser: art drops from Art Claude,
  and pull requests from Warp Claude. Cloud Claude reviews, builds assets, writes the script and decides what
  happens next.
- **Warp Claude is only for heavy code writing.** It gets a brief when the job is a real build. Small changes
  (wiring a new picture in, a few lines of code, copy) are Cloud Claude's to make directly on a `desktop/` branch.

## The loop

1. Cloud Claude writes a brief (`briefs/art/NN-*.md` or `briefs/warp/NN-*.md`) on a `desktop/` branch; Rick merges it.
2. Art Claude or Warp Claude does the brief on its own branch, commits its hand-back, pushes, and opens a pull
   request (or tells Rick "ready: `<branch>`" if it cannot open one).
3. Cloud Claude fetches the branch, reads the hand-back and the diff, runs all three suites, and comments on the
   pull request: good to merge, or what to fix. For an art drop it also builds the game-size assets and pushes
   them, with any script or brief that follows, as a `desktop/` pull request.
4. Rick merges.
