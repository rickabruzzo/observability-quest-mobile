// The stopwatch. Times each phase of a scenario back to back with performance.now(), minus any time on
// hold (the rotate gate, a hidden tab), and counts what the player did. Pure apart from the clock, which is
// injected, so it is tested without a browser.

export const PHASES = ['card', 'room', 'pc', 'old', 'hc', 'deploy', 'wall', 'persona', 'win'];
const LABELS = { card: 'Title card', room: 'Room', pc: 'PC', old: 'Old tool', hc: 'Honeycomb screen', deploy: 'Deploy + recovery', wall: 'Wall display', persona: 'Persona', win: 'Win + verdict' };
const COUNT_LABELS = [
  ['windows', 'Message windows'], ['taps', 'Taps'], ['walks', 'Walks'], ['walkMs', 'Walking time'],
  ['nudges', 'Honeycomb nudges'], ['oldPrompts', 'Old-tool prompts'], ['looks', 'Look uses'], ['visited', 'Hotspots visited'],
  ['emails', 'Emails opened'], ['status', 'Status checks'], ['wall', 'Wall display visits'], ['wrong', 'Wrong advice'], ['cards', 'Card views'],
];

export function formatMs(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function createRunlog({ chapter, now = () => performance.now() } = {}) {
  const phases = Object.fromEntries(PHASES.map((p) => [p, 0]));
  const counts = { windows: 0, taps: 0, walks: 0, walkMs: 0, nudges: 0, oldPrompts: 0, looks: 0, emails: 0, status: 0, wall: 0, wrong: 0, cards: 0 };
  const visited = new Set();
  const holds = new Set();
  let current = null, since = null, heldAt = null, done = false, missteps = 0;

  // active time is the wall clock with held stretches cut out; `since` is when the current stretch began
  const active = () => (current && since !== null && heldAt === null ? now() - since : 0);
  const bank = () => { if (current) phases[current] += active(); since = now(); };

  const log = {
    phase(name) {
      if (done || !PHASES.includes(name)) return;
      bank(); current = name; since = heldAt === null ? now() : null;
    },
    hold(reason, on) {
      if (done) return;
      const was = holds.size > 0;
      if (on) holds.add(reason); else holds.delete(reason);
      const is = holds.size > 0;
      if (!was && is) { bank(); heldAt = now(); since = null; }
      if (was && !is) { heldAt = null; since = now(); }
    },
    count(key, n = 1) { if (!done && key in counts) counts[key] += n; },
    walk(ms) { if (!done) { counts.walks++; counts.walkMs += Math.round(ms); } },
    visit(id) { if (!done) visited.add(id); },
    end(steps = 0) { if (done) return; bank(); current = null; done = true; missteps = steps; },
    snapshot() {
      const ph = { ...phases };
      if (current) ph[current] += active();
      const rounded = Object.fromEntries(Object.entries(ph).map(([k, v]) => [k, Math.round(v)]));
      const total = Object.values(rounded).reduce((a, b) => a + b, 0);
      return {
        chapter, phase: current, phases: rounded, total, elapsed: total,
        counts: { ...counts, visited: visited.size }, visited: [...visited],
        missteps, done, held: holds.size > 0,
      };
    },
  };
  return log;
}

/** The summary as plain lines: what Copy results puts on the clipboard. */
export function summaryLines(s) {
  const out = [`Observability Quest · scenario ${s.chapter} · ${formatMs(s.total)}`];
  for (const p of PHASES) out.push(`${LABELS[p]}: ${formatMs(s.phases[p])}`);
  for (const [k, label] of COUNT_LABELS) out.push(`${label}: ${k === 'walkMs' ? formatMs(s.counts[k]) : s.counts[k]}`);
  out.push(`Missteps: ${s.missteps}`);
  return out;
}

export { LABELS as PHASE_LABELS, COUNT_LABELS };
