// Hero sprite renderer — a line-for-line port of tools/hero_gen.py at the era-look size (Warp brief 09).
// Part masks → shading pass → detail stamps → seams between parts → silhouette outline. The Python file
// is the reference; tests/hero.test.js proves this port byte for byte against its fixtures.
// The canvas (Grid), the colour ramps, the mask helpers and the blitter are exported for
// js/engine/hero-side.js, which is the same renderer seen from the side; nothing here may change the
// front view's output.

import { BODIES, DRAWSTRINGS, EYES, HAIR, HC_MARK, HC_MARK_AT, HC_MARK_PIXELS, HOODIE, JEANS, OUTLINE, PJ, SIT_CUT, SIT_DY, SKIN, SOLE, TOP, WALK } from './hero-parts.js';

export const HERO_W = 56;
export const HERO_H = 144;
export const HEAD_CROP = { x: 8, y: 4, w: 40, h: 42 };

export function hexc(s) {
  const h = s.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
}
export function ramp(base, light = 1.22, shade = 0.74, dark = 0.5) {
  const [r, g, b] = hexc(base);
  const f = (k) => [Math.min(255, Math.trunc(r * k)), Math.min(255, Math.trunc(g * k)), Math.min(255, Math.trunc(b * k)), 255];
  return { L: f(light), B: [r, g, b, 255], S: f(shade), D: f(dark) };
}
export const OUTLINE_C = hexc(OUTLINE);
export const SHOE = ramp('#2E2E36', 1.6, 0.8);
export const SOLE_C = hexc(SOLE);
export const GLASSES = [30, 30, 42, 255];    // dark frames: they must read as glasses on every skin tone
export const EYE_WHITE = hexc('#F2F2F2');

export class Grid {
  constructor() {
    this.part = Array.from({ length: HERO_H }, () => new Array(HERO_W).fill(null));
    this.col = Array.from({ length: HERO_H }, () => new Array(HERO_W).fill(null));
    this.oy = TOP;                                               // vertical offset for fills/px (TOP, plus the walk bob)
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
  /** A dark line where part `a` meets part `b` (on a's side): the outline between parts of the figure. */
  seam(a, b) {
    for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) {
      if (this.part[y][x] !== a) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < HERO_W && ny >= 0 && ny < HERO_H && this.part[ny][nx] === b) { this.col[y][x] = OUTLINE_C; break; }
      }
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

export function rect(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}
export function ellipse(cx, cy, rx, ry) {
  const out = [];
  for (let y = Math.trunc(cy - ry); y <= Math.trunc(cy + ry); y++)
    for (let x = Math.trunc(cx - rx); x <= Math.trunc(cx + rx); x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0) out.push([x, y]);
  return out;
}

/** Composes the 56×144 RGBA sprite for a hero config and pose. */
export function composeHero(cfg, pose = 'idle', outfit = 'hoodie') {
  const { body = 'masc', skin = 0, hair = 'black', style = 'standard', beard = 'none',
    hoodie = 'ink', jeans = 'indigo', glasses = 'none' } = cfg;
  const b = BODIES[body]; const c = new Grid();
  const skinR = ramp(SKIN[skin], 1.12, 0.8, 0.62);
  const hairR = ramp(HAIR[hair], 1.35, 0.7);
  const pj = outfit === 'pj', sit = pose === 'situp';
  const hoodR = ramp(pj ? PJ.top : HOODIE[hoodie]); const jeanR = ramp(pj ? PJ.bottom : JEANS[jeans], 1.25, 0.72);
  const shoeR = pj ? skinR : SHOE;                                  // pyjamas go barefoot
  const beardR = ramp(HAIR[hair], 1.3, 0.7);
  const cx = 27.5;
  const [legLdx, legRdx, shoeLdx, shoeRdx, bob0, armLdy, armRdy] = WALK[pose] || WALK.idle;
  const bob = sit ? SIT_DY : bob0;                                  // sitting up: the whole upper body sits lower

  // ---- legs & shoes (back; never bob) ----
  const legTop = 90, legBot = 133;
  c.oy = TOP;
  if (!sit) {                                                       // sitting up: the legs are under the blanket
    c.fill('legL', rect(b.legL[0] + legLdx, legTop, b.legL[1] + legLdx, legBot));
    c.fill('legR', rect(b.legR[0] + legRdx, legTop, b.legR[1] + legRdx, legBot));
    c.fill('shoeL', rect(b.shoeL[0] + shoeLdx, 134, b.shoeL[1] + shoeLdx, 139));
    c.fill('shoeR', rect(b.shoeR[0] + shoeRdx, 134, b.shoeR[1] + shoeRdx, 139));
    c.fill('legL', rect(b.hip[0], legTop, 27, 99)); c.fill('legR', rect(28, legTop, b.hip[1], 99));   // crotch: jeans continuous above row 100
  }

  // ---- everything above the legs bobs with the walk ----
  c.oy = TOP + bob;
  if (!pj) c.fill('hood', rect(17, 36, 38, 46));                   // pyjamas have no hood
  // back hair: the mass behind the head and neck (the body is drawn over it)
  if (style === 'shoulder') c.fill('hair', ellipse(cx, 20.0, b.headRx + 5.2, 16.0).concat(rect(12, 20, 43, 43)));
  else if (style === 'long') c.fill('hair', ellipse(cx, 20.0, b.headRx + 5.8, 16.4).concat(rect(10, 20, 45, 47)));
  const slope = [5, 3, 1, 0];
  for (let y = 40; y <= 92; y++) {
    let span;
    if (y <= 43) span = [b.shoulder[0] + slope[y - 40], b.shoulder[1] - slope[y - 40]];   // rounded shoulders
    else if (y <= 58) span = b.torso;
    else if (y <= 76) span = b.waist;
    else span = b.hip;
    c.fill('torso', rect(span[0], y, span[1], y));
  }
  // arms (each swings by its own dy), hands below the sleeves
  c.fill('armL', rect(b.armL[0], 44 + armLdy, b.armL[1], 86 + armLdy)); c.fill('armR', rect(b.armR[0], 44 + armRdy, b.armR[1], 86 + armRdy));
  c.fill('handL', rect(b.armL[0], 87 + armLdy, b.armL[1], 95 + armLdy)); c.fill('handR', rect(b.armR[0], 87 + armRdy, b.armR[1], 95 + armRdy));
  // the hood's opening: a V of the hood's inside at the neck of the hoodie
  if (!pj) for (let i = 0; i < 6; i++) c.fill('hood', rect(22 + i, 40 + i, 33 - i, 40 + i));
  c.fill('neck', rect(b.neck[0], 33, b.neck[1], 41));
  c.fill('head', ellipse(cx, 21.5, b.headRx, 13.5));
  c.fill('head', rect(16, 17, 39, 28));                            // cheeks out to the ears: no gap between ear and face
  c.fill('head', rect(17, 29, 38, 30).concat(rect(18, 31, 37, 32), rect(20, 33, 35, 34), rect(23, 35, 32, 35)));   // jaw & chin
  c.fill('earL', rect(14, 19, 15, 24)); c.fill('earR', rect(40, 19, 41, 24));

  // ---- hair in front of the head ----
  // standard: a cap with short sideburns, all inside the head's outline. shoulder/long: the cap, plus locks that
  // fall in front of the shoulders (the mass behind the head was filled before the body). mohawk: a flat-topped
  // ridge on a buzzed scalp — the head stays round. fro: one big round mass.
  let hm = [];
  c.fill('head', ellipse(cx, 13.5, b.headRx + 1.0, 7.5).concat(rect(16, 12, 39, 16)));   // a full round skull under any hair
  if (style === 'mohawk') {
    hm = rect(24, 1, 31, 10);                                          // the ridge stops above the forehead
  } else if (style === 'fro') {
    hm = ellipse(cx, 16.0, b.headRx + 8.5, 16.0).filter(([x, y]) => !(y >= 15 && x >= 18 && x <= 37));
  } else {
    hm = ellipse(cx, 12.0, b.headRx + 1.2, 8.5);                       // crown, with some height to it
    hm = hm.concat(rect(16, 12, 39, 16));                              // down to the temples
    if (style === 'standard') hm = hm.concat(rect(16, 17, 17, 22), rect(38, 17, 39, 22));        // sideburns, inside the head's outline
    else if (style === 'shoulder') hm = hm.concat(rect(12, 12, 17, 43), rect(38, 12, 43, 43));   // locks to the shoulders, six wide
    else if (style === 'long') hm = hm.concat(rect(10, 14, 17, 63), rect(38, 14, 45, 63), rect(12, 64, 17, 67), rect(38, 64, 43, 67));   // down over the chest
    hm = hm.filter(([x, y]) => !(y >= 13 && x >= 18 && x <= 37));     // hairline: four rows of forehead above the brows
  }
  c.fill('hair', hm);

  // ---- shading ----
  c.shade('legL', jeanR, 2, 3); c.shade('legR', jeanR, 2, 3);
  c.shade('shoeL', shoeR, 2, 2); c.shade('shoeR', shoeR, 2, 2);
  c.shade('hood', { L: hoodR.S, B: hoodR.D, S: hoodR.D, D: hoodR.D }, 0, 0, false);
  c.shade('torso', hoodR, 3, 5); c.shade('armL', hoodR, 2, 2); c.shade('armR', hoodR, 2, 3);
  c.shade('handL', skinR, 1, 2); c.shade('handR', skinR, 1, 2);
  c.shade('neck', { L: skinR.S, B: skinR.S, S: skinR.D, D: skinR.D }, 0, 2, false);
  c.shade('head', skinR, 2, 3); c.shade('earL', skinR, 0, 1); c.shade('earR', skinR, 0, 1);
  c.shade('hair', hairR, 3, 5);
  if (pj) {                                                         // pyjama stripes: every fourth column of the cloth
    const stripe = hexc(PJ.stripe);
    for (let y = 0; y < HERO_H; y++) for (let x = 1; x < HERO_W; x += 4) {
      const p = c.part[y][x];
      if (p === 'torso' || p === 'armL' || p === 'armR' || p === 'legL' || p === 'legR') c.col[y][x] = stripe;
    }
  }

  // ---- details ----
  for (let y = 46; y <= 88; y++) { c.px(b.torso[0], y, hoodR.S); c.px(b.torso[1], y, hoodR.D); }   // the sleeves' inner lines
  if (!pj) {                                                        // hem, pocket, drawstrings and the mark: hoodie only
    for (let x = b.hip[0]; x <= b.hip[1]; x++) { c.px(x, 91, hoodR.D); c.px(x, 92, hoodR.D); }
    const px0 = b.waist[0] + 5, px1 = b.waist[1] - 5;                                    // the kangaroo pocket
    for (let x = px0; x <= px1; x++) { c.px(x, 75, hoodR.S); c.px(x, 89, hoodR.S); }
    for (let y = 75; y <= 89; y++) { c.px(px0, y, hoodR.S); c.px(px1, y, hoodR.S); }
    for (let i = 0; i < 4; i++) { c.px(px0 + 1 + i, 76 + i, hoodR.S); c.px(px1 - 1 - i, 76 + i, hoodR.S); }   // the slanted openings
    for (const x of DRAWSTRINGS) {
      for (let y = 46; y <= 61; y++) c.px(x, y, hoodR.L);
      c.px(x, 62, hoodR.D);                                                                // the aglet
    }
    const [ax, ay] = HC_MARK_AT;
    for (const [x, y, k] of HC_MARK_PIXELS) c.px(ax + x, ay + y, hexc(HC_MARK[k]));      // Honeycomb-branded hoodie
  }
  // hands: a line between the fingers and the thumb
  for (const [x0, x1, dy] of [[b.armL[0], b.armL[1], armLdy], [b.armR[0], b.armR[1], armRdy]]) {
    for (let x = x0 + 1; x < x1; x++) c.px(x, 92 + dy, skinR.S);
  }
  // knees, seams, cuffs and soles: on the legs, which never bob
  c.oy = TOP;
  if (!sit) {
    for (const [l0, l1, dx] of [[b.legL[0], b.legL[1], legLdx], [b.legR[0], b.legR[1], legRdx]]) {
      for (let x = l0 + dx + 1; x < l1 + dx; x++) c.px(x, 112, jeanR.S);                                        // knee
      for (let x = l0 + dx + 1; x < l1 + dx; x++) { c.px(x, 131, jeanR.L); c.px(x, 132, jeanR.S); c.px(x, 133, jeanR.S); }   // cuff
    }
    for (let y = 100; y <= 130; y++) { c.px(b.legL[0] + legLdx + 2, y, jeanR.L); c.px(b.legR[1] + legRdx - 2, y, jeanR.L); }   // seams
    if (!pj) {
      for (const [s0, s1, dx] of [[b.shoeL[0], b.shoeL[1], shoeLdx], [b.shoeR[0], b.shoeR[1], shoeRdx]]) {
        for (let x = s0 + dx + 1; x < s1 + dx; x++) { c.px(x, 138, SOLE_C); c.px(x, 139, SOLE_C); }   // soles
      }
    }
  }
  c.oy = TOP + bob;
  // face
  const brow = hairR.D;
  for (const ex of EYES) {
    for (let x = ex; x < ex + 4; x++) c.px(x, 17, brow);
    for (const y of [19, 20]) for (let x = ex; x < ex + 4; x++) c.px(x, y, EYE_WHITE);
    c.px(ex + 1, 19, OUTLINE_C); c.px(ex + 1, 20, OUTLINE_C); c.px(ex + 2, 20, OUTLINE_C);   // the pupil, with a glint top right
  }
  for (let y = 22; y <= 25; y++) c.px(28, y, skinR.S);                                      // the nose's shaded side
  c.px(26, 26, skinR.S); c.px(27, 26, skinR.D); c.px(28, 26, skinR.D); c.px(29, 26, skinR.S);   // nostrils
  for (let x = 25; x <= 30; x++) c.px(x, 29, skinR.D);                                      // mouth
  for (let x = 26; x <= 29; x++) c.px(x, 30, skinR.S);                                      // the lower lip
  // hair texture: buzzed sides for the mohawk, dark curls dotted through the fro, a few strands otherwise
  if (style === 'mohawk') {
    const buzz = skinR.B.map((a, i) => Math.floor((a * 11 + hairR.B[i] * 9) / 20));      // stubble: skin showing through
    for (let y = 6; y <= 16; y++) for (let x = 14; x <= 41; x++) if (c.part[y + c.oy]?.[x] === 'head' && !(y >= 13 && x >= 18 && x <= 37)) c.px(x, y, buzz);
  }
  if (style === 'fro') for (const [x, y] of [[18, 4], [33, 2], [12, 12], [43, 10], [24, 8], [37, 9], [10, 24], [45, 22], [16, 30], [39, 29], [28, 3], [20, 14]]) if (c.part[y + c.oy]?.[x] === 'hair') c.px(x, y, hairR.D);   // a few darker curls
  if (style === 'standard' || style === 'shoulder' || style === 'long') for (const [x, y] of [[22, 6], [23, 7], [30, 5], [31, 6], [26, 9]]) if (c.part[y + c.oy]?.[x] === 'hair') c.px(x, y, hairR.D);   // a parting's worth of strands
  // beard (takes the hair colour): short = close-cropped over the jaw with a solid chin; long = full, down the chest
  if (beard === 'short') {
    const pts = rect(18, 26, 19, 30).concat(rect(36, 26, 37, 30),         // sideburns down the jaw
      rect(22, 27, 33, 28),                                               // moustache (the mouth is row 29)
      [[22, 29], [23, 29], [32, 29], [33, 29], [20, 30], [21, 30], [22, 30], [33, 30], [34, 30], [35, 30]],   // round the mouth
      rect(20, 31, 35, 32), rect(21, 33, 34, 34), rect(23, 35, 32, 35));  // jaw line and chin
    for (const [x, y] of pts) c.px(x, y, x >= 33 ? beardR.S : beardR.B);
  } else if (beard === 'long') {
    for (const [x, y] of rect(18, 26, 37, 45)) {
      if (y >= 29 && y <= 30 && x >= 24 && x <= 31) continue;
      if (y >= 38 && (x < 20 + (y - 38) || x > 35 - (y - 38))) continue;
      c.px(x, y, x >= 34 ? beardR.S : beardR.B);
    }
    for (let y = 26; y <= 32; y++) c.px(18, y, beardR.L);
    for (const [x, y] of [[23, 36], [28, 40], [32, 37], [26, 43]]) c.px(x, y, beardR.D);   // a few darker curls
  }
  // glasses: a dark frame about each eye (the eye and a row of skin show inside), a bridge, arms to the ears
  if (glasses === 'glasses') {
    const frame = [];
    for (const ex of EYES) {
      const x0 = ex - 1, x1 = ex + 4;
      for (let x = x0 + 1; x < x1; x++) frame.push([x, 17], [x, 22]);
      for (let y = 18; y <= 21; y++) frame.push([x0, y], [x1, y]);
      for (let x = x0 + 1; x < x1; x++) c.px(x, 18, skinR.L);                               // the brow sits behind the lens
    }
    for (let x = EYES[0] + 5; x < EYES[1] - 1; x++) frame.push([x, 19]);                    // bridge
    frame.push([16, 19], [17, 19], [38, 19], [39, 19]);                                     // arms
    for (const [x, y] of frame) c.px(x, y, GLASSES);
  }
  if (sit) for (let y = TOP + SIT_DY + SIT_CUT + 1; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) { c.part[y][x] = null; c.col[y][x] = null; }   // under the covers from the waist down
  c.oy = 0;
  c.seam('torso', 'armL'); c.seam('torso', 'armR');                 // the sleeves read as sleeves
  c.seam('legL', 'legR');                                           // the legs part
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

/**
 * Paints a composed sprite at (x, y), `scale` scene px per sprite px, nearest neighbour: the sprite covers
 * round(HERO_W × scale) by round(HERO_H × scale) px, each destination pixel taking the sprite pixel under its
 * centre, so a fractional scale (a room's heroScale) stays crisp. Runs of one colour go as one fillRect.
 * flip mirrors about the sprite's centre.
 */
export function blit(ctx, px, x, y, scale = 1, flip = false) {
  const dw = Math.round(HERO_W * scale), dh = Math.round(HERO_H * scale);
  for (let dr = 0; dr < dh; dr++) {
    const sr = Math.min(HERO_H - 1, Math.floor((dr + 0.5) / scale));
    let run = null, from = 0;
    for (let dc = 0; dc <= dw; dc++) {
      let col = null;
      if (dc < dw) {
        const sc = Math.min(HERO_W - 1, Math.floor((dc + 0.5) / scale));
        const i = (sr * HERO_W + (flip ? HERO_W - 1 - sc : sc)) * 4;
        if (px[i + 3]) col = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
      }
      if (run !== null && run !== col) { ctx.fillStyle = run; ctx.fillRect(x + from, y + dr, dc - from, 1); run = null; }
      if (col !== null && run === null) { run = col; from = dc; }
    }
  }
}

/** Paints the hero at (x, y) with `scale` px per sprite pixel; flip mirrors about the sprite's centre. */
export function drawHero(ctx, cfg, pose, x, y, scale = 1, { flip = false, outfit = 'hoodie' } = {}) {
  blit(ctx, composed(cfg, pose, outfit), x, y, scale, flip);
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
