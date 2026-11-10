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
- **Production URL: the Vercel-provided one, for now and possibly for good.** A `honeycomb.io`
  subdomain needs a DNS change from whoever owns the zone and that approval will take a while, so
  the plan does not wait for it:
  - Name the Vercel project so the free URL reads well on a sign — the project name *is* the
    subdomain: `observability-quest` → `https://observability-quest.vercel.app`. Pick the name when
    you create the project (Settings → General → Project Name changes it later, which changes the URL,
    so settle it before anything is printed). If `observability-quest` is taken, try
    `honeycomb-quest`, `o11y-quest`, `play-observability-quest`.
  - **Print the QR with the `.vercel.app` URL.** It keeps working forever, including after a custom
    domain is added — Vercel serves both. Nothing has to be reprinted when the CNAME lands.
  - When/if `quest.honeycomb.io` (or similar) is approved: Vercel → Project → Settings → Domains →
    Add; it shows the exact CNAME record for the DNS owner. Then switch the QR for *new* print runs
    only. Optionally set the `.vercel.app` URL to redirect to the custom domain at that point
    (Domains → "Redirect to") so attribution lands in one place.
  - Production branch: `main`. Every push to `main` deploys production; every other branch gets a
    preview URL (`<project>-<hash>-<team>.vercel.app`), which is how we test on phones.
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

- URL to encode: the production `.vercel.app` URL (see §2), with a per-event query string for
  attribution, e.g. `https://observability-quest.vercel.app/?e=reinvent26`. The game reads `e` and passes it into the HubSpot hidden
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
3. Vercel project name (this is the public URL until a honeycomb.io subdomain is approved).
4. HubSpot Portal ID + Form GUID + region, once the form exists.
5. Per-event code convention for the QR (`e=reinvent26` style) — or I'll pick one.
