// The screen to show booth staff (Warp brief 17 D): a placeholder card over the dawn's last frame. Entering it claims
// the prize for the session; staff tap REDEEMED, which sticks across a reload (js/claim.js, localStorage); Play more
// goes back to the menu with the hero and the solved marks kept.

import { SCRIPT } from '../script.js';
import { redeemed } from '../claim.js';
import { preloadCoda } from './coda.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createCompleteScreen(game) {
  let token = 0;
  return {
    enter(ctx) {
      const mine = ++token;
      ctx.showSolved();
      ctx.claimed = true; ctx.saveClaimed?.(true);
      const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
      preloadCoda().then((a) => { if (mine === token) { const last = a.manifest.images.frames.length - 1; g.drawImage(a.images.get(`frame_${last}`), 0, 0); } }, () => {});
      const isRedeemed = redeemed.get();
      ctx.overlay.innerHTML = `
        <div class="complete" id="complete" role="dialog" aria-label="${esc(SCRIPT['complete.title'])}">
          <h2>${esc(SCRIPT['complete.title'])}</h2>
          <p class="complete-instr">${esc(SCRIPT['complete.instr'])}</p>
          <button type="button" class="prompt complete-redeem" id="btn-redeem"${isRedeemed ? ' disabled' : ''}>${esc(SCRIPT[isRedeemed ? 'complete.redeemed' : 'complete.redeem'])}</button>
          <button type="button" class="prompt complete-again" id="btn-again">${esc(SCRIPT['complete.again'])}</button>
          <p class="complete-note">${esc(SCRIPT['complete.again.note'])}</p>
        </div>`;
      const redeem = ctx.overlay.querySelector('#btn-redeem');
      redeem.addEventListener('click', () => { redeemed.set(); redeem.textContent = SCRIPT['complete.redeemed']; redeem.disabled = true; });
      ctx.overlay.querySelector('#btn-again').addEventListener('click', () => game.go('MENU'));
    },
    exit(ctx) { token++; ctx.overlay.innerHTML = ''; },
  };
}
