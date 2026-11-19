// The title screen's clock (Warp brief 16): which stars twinkle when, how the wordmark's glow breathes, and what the
// Start tap does over its 600 ms. Pure functions of time, so a test can ask what is on at any moment.

export const STAR_ON_MS = 400;                 // a star is on about this long
export const STAR_OFF_MS = [3000, 6000];       // then off for three to six seconds, its own rhythm from its index
export const STARS_MAX_ON = 3;                 // never more than three at once
export const GLOW_STEP_MS = 500;
export const GLOW = [1.0, 0.9, 0.8, 0.7, 0.8, 0.9];
export const START_BEEP2_MS = 300, START_GO_MS = 600;
export const STAR_COUNT = 12;

function hash(n) {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
}
/** Star i's rhythm: how long one on-and-off cycle is, and where in it the star is at t = 0. */
export function starRhythm(i) {
  const h = hash(i * 7919 + 13);
  const period = STAR_ON_MS + STAR_OFF_MS[0] + (h % (STAR_OFF_MS[1] - STAR_OFF_MS[0] + 1));
  return { period, phase: (h >>> 8) % period };
}
/**
 * The indexes of the stars on at `t` ms, at most STARS_MAX_ON of them (when more would be on, the ones that came on
 * first stay and the newcomers wait for their next cycle).
 */
export function starsOn(t, count = STAR_COUNT) {
  const on = [];
  for (let i = 0; i < count; i++) {
    const { period, phase } = starRhythm(i), k = (((t + phase) % period) + period) % period;
    if (k < STAR_ON_MS) on.push({ i, k });
  }
  on.sort((a, b) => b.k - a.k || a.i - b.i);
  return on.slice(0, STARS_MAX_ON).map((s) => s.i).sort((a, b) => a - b);
}
/** The glow's opacity at `t`: 1.0, 0.9, 0.8, 0.7, 0.8, 0.9 and round again, one step every 500 ms; steady at 1 under reduced motion. */
export function glowAt(t, reduced = false) {
  if (reduced) return 1.0;
  return GLOW[Math.floor(Math.max(0, t) / GLOW_STEP_MS) % GLOW.length];
}
/** What the Start tap has done `t` ms after it: the pager lit from 0, one beep by 0, two by 300, the creator at 600. */
export function startBeat(t) {
  return { lit: t >= 0, beeps: t < 0 ? 0 : t < START_BEEP2_MS ? 1 : 2, go: t >= START_GO_MS };
}
