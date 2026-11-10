# Observability Quest Mobile — Design

**Date:** 2026-11-09
**Owner:** Rick Abruzzo (Honeycomb Field & Events)
**Status:** Draft for review

## Intent

Port the Observability Quest badge game (MicroPython, Pimoroni Tufty 2350, BadgeOS) to a mobile web app that a conference attendee reaches by scanning a QR code at the Honeycomb booth. They play the five-scenario choose-your-own-adventure on their phone, enter a work email at the end, and are told to return to the booth for a small prize.

Why: the badge game only reaches people who have a badge in hand. A QR version reaches anyone walking past, gives them a 2–3 minute reason to engage with Honeycomb's customer stories, and converts completion into a captured lead and a second visit to the booth.

## Goals

- Faithful port of the existing game: same five scenarios, same copy, same win/lose outcomes, same Charity verdicts, same Sierra On-Line EGA look.
- Works on any modern phone browser from a QR scan with no install and no sign-in.
- Loads fast and keeps working on bad conference wifi once loaded.
- Ends with a work-email capture (HubSpot form, placeholder for now) and a "show this to booth staff" completion panel.
- Feels like a Sierra adventure game: title screen with original chiptune music, Start button, short how-to-play, typewriter text, chunky pixel art.
- Modest animation upgrades where the web makes them cheap (scene transitions, text box reveal, choice highlight, score tally).

## Non-goals

- Not a redesign of the game, its structure, or its copy. Copy changes are limited to the roster updates below.
- Not a new art direction. Existing art is reused; nothing is regenerated unless a roster swap requires it.
- No accounts, leaderboards, sharing, or multiplayer.
- No analytics beyond what the HubSpot form provides (can be added later).
- No native app, no app-store presence.

## Anti-goals (what would make this a failure even if it "works")

- Blurry or smeared pixel art from bilinear upscaling. Pixel edges must stay hard.
- A HubSpot form that looks like a HubSpot form pasted onto a Sierra screen.
- Audio that autoplays or nags; or music that is recognizably a Sierra composition. Music must be original.
- Any dependence on the booth network during play. Once the page is loaded, the whole game must run offline until the form submit.
- Losing the asset provenance again. Prompts, model, and sizes get recorded in the repo.

## Constraints

- Hosting: static files only. Target is Vercel (Rick already hosts other tools there). No server-side code.
- Stack: plain HTML, CSS, and JavaScript. No framework, no build step. One `index.html` plus an `assets/` folder is the ideal; a small number of separate JS/CSS files is acceptable if it keeps the code readable.
- Third-party code: a QR library is not needed. The HubSpot forms embed script is the only external script, and it is loaded only on the final screen. Any pixel font must be freely licensed (OFL or similar) and self-hosted.
- Honeycomb brand palette: Slate `#25303E`, Cobalt `#0278CD`, Pacific `#0298EC`, Lime `#64BA00`, Honey `#FFB000`, Tango `#F96E10`, Indigo `#51368D`, Denim `#01487B`. The game UI uses Tango for the text-box border, Honey for highlighted text and names, Pacific for titles, Lime for "start/play again" prompts, matching the badge.
- Working folder on Rick's computer: `~/Documents/Observability Quest Mobile`. Source badge app for reference: `~/Documents/tufty2350/HNY-apps/observability_quest`.

## Source material

From the badge app (`app/__init__.py`, v1.1.0):

- Game state machine: TITLE → INTRO → CHOICE → WIN | LOSE → (next scenario) → FINAL → TITLE.
- `SCENARIOS` array (5 entries): `image`, `intro[]` (two text pages each; first starts with ROLE\nCOMPANY header rendered as "You are a {Role} at {Company}."), `narrator` [name, title], `choice_a` (Honeycomb), `choice_b` (competitor), `win_text`, `lose_text`.
- Six Charity verdicts keyed by score 0–5.
- CTA detection: a line that is ALL CAPS and ends in `?` is always shown on its own.
- Narrator win/lose screens show a full-screen portrait with name (Honey) and title (Pacific) in the text box header.

Assets (`app/Assets/`), all 320×214 PNG: `title_screen`, `s1_llm`, `s2_microservices`, `s3_ecommerce`, `s4_spaghetti`, `s5_payments`, `portrait_christine`, `portrait_emily`, `portrait_graham`, `portrait_julie`, `portrait_matt`, `portrait_charity`. Also `hc_logo_white.png` 163×48, `hc_logomark.png` 48×48.

Asset provenance: scenes were generated in Adobe Firefly using Gemini 3.1 (Nano Banana 2), 3:2 aspect, 1K output, with prompts beginning "Sierra On-Line EGA pixel art adventure game scene, 320x200, 1989 era…" and Honeycomb hex codes named in the prompt. The full prompts are in Rick's Firefly history. The 1K originals still exist there.

## Roster and copy changes

| Scenario | Narrator | Title in badge | Title for mobile |
|---|---|---|---|
| 1 | Christine Yen | CEO & Co-Founder | unchanged |
| 2 | Emily Nakashima | SVP, Engineering | **Sr VP Operations** |
| 3 | Graham Siener | SVP, Product | unchanged |
| 4 | Julie Neumann → **Jessitron (Jessica Kerr)** | CMO | **Eng Manager of Developer Relations** — Julie stays in as placeholder until the Jessitron portrait is generated and approved |
| 5 | Matt Nelson | CRO | **President, Go-To-Market** |
| Final | Charity Majors | CTO & Co-Founder | unchanged |

Scenario data in code must make the narrator swappable with a one-line change (name, title, portrait filename). Mark Julie's entry with a `// PLACEHOLDER — replace before launch` comment.

## Screens and flow

All screens share one layout: scene/portrait art on top, Sierra text box below, control area at the bottom. Portrait phone, one hand.

### 1. Title
- `title_screen` art, Honeycomb white logo over it (as on badge).
- Original chiptune title loop (see Audio). Music is silent until the user taps Start — the Start tap is the audio unlock.
- Big **START** button in Lime, blinking slowly like the badge's "[ ANY BUTTON TO START ]".
- Small mute toggle, persistent across screens, in a corner. Remembered for the session.

### 2. How to play (new)
- One text-box page, typewriter reveal. Content, Rick to edit:
  > Five real Honeycomb customer stories. Read the situation. Pick your move. See how it plays out.
  > Tap the text to skip ahead. Tap NEXT when you're ready.
- **BEGIN** button.

### 3. Scenario intro
- Scene art for the scenario.
- Text box with typewriter reveal of the intro text, paginated to fit the box. Tap anywhere on the box to complete the current page instantly; tap again (or NEXT) to advance. BACK goes to the previous page.
- The CTA line (e.g. "HOW DO YOU INVESTIGATE?") is always its own final page, in Honey.
- Pagination: measure real text against the box rather than hard-coding line counts; the CTA-isolation and mid-sentence-ellipsis rules from the badge carry over.

### 4. Choice
- Same scene art. Text box becomes a two-option menu with Cobalt border, as on the badge.
- Options are tap targets at least 48px tall. The first line (e.g. "HONEYCOMB", "SPLUNK") in Honey when highlighted; the second line in the body color. No confirm step — tapping an option selects it (the badge needed UP/DOWN then B; a phone doesn't).
- Order of options: Honeycomb first, competitor second, as in the badge. (Randomizing would change the game; not in scope.)

### 5. Outcome (win or lose)
- Narrator portrait full-frame. Text box header shows name (Honey) and title (Pacific). Outcome text typewriter-revealed and paginated.
- Win adds 1 to score. Running score shown small in the control bar (e.g. "SCORE 2/3").
- Last page shows **NEXT SCENARIO** (or **SEE YOUR RESULT** after scenario 5).

### 6. Final verdict
- `portrait_charity`, header "CHARITY MAJORS / CTO & CO-FOUNDER", verdict text by score (the six existing variants), then **CLAIM YOUR PRIZE**.

### 7. Prize claim (new)
- Text box becomes the form. Placeholder: single email field, label "Work email", button **CLAIM PRIZE**. Client-side check that it looks like an email; no free-mail blocking in the placeholder (HubSpot will do that).
- Reserved slot for the HubSpot form embed, clearly commented, with CSS that restyles the HubSpot-rendered form to match the text box (dark field, Honey label, Lime button, pixel font). Form ID and portal ID come later, after review.
- Submitting the placeholder advances to the completion panel. Submitting the real HubSpot form advances on HubSpot's `onFormSubmitted` callback.

### 8. Completion (new)
- Large panel: **YOU FINISHED OBSERVABILITY QUEST** / score / "SHOW THIS SCREEN TO HONEYCOMB BOOTH STAFF."
- Small **STAFF: MARK REDEEMED** button at the bottom. Tapping it asks "Mark as redeemed?" and then greys the panel and stamps REDEEMED across it. State persists in `localStorage` so reloading doesn't un-redeem it. Staff may ignore the button.
- **PLAY AGAIN** link, small, returns to Title with score reset (redeemed state is not cleared).

## Layout and scaling

- Design for a 390×844 CSS-pixel phone (iPhone 14/15 class) and let it flex from 360 to 430 wide. Landscape phones and desktop get the same layout centered with dark margins; no separate desktop design.
- Art is 3:2 (320×214 ≈ 1.5). At full phone width that is roughly 390×261 CSS px. Render with `image-rendering: pixelated` (plus `crisp-edges` fallback). Draw into a `<canvas>` at an integer multiple of the source and let CSS scale the canvas to the available width, so the pixel grid stays regular even at fractional overall scale.
- Asset pipeline (**Rick's decision**): all 12 images (title, 5 scenes, 6 portraits) at **640×428, nearest-neighbor from the Firefly 1K originals**. Status 2026-11-09 evening: the 11 existing images are exported and sit in `scratch/exports/`; the S2 label typo ("Paymeits") was fixed with a Gemini region edit and the corrected file is already in `assets/`. The 1K originals are in `scratch/firefly_originals/`. Jessitron has four 1K variants and four 640 downsamples in `scratch/exports/jessitron/`, awaiting Jess's pick. The builder moves the 10 remaining exports into `assets/` as the first build task. The 320×214 badge files are kept in `source/badge/` for reference only.
- Text box: Tango 2px border on near-black, 8px inset, as the badge. Body text in a pixel font at a size that gives roughly 32–36 characters per line at 390 wide, line-height ~1.4. Headers (name/title) in the smaller pixel font.
- Fonts: the badge uses BadgeOS fonts (`yesterday.ppf`, `nope.ppf`) that are not available for the web. Pick one freely licensed bitmap-style web font for body and one for the small header/labels that read as early-'90s Sierra. Candidates to try against the badge screenshots: Pixelify Sans, VT323, Silkscreen, Press Start 2P (likely too wide for body). Show Rick two or three side by side before committing.
- Safe areas: respect `env(safe-area-inset-*)`; keep the control bar above the home indicator.

## Interaction model

Badge had five buttons; phone has taps.

| Badge | Mobile |
|---|---|
| Any button to start | START button |
| A = back page, C = next page | BACK / NEXT buttons in the control bar; tap on text box = finish typewriter, then next |
| UP/DOWN + B to choose | Tap the option |
| Any button after outcome | NEXT SCENARIO button |
| Any button at final | CLAIM YOUR PRIZE button |

Everything is a tap. No swipes required (swipe-to-advance may be added as a bonus but every action must have a visible button). Haptic feedback via `navigator.vibrate` on choice, where supported.

## Animation

Two layers. The UI layer is cheap CSS/JS; the scene layer is a code-driven canvas animation drawn over the approved still art. The scene layer was scoped by Rick on 2026-11-09 (see `docs/animation-handoff.md` for the full concept, measured coordinates, extracted path data, and generated frames). It is a real feature, not polish, and gets its own tasks in the plan.

### UI layer
- Scene change: 200ms fade to black and back.
- Text box: 150ms slide-up on first appearance per screen.
- Typewriter: ~25ms per character; tap to complete instantly.
- Choice tap: selected option flashes Honey twice before the outcome appears.
- Final verdict: score counts up 0→N in the control bar.
- Title: blink on START (900ms period, like the badge's `blink()`).

### Scene layer (approved concept)

| Scene | What moves |
|---|---|
| Title | Stars twinkle; slow glow pulse on the logo; shimmer along the orange horizon line |
| S1 LLM server room | Text scrolling on the monitors; one screen glitches now and then; status LEDs blink; the character idles (small bob); light flashes travel through the overhead cables |
| S2 Microservices | Request dots flow from the cloud down the lines to the services; one service flashes red occasionally |
| S3 E-commerce | Product panel cycles drum kit → keyboard → guitar. Drums and keyboard: progress bar loads to 100%, right panel shows SOLD. Guitar: bar crawls and stalls at 13%, right panel shows the existing WARNING / page-load times |
| S4 Tool spaghetti | Panels and alerts flash out of sync; the "!!" above the character bounces; light flashes travel through the tubes |
| S5 Payments | Coins start silver. Data moves left→right; each coin in turn pops, spins, turns gold, lands, twinkles. PAY2 wobbles and its coin turns copper. Then (Claude's default, Rick can override) BANK's coin turns gold after a longer pause |
| Portraits | Occasional blink; mouth flaps while the narrator text types out |

### Rendering approach
- One `<canvas>` at 640×428 (the export size). Art pixels are ~2 device-independent px, so all overlay drawing snaps to a 2px grid (a 320×214 logical grid). Draw order per frame: clean plate → animated sprites/overlays. The canvas is then CSS-scaled to the phone width with `image-rendering: pixelated`, so overlays and art share one grid.
- Animation steps at 8–12 fps (quantised time) for the 1989 feel, independent of the display refresh.
- `prefers-reduced-motion: reduce` → draw the still only; UI fades/slides off; typewriter defaults to instant-complete.
- Clean plates = the still with moving parts removed (S5 without coins and the PAY2 box; S4 without "!!"; S3 left panel without the product). Where the background is not flat black, small holes are filled with OpenCV inpainting at build time and checked by eye.
- Sprite frames are composited at build time from the Gemini edits in `scratch/anim_gen/`: resize the 1264×848 edit to 640×428, align the changed region to the plate (small x/y search), paste only that region. Blink: eye band only. Talk: mouth/jaw only. S3 products: left panel product + price only.
- **The Gemini edit frames are JPEG (despite the `.png` names), so every composited region must be palette-snapped to the plate's own colors before use** — map each pixel to the nearest color in the plate's palette — or JPEG ringing leaks into pixel art. If a frame cannot be cleaned to match, it is redone or hand-pixelled rather than shipped soft.
- Picks already made (from the handoff): `s3_drums_1`, `s3_keys_1`; christine uses still + `talk2` as a two-frame flap; graham's talk composites kept tight to avoid his skin-tone shift.
- A preview page (`anim-preview.html`) shows every scene and portrait animating side by side, for review before integration.
- Jessitron's blink/talk frames wait for Jess's portrait pick and need Gemini (from Rick's personal setup) or hand-pixelling; she ships with the still until then.
- Budget: each scene's animation code should stay small; the whole scene layer including frames must keep total page weight under 3 MB (raised from 2 MB for the extra frames). Frames for a scene load with that scene, not up front, except the title.

## Audio

- One original title/menu loop, ~30–45 seconds, written for this project in the Sierra adventure-game idiom (AdLib/MT-32 feel: square or pulse lead, brass-like fanfare opening, arpeggiated bass, simple drum ticks). It must not quote or closely paraphrase any existing Sierra melody.
- Rendered in-browser with the Web Audio API from a note sequence embedded in the JS (no audio files to load). The same synth plays small UI blips: page advance, choice select, win sting, lose sting, final fanfare.
- Starts on the Start tap (iOS/Android autoplay rules). Mute toggle on every screen. Audio state remembered in `sessionStorage`.
- The in-game loop may keep playing softly during scenarios or stop after the how-to-play screen; builder's call, with a constant to flip it. Default: continue at reduced volume.
- Rick will hear the loop in isolation before it is locked in; the note sequence lives in its own file so it can be swapped without touching the game.

## Email capture and HubSpot

- Placeholder form for now (see screen 7). The HubSpot embed is added after the game passes review.
- When added: load `//js.hsforms.net/forms/embed/v2.js` only when screen 7 is shown; create the form into a container inside the text box; restyle with CSS (HubSpot v2 script embeds are plain DOM, not iframes, so they can be styled). Free-email blocking is configured in HubSpot, not in the game.
- Fallback if the embed fails to load (no network): show the placeholder form with a message "We'll grab your email at the booth" and still advance to completion, so nobody is stuck.
- No other data leaves the phone. Score is not sent to HubSpot in v1 (could be added as a hidden field later; note the slot).

## Hosting and QR

- Static deploy to Vercel. Builder sets up `vercel.json` only if needed (it shouldn't be).
- Final URL is Rick's call; `oq.honeycomb.io`-style vanity is nice but not required. The QR code itself is produced outside this project.
- Cache headers: assets fingerprinted or versioned in the filename so a redeploy during a show invalidates cleanly.

## Repo and files

```
Observability Quest Mobile/
  index.html
  css/game.css
  js/game.js          state machine + rendering
  js/scenarios.js     the SCENARIOS data, verdicts, roster
  js/text.js          wrap/paginate/typewriter
  js/audio.js         synth, UI blips, title loop sequence
  js/anim/            scene layer: one module per scene + portraits, shared sprite/plate loader
  assets/             scenes, portraits, logo, fonts
  assets/anim/        clean plates, sprite frames, path data (built by tools/)
  tools/              build-time scripts: composite frames, palette-snap, make plates (Python/Pillow/OpenCV)
  anim-preview.html   every scene and portrait animating, for review
  ASSET_PROMPTS.md    full prompts, model, size, filename, date for every image and frame
  README.md
  docs/superpowers/specs/  this document
  docs/animation-handoff.md  animation concept, coordinates, picks (from the Gemini session)
  scratch/            exports, originals, generated frames — gitignored
```

Exact file split is the builder's call; the point is that copy, audio, animation, and game code are separable.

## Verification before handoff

- Play through all 32 paths? No — but at minimum: every scenario win and lose text renders fully paginated with no clipped lines at 360, 390, and 430 widths; the CTA is always alone on its page; all six verdicts render; the placeholder form advances; REDEEMED persists across reload.
- Check on real iOS Safari and Android Chrome: audio unlock on Start, pixel rendering, safe areas.
- Lighthouse: page weight under 3 MB total including animation frames; interactive in under 2 s on a throttled 4G profile (title screen and its frames only on first paint).
- Animation: every scene and portrait plays in `anim-preview.html` with no visible seams between composited regions and plate, no JPEG softness, and stays on the 2px grid; reduced-motion shows stills.
- Confirm `title_screen` art and logo placement match the badge screenshot.

## Decisions made after builder review (Claude's calls unless marked)

- **Source material lives in the repo.** The badge app (`__init__.py`, `README.md`, `CHANGELOG.md`), its `Assets/` folder, the Round 2 prompt file, and the badge screenshots are copied into `source/badge/` in the working folder before build starts. The copy deck (`observability_quest_copy_deck_v6.docx`) goes in `source/` too. Copy in `js/scenarios.js` is transcribed from `__init__.py`, not the docx.
- **Offline means "preload everything before Start."** All art, fonts, and scripts load on the title screen behind a small loading indicator; after Start, no network requests happen until the form. No service worker in v1: a reload on dead wifi re-fetches the page, which is acceptable. REDEEMED state is in `localStorage` and does not need the network.
- **Hard pixels apply to the art, not to the UI chrome.** The text box, buttons, and text are ordinary DOM with CSS and a pixel-style web font. The pixel font should be sized at an integer multiple of its native em size so it renders crisply, but normal anti-aliasing of DOM text is fine.
- **Fill the phone width.** The canvas is scaled to the full available width even where that gives a fractional device-pixel multiple (some source pixels 3 device px wide, some 4, at 3× DPR). At phone densities this is not visible; exact integer grids with side margins are not wanted. *Rick can override.*
- **HubSpot supersedes the QR-code idea.** An earlier version of this design had the end screen generate a QR code carrying the email for staff to scan. That is dropped; HubSpot form is the capture, with the placeholder until review passes.
- **Scenario 4 narrator is Jessitron.** Julie's portrait stays in the data as a placeholder until the Jessitron portrait is generated (prompt in `ASSET_PROMPTS.md`) and approved. No four-scenario mode. The swap is a one-line data change. On-screen header: name `JESSITRON` (Claude's call pending Rick; `JESSICA KERR` is the alternative), title `ENG MANAGER OF DEVELOPER RELATIONS`; the builder wraps the title to two lines if it exceeds the header width.
- **Timeline: first show is in 2027.** No launch pressure. The placeholder form never faces real attendees; the HubSpot embed goes in after review with months to spare.
- **Builder delivers a deployable static folder; Rick connects it to his Vercel account.** Device testing happens on the Vercel preview URL on Rick's phone and on the builder's emulators; the builder cannot test on real hardware alone.

## Left to the builder

- Exact pixel fonts (after showing Rick candidates).
- Whether to render art via `<canvas>` or `<img>`, as long as pixels stay hard.
- Pagination implementation details.
- Synth design and the note sequence of the title loop (subject to Rick's listen).
- File organization within the constraints above.

## Open items (Rick)

- Jess's pick among the four Jessitron variants; then her blink/talk frames (Gemini, personal account).
- Full prompt text copied out of Firefly for the original 11 images, into `ASSET_PROMPTS.md` (the new frames' prompts are in `scratch/anim_gen/gen.py` and will be filed by the builder).
- Confirm on-screen name for Jessitron (`JESSITRON` vs `JESSICA KERR`).
- HubSpot form and portal IDs (after review).
- Final URL for the QR code.
- How-to-play copy (draft above).
