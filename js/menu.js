// The scenario menu, the pure part (spec: The scenario menu, No score): five rows in order, which scenarios
// are solved and with how many missteps (sessionStorage `oq.done`), the `?ch=N` shortcut, and when the claim
// button shows. No points anywhere.

export const SCENARIOS = [1, 2, 3, 4, 5];
export const AVAILABLE = [1];               // built so far; the rest show, disabled
export const DONE_KEY = 'oq.done';
const VERSION = 2;                          // 1 (unversioned) stored scenario → score

/**
 * { scenario: missteps } from storage; anything malformed is dropped. The old format, scenario → score with no
 * version, is read too: a stored 100 was a clean run (0 missteps), anything else had at least one (1).
 */
export function parseDone(raw) {
  let v;
  try { v = JSON.parse(raw); } catch { return {}; }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const old = v.v !== VERSION;
  const src = old ? v : v.done;
  if (!src || typeof src !== 'object' || Array.isArray(src)) return {};
  const out = {};
  for (const ch of SCENARIOS) {
    const m = src[ch];
    if (!Number.isInteger(m) || m < 0) continue;
    out[ch] = old ? (m === 100 ? 0 : 1) : m;
  }
  return out;
}

/** What `oq.done` stores. */
export function serializeDone(done) {
  return JSON.stringify({ v: VERSION, done });
}

/** A new record with `missteps` for scenario `ch`, keeping the fewer of old and new. */
export function recordDone(done, ch, missteps) {
  return { ...done, [ch]: Math.min(missteps, done[ch] ?? Infinity) };
}

/** How many scenarios are solved: the status bar's "Solved: N of 5". */
export function solvedCount(done) {
  return Object.keys(done).length;
}

export function menuRows(script, done, available = AVAILABLE) {
  return SCENARIOS.map((ch) => ({
    ch,
    name: script[`menu.ch${ch}.name`],
    hook: script[`menu.ch${ch}.hook`],
    enabled: available.includes(ch),
    done: ch in done,
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
