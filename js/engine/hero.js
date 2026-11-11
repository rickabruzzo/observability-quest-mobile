// Hero sprite renderer — a line-for-line port of tools/hero_gen.py.
// Part masks → shading pass → detail stamps → silhouette outline. The Python file is the
// reference; tests/hero.test.js proves this port byte for byte against its fixtures.

import { BODIES, HAIR, HOODIE, JEANS, OUTLINE, SKIN, WALK } from './hero-parts.js';

export const HERO_W = 28;
export const HERO_H = 72;
export const HEAD_CROP = { x: 4, y: 0, w: 20, h: 21 };
export const HAND_CROP = { x: 0, y: 30, w: 12, h: 20 };

function hexc(s) {
  const h = s.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
}
function ramp(base, light = 1.22, shade = 0.74, dark = 0.5) {
  const [r, g, b] = hexc(base);
  const f = (k) => [Math.min(255, Math.trunc(r * k)), Math.min(255, Math.trunc(g * k)), Math.min(255, Math.trunc(b * k)), 255];
  return { L: f(light), B: [r, g, b, 255], S: f(shade), D: f(dark) };
}
const OUTLINE_C = hexc(OUTLINE);
const SHOE = ramp('#2E2E36', 1.6, 0.8);
const LAPTOP = ramp('#8A94A6', 1.25, 0.7);
const EYE_WHITE = hexc('#F2F2F2');

class Grid {
  constructor() {
    this.part = Array.from({ length: HERO_H }, () => new Array(HERO_W).fill(null));
    this.col = Array.from({ length: HERO_H }, () => new Array(HERO_W).fill(null));
    this.oy = 0;
  }
  fill(pid, mask) {
    for (const [x, y0] of mask) {
      const y = y0 + this.oy;
      if (x >= 0 && x < HERO_W && y >= 0 && y < HERO_H) this.part[y][x] = pid;
    }
  }
  shade(pid, rmp, hl = 1, sh = 2, topLight = true) {
    const rows = new Map();
    for (let y = 0; y < HERO_H; y++) {
      const xs = [];
      for (let x = 0; x < HERO_W; x++) if (this.part[y][x] === pid) xs.push(x);
      if (xs.length) rows.set(y, xs);
    }
    const ys = [...rows.keys()].sort((a, b) => a - b);
    for (const y of ys) {
      const xs = rows.get(y); const lo = xs[0], hi = xs[xs.length - 1];
      for (const x of xs) {
        let c = rmp.B;
        if (x - lo < hl) c = rmp.L;
        else if (hi - x < sh) c = rmp.S;
        if (topLight && y === ys[0]) c = rmp.L;
        this.col[y][x] = c;
      }
    }
  }
  outline() {
    const sil = this.part.map((row) => row.map((p) => p !== null));
    for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) {
      if (!sil[y][x]) continue;
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= HERO_W || ny >= HERO_H || !sil[ny][nx]) edge = true;
      }
      if (edge) this.col[y][x] = OUTLINE_C;
    }
  }
  px(x, y0, c) {
    const y = y0 + this.oy;
    if (x >= 0 && x < HERO_W && y >= 0 && y < HERO_H) { this.col[y][x] = c; this.part[y][x] = this.part[y][x] || 'detail'; }
  }
  toRGBA() {
    const out = new Uint8ClampedArray(HERO_W * HERO_H * 4);
    for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) {
      const c = this.col[y][x]; if (!c) continue;
      const i = (y * HERO_W + x) * 4; out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = c[3];
    }
    return out;
  }
}

function rect(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}
function ellipse(cx, cy, rx, ry) {
  const out = [];
  for (let y = Math.trunc(cy - ry); y <= Math.trunc(cy + ry); y++)
    for (let x = Math.trunc(cx - rx); x <= Math.trunc(cx + rx); x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0) out.push([x, y]);
  return out;
}

/** Composes the 28×72 RGBA sprite for a hero config and pose. */
export function composeHero(cfg, pose = 'idle') {
  const { body = 'masc', skin = 0, hair = 'black', style = 'standard', beard = 'none',
    hoodie = 'ink', jeans = 'indigo', glasses = 'none', hold = 'laptop' } = cfg;
  const b = BODIES[body]; const c = new Grid();
  const skinR = ramp(SKIN[skin], 1.12, 0.8, 0.62);
  const hairR = ramp(HAIR[hair], 1.35, 0.7);
  const hoodR = ramp(HOODIE[hoodie]); const jeanR = ramp(JEANS[jeans], 1.25, 0.72);
  const beardR = ramp(HAIR[hair], 1.3, 0.7);
  const cx = 13.5;
  const [legLdx, legRdx, shoeLdx, shoeRdx, bob, armLdy, armRdy] = WALK[pose] || WALK.idle;

  // ---- legs & shoes (back; never bob) ----
  const legTop = 45, legBot = 66;
  c.oy = 0;
  c.fill('legL', rect(b.legL[0] + legLdx, legTop, b.legL[1] + legLdx, legBot));
  c.fill('legR', rect(b.legR[0] + legRdx, legTop, b.legR[1] + legRdx, legBot));
  c.fill('shoeL', rect(b.shoeL[0] + shoeLdx, 66, b.shoeL[1] + shoeLdx, 71));
  c.fill('shoeR', rect(b.shoeR[0] + shoeRdx, 66, b.shoeR[1] + shoeRdx, 71));
  c.fill('legL', rect(b.hip[0], legTop, 13, 51)); c.fill('legR', rect(14, legTop, b.hip[1], 51));

  // ---- everything above the legs bobs with the walk ----
  c.oy = bob;
  c.fill('hood', rect(9, 18, 18, 22));
  for (let y = 20; y <= 45; y++) {
    let span;
    if (y <= 21) span = [b.shoulder[0] + (21 - y), b.shoulder[1] - (21 - y)];
    else if (y <= 29) span = b.torso;
    else if (y <= 38) span = b.waist;
    else span = b.hip;
    c.fill('torso', rect(span[0], y, span[1], y));
  }
  c.fill('armL', rect(b.armL[0], 22 + armLdy, b.armL[1], 43 + armLdy)); c.fill('armR', rect(b.armR[0], 22 + armRdy, b.armR[1], 43 + armRdy));
  c.fill('handL', rect(b.armL[0], 44 + armLdy, b.armL[1], 47 + armLdy)); c.fill('handR', rect(b.armR[0], 44 + armRdy, b.armR[1], 47 + armRdy));
  c.fill('neck', rect(b.neck[0], 17, b.neck[1], 20));
  c.fill('head', ellipse(cx, 11.5, b.headRx, 6.8));
  c.fill('head', rect(8, 15, 19, 16)); c.fill('head', rect(9, 17, 18, 17)); c.fill('head', rect(11, 18, 16, 18));
  c.fill('earL', rect(7, 10, 7, 12)); c.fill('earR', rect(20, 10, 20, 12));

  // ---- hair (one picker: mohawk, buzz, standard, shoulder, long, fro) ----
  let hm = [];
  if (style === 'mohawk') {
    hm = rect(12, 3, 15, 8).concat([[13, 2], [14, 2]]);                 // a narrow, short, pronounced strip
  } else {
    hm = ellipse(cx, 7.0, b.headRx + 0.8, 3.8);                       // crown
    hm = hm.concat(rect(8, 6, 19, 8));                                 // band over the forehead
    if (style === 'standard') hm = hm.concat(rect(6, 7, 7, 11), rect(20, 7, 21, 11));
    else if (style === 'shoulder') hm = hm.concat(rect(6, 7, 7, 20), rect(20, 7, 21, 20), rect(5, 14, 5, 20), rect(22, 14, 22, 20));
    else if (style === 'long') hm = hm.concat(rect(6, 7, 7, 30), rect(20, 7, 21, 30), rect(5, 12, 5, 30), rect(22, 12, 22, 30), rect(4, 18, 4, 30), rect(23, 18, 23, 30));
    else if (style === 'fro') {
      // one big smooth round mass behind and around the face, down past the ears; the face stays clear below the brow line
      hm = ellipse(cx, 8.0, b.headRx + 4.2, 8.2).filter(([x, y]) => !(y >= 8 && x >= 9 && x <= 18));
    }
  }
  c.fill('hair', hm);

  // ---- shading ----
  c.shade('legL', jeanR); c.shade('legR', jeanR);
  c.shade('shoeL', SHOE, 1, 1); c.shade('shoeR', SHOE, 1, 1);
  c.shade('hood', { L: hoodR.S, B: hoodR.D, S: hoodR.D, D: hoodR.D }, 0, 0, false);
  c.shade('torso', hoodR, 2, 3); c.shade('armL', hoodR, 1, 1); c.shade('armR', hoodR, 1, 2);
  c.shade('handL', skinR, 1, 1); c.shade('handR', skinR, 1, 1);
  c.shade('neck', { L: skinR.S, B: skinR.S, S: skinR.D, D: skinR.D }, 0, 1, false);
  c.shade('head', skinR, 1, 2); c.shade('earL', skinR, 0, 0); c.shade('earR', skinR, 0, 1);
  c.shade('hair', hairR, 2, 3);

  // ---- details ----
  for (let y = 23; y <= 43; y++) { c.px(b.torso[0], y, hoodR.S); c.px(b.torso[1], y, hoodR.D); }
  for (let x = b.hip[0]; x <= b.hip[1]; x++) c.px(x, 45, hoodR.D);
  const px0 = b.waist[0] + 2, px1 = b.waist[1] - 2;
  for (let x = px0; x <= px1; x++) { c.px(x, 37, hoodR.S); c.px(x, 43, hoodR.S); }
  for (let y = 37; y <= 43; y++) { c.px(px0, y, hoodR.S); c.px(px1, y, hoodR.S); }
  for (let y = 22; y <= 30; y++) { c.px(12, y, hoodR.L); c.px(15, y, hoodR.L); }
  for (let x = b.legL[0] + 1; x < b.legL[1]; x++) c.px(x, 57, jeanR.S);
  for (let x = b.legR[0] + 1; x < b.legR[1]; x++) c.px(x, 57, jeanR.S);
  // face
  const brow = hairR.D;
  for (const x of [10, 11, 12]) c.px(x, 9, brow);
  for (const x of [15, 16, 17]) c.px(x, 9, brow);
  c.px(10, 10, EYE_WHITE); c.px(11, 10, OUTLINE_C); c.px(16, 10, EYE_WHITE); c.px(15, 10, OUTLINE_C);
  c.px(14, 12, skinR.S); c.px(14, 13, skinR.S); c.px(13, 13, skinR.S);
  for (const x of [12, 13, 14, 15]) c.px(x, 15, skinR.D);
  // hair texture: buzzed temples for the mohawk, dark curls dotted through the fro
  if (style === 'mohawk') for (const [x, y] of [[8, 7], [9, 8], [8, 9], [19, 7], [18, 8], [19, 9]]) c.px(x, y, hairR.S);
  if (style === 'fro') for (const [x, y] of [[9, 3], [16, 2], [6, 7], [21, 6], [12, 5], [18, 5], [5, 12], [22, 11], [8, 14], [19, 14]]) if (c.part[y + c.oy]?.[x] === 'hair') c.px(x, y, hairR.D);   // a few darker curls
  // beard (takes the hair colour): short = stubble over the jaw with a solid chin; long = full, down the chest
  if (beard === 'short') {
    // close-cropped, inside the face: sideburns, a moustache, a frame round the mouth, the jaw and a narrow chin
    const pts = rect(9, 13, 9, 15).concat(rect(18, 13, 18, 15),            // sideburns
      rect(11, 14, 16, 14),                                               // moustache (the mouth is row 15)
      [[11, 15], [16, 15], [10, 16], [11, 16], [16, 16], [17, 16]],       // round the mouth to the jaw
      rect(10, 17, 17, 17), rect(12, 18, 15, 18));                        // jaw line, chin brought in a pixel
    for (const [x, y] of pts) c.px(x, y, x >= 16 ? beardR.S : beardR.B);
  } else if (beard === 'long') {
    for (const [x, y] of rect(9, 13, 18, 22)) {
      if (y === 15 && x >= 12 && x <= 15) continue;
      if (y >= 19 && (x < 10 + (y - 19) || x > 17 - (y - 19))) continue;
      c.px(x, y, x >= 17 ? beardR.S : beardR.B);
    }
    for (let y = 13; y <= 16; y++) c.px(9, y, beardR.L);
  }
  // glasses: on or off, silver square frames
  if (glasses === 'glasses') {
    const g = hexc('#C9D2E0');
    for (const [x, y] of [[9, 10], [12, 10], [14, 10], [17, 10], [13, 10], [9, 11], [12, 11], [14, 11], [17, 11]]) c.px(x, y, g);
  }
  // held item rides with the left arm; the pager sits on the belt
  c.oy = bob + (hold === 'pager' ? 0 : armLdy);
  if (hold === 'laptop') {
    for (const [x, y] of rect(0, 33, 6, 42)) c.px(x, y, LAPTOP.B);
    for (let x = 0; x <= 6; x++) { c.px(x, 33, LAPTOP.L); c.px(x, 42, LAPTOP.S); }
    for (let y = 33; y <= 42; y++) c.px(6, y, LAPTOP.S);
    for (const [x, y] of [[2, 37], [3, 37], [2, 38], [3, 38]]) c.px(x, y, hexc('#FFB000'));
    for (const [x, y] of rect(0, 33, 6, 42)) if (x === 0 || y === 33 || y === 42) c.px(x, y, OUTLINE_C);
  } else if (hold === 'coffee') {
    for (const [x, y] of rect(3, 42, 6, 47)) c.px(x, y, hexc('#F4F4F4'));
    for (let x = 3; x <= 6; x++) c.px(x, 42, hexc('#5C3A1E'));
    c.px(2, 44, hexc('#F4F4F4')); c.px(2, 45, hexc('#F4F4F4'));
  } else if (hold === 'phone') {
    for (const [x, y] of rect(3, 41, 6, 48)) c.px(x, y, OUTLINE_C);
    for (const [x, y] of rect(4, 42, 5, 47)) c.px(x, y, hexc('#64BA00'));
  } else if (hold === 'duck') {
    for (const [x, y] of rect(2, 42, 6, 46)) c.px(x, y, hexc('#F7D21B'));
    c.px(1, 44, hexc('#F96E10')); c.px(0, 44, hexc('#F96E10')); c.px(4, 43, OUTLINE_C);
  } else if (hold === 'pager') {
    for (const [x, y] of rect(7, 44, 11, 47)) c.px(x, y, OUTLINE_C);
    for (const [x, y] of rect(8, 45, 10, 46)) c.px(x, y, hexc('#64BA00'));
  }
  c.oy = 0;
  c.outline();
  return c.toRGBA();
}

// Small cache so a walk cycle doesn't recompose every frame.
const cache = new Map();
function composed(cfg, pose) {
  const key = JSON.stringify([cfg, pose]);
  let v = cache.get(key);
  if (!v) { v = composeHero(cfg, pose); cache.set(key, v); if (cache.size > 64) cache.delete(cache.keys().next().value); }
  return v;
}

/** Paints the hero at (x, y) with `scale` px per sprite pixel; flip mirrors about the sprite's centre. */
export function drawHero(ctx, cfg, pose, x, y, scale = 1, { flip = false } = {}) {
  const px = composed(cfg, pose);
  for (let r = 0; r < HERO_H; r++) for (let c = 0; c < HERO_W; c++) {
    const i = (r * HERO_W + c) * 4;
    if (!px[i + 3]) continue;
    const col = flip ? HERO_W - 1 - c : c;
    ctx.fillStyle = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
    ctx.fillRect(x + col * scale, y + r * scale, scale, scale);
  }
}

/** Paints only `crop` ({x,y,w,h} in sprite px) at (0,0) — picker thumbnails. */
export function drawHeroCrop(ctx, cfg, crop, scale = 1, pose = 'idle') {
  const px = composed(cfg, pose);
  for (let r = 0; r < crop.h; r++) for (let c = 0; c < crop.w; c++) {
    const sx = crop.x + c, sy = crop.y + r;
    if (sx < 0 || sy < 0 || sx >= HERO_W || sy >= HERO_H) continue;
    const i = (sy * HERO_W + sx) * 4;
    if (!px[i + 3]) continue;
    ctx.fillStyle = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
    ctx.fillRect(c * scale, r * scale, scale, scale);
  }
}
