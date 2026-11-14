// Scenario 5's wall display: the atrium monitor. A calm sign-ups chart with a small wobble (both states), the
// support inbox (newest on top; red bars stacking up in the room, green and few once fixed), three readouts —
// the error rate and when the release shipped never change, because they noticed nothing; the unread count does
// — and a chat panel of grey bars. The only things that change when the fix lands are the inbox and its count.
// Shape: see ch1-wall.js.

const STEP_MS = 100, RECOVER_MS = 1200, INBOX_MS = 1800, INBOX_LINES = 6;
const LINE = '#8FD3FF', GRID = '#223048', RED = '#E04040', GREEN = '#3CE070', BAR = '#4A5468';

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const step = (s) => (s.reduced ? 0 : Math.floor(s.tAll / STEP_MS));
const fixed = (s) => s.state === 'fixed';

/** The sign-ups line: calm, a small wobble, scrolling slowly. 0 is the top of the lane. */
function signups(s, n) {
  const k = step(s) >> 1, out = [];
  for (let i = 0; i < n; i++) out.push(0.55 - 0.1 * Math.sin((i + k) / 9) + ((hash(i + k) % 5) - 2) * 0.012);
  return out;
}
function drawLine(g, a, samples, colour, thick) {
  const h = a.y1 - a.y0, stepX = (a.x1 - a.x0 + 1) / samples.length;
  g.fillStyle = colour;
  samples.forEach((v, i) => {
    const y = Math.round(a.y0 + v * h), prev = i ? Math.round(a.y0 + samples[i - 1] * h) : y;
    g.fillRect(Math.round(a.x0 + i * stepX), Math.min(y, prev), Math.max(1, Math.round(stepX)), Math.max(thick, Math.abs(y - prev) + 1));
  });
}
/** The inbox: the newest `n` lines on top, a new one every INBOX_MS while broken; fixed: the thanks, and few. */
function inbox(s, n) {
  const pool = fixed(s) ? s.text.okPool : s.text.pool;
  const k = s.reduced ? pool.length : Math.floor(s.tAll / INBOX_MS) + s.nudges.length;
  const count = fixed(s) ? Math.min(n, pool.length) : n;
  const out = [];
  for (let j = 0; j < count; j++) out.push(pool[((k - j) % pool.length + pool.length) % pool.length]);
  return out;
}

export const WALL = {
  image: (s) => s.cfg.image,
  frameKey: (s) => `${s.state}:${step(s) >> 1}:${s.nudges.length}`,
  recovered: (s) => s.reduced || s.t >= RECOVER_MS,
  hits: (s) => [{ area: s.cfg.close.inbox, box: 0 }],
  room(g, s) {
    const m = s.cfg.room;
    drawLine(g, m.chart, signups(s, m.chart.x1 - m.chart.x0 + 1), LINE, 1);
    const ib = m.inbox, rows = fixed(s) ? 2 : Math.min(Math.floor((ib.y1 - ib.y0) / 4), 4 + (step(s) >> 4));   // bars stacking up
    for (let i = 0; i < rows; i++) { g.fillStyle = fixed(s) ? GREEN : RED; g.fillRect(ib.x0 + 2, ib.y1 - 2 - i * 4, Math.round((ib.x1 - ib.x0 - 4) * (0.5 + ((hash(i * 3 + 5) % 50) / 100))), 2); }
    m.lights.forEach((a, i) => { g.fillStyle = i < 2 || fixed(s) ? GREEN : RED; g.fillRect(a.x0 + 1, a.y0 + 1, a.x1 - a.x0 - 1, a.y1 - a.y0 - 1); });
    const c = m.chat, n = Math.floor((c.y1 - c.y0) / 5);
    g.fillStyle = BAR;
    for (let i = 0; i < n; i++) g.fillRect(c.x0 + 2, c.y0 + 2 + i * 5, Math.round((c.x1 - c.x0 - 4) * (0.4 + ((hash(i * 11) % 60) / 100))), 2);
  },
  close(g, s) {
    const m = s.cfg.close;
    g.fillStyle = GRID;
    for (let x = m.chart.x0; x <= m.chart.x1; x += 12) g.fillRect(x, m.chart.y0, 1, m.chart.y1 - m.chart.y0 + 1);
    drawLine(g, m.chart, signups(s, Math.floor((m.chart.x1 - m.chart.x0 + 1) / 2)), LINE, 2);
    const c = m.chat, n = Math.floor((c.y1 - c.y0) / 7);
    g.fillStyle = BAR;
    for (let i = 0; i < n; i++) g.fillRect(c.x0 + 3, c.y0 + 3 + i * 7, Math.round((c.x1 - c.x0 - 6) * (0.4 + ((hash(i * 11) % 60) / 100))), 3);
  },
  /** The three readouts and the inbox's lines. */
  text(s) {
    const m = s.cfg.close;
    return [
      { id: 'box0', area: m.boxes[0], lines: [s.text.box1], cls: 'readout' },
      { id: 'box1', area: m.boxes[1], lines: [s.text.box2], cls: 'readout' },
      { id: 'box2', area: m.boxes[2], lines: [fixed(s) ? s.text.box3Ok : s.text.box3], cls: `readout ${fixed(s) ? 'good' : 'bad'}` },
      { id: 'inbox', area: m.inbox, lines: inbox(s, INBOX_LINES), cls: 'inbox' },
    ];
  },
  tone: (s) => (fixed(s) ? 'ok' : ''),
};
