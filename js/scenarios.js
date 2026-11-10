// Scenario copy for Observability Quest — transcribed verbatim from the badge game
// (source/badge/__init__.py, v1.1.0) except the roster changes noted below.
//
// Each intro[0] begins with "ROLE\nCOMPANY\n\n" — the game renders that header as
// "You are a {Role} at {Company}." (see text.js parseIntro / introLead).

export const SCENARIOS = [
  { // 1 — LLM Observability (Intercom / Fin AI)
    id: 's1_llm',
    image: 's1_llm',
    intro: [
      'LEAD ENGINEER\nCUSTOMER SERVICE PLATFORM\n\nYour team just wired 12 different LLMs into your AI chatbot. It looked great in staging. Now it is 3am and you have had your fourth outage this week.',
      'The system is slow and unstable. SLO burn is accelerating. Your on-call rotation is already fried.\n\nYou need to find the root cause fast.\n\nHOW DO YOU INVESTIGATE?',
    ],
    narrator: { name: 'CHRISTINE YEN', title: 'CEO & CO-FOUNDER', portrait: 'portrait_christine' },
    choiceA: { title: 'HONEYCOMB', sub: 'Trace every LLM request' },
    choiceB: { title: 'SPLUNK', sub: 'Grep 40k lines of JSON' },
    winText: 'NICE WORK.\n\nWith Honeycomb LLM observability you traced every request across all 12 models in minutes.\n\nYou found a nightly cron job quietly starving threads at peak hours. Fixed before customers noticed. SLO: RECOVERED.',
    loseText: 'BAD CALL.\n\nYou opened Splunk and started grepping logs at 3am.\n\nTwo hours later you have read 40000 lines of JSON and found nothing. Your customers are tweeting. Your CEO is awake.\n\nCongratulations. The incident is now your personality.',
  },
  { // 2 — Distributed Tracing (Nubank)
    id: 's2_microservices',
    image: 's2_microservices',
    intro: [
      'CTO\nFINTECH COMPANY\n\nYou just completed a 2-year migration. Your on-prem monolith is gone. You now run 350 cloud microservices. It is beautiful. It is also completely opaque.',
      'Customer transactions are taking a mysterious path through your new architecture. Support tickets are climbing.\n\nYou need to understand the full customer journey.\n\nWHAT IS YOUR STRATEGY?',
    ],
    // Title updated 2026-11 (was SVP, ENGINEERING)
    narrator: { name: 'EMILY NAKASHIMA', title: 'SR VP OPERATIONS', portrait: 'portrait_emily' },
    choiceA: { title: 'HONEYCOMB', sub: 'Follow any user, 350 svcs' },
    choiceB: { title: 'NEW RELIC', sub: '350 green dashboards' },
    winText: 'EXCELLENT.\n\nWith Honeycomb high-cardinality spans you tagged every event with User ID and Trace ID.\n\nYou followed any customer across all 350 services in a single query. Root cause found in 4 minutes. RCA done.',
    loseText: 'BOLD CHOICE.\n\nYou now have 350 New Relic dashboards. Each one shows a green checkmark.\n\nMeanwhile customer transactions are silently failing between services. Metrics have no context.\n\nDashboards are fine. Customers are not.',
  },
  { // 3 — Frontend Observability (Fender)
    id: 's3_ecommerce',
    image: 's3_ecommerce',
    intro: [
      'DIRECTOR OF PLATFORM ENGINEERING\nMUSIC INSTRUMENT BRAND\n\nYour e-commerce site sells guitars. Your learning app teaches people to play them. Both are slow for some users. You just do not know which users or why.',
      'Conversion rates are dropping. Someone mentions Core Web Vitals. Your existing RUM tool shows a single average page load time.\n\nAverage is a lie. You need the outliers.\n\nWHAT DO YOU DO?',
    ],
    narrator: { name: 'GRAHAM SIENER', title: 'SVP, PRODUCT', portrait: 'portrait_graham' },
    choiceA: { title: 'HONEYCOMB', sub: 'Find the 8% with bad loads' },
    choiceB: { title: 'KEEP THE RUM TOOL', sub: 'Avg load: 2.1s. Looks fine.' },
    winText: 'GOOD CALL.\n\nWith Honeycomb frontend observability you tagged traces with User ID and browser context.\n\nYou found a specific Chrome version causing 14-second loads for 8% of users hidden inside your averages. Fixed. Conversions up. Guitars sold.',
    loseText: 'MOMENT OF SILENCE.\n\nYour RUM dashboard shows average page load: 2.1 seconds. Looks fine.\n\nSomewhere 8% of your users are watching a spinner and buying from a competitor.\n\nYour aggregate metrics are a beautiful lie and you will never know it.',
  },
  { // 4 — Tool Consolidation (Duolingo)
    id: 's4_spaghetti',
    image: 's4_spaghetti',
    intro: [
      'STAFF SITE RELIABILITY ENGINEER\nLANGUAGE LEARNING PLATFORM\n\nYou run a 99.99 percent reliability initiative. Your service graph looks like a plate of spaghetti. You have a log tool, an APM, a metrics system, a tracing tool, and a SIEM.',
      'When incidents happen engineers spend hours pivoting between 5 platforms trying to stitch together a narrative.\n\nLicensing costs are ballooning. Morale is suffering.\n\nHOW DO YOU FIX THIS?',
    ],
    // Narrator replaced 2026-11 (was JULIE NEUMANN / CMO). Portrait: Jess's pick (variant 2), 2026-11-10.
    narrator: { name: 'JESSITRON', title: 'ENG MANAGER OF DEVELOPER RELATIONS', portrait: 'portrait_jessitron' },
    choiceA: { title: 'HONEYCOMB', sub: 'Unify logs, traces, metrics' },
    choiceB: { title: 'ADD A SIXTH TOOL', sub: 'Correlate the other five' },
    winText: 'GENIUS.\n\nYou sunsetted 3 tools and moved everything into Honeycomb.\n\nLogs, traces, and metrics unified. Engineers stop pivoting between platforms. Tooling costs down 16 percent. Your team sleeps again.',
    loseText: 'A BOLD VISION.\n\nYou bought a sixth tool to correlate the other five.\n\nIt requires its own oncall rotation, has a 40-page setup guide, and costs more than the five tools combined.\n\nThe spaghetti now has a sixth noodle. Bon appetit.',
  },
  { // 5 — High-Cardinality Tracing (Moov)
    id: 's5_payments',
    image: 's5_payments',
    intro: [
      'CTO\nPAYMENTS PLATFORM\n\nYour platform moves money through your app, 3 payment processors, a card issuer, and a bank. A transaction just failed. A client is on the phone. You have no idea where the money stopped.',
      'Your platform processes thousands of transactions a minute. Each touches 6 external providers. Risk and product teams also need visibility.\n\nYou need ONE tool to trace a single dollar start to finish.\n\nWHAT DO YOU CHOOSE?',
    ],
    // Title updated 2026-11 (was CRO)
    narrator: { name: 'MATT NELSON', title: 'PRESIDENT, GO-TO-MARKET', portrait: 'portrait_matt' },
    choiceA: { title: 'HONEYCOMB', sub: 'Trace one dollar, 6 hops' },
    choiceB: { title: 'GRAFANA', sub: 'Aggregate metrics dashboard' },
    winText: 'PERFECT.\n\nWith Honeycomb you trace any individual transaction through all 6 hops in seconds.\n\nEngineering, product, and risk teams all query the same data. Failed transaction found in 90 seconds. Client satisfied. You slept fine.',
    loseText: 'INTERESTING CHOICE.\n\nYour Grafana dashboard: transactions normal, error rate 0.02 percent.\n\nThat 0.02 percent is your client\'s wire transfer frozen between providers 3 and 4. You will be on this call for four hours. Dashboard stays green.',
  },
];

export const CHARITY = { name: 'CHARITY MAJORS', title: 'CTO & CO-FOUNDER', portrait: 'portrait_charity' };

// Final verdict body text, keyed by score. The header (name/title) comes from CHARITY.
export const VERDICTS = {
  5: 'Perfect score. You actually understand your systems. Either you work at Honeycomb or you\'re lying. Either way, welcome to the future.',
  4: 'Four out of five. Solid. One bad call but you caught it fast. That\'s what observability is for.',
  3: 'Three out of five. Not flying blind, just... partially blind. There\'s a better way and it\'s at honeycomb.io.',
  2: 'Two out of five. Your on-call rotation hates you and they\'re right to. Dashboards are not observability.',
  1: 'One out of five. ONE. I am begging you. Please. Call us. honeycomb.io',
  0: 'Zero. You got zero. I don\'t know how you\'re still employed but I respect the chaos. Call Honeycomb. Now. honeycomb.io',
};

// New for mobile. Rick to edit.
export const HOW_TO_PLAY =
  'Five real Honeycomb customer stories. Read the situation. Pick your move. See how it plays out.\n\nTap the text to skip ahead. Tap NEXT when you\'re ready.';
