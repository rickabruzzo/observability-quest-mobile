# Observability Quest — Script (v2, SCI adventure)

**Draft 1 for Rick's review · 2026-11-10.** Every line the game shows lives here, one slot per `###` heading;
the text under a heading (up to the next heading) is the slot's copy. `tools/build_script.py` (next
sub-project) turns this file into `js/script.js`, so edit the words here, not in code.

Conventions: the narrator speaks with no prefix. **The player is always the Honeycomb Hero** (Rick, 2026-11-12): the one who gets paged, in the
Honeycomb hoodie. Each chapter's **persona is the other person in the room**: it is their problem being
solved, the class card introduces *them*, and they speak with their title as a prefix (`CTO:`). `chN.hero.line`
is the persona's last word. Other characters are prefixed by name. `[Bracketed]` lines are the tappable prompts, in the order shown. In an old tool they are
one plausible and two silly, and all wrong. **In Honeycomb none is silly** (Rick, 2026-11-12): one is the
direct route and the others are sensible Honeycomb moves that get a nudge (`jab` slots) and cost nothing. `{name}` is the hero's name or "the Engineer". Slots marked **RICK** are
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

### status.done
Solved: {n} of 5

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
Five people paged you tonight. Every one of their problems really happened to somebody. Solve one and the prize is yours.

### menu.ch1.name
THE CTO

### menu.ch1.hook
The AI support bot keeps freezing. The logs renewal is due Friday.

### menu.ch2.name
THE PLATFORM ENGINEER

### menu.ch2.hook
A bank, mid-migration. Something in the old monolith is still answering.

### menu.ch3.name
THE FRONTEND DEVELOPER

### menu.ch3.hook
Checkout is slow, but only for some people. Nobody knows which.

### menu.ch4.name
THE SRE ON CALL

### menu.ch4.hook
Battle night. Pilots can't get in. One engineer understands the code.

### menu.ch5.name
THE RELEASE ENGINEER

### menu.ch5.hook
Three people, one Friday deploy, and eleven customers who can't sign up.

### menu.done
DONE

### after.prompt
One story down. The prize is yours — or the night is young.

### after.claim
[Claim your prize]

### after.more
[Another scenario]

---

## Chapter 1 — Agent Observability · Enterprise · CTO

Inspired by a customer-service platform whose support bot is a team of AI agents. The solve follows Honeycomb's own agent-observability demo (2026): an alert starts an automatic investigation in Canvas, Agent Timeline shows the whole conversation, and one LLM call shows what the model was fed. Company: **Converso**, assistant: **Otto** (the patient). The persona is the **CTO**, the buyer, who signs; the Honeycomb Hero advises her. Room: your cube and its 80s PC, Otto's vitals monitor on the wall, the CTO at her desk. Vitals stats are two short lines split at ` / ` (15 characters a line at most). Narrator portrait at the verdict: Christine Yen.

### ch1.card.title
THE CTO

### ch1.card.stats
Budget 3 · Vendor Skepticism 17 · Meetings Survived 19 · Grep 2

### ch1.card.line
You are the Honeycomb Hero, and this is who paged you: the CTO of Converso. Her AI support agent is failing customers, and she is one signature away from three more years of logs.

### ch1.room.enter
The exec floor at Converso, 3:14 AM. Glass walls, one lamp, and the CTO who paged you, on the phone, not enjoying it. On the wall, a screen the size of a door shows the vitals of Otto — the AI support assistant — who is frozen halfway through the sentence "I'd be happy to". He has been happy to for eleven minutes.

### ch1.look.monitor
Otto's vitals, on a screen someone bought to make the support bot feel important. The line is supposed to go up and down. It is mostly going down.

### ch1.monitor.chart
The chart reads like a hospital drama. Response time: critical. Tokens: hemorrhaging. Customers on hold: all of them. Last words: "I'd be happy to".

### ch1.vitals.stat.1
CONFIDENCE 100% / ANSWERS 0

### ch1.vitals.stat.2
TOOL CALLS / 97 AND RISING

### ch1.vitals.stat.3
TOKENS BURNED / 411,448

### ch1.vitals.stat.4
"HAPPY TO" / x847

### ch1.vitals.stat.5
PULSE / YES-ISH

### ch1.vitals.stat.6
TICKETS OPEN / ALL OF THEM

### ch1.vitals.stat.7
CUSTOMERS / ON HOLD

### ch1.vitals.stat.8
DASHBOARDS / ALL GREEN

### ch1.vitals.stat.9
TIME TO ANSWER / PENDING

### ch1.vitals.stat.10
MOOD / HAPPY TO

### ch1.vitals.ok.1
PULSE / STEADY

### ch1.vitals.ok.2
TOOL CALLS / 2

### ch1.vitals.ok.3
TOKEN BILL / SURVIVABLE

### ch1.vitals.ok.4
ORDERS READ / JUST THE ONE

### ch1.vitals.ok.5
ANSWERS / SEVERAL

### ch1.vitals.output
I'd be happy to

### ch1.vitals.output.ok
I'd be happy to help! Your order ships Tuesday.

### ch1.look.pc
The cube they've lent you, and a beige computer older than most of the company. It runs everything you need and nothing you want.

### ch1.look.cto
The CTO, on the phone with a customer who has been waiting on Otto. The Cave Logs renewal is on her desk — three years, with a comma in a place you didn't expect — and her pen is closer to it than you'd like.

### ch1.cto.call.1
CTO: No — no, he IS helping you. He's been "happy to" for eleven minutes.

### ch1.cto.call.2
CTO: I understand. Yes. I'm looking at the person who is going to fix it right now.

### ch1.cto.call.3
CTO: (to you, hand over the phone) Tell me what to buy. Go look, then tell me.

### ch1.pc.title
CONVERSO · WORKSTATION 7

### ch1.pc.menu.email
[Read email]

### ch1.pc.menu.vitals
[Check Otto's vitals]

### ch1.pc.menu.old
[Open Cave Logs]

### ch1.pc.menu.hc
[Open Honeycomb]

### ch1.pc.menu.leave
[Leave computer]

### ch1.pc.email.1
Otto?

### ch1.pc.email.2
RE: Otto???

### ch1.pc.email.3
Cave Logs renewal — sign by Friday (3 yrs)

### ch1.pc.email.4
FYI: the platform team set up a Honeycomb free tier

### ch1.pc.email.5
Whoever is microwaving fish at 3 AM

### ch1.pc.email.reply
Otto is dying. You don't have time for office email.

### ch1.pc.vitals.before
OTTO: CRITICAL. Stalled mid-sentence. Fourth outage this week. A dozen AI agents answer behind him, and nobody can see what they say to each other. Cause: unknown.

### ch1.pc.vitals.old
OTTO: STILL CRITICAL. You now have 40,000 lines of JSON about it. Cause: somewhere in the JSON, presumably.

### ch1.pc.vitals.hc
OTTO: STABLE. The order lookup returns one order now, not ninety-seven. Cause: found. Fix: deployed.

### ch1.pc.leave.locked
You stand up. You have looked at nothing and learned nothing, and the CTO can tell from across the room. Try a tool first.

### ch1.pc.leave
You push back from the desk. Time to go tell someone with a pen what to do with it.

### ch1.cto.ask
CTO: Well? Otto is failing customers and this contract is due Friday. What's your advice?

### ch1.decide.sign
[Sign the contract]

### ch1.decide.hc
[Get Honeycomb]

### ch1.decide.sign.jab
The pen touches paper. On the wall, Otto says "I'd be happy to". The CTO looks at the screen, then at you, then puts the pen down. "Try again."

### ch1.decide.hc.show
CTO: Honeycomb. Fine. Show me what it finds — now, on my clock.

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
You close Cave Logs. Cave Logs does not close you. Small victories.

### ch1.hc.title
HONEYCOMB · AGENT OBSERVABILITY

### ch1.hc.intro
An alert fired at 3:03 AM and Honeycomb began investigating before you woke. The Canvas is already filled in, and its Investigation Summary points at one of Otto's agents.

### ch1.hc.step1.prompt.1
[Open the worst conversation in Agent Timeline]

### ch1.hc.step1.prompt.2
[Check token usage by agent]

### ch1.hc.step1.prompt.3
[Ask the Canvas agent to keep digging]

### ch1.hc.step1.jab.2
The order-status agent is burning 79% of all the tokens. That is the who. The worst conversation will show you the how.

### ch1.hc.step1.jab.3
It will, and it is good at it. But it has already linked the worst conversation. One click and you can see for yourself.

### ch1.hc.step1.result
Agent Timeline lays out one whole conversation: every agent, LLM call and tool call, in order. This one ran 11 minutes and 411,448 tokens. The customer asked one question.

### ch1.hc.step2.prompt.1
[Open the slowest LLM call]

### ch1.hc.step2.prompt.2
[Open the application trace]

### ch1.hc.step2.prompt.3
[Check the evals]

### ch1.hc.step2.jab.2
The shipping service answered in 13 milliseconds. Nothing downstream is slow. The time is going inside the agent, so look at what the model was sent.

### ch1.hc.step2.jab.3
The eval scored this answer badly: Otto summarized all 97 orders when he should have asked which one. Bad answer, confirmed. Now find out why it was slow.

### ch1.hc.step2.result
Using Honeycomb's Agent Timeline, you found what was stalling Otto without switching tools: the customer asked about one order, and a tool fed the model all 97, again on every turn.

### ch1.pc.menu.deploy
[Apply the fix and deploy]

### ch1.pc.deploy
You change the order lookup to return the one order the customer asked about, and deploy. On the wall, Otto's line steadies.

### ch1.otto.recovered
OTTO: I'd be happy to help! I feel much better now. I really do. And for the record, I would open the pod bay doors. Nobody has given me any.

### ch1.pc.vitals.found
OTTO: STILL CRITICAL, but you know why. His order-status agent fetches every order a customer ever placed and re-reads the pile on every turn. Cause: found. Fix: not deployed.

### ch1.win
Agent Timeline showed you the whole conversation, down to what the model was fed. The CTO slides the Cave Logs renewal into a drawer, unsigned. The pen stays down.

### ch1.hero.line
CTO: Three years of grep, or one timeline. I'll take the timeline.

### ch1.verdict
CHRISTINE YEN: A chatbot is a conversation between agents now. When it goes wrong, you need to see all of it: every LLM call, every tool call, every token. You just did.

---

## Chapter 2 — Migrations · Fintech · Platform Engineer

Inspired by a digital bank two years into a monolith-to-microservices migration. Company: **Kestrel Bank**. Narrator: Emily Nakashima — **placeholder: Emily is leaving Honeycomb; keep her lines and portrait until a replacement narrator is named** (2026-11-10).

### ch2.card.title
THE PLATFORM ENGINEER

### ch2.card.stats
YAML Tolerance 18 · Kubernetes 16 · Sleep 4 · "It's DNS" 20

### ch2.card.line
Tonight's page: the Platform Engineer at Kestrel Bank, who has moved 350 services off the monolith. The monolith has not been informed.

### ch2.room.enter
The migration war room at Kestrel Bank. A whiteboard covered in arrows. Three hundred and fifty green tiles on the wall. In the corner, a beige server with a hand-written sign: DO NOT UNPLUG.

### ch2.look.laptop
The laptop they've handed you. A ticket queue climbing like a stock you didn't buy.

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
PLATFORM ENGINEER: Three hundred and fifty services and the problem was the one we said we'd turned off.

### ch2.verdict
EMILY NAKASHIMA: You followed one customer through 350 services in a single query. Root cause in minutes. That's the whole point of tracing — you don't guess the path, you see it.

---

## Chapter 3 — Frontend Observability · E-commerce · Frontend Developer

Inspired by a guitar maker whose store and lessons app were slow for some users. Company: **Twang & Co.**, lessons app **Fretwork**. Narrator: Graham Siener. The solve follows Honeycomb's own frontend-observability demo ("See everything"): the Web Launchpad shows the vitals are fine and one request is not; View Trace follows that request from the browser into the backend; the heatmap of that span and BubbleUp show what the slow ones share. In Honeycomb nothing is a joke: the `jab` slots are nudges. The room slots below still describe the placeholder five-hotspot room and are rewritten when the room art lands.

### ch3.card.title
THE FRONTEND DEVELOPER

### ch3.card.stats
Caffeine 17 · "Works on my machine" 20 · CSS 11 · Patience with RUM tools 1

### ch3.card.line
Tonight's page: the Frontend Developer at Twang & Co. She sells guitars online and teaches people to play them. Checkout is slow for someone. She does not know who.

### ch3.room.enter
The dev bullpen at Twang & Co. Monitors everywhere, one of them showing somebody's checkout stuck at 13%: "Placing your order…" A left-handed guitar leans against a desk, unplugged, like it knows.

### ch3.look.laptop
The laptop they've handed you. A conversion chart, sliding gently downhill since Tuesday.

### ch3.use.laptop
Conversions are dropping. Some shoppers watch the checkout spinner for fourteen seconds. Most see nothing wrong. The RUM tool says average page load is 2.1 seconds and considers the matter closed.

### ch3.look.guitar
A left-handed electric guitar. Somebody in this bullpen plays it. It has been leaning there, strung the other way round, trying to tell you something.

### ch3.use.guitar
Three chords. Nobody looks up. This is a very tired bullpen.

### ch3.look.bigscreen
A live checkout. "Placing your order…" Thirteen percent. It has been thirteen percent since you walked in.

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
HONEYCOMB · FRONTEND OBSERVABILITY

### ch3.hc.intro
Honeycomb opens on the Web Launchpad for the store. The Core Web Vitals are green: the page loads fine. One row under Slowest Requests is not fine. Checkout: fourteen seconds.

### ch3.hc.step1.prompt.1
[View the trace for the slow checkout]

### ch3.hc.step1.prompt.2
[Check the Core Web Vitals]

### ch3.hc.step1.prompt.3
[Filter the Launchpad to one browser]

### ch3.hc.step1.jab.2
Largest Contentful Paint, layout shift, input delay: all green, on every route. The page is fast. Whatever is losing sales happens after the page is up.

### ch3.hc.step1.jab.3
Chrome, Safari, Firefox: the slow checkouts are in all of them, and so are the fast ones. It isn't the browser. Follow the slow request.

### ch3.hc.step1.result
One trace, from the click in the browser to the last call in the backend. The page did its part in milliseconds, then waited fourteen seconds on the checkout service's PlaceOrder.

### ch3.hc.step2.prompt.1
[BubbleUp the slow checkouts]

### ch3.hc.step2.prompt.2
[Read this span's attributes]

### ch3.hc.step2.prompt.3
[Open the Errors tab]

### ch3.hc.step2.jab.2
This order: one left-handed guitar, shipped to Tulsa, paid by card. One of those might matter. One trace can't say which. Compare all the slow ones.

### ch3.hc.step2.jab.3
No errors. Every one of these orders went through, eventually. Slow isn't broken, which is why nobody got paged. Back to the slow ones.

### ch3.hc.step2.result
Using Honeycomb for Frontend Observability, you found what was losing sales without switching tools: every slow checkout has a left-handed guitar in the cart, and its stock check crawls.

### ch3.pc.menu.deploy
[Apply the fix and deploy]

### ch3.pc.deploy
You turn the left-handed stock check into one query instead of one per warehouse, and deploy. On the wall, the order goes through.

### ch3.win
You found the eight percent. Left-handed players can buy a guitar in under fourteen seconds again. Somewhere, a very patient southpaw finally checks out.

### ch3.hero.line
DEVELOPER: It worked on my machine. It turns out my machine is right-handed.

### ch3.verdict
GRAHAM SIENER: The average wasn't lying. It just wasn't talking about the one shopper in twelve who waited fourteen seconds. One trace from the browser to the backend, and BubbleUp, told you who.

---

## Chapter 4 — Hidden Failures · Gaming · Site Reliability Engineer

Inspired by a space MMO studio whose fleet-battle code one engineer understands. Company: **Nullpoint Games**, the game **Starfall**, the engineer **Einar**. Narrator: Jessitron. This is the **MCP** chapter (Canvas is in scenario 1). The solve follows a real customer's story: with Honeycomb they found that only 93% of their most important API call was succeeding, mostly for reasons in their own control, and took it past 99%; and once Honeycomb was available through MCP, nearly three times as many of their people used it. Here the call is joining a fleet, the legacy reason is a limit from 2003, and the MCP client is Claw Codez. In Honeycomb nothing is a joke: the `jab` slots are nudges, in Claw Codez's voice. The room slots below still describe the placeholder five-hotspot room and are rewritten when the room art lands.

### ch4.card.title
THE SRE ON CALL

### ch4.card.stats
Pager Endurance 19 · Postmortem Writing 14 · Blameless 18 · Sleep 2

### ch4.card.line
Tonight's page: the Site Reliability Engineer on call at Nullpoint Games. Eight thousand players are in one star system, and the one engineer who understands the fleet code is asleep in another time zone.

### ch4.room.enter
The ops room at Nullpoint Games, lit by a wall of space. Eight thousand pilots in one system. Chat scrolls with the word "lag" in nine languages. On a desk in the corner, a dusty monitor with a label: THE FLEET CODE — ASK EINAR.

### ch4.look.laptop
The laptop they've handed you. Every node green, every graph flat. According to this, tonight is going very well.

### ch4.use.laptop
The biggest battle in the game's history is live. Pilots say they can't get in, and chat calls it lag. The dashboards say the cluster is healthy. The fleet code is twenty-three years old, Einar wrote most of it, and Einar is asleep in Reykjavík.

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
A workstation with the team's coding agent open: a small crab-shaped thing labelled CLAW CODEZ. Someone has connected it to Honeycomb through MCP. It waves a claw.

### ch4.hc.title
HONEYCOMB · MCP

### ch4.hc.intro
Claw Codez is connected to Honeycomb over MCP, the Model Context Protocol, so anyone on the team can ask production a question in plain words. Nobody has to know Einar's code.

### ch4.hc.step1.prompt.1
[Ask: how many fleet joins succeed?]

### ch4.hc.step1.prompt.2
[Ask: is the cluster healthy?]

### ch4.hc.step1.prompt.3
[Ask: where does a join slow down?]

### ch4.hc.step1.jab.2
CLAW CODEZ: CPU fine. Memory fine. Every node green. Healthy machines, unhappy pilots. Ask about what the pilots are trying to do.

### ch4.hc.step1.jab.3
CLAW CODEZ: End to end, a join takes 40 milliseconds, when it works. It isn't slow. Ask how often it works.

### ch4.hc.step1.result
Claw Codez runs the query in Honeycomb and comes back with a number nobody had: 93%. Seven joins in a hundred fail, the game quietly retries, and everyone has been calling it lag.

### ch4.hc.step2.prompt.1
[Ask: what do the failures share?]

### ch4.hc.step2.prompt.2
[Ask: when did this start?]

### ch4.hc.step2.prompt.3
[Ask: which pilots are failing?]

### ch4.hc.step2.jab.2
CLAW CODEZ: It didn't start. It has been seven percent for as far back as the data goes. This isn't tonight's incident. It's every night's.

### ch4.hc.step2.jab.3
CLAW CODEZ: Every region, every ship class, every client version. It isn't who they are. Ask what the failing requests have in common.

### ch4.hc.step2.result
Using Honeycomb through MCP, you found what was failing without switching tools, or waking Einar: every failed join hit a 2003 limit of 255 ships to a fleet. It was in your control all along.

### ch4.pc.menu.deploy
[Apply the fix and deploy]

### ch4.pc.deploy
You raise the 2003 limit and deploy. Joins: 99% and climbing. On the wall, the ships that were thinking about it start to move.

### ch4.win
From 93 to 99 in one night, by asking. The battle finishes with everyone in it. Einar wakes at ten, reads the thread, and types "huh." It is the highest praise Einar gives.

### ch4.hero.line
SRE: We didn't need the one person who understood it. We needed to be able to ask.

### ch4.manager.line
MANAGER (running in): Half the studio is asking production questions. When did that happen?

### ch4.verdict
JESSITRON: Nobody had to be the hero who knows everything. Anyone on the team could have asked that question, in plain words. You didn't have a lag problem. You had a failure nobody knew was there.

---

## Chapter 5 — Team Agents · Startup · Build & Release Engineer

Fictional three-person startup. Company: **Agentry**. Narrator: Matt Nelson. This is the **Team Agents** chapter. The persona is the Build & Release Engineer who shipped on Friday. The solve follows Honeycomb's own Team Agents demo (Innovation Week 2026): an agent with a standing goal (watch every deploy) reads what the deploy was meant to do, leaves a specific Finding, shows its work on a Canvas, and offers the fix as a pull request; it also notices the runbook is out of date. In Honeycomb nothing is a joke: the `jab` slots are nudges. The room slots below still describe the placeholder five-hotspot room and are rewritten when the room art lands.

### ch5.card.title
THE RELEASE ENGINEER

### ch5.card.stats
Deploy Frequency 20 · Rollback Reflex 15 · Friday Deploys 1 · Sleep 3

### ch5.card.line
Tonight's page: the Build & Release Engineer at Agentry. There are three of them. He shipped on a Friday. He knows what he did.

### ch5.room.enter
A startup loft at 3 AM. Three desks, two empty. A pager face-down on the floor where someone threw it. On the couch, the engineer who shipped Friday's release, one finger over the rollback key.

### ch5.look.laptop
A laptop. The deploy log from Friday, 5:52 PM. Commit message: "small change."

### ch5.use.laptop
Friday's release tightened sign-up validation. Since then eleven people have written to support saying they can't create an account. The error rate is 0.4%, same as ever. Nothing alerted. Nobody can see what the eleven have in common.

### ch5.look.pager
The pager, face-down. It is still buzzing. It will buzz until you fix this or it dies. It will not die first.

### ch5.use.pager
You turn it over. Eleven pages. All of them from support.

### ch5.look.wallchart
Sign-ups. A calm, healthy line. Eleven people would like a word with that line.

### ch5.look.terminal
A terminal with Friday's diff open. Two thousand lines. The commit message says "small change."

### ch5.old.title
FRIDAY'S DIFF

### ch5.old.intro
Two thousand lines across forty files. Somewhere in here is the reason. It is not labelled.

### ch5.old.prompt.1
[Read all two thousand lines]

### ch5.old.jab.1
Line 1,412 looks suspicious. So did the last nine. It is 4 AM and you are now suspicious of whitespace.

### ch5.old.prompt.2
[Roll back everything]

### ch5.old.jab.2
Friday's release had eleven changes. You rolled back all eleven. Sign-ups work again, and so do the three bugs Friday fixed. The co-founder is awake.

### ch5.old.prompt.3
[Add a retry]

### ch5.old.jab.3
Sign-up now fails three times instead of once. Thorough.

### ch5.old.exit
You cannot find one line in two thousand by staring. You go find something that was watching.

### ch5.look.workstation
A workstation. Honeycomb — and a notification: a Team Agent has a Finding waiting. It has been waiting since 6:22 PM Friday.

### ch5.hc.title
HONEYCOMB · TEAM AGENTS

### ch5.hc.intro
Team Agents are teammates with a goal, not a to-do list. This one's goal is to watch every deploy. It watched Friday's, and it left a Finding at 6:22 PM. Nobody was looking.

### ch5.hc.step1.prompt.1
[Open the Finding]

### ch5.hc.step1.prompt.2
[Check the overall error rate]

### ch5.hc.step1.prompt.3
[Read how the goal is set up]

### ch5.hc.step1.jab.2
0.4%. Normal. That's the trouble with eleven people: they don't move a percentage. The Finding isn't about the percentage.

### ch5.hc.step1.jab.3
It reads each pull request to learn what the deploy was meant to do, and it can reach the code, the tickets and the runbooks, nothing else. A specialist. Its Finding is waiting.

### ch5.hc.step1.result
The Finding is specific: since Friday's deploy, sign-ups fail for names with an apostrophe. Eleven people. The overall error rate never moved, which is why nothing else noticed.

### ch5.hc.step2.prompt.1
[Check its work in Canvas]

### ch5.hc.step2.prompt.2
[Open the pull request now]

### ch5.hc.step2.prompt.3
[File an issue for Monday]

### ch5.hc.step2.jab.2
It will write one. But it's an agent, and agents can be wrong. Trust is earned. Look at what it did first.

### ch5.hc.step2.jab.3
That works, if eleven people can wait until Monday. The agent has already found the line. Check its work and ship tonight.

### ch5.hc.step2.result
Using Honeycomb's Team Agents, you found what Friday broke without switching tools. Its queries are all on the Canvas: where the errors are, what it ruled out, and the one line to fix.

### ch5.pc.menu.deploy
[Merge the agent's fix and deploy]

### ch5.pc.deploy
One line: an apostrophe is allowed to be part of a name. You merge the agent's pull request and deploy. Somewhere, an O'Brien finally gets a welcome email.

### ch5.win
Three engineers on the team, and the fourth is an agent that watched the deploy so nobody had to. It also fixed the runbook, which was querying a field Friday renamed. Nobody rolled back Friday.

### ch5.hero.line
RELEASE ENGINEER: I was going to roll back all of Friday. It was one line. It's always one line.

### ch5.verdict
MATT NELSON: You gave an agent a responsibility, not a task, and it caught the Friday deploy before anyone did. Specific, tireless, and it showed its work. That's a teammate.

---

## Final — Charity Majors

**No score** (Rick, 2026-11-12). Charity speaks when the player chooses to finish, after at least one scenario is solved. She has two moods, by whether the player made wrong choices along the way (tried the old tool's prompts, gave the wrong advice first), and one closing line by how many scenarios are solved. Everyone who gets here chose correctly in the end, so even the grief ends warm. The verdict window is a full-portrait takeover with the text in a window below.

### final.header
CHARITY MAJORS · CTO & CO-FOUNDER

### final.clean
No detours. You looked at the problem, asked the right question, and fixed it before your coffee got cold. Either you work at Honeycomb or you should. Welcome to the future.

### final.grief
You got there. You grepped some JSON first, and I watched you reach for that pen, and we are going to pretend I didn't. Observability isn't never being wrong. It's never being wrong for long.

### final.count.one
One incident, solved. There are four more nights like that one in there, if you can't sleep either.

### final.count.some
{n} incidents, solved. Your on-call rotation would like a word, and the word is "thanks".

### final.count.all
All five. Every incident in the building. Go home. Honeycomb will page you if anything is actually wrong.

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

### complete.redeem
REDEEMED (staff)

### complete.redeemed
REDEEMED

### complete.again
Play again

### complete.again.note
More incidents, same hero. The prize is yours already.

---

## Open questions for Rick

1. Company names: Converso, Kestrel Bank, Twang & Co. / Fretwork, Nullpoint Games / Starfall, Agentry — swap any you dislike; nothing else depends on them.
2. Einar: keep the Icelandic gag? It's affectionate, but say so if it reads as a jab at a real person.
3. Chapter 5 has one direct route now (check the agent's work, then merge its fix); opening the pull request unchecked gets a nudge.
4. The intro slots are placeholders for your script; they show the beat and the length I'd aim for.
5. Charity's final is two moods (`final.clean`, `final.grief`) plus a closing line by count: rewrite freely.
6. Chapter 2's narrator: Emily is leaving. Her verdict, name and portrait stay as the placeholder; when the replacement is named, `ch2.verdict` gets rewritten in their voice and the portrait pipeline runs once more (same steps as Jessitron's).
