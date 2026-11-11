// Preview room — a placeholder room where the created hero stands and walks where you tap.
// Stands in for the room engine until the chapters sub-project; proves the sprite, the walk
// cycle, flipping, reduced motion and the pause under the rotate gate.

import { drawHero, HERO_W, HERO_H } from '../engine/hero.js';
import { planWalk, stepWalk } from '../engine/walk.js';

export const FLOOR_Y = 180;          // the hero's feet sit on this logical row
const START_X = 146;
const MIN_X = 0, MAX_X = 320 - HERO_W;

export function createPreviewScreen(game) {
  let hero, x = START_X, pose = 'idle', flip = false, plan = null, elapsed = 0;
  let redo = null, onTap = null;

  function paintRoom(g) {
    g.fillStyle = '#4A5A78'; g.fillRect(0, 0, 320, 112);        // wall
    g.fillStyle = '#6B5A48'; g.fillRect(0, 112, 320, 88);       // floor
    g.fillStyle = '#5A4A3A'; g.fillRect(0, 112, 320, 2);
    g.fillStyle = '#22283A'; g.fillRect(28, 28, 86, 56);        // window frame
    g.fillStyle = '#0A0E1A'; g.fillRect(32, 32, 78, 48);
    g.fillStyle = '#8C6A4A'; g.fillRect(166, 86, 110, 44);      // desk
    g.fillStyle = '#5A3F28'; g.fillRect(166, 126, 110, 6);
    g.fillStyle = '#C8CCD4'; g.fillRect(190, 64, 48, 30);       // monitor
    g.fillStyle = '#202838'; g.fillRect(193, 67, 42, 24);
  }

  function paint(ctx) {
    const g = ctx.ctx2d;
    paintRoom(g);
    drawHero(g, hero, pose, x, FLOOR_Y - HERO_H, 1, { flip });
  }

  function walkTo(ctx, targetX) {
    const tx = Math.max(MIN_X, Math.min(MAX_X, targetX));
    if (ctx.reducedMotion) { if (tx !== x) flip = tx < x; x = tx; pose = 'idle'; plan = null; paint(ctx); return; }
    plan = planWalk(x, tx); elapsed = 0;
    if (plan.duration === 0) { plan = null; return; }
    flip = plan.dir < 0;
  }

  return {
    enter(ctx) {
      hero = ctx.hero;
      x = START_X; pose = 'idle'; flip = false; plan = null; elapsed = 0;
      ctx.overlay.innerHTML = '<div class="room-ui">Tap the floor to walk</div>';
      onTap = (e) => {
        const r = ctx.canvas.getBoundingClientRect();
        const tapX = Math.floor((e.clientX - r.left) / (r.width / 320));
        walkTo(ctx, tapX - Math.floor(HERO_W / 2));
      };
      // listen on the scene box: the overlay sits over the canvas and would swallow the tap
      ctx.canvas.parentElement.addEventListener('pointerdown', onTap);
      redo = document.createElement('button');
      redo.type = 'button'; redo.id = 'btn-redo'; redo.className = 'btn-sierra'; redo.textContent = 'Sheet';
      redo.addEventListener('click', () => game.go('CREATOR'));
      ctx.colR.appendChild(redo);
      paint(ctx);
      window.__oq && (window.__oq.preview = { get x() { return x; }, get pose() { return pose; }, get walking() { return plan !== null; }, get flip() { return flip; } });
    },
    tick(dt, ctx) {
      if (!plan) return;
      elapsed += dt;
      const s = stepWalk(plan, elapsed);
      x = s.x; pose = s.pose; flip = s.flip;
      if (s.done) plan = null;
      paint(ctx);
    },
    exit(ctx) {
      ctx.canvas.parentElement.removeEventListener('pointerdown', onTap); onTap = null;
      redo?.remove(); redo = null;
      ctx.overlay.innerHTML = '';
    },
  };
}
