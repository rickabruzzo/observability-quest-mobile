// The persona speaks from a close-up portrait (Warp brief 10), the pure part: which lines are theirs, what the
// window shows, how the portrait moves, where the window sits. The DOM is js/engine/window.js; the chapter's
// data names the persona (`persona: { name, portrait, where }` in js/chapters/chN.js) — nothing here does.

import { blinkOpen, mouthFrame } from '../anim/portrait.js';

/** The square of the 640×428 portrait the window shows: head and shoulders. */
export const PORTRAIT_CROP = { x: 170, y: 20, w: 300, h: 300 };
/** One animation frame of the portrait: rest → talk1 → talk2 → talk1 while typing, a blink every few seconds. */
export const FRAME_MS = 120;

/** The title the script writes before the persona's lines: their name without its article (THE CTO → CTO). */
export function speakerOf(name) {
  return String(name).replace(/^THE\s+/, '');
}

/**
 * A line whose text starts with the persona's title and a colon is theirs: it goes in the conversation window
 * with the prefix dropped (the name is on the window). Anything else — narration that quotes them, another
 * speaker — is an ordinary line, untouched.
 * @returns {{ spoken: boolean, text: string }}
 */
export function personaLine(text, title) {
  const s = String(text), prefix = `${title}:`;
  if (!s.startsWith(prefix)) return { spoken: false, text: s };
  return { spoken: true, text: s.slice(prefix.length).replace(/^\s+/, '') };
}

/** The portrait's frame at `elapsedMs`: mouth 0 (rest), 1 (talk1) or 2 (talk2); blink true when the eyes are shut. */
export function portraitFrame(elapsedMs, typing, reduced, seed = 1) {
  if (reduced) return { mouth: 0, blink: false };
  const frame = Math.floor(Math.max(0, elapsedMs) / FRAME_MS);
  return { mouth: mouthFrame(frame, typing), blink: !blinkOpen(frame, seed) };
}

/**
 * Where the conversation window goes so it hides the persona least: at the top, on the side away from them,
 * no wider than the room left of (or right of) their patch. `patch` is the persona's frame rectangle in scene px
 * (from chN.json), `scale` CSS px per scene px, `margin` the window's inset from the scene's edge in CSS px.
 * @returns {{ className: string, maxWidth: number }}
 */
export function talkWindow(where, patch, scale, margin = 10) {
  const sceneW = 320;
  let free = sceneW;
  if (patch) free = where === 'top-right' ? sceneW - (patch.x + patch.w) : patch.x;
  return { className: where === 'top-right' ? 'top-right' : 'top-left', maxWidth: Math.floor(free * scale) - 2 * margin };
}
