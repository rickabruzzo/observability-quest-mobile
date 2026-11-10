# Observability Quest Mobile — Infrastructure Requirements

What has to exist outside the code for this to run at a booth. Everything here is Rick's side; the
game itself is static files and needs nothing else. Ordered roughly by when you'll need it.

## 1. Code hosting (needed first — this is where the build lands)

- **Git repository.** Suggest GitHub, `honeycombio/observability-quest-mobile` if it should live
  with company assets, or under your own account if you want to move fast and transfer later
  (the badge games are already under your account). Public vs private is your call; nothing
  secret is in the repo (`.env` is gitignored), but the portraits are colleagues' likenesses.
- Default branch `main`. The build will be delivered as a folder you `git init` + push, or a
  branch on a repo you create — tell me which repo URL once it exists.

## 2. Static hosting — Vercel

- **Vercel project** connected to the repo above. Framework preset: "Other" (no build step),
  output directory `/` (root). No environment variables are needed for the game.
- **Production domain.** Options, pick one:
  - Free `*.vercel.app` subdomain — fine for testing, ugly on a QR sign.
  - A Honeycomb subdomain, e.g. `quest.honeycomb.io` — needs a CNAME from whoever owns
    `honeycomb.io` DNS (Marketing Ops / IT). Vercel will show the exact record to add. Allow a
    day or two for that request.
  - A short vanity domain you register yourself (e.g. `o11yquest.com`) — fastest path to a
    clean QR, no DNS ticket; ~$12/yr.
- **HTTPS** is automatic on Vercel for any of the above.
- **Preview deployments** on every branch/PR are automatic — that's how we'll test on phones
  before anything is live.
- Nice-to-have: **Vercel Web Analytics** (one toggle) for play-count / drop-off by screen without
  any cookie banner. Not required.

## 3. HubSpot (needed before review sign-off, not before build)

- **A HubSpot form** for the prize claim. Fields: Email (required). Suggested hidden fields the
  game can fill: `event_name`, `quest_score` (0–5), `quest_source=qr`. Hidden fields need matching
  contact properties — create `quest_score` (number) and `quest_event` (single-line text) if
  they don't exist, or reuse what Field Marketing already uses for event source.
- **Free-email blocking:** Form settings → Options → "Block free email providers" (and/or the
  domain blocklist). This is the gate you wanted; it's a checkbox.
- **Form behavior:** inline thank-you message (not a redirect) so the game can advance on
  HubSpot's `onFormSubmitted` callback.
- **Embed type:** the *script* embed (`js.hsforms.net/forms/embed/v2.js` + `hbspt.forms.create`),
  not the iframe embed — the script version can be restyled to match the game.
- **I need from you:** Portal ID and Form GUID (both in the embed snippet), and the region
  (`na1`/`eu1`).
- **Domain allowlist:** HubSpot forms can restrict which domains may host them; add the Vercel
  production domain and `*.vercel.app` for previews, or leave unrestricted.
- **Consent / privacy:** confirm whether Honeycomb's standard GDPR consent language or a privacy
  policy link is required on event capture forms. If yes, add it in the HubSpot form so it renders
  with the form.
- **Lead routing:** whatever list / workflow / campaign Field Marketing uses for booth leads —
  associate the form with the event campaign so attribution matches badge-scanner leads.

## 4. QR code and signage

- URL to encode: production domain, with a per-event query string for attribution, e.g.
  `https://<domain>/?e=reinvent26`. The game reads `e` and passes it into the HubSpot hidden
  field `event_name`. One QR per event; same code everywhere at that booth.
- Generate the QR at high error correction (level H) so it survives booth lighting and a
  slightly curved banner. SVG or ≥ 2000 px PNG for print.
- Minimum print size: 2 in / 5 cm per side for a counter card, 8 in / 20 cm for a banner people
  scan from a step away. Quiet zone (blank margin) of at least 4 modules.
- Test scan with iPhone Camera and Android Camera before print.
- Copy near the code: "Play Observability Quest · 3 minutes · win a prize" — short; the game
  explains itself.

## 5. Booth operations

- **No network needed to play** once a phone has loaded the page. Attendees need signal to scan
  and load (~1–3 MB) and to submit the form. Conference wifi or cellular both fine.
- **Staff phones:** the end screen has a "STAFF: MARK REDEEMED" button that greys out the
  completion screen on the attendee's phone. No staff app, no login. Brief staff: ask to see the
  completion screen, tap REDEEMED, hand over the prize.
- **Prize inventory** scaled to expected completions; the form gives you the count live in
  HubSpot.
- **Fallback if HubSpot is unreachable** (wifi dead at submit time): the game shows "We'll grab
  your email at the booth" and still shows the completion screen, so staff should have a
  paper/badge-scanner fallback for capturing those few.

## 6. Approvals and content (parallel track)

- **Likeness sign-off:** Jess picks her portrait variant; Christine, Emily, Graham, Matt, Charity
  presumably approved for the badge — confirm that approval extends to a public web URL and to
  the new blink/talk frames.
- **Title changes:** Emily (Sr VP Operations), Matt (President, Go-To-Market), Jessitron
  (Eng Manager of Developer Relations) — confirm exact strings with the people.
- **PMM review** of the game as a whole, same as the badge version went through. Nothing in the
  copy changed except the titles.
- **Music:** original composition, no licensing needed. You'll approve the loop by ear.
- **Competitor names** (Splunk, New Relic, Grafana) appear in the copy exactly as on the badge.
  Public web is more visible than a badge; worth a 30-second check with Legal/PMM that nobody
  minds.

## 7. Test devices

- At least one iPhone (Safari) and one Android (Chrome). The Vercel preview URL is all that's
  needed. Specific things to check on real hardware: audio starts on the Start tap, pixel art
  stays crisp, nothing hides behind the home indicator, the HubSpot form is tappable and the
  keyboard doesn't push the layout off-screen.

## Not needed

- No server, database, API keys, cron jobs, or secrets at runtime.
- No app store accounts.
- No Gemini access for the build itself — all generated frames already exist in `scratch/`.
  Only Jessitron's blink/talk frames remain, from your personal setup once Jess has picked.

## Summary — what I need from you, in order

1. Repo URL (or "create it under my account and I'll transfer").
2. Vercel project connected; tell me the preview URL pattern.
3. Domain decision.
4. HubSpot Portal ID + Form GUID + region, once the form exists.
5. Per-event code convention for the QR (`e=reinvent26` style) — or I'll pick one.
