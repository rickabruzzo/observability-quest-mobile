// The scenario menu (spec: The scenario menu): a Sierra window with five rows, 1→5. Built scenarios can be
// played (and replayed); the rest show, disabled. Once one is done and the prize is unclaimed, a claim
// button sits in the right thumb column. The rules are js/menu.js; this is the DOM.

import { SCRIPT } from '../script.js';
import { menuRows, canClaim } from '../menu.js';
import { colButton } from '../engine/ui.js';
import { createWindows } from '../engine/window.js';
import { UI as CHAPTER_UI } from './chapter.js';
import { playCharity } from './charity.js';

export const MENU_UI = { soon: 'coming soon' };   // a string the script has no slot for

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createMenuScreen(game) {
  let claim = null, wins = null, onDown = null;
  return {
    enter(ctx) {
      const done = ctx.loadDone();
      ctx.showSolved();
      const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
      const rows = menuRows(SCRIPT, done);
      ctx.overlay.innerHTML = `
        <div class="menu" id="menu" role="dialog" aria-label="${esc(SCRIPT['menu.title'])}">
          <h2>${esc(SCRIPT['menu.title'])}</h2>
          <p class="menu-hint">${esc(SCRIPT['menu.hint'])}</p>
          <div class="menu-rows">
            ${rows.map((r) => `
              <button type="button" class="menu-row${r.done ? ' done' : ''}" data-ch="${r.ch}" ${r.enabled ? '' : 'disabled aria-disabled="true"'}>
                <span class="mr-name">${esc(r.name)}</span>
                <span class="mr-hook">${esc(r.hook)}</span>
                <span class="mr-mark">${r.done ? `<i class="mr-tick" aria-hidden="true"></i>${esc(SCRIPT['menu.done'])}` : r.enabled ? '' : esc(MENU_UI.soon)}</span>
              </button>`).join('')}
          </div>
        </div>`;
      ctx.overlay.querySelectorAll('.menu-row:not([disabled])').forEach((b) => b.addEventListener('click', () => {
        if (wins.open) return;
        ctx.chapterId = Number(b.dataset.ch);
        game.go('CHAPTER');
      }));
      wins = createWindows(ctx);
      onDown = (e) => { if (wins.open && !e.target.closest?.('button')) wins.tap(); };
      ctx.canvas.parentElement.addEventListener('pointerdown', onDown);
      if (canClaim(done, ctx.claimed)) {
        claim = colButton({ id: 'btn-menu-claim', long: SCRIPT['claim.button'], className: 'go', onClick: () => { if (!wins.open && !ctx.overlay.querySelector('#charity')) playCharity(ctx, wins, CHAPTER_UI.claimSoon); } });
        ctx.colR.appendChild(claim);
      }
    },
    tick(dt) { wins?.tick(dt); },
    exit(ctx) {
      ctx.canvas.parentElement.removeEventListener('pointerdown', onDown); onDown = null;
      wins?.reset(); wins = null;
      claim?.remove(); claim = null;
      ctx.overlay.innerHTML = '';
    },
  };
}
