// A scenario's progress, the pure part: whether a tool has been tried (it unlocks Leave computer and the
// persona's question), the wall display's state (broken → cause found → fix deployed), which status line the PC
// shows, the persona's lines, the decision, and the missteps (spec: The shape every scenario shares, and No
// score). The screen (js/screens/chapter.js) asks; this answers. Nothing here names a scenario.

export const PERSONA_CALLS = 3;

export function createScenario() {
  return { tried: false, oldTried: false, oldPicks: 0, found: false, deployed: false, wrong: false, calls: 0, cardSeen: false };
}

/** A prompt was picked in a tool ('old' or 'hc'). Opening a tool and backing out is not a try. */
export function notePrompt(s, kind) {
  s.tried = true;
  if (kind === 'old') { s.oldTried = true; s.oldPicks++; }
}

/** The investigation is finished: the cause is found. */
export function noteFound(s) { s.found = true; }

/** The fix is deployed. Nothing to deploy before the cause is found. */
export function noteDeployed(s) { if (s.found) s.deployed = true; }

/** 'broken' | 'found' | 'fixed'. The wall display recovers only on 'fixed'. */
export function wallState(s) {
  if (s.deployed) return 'fixed';
  return s.found ? 'found' : 'broken';
}

export function canLeave(s) { return s.tried; }

/** [Apply the fix and deploy] is on the PC menu once the cause is found, until it is used. */
export function canDeploy(s) { return s.found && !s.deployed; }

/** Which `pc.status.*` line the PC shows. */
export function statusLine(s) {
  if (s.deployed) return 'hc';
  if (s.found) return 'found';
  if (s.oldTried) return 'old';
  return 'before';
}

/** Use on the persona: the first time this visit their card opens by itself (Warp brief 07). True once. */
export function firstTalk(s) {
  if (s.cardSeen) return false;
  s.cardSeen = true;
  return true;
}

/** Use on the persona: before a tool is tried, their next call line (the last repeats); after, their question. */
export function personaUse(s) {
  if (!s.tried) { s.calls = Math.min(PERSONA_CALLS, s.calls + 1); return { kind: 'call', n: s.calls }; }
  return { kind: 'ask' };
}

/**
 * The advice. 'wrong' (the persona's own instinct): a jab once (a misstep), then the prompt is greyed. 'hc': the
 * win once the fix is deployed; 'deploy' when the cause is found but not deployed (they want it deployed now);
 * else 'show' (they want to see the investigation now).
 */
export function decide(s, choice) {
  if (choice === 'wrong') {
    if (s.wrong) return { outcome: 'tried' };
    s.wrong = true;
    return { outcome: 'jab' };
  }
  if (s.deployed) return { outcome: 'win' };
  return { outcome: s.found ? 'deploy' : 'show' };
}

/** Wrong choices on the way: every old-tool prompt picked, plus the wrong advice. Nothing in Honeycomb counts. */
export function missteps(s) {
  return s.oldPicks + (s.wrong ? 1 : 0);
}
