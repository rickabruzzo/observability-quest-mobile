# Observability Quest — SCI-Style Adventure (v2) — Design

**Date:** 2026-11-10
**Owner:** Rick Abruzzo (Honeycomb Field & Events)
**Status:** Approved by Rick 2026-11-10, with the expectation that the script will bring pivots; this document is updated as they land. Build order starts with character creation.
**Supersedes:** the v0.1 CYOA port (tag `v0.1-cyoa`, branch `main`) — which stays deployable as the rollback.
**Branch:** `sci-adventure`

## Intent

Rebuild Observability Quest as a short point-and-click adventure in the look and feel of Sierra's SCI games (King's Quest IV/V, Quest for Glory, Space Quest IV era, 1988–92): a hero you create, rooms you walk through, things you click, a narrator who comments, a score in the top bar. Five chapters are written, one per Honeycomb use case, each built around the Honeycomb ICP persona who owns that pain; **a run plays three of them, drawn at random**, so the game stays under three minutes and a second run at the booth is a different game. The "puzzle" in every chapter is simple enough for a conference attendee holding a phone in one hand: look at the problem, try the old tool if you like, then use the right Honeycomb feature through a gamified VGA rendering of the product. Finish, claim a prize at the booth.

Why: the v0.1 port is a faithful badge game, but a wall of narration on a phone doesn't earn three minutes of an attendee's attention. A person on screen, a room to poke at, and a product moment you *do* rather than read about will. The era is also the brand of the thing: Honeycomb's booth already leans on this nostalgia.

This is **a game, not a toolkit**: we replicate the experience of an SCI-era game, not the engine that made one. No parser, no verb grid, no inventory combinatorics.

## Goals

- Five authored scenarios mapping to Honeycomb's five use cases × five industries, each with a distinct ICP persona and a distinct hero feature as the "good solve". **One scenario is a win** (Rick, 2026-11-11, after timing the script: three scenarios ran to about seven minutes): the player picks one from a menu after the intro, finishes it in 2–3 minutes, and can claim the prize — or pick another. The game tracks which are done. See *The scenario menu*.
- Replayable: PLAY AGAIN deals a different hand. The prize is claimed once.
- Character creation: the player customizes their hero's appearance; the hero persists through every chapter.
- SCI-era presentation: 320×200 logical VGA scenes, pixel hero with a walk cycle, popup message windows, top status bar, icon bar, narrator voice.
- Interaction simple enough that nobody dead-ends: tap a hotspot → hero walks there → something happens. Wrong choices cost points and get a joke; they never block progress.
- The Honeycomb product moment is *interactive*: a VGA rendering of the real feature with bracketed prompts (`[Run BubbleUp on slow sessions]`) and an animated result.
- Canvas (with the in-game coding agent **"Claw Codez"** via MCP) and **Team Agents** are each the hero of a chapter.
- Original FM (AdLib/OPL-style) soundtrack and effects that sound like the era, not like a chiptune.
- Same booth outcome as v0.1: email capture (HubSpot form slot), staff-redeemable completion screen, QR-friendly static hosting.

## Non-goals

- No text parser, no verb-noun grammar, no inventory puzzles that combine items.
- No save/load, no multiple endings beyond Charity's two moods, no branching plot.
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
- **Landscape.** The game is played with the phone on its side, like the 4:3 monitors it imitates (Rick's call). A portrait phone sees a *Rotate your phone* screen — a pixel phone icon turning, one line of copy — and nothing else until it rotates; orientation can't be locked on iOS, so the screen is CSS (`@media (orientation: portrait)`) and the game pauses under it. The Claim and Complete screens are exempt: a form with a keyboard open is better in either orientation, so the prompt disappears there (my call). Desktop and tablet are wide already and never see the prompt.
- **Logical resolution 320×200**, `image-rendering: pixelated`. The canvas backing store is 320×200; CSS scales it to the largest 16:10 box that fits the landscape viewport height under the status bar (≈ 590×370 on an 844×390 phone, ≈ 570×355 on a 667×375 one), letterboxed in black at the sides. Scale is non-integer; at phone pixel densities (≥ 2×) that's ≤ 1 device pixel of unevenness per logical pixel and reads as crisp (my call; the v0.1 integer-scale rule is retired). The message windows and prompts are DOM over the canvas, in a pixel font.
- Fonts: **VT323** (OFL, already in `assets/fonts/`) for everything that is read — dialogue, status bar, stats, prompts, terminals — the team's pick from the comparison sheets (`scratch/fonts/`) for legibility: 24 px in message windows, 20 px in the status bar and on class cards, line-height 1.1, never below 18 px. **GloryQuest** (CC BY-SA 3.0, `assets/fonts/gloryquest/` with its licence and readme, credit "GloryQuest by the12thdoctor, FontStruct" in the README and the title's small print) for display headings — title card, chapter title cards, THE END — and for the character sheet's labels and buttons (no numerals there), at 32 px or 24 px on a 2× screen, where its 16-brick grid stays crisp; 16–18 px is acceptable on the sheet where the labels are short words. Sierra Font 004 may replace GloryQuest in the display slots if Goatmeal grants permission. Pixelify Sans, Silkscreen, Jersey and Press Start 2P are not used.
- **Legibility is a requirement, not a taste** (team feedback on v0.1: numbers were illegible). Body text renders at ≥ 16 CSS px on a phone; every digit 0–9 must be unambiguous at the size it is used (score bar, stats, "3 of 5"); 1/7, 4/9, 6/8/0, 3/8 and 5/S pairs are checked by eye on a phone before a font is accepted (Silkscreen and Pixelify Sans failed 5/S on the comparison sheet). The e2e suite screenshots the status bar and a class card at 844×390 so a regression is visible in review.
- Weight budget **4 MB shipped in total**; a run downloads only what it plays (title, intro, creator, the chosen scenario, final — target ≤ 2 MB for a one-scenario run). Title interactive < 2 s on 4G; the run's assets preload behind START with a progress readout, after the draw is made.
- Reduced motion: scenes still, hero teleports instead of walking, no screen shakes.
- All copy transcribed from the approved **script** (separate document, Rick authors; see Open items).
- Legal naming: competitor parodies and "Claw Codez" are fixed in the script; the code never contains a real competitor name.

## The game, start to finish

0. **Rotate** — a portrait phone sees the *Rotate your phone* screen first; everything below is landscape.
1. **Title** — new title art (generated, SCI-style), logo rendered crisp from the official SVG (never AI-generated), FM title theme on first tap, START.
2. **Character creation** — a Sierra character sheet, landscape: the hero large on the left, pickers on the right, RANDOM and DONE always visible. **Appearance only** — the class is not chosen here (Rick's call); each chapter hands the hero its persona. Details in *Character creation* below.
3. **Intro** — Rick's storyboard (`docs/intro-storyboard.md`): a dithered EGA cold open in the dark — the pager, the face, the arm — cutting to the VGA bedroom with the title on the wall, where *the hero the player just made* gets out of bed, changes into the hoodie and walks out. Skippable. Details in *Intro and coda*. (Order per Rick 2026-11-11: sheet first, to be judged in team play-tests.)
4. **Scenario menu**, then **one scenario** of the player's choosing (*The scenario menu*, below). A scenario is:
   - **Class card**: the chapter's persona and their silly stats (below). The persona is **the person who paged the hero**, not the hero (Rick, 2026-11-12) — "Tonight's page: the SRE on call." Tap to continue.
   - **Room**: a 320×200 scene with the hero, 3–5 hotspots, narrator line on entry.
   - **Hotspots**: tapping one walks the hero there (or teleports under reduced motion) and triggers it.
   - **Solve**: the Honeycomb hotspot opens the gamified product screen; the right prompt animates the result; narrator declares the win; the status bar's solved count ticks up.
   - **Verdict**: short popup from the scenario's narrator portrait (the v0.1 portraits), then a choice: **CLAIM YOUR PRIZE** or **ANOTHER SCENARIO** (back to the menu).
5. **Final**, on CLAIM — Charity's verdict on the night so far (see *Scoring*) with a **sunrise coda**: the hero walks out into daylight, shades on.
6. **Claim** and **Complete** — as v0.1 (placeholder form → HubSpot embed after review; "SHOW THIS TO BOOTH STAFF"; staff REDEEMED tap; persisted), plus a **PLAY MORE** button on Complete that returns to the scenario menu with the hero and the completion marks kept. The form is never shown twice.

Target length: **2–3 minutes for one scenario**, for a first-time player who tries one wrong thing. The sheet and the (skippable) intro add about a minute before it; the claim form comes after.

### Character creation

Rick's brief: three starting heroes, then free customization, no picker with more than five choices, and a random button for people who don't want to get bogged down.

- **Presets** (3): **masculine**, **feminine**, **nonbinary** — three body silhouettes (shoulders, waist, hips) with their own default hair, beard, hoodie and jeans. A preset is a starting point: every picker below stays open after choosing one (a feminine body may wear a full beard; nothing is gated).
- **Pickers** (each ≤ 5 choices, Rick's rule; simplified 2026-11-10 after the first build — "too many choices"):
  - Skin: 4 tones (the palest was cut).
  - Hair colour: 5 — black, brown, blonde, ginger, violet. **The beard takes the hair colour**; there is no beard-colour picker.
  - Hair: 5, all-gender — **mohawk** (buzzed sides, short textured top), standard, shoulder length, long, fro.
  - Beard: 3 — none, short, long.
  - Hoodie colour: 5 from the Honeycomb palette.
  - Jeans colour: 5 — indigo, black, light wash, grey, khaki.
  - Glasses: on or off.
  - Holding: 5 dev tropes — laptop (generic, a hex sticker on the lid, no fruit), coffee, phone, rubber duck, pager.
- **RANDOM** rerolls everything, preset included. **START** locks the hero for the session.
- **Name**, optional (back in, per the QFG reference): a `Name` row on the KIT page. Tapping it opens a minimal name screen — the field at the top, nothing under the keyboard, usable in either orientation — and returns to the sheet on done. Empty means the game says "the Engineer".
- **Sheet language** (approved on the design canvas *Observability Quest — Hero & Character Sheet*, 2026-11-10, then re-flowed in the build so every control is 44 px and the sheet fits a 667×375 phone — reviewer finding): Quest for Glory's character screen — a white panel with black bands top and bottom, labels in GloryQuest blue (`#3C3CB4`), the selected choice in red (`#E04040`), a carved brown frame with green side jewels around the hero, bordered white buttons with a hard grey shadow. VT323 wherever a number or typed text appears. The hero fills the frame's height (≈ 4× on an 844×390 phone); pickers are rows of ≤ 5 buttons, 44 CSS px each, labels 92 px. **Two pages**: **FACE** — body, skin, hair colour, hair, beard (5 rows); **KIT** — name, hoodie, jeans, glasses, holding (5 rows). The **FACE / KIT tabs are 44-px buttons in the left thumb column above RANDOM**; START is in the right column. Thumbnails are zoomed crops of the hero — the head for hair/beard/glasses, the hand for the held item. Never a scroll.
- **Sprite**: **28×72 logical px**, about a third of a 320×200 room's height, where SCI1 egos stood. Drawn the Sierra VGA way — a dark silhouette outline (`#1A1424`), light from the upper-left (a highlight column on the left edge of every part, a shade band on the right), three-tone ramps per colour, interior lines for arm/torso, pocket, drawstrings, knees and the hoodie hem. Built **procedurally from part masks** rather than hand-typed pixel maps: each part is a mask (ellipses and spans), a shading pass colours it, details are stamped on top, the outline pass runs last. The reference implementation is `scratch/hero/gen.py` (the approved contact sheet came from it); the game's renderer in `js/engine/hero.js` reproduces it pixel for pixel, proven by golden-image tests against PNGs the Python generator emits. Parts: 3 bodies × (hoodie + jeans recolour) ; 5 hair styles × 5 colours ; 3 beards (hair-coloured) ; glasses on/off ; 5 held items. Animations (idle, walk ×4, type ×2, sit-up, turn) are defined on the body masks (leg and arm spans per frame); parts ride along, so a new hair style needs no new frames. The coda puts shades on every hero regardless of glasses. Faces and held items get a hand-finishing pass once the renderer matches the generator.
- **Persistence**: the hero's choices live in `sessionStorage` (`oq.hero`) so a reload or a PLAY AGAIN keeps them; a new session starts fresh at the sheet.

### The scenario menu

(Replaces *the draw* — three of five dealt at random — which Rick dropped on 2026-11-11.)

After the intro the player chooses. A Sierra-style window lists the **five scenarios**, each a row: the class
the hero will play, the problem in a few words, and — once solved — a tick.

- **One finished scenario is a win.** After its verdict the player is offered **CLAIM YOUR PRIZE** or
  **ANOTHER SCENARIO**. Until the prize is claimed, the menu also carries a CLAIM YOUR PRIZE button as soon as
  one scenario is done.
- **Completion is tracked** in `sessionStorage` (`oq.done`: scenario → missteps, fewest kept), with the hero. Done
  scenarios stay on the menu, ticked, and can be replayed.
- Rows are thumb-sized (44 px), the list fits a 667×375 phone without scrolling, and the order is always 1→5.
- Only the chosen scenario's assets download.
- `?ch=N` in the URL goes straight into scenario N after the intro (QA and booth demos); a malformed value is
  ignored and the menu shows.
- *My proposal, for Rick and PMM:* the claim form carries the list of scenarios solved as
  hidden fields, so the lead record shows which use case the attendee chose.

## Interface (SCI grammar, phone-sized)

- **Layout in landscape** (my call, given Rick's landscape decision): status bar across the full width at the top; the scene centred below it; the black letterbox columns either side become the **thumb zones** — the icon bar stacks vertically in the right column (Look / Use / Help), the mute toggle sits in the left. Both thumbs hold the phone, both columns are under them. Message windows open **over the scene**, SCI-style (white, black border, drop shadow), centred, up to five lines, and prompt buttons stack inside the window; on a 375-px-tall phone a window holds three lines and paginates with a tap. Hotspots near the middle of the scene are a short reach from either thumb. Product screens take over the scene box and show their prompts the same way. The right-hand icon column must fit at a 667×375 viewport (three 44-px icons in a 50-px column); if a viewport is too narrow for the columns the icon bar falls back to a row under the scene.
- **Status bar** (top, DOM): `Observability Quest` left, `Solved: 1 of 5` right, in the small pixel font on a light grey bar — the SCI0/SCI1 look.
- **Icon bar**: SCI1-style icons — **Look** (eye), **Use** (hand), **Help** (?) — in the right thumb column. Default mode is Use; tapping Look then a hotspot gives a descriptive line instead of acting, and the mode returns to Use. Help explains the three icons in one window. No inventory icon in v2.0 (a pager and a coffee appear as *props*, not inventory).
- **Tap to act**: tapping anywhere walkable makes the hero walk there; tapping a hotspot walks to it and triggers it. Walkable area is a floor line per room (one y, min/max x); hotspots have a stand point. Walking is a Sierra stroll in profile: about three steps a second, some five seconds across the whole room (Rick, 2026-11-11 — 1.2 s read as far too fast; the cadence follows the drawn stride).
- **Message windows**: the windows described above carry narrator and dialogue text; typewriter at 25 ms/char; tap to complete, tap to dismiss. Narrator lines carry no prefix. The hero's own lines, spoken in that chapter's class, are prefixed with the class name (`SRE:`), and the script addresses the player in the second person ("you let the renewal lapse"). Other characters in a room (the manager who runs in, Einar on the phone) are prefixed with their name and need no sprite — they speak from off-screen or from a prop.
- **Prompts**: inside product screens and in some windows, choices appear as bracketed buttons: `[Run BubbleUp on slow sessions]`. Max three. One right, one plausible, one silly.
- **Feedback**: right → short result animation and points (see *Scoring*); wrong → the narrator's jab, no points, and the tried prompt greys out. Nothing ever subtracts.

## The gamified Honeycomb

A **product screen** is a full-canvas rendering of the real Honeycomb page for the chapter's feature, reduced to flat VGA fills: **Honeycomb's light UI** (white cards on pale grey, blue for passing, yellow-orange for failing), the page's real headings as labels, a chunky chart, and the bracketed prompts. It must be recognisable to someone who has seen the product and legible to someone who has not: **the feature is named in plain words, and any abbreviation is spelled out on first use**. Each chapter has one, drawn as pixel art from the real product (scenario 1's are built by `tools/build_hc_screens.py`): a Canvas investigation, Agent Timeline, an LLM call's details, heatmaps and BubbleUp, a trace waterfall, a service map, a Team Agent finding card. The direct prompt plays a 2–3 second animation and the result line appears.

**Honeycomb is the solution, so nothing inside it is a joke** (Rick, 2026-11-12). Each step offers the direct route and two other *sensible Honeycomb moves*; those get a short nudge toward the direct route, grey out, and cost nothing. The last result says plainly what Honeycomb did: "Using Honeycomb <feature>, you found <cause> without switching tools." Then the player **applies the fix** (a prompt outside the product screen), and the room visibly recovers. The jokes live in the old tool, the room and the people.

The **old tool** hotspot is the same mechanic with only wrong prompts, so it's a joke the player can enjoy and leave.

## Chapters

**The player is always the Honeycomb Hero** (Rick, 2026-11-12): the character they built, in the Honeycomb hoodie, paged in the intro. Each chapter's **persona is the other person in the room**: one of Honeycomb's ICP personas, with a pain point, about to make the wrong call. It is their problem the hero solves, their stats on the class card, and their last word at the win. The hero works at whatever desk they are lent. **Titles** (use case · industry · persona) follow the problem and the approach in the Honeycomb video or customer story each solve is grounded in, so they may differ from the original five use-case names.

Personas and stats are shown as a Sierra character sheet at the start of each chapter. Company names and all copy are placeholders until the script lands; the *shape* below is what the design commits to.

### 1 · Agent Observability · Enterprise · **CTO** (was LLM Observability · Technical Decision Maker)
- *Inspired by* Intercom / Fin AI. Company: a fictional enterprise customer-service platform.
- *Persona*: the **CTO**, the ICP's "Buyer": the person who signs. She paged the hero.
- *Stats*: Budget 3 · Vendor Skepticism 17 · Meetings Survived 19 · Grep 2.
- *Cast*: the Honeycomb Hero advises; the CTO signs. **The patient is Otto**, the AI support assistant, a supervisor agent with specialist agents behind it: he stalls mid-answer because his order-status agent fetches every order a customer ever placed (97 of them) and feeds the whole pile back to the model on every turn. One question takes eleven minutes and 411,448 tokens.
- *Room*: a glass-walled exec floor at night, three thumb-sized hotspots: the hero's cube with an 80s desktop **PC**; a wall **monitor** showing Otto's vitals like a sci-fi sickbay readout (a heartbeat lane, three readout boxes cycling jokey stats, and his frozen output "I'd be happy to"); the **CTO** at her desk on the phone, the Cave Logs renewal in front of her. Art: `assets/rooms/` (`tools/build_rooms.py`, manifest `ch1.json`).
- *Flow*: look at the monitor (a close-up; the vitals read like a doctor's chart) → sit at the PC (a close-up; menu: Read email · Check Otto's vitals · Open Cave Logs · Open Honeycomb · Leave computer) → **Leave computer** unlocks once either tool has been tried → walk to the CTO and advise: **[Sign the contract]** or **[Get Honeycomb]**.
- *Decision*: **[Get Honeycomb]** wins. If the fix is not deployed yet, the CTO says "show me" and the Honeycomb screen opens on the spot (or, if the cause is already found, just the deploy prompt); deploying wins. **[Sign the contract]** gets a jab and costs points like any wrong prompt, and the choice comes back: a wrong choice never blocks. The investigation finds the cause; **[Apply the fix and deploy]** then appears on the PC menu, and deploying is what recovers the monitor (steady heartbeat, green lights, Otto finishes his sentence, with a joke). The win needs the fix deployed.
- *Old tool*: **Cave Logs Inc.** — `[grep 40,000 lines of JSON]` `[Add another dashboard]` `[Renew for 3 years]`.
- *Hero feature*: **Agent Timeline, reached from an automatic investigation in Canvas** (Rick, 2026-11-12: SLOs are not how you debug an errant chatbot). The solve follows Honeycomb's own agent-observability demo (Innovation Week 2026):
  1. **Canvas.** An alert fired and Honeycomb started investigating on its own; the Canvas is already filled in with graphs, the five worst conversations and an Investigation Summary whose strongest signal is one agent in a tool loop. `[Open the worst conversation in Agent Timeline]`.
  2. **Agent Timeline.** The whole conversation in order: every agent, LLM call and tool call; 11 minutes, 19 LLM calls, 97 tool calls, 411,448 tokens. `[Open the slowest LLM call]`.
  3. **The LLM call.** Its input tokens (57,293, against 1,174 for the first call) and the tool result that put them there: `lookup_orders`, 97 orders, 145 KB.
  The other prompts are real moves that teach something and nudge back: token usage by agent (who), the Canvas agent (it already linked the conversation), the application trace (nothing downstream is slow), the evals (the answer was also bad). Then **[Apply the fix and deploy]**: the lookup returns the one order asked about. Win: Otto answers; the CTO leaves the Cave Logs renewal unsigned.
- *Screens*: three pixel-art pictures, `assets/screens/ch1_hc_0..2.png`, drawn in code by `tools/build_hc_screens.py` from that demo (not screenshots; no logo), with the rectangles to pulse in `ch1_hc.json`.

### 2 · Migrations · Fintech · **Platform Engineer** (not yet grounded in a video; persona is the person in the room)
- *Inspired by* Nubank. Company: a fictional digital bank, two years into a monolith → 350-service migration.
- *Stats*: YAML Tolerance 18 · Kubernetes 16 · Sleep 4 · "It's DNS" 20.
- *Room*: a migration war room; whiteboard covered in arrows; a monolith server with a "DO NOT UNPLUG" sign.
- *Situation*: migration is "done"; customer transactions take a mysterious path; tickets climbing.
- *Old tool*: **Doggy Dashboards** — 350 green tiles; `[Refresh]` `[Add a 351st dashboard]` `[Ask the monolith nicely]`.
- *Hero feature*: **Service Map + Distributed Tracing**, BubbleUp on the odd path. Screen: service map `[Trace one customer's request]` → the one path still bouncing through the monolith lights up → `[BubbleUp: what's different about these?]` → a single attribute. Win: "A good migration goes undetected by users." One line for Moov's "trace a single dollar" if the script wants it.

### 3 · Frontend Observability · E-commerce · **Frontend Developer**
- *Inspired by* Fender. Company: a fictional online instrument store with a lessons app.
- *Stats*: Caffeine 17 · "Works on my machine" 20 · CSS 11 · Patience with RUM tools 1.
- *Room*: a dev bullpen; a wall monitor showing a live checkout stuck at 13% ("Placing your order…"); a **left-handed** guitar leaning on the desk (the clue). The persona is the Frontend Developer, who is about to ship a loading spinner and blame the CDN (art brief 01).
- *Situation*: conversions dropping; checkout takes fourteen seconds for about one shopper in twelve; everyone else sees nothing wrong, and the RUM tool's average agrees with them.
- *Old tool*: **Pretty Good Metrics** — "avg page load 2.1 s. Looks fine." `[Stare at the average]` `[Blame the CDN]` `[Add a loading spinner]`.
- *Hero feature*: **Honeycomb for Frontend Observability: the Web Launchpad, a trace that runs from the browser into the backend, and BubbleUp** (grounded 2026-11-12 in Honeycomb's own demo, "See everything"; the point it makes is that you see not only that something is wrong but what is causing it, even in the backend):
  1. **Web Launchpad.** Core Web Vitals are green, so the page itself is fine; the Slowest Requests by Endpoint table has one row that is not: `POST /api/checkout`, 14.2 s. `[View the trace for the slow checkout]`.
  2. **Trace.** One trace from the browser's click through the gateway to the checkout service: the page did its part in milliseconds and waited on `PlaceOrder`, which runs a staircase of stock checks. `[BubbleUp the slow checkouts]`.
  3. **Heatmap + BubbleUp.** The heatmap of that span's duration, the slow ones boxed, and what they share: a custom attribute, `handedness = left`. Every slow checkout has a left-handed guitar in the cart; its stock check runs one warehouse at a time.
  The other prompts are real moves that nudge back: the Core Web Vitals (all green: it happens after the page is up), filtering the Launchpad to one browser (it is in all of them), one span's attributes (one trace can't say which attribute matters), the Errors tab (nothing failed, which is why nobody was paged). Then **[Apply the fix and deploy]**: one stock query instead of one per warehouse. Win: the eight percent can check out.
- *Screens*: `assets/screens/ch3_hc_0..2.png` and `ch3_hc.json`, drawn in code by `tools/build_hc_screens.py` from that demo.

### 4 · Hidden Failures · Gaming · **Site Reliability Engineer** (was Incident Response · DevOps/SRE)
- *Inspired by* EVE Online (Fenris Creations / CCP Games) for the setting: a fictional MMO studio in the middle of a record fleet battle. *The solve is grounded (2026-11-12) in a customer's story, hipages* ("From 93 to 99"): with Honeycomb they found that only 93% of the API calls that post a job were succeeding, mostly for reasons in their own control; fixing legacy issues took it past 99%; and after they adopted the Honeycomb MCP, active Honeycomb users nearly tripled. No customer is named in the game.
- *Stats*: Pager Endurance 19 · Postmortem Writing 14 · Blameless 18 · Sleep 2.
- *Room*: a dark ops room lit by a wall of space; 8,000 pilots in one system; chat scrolling with "lag" in nine languages; one old desk with a dusty monitor labelled "the fleet code — ask Einar". The persona is the Site Reliability Engineer on call, tonight's incident commander, thumb over Einar's number (art brief 01).
- *Situation*: the battle is live; pilots say they can't get in and chat calls it lag; the dashboards say the cluster is healthy; the only engineer who understands the 23-year-old fleet code is asleep in another time zone.
- *Old tool / wrong move*: **page the one person** (`[Wake Einar]` — he answers in Icelandic and goes back to sleep), `[Restart the node and hope]`, `[Post "we're aware" in chat]`.
- *Hero feature*: **the Honeycomb MCP server: anyone on the team asks production a question, in plain words, from the coding agent they already use** (Claw Codez, a small pixel crab). This is the MCP chapter; Canvas is in scenario 1.
  1. **Connected.** Claw Codez shows Honeycomb's tools (`run_query`, `run_bubbleup`, `get_trace`, `get_slos`). `[Ask: how many fleet joins succeed?]`.
  2. **The number nobody had.** Honeycomb runs the query: 93%. Seven joins in a hundred fail, the game retries quietly, and it has been that way for as long as there is data. `[Ask: what do the failures share?]`.
  3. **BubbleUp, through the same connection.** Every failed join has a fleet of more than 255 ships: a limit set in 2003. In their control all along.
  The other prompts are real questions that nudge back: cluster health (healthy machines, unhappy pilots: ask about what users are trying to do), where a join slows down (it isn't slow, it fails), when it started (it never started), which pilots (it isn't who they are). Then **[Apply the fix and deploy]**: raise the limit; joins pass 99%. Win: the battle finishes with everyone in it; nobody woke Einar; half the studio is now asking production questions.
- *Screens*: `assets/screens/ch4_hc_0..2.png` and `ch4_hc.json`, drawn in code by `tools/build_hc_screens.py`: the coding agent's dark window with Honeycomb's answers as light cards inside it. The customer video has no product footage, so these follow the MCP server's real tool names and Honeycomb's query and BubbleUp results.

### 5 · Team Agents · Startup · **Build & Release Engineer** (was Agent Observability)
- *Fictional* three-engineer startup. No real customer. *Grounded (2026-11-12) in Honeycomb's Team Agents demo* (Innovation Week 2026): agents are given a **goal**, a standing responsibility, rather than a task; a goal runs on a schedule or a trigger such as a deploy; it is kept narrow with its own skills and connectors; it reports **Findings**; you can see every query it ran in Canvas; and it can open a pull request or update a runbook.
- *Persona*: the Build & Release Engineer who shipped Friday's release, on the couch at 3 a.m., one finger over the rollback key.
- *Stats*: Deploy Frequency 20 · Rollback Reflex 15 · Friday Deploys 1 · Sleep 3.
- *Room*: a startup loft at 3 a.m.; three desks, two empty; a pager on the floor; a projector screen with a calm sign-ups chart, release readouts and a support inbox (art brief 01).
- *Situation*: Friday's release tightened sign-up validation. Eleven people have told support they can't create an account. The error rate is 0.4%, as ever; nothing alerted; nobody can see what the eleven share.
- *Old tool*: **Friday's diff** — `[Read all two thousand lines]` `[Roll back everything]` `[Add a retry]`.
- *Hero feature*: **Team Agents.**
  1. **Goals.** The team's agents and their standing goals; "Watch every deploy" has a Finding from 6:22 PM Friday. `[Open the Finding]`.
  2. **The Finding.** Specific: sign-ups fail for names with an apostrophe; eleven people; overall errors normal; the place in the code. `[Check its work in Canvas]`.
  3. **Its work, on a Canvas.** The queries it ran (errors by name, latency unchanged, neighbouring services fine) and the fix it wrote.
  The other prompts nudge back: the overall error rate (eleven people don't move a percentage), how the goal is set up (a specialist, with limited reach), opening the pull request unchecked (agents can be wrong; trust is earned), filing an issue for Monday. Then **[Merge the agent's fix and deploy]**. Win: nobody rolled back Friday; the agent also fixed the runbook, which queried a field the deploy renamed.
- *Screens*: `assets/screens/ch5_hc_0..2.png` and `ch5_hc.json`, drawn in code by `tools/build_hc_screens.py` from that demo. Connector names are generic (code, tickets, runbooks), not third-party brands.

### Final · Charity Majors
Two moods and a closing line (see *No score*), in the script. Presented as a **full-canvas portrait takeover** as in v0.1 (my call): the existing 640×428 portraits are cropped to 640×400 and the blink/talk patches offset accordingly, so Jessitron's pending frames and every other portrait asset carry over unchanged. The verdict text is a message window over the lower part of the portrait. Then the sunrise coda.

## No score

**There is no score** (Rick, 2026-11-12). Points were the badge game's achievement badges; here, hunting for a higher number means nothing. What the game keeps instead:

- **A scenario can only be finished by choosing correctly.** Wrong choices get a joke or a nudge and come back; they never block and never end the scenario.
- **Completion**: which scenarios are solved (`oq.done`). The status bar shows `Solved: N of 5`; the menu ticks solved scenarios.
- **Missteps**, per solved scenario: how many wrong choices the player made on the way (old-tool prompts picked, the wrong advice given first). Never shown as a number. Nothing inside Honeycomb is a misstep.
- **The player chooses when to end.** After any solved scenario: claim the prize, or play another. On claim, **Charity's verdict**: `final.clean` if there were no missteps in any solved scenario, `final.grief` if there were, then one closing line by how many are solved (`final.count.one` / `.some` / `.all`). Then the sunrise coda.

## Intro and coda

The intro follows `docs/intro-storyboard.md` (Rick, 2026-11-11), which supersedes the *Night Shift* mock. It comes **after** character creation, so the sleeper is the player's hero.

**Two looks, one cut.** Shots 1–8 are **EGA-style cutscenes**: 320×200, large shapes, coarse ordered dithering, a small palette. Shot 9 switches to the **gameplay VGA look**.

**Limited animation (Rick, 2026-11-11).** Shots 1–8 imitate what a late-80s PC could afford: **nothing moves**. Every beat is a cut between stills, and each still recycles the last with the smallest possible change — the nightstand shot again but with an arm in it, the same face with one eyelid different — as if the animator were saving disk space. The only time-based effects are the cheap ones: a two-state palette swap for a blinking or flashing light, flashing text, scrolling text. No tweened motion, no fades. Real animation begins only in shot 9, with the hero.

| # | Shot | Still | The only thing that changes | ≈ s |
|---|---|---|---|---|
| 1 | Black; a blinking light reveals nightstand, lamp, sleeper | plate A | black ↔ plate, on the blink (≤ 2 Hz) | 3 |
| 2 | Pager close-up, **Help!** flashing | plate B | text on/off | 2.5 |
| 3 | Sleepy face, drool; a bleary eye cracks open | plate C → C with one eyelid changed | one cut | 3 |
| 4 | Arm at the pager | plate B with an arm added | nothing | 1.5 |
| 5 | Face looking at the pager, lit by its flashing light | C, eyes half open | two-state green palette swap | 2 |
| 6 | Pager, scrolling: **Backend is down. Front end is down. Database is down. Get in here! -CTO** | plate B | marquee | 5 |
| 7 | Misery and hopelessness | C, brows and mouth changed | nothing | 2 |
| 8 | Back to the wide dark room, steady in the pager's glow (Rick, 2026-11-11: the lamp close-up is cut — the light coming on *is* the cut to shot 9) | plate A | none | 1.4 |
| 9 | Click — the light is on: the VGA bedroom with the hero already sitting up in bed (never an empty bed), **Observability Quest I: So you want to be on-call?** on the wall; theme; the hero gets up in pyjamas; their jeans, Honeycomb hoodie and shoes lie on the floor (drawn in their own colours) and vanish from it as the hero flashes into them; the item they carry waits on the dresser and jumps to their hand once they are dressed, like an inventory pick-up; a dresser stands half open with clothes spilling out; the hero walks to the bedroom door, it opens, they go through, it shuts | plate D (+ optional door-open edit) + hero sprite | sprite animation; the door is a two-still cut; the room holds ~3 s on the title first, and every action has a sound | 15 |

- **Art**: shots 1–8 are **generated** in Firefly/Gemini to match the look of the narrator portraits (Rick's call 2026-11-11, after code-drawn faces fell short): one generic sleeper, half in shadow, the same for every player; the player's own hero appears in shot 9. Four plates and five single-change edits of them (`briefs/intro-shots-brief.md`); the tooling keeps only the pixels an edit changed, as with the portrait frames, so recycled stills stay pixel-identical outside the change. The pager is generated with a **blank** LCD and its text ("Help!", the scrolling CTO message) is drawn in code with a built-in pixel font so it is crisp. Shot 9's bedroom is one generated VGA background with an empty wall; the title on the wall is the app's existing **Observability Quest wordmark** (Rick, 2026-11-11) — the letters only, cut from the title screen without its starscape, rule or blue panel — extended to **OBSERVABILITY QUEST I** with the wordmark's own letter I set after QUEST — and the subtitle ("So you want to be on-call?") lettered under it in VT323. Code-drawn placeholders stand in until the images arrive.
- **Bedroom (Rick, 2026-11-11)**: furnished and lived in; the hoodie is **Honeycomb-branded** — a 4×4-pixel reduction of the official logomark high on the chest of every hoodie (and on the heap on the floor), in brand colours, derived from `assets/hc_logomark.png`, never generated.
- **Hero additions**: a `pj` outfit (pale striped top and bottoms in place of hoodie and jeans, no pocket, drawstrings or hood) and a `situp` pose (upright in bed, legs under the blanket). The outfit change is a two-frame white flash, Sierra-style.
- **Controls**: a tap advances to the next shot; **Skip** in the right thumb column jumps to the end. Reduced motion: no blinking or flashing (steady light, steady text), the pager message shown as steady pages, a sentence at a time, instead of scrolling. (Build notes 2026-11-11: shot 6 lengthened from ≈5 s to 8 s so the marquee reads at about ten characters a second; the wall title is lettered as page text over the canvas so it stays crisp.)
- **Sound**: pager beeps on the blinks, a lamp click, and a placeholder cue where the theme will go; the real theme arrives with the OPL soundtrack sub-project.
- A storyboard of these shots lives on the design canvas for team comment.

The **coda** (after Charity) is unchanged in intent: the hero walks out into dawn, shades on; its background is decided with the room art.

## Audio

- **FM synthesis via an OPL3 emulator** running in the browser (there are small JS/WebAssembly OPL3 cores; the builder picks one with a permissive licence and verifies it in Safari). Instruments are OPL patches (brass, strings, bells, organ, bass, drums) — the actual AdLib timbre of the era.
- **Original compositions** as note data, as in v0.1 but written for FM voices: a title theme (~45 s loop), a short motif per chapter (8–16 bars, ambient, low volume under play), a win sting, a wrong-move sting, the Charity verdict fanfare, and the sunrise coda cue. No existing melody is quoted.
- **Effects**: footsteps (soft click per step), window open/close, prompt select, pager buzz, "glitch" burst, Canvas typing ticks, finding stamp.
- First tap on the title unlocks audio; mute toggle persists; `visibilitychange` suspends.
- Rick approves each cue by ear; the composition data lives in its own files so it can be revised without touching the game.

## Art

- **Hero**: procedural parts sprite, 28×72 logical px, as specified in *Character creation*; drawn in code so recolouring is free, matched against the Python reference generator.
- **Room backgrounds** ×5 + intro ×3 + title: generated with the Firefly/Gemini pipeline using a new SCI-VGA preamble (320×200, 1990 VGA, dithered, Sierra room composition with a clear floor band and an uncluttered desk/wall where objects will go), cropped from the generator's 3:2 to 16:10, downsampled nearest-neighbour to 320×200 and palette-reduced to the scene's 64-colour set.
- **Hotspot objects are sprites, not part of the background** (my call): the laptop, the old-tool terminal, the Honeycomb workstation, the dusty "ask Einar" monitor, the whiteboard and the pager are hand-pixelled in the scene palette and composited at known positions, like SCI "views". The prompts therefore don't have to coax a generator into placing objects, no measuring or regeneration loop is needed, unvisited hotspots can glint, and hit rects are padded to 48 px however small the object is. Rooms are built against code-drawn placeholder backgrounds first and real backgrounds dropped in when generated.
- **Product screens**: drawn in code from the shared kit, not generated — they must be crisp and data-driven.
- **Claw Codez**: a small original robot sprite (a crab-claw-headed terminal on legs). Hand-pixelled. Never resembles any real mascot.
- **Portraits**: v0.1's six narrator portraits reused for verdicts; Jessitron's frames when they land.
- **Logo**: from the official SVG only. Rendered to the exact pixel size needed with crisp edges. Never generated.
- All provenance recorded in `ASSET_PROMPTS.md`.

## Technical approach

Carry over from v0.1: static layout shell, `text.js`, `claim.js` (form/complete), `sprites.js`, the asset tooling, the e2e harness, fonts. Replace: the game state machine, the scene layer, the audio synth. New:

- `js/engine/room.js` — room = { background, floorY, walk: [minX, maxX], hotspots: [{ id, rect, standX, look, use }], onEnter }. Hero walking along the floor line with the 4-frame cycle at 10 fps.
- `js/engine/windows.js` — SCI message windows and prompt buttons (DOM over canvas).
- `js/engine/statusbar.js` — title and solved count.
- `js/engine/hero.js` — parts-based sprite renderer and animation.
- `js/screens/` — product screens built from `js/kit/` (heatmap, waterfall, servicemap, bubbleup, timeline, canvas, finding).
- `js/chapters/ch1..ch5.js` — data + glue per chapter; `js/menu.js` — the scenario menu and completion (rules in *The scenario menu*, `?ch=` override, `oq.done`).
- **Script pipeline**: the script is a slotted Markdown document, `script/script.md`, one key per line (`ch1.room.enter`, `ch1.look.laptop`, `ch1.hc.prompt2.wrong1`, `final.tier.300` …). The builder drafts every slot with placeholder copy; Rick edits in place; `tools/build_script.mjs` generates `js/script.js` from it and fails on a missing or unknown key. Revisions are a regenerate, not a retranscription. Rick's intro narration goes into the same document's `intro.*` slots.
- `js/audio/opl.js` — OPL3 core + sequencer; `js/audio/music/*.js` — compositions; `js/audio/sfx.js`.
- `js/intro/` (timeline, face, pager, room shots), `js/screens/creator.js`, `js/final.js`.
- Tests: unit (room pathing math, scoring, prompt state, composition data, hero part maps), e2e (full run on landscape phones 844×390, 667×375, 932×430 and on a 1280×800 desktop; the rotate screen appears at 390×844 and clears on rotation; reduced motion; budget; every hotspot reachable and every chapter finishable by the Honeycomb path alone; wrong prompts never block).

## Verification before handoff

- Every chapter finishable by tapping only Honeycomb prompts; every wrong prompt greys out and never blocks; every Look line renders; Charity's tier matches the score.
- Each of the five scenarios plays through from the menu and from `?ch=N`; completion marks persist across a reload; CLAIM is offered after one scenario and the form is never shown twice; PLAY MORE returns to the menu.
- Landscape phones from 667×375 (the shortest) to 932×430, with the notch on either side (safe-area insets respected in both thumb columns); the rotate screen in portrait; Claim and Complete usable in both orientations with the keyboard open; desktop and tablet fine without ever seeing the rotate screen.
- Reduced motion: no walking animation, stills, instant text.
- Audio: title theme, chapter motifs, stings verified on iOS Safari and Android Chrome from a real device (Rick), OPL core CPU use acceptable on a mid-range phone.
- Weight ≤ 4 MB per run; title interactive < 2 s on 4G.
- A fresh reviewer reads the branch before it replaces `main`.

## Left to the builder

- Which OPL3 core; how to schedule notes against it.
- Hero part-map format and the creator's layout details.
- Product-screen kit internals; exact animations.
- Hotspot rects after backgrounds are generated.
- Test harness details.

## Open items (Rick)

- **The script**: intro narration, every room's narrator lines, Look lines, persona lines, prompt labels, wrong-move jabs, win lines, Charity's six verdicts, class-card stats. A draft script document follows this spec for review; PMM review later.
- **Six reference screenshots** of the real surfaces the kit renders — SLO burn chart, service map, Core Web Vitals / Web Launchpad, Canvas with an agent working, Team Agents Finding card, Agent Timeline — so the VGA versions have the real feature's shape.
- **Fonts**: Goatmeal's reply on Sierra Font 004 / SCI Menu Font (display slots only now; VT323 is settled for reading text).
- **Logo SVG** from the brand kit.
- **Jessitron frames** (unchanged).
- **Background prompts**: Rick runs the generation; the builder writes the prompts into `ASSET_PROMPTS.md` first.
- **Music**: approve each cue by ear.
- **Legal nod** on the parody names (Cave Logs Inc., Doggy Dashboards, Pretty Good Metrics, Claw Codez) and the fictional companies.
