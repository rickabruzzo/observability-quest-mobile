// Walk planning and stepping across a room's floor. Pure functions; the screen owns time.
//
// Walking is the profile view (js/engine/hero-side.js); standing still is the front view, so the hero
// faces the player when they stop. The frame comes from how far the hero has actually travelled, in his own
// pixels, not from the clock: at any speed the same stretch of ground gets the same frame, so the feet never
// slide. With depth (Warp brief 11) a walk is a path of points across the floor polygon; his speed in scene
// pixels follows his scale on each leg (WALK_SPEED is his speed at scale 1), so he covers his own stride per
// cycle whether he is near or far.

import { SIDE_POSES } from './hero-side.js';
import { heroScaleAt, planPath } from './room.js';

export const WALK_SPEED = 120; // his own px per second at scale 1 — about three steps a second with STRIDE_PX
export const STRIDE_PX = 76;   // ground covered by one full cycle at scale 1 — two steps, the eight frames of SIDE_LEG
export const SETTLE_MS = 220;  // on arrival, the side-on stance is held this long before the hero turns to face the player
const FRAMES = SIDE_POSES.slice(1);                   // w1..w8; SIDE_POSES[0] is 'stand'
const PER_FRAME_PX = STRIDE_PX / FRAMES.length;

const FLAT = { floor: [[-1e6, -1e6], [1e6, -1e6], [1e6, 1e6], [-1e6, 1e6]], anchors: [] };   // no room: a flat floor at scale 1

/**
 * A walk from `from` to `to` across `room`'s floor. Points are { x, y } (the feet's centre); numbers are the old
 * one-dimensional form (x only, a flat floor at scale 1), kept for the preview room.
 * @returns {{ points, legs: [{ from, to, len, ground, speed, start, duration }], duration, dir, fromX, toX }}
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
    legs.push({ from: p, to: q, len, scale, speed, start: t, duration, ground });        // ground: his own px covered before this leg
    t += duration; ground += len / scale;
  }
  const last = points[points.length - 1];
  return { points, legs, duration: Math.round(t), dir: last.x < points[0].x ? -1 : 1, fromX: points[0].x, toX: last.x, toY: last.y };
}

/**
 * Position, scale, pose and which view to draw at `elapsedMs` into the plan.
 * @returns {{ x, y, scale, pose, view: 'side'|'front', done, flip }}
 */
export function stepWalk(plan, elapsedMs) {
  const end = plan.points[plan.points.length - 1];
  const scaleAt = (leg) => leg?.scale ?? 1;
  if (plan.duration === 0 || elapsedMs >= plan.duration + SETTLE_MS) {
    return { x: end.x, y: end.y, scale: scaleAt(plan.legs.at(-1)), pose: 'idle', view: 'front', done: true, flip: plan.dir < 0 };
  }
  if (elapsedMs >= plan.duration) return { x: end.x, y: end.y, scale: scaleAt(plan.legs.at(-1)), pose: 'stand', view: 'side', done: false, flip: plan.dir < 0 };
  const t = Math.max(0, elapsedMs);
  let leg = plan.legs[0];
  for (const l of plan.legs) if (t >= l.start) leg = l;
  const k = Math.min(1, (t - leg.start) / leg.duration);
  const x = Math.round(leg.from.x + (leg.to.x - leg.from.x) * k), y = Math.round(leg.from.y + (leg.to.y - leg.from.y) * k);
  const ground = leg.ground + (leg.len * k) / leg.scale;                                  // his own px walked so far
  const pose = FRAMES[Math.floor(ground / PER_FRAME_PX) % FRAMES.length];
  return { x, y, scale: leg.scale, pose, view: 'side', done: false, flip: leg.to.x < leg.from.x || (leg.to.x === leg.from.x && plan.dir < 0) };
}
