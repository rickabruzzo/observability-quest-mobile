// Portrait animation: occasional blink, mouth flap while the narrator text types.
import { sprite } from './sprites.js';

// Deterministic pseudo-random blink: closed for one frame (sometimes two) every ~30–50 frames.
// Hashes the blink-cycle index with the seed so each portrait blinks on its own schedule.
export function blinkOpen(frame, seed = 1) {
  const CYCLE = 40;
  const cycle = Math.floor(frame / CYCLE);
  // small integer hash
  let h = (cycle * 374761393 + seed * 668265263) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  const offset = 10 + (h % (CYCLE - 14));        // where in the cycle the blink lands
  const twoFrames = (h >>> 8) % 4 === 0;          // one in four blinks holds for two frames
  const pos = frame - cycle * CYCLE;
  return !(pos === offset || (twoFrames && pos === offset + 1));
}

// 0 = still, 1 = slightly open, 2 = wide. Cycles 0,1,2,1 at the animation frame rate while typing.
export function mouthFrame(frame, typing) {
  if (!typing) return 0;
  return [0, 1, 2, 1][frame % 4];
}

/** Scene module for a narrator portrait. `name` is the still asset name (e.g. 'portrait_christine'). */
export function portraitScene(name, { seed = 1 } = {}) {
  const base = name; // still
  const frames = [`${name}_blink`, `${name}_talk1`, `${name}_talk2`];
  return {
    name,
    still: base,
    assets: frames,
    optional: true, // missing frames (e.g. Jessitron FPO) just mean a static portrait
    draw(ctx, frame, state) {
      const m = mouthFrame(frame, !!state?.typing);
      if (m > 0) {
        const t = sprite(m === 1 ? frames[1] : frames[2]) || sprite(frames[2]) || sprite(frames[1]);
        if (t) ctx.drawImage(t.img, t.x, t.y, t.w, t.h);
      }
      if (!blinkOpen(frame, seed)) {
        const b = sprite(frames[0]);
        if (b) ctx.drawImage(b.img, b.x, b.y, b.w, b.h);
      }
    },
  };
}
