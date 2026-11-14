// Scenario 2's wall display: the whiteboard. The art holds the drawing, and after the fix the drawing too
// (R2_wall_closeup_fixed has the path painted in). The game writes one theory at a time on the blank sheet taped
// to the board, in marker ink, and in the room draws the path under the persona's frame once the fix lands. A
// whiteboard learns nothing until somebody draws on it: nothing moves while it is broken.
// Shape: see js/chapters/ch1-wall.js.

import { splitStat } from '../engine/vitals.js';

const INK = '#E2FE52';
const DRAW_MS = 1200;                         // the path draws itself in over this long; then the display has recovered

/** The theory on the sheet: a tap steps to the next; the fix swaps the pool. */
function theory(s) {
  const pool = s.state === 'fixed' ? s.text.okPool : s.text.pool;
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

export const WALL = {
  image: (s) => (s.state === 'fixed' ? s.cfg.fixedImage : s.cfg.image),
  frameKey: (s) => `${s.state}:${s.nudges.length}:${s.state === 'fixed' && !s.reduced ? Math.min(DRAW_MS, Math.floor(s.t / 100) * 100) : 0}`,
  recovered: (s) => s.reduced || s.t >= DRAW_MS,
  hits: (s) => [{ area: s.cfg.close.sheet, box: 0 }],
  /** The room: once fixed, the path across the board, 1 px, under the persona's frame. */
  room(g, s) {
    if (s.state !== 'fixed') return;
    g.fillStyle = INK;
    const pts = pathSoFar(s);
    for (let i = 1; i < pts.length; i++) line(g, pts[i - 1], pts[i]);
  },
  /** Close up the art does it all; the theory is text (see text). */
  close() {},
  text(s) {
    return [{ id: 'sheet', area: s.cfg.close.sheet, lines: theory(s), cls: 'sheet' }];
  },
  tone: () => '',
};
