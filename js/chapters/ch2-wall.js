// Scenario 2's wall display: the whiteboard (brief 14 B). The art holds the diagram, and after the fix the wipe and the
// path too (R2_board_wiped). Before the fix the game writes the theories on the board in red marker: a ring round one
// box of the diagram, question marks beside it, the current theory's words in the one clean corner, and an arrow from
// the words to its ring. A tap steps to the next theory; the rings stay, and after six taps the board is circled all
// over. After the fix the new theory is written in the wiped band, above and below the path. In the room the path
// draws itself across the small board once fixed. Shape: see js/chapters/ch1-wall.js.

import { splitStat } from '../engine/vitals.js';
import { drawText } from '../intro/font5x7.js';

const INK = '#E2FE52';                        // the room's path
export const MARKER = '#C81E1E';              // the red marker, close up
const DRAW_MS = 1200;                         // the path draws itself in over this long; then the display has recovered
const ARROW_GAP = 2, HEAD = 5;

/** The six theories' rings on the diagram (centre and radii) and where each one's `???` goes (top-left). Theory 4 is a
 * second ring round theory 1's box: it is DNS again. */
export const THEORIES = [
  { ring: { cx: 90, cy: 35, rx: 11, ry: 8 }, marks: { x: 104, y: 27 } },
  { ring: { cx: 223, cy: 76, rx: 10, ry: 11 }, marks: { x: 235, y: 60 } },
  { ring: { cx: 48, cy: 79, rx: 11, ry: 9 }, marks: { x: 58, y: 64 } },
  { ring: { cx: 90, cy: 36, rx: 14, ry: 10 }, marks: { x: 58, y: 27 } },
  { ring: { cx: 229, cy: 144, rx: 9, ry: 9 }, marks: { x: 240, y: 130 } },
  { ring: { cx: 107, cy: 81, rx: 11, ry: 11 }, marks: { x: 119, y: 66 } },
];

const fixed = (s) => s.state === 'fixed';
/** Which theory is current (0-based): a tap steps to the next, round the six. */
export const current = (s) => s.nudges.length % THEORIES.length;
/** How many rings show: 1 to the current one; once all six have been seen, all six stay. */
export const ringsShown = (s) => (s.nudges.length >= THEORIES.length - 1 ? THEORIES.length : current(s) + 1);

/** The theory's words: the part before " / " and the rest. */
function theory(s) {
  const pool = fixed(s) ? s.text.okPool : s.text.pool;
  return splitStat(pool[s.nudges.length % pool.length]);
}

/** The points of the path drawn so far: all of them at once under reduced motion, else a growing share. */
function pathSoFar(s) {
  const pts = s.cfg.path;
  if (s.reduced) return pts;
  const k = Math.min(1, s.t / DRAW_MS), total = pts.length - 1;
  const n = Math.floor(k * total), out = pts.slice(0, n + 1);
  if (n < total) {
    const f = k * total - n, [ax, ay] = pts[n], [bx, by] = pts[n + 1];
    out.push([Math.round(ax + (bx - ax) * f), Math.round(ay + (by - ay) * f)]);
  }
  return out;
}

function line(g, [x0, y0], [x1, y1]) {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), n = Math.max(dx, dy, 1);
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}
/** A 1-px ellipse, pixel by pixel. */
function ring(g, { cx, cy, rx, ry }) {
  const n = Math.ceil(2 * Math.PI * Math.max(rx, ry) * 1.5), seen = new Set();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry), k = x * 1000 + y;
    if (!seen.has(k)) { seen.add(k); g.fillRect(x, y, 1, 1); }
  }
}

/**
 * The arrow from the words to the current ring: it starts at `close.arrowFrom`, ends ARROW_GAP px short of the ring's
 * nearest edge, and has a HEAD-px two-stroke head at the ring. Returns { from, to, edge, head: [[x, y], [x, y]] }.
 */
export function arrow(s) {
  const [fx, fy] = s.cfg.close.arrowFrom, { cx, cy, rx, ry } = THEORIES[current(s)].ring;
  const dx = fx - cx, dy = fy - cy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const k = 1 / Math.sqrt((ux / rx) ** 2 + (uy / ry) ** 2);                    // the ellipse's edge along the line to the words
  const edge = [cx + ux * k, cy + uy * k];
  const to = [edge[0] + ux * ARROW_GAP, edge[1] + uy * ARROW_GAP];
  const head = [Math.PI / 6, -Math.PI / 6].map((a) => {
    const c = Math.cos(a), sn = Math.sin(a), hx = ux * c - uy * sn, hy = ux * sn + uy * c;     // back toward the words, turned ±30°
    return [to[0] + hx * HEAD, to[1] + hy * HEAD];
  });
  const r = (v) => Math.round(v);
  return { from: [fx, fy], to: [r(to[0]), r(to[1])], edge: [r(edge[0]), r(edge[1])], head: head.map(([x, y]) => [r(x), r(y)]) };
}

/** Everything the marker drew: the rings and question marks showing, and the arrow (broken only). */
export function boardMarks(s) {
  if (fixed(s)) return { rings: [], arrow: null };
  return { rings: THEORIES.slice(0, ringsShown(s)), arrow: arrow(s) };
}

export const WALL = {
  image: (s) => (fixed(s) ? s.cfg.fixedImage : s.cfg.image),
  frameKey: (s) => `${s.state}:${s.nudges.length}:${fixed(s) && !s.reduced ? Math.min(DRAW_MS, Math.floor(s.t / 100) * 100) : 0}`,
  recovered: (s) => s.reduced || s.t >= DRAW_MS,
  hits: (s) => [{ area: s.cfg.close.board, box: 0 }],
  /** The room: once fixed, the path across the board, 1 px, under the persona's frame. */
  room(g, s) {
    if (!fixed(s)) return;
    g.fillStyle = INK;
    const pts = pathSoFar(s);
    for (let i = 1; i < pts.length; i++) line(g, pts[i - 1], pts[i]);
  },
  /** Close up, before the fix: the rings, their question marks and the arrow in red marker. Fixed: the plate does it all. */
  close(g, s) {
    const m = boardMarks(s);
    g.fillStyle = MARKER;
    for (const t of m.rings) { ring(g, t.ring); drawText(g, '???', t.marks.x, t.marks.y, 1, MARKER); g.fillStyle = MARKER; }
    if (m.arrow) { line(g, m.arrow.from, m.arrow.to); for (const h of m.arrow.head) line(g, m.arrow.to, h); }
  },
  /** The words: the current theory in the clean corner (wrapping inside it); fixed, the new theory in the wiped band. */
  text(s) {
    const [first, rest] = theory(s);
    if (fixed(s)) return s.cfg.close.band.map((area, i) => ({ id: `band${i + 1}`, area, lines: [i ? rest : first], cls: 'band' }));
    return [{ id: 'theory', area: s.cfg.close.theory, lines: [first, rest], cls: 'theory', wrap: true }];
  },
  tone: () => '',
};
