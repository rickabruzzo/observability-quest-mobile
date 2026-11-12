// Preview room — a placeholder room where the created hero stands and walks where you tap.
// Stands in for the room engine until the chapters sub-project; proves the sprite, the walk
// cycle, flipping, reduced motion and the pause under the rotate gate.

import { drawHero, HERO_W, HERO_H } from '../engine/hero.js';
import { drawHeroSide, SIDE_FOOT_DY } from '../engine/hero-side.js';
import { planWalk, stepWalk } from '../engine/walk.js';
import { colButton } from '../engine/ui.js';
import { actionAt, applyCursor, drawIcon, MARKER_MS } from '../engine/cursor.js';

export const FLOOR_Y = 180;          // the hero's feet sit on this logical row
const START_X = 146;
const MIN_X = 0, MAX_X = 320 - HERO_W;
// things in the room you can use: where they are, where the hero stands to use them, what they say
const HOTSPOTS = [{ id: 'desk', x: 166, y: 64, w: 110, h: 68, standX: 150, text: 'A desk. Nothing is on fire here. Yet.' }];
const HINT = 'Tap the floor to walk';

export function createPreviewScreen(game) {
  let hero, x = START_X, pose = 'idle', view = 'front', flip = false, plan = null, elapsed = 0;
  let redo = null, onTap = null, onMove = null, cursor = null, marker = null, pending = null;
  const say = (ctx, text) => { const el = ctx.overlay.querySelector('.room-ui'); if (el) el.textContent = text; };

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
    // side on while walking (mirrored when heading left), facing the player when stopped
    if (view === 'side') drawHeroSide(g, hero, pose, x, FLOOR_Y - HERO_H + SIDE_FOOT_DY, 1, { flip });
    else drawHero(g, hero, pose, x, FLOOR_Y - HERO_H, 1, { flip });
    if (marker) drawIcon(g, marker.icon, marker.x, marker.y);        // where the tap landed, and what it will do
  }

  function walkTo(ctx, targetX) {
    const tx = Math.max(MIN_X, Math.min(MAX_X, targetX));
    if (ctx.reducedMotion) { if (tx !== x) flip = tx < x; x = tx; pose = 'idle'; view = 'front'; plan = null; paint(ctx); return; }
    plan = planWalk(x, tx); elapsed = 0;
    if (plan.duration === 0) { plan = null; return; }
    flip = plan.dir < 0;
  }

  return {
    enter(ctx) {
      hero = ctx.hero;
      x = START_X; pose = 'idle'; view = 'front'; flip = false; plan = null; elapsed = 0;
      ctx.overlay.innerHTML = `<div class="room-ui">${HINT}</div>`;
      marker = null; pending = null; cursor = null;
      const box = ctx.canvas.parentElement;
      const logical = (e) => { const r = ctx.canvas.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / (r.width / 320)), Math.floor((e.clientY - r.top) / (r.height / 200))]; };
      onTap = (e) => {
        const [tx, ty] = logical(e), act = actionAt(tx, ty, HOTSPOTS);
        marker = { icon: act.icon, x: tx, y: ty, left: MARKER_MS };
        pending = act.spot; say(ctx, HINT);
        walkTo(ctx, act.spot ? act.spot.standX : tx - Math.floor(HERO_W / 2));
        if (!plan && pending) { say(ctx, pending.text); pending = null; }   // already there (or reduced motion): look at once
        paint(ctx);
      };
      onMove = (e) => {                                // a mouse shows what a click would do before it is made
        const [mx, my] = logical(e), name = actionAt(mx, my, HOTSPOTS).icon;
        if (name !== cursor) { cursor = name; applyCursor(box, name); }
      };
      box.addEventListener('pointermove', onMove);
      // listen on the scene box: the overlay sits over the canvas and would swallow the tap
      ctx.canvas.parentElement.addEventListener('pointerdown', onTap);
      redo = colButton({ id: 'btn-redo', long: 'Sheet', short: 'Edit', onClick: () => game.go('CREATOR') });
      ctx.colR.appendChild(redo);
      paint(ctx);
      window.__oq && (window.__oq.preview = { get x() { return x; }, get pose() { return pose; }, get view() { return view; }, get walking() { return plan !== null; }, get flip() { return flip; }, get cursor() { return cursor; }, get marker() { return marker && { icon: marker.icon, x: marker.x, y: marker.y }; } });
    },
    tick(dt, ctx) {
      if (!plan && !marker) return;
      if (marker && (marker.left -= dt) <= 0) marker = null;
      if (plan) {
        elapsed += dt;
        const s = stepWalk(plan, elapsed);
        x = s.x; pose = s.pose; view = s.view; flip = s.flip;
        if (s.done) { plan = null; if (pending) { say(ctx, pending.text); pending = null; } }
      }
      paint(ctx);
    },
    exit(ctx) {
      ctx.canvas.parentElement.removeEventListener('pointerdown', onTap); onTap = null;
      ctx.canvas.parentElement.removeEventListener('pointermove', onMove); onMove = null;
      applyCursor(ctx.canvas.parentElement, null); cursor = null; marker = null; pending = null;
      redo?.remove(); redo = null;
      ctx.overlay.innerHTML = '';
    },
  };
}
