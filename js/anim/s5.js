// S5 — Payments flow: silver coins turn gold as the data pulse passes; PAY2 wobbles and goes copper;
// BANK turns gold after a longer pause.
import { sprite, blit } from './sprites.js';
import { hash01 } from './timeline.js';

export const S5_LOOP = 150;                 // frames at 10 fps = 15 s
const PULSE_START = 10, PULSE_SPEED = 8;    // px per frame, from USER to BANK
const COIN_X = [86, 205, 321, 440, 556];    // coin centres (640 space)
const SPIN_FRAMES = 4;
const BANK_EXTRA_WAIT = 16;

function popFrame(i) {
  const f = PULSE_START + Math.round((COIN_X[i] - COIN_X[0]) / PULSE_SPEED);
  return i === 4 ? f + BANK_EXTRA_WAIT : f;
}

/** Pure timeline. coins[i] ∈ 'silver' | 'spin:0..3' | 'gold' | 'copper' */
export function coinTimeline(frame) {
  const f = ((frame % S5_LOOP) + S5_LOOP) % S5_LOOP;
  const coins = [];
  for (let i = 0; i < 5; i++) {
    const p = popFrame(i);
    if (f < p) coins.push('silver');
    else if (f < p + SPIN_FRAMES) coins.push(`spin:${f - p}`);
    else coins.push(i === 3 ? 'copper' : 'gold');
  }
  const p3 = popFrame(3);
  const pay2Wobble = f >= p3 - 2 && f < p3 + SPIN_FRAMES + 4;
  const pulseEnd = PULSE_START + Math.round((COIN_X[4] - COIN_X[0]) / PULSE_SPEED);
  const pulse = f >= PULSE_START && f <= pulseEnd ? COIN_X[0] + (f - PULSE_START) * PULSE_SPEED : null;
  const twinkle = coins.map((c, i) => c === 'gold' && ((f - popFrame(i)) % 20) < 2);
  return { coins, pay2Wobble, pulse, twinkle };
}

export default function s5Scene() {
  const assets = ['s5_coin_gold', 's5_coin_silver', 's5_coin_copper', 's5_pay2',
    's5_coin_blank_0', 's5_coin_blank_1', 's5_coin_blank_2', 's5_coin_blank_3', 's5_coin_blank_4'];
  return {
    name: 's5_payments', still: 's5_payments', assets, fps: 10,
    draw(ctx, frame) {
      const st = coinTimeline(frame);
      const pay2 = sprite('s5_pay2');
      // clear moving parts off the still
      for (let i = 0; i < 5; i++) blit(ctx, `s5_coin_blank_${i}`);
      if (pay2) { ctx.fillStyle = '#000'; ctx.fillRect(pay2.x, pay2.y, pay2.w, pay2.h); }
      // PAY2 box (wobble = ±2px on the grid)
      if (pay2) {
        const dx = st.pay2Wobble ? [0, 2, 0, -2][frame % 4] : 0;
        ctx.drawImage(pay2.img, pay2.x + dx, pay2.y, pay2.w, pay2.h);
      }
      // coins
      for (let i = 0; i < 5; i++) {
        const base = sprite('s5_coin_blank_0'); // geometry (all coins share size)
        const geo = sprite(`s5_coin_blank_${i}`) || base;
        if (!geo) continue;
        const c = st.coins[i];
        let name = 'silver', squash = 1, dy = 0;
        if (c.startsWith('spin')) {
          const k = Number(c.split(':')[1]);
          squash = [0.66, 0.33, 0.66, 1][k];
          dy = -[4, 6, 4, 2][k];
          name = k >= 2 ? (i === 3 ? 'copper' : 'gold') : 'silver';
        } else name = c;
        const s = sprite(`s5_coin_${name}`);
        if (!s) continue;
        const w = Math.max(2, Math.round((s.w * squash) / 2) * 2);
        ctx.drawImage(s.img, geo.x + Math.round((s.w - w) / 4) * 2, geo.y + dy, w, s.h);
        if (st.twinkle[i]) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(geo.x + geo.w - 6, geo.y, 2, 2); ctx.fillRect(geo.x + geo.w - 8, geo.y + 2, 2, 2); }
      }
      // data pulse along the arrow line
      if (st.pulse !== null) {
        const x = Math.round(st.pulse / 2) * 2;
        ctx.fillStyle = '#64BA00'; ctx.fillRect(x - 2, 170, 6, 6);
        ctx.fillStyle = '#DFFFB0'; ctx.fillRect(x, 172, 2, 2);
      }
    },
  };
}
