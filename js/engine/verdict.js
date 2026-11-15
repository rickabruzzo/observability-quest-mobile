// Charity's verdict, the pure part (spec: No score): her mood by whether any solved scenario had missteps,
// and one closing line by how many are solved. Returns script keys; the screen shows them.

import { SCENARIOS } from '../menu.js';

/** @param {Record<number, number>} done scenario → missteps, as js/menu.js keeps it */
export function charityVerdict(done) {
  const solved = Object.values(done);
  const n = solved.length;
  const mood = solved.every((m) => m === 0) ? 'final.clean' : 'final.grief';
  const count = n <= 1 ? 'final.count.one' : n >= SCENARIOS.length ? 'final.count.all' : 'final.count.some';
  return { header: 'final.header', mood, count, n };
}

/** Fills `{n}` in a script line. */
export function fillN(text, n) {
  return String(text).replaceAll('{n}', String(n));
}

// ---- the verdict laid out for a phone on its side (Warp brief 12) ----

/** How much of the scene's width the narrator's portrait takes. */
export const PORTRAIT_SHARE = 0.45;
const PORTRAIT_H = 172;                      // the portrait's height on the 200-px scene: its bottom is the scene's bottom edge
const SCENE_W = 320, SCENE_H = 200;

/** `CHRISTINE YEN: the words` → the name (shouted, two words or one) and the words; anything else is left alone. */
export function narratorLine(text) {
  const m = String(text).match(/^([A-Z][A-Z' .-]*[A-Z]):\s*(.*)$/s);
  return m ? { name: m[1], text: m[2] } : { name: null, text: String(text) };
}

/**
 * Where a w×h portrait goes and what part of it shows: on the left, PORTRAIT_SHARE of the scene wide, its bottom on
 * the scene's bottom edge, the whole height (the art already crops at the shoulders), cropped sideways round the
 * figure's centre column `cx`, never past the picture's edges. `textX` is where the words may start.
 */
export function portraitLayout(w, h, cx) {
  const dw = Math.round(SCENE_W * PORTRAIT_SHARE), dh = PORTRAIT_H, dy = SCENE_H - dh, dx = 0;
  const scale = dh / h, sw = Math.min(w, Math.round(dw / scale)), sh = h, sy = 0;
  const sx = Math.max(0, Math.min(w - sw, Math.round(cx - sw / 2)));
  return { sx, sy, sw, sh, dx, dy, dw, dh, textX: dw + 6 };
}

/** The figure's centre column in a portrait: the mean of the bright pixels' x, read from a small canvas copy. */
export function figureCentre(img) {
  const c = document.createElement('canvas'), n = 64;
  c.width = n; c.height = 8;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, n, 8);
  const d = g.getImageData(0, 0, n, 8).data;
  let sum = 0, count = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 90) { sum += (i / 4) % n; count++; }
  return count ? ((sum / count + 0.5) / n) * img.naturalWidth : img.naturalWidth / 2;
}
