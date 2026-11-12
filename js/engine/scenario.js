// A scenario's progress, the pure part: whether a tool has been tried (it unlocks Leave computer and the
// CTO's question), which vitals line the PC shows, the CTO's lines, the decision, and the score
// (spec: Chapters › 1 · Decision, and Scoring). The screen (js/screens/chapter.js) asks; this answers.

import { CLEAN, MESSY } from './prompts.js';

export const CTO_CALLS = 3;

export function createScenario() {
  return { tried: false, oldTried: false, hcDone: false, signed: false, calls: 0 };
}

/** A prompt was picked in a tool ('old' or 'hc'), right or wrong. Opening a tool and backing out is not a try. */
export function notePrompt(s, kind) {
  s.tried = true;
  if (kind === 'old') s.oldTried = true;
}

export function noteHcDone(s) { s.hcDone = true; }

export function canLeave(s) { return s.tried; }

/** Which `ch1.pc.vitals.*` line the PC shows. */
export function vitalsLine(s) {
  if (s.hcDone) return 'hc';
  if (s.oldTried) return 'old';
  return 'before';
}

/** Use on the CTO: before a tool is tried, her next call line (the last repeats); after, her question. */
export function ctoUse(s) {
  if (!s.tried) { s.calls = Math.min(CTO_CALLS, s.calls + 1); return { kind: 'call', n: s.calls }; }
  return { kind: 'ask' };
}

/**
 * The advice. 'sign': a jab once (it counts against the score), then the prompt is greyed. 'hc': the win when
 * the investigation is done, else 'show' (she wants to see it now).
 */
export function decide(s, choice) {
  if (choice === 'sign') {
    if (s.signed) return { outcome: 'tried' };
    s.signed = true;
    return { outcome: 'jab' };
  }
  return { outcome: s.hcDone ? 'win' : 'show' };
}

/** 100 clean; 50 after any wrong Honeycomb prompt or a signature; 0 if the investigation is not done. */
export function scenarioScore(s, hcTool) {
  if (!hcTool.done) return 0;
  return hcTool.wrong || s.signed ? MESSY : CLEAN;
}
