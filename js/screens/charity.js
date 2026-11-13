// Charity's verdict on Claim (spec: No score): her portrait takes over the scene, her header on top, then her
// mood line and the count line in windows below, then the "prize desk opens later" line. The rules are
// js/engine/verdict.js; the claim form and the sunrise coda come in a later brief.

import { SCRIPT } from '../script.js';
import { charityVerdict, fillN } from '../engine/verdict.js';

export const PORTRAIT = 'assets/portrait_charity.png';

/**
 * Plays the verdict over whatever is on screen and resolves when the last window is dismissed, or false if
 * `alive()` says the screen went away meanwhile.
 * @param {object} ctx the game ctx   @param {object} wins a js/engine/window.js window manager
 * @param {string} soon the closing placeholder line
 */
export async function playCharity(ctx, wins, soon, alive = () => true) {
  const v = charityVerdict(ctx.loadDone());
  const layer = document.createElement('div');
  layer.className = 'charity'; layer.id = 'charity';
  layer.innerHTML = `<img class="charity-portrait" alt="Charity Majors" src="${PORTRAIT}"><div class="charity-head"></div>`;
  layer.querySelector('.charity-head').textContent = SCRIPT[v.header];
  ctx.overlay.appendChild(layer);
  wins.setLayer(layer);
  try {
    for (const text of [SCRIPT[v.mood], fillN(SCRIPT[v.count], v.n), soon]) {
      await wins.say(text, { where: 'bottom' });
      if (!alive()) return false;
    }
    return true;
  } finally {
    wins.setLayer(null);
    layer.remove();
  }
}
