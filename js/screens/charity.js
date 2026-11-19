// Charity's verdict on Claim (spec: No score): her portrait on the left with its bottom on the scene's edge, her
// header across the top, her mood line and the count line in one window on the right (brief 12). The rules are
// js/engine/verdict.js; the sunrise coda follows her (brief 17).

import { SCRIPT } from '../script.js';
import { charityVerdict, fillN, figureCentre, portraitLayout } from '../engine/verdict.js';

export const PORTRAIT = 'assets/portrait_charity.png';

/**
 * Plays the verdict over whatever is on screen and resolves when the last window is dismissed, or false if
 * `alive()` says the screen went away meanwhile.
 * @param {object} ctx the game ctx   @param {object} wins a js/engine/window.js window manager
 * @param {string|null} soon an optional closing line; with none she says two (brief 17: the coda follows)
 */
export async function playCharity(ctx, wins, soon = null, alive = () => true) {
  const v = charityVerdict(ctx.loadDone());
  const layer = document.createElement('div');
  layer.className = 'charity'; layer.id = 'charity';
  layer.innerHTML = `<img class="charity-portrait" alt="Charity Majors" src="${PORTRAIT}"><div class="charity-head"></div>`;
  layer.querySelector('.charity-head').textContent = SCRIPT[v.header];
  const img = layer.querySelector('.charity-portrait');
  // the crop keeps its left edge (her face centred in the left 45 %) but the picture runs through to its own right edge
  // (brief 14 F): the layer clips it at the scene's edge and the words' window sits over it
  const centre = () => {
    let cx = img.naturalWidth / 2;
    try { cx = figureCentre(img); } catch { /* a blocked canvas: the middle */ }
    const L = portraitLayout(img.naturalWidth, img.naturalHeight, cx);
    img.style.left = `${(-(L.sx * (L.dh / L.sh)) / 320) * 100}%`;            // the crop's left edge, as a share of the scene's width
  };
  if (img.complete && img.naturalWidth) centre(); else img.addEventListener('load', centre, { once: true });
  ctx.overlay.appendChild(layer);
  wins.setLayer(layer);
  // the words: one window on the right of the portrait, vertically centred, as long a line as fits there
  const scale = ctx.fit?.scale ?? 1, textX = portraitLayout(640, 428, 320).textX;
  const place = { where: 'right', maxWidth: Math.floor((320 - textX) * scale) - 8, maxLines: 12 };
  try {
    for (const text of [SCRIPT[v.mood], fillN(SCRIPT[v.count], v.n), ...(soon ? [soon] : [])]) {
      await wins.say(text, place);
      if (!alive()) return false;
    }
    return true;
  } finally {
    wins.setLayer(null);
    layer.remove();
  }
}
