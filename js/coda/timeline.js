// The sunrise coda's rules (Warp brief 17): what each beat shows at a given time. Pure functions of the manifest
// (assets/coda/coda.json) and time; js/screens/coda.js plays them. Nothing is tweened: cuts, whole pixels, the rooms'
// own walks at the bedroom's pace.

import { walkFrame, SETTLE_MS } from '../engine/walk.js';
import { SCRIPT } from '../script.js';

export const BEAT0_MS = 600;                 // the dark street, the door shut, nobody there
export const DOOR_OPEN_MS = 350;             // the door opens
export const DOORWAY_MS = 300;               // he stands in the doorway, facing us
export const DOOR_CLEAR_PX = 20;             // the door shuts when his feet are this far past its right edge
export const AMBLE = 100, AMBLE_DOWN = 66;   // px/s: the bedroom's pace, across and down
export const SUN_MS = 4000;                  // the sun's rise
export const SHADES_MS = 400;                // after he turns to face us, the sunglasses go on
export const CODA_LINES = ['coda.1', 'coda.2', 'coda.3'];

/** The walk out, planned from the manifest: the legs' lengths in ms and where the door shuts. */
export function codaPlan(m) {
  const downPx = Math.max(0, m.floorY - m.doorway.y), acrossPx = Math.max(0, m.stand.x - m.doorway.x);
  const down = Math.round((downPx / AMBLE_DOWN) * 1000), across = Math.round((acrossPx / AMBLE) * 1000);
  const clearX = m.door.x + m.door.w + DOOR_CLEAR_PX;
  return {
    floorY: m.floorY, heroScale: m.heroScale, doorway: { ...m.doorway }, standX: m.stand.x, clearX,
    open: DOOR_OPEN_MS, hold: DOORWAY_MS, down, across, downPx, acrossPx,
    walkEnd: DOOR_OPEN_MS + DOORWAY_MS + down + across,
    total: DOOR_OPEN_MS + DOORWAY_MS + down + across + SETTLE_MS,
  };
}

/**
 * Beat 1 at `t` ms: the door opens, he stands in the doorway, walks down to the pavement line and right to stand.x
 * (toward frames down, side frames across, never mirrored: he only walks down and right), the door shuts once he is
 * clear, and he holds his side-on stance. `done` once he has stopped and settled. Reduced motion: the end at once.
 * @returns {{ doorOpen, hero: { visible, x, y, pose, dy, view, flip } | null, done }}
 */
export function beat1At(plan, t, reduced = false) {
  const stand = { visible: true, x: plan.standX, y: plan.floorY, pose: 'stand', dy: 0, view: 'side', flip: false };
  if (reduced) return { doorOpen: true, hero: stand, done: true };
  const s = plan.heroScale;
  if (t < plan.open) return { doorOpen: true, hero: null, done: false };
  let u = t - plan.open;
  if (u < plan.hold) return { doorOpen: true, hero: { visible: true, x: plan.doorway.x, y: plan.doorway.y, pose: 'idle', dy: 0, view: 'front', flip: false }, done: false };
  u -= plan.hold;
  if (u < plan.down) {
    const y = Math.round(plan.doorway.y + plan.downPx * (u / plan.down)), f = walkFrame('toward', (y - plan.doorway.y) / s);
    return { doorOpen: true, hero: { visible: true, x: plan.doorway.x, y, pose: f.body, dy: f.dy, view: 'front', flip: false }, done: false };
  }
  u -= plan.down;
  if (u < plan.across) {
    const x = Math.round(plan.doorway.x + plan.acrossPx * (u / plan.across)), f = walkFrame('side', (plan.downPx + (x - plan.doorway.x)) / s);
    return { doorOpen: x < plan.clearX, hero: { visible: true, x, y: plan.floorY, pose: f.body, dy: f.dy, view: 'side', flip: false }, done: false };
  }
  u -= plan.across;
  return { doorOpen: plan.standX < plan.clearX, hero: stand, done: u >= SETTLE_MS };
}

/** Beat 2 at `t` ms: the sun's top edge (whole pixels, y0 down to y1, never back) and which frame of the street shows. */
export function sunAt(m, t, reduced = false) {
  const k = reduced ? 1 : Math.max(0, Math.min(1, t / SUN_MS));
  const y = Math.round(m.sun.y0 + (m.sun.y1 - m.sun.y0) * k);
  const frame = k >= 1 ? 3 : k >= 2 / 3 ? 2 : k >= 1 / 3 ? 1 : 0;
  return { y, frame, done: k >= 1 };
}

/** Beat 3 at `t` ms: he faces us; the sunglasses are on SHADES_MS later. */
export function beat3At(t) {
  return { view: 'front', pose: 'idle', shades: t >= SHADES_MS, done: t >= SHADES_MS };
}

// A narration window's own measurements, in CSS px (css .msg and js/engine/window.js): its top edge, its border and
// padding together, and one line of 24 px type.
const WINDOW_TOP = 6, WINDOW_CHROME = 22, WINDOW_LINE = 27;
/**
 * How many lines a narration window may show and still end above the manifest's `windowBottom` (a row of the 320×200
 * picture) when a game pixel is `scale` CSS px. Never fewer than two. Each of the coda's lines wraps to three at the
 * reading measure, so three here means one window a line and no page turn in the middle of a sentence.
 */
export function narrationLines(windowBottom, scale) {
  return Math.max(2, Math.floor((windowBottom * scale - WINDOW_TOP - WINDOW_CHROME) / WINDOW_LINE));
}

/** One of the coda's lines with the hero's name in it; a line that begins with the name begins with a capital. */
export function codaLine(key, name) {
  const text = String(SCRIPT[key] ?? key).replaceAll('{name}', name);
  return text.charAt(0).toUpperCase() + text.slice(1);
}
