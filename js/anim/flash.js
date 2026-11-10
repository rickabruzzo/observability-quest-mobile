// Light flashes travelling along extracted strand paths (320x214 logical cells).
import { hash01 } from './timeline.js';

/**
 * positions(frame, paths, speed, count) → [{ path, index }] for `count` concurrent flashes.
 * Each flash k walks its current path at `speed` cells per frame, then hops to another path.
 */
export function positions(frame, paths, speed = 2, count = 3) {
  const out = [];
  if (!paths?.length) return out;
  for (let k = 0; k < count; k++) {
    // flash k starts staggered; progress in cells
    const prog = Math.floor(frame * speed) + Math.floor(k * 17);
    // walk through paths in a hashed order so flashes don't share a strand
    let remaining = prog, hop = 0, p = (k * 7) % paths.length;
    for (;;) {
      const len = paths[p].length;
      if (remaining < len) break;
      remaining -= len; hop++;
      p = Math.floor(hash01(k, hop) * paths.length);
    }
    out.push({ path: p, index: remaining });
  }
  return out;
}

/** Draw a flash: bright head + fading tail of `tail` cells, on the 2px grid. */
export function drawFlash(ctx, path, index, { head = '#DFF3FF', mid = '#8CCBFF', tail = 3 } = {}) {
  for (let i = 0; i <= tail; i++) {
    const j = index - i;
    if (j < 0) break;
    const [cx, cy] = path[j];
    ctx.globalAlpha = i === 0 ? 1 : Math.max(0.15, 0.7 - i * 0.2);
    ctx.fillStyle = i === 0 ? head : mid;
    ctx.fillRect(cx * 2, cy * 2, 2, 2);
  }
  ctx.globalAlpha = 1;
}
