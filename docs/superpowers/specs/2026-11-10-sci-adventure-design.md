# Observability Quest — SCI-Style Adventure (v2) — Design

**Date:** 2026-11-10
**Owner:** Rick Abruzzo (Honeycomb Field & Events)
**Status:** Draft for review
**Supersedes:** the v0.1 CYOA port (tag `v0.1-cyoa`, branch `main`) — which stays deployable as the rollback.
**Branch:** `sci-adventure`

## Intent

Rebuild Observability Quest as a short point-and-click adventure in the look and feel of Sierra's SCI games (King's Quest IV/V, Quest for Glory, Space Quest IV era, 1988–92): a hero you create, rooms you walk through, things you click, a narrator who comments, a score in the top bar. Five chapters, one per Honeycomb use case, each starring the Honeycomb ICP persona who owns that pain. The "puzzle" in every chapter is simple enough for a conference attendee holding a phone in one hand: look at the problem, try the old tool if you like, then use the right Honeycomb feature through a gamified VGA rendering of the product. Finish, claim a prize at the booth.

Why: the v0.1 port is a faithful badge game, but a wall of narration on a phone doesn't earn three minutes of an attendee's attention. A person on screen, a room to poke at, and a product moment you *do* rather than read about will. The era is also the brand of the thing: Honeycomb's booth already leans on this nostalgia.

This is **a game, not a toolkit**: we replicate the experience of an SCI-era game, not the engine that made one. No parser, no verb grid, no inventory combinatorics.

## Goals

- Five chapters mapping to Honeycomb's five use cases × five industries, each with a distinct ICP persona and a distinct hero feature as the "good solve".
- Character creation: the player customizes their hero's appearance; the hero persists through every chapter.
- SCI-era presentation: 320×200 logical VGA scenes, pixel hero with a walk cycle, popup message windows, top status bar with score, icon bar, narrator voice.
- Interaction simple enough that nobody dead-ends: tap a hotspot → hero walks there → something happens. Wrong choices cost points and get a joke; they never block progress.
- The Honeycomb product moment is *interactive*: a VGA rendering of the real feature with bracketed prompts (`[Run BubbleUp on slow sessions]`) and an animated result.
- Canvas (with the in-game coding agent **"Claw Codez"** via MCP) and **Team Agents** are each the hero of a chapter.
- Original FM (AdLib/OPL-style) soundtrack and effects that sound like the era, not like a chiptune.
- Same booth outcome as v0.1: email capture (HubSpot form slot), staff-redeemable completion screen, QR-friendly static hosting.

## Non-goals

- No text parser, no verb-noun grammar, no inventory puzzles that combine items.
- No save/load, no multiple endings beyond score tiers, no branching plot.
- No real customer or competitor names in copy. Companies are fictional (inspired by real stories); rival tools are parodies; the coding agent is "Claw Codez".
- Not a general engine. Rooms, hotspots and prompts are data; the code serves these five chapters.
- No accounts, leaderboards, multiplayer, or analytics beyond the form.

## Anti-goals

- A player stuck anywhere. Every room must be finishable by tapping the obviously-Honeycomb thing.
- A product screen that reads as a screenshot. It has to be a *game* rendering of Honeycomb — VGA, chunky, legible on a phone — with the real feature's shape.
- Anything a lawyer would flag: real brand names of competitors, real customer names without approval, Sierra assets or music.
- Chiptune beeps. If the music can't sound like an AdLib card, cut it.
- Clutter on a phone. One hand, thumb reach, 48 px targets.

## Constraints (carried from v0.1 unless changed here)

- Static files, no framework, no build step. Vercel. Public URL is the `.vercel.app` one until a CNAME is approved.
- Palette: Honeycomb brand colours as in v0.1, plus a **VGA-era palette for scene art** (Sierra used 256 colours on a 320×200 canvas; we constrain generated scenes to a muted 64-colour set derived per scene so they read as one game).
- **Logical resolution 320×200**, drawn on a 640×400 canvas (2 px per logical pixel), `image-rendering: pixelated`. The canvas fills the phone width; the status bar and message windows are DOM, in a pixel font, below/over it.
- Fonts: dialogue font **TBD** — Sierra Font 004 if Goatmeal grants permission; otherwise an OFL alternative. GloryQuest (CC BY-SA, credit required) for display text. Until then, the v0.1 fonts stand in.
- Weight budget **4 MB** for a full run (raised from 3 MB for the extra scenes and FM patches); title interactive < 2 s on 4G; everything else preloaded behind START with a progress readout.
- Reduced motion: scenes still, hero teleports instead of walking, no screen shakes.
- All copy transcribed from the approved **script** (separate document, Rick authors; see Open items).
- Legal naming: competitor parodies and "Claw Codez" are fixed in the script; the code never contains a real competitor name.

## The game, start to finish

1. **Title** — new title art (generated, SCI-style), logo rendered crisp from the official SVG (never AI-generated), FM title theme on first tap, START.
2. **Intro: *Night Shift*** — the character-driven sequence from mock 2, re-shot with real backgrounds: bedroom 3:02 AM → the walk → the wall of green dashboards → the hex on the horizon → "SO YOU WANT TO BE ON CALL?" Skippable. Script by Rick.
3. **Character creation** — Sierra sheet: hero preview left, pickers right: hair (6 styles × 6 colours), skin (6), glasses (none/round/square), top colour (Honeycomb palette), accessory (headphones / lanyard / coffee). Dice button randomizes. Optional name, default "the Engineer". Choices persist for the session.
4. **Five chapters**, each:
   - **Class card**: the chapter's persona with silly stats (below). Tap to continue.
   - **Room**: a 320×200 scene with the hero, 3–5 hotspots, narrator line on entry.
   - **Hotspots**: tapping one walks the hero there (or teleports under reduced motion) and triggers it.
   - **Solve**: the Honeycomb hotspot opens the gamified product screen; the right prompt animates the result; narrator declares the win; score ticks up in the status bar.
   - **Verdict**: short popup from the chapter's narrator portrait (the v0.1 portraits), then NEXT.
5. **Final** — Charity's score verdict (tiers reuse the v0.1 six, rewritten to the SCI voice in the script) with a **sunrise coda**: the hero walks out into daylight, shades on.
6. **Claim** and **Complete** — unchanged from v0.1 (placeholder form → HubSpot embed after review; "SHOW THIS TO BOOTH STAFF"; staff REDEEMED tap; persisted).

Target length: 3–5 minutes for a first-time player who tries one wrong thing per chapter.

## Interface (SCI grammar, phone-sized)

- **Status bar** (top, DOM): `Observability Quest` left, `Score: 120 of 500` right, in the small pixel font on a light grey bar — the SCI0/SCI1 look.
- **Icon bar**: SCI1-style, bottom of the scene, three icons only — **Look** (eye), **Use** (hand), **Help** (?). Default mode is Use; tapping Look then a hotspot gives a descriptive line instead of acting. Help explains the three icons in one window. No inventory icon in v2.0 (a pager and a coffee appear as *props*, not inventory).
- **Tap to act**: tapping anywhere walkable makes the hero walk there; tapping a hotspot walks to it and triggers it. Walkable area is a floor line per room (one y, min/max x); hotspots have a stand point. Walking takes ≤ 1.2 s across the whole room.
- **Message windows**: centred SCI-style windows (white, black border, drop shadow) over the scene for narrator and dialogue; typewriter at 25 ms/char; tap to complete, tap to dismiss. Persona lines are prefixed with the persona name.
- **Prompts**: inside product screens and in some windows, choices appear as bracketed buttons: `[Run BubbleUp on slow sessions]`. Max three. One right, one plausible, one silly.
- **Feedback**: right → short result animation + 100 points (first try) or 50 (after a wrong try); wrong → window with the narrator's jab, −0 points but no gain; the tried prompt greys out.

## The gamified Honeycomb

A **product screen** is a full-canvas VGA rendering: Honeycomb's dark UI reduced to flat VGA fills, a title bar naming the feature, a chunky chart or list, and the bracketed prompts. Each chapter has one, built from a small shared kit: heatmap, line chart, bar list ("BubbleUp"), trace waterfall, service map, agent timeline, a Canvas notebook, a Team Agent finding card. The right prompt plays a 2–3 second animation (bars sort and the outlier glows; the waterfall reveals the slow span; the service map lights one path; the finding card stamps VERIFIED) and the win line appears.

The **old tool** hotspot is the same mechanic with only wrong prompts, so it's a joke the player can enjoy and leave.

## Chapters

Personas and stats are shown as a Sierra character sheet at the start of each chapter. Company names and all copy are placeholders until the script lands; the *shape* below is what the design commits to.

### 1 · LLM Observability · Enterprise · **Technical Decision Maker**
- *Inspired by* Intercom / Fin AI. Company: a fictional enterprise customer-service platform.
- *Persona note*: the ICP calls this role "Buyer"; in-game it is the **Technical Decision Maker** (TDM) so the sheet reads as an engineer with a budget, not a sales target.
- *Stats*: Budget 3 · Vendor Skepticism 17 · Meetings Survived 19 · Grep 2.
- *Room*: a glass-walled exec floor at night; the support bot's chat window frozen on a wall screen; a renewal contract on the desk.
- *Situation (laptop)*: the AI assistant stalls mid-answer; fourth outage this week; the logs vendor's renewal is due Friday.
- *Old tool*: **Cave Logs Inc.** — `[grep 40,000 lines of JSON]` `[Add another dashboard]` `[Renew for 3 years]`.
- *Hero feature*: **SLOs + tracing every LLM call**. Screen: an SLO burn chart with `[Open the burning SLO]` → trace waterfall of 12 model calls → `[Find what's starving the threads]` → one nightly cron job glows. Win: SLO recovered; the TDM lets the Cave Logs renewal lapse.

### 2 · Migrations · Fintech · **Platform Eng**
- *Inspired by* Nubank. Company: a fictional digital bank, two years into a monolith → 350-service migration.
- *Stats*: YAML Tolerance 18 · Kubernetes 16 · Sleep 4 · "It's DNS" 20.
- *Room*: a migration war room; whiteboard covered in arrows; a monolith server with a "DO NOT UNPLUG" sign.
- *Situation*: migration is "done"; customer transactions take a mysterious path; tickets climbing.
- *Old tool*: **Doggy Dashboards** — 350 green tiles; `[Refresh]` `[Add a 351st dashboard]` `[Ask the monolith nicely]`.
- *Hero feature*: **Service Map + Distributed Tracing**, BubbleUp on the odd path. Screen: service map `[Trace one customer's request]` → the one path still bouncing through the monolith lights up → `[BubbleUp: what's different about these?]` → a single attribute. Win: "A good migration goes undetected by users." One line for Moov's "trace a single dollar" if the script wants it.

### 3 · Frontend Observability · E-commerce · **Dev**
- *Inspired by* Fender. Company: a fictional online instrument store with a lessons app.
- *Stats*: Caffeine 17 · "Works on my machine" 20 · CSS 11 · Patience with RUM tools 1.
- *Room*: a dev bullpen; a storefront on the big monitor stuck at 13% loaded; a guitar leaning on the desk.
- *Situation*: conversions dropping; some users slow; nobody knows which.
- *Old tool*: **Pretty Good Metrics** — "avg page load 2.1 s. Looks fine." `[Stare at the average]` `[Blame the CDN]` `[Add a loading spinner]`.
- *Hero feature*: **Core Web Vitals + BubbleUp on sessions** with custom attributes. Screen: Web Launchpad `[Open LCP for checkout]` → heatmap with a hot band → `[BubbleUp on the slow sessions]` → one browser version, 8% of users. Win: fixed; conversions up; guitars sold.

### 4 · Incident Response · Gaming · **DevOps/SRE**
- *Inspired by* EVE Online (Fenris Creations / CCP Games). Company: a fictional MMO studio in the middle of a record fleet battle.
- *Stats*: Pager Endurance 19 · Postmortem Writing 14 · Blameless 18 · Sleep 2.
- *Room*: a dark ops room lit by a wall of space; 8,000 pilots in one system; chat scrolling with lag reports; one old desk with a dusty monitor labelled "the fleet code — ask Einar".
- *Situation*: the battle is live; latency climbing; the only engineer who understands the 23-year-old fleet code is asleep in another time zone.
- *Old tool / wrong move*: **page the one person** (`[Wake Einar]` — he answers in Icelandic and goes back to sleep), or `[Restart the node and hope]`.
- *Hero feature*: **Canvas with Claw Codez via MCP**. Screen: a Canvas notebook; `[Ask: why did fleet latency spike?]` → Claw Codez (a small pixel claw-shaped robot) runs the queries live in the notebook, BubbleUp surfaces the one node, a hypothesis is tested and marked ✔, then `[Share the Canvas to #war-room]`. Win: the team "communicates in Honeycomb links"; a manager runs in: *"Have you seen Canvas? This thing's nuts."*

### 5 · Agent Observability · Startup · **Build & Release Eng**
- *Fictional* three-engineer AI-agent startup. No real customer.
- *Stats*: Deploy Frequency 20 · Rollback Reflex 15 · Friday Deploys 1 · Sleep 3.
- *Room*: a startup loft at 3 a.m.; three desks, two empty; a pager on the floor; a token-spend chart on the wall going vertical.
- *Situation*: Friday's prompt/model change shipped; the support agent loops; token bill tripled overnight.
- *Old tool*: **the agent debugging itself** — `[Ask the agent why it looped]` → "I apologize for the confusion" ×40 · `[Roll back everything]` · `[Add a retry]`.
- *Hero feature*: **Team Agents + Agent Timeline**. Screen: a Team Agent **Finding** is already waiting — goal *Verify releases*: the deploy was checked for 30 minutes, a regression flagged, an incident channel opened. `[Open the Finding]` → Agent Timeline shows one conversation: a tool call retrying forty times → `[Approve the suggested fix]` or `[Check the evidence first]` (both win; checking scores more). Win line: three engineers on the team, and the fourth is an agent. This chapter is where Team Agents is front and centre.

### Final · Charity Majors
Score tiers as v0.1 (0–5 solves, or 0–500 points mapped to six tiers), rewritten for the SCI voice in the script. Sunrise coda.

## Scoring

Sierra-style: `Score: N of 500`. 100 per chapter for a clean solve, 50 if a wrong prompt was tried first, +10 for each Look that reveals a joke line (optional "secret points", capped at 50 total so 500 remains reachable without them… or make the max 550 and let completionists have it — builder's call, documented). Charity's tier is derived from the score.

## Intro and coda

*Night Shift* as mocked in `scratch/intro-mock2.html`, rebuilt on the v2 engine: three generated backgrounds (bedroom, street, dashboard wall), the horizon scene drawn in code, the hero from character creation **not** yet known — the intro uses the default hero, and the sheet that follows lets the player remake them (Sierra did the same: you watched the hero arrive, then rolled your character). Copy is Rick's script. The coda reuses the street background at dawn.

## Audio

- **FM synthesis via an OPL3 emulator** running in the browser (there are small JS/WebAssembly OPL3 cores; the builder picks one with a permissive licence and verifies it in Safari). Instruments are OPL patches (brass, strings, bells, organ, bass, drums) — the actual AdLib timbre of the era.
- **Original compositions** as note data, as in v0.1 but written for FM voices: a title theme (~45 s loop), a short motif per chapter (8–16 bars, ambient, low volume under play), a win sting, a wrong-move sting, the Charity verdict fanfare, and the sunrise coda cue. No existing melody is quoted.
- **Effects**: footsteps (soft click per step), window open/close, prompt select, pager buzz, "glitch" burst, Canvas typing ticks, finding stamp.
- First tap on the title unlocks audio; mute toggle persists; `visibilitychange` suspends.
- Rick approves each cue by ear; the composition data lives in its own files so it can be revised without touching the game.

## Art

- **Hero**: hand-pixelled parts system, 16×32 logical px (32×64 on canvas): hair ×6 styles, skin ×6, glasses ×3, top colour, accessory ×3; animations: idle, walk (4), sit-up, type at a keyboard (2), turn. Drawn in code from pixel maps so recolouring is free.
- **Room backgrounds** ×5 + intro ×3 + title: generated with the Firefly/Gemini pipeline using a new SCI-VGA preamble (320×200, 1990 VGA, dithered, Sierra room composition with a clear floor band), then downsampled nearest-neighbour to 320×200 and palette-reduced to the scene's 64-colour set. Hotspot objects (laptop, terminal, Honeycomb workstation, old monitor, whiteboard) must be present in the generated art at known positions — the prompts state them; the builder measures hotspot rects after generation.
- **Product screens**: drawn in code from the shared kit, not generated — they must be crisp and data-driven.
- **Claw Codez**: a small original robot sprite (a crab-claw-headed terminal on legs). Hand-pixelled. Never resembles any real mascot.
- **Portraits**: v0.1's six narrator portraits reused for verdicts; Jessitron's frames when they land.
- **Logo**: from the official SVG only. Rendered to the exact pixel size needed with crisp edges. Never generated.
- All provenance recorded in `ASSET_PROMPTS.md`.

## Technical approach

Carry over from v0.1: static layout shell, `text.js`, `claim.js` (form/complete), `sprites.js`, the asset tooling, the e2e harness, fonts. Replace: the game state machine, the scene layer, the audio synth. New:

- `js/engine/room.js` — room = { background, floorY, walk: [minX, maxX], hotspots: [{ id, rect, standX, look, use }], onEnter }. Hero walking along the floor line with the 4-frame cycle at 10 fps.
- `js/engine/windows.js` — SCI message windows and prompt buttons (DOM over canvas).
- `js/engine/statusbar.js` — score and title.
- `js/engine/hero.js` — parts-based sprite renderer and animation.
- `js/screens/` — product screens built from `js/kit/` (heatmap, waterfall, servicemap, bubbleup, timeline, canvas, finding).
- `js/chapters/ch1..ch5.js` — data + glue per chapter; `js/script.js` — all copy, generated from the script document.
- `js/audio/opl.js` — OPL3 core + sequencer; `js/audio/music/*.js` — compositions; `js/audio/sfx.js`.
- `js/intro.js`, `js/creator.js`, `js/final.js`.
- Tests: unit (room pathing math, scoring, prompt state, composition data, hero part maps), e2e (full run on 390/360/430 and 375×548, reduced motion, budget, every hotspot reachable and every chapter finishable by the Honeycomb path alone, wrong prompts never block).

## Verification before handoff

- Every chapter finishable by tapping only Honeycomb prompts; every wrong prompt greys out and never blocks; every Look line renders; score reaches the max; Charity's tier matches the score.
- Phone widths 360–430 and the 375×548 short viewport; landscape still usable.
- Reduced motion: no walking animation, stills, instant text.
- Audio: title theme, chapter motifs, stings verified on iOS Safari and Android Chrome from a real device (Rick), OPL core CPU use acceptable on a mid-range phone.
- Weight ≤ 4 MB per run; title interactive < 2 s on 4G.
- A fresh reviewer reads the branch before it replaces `main`.

## Left to the builder

- Which OPL3 core; how to schedule notes against it.
- Hero part-map format and the creator's layout details.
- Product-screen kit internals; exact animations.
- Hotspot rects after backgrounds are generated.
- Whether secret Look points raise the max to 550 or stay inside 500.
- Test harness details.

## Open items (Rick)

- **The script**: intro narration, every room's narrator lines, Look lines, persona lines, prompt labels, wrong-move jabs, win lines, Charity's six verdicts, class-card stats. A draft script document follows this spec for review; PMM review later.
- **Fonts**: Goatmeal's reply on Sierra Font 004 / SCI Menu Font; GloryQuest TTF in `assets/fonts/`.
- **Logo SVG** from the brand kit.
- **Jessitron frames** (unchanged).
- **Background prompts**: Rick runs the generation; the builder writes the prompts into `ASSET_PROMPTS.md` first.
- **Music**: approve each cue by ear.
- **Legal nod** on the parody names (Cave Logs Inc., Doggy Dashboards, Pretty Good Metrics, Claw Codez) and the fictional companies.
