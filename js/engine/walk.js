// Walk planning and stepping along the floor line. Pure functions; the screen owns time.

export const WALK_FPS = 10;
export const WALK_SPEED = 60; // logical px per second
const FRAMES = ['walk1', 'walk2', 'walk3', 'walk4'];

/** @returns {{ fromX: number, toX: number, dir: 1|-1, duration: number }} duration in ms (0 when already there) */
export function planWalk(fromX, toX, { speed = WALK_SPEED } = {}) {
  const dist = Math.abs(toX - fromX);
  return { fromX, toX, dir: toX < fromX ? -1 : 1, duration: dist === 0 ? 0 : Math.round((dist / speed) * 1000) };
}

/** Position and pose at `elapsedMs` into the plan. */
export function stepWalk(plan, elapsedMs) {
  const flip = plan.dir < 0;
  if (plan.duration === 0 || elapsedMs >= plan.duration) return { x: plan.toX, pose: 'idle', done: true, flip };
  const t = Math.max(0, elapsedMs) / plan.duration;
  const x = Math.round(plan.fromX + (plan.toX - plan.fromX) * t);
  const pose = FRAMES[Math.floor(Math.max(0, elapsedMs) / (1000 / WALK_FPS)) % FRAMES.length];
  return { x, pose, done: false, flip };
}
