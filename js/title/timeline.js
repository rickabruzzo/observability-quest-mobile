// The title screen's clock (Warp brief 16): which stars twinkle when, how the wordmark's glow breathes, where a glint
// sparkles on the letters, and what the Start tap does over its 600 ms. Pure functions of time, so a test can ask what is on at any moment.

export const STAR_ON_MS = 400;                 // a star is on about this long
export const STAR_OFF_MS = [3000, 6000];       // then off for three to six seconds, its own rhythm from its index
export const STARS_MAX_ON = 3;                 // never more than three at once
export const GLOW_STEP_MS = 500;
export const GLOW = [1.0, 0.9, 0.8, 0.7, 0.8, 0.9];
export const START_BEEP2_MS = 300, START_GO_MS = 600;
export const STAR_COUNT = 12;
// The glints (review of brief 16): a sparkle on the letters, one at a time, running across the wordmark.
export const GLINT_FIRST_MS = 1500;            // the first pass starts this long after the title appears
export const GLINT_EVERY_MS = 450;             // a new glint, at the next place, this often
export const GLINT_FRAME_MS = 90, GLINT_FRAMES = 4;   // each shows its four frames and is gone
export const GLINT_PASS_MS = 8000;             // a pass starts every eight seconds
export const GLINT_POINTS = 9;

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
/**
 * The glint at `t`: { point, frame } (which of the manifest's places, which of its four frames), or null when none
 * shows: before the first pass, between glints, in the rest after the last place, and always under reduced motion.
 */
export function glintAt(t, reduced = false, points = GLINT_POINTS) {
  if (reduced || t < GLINT_FIRST_MS || points <= 0) return null;
  const u = (t - GLINT_FIRST_MS) % GLINT_PASS_MS, point = Math.floor(u / GLINT_EVERY_MS), frame = Math.floor((u - point * GLINT_EVERY_MS) / GLINT_FRAME_MS);
  return point < points && frame < GLINT_FRAMES ? { point, frame } : null;
}
/** What the Start tap has done `t` ms after it: the pager lit from 0, one beep by 0, two by 300, the creator at 600. */
export function startBeat(t) {
  return { lit: t >= 0, beeps: t < 0 ? 0 : t < START_BEEP2_MS ? 1 : 2, go: t >= START_GO_MS };
}
