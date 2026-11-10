// Title: stars twinkle, slow glow pulse on the logo, shimmer along the orange horizon line.
import { hash01 } from './timeline.js';

const SKY_BOTTOM = 300;        // stars live above the title lettering's glow
const HORIZON = { y: 320, h: 6 };
let stars = null, logo = null;

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

function findStars(img) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 428;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingEnabled = false; x.drawImage(img, 0, 0, 640, 428);
  const d = x.getImageData(0, 0, 640, SKY_BOTTOM).data;
  const out = [];
  for (let y = 0; y < SKY_BOTTOM; y += 2) {
    for (let px = 0; px < 640; px += 2) {
      const i = (y * 640 + px) * 4;
      if (d[i] > 150 && d[i + 1] > 150 && d[i + 2] > 150) out.push([px, y]);
    }
  }
  return out;
}

export function drawLogo(ctx, alpha = 1) {
  if (!logo) return;
  const w = logo.width * 2, h = logo.height * 2;
  ctx.globalAlpha = alpha;
  ctx.drawImage(logo, Math.round((640 - w) / 2), 22, w, h);
  ctx.globalAlpha = 1;
}

export default function titleScene() {
  return {
    name: 'title_screen', still: 'title_screen', assets: [], fps: 8,
    async init(env) {
      if (!logo) logo = await loadImage('assets/hc_logo_white.png');
      if (!stars) { const img = env.image('title_screen'); stars = img ? findStars(img) : []; }
    },
    drawStatic(ctx) { drawLogo(ctx, 1); },
    draw(ctx, frame) {
      // stars: most steady, a few blink dim/bright/off
      for (let i = 0; i < stars.length; i++) {
        const r = hash01(i, Math.floor(frame / 2) % 97);
        if (r > 0.82) {
          const [sx, sy] = stars[i];
          ctx.fillStyle = r > 0.94 ? '#000000' : r > 0.88 ? '#6E7FA8' : '#FFFFFF';
          ctx.fillRect(sx, sy, 2, 2);
        }
      }
      // logo glow pulse: draw once solid, then a soft second pass that breathes
      drawLogo(ctx, 1);
      const pulse = 0.5 + 0.5 * Math.sin((frame / 8) * Math.PI * 0.5);
      ctx.globalCompositeOperation = 'lighter';
      drawLogo(ctx, 0.08 + 0.14 * pulse);
      ctx.globalCompositeOperation = 'source-over';
      // horizon shimmer: a brighter segment travelling along the orange line
      const x = (frame * 14) % (640 + 48) - 48;
      ctx.fillStyle = '#FFD27A';
      for (let i = 0; i < 24; i += 2) {
        ctx.globalAlpha = 0.25 + 0.75 * (1 - Math.abs(i - 12) / 12);
        ctx.fillRect(x + i, HORIZON.y + 2, 2, 2);
      }
      ctx.globalAlpha = 1;
    },
  };
}
