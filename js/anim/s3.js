// S3 — E-commerce: product panel cycles drums → keys → guitar. Drums/keys load to 100% and SOLD;
// the guitar crawls to 13% and stalls with the existing WARNING panel.
import { sprite, blit } from './sprites.js';

const SEG = { drums: 40, keys: 40, guitar: 50 };
export const S3_LOOP = SEG.drums + SEG.keys + SEG.guitar;
const LOAD_FRAMES = 20;

// measured in 640 space
const BAR = { x: 243, y: 153, w: 144, h: 19 };          // progress bar interior
const PCT = { x: 272, y: 176, w: 100, h: 24 };          // "13%" text area
const RIGHT = { x: 426, y: 100, w: 167, h: 248 };       // right panel black screen

/** Pure timeline → { product, barPct, rightPanel: 'none'|'sold'|'warning' } */
export function productTimeline(frame) {
  let f = ((frame % S3_LOOP) + S3_LOOP) % S3_LOOP;
  for (const [product, len] of Object.entries(SEG)) {
    if (f < len) {
      if (product === 'guitar') {
        const pct = Math.min(13, Math.round((f / LOAD_FRAMES) * 13));
        return { product, barPct: pct, rightPanel: f >= LOAD_FRAMES ? 'warning' : 'none' };
      }
      const pct = Math.min(100, Math.round((f / LOAD_FRAMES) * 100));
      return { product, barPct: pct, rightPanel: f >= LOAD_FRAMES + 2 ? 'sold' : 'none' };
    }
    f -= len;
  }
  return { product: 'guitar', barPct: 13, rightPanel: 'warning' };
}

export default function s3Scene() {
  return {
    name: 's3_ecommerce', still: 's3_ecommerce', fps: 10,
    assets: ['s3_product_drums', 's3_product_keys', 's3_product_guitar', 's3_product_blank'],
    draw(ctx, frame) {
      const st = productTimeline(frame);
      // product panel
      blit(ctx, 's3_product_blank');
      blit(ctx, `s3_product_${st.product}`);
      if (st.product !== 'guitar') {
        // progress bar fill and percentage (the still shows the guitar's stalled state)
        const bg = '#0F1A3A';
        ctx.fillStyle = bg; ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
        const w = Math.round((BAR.w * st.barPct) / 100 / 2) * 2;
        ctx.fillStyle = st.barPct >= 100 ? '#64BA00' : '#F96E10';
        if (w > 0) ctx.fillRect(BAR.x, BAR.y, w, BAR.h);
        ctx.fillStyle = '#1D2A6B'; ctx.fillRect(PCT.x, PCT.y, PCT.w, PCT.h);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${st.barPct}%`, PCT.x + PCT.w / 2, PCT.y + PCT.h / 2 + 1);
        if (st.rightPanel === 'sold') {
          ctx.fillStyle = '#000'; ctx.fillRect(RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.h);
          ctx.fillStyle = '#64BA00'; ctx.font = '700 44px "Pixelify Sans", monospace';
          ctx.fillText('SOLD', RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.h / 2 - 14);
          ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.fillStyle = '#DCF0FF';
          ctx.fillText('Page load 0.9 sec', RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.h / 2 + 30);
          // a chunky check mark
          ctx.fillStyle = '#64BA00';
          const cx = RIGHT.x + RIGHT.w / 2 - 20, cy = RIGHT.y + 48;
          for (let i = 0; i < 5; i++) ctx.fillRect(cx + i * 4, cy + i * 4, 4, 4);
          for (let i = 0; i < 9; i++) ctx.fillRect(cx + 16 + i * 4, cy + 16 - i * 4, 4, 4);
        } else {
          // loading: right panel dark while we wait
          ctx.fillStyle = '#000'; ctx.fillRect(RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.h);
          ctx.fillStyle = '#828282'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('loading' + '.'.repeat(frame % 4), RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.h / 2);
        }
      } else if (st.rightPanel === 'none') {
        // guitar crawling: bar fill grows to the still's 13%, warning hidden until it stalls
        ctx.fillStyle = '#0F1A3A'; ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
        const w = Math.round(((49 * st.barPct) / 13) / 2) * 2;  // the still's orange run is 49px at "13%"
        ctx.fillStyle = '#F96E10'; if (w > 0) ctx.fillRect(BAR.x, BAR.y, w, BAR.h);
        ctx.fillStyle = '#000'; ctx.fillRect(RIGHT.x, RIGHT.y, RIGHT.w, RIGHT.h);
        ctx.fillStyle = '#828282'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('loading' + '.'.repeat(frame % 4), RIGHT.x + RIGHT.w / 2, RIGHT.y + RIGHT.h / 2);
      }
      ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    },
  };
}
