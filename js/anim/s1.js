// S1 — LLM server room: text scrolls on the monitors, one glitches now and then, LEDs blink,
// the engineer idles, and light flashes travel through the overhead cables.
import { data } from './sprites.js';
import { hash01 } from './timeline.js';
import { positions, drawFlash } from './flash.js';

const MONITORS = [[87, 160], [198, 271], [309, 383], [422, 495], [533, 606]];
const MON_Y = [133, 196];
const LEDS = [138, 248, 361, 473, 585];
const LED_Y = 238;
const CHAR = { x: 107, y: 238, w: 36, h: 62 };
let paths = null;

function shade(img, x0, x1) {
  // monitor fill colour from the still, darkened for "text"
  const c = document.createElement('canvas'); c.width = 1; c.height = 1;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, Math.round((x0 + x1) / 2), 160, 1, 1, 0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${Math.round(r * 0.55)},${Math.round(gg * 0.55)},${Math.round(b * 0.55)})`;
}
let shades = null;

export default function s1Scene() {
  return {
    name: 's1_llm', still: 's1_llm', assets: [], fps: 10,
    async init(env) {
      if (!paths) paths = (await data('s1_paths')).paths;
      const img = env.image('s1_llm');
      if (!shades && img) shades = MONITORS.map(([a, b]) => shade(img, a, b));
    },
    draw(ctx, frame, _state, env) {
      const img = env.image('s1_llm');
      const [my0, my1] = MON_Y;
      const glitchMon = Math.floor(frame / 37) % 5, glitching = frame % 37 < 2;
      for (let m = 0; m < 5; m++) {
        const [x0, x1] = MONITORS[m];
        // scrolling "text": rows of dashes moving up, 6px row pitch, 2px scroll per frame
        ctx.fillStyle = shades?.[m] || 'rgba(0,0,0,0.4)';
        const off = (frame * 2) % 6;
        for (let y = my0 + 8 - off; y < my1 - 6; y += 6) {
          const row = Math.floor((y + frame * 2) / 6);
          let x = x0 + 6;
          while (x < x1 - 10) {
            const len = 4 + Math.floor(hash01(m, row, x) * 5) * 2;
            if (hash01(m, row, x + 1) > 0.35) ctx.fillRect(x, y, Math.min(len, x1 - 6 - x), 2);
            x += len + 4;
          }
        }
        if (m === glitchMon && glitching && img) {
          // tear the screen into bands shifted ±4px
          for (let b = 0; b < 4; b++) {
            const by = my0 + b * 16, bh = Math.min(16, my1 - by);
            const dx = [4, -4, 2, -2][(b + frame) % 4];
            ctx.drawImage(img, x0, by, x1 - x0, bh, x0 + dx, by, x1 - x0, bh);
          }
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, my0, x1 - x0, my1 - my0);
        }
      }
      // LEDs
      for (let i = 0; i < 5; i++) {
        if (hash01(i, Math.floor(frame / 3)) < 0.35) { ctx.fillStyle = '#4A2A00'; ctx.fillRect(LEDS[i], LED_Y, 6, 6); }
      }
      // engineer idle bob: up 2px for 6 of every 20 frames
      if (img && frame % 20 < 6) {
        ctx.drawImage(img, CHAR.x, CHAR.y + CHAR.h, CHAR.w, 2, CHAR.x, CHAR.y + CHAR.h - 2, CHAR.w, 2);
        ctx.drawImage(img, CHAR.x, CHAR.y, CHAR.w, CHAR.h, CHAR.x, CHAR.y - 2, CHAR.w, CHAR.h);
      }
      // cable flashes
      if (paths) for (const p of positions(frame, paths, 3, 4)) drawFlash(ctx, paths[p.path], p.index, { tail: 4 });
    },
  };
}
