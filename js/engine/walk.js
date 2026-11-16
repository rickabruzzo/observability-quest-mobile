// Walk planning and stepping across a room's floor. Pure functions; the screen owns time.
//
// The painted hero (brief 15) has three walks: side on (the four frames of WALKS.side, mirrored to head left), toward us
// and away from us (never mirrored: the _l and _r frames are the other foot). A leg of the path that goes further across
// than up or down the screen is a side walk; otherwise it is `toward` when y grows and `away` when it shrinks. The frame
// comes from the ground he has covered in his own pixels, not from the clock: one frame every ADVANCE of them, so at any
// speed the same stretch of ground gets the same frame and the feet never slide. With depth (brief 11) a walk is a path
// of points across the floor polygon; his speed in scene pixels follows his scale on each leg (WALK_SPEED is his speed
// at scale 1). On arrival he holds the stance he arrived in (side, or his back) for SETTLE_MS, then faces the player.

import { heroScaleAt, planPath } from './room.js';

export const WALK_SPEED = 120; // his own px per second at scale 1
export const SETTLE_MS = 220;  // on arrival, the stance is held this long before the hero turns to face the player
/** The walks, as assets/hero/hero.json has them (tests/walk.test.js holds the two together): each frame's body and bob. */
export const WALKS = {
  side: { frames: [{ body: 'walk_contact', dy: 1 }, { body: 'walk_down', dy: 2 }, { body: 'walk_pass', dy: 0 }, { body: 'walk_up', dy: -1 }], advance: 13.5 },
  toward: { frames: [{ body: 'toward_l', dy: 1 }, { body: 'front', dy: 0 }, { body: 'toward_r', dy: 1 }, { body: 'front', dy: 0 }] },
  away: { frames: [{ body: 'away_l', dy: 1 }, { body: 'back', dy: 0 }, { body: 'away_r', dy: 1 }, { body: 'back', dy: 0 }] },
};
export const ADVANCE = WALKS.side.advance;   // his own px per frame, in all three walks
const VIEW = { side: 'side', toward: 'front', away: 'back' };
const HELD = { side: { pose: 'stand', view: 'side' }, away: { pose: 'back', view: 'back' }, toward: { pose: 'idle', view: 'front' } };

/** Which walk a leg from p to q is. */
export function walkKind(p, q) {
  const dx = q.x - p.x, dy = q.y - p.y;
  if (Math.abs(dx) > Math.abs(dy)) return 'side';
  return dy >= 0 ? 'toward' : 'away';
}
/** The frame after `groundPx` of his own pixels: { body, dy }. */
export function walkFrame(kind, groundPx) {
  const f = WALKS[kind].frames;
  return f[Math.floor(Math.max(0, groundPx) / ADVANCE) % f.length];
}

const FLAT = { floor: [[-1e6, -1e6], [1e6, -1e6], [1e6, 1e6], [-1e6, 1e6]], anchors: [] };   // no room: a flat floor at scale 1

/**
 * A walk from `from` to `to` across `room`'s floor. Points are { x, y } (the feet's centre); numbers are the old
 * one-dimensional form (x only, a flat floor at scale 1), kept for the preview room.
 * @returns {{ points, legs: [{ from, to, len, kind, scale, speed, start, duration, ground }], duration, dir, fromX, toX }}
 */
export function planWalk(from, to, roomOrOpts = {}) {
  const legacy = typeof from === 'number';
  const room = legacy || !roomOrOpts.floor ? FLAT : roomOrOpts;
  const speed1 = legacy && roomOrOpts.speed ? roomOrOpts.speed : WALK_SPEED;
  const a = legacy ? { x: from, y: 0 } : from, b = legacy ? { x: to, y: 0 } : to;
  const points = room === FLAT ? [a, b] : planPath(room, a, b);
  const legs = [];
  let t = 0, ground = 0;
  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], q = points[i], len = Math.hypot(q.x - p.x, q.y - p.y);
    if (!len) continue;
    const scale = room === FLAT ? 1 : Math.max(0.05, heroScaleAt(room, (p.y + q.y) / 2));
    const speed = speed1 * scale, duration = (len / speed) * 1000;
    legs.push({ from: p, to: q, len, kind: walkKind(p, q), scale, speed, start: t, duration, ground });   // ground: his own px covered before this leg
    t += duration; ground += len / scale;
  }
  const last = points[points.length - 1];
  return { points, legs, duration: Math.round(t), dir: last.x < points[0].x ? -1 : 1, fromX: points[0].x, toX: last.x, toY: last.y };
}

/**
 * Position, scale, frame and which view to draw at `elapsedMs` into the plan.
 * @returns {{ x, y, scale, pose, dy, view: 'side'|'front'|'back', done, flip }} pose is a body of the sheet, or idle / stand / back
 */
export function stepWalk(plan, elapsedMs) {
  const end = plan.points[plan.points.length - 1], last = plan.legs.at(-1);
  const scaleAt = (leg) => leg?.scale ?? 1;
  const legFlip = (leg) => !!leg && (leg.to.x < leg.from.x || (leg.to.x === leg.from.x && plan.dir < 0));
  if (plan.duration === 0 || elapsedMs >= plan.duration + SETTLE_MS) {
    return { x: end.x, y: end.y, scale: scaleAt(last), pose: 'idle', dy: 0, view: 'front', done: true, flip: plan.dir < 0 };
  }
  if (elapsedMs >= plan.duration) {
    const held = HELD[last?.kind ?? 'side'];
    return { x: end.x, y: end.y, scale: scaleAt(last), pose: held.pose, dy: 0, view: held.view, done: false, flip: held.view === 'side' && legFlip(last) };
  }
  const t = Math.max(0, elapsedMs);
  let leg = plan.legs[0];
  for (const l of plan.legs) if (t >= l.start) leg = l;
  const k = Math.min(1, (t - leg.start) / leg.duration);
  const x = Math.round(leg.from.x + (leg.to.x - leg.from.x) * k), y = Math.round(leg.from.y + (leg.to.y - leg.from.y) * k);
  const ground = leg.ground + (leg.len * k) / leg.scale;                                  // his own px walked so far
  const f = walkFrame(leg.kind, ground);
  return { x, y, scale: leg.scale, pose: f.body, dy: f.dy, view: VIEW[leg.kind], done: false, flip: leg.kind === 'side' && legFlip(leg) };
}
