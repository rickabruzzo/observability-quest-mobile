# Observability Quest — Script (v2, SCI adventure)

**Draft 1 for Rick's review · 2026-11-10.** Every line the game shows lives here, one slot per `###` heading;
the text under a heading (up to the next heading) is the slot's copy. `tools/build_script.py` (next
sub-project) turns this file into `js/script.js`, so edit the words here, not in code.

Conventions: the narrator speaks with no prefix. The hero speaks as the chapter's class (`SRE:`). Other
characters are prefixed by name. `[Bracketed]` lines are the tappable prompts — one right, one plausible,
one silly — in the order shown. `{name}` is the hero's name or "the Engineer". Slots marked **RICK** are
yours to write; the placeholder shows the beat and the length.

Voice: the badge game's — second person, dry, a Sierra narrator who has seen you die before and is rooting
for you anyway. No real competitor names, ever: **Cave Logs Inc.** (logs), **Old Artifact** (APM
dashboards), **Pretty Good Metrics** (RUM averages). Coding agent: **Claw Codez**.

---

## Shell

### title.tagline
Honeycomb presents a night on call.

### title.start
Start

### title.credit
GloryQuest font by the12thdoctor (CC BY-SA). VT323 (OFL). Built by Honeycomb Field & Events.

### rotate.copy
Turn your phone sideways to play.

### help.window
LOOK (the eye) tells you about a thing. USE (the hand) does the thing. Tap anywhere on the floor to walk there. Tap a window to continue. Nothing here can get you fired. Probably.

### status.score
Score: {score} of 300

---

## Intro — *Night Shift* (RICK)

Six beats, shot as the intro. Each slot is one window of narration, 1–3 short lines. The hero in the intro is the default engineer; the sheet comes after.

### intro.1 — bedroom, 3:02 AM, the phone lights up
**RICK.** *Placeholder:* 3:02 AM. The phone on the nightstand does the thing phones do at 3:02 AM.

### intro.2 — sitting up
**RICK.** *Placeholder:* You know that sound. Everyone who has ever been on call knows that sound.

### intro.3 — the walk, street, sodium lamps
**RICK.** *Placeholder:* The office is six blocks away. Every block is a different theory about what broke.

### intro.4 — the wall of green dashboards
**RICK.** *Placeholder:* Forty dashboards. Forty green checkmarks. Somewhere behind them, something is very much not green.

### intro.5 — the hex on the horizon
**RICK.** *Placeholder:* And then, on the horizon, a hexagon. You've heard about this.

### intro.6 — title drop
**RICK.** *Placeholder:* SO YOU WANT TO BE ON CALL?

### intro.skip
Skip intro

---

## Character creation

### creator.hint
Tap a square to change · Random rolls the dice

### creator.note
Tonight's class is dealt by each chapter — with its own silly stats. The sheet is only who you look like.

### creator.name.label
Name

### creator.name.empty
optional

### creator.name.help
Up to 16 characters. Leave it blank to be "the Engineer".

### creator.random
Random

### creator.start
Start

---

## Scenario menu

Shown after the intro (Rick, 2026-11-11: the player picks; one finished scenario wins the prize; more are
optional). One row per scenario: the class you play, and the trouble in a few words. Draft copy — yours to fix.

### menu.title
PICK YOUR NIGHT SHIFT

### menu.hint
Five stories. Every one of them really happened to somebody. Finish one and the prize is yours.

### menu.ch1.name
TECHNICAL DECISION MAKER

### menu.ch1.hook
The AI support bot keeps freezing. The logs renewal is due Friday.

### menu.ch2.name
PLATFORM ENGINEER

### menu.ch2.hook
A bank, mid-migration. Something in the old monolith is still answering.

### menu.ch3.name
DEVELOPER

### menu.ch3.hook
Checkout is slow, but only for some people. Nobody knows which.

### menu.ch4.name
DEVOPS / SRE

### menu.ch4.hook
Launch night. Fleet battles are lagging. One engineer understands the code.

### menu.ch5.name
BUILD & RELEASE ENGINEER

### menu.ch5.hook
Three people, a fleet of AI agents, and a release that went out at 3 AM.

### menu.done
DONE

### after.prompt
One story down. The prize is yours — or the night is young.

### after.claim
[Claim your prize]

### after.more
[Another scenario]

---

## Chapter 1 — LLM Observability · Enterprise · Technical Decision Maker

Inspired by a customer-service platform that wired a dozen models into its support bot. Company: **Converso**, assistant: **Otto**. Narrator portrait at the verdict: Christine Yen.

### ch1.card.title
TECHNICAL DECISION MAKER

### ch1.card.stats
Budget 3 · Vendor Skepticism 17 · Meetings Survived 19 · Grep 2

### ch1.card.line
Tonight you are the Technical Decision Maker at Converso. You decide what the company buys. The company would like you to decide faster.

### ch1.room.enter
The exec floor at Converso, 3:14 AM. Glass walls, one lamp, and a wall screen where Otto — the AI support assistant — is frozen halfway through the sentence "I'd be happy to". It has been happy to for eleven minutes.

### ch1.look.laptop
Your laptop. Forty-one unread messages, thirty-nine of them from the same person, all of them the word "Otto?" with increasing punctuation.

### ch1.use.laptop
Fourth outage this week. Twelve different models answer behind Otto, and when one of them stalls, Otto stalls, and the SLO burns. The Cave Logs renewal is on your desk, due Friday, and it is the only thing in the room that isn't on fire.

### ch1.look.contract
A renewal contract from Cave Logs Inc. Three years. The number has a comma in a place you didn't expect.

### ch1.use.contract
You pick up the pen. You put down the pen. Not yet.

### ch1.look.wallscreen
Otto, mid-sentence. If you squint, the cursor is blinking in a way that feels judgmental.

### ch1.look.terminal
A terminal logged into Cave Logs Inc. The prompt is already there, waiting, like it knows you.

### ch1.old.title
CAVE LOGS INC.

### ch1.old.intro
The familiar black window. Forty thousand lines of JSON, every one of them technically true.

### ch1.old.prompt.1
[grep 40,000 lines of JSON]

### ch1.old.jab.1
Two hours later you have read forty thousand lines of JSON and learned that the timestamps are in three different time zones. Otto is still happy to.

### ch1.old.prompt.2
[Add another dashboard]

### ch1.old.jab.2
The new dashboard is beautiful. It is also green. Everything is green. Otto is frozen on a green dashboard.

### ch1.old.prompt.3
[Renew for 3 years]

### ch1.old.jab.3
You have solved nothing, but you have solved it for three years.

### ch1.old.exit
You close the terminal. The terminal does not close you. Small victories.

### ch1.look.workstation
A workstation showing a honeycomb-shaped logo. Someone on the platform team set this up and keeps mentioning it in standup.

### ch1.hc.title
HONEYCOMB · SLOs

### ch1.hc.intro
The Otto SLO. The burn chart is doing the thing burn charts do right before someone's weekend disappears.

### ch1.hc.step1.prompt.1
[Open the burning SLO]

### ch1.hc.step1.prompt.2
[Refresh and hope]

### ch1.hc.step1.prompt.3
[Rename the SLO to something calmer]

### ch1.hc.step1.jab.2
It refreshes. It is still burning. Hope is not a query.

### ch1.hc.step1.jab.3
"Otto Latency (Fine)". The chart did not get the memo.

### ch1.hc.step1.result
Every Otto conversation is a trace. Twelve model calls fan out under each one, and the slow ones aren't spread across all twelve — they pile up at the same minute every night.

### ch1.hc.step2.prompt.1
[Find what's starving the threads]

### ch1.hc.step2.prompt.2
[Blame the biggest model]

### ch1.hc.step2.prompt.3
[Ask Otto what's wrong]

### ch1.hc.step2.jab.2
The biggest model is slow because everything is slow. You have discovered the symptom. The symptom was not hiding.

### ch1.hc.step2.jab.3
Otto: "I'd be happy to". Otto has been happy to for fourteen minutes now.

### ch1.hc.step2.result
BubbleUp compares the slow traces against the rest and one attribute lights up: a nightly export cron, running on the same pool, quietly eating every thread at 3 AM. Fixed before customers noticed. SLO: recovering.

### ch1.win
You trace every LLM call, you find a cron job, and you let the Cave Logs renewal lapse. The pen stays down.

### ch1.hero.line
TDM: Three years of grep, or one query. I'll take the query.

### ch1.verdict
CHRISTINE YEN: Twelve models, one cron job, found in minutes. That's what tracing every request buys you — the problem is never where the dashboard points.

---

## Chapter 2 — Migrations · Fintech · Platform Engineer

Inspired by a digital bank two years into a monolith-to-microservices migration. Company: **Kestrel Bank**. Narrator: Emily Nakashima — **placeholder: Emily is leaving Honeycomb; keep her lines and portrait until a replacement narrator is named** (2026-11-10).

### ch2.card.title
PLATFORM ENGINEER

### ch2.card.stats
YAML Tolerance 18 · Kubernetes 16 · Sleep 4 · "It's DNS" 20

### ch2.card.line
Tonight you are the Platform Engineer at Kestrel Bank. You have migrated 350 services off the monolith. The monolith has not been informed.

### ch2.room.enter
The migration war room at Kestrel Bank. A whiteboard covered in arrows. Three hundred and fifty green tiles on the wall. In the corner, a beige server with a hand-written sign: DO NOT UNPLUG.

### ch2.look.laptop
Your laptop. A ticket queue climbing like a stock you didn't buy.

### ch2.use.laptop
The migration is "done". Customer transfers are taking a mysterious path through the new architecture — some of them arrive, slowly; some of them don't. Support tickets are climbing. Nobody can say which of 350 services is the problem, because every one of them is green.

### ch2.look.whiteboard
Two years of arrows. Somewhere in here is the truth. It is not labelled.

### ch2.use.whiteboard
You add an arrow. It helps the way arrows help.

### ch2.look.monolith
The monolith. Beige, warm, humming. DO NOT UNPLUG. The sign is laminated, which tells you everything.

### ch2.use.monolith
You touch the monolith. It is warm. Warmer than a retired machine should be.

### ch2.look.terminal
A terminal showing Old Artifact — 350 dashboards, 350 checkmarks.

### ch2.old.title
OLD ARTIFACT

### ch2.old.intro
Three hundred and fifty tiles. Every one green. Transfers are failing between the tiles, where nobody put a dashboard.

### ch2.old.prompt.1
[Refresh]

### ch2.old.jab.1
Still green. Greener, if anything. Dashboards are fine. Customers are not.

### ch2.old.prompt.2
[Add a 351st dashboard]

### ch2.old.jab.2
The 351st dashboard is green. You have found the one thing in this building that scales.

### ch2.old.prompt.3
[Ask the monolith nicely]

### ch2.old.jab.3
The monolith hums. It has heard "please" before.

### ch2.old.exit
Three hundred and fifty green lies. You step away from the wall.

### ch2.look.workstation
A workstation. Honeycomb. The intern set it up. The intern is asleep. The intern is smarter than all of you.

### ch2.hc.title
HONEYCOMB · SERVICE MAP

### ch2.hc.intro
Every one of the 350 services, and every call between them, drawn from the traces themselves. One path is doing something the architecture diagram says is impossible.

### ch2.hc.step1.prompt.1
[Trace one customer's transfer]

### ch2.hc.step1.prompt.2
[Look at the average latency]

### ch2.hc.step1.prompt.3
[Unplug the monolith]

### ch2.hc.step1.jab.2
The average is fine. The average is always fine. The average is how you got here.

### ch2.hc.step1.jab.3
The sign said DO NOT. You have confirmed the sign.

### ch2.hc.step1.result
One transfer, start to finish: forty-one services — and then, for one hop, it leaves the cloud, bounces through the beige box in the corner, and comes back. The monolith is still in the path. The migration missed one route.

### ch2.hc.step2.prompt.1
[BubbleUp: what's different about the slow ones?]

### ch2.hc.step2.prompt.2
[Restart the 41 services]

### ch2.hc.step2.prompt.3
[Blame DNS]

### ch2.hc.step2.jab.2
Forty-one restarts. The transfers now fail quickly instead of slowly. Progress, technically.

### ch2.hc.step2.jab.3
It is not DNS. It is never DNS. It is sometimes DNS. It is not DNS tonight.

### ch2.hc.step2.result
BubbleUp lights one attribute: `legacy_route=true`. Every slow transfer took the detour; no fast one did. One feature flag, one deploy, and the monolith finally gets to retire.

### ch2.win
A good migration goes unnoticed by customers. Tonight, yours finally does. You peel the sign off the monolith.

### ch2.hero.line
PLATFORM ENG: Three hundred and fifty services and the problem was the one we said we'd turned off.

### ch2.verdict
EMILY NAKASHIMA: You followed one customer through 350 services in a single query. Root cause in minutes. That's the whole point of tracing — you don't guess the path, you see it.

---

## Chapter 3 — Frontend Observability · E-commerce · Developer

Inspired by a guitar maker whose store and lessons app were slow for some users. Company: **Twang & Co.**, lessons app **Fretwork**. Narrator: Graham Siener.

### ch3.card.title
DEVELOPER

### ch3.card.stats
Caffeine 17 · "Works on my machine" 20 · CSS 11 · Patience with RUM tools 1

### ch3.card.line
Tonight you are the Developer at Twang & Co. You sell guitars online and teach people to play them. Both are slow for someone. You do not know who.

### ch3.room.enter
The dev bullpen at Twang & Co. Monitors everywhere, one of them showing the storefront stuck at 13% loaded. A Telecaster leans against a desk, unplugged, like it knows.

### ch3.look.laptop
Your laptop. A conversion chart, sliding gently downhill since Tuesday.

### ch3.use.laptop
Conversions are dropping. Some users see a spinner for fourteen seconds. Most see nothing wrong. The RUM tool says average page load is 2.1 seconds and considers the matter closed.

### ch3.look.guitar
A Telecaster. You could play it. You could also fix the site. One of these is in the job description.

### ch3.use.guitar
Three chords. Nobody looks up. This is a very tired bullpen.

### ch3.look.bigscreen
The storefront. Thirteen percent. It has been thirteen percent since you walked in.

### ch3.look.terminal
A terminal showing Pretty Good Metrics. The average is very pretty.

### ch3.old.title
PRETTY GOOD METRICS

### ch3.old.intro
Average page load: 2.1 seconds. Looks fine. "Looks fine" is doing a lot of work in that sentence.

### ch3.old.prompt.1
[Stare at the average]

### ch3.old.jab.1
Still 2.1. Somewhere, eight percent of your users are buying a guitar from someone else.

### ch3.old.prompt.2
[Blame the CDN]

### ch3.old.jab.2
The CDN sends back a very polite graph. The CDN is fine. The CDN is always fine. The CDN would like you to stop calling.

### ch3.old.prompt.3
[Add a loading spinner]

### ch3.old.jab.3
It spins beautifully. For fourteen seconds. The spinner is now your most-viewed page.

### ch3.old.exit
Your aggregate metrics are a beautiful lie. You go looking for the truth.

### ch3.look.workstation
A workstation. Honeycomb's Web Launchpad, already open to the storefront. Someone has been here before you and left a sticky note: "it's not the CDN".

### ch3.hc.title
HONEYCOMB · WEB VITALS

### ch3.hc.intro
Core Web Vitals for the storefront — but not as one average. As every session, with everything you know about it attached.

### ch3.hc.step1.prompt.1
[Open LCP for checkout]

### ch3.hc.step1.prompt.2
[Look at the global average again]

### ch3.hc.step1.prompt.3
[Make the images smaller]

### ch3.hc.step1.jab.2
2.1 seconds. It will be 2.1 seconds forever. It is a number that has made peace with itself.

### ch3.hc.step1.jab.3
The images are now very small. Checkout is still fourteen seconds for someone. A very small someone.

### ch3.hc.step1.result
The heatmap of Largest Contentful Paint has a hot band at fourteen seconds — a thin, stubborn stripe of users living in a different reality from the average.

### ch3.hc.step2.prompt.1
[BubbleUp on the slow sessions]

### ch3.hc.step2.prompt.2
[Email everyone to try again]

### ch3.hc.step2.prompt.3
[Switch the font]

### ch3.hc.step2.jab.2
Everyone tries again. Eight percent of everyone waits fourteen seconds again. You have doubled the problem.

### ch3.hc.step2.jab.3
The new font is lovely. It takes fourteen seconds to arrive.

### ch3.hc.step2.result
One attribute lights up: a single browser version, eight percent of your users, hidden inside the average. A fix ships. Conversions climb. Guitars sold.

### ch3.win
You found the eight percent. The storefront loads. Somebody, somewhere, finally gets their guitar.

### ch3.hero.line
DEV: It worked on my machine. It turns out my machine was in the 92%.

### ch3.verdict
GRAHAM SIENER: Averages hide people. You found the eight percent the average was quietly eating. That's frontend observability — real users, real sessions, no lies.

---

## Chapter 4 — Incident Response · Gaming · DevOps / SRE

Inspired by a space MMO studio whose fleet-battle code one engineer understands. Company: **Nullpoint Games**, the game **Starfall**, the engineer **Einar**. Narrator: Jessitron. This is the **Canvas** chapter.

### ch4.card.title
DEVOPS / SRE

### ch4.card.stats
Pager Endurance 19 · Postmortem Writing 14 · Blameless 18 · Sleep 2

### ch4.card.line
Tonight you are the SRE at Nullpoint Games. Eight thousand players are in one star system, and the one engineer who understands the fleet code is asleep in another time zone.

### ch4.room.enter
The ops room at Nullpoint Games, lit by a wall of space. Eight thousand pilots in one system. Chat scrolls with the word "lag" in nine languages. On a desk in the corner, a dusty monitor with a label: THE FLEET CODE — ASK EINAR.

### ch4.look.laptop
Your laptop. A latency graph climbing like a ship that has lost its argument with gravity.

### ch4.use.laptop
The biggest battle in the game's history is live. Latency is climbing. The fleet code is twenty-three years old and Einar wrote most of it. Einar is asleep. Einar is in Reykjavík. It is 7 AM in Reykjavík and Einar does not do 7 AM.

### ch4.look.wallscreen
Eight thousand ships. Some of them are moving. The rest are thinking about it.

### ch4.look.einar
Einar's desk. A monitor, a dust layer, a mug that says WORLD'S OKAYEST ENGINEER. The label says ASK EINAR. The label does not say how.

### ch4.use.einar
The old monitor wakes. A comment at the top of the file: "// do not touch — E, 2003". You do not touch.

### ch4.look.phone
The ops phone. One contact is starred. It is Einar.

### ch4.old.title
PAGE EINAR

### ch4.old.intro
You could wake him. He would answer. He would answer in Icelandic.

### ch4.old.prompt.1
[Wake Einar]

### ch4.old.jab.1
EINAR: "Já?" … "Nei." Einar has gone back to sleep. You have used your one Einar.

### ch4.old.prompt.2
[Restart the node and hope]

### ch4.old.jab.2
Eight thousand pilots watch a loading screen together. Chat has moved from "lag" to words you will not be putting in the postmortem.

### ch4.old.prompt.3
[Post "we're aware" in chat]

### ch4.old.jab.3
Chat is also aware. Chat has been aware for forty minutes. Awareness is not a fix.

### ch4.old.exit
You put the phone down. There has to be a way to understand code you didn't write, at 3 AM, without a human sacrifice.

### ch4.look.workstation
A workstation with a Honeycomb Canvas open. Someone has wired a coding agent into it — a small crab-shaped thing in the corner of the screen labelled CLAW CODEZ. It waves a claw.

### ch4.hc.title
HONEYCOMB · CANVAS

### ch4.hc.intro
A notebook that talks to your telemetry. You type a question; Claw Codez, through MCP, runs the queries against the live data and writes down what it finds — in front of everyone.

### ch4.hc.step1.prompt.1
[Ask: why did fleet latency spike?]

### ch4.hc.step1.prompt.2
[Ask: is it DNS?]

### ch4.hc.step1.prompt.3
[Ask Claw Codez to wake Einar]

### ch4.hc.step1.jab.2
CLAW CODEZ: Checked. Not DNS. I ran three queries to be sure. It is still not DNS.

### ch4.hc.step1.jab.3
CLAW CODEZ: I don't have hands. Also I've met Einar.

### ch4.hc.step1.result
Claw Codez runs the query, the heatmap draws itself, and BubbleUp fires on the slow spans: one node, `sector-7-grid-fleet-03`, carrying four times the ships of any other because the 2003 code balances by *system*, not by *fleet*. A hypothesis, tested, marked ✔.

### ch4.hc.step2.prompt.1
[Share the Canvas to #war-room]

### ch4.hc.step2.prompt.2
[Screenshot it into chat]

### ch4.hc.step2.prompt.3
[Print it for Einar]

### ch4.hc.step2.jab.2
A screenshot. Of a notebook. With the queries cropped out. The war room asks what the axes are.

### ch4.hc.step2.jab.3
The printer is out of toner. The printer has been out of toner since 2003.

### ch4.hc.step2.result
The whole investigation — question, queries, hypothesis, evidence — lands in #war-room as one link. Three engineers who were guessing are now reading the same page. Someone moves fleet-03's load. Latency drops.

### ch4.win
The battle finishes. Eight thousand pilots never know how close it came. Einar wakes at ten, reads the Canvas, and types "huh." It is the highest praise Einar gives.

### ch4.hero.line
SRE: We didn't need the one person who understood it. We needed to be able to ask.

### ch4.manager.line
MANAGER (running in): Have you seen Canvas? This thing's nuts.

### ch4.verdict
JESSITRON: Nobody had to be the hero who knows everything. You asked a question, the agent did the digging, and the whole team watched the answer appear. That's incident response as a team sport.

---

## Chapter 5 — Agent Observability · Startup · Build & Release Engineer

Fictional three-person AI-agent startup. Company: **Agentry**, their support agent **Pip**. Narrator: Matt Nelson. This is the **Team Agents** chapter.

### ch5.card.title
BUILD & RELEASE ENGINEER

### ch5.card.stats
Deploy Frequency 20 · Rollback Reflex 15 · Friday Deploys 1 · Sleep 3

### ch5.card.line
Tonight you are the Build & Release Engineer at Agentry. There are three of you. You shipped on a Friday. You know what you did.

### ch5.room.enter
A startup loft at 3 AM. Three desks, two empty. A pager face-down on the floor where someone threw it. On the wall, the token-spend chart has stopped being a chart and become a wall.

### ch5.look.laptop
Your laptop. The deploy log from Friday, 5:52 PM. You remember thinking "it's a small change."

### ch5.use.laptop
Friday's release changed Pip's prompt and swapped the model. Tonight Pip — the support agent — is answering customers by apologizing, forty times in a row, and billing you for every apology. The token bill tripled overnight.

### ch5.look.pager
The pager, face-down. It is still buzzing. It will buzz until you fix this or it dies. It will not die first.

### ch5.use.pager
You turn it over. Seventeen pages. All of them Pip.

### ch5.look.wallchart
Token spend. Vertical. The chart has become a wall and the wall has become a cliff.

### ch5.look.terminal
A terminal with Pip's own chat open. You could ask Pip what's wrong. Pip would love to help.

### ch5.old.title
ASK THE AGENT

### ch5.old.intro
Pip is right there. Pip is always right there. That is, in a sense, the problem.

### ch5.old.prompt.1
[Ask Pip why it looped]

### ch5.old.jab.1
PIP: I apologize for the confusion. PIP: I apologize for the confusion. PIP: I apologize for the confusion. You have been billed for three apologies.

### ch5.old.prompt.2
[Roll back everything]

### ch5.old.jab.2
Friday's release had eleven changes. You rolled back all eleven. Pip is fixed and so are the four features your customers liked. Your co-founder is awake.

### ch5.old.prompt.3
[Add a retry]

### ch5.old.jab.3
Pip now retries the apology. The token chart finds a new gear.

### ch5.old.exit
You cannot debug an agent by asking the agent. You go find something that was watching.

### ch5.look.workstation
A workstation. Honeycomb — and a notification: a Team Agent has a Finding waiting for you. It has been waiting since 6:22 PM Friday.

### ch5.hc.title
HONEYCOMB · TEAM AGENTS

### ch5.hc.intro
A Finding, from the Team Agent you set up with one goal: *Verify releases — check each deploy for regressions for 30 minutes after shipping.* It checked. It found one. It opened an incident channel. Nobody was looking.

### ch5.hc.step1.prompt.1
[Open the Finding]

### ch5.hc.step1.prompt.2
[Dismiss it, you know what's wrong]

### ch5.hc.step1.prompt.3
[Ask Pip to read it]

### ch5.hc.step1.jab.2
You do not know what's wrong. You know *that* it's wrong. The Finding knows what. Pride is expensive at 3 AM; tokens are more expensive.

### ch5.hc.step1.jab.3
PIP: I apologize for the confusion.

### ch5.hc.step1.result
The Finding: thirty minutes after Friday's deploy, Pip's tool-call retries rose from 1.1 to 38 per conversation. The Agent Timeline shows one conversation end to end — a single lookup tool, called, failing, called again, forty times, each one a fresh apology.

### ch5.hc.step2.prompt.1
[Check the evidence first]

### ch5.hc.step2.prompt.2
[Approve the suggested fix]

### ch5.hc.step2.prompt.3
[Add a sorry-limit]

### ch5.hc.step2.jab.3
Pip now apologizes exactly three times, then falls silent. Customers prefer the silence. This is not the win you wanted.

### ch5.hc.step2.result.1
The timeline shows it plainly: the new model calls the lookup tool with the old argument name, the tool rejects it, the model apologizes and tries the same thing again. The fix is one line in the prompt. You ship it. Retries fall to 1.1. The wall becomes a chart again.

### ch5.hc.step2.result.2
You approve the fix. It's right. You didn't check, but it's right, and you'll read it in the morning. The wall becomes a chart again. Half points — trust, but verify is literally the goal you gave it.

### ch5.win
Three engineers on the team, and the fourth one is an agent. It never slept, it never guessed, and it was right on Friday at 6:22 PM. You pick the pager up off the floor.

### ch5.hero.line
BUILD & RELEASE: I set it to verify releases and then I didn't read what it verified. Noted.

### ch5.verdict
MATT NELSON: You gave an agent one clear goal and it caught your Friday deploy before you did. That's Team Agents — tireless, specific, and already writing the postmortem.

---

## Final — Charity Majors

Tiers by points. The verdict window is a full-portrait takeover with the text in a window below. Score shown as `{score} of 500`. **These six tiers were written for a three-scenario run and need rewriting** now that one scenario wins: see the spec's Scoring section for the proposed shape (clean / mixed / rough, plus a line for how many are done).

### final.header
CHARITY MAJORS · CTO & CO-FOUNDER

### final.300
A perfect night. Three stories, three right calls, not one wrong tap. Either you work at Honeycomb or you're lying. Either way, welcome to the future.

### final.250
Nearly perfect. One wrong turn and you caught it fast. That's what observability is for — not never being wrong, just never being wrong for long.

### final.200
Solid. You got there. You took the scenic route once or twice, but you got there, and your customers never knew. That's the job.

### final.150
Half right. Not flying blind — just… partially blind. There's a better way, and it's at honeycomb.io.

### final.100
Rough night. Your on-call rotation hates you and they're right to. Dashboards are not observability. Grep is not a strategy.

### final.50
I don't know how you're still employed, but I respect the chaos. Call Honeycomb. Now. honeycomb.io

### coda.1
Dawn. You walk out of the building. The street is the same street. You are not the same engineer.

### coda.2
Somewhere a pager is quiet. Somewhere a dashboard is green and, for once, telling the truth.

### coda.3
{name} puts on sunglasses. It's going to be a good day. Probably.

---

## Claim & Complete (carried from v0.1; PMM review pending)

### claim.title
Claim your prize

### claim.sub
Show this to booth staff after you enter your work email.

### claim.label
Work email

### claim.placeholder
you@company.com

### claim.error
That doesn't look like a work email.

### claim.button
Claim

### complete.title
SHOW THIS TO BOOTH STAFF

### complete.instr
You finished Observability Quest. Hand your phone to someone in a Honeycomb shirt.

### complete.score
Final score: {score} of 300

### complete.redeem
REDEEMED (staff)

### complete.redeemed
REDEEMED

### complete.again
Play again

### complete.again.note
Three new stories, same hero. The prize is yours already.

---

## Open questions for Rick

1. Company names: Converso, Kestrel Bank, Twang & Co. / Fretwork, Nullpoint Games / Starfall, Agentry / Pip — swap any you dislike; nothing else depends on them.
2. Einar: keep the Icelandic gag? It's affectionate, but say so if it reads as a jab at a real person.
3. Chapter 5's two winning prompts: *Check the evidence first* = 100, *Approve the suggested fix* = 50 (spec). The 50-point result text makes the half-score explicit — too preachy?
4. The intro slots are placeholders for your script; they show the beat and the length I'd aim for.
5. Charity's `final.250` tier is new (v0.1 had five solves, not points) — happy to rewrite any of the six.
6. Chapter 2's narrator: Emily is leaving. Her verdict, name and portrait stay as the placeholder; when the replacement is named, `ch2.verdict` gets rewritten in their voice and the portrait pipeline runs once more (same steps as Jessitron's).
