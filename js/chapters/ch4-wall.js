// Scenario 4's wall display: the wall of space. The fleet is a few hundred dots drifting toward the centre of the
// star map; about one in fourteen sits at the edge, jittering, never getting in — until the fix, when they jump
// in. Under it a flat green health line, both states (that is the joke), and a chat column where the pilots'
// lines scroll up: `lag` in nine languages, then, fixed, `o7`. In the room the chat is grey bars. Shape: see
// ch1-wall.js.

const DOTS = 320, STUCK_EVERY = 14, STEP_MS = 100, RECOVER_MS = 1500, CHAT_MS = 700, CHAT_LINES = 8;
const DOT = '#DCE8FF', STUCK = '#FF6A4A', GREEN = '#3CE070', BAR = '#4A5468';

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
const step = (s) => (s.reduced ? 0 : Math.floor(s.tAll / STEP_MS));
const fixed = (s) => s.state === 'fixed';

/** Every dot's place in a map area: [x, y, stuck]. Each drifts inward on its own phase and respawns at the edge. */
function fleet(s, a) {
  const cx = (a.x0 + a.x1) / 2, cy = (a.y0 + a.y1) / 2, rx = (a.x1 - a.x0) / 2, ry = (a.y1 - a.y0) / 2;
  const k = step(s), out = [];
  const jump = fixed(s) ? (s.reduced ? 1 : Math.min(1, s.t / RECOVER_MS)) : 0;          // how far the stuck ones have jumped in
  for (let i = 0; i < DOTS; i++) {
    const h = hash(i * 7 + 1), ang = ((h % 3600) / 3600) * Math.PI * 2, speed = 0.6 + ((h >>> 12) % 10) / 10;
    const stuck = i % STUCK_EVERY === 0;
    let r;
    if (stuck) {
      const jit = s.reduced ? 0 : ((hash(k * 13 + i) % 3) - 1);
      r = 1 - 0.02 * jit - 0.7 * jump * (0.4 + ((h >>> 20) % 6) / 10);
    } else r = 1 - (((k * speed) / 240 + ((h >>> 4) % 100) / 100) % 1);
    out.push([Math.round(cx + Math.cos(ang) * rx * r), Math.round(cy + Math.sin(ang) * ry * r), stuck && jump < 1]);
  }
  return out;
}
/** The chat lines showing now: the newest at the bottom, scrolling up one line every CHAT_MS. */
function chat(s, n) {
  const pool = fixed(s) ? s.text.okPool : s.text.pool, k = s.reduced ? pool.length : Math.floor(s.tAll / CHAT_MS) + s.nudges.length;
  const out = [];
  for (let j = n - 1; j >= 0; j--) out.push(pool[((k - j) % pool.length + pool.length) % pool.length]);
  return out;
}

export const WALL = {
  image: (s) => s.cfg.image,
  frameKey: (s) => `${s.state}:${step(s)}:${s.nudges.length}`,
  recovered: (s) => s.reduced || s.t >= RECOVER_MS,
  hits: (s) => [{ area: s.cfg.close.chat, box: 0 }],
  room(g, s) {
    const m = s.cfg.room;
    for (const [x, y, stuck] of fleet(s, m.map)) { g.fillStyle = stuck ? STUCK : DOT; g.fillRect(x, y, 1, 1); }
    g.fillStyle = GREEN; g.fillRect(m.lane.x0, Math.round((m.lane.y0 + m.lane.y1) / 2), m.lane.x1 - m.lane.x0 + 1, 1);
    const c = m.chat, rows = Math.floor((c.y1 - c.y0) / 6), k = step(s) >> 3;        // grey bars: the chat, too small to read
    g.fillStyle = BAR;
    for (let i = 0; i < rows; i++) g.fillRect(c.x0 + 2, c.y0 + 2 + i * 6, Math.round((c.x1 - c.x0 - 4) * (0.4 + ((hash(i + k) % 60) / 100))), 3);
  },
  close(g, s) {
    const m = s.cfg.close;
    for (const [x, y, stuck] of fleet(s, m.map)) { g.fillStyle = stuck ? STUCK : DOT; g.fillRect(x, y, stuck ? 2 : 1, stuck ? 2 : 1); }
    g.fillStyle = GREEN; const ly = Math.round((m.lane.y0 + m.lane.y1) / 2); g.fillRect(m.lane.x0, ly, m.lane.x1 - m.lane.x0 + 1, 2);
  },
  /** The chat column: the lines scrolling up. */
  text(s) {
    return [{ id: 'chat', area: s.cfg.close.chat, lines: chat(s, CHAT_LINES), cls: 'chat' }];
  },
  tone: (s) => (fixed(s) ? 'ok' : ''),
};
