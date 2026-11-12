// Walk planning and stepping along the floor line. Pure functions; the screen owns time.
//
// Walking is the profile view (js/engine/hero-side.js); standing still is the front view, so the hero
// faces the player when they stop. The frame comes from how far the hero has actually travelled, not
// from the clock: at any speed the same pixel of floor gets the same frame, so the feet never slide.

import { SIDE_POSES } from './hero-side.js';

export const WALK_SPEED = 110; // logical px per second — a Sierra stroll: a full 320 px room in about 3 s
export const STRIDE_PX = 38;   // floor covered by one full cycle — two steps, the eight frames of SIDE_LEG
const FRAMES = SIDE_POSES.slice(1);                   // w1..w8; SIDE_POSES[0] is 'stand'
const PER_FRAME_PX = STRIDE_PX / FRAMES.length;

/** @returns {{ fromX: number, toX: number, dir: 1|-1, duration: number }} duration in ms (0 when already there) */
export function planWalk(fromX, toX, { speed = WALK_SPEED } = {}) {
  const dist = Math.abs(toX - fromX);
  return { fromX, toX, dir: toX < fromX ? -1 : 1, duration: dist === 0 ? 0 : Math.round((dist / speed) * 1000) };
}

/**
 * Position, pose and which view to draw at `elapsedMs` into the plan.
 * @returns {{ x: number, pose: string, view: 'side'|'front', done: boolean, flip: boolean }}
 */
export function stepWalk(plan, elapsedMs) {
  const flip = plan.dir < 0;
  if (plan.duration === 0 || elapsedMs >= plan.duration) {
    return { x: plan.toX, pose: 'idle', view: 'front', done: true, flip };
  }
  const t = Math.max(0, elapsedMs) / plan.duration;
  const x = Math.round(plan.fromX + (plan.toX - plan.fromX) * t);
  const pose = FRAMES[Math.floor(Math.abs(x - plan.fromX) / PER_FRAME_PX) % FRAMES.length];
  return { x, pose, view: 'side', done: false, flip };
}
