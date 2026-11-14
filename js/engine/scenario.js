// A scenario's progress, the pure part: whether a tool has been tried (it unlocks Leave computer and the
// CTO's question), Otto's state (critical → cause found → fix deployed), which vitals line the PC shows,
// the CTO's lines, the decision, and the missteps (spec: Chapters › 1 · Decision, and No score). The screen
// (js/screens/chapter.js) asks; this answers.

export const CTO_CALLS = 3;

export function createScenario() {
  return { tried: false, oldTried: false, oldPicks: 0, found: false, deployed: false, signed: false, calls: 0, cardSeen: false };
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

/** 'critical' | 'found' | 'deployed'. The monitor recovers only on 'deployed'. */
export function ottoState(s) {
  if (s.deployed) return 'deployed';
  return s.found ? 'found' : 'critical';
}

export function canLeave(s) { return s.tried; }

/** [Apply the fix and deploy] is on the PC menu once the cause is found, until it is used. */
export function canDeploy(s) { return s.found && !s.deployed; }

/** Which `ch1.pc.vitals.*` line the PC shows. */
export function vitalsLine(s) {
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

/** Use on the CTO: before a tool is tried, her next call line (the last repeats); after, her question. */
export function ctoUse(s) {
  if (!s.tried) { s.calls = Math.min(CTO_CALLS, s.calls + 1); return { kind: 'call', n: s.calls }; }
  return { kind: 'ask' };
}

/**
 * The advice. 'sign': a jab once (a misstep), then the prompt is greyed. 'hc': the win once the fix is deployed;
 * 'deploy' when the cause is found but not deployed (she wants it deployed now); else 'show' (she wants to see
 * the investigation now).
 */
export function decide(s, choice) {
  if (choice === 'sign') {
    if (s.signed) return { outcome: 'tried' };
    s.signed = true;
    return { outcome: 'jab' };
  }
  if (s.deployed) return { outcome: 'win' };
  return { outcome: s.found ? 'deploy' : 'show' };
}

/** Wrong choices on the way: every old-tool prompt picked, plus the wrong advice. Nothing in Honeycomb counts. */
export function missteps(s) {
  return s.oldPicks + (s.signed ? 1 : 0);
}
