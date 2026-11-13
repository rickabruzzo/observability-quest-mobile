// Product screens drawn from ready-made pictures (assets/screens/chN_hc.json + PNGs, built by
// tools/build_hc_screens.py). One picture per stage of a Honeycomb screen; a direct prompt wipes the next one
// in left to right, then its highlight rectangles pulse and stay outlined (brief 06). Pure apart from the
// canvas it is handed, so it is tested with a recording stand-in.

export const FRAME = '#2A3346';
export const HIGHLIGHT = '#F28C28';
const WIPE = 0.4;            // of the reveal: the wipe, then the pulse
const PULSES = 9;            // on, off, … on: four on/off pulses, ending on
const DEFAULT_PIC = { x: 4, y: 20, w: 188, h: 176 };

/**
 * What to draw for `stage` at reveal progress `p` (0..1; 1 when nothing is being revealed).
 * @returns {{ base: number|null, stage: number, wipe: number, outline: boolean }} base: the picture under the wipe
 */
export function hcFrame(stage, p = 1, reduced = false) {
  if (reduced || stage === 0 || p >= 1) return { base: null, stage, wipe: 1, outline: true };
  if (p < WIPE) return { base: stage - 1, stage, wipe: Math.max(0, p / WIPE), outline: false };
  const k = Math.min(PULSES - 1, Math.floor(((p - WIPE) / (1 - WIPE)) * PULSES));
  return { base: null, stage, wipe: 1, outline: k % 2 === 0 };
}

const nameOf = (file) => String(file).replace(/\.png$/i, '');

/** Draws a Honeycomb screen's picture for `stage` on black with a 2 px frame. `screens`: { manifest, images }. */
export function paintHc(g, stage, p, screens, reduced = false) {
  const m = screens?.manifest, pic = m?.pic ?? DEFAULT_PIC;
  g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
  g.fillStyle = FRAME; g.fillRect(pic.x - 2, pic.y - 2, pic.w + 4, pic.h + 4);
  g.fillStyle = '#0B0F18'; g.fillRect(pic.x, pic.y, pic.w, pic.h);
  if (!m?.stages) return;
  const s = Math.max(0, Math.min(stage, m.stages.length - 1));
  const img = (i) => screens.images?.get(nameOf(m.stages[i]?.image));
  const f = hcFrame(s, p, reduced);
  if (f.base !== null && img(f.base)) g.drawImage(img(f.base), pic.x, pic.y);
  const top = img(s);
  if (top) {
    if (f.wipe >= 1) g.drawImage(top, pic.x, pic.y);
    else {
      const sw = Math.max(1, Math.round(pic.w * f.wipe));
      g.drawImage(top, 0, 0, sw, pic.h, pic.x, pic.y, sw, pic.h);
    }
  }
  if (!f.outline) return;
  g.fillStyle = HIGHLIGHT;
  for (const r of m.stages[s].highlights || []) {
    const x = pic.x + r.x, y = pic.y + r.y;
    g.fillRect(x, y, r.w, 2); g.fillRect(x, y + r.h - 2, r.w, 2);
    g.fillRect(x, y, 2, r.h); g.fillRect(x + r.w - 2, y, 2, r.h);
  }
}
