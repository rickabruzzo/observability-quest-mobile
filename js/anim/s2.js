// S2 — Microservices: request dots flow from the cloud down the lines to the services;
// one service flashes red occasionally.
import { data } from './sprites.js';
import { hash01 } from './timeline.js';

let routes = null, boxes = null, lens = null;

function polyLen(r) { let L = 0; for (let i = 1; i < r.length; i++) L += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return L; }
function pointAt(r, d) {
  for (let i = 1; i < r.length; i++) {
    const seg = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]);
    if (d <= seg) { const t = seg ? d / seg : 0; return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * t, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * t]; }
    d -= seg;
  }
  return r[r.length - 1];
}

export default function s2Scene() {
  return {
    name: 's2_microservices', still: 's2_microservices', assets: [], fps: 10,
    async init() {
      if (!routes) { const d = await data('s2_routes'); routes = d.routes; boxes = d.boxes; lens = routes.map(polyLen); }
    },
    draw(ctx, frame) {
      if (!routes) return;
      const SPEED = 7;
      for (let i = 0; i < routes.length; i++) {
        // each route carries a dot every ~24 frames, staggered by a hash so they don't march in step
        const period = 22 + Math.floor(hash01(i) * 10);
        const phase = Math.floor(hash01(i, 1) * period);
        const f = (frame + phase) % period;
        const d = f * SPEED;
        if (d > lens[i]) continue;
        const [x, y] = pointAt(routes[i], d);
        const gx = Math.round(x / 2) * 2, gy = Math.round(y / 2) * 2;
        ctx.fillStyle = '#64BA00'; ctx.fillRect(gx - 4, gy - 4, 8, 8);
        ctx.fillStyle = '#E8FFC8'; ctx.fillRect(gx - 2, gy - 2, 4, 4);
      }
      // a service flashes red: pick a box every 60 frames, flash on alternate frames for 8 frames
      const cycle = Math.floor(frame / 60);
      const b = boxes[Math.floor(hash01(cycle, 9) * boxes.length)];
      if (frame % 60 < 8 && frame % 2 === 0 && b) {
        ctx.fillStyle = 'rgba(232,48,42,0.35)'; ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#E8302A'; ctx.lineWidth = 4; ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      }
    },
  };
}
