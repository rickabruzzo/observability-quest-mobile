// The scenario menu, the pure part (spec: The scenario menu): five rows in order, completion and best
// scores in sessionStorage `oq.done`, the `?ch=N` shortcut, and when the claim button shows.

export const SCENARIOS = [1, 2, 3, 4, 5];
export const AVAILABLE = [1];               // built so far; the rest show, disabled
export const PER_SCENARIO = 100;
export const MAX_SCORE = SCENARIOS.length * PER_SCENARIO;
export const DONE_KEY = 'oq.done';

/** { scenario: best score } from storage; anything malformed is dropped. */
export function parseDone(raw) {
  let v;
  try { v = JSON.parse(raw); } catch { return {}; }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out = {};
  for (const ch of SCENARIOS) {
    const s = v[ch];
    if (Number.isInteger(s) && s >= 0 && s <= PER_SCENARIO) out[ch] = s;
  }
  return out;
}

/** A new record with `score` for scenario `ch`, keeping the better of old and new. */
export function recordDone(done, ch, score) {
  return { ...done, [ch]: Math.max(score, done[ch] ?? -1) };
}

export function totalScore(done) {
  return Object.values(done).reduce((a, b) => a + b, 0);
}

export function menuRows(script, done, available = AVAILABLE) {
  return SCENARIOS.map((ch) => ({
    ch,
    name: script[`menu.ch${ch}.name`],
    hook: script[`menu.ch${ch}.hook`],
    enabled: available.includes(ch),
    done: ch in done,
    score: ch in done ? done[ch] : null,
  }));
}

/** `?ch=N` → N when it is a whole number 1..5, else null. */
export function parseCh(search) {
  const v = new URLSearchParams(search).get('ch');
  if (v === null || !/^[1-9]$/.test(v)) return null;
  const n = Number(v);
  return SCENARIOS.includes(n) ? n : null;
}

/** Where the intro leads: straight into a built `?ch=N`, the preview room for `?preview=1`, else the menu. */
export function afterIntro(search, available = AVAILABLE) {
  if (new URLSearchParams(search).get('preview') === '1') return { screen: 'PREVIEW' };
  const ch = parseCh(search);
  return ch && available.includes(ch) ? { screen: 'CHAPTER', ch } : { screen: 'MENU' };
}

export function canClaim(done, claimed) {
  return !claimed && Object.keys(done).length > 0;
}
