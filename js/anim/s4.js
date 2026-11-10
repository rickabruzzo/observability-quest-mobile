// S4 — Tool spaghetti: panels and alerts flash out of sync, the "!!" bounces, flashes travel the tubes.
import { data, blit } from './sprites.js';
import { hash01 } from './timeline.js';
import { positions, drawFlash } from './flash.js';

let paths = null, panels = null;

export default function s4Scene() {
  return {
    name: 's4_spaghetti', still: 's4_spaghetti', assets: ['s4_bang', 's4_bang_blank'], fps: 10,
    async init() {
      if (!paths) { const d = await data('s4_paths'); paths = d.paths; panels = Object.entries(d.panels); }
    },
    draw(ctx, frame) {
      // panels flash out of sync
      if (panels) {
        panels.forEach(([name, [x0, y0, x1, y1]], i) => {
          const r = hash01(i, Math.floor(frame / 4));
          if (r < 0.14) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
          else if (name === 'ALERTS' && frame % 10 < 3) { ctx.fillStyle = 'rgba(232,48,42,0.35)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
        });
      }
      // "!!" bounce
      blit(ctx, 's4_bang_blank');
      blit(ctx, 's4_bang', 0, -[0, 2, 4, 6, 4, 2][frame % 6]);
      // tube flashes
      if (paths) for (const p of positions(frame, paths, 3, 5)) drawFlash(ctx, paths[p.path], p.index, { head: '#F3EBFF', mid: '#B48CFF', tail: 4 });
    },
  };
}
