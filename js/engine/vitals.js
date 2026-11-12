// Otto's vitals, the pure part: given the time and a state, what the monitor shows. The heartbeat lane,
// three readout boxes cycling jokey stats, three lights and Otto's output line. The screen draws it twice
// from the same frame: motion only in the room (the boxes are 18 px there), the full readout close up.
//
// Everything is a function of the step (about 10 a second), so it is deterministic and tested without a
// browser. Reduced motion: one still frame per state (a tap on a box still steps it).

export const STEP_MS = 100;
export const TALK_MS = 320;          // the CTO's talk loop: one frame this long

// the boxes: one box changes at a time, with 0.6–1.2 s between changes, so each changes every ~3 s
const GAP_MIN = 6, GAP_SPAN = 7;
// the output line: one character a step, then hold, then (critical only) a glitch and start over
const HOLD_STEPS = 40, GLITCH_STEPS = 4, CURSOR_STEPS = 5;
const LIGHTS = [{ per: 4, off: 0 }, { per: 5, off: 2 }, { per: 6, off: 1 }];   // critical blink rhythms
const GARBLE = '#@%&*?!/<>$';

/** A cheap integer hash: deterministic noise from a number. */
function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}

export function stepAt(ms) { return Math.max(0, Math.floor(ms / STEP_MS)); }

/** 'MODELS AWAKE / 10 OF 12' → ['MODELS AWAKE', '10 OF 12']. */
export function splitStat(s) {
  const i = s.indexOf(' / ');
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 3)];
}

/** The automatic box changes up to `step`: [{ step, box }], one per step at most, never the same box twice running. */
function autoEvents(step, salt) {
  const out = [];
  let at = 0, prev = -1;
  for (let n = 0; ; n++) {
    at += GAP_MIN + (hash(n * 7 + salt) % GAP_SPAN);
    if (at > step) return out;
    const others = [0, 1, 2].filter((b) => b !== prev);
    const box = others[hash(n * 13 + salt + 1) % others.length];
    out.push({ step: at, box }); prev = box;
  }
}

function boxesAt(step, pool, events) {
  const stats = [0, 1, 2], changed = [-1, -1, -1];
  let cursor = 3;
  for (const e of events) {
    if (e.step > step) break;
    let next = cursor % pool.length;
    while (stats.includes(next)) next = (next + 1) % pool.length;          // never one a box is showing, its own included
    stats[e.box] = next; changed[e.box] = e.step; cursor = next + 1;
  }
  return stats.map((stat, b) => {
    const garble = changed[b] === step && step > 0;
    const lines = splitStat(pool[stat]);
    return { stat, garble, lines: garble ? lines.map((l, i) => scramble(l, step * 31 + b * 7 + i)) : lines };
  });
}

function scramble(line, seed) {
  return [...line].map((c, i) => (c === ' ' ? ' ' : GARBLE[hash(seed * 97 + i) % GARBLE.length])).join('');
}

function outputAt(step, text, loop) {
  const type = text.length;
  if (!loop) {
    const shown = Math.min(type, step);
    return { text, shown, cursor: shown < type || Math.floor(step / CURSOR_STEPS) % 2 === 0, glitch: false };
  }
  const cycle = type + HOLD_STEPS + GLITCH_STEPS, t = step % cycle;
  if (t < type) return { text, shown: t, cursor: true, glitch: false };
  if (t < type + HOLD_STEPS) return { text, shown: type, cursor: Math.floor((t - type) / CURSOR_STEPS) % 2 === 0, glitch: false };
  return { text, shown: type, cursor: false, glitch: true };
}

/**
 * The monitor at `ms` since the state began.
 * @param {{ state: 'critical'|'ok', pool: string[], okPool: string[], output: string, outputOk: string,
 *           reduced?: boolean, nudges?: {step:number, box:number}[] }} o  nudges: taps on a box (close up)
 */
export function vitalsFrame(ms, o) {
  const ok = o.state === 'ok';
  const pool = ok ? o.okPool : o.pool;
  const nudges = (o.nudges || []).slice().sort((a, b) => a.step - b.step);
  if (o.reduced) {
    // a still: no automatic changes, the line typed in full, the lights on; a tap still steps its box
    const events = nudges.map((n, i) => ({ step: i + 1, box: n.box }));
    const boxes = boxesAt(events.length + 1, pool, events).map((b) => ({ ...b, garble: false, lines: splitStat(pool[b.stat]) }));
    const text = ok ? o.outputOk : o.output;
    return { state: o.state, step: 0, boxes, lights: [true, true, true], tone: ok ? 'green' : 'red', output: { text, shown: text.length, cursor: true, glitch: false } };
  }
  const step = stepAt(ms);
  const events = autoEvents(step, ok ? 501 : 17).concat(nudges.filter((n) => n.step <= step)).sort((a, b) => a.step - b.step);
  const boxes = boxesAt(step, pool, events);
  const lights = ok ? [true, true, true] : LIGHTS.map((l) => Math.floor((step + l.off) / l.per) % 2 === 0);
  return { state: o.state, step, boxes, lights, tone: ok ? 'green' : 'red', output: outputAt(step, ok ? o.outputOk : o.output, !ok) };
}

const OK_PERIOD = 30;
const OK_SHAPE = { 0: 0.5, 1: 0.58, 2: 0.42, 3: 0.95, 4: 0.08, 5: 0.56, 6: 0.5, 12: 0.56, 13: 0.6, 14: 0.56 };
const CRIT_SEG = 24;

/** One heartbeat sample at absolute position i: 0 is the top of the lane, 1 the bottom; 0.5 the baseline. */
function waveAt(i, state) {
  if (state === 'ok') { const v = OK_SHAPE[i % OK_PERIOD]; return 1 - (v ?? 0.5); }
  const seg = Math.floor(i / CRIT_SEG), h = hash(seg * 3 + 11), k = (i % CRIT_SEG) - (3 + (h % 14));
  const noise = ((hash(i) % 5) - 2) * 0.012;
  if (h % 4 === 0) return 0.5;                                   // flatline for a stretch
  const a = 0.25 + ((h >>> 4) % 6) / 10;                         // an uneven spike
  const shape = { 0: 0.5 - a * 0.25, 1: 0.5 + a * 0.15, 2: 0.5 - a, 3: Math.min(1, 0.5 + a * 0.9), 4: 0.5 - a * 0.2 }[k];
  return Math.max(0, Math.min(1, (shape ?? 0.5) + (shape === undefined ? noise : 0)));
}

/** The `n` samples in the lane at `ms`, scrolling left two samples a step. Reduced motion: a still trace. */
export function beatSamples(ms, state, n, reduced = false) {
  const base = reduced ? 0 : stepAt(ms) * 2;
  return Array.from({ length: n }, (_, i) => waveAt(base + i, state));
}

/** The CTO's patch at `ms`: 0 the room's own plate, 1 or 2 a talk patch (plate, 1, plate, 2, …). */
export function talkFrame(ms, reduced = false) {
  if (reduced) return 0;
  return [0, 1, 0, 2][Math.floor(Math.max(0, ms) / TALK_MS) % 4];
}
