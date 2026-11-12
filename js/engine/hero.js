// Hero sprite renderer — a line-for-line port of tools/hero_gen.py.
// Part masks → shading pass → detail stamps → silhouette outline. The Python file is the
// reference; tests/hero.test.js proves this port byte for byte against its fixtures.

import { BODIES, HAIR, HC_MARK, HC_MARK_PIXELS, HOODIE, JEANS, OUTLINE, PJ, SIT_DY, SKIN, WALK } from './hero-parts.js';

export const HERO_W = 28;
export const HERO_H = 72;
export const HEAD_CROP = { x: 4, y: 0, w: 20, h: 21 };

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
const GLASSES = [30, 30, 42, 255];           // dark frames: they must read as glasses on every skin tone
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
export function composeHero(cfg, pose = 'idle', outfit = 'hoodie') {
  const { body = 'masc', skin = 0, hair = 'black', style = 'standard', beard = 'none',
    hoodie = 'ink', jeans = 'indigo', glasses = 'none' } = cfg;
  const b = BODIES[body]; const c = new Grid();
  const skinR = ramp(SKIN[skin], 1.12, 0.8, 0.62);
  const hairR = ramp(HAIR[hair], 1.35, 0.7);
  const pj = outfit === 'pj', sit = pose === 'situp';
  const hoodR = ramp(pj ? PJ.top : HOODIE[hoodie]); const jeanR = ramp(pj ? PJ.bottom : JEANS[jeans], 1.25, 0.72);
  const beardR = ramp(HAIR[hair], 1.3, 0.7);
  const cx = 13.5;
  const shoeR = pj ? skinR : SHOE;                                  // pyjamas go barefoot
  const [legLdx, legRdx, shoeLdx, shoeRdx, bob0, armLdy, armRdy] = WALK[pose] || WALK.idle;
  const bob = sit ? SIT_DY : bob0;                                  // sitting up: the whole upper body sits lower

  // ---- legs & shoes (back; never bob) ----
  const legTop = 45, legBot = 66;
  c.oy = 0;
  if (!sit) {                                                       // sitting up: the legs are under the blanket
    c.fill('legL', rect(b.legL[0] + legLdx, legTop, b.legL[1] + legLdx, legBot));
    c.fill('legR', rect(b.legR[0] + legRdx, legTop, b.legR[1] + legRdx, legBot));
    c.fill('shoeL', rect(b.shoeL[0] + shoeLdx, 66, b.shoeL[1] + shoeLdx, 71));
    c.fill('shoeR', rect(b.shoeR[0] + shoeRdx, 66, b.shoeR[1] + shoeRdx, 71));
    c.fill('legL', rect(b.hip[0], legTop, 13, 51)); c.fill('legR', rect(14, legTop, b.hip[1], 51));
  }

  // ---- everything above the legs bobs with the walk ----
  c.oy = bob;
  if (!pj) c.fill('hood', rect(9, 18, 18, 22));                    // pyjamas have no hood
  // back hair: the mass behind the head and neck (the body is drawn over it)
  if (style === 'shoulder') c.fill('hair', ellipse(cx, 10.0, b.headRx + 2.6, 8.0).concat(rect(6, 10, 21, 21)));
  else if (style === 'long') c.fill('hair', ellipse(cx, 10.0, b.headRx + 2.9, 8.2).concat(rect(5, 10, 22, 23)));
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
  c.fill('head', rect(8, 9, 19, 14));                              // cheeks out to the ears: no gap between ear and face
  c.fill('earL', rect(7, 10, 7, 12)); c.fill('earR', rect(20, 10, 20, 12));

  // ---- hair in front of the head ----
  // standard: a cap with short sideburns, all inside the head's outline. shoulder/long: the cap, plus locks that
  // fall in front of the shoulders (the mass behind the head was filled before the body). mohawk: a flat-topped
  // ridge on a buzzed scalp — the head stays round. fro: one big round mass.
  let hm = [];
  if (style === 'mohawk') {
    c.fill('head', ellipse(cx, 7.0, b.headRx + 0.8, 3.8).concat(rect(8, 6, 19, 8)));   // a full round skull under the buzz
    hm = rect(12, 2, 15, 7);
  } else if (style === 'fro') {
    hm = ellipse(cx, 8.0, b.headRx + 4.2, 8.2).filter(([x, y]) => !(y >= 8 && x >= 9 && x <= 18));
  } else {
    hm = ellipse(cx, 7.0, b.headRx + 0.8, 3.8);                       // crown
    hm = hm.concat(rect(8, 6, 19, 8));                                 // fringe over the forehead
    if (style === 'standard') hm = hm.concat(rect(8, 9, 8, 11), rect(19, 9, 19, 11));            // sideburns, inside the head's outline
    else if (style === 'shoulder') hm = hm.concat(rect(6, 6, 8, 21), rect(19, 6, 21, 21));       // locks to the shoulders, three wide
    else if (style === 'long') hm = hm.concat(rect(5, 7, 8, 31), rect(19, 7, 22, 31), rect(6, 32, 8, 33), rect(19, 32, 21, 33));   // down over the chest
  }
  c.fill('hair', hm);

  // ---- shading ----
  c.shade('legL', jeanR); c.shade('legR', jeanR);
  c.shade('shoeL', shoeR, 1, 1); c.shade('shoeR', shoeR, 1, 1);
  c.shade('hood', { L: hoodR.S, B: hoodR.D, S: hoodR.D, D: hoodR.D }, 0, 0, false);
  c.shade('torso', hoodR, 2, 3); c.shade('armL', hoodR, 1, 1); c.shade('armR', hoodR, 1, 2);
  c.shade('handL', skinR, 1, 1); c.shade('handR', skinR, 1, 1);
  c.shade('neck', { L: skinR.S, B: skinR.S, S: skinR.D, D: skinR.D }, 0, 1, false);
  c.shade('head', skinR, 1, 2); c.shade('earL', skinR, 0, 0); c.shade('earR', skinR, 0, 1);
  c.shade('hair', hairR, 2, 3);
  if (pj) {                                                         // pyjama stripes: every third row of the cloth
    const stripe = hexc(PJ.stripe);
    for (let y = 0; y < HERO_H; y += 3) for (let x = 0; x < HERO_W; x++) {
      const p = c.part[y][x];
      if (p === 'torso' || p === 'armL' || p === 'armR' || p === 'legL' || p === 'legR') c.col[y][x] = stripe;
    }
  }

  // ---- details ----
  for (let y = 23; y <= 43; y++) { c.px(b.torso[0], y, hoodR.S); c.px(b.torso[1], y, hoodR.D); }
  if (!pj) {                                                        // hem, pocket, drawstrings: hoodie only
    for (let x = b.hip[0]; x <= b.hip[1]; x++) c.px(x, 45, hoodR.D);
    const px0 = b.waist[0] + 2, px1 = b.waist[1] - 2;
    for (let x = px0; x <= px1; x++) { c.px(x, 37, hoodR.S); c.px(x, 43, hoodR.S); }
    for (let y = 37; y <= 43; y++) { c.px(px0, y, hoodR.S); c.px(px1, y, hoodR.S); }
    for (let y = 22; y <= 30; y++) { c.px(12, y, hoodR.L); c.px(15, y, hoodR.L); }
    for (const [x, y, k] of HC_MARK_PIXELS) c.px(x, y, hexc(HC_MARK[k]));          // Honeycomb-branded hoodie
  }
  if (!sit) {
    for (let x = b.legL[0] + 1; x < b.legL[1]; x++) c.px(x, 57, jeanR.S);
    for (let x = b.legR[0] + 1; x < b.legR[1]; x++) c.px(x, 57, jeanR.S);
  }
  // face
  const brow = hairR.D;
  for (const x of [9, 10, 11]) c.px(x, 9, brow);
  for (const x of [16, 17, 18]) c.px(x, 9, brow);
  c.px(10, 10, EYE_WHITE); c.px(11, 10, OUTLINE_C); c.px(17, 10, EYE_WHITE); c.px(16, 10, OUTLINE_C);
  c.px(14, 12, skinR.S); c.px(14, 13, skinR.S); c.px(13, 13, skinR.S);
  for (const x of [12, 13, 14, 15]) c.px(x, 15, skinR.D);
  // hair texture: buzzed temples for the mohawk, dark curls dotted through the fro
  if (style === 'mohawk') {
    const buzz = skinR.B.map((a, i) => Math.floor((a * 11 + hairR.B[i] * 9) / 20));      // stubble: skin showing through
    for (let y = 4; y <= 8; y++) for (let x = 7; x <= 20; x++) if (c.part[y + c.oy]?.[x] === 'head' && !(y === 8 && x >= 10 && x <= 17)) c.px(x, y, buzz);
  }
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
  // glasses: a dark round frame about each eye (the eye and a row of skin show inside), a bridge, arms to the ears
  if (glasses === 'glasses') {
    const frame = [];
    for (const x0 of [9, 15]) {                                                           // lenses over the eyes at 10-11 and 16-17
      frame.push([x0 + 1, 8], [x0 + 2, 8], [x0 + 1, 11], [x0 + 2, 11], [x0, 9], [x0, 10], [x0 + 3, 9], [x0 + 3, 10]);
      for (const x of [x0 + 1, x0 + 2]) c.px(x, 9, skinR.L);                              // the brow sits behind the lens
    }
    frame.push([13, 9], [14, 9], [8, 9], [19, 9]);                                        // bridge, arms
    for (const [x, y] of frame) c.px(x, y, GLASSES);
  }
  c.oy = 0;
  c.outline();
  return c.toRGBA();
}

// Small cache so a walk cycle doesn't recompose every frame.
const cache = new Map();
function composed(cfg, pose, outfit = 'hoodie') {
  const key = JSON.stringify([cfg, pose, outfit]);
  let v = cache.get(key);
  if (!v) { v = composeHero(cfg, pose, outfit); cache.set(key, v); if (cache.size > 64) cache.delete(cache.keys().next().value); }
  return v;
}

/** Paints the hero at (x, y) with `scale` px per sprite pixel; flip mirrors about the sprite's centre. */
export function drawHero(ctx, cfg, pose, x, y, scale = 1, { flip = false, outfit = 'hoodie' } = {}) {
  const px = composed(cfg, pose, outfit);
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
