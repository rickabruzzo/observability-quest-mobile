// Title screen — placeholder card until the title-art sub-project. START → character creation.

import { colButton } from '../engine/ui.js';

export function createTitleScreen(game) {
  let startBtn = null;
  return {
    enter(ctx) {
      ctx.setScore(0);
      const g = ctx.ctx2d;
      g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
      // a faint horizon line so the black isn't a dead canvas
      g.fillStyle = '#1A2436'; g.fillRect(0, 140, 320, 60);
      g.fillStyle = '#25303E'; g.fillRect(0, 140, 320, 2);
      ctx.overlay.innerHTML = `
        <div class="title-card">
          <h1>OBSERVABILITY<br>QUEST</h1>
          <p>Honeycomb presents a night on call</p>
        </div>`;
      startBtn = colButton({ id: 'btn-start', long: 'Start', short: 'Go', className: 'go', onClick: () => game.go('CREATOR') });
      ctx.colR.appendChild(startBtn);
    },
    exit(ctx) {
      ctx.overlay.innerHTML = '';
      startBtn?.remove(); startBtn = null;
    },
  };
}
