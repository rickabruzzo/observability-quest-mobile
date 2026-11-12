// Hero sprite, seen from the side — a line-for-line port of hero_side() in tools/hero_gen.py.
// Same 28×72 canvas, same colour ramps, same shade/outline passes as the front view; the figure faces
// right and the game mirrors it to walk left. The Python file is the reference; tests/hero-side.test.js
// proves this port byte for byte against the fixtures in tests/fixtures/hero-side.
//
// Rounding: every joint here goes through _r — floor(v + 0.5), half up — because Python's round() is
// banker's rounding and would put a limb on a different pixel. hero_gen._r is the same rule.

import { ellipse, EYE_WHITE, GLASSES, Grid, HERO_H, HERO_W, hexc, OUTLINE_C, ramp, rect, SHOE } from './hero.js';
import { FORE, HAIR, HC_MARK, HC_MARK_PIXELS, HOODIE, JEANS, PJ, SHIN, SIDE_BOB, SIDE_LEG, SIDE_POSES, SKIN, THIGH, UPPER } from './hero-parts.js';

export { SIDE_POSES, HERO_W, HERO_H };                  // the profile shares the front view's 28×72 canvas

// The profile's shoes end one row higher than the front view's, so a hero drawn at the same y would
// hop a pixel each time it stopped walking. Screens add this when they draw the side view against the
// floor; tests/hero-side.test.js keeps the two baselines in step.
export const SIDE_FOOT_DY = 1;

/** Round half up — the one rule the whole profile view uses, in both languages (hero_gen._r). */
const _r = (v) => Math.floor(v + 0.5);
const rad = (deg) => (deg * Math.PI) / 180;

/** A thick segment from (x, y), `deg` from straight down. Returns [pixels, end point]. */
function limb(x, y, length, deg, width) {
  const dx = Math.sin(rad(deg)) * length, dy = Math.cos(rad(deg)) * length;
  const steps = Math.max(1, _r(length));
  const seen = new Set(), px = [];
  for (let i = 0; i <= steps; i++) {
    const cx = x + (dx * i) / steps, cy = y + (dy * i) / steps;
    for (let w = 0; w < width; w++) {
      const p = [_r(cx - (width - 1) / 2 + w), _r(cy)];
      const k = `${p[0]},${p[1]}`;
      if (!seen.has(k)) { seen.add(k); px.push(p); }
    }
  }
  return [px, [x + dx, y + dy]];
}

function leg(c, tag, hipX, hipY, thigh, shin, width = 5) {
  const [up, knee] = limb(hipX, hipY, THIGH, thigh, width);
  const [low, ankle] = limb(knee[0], knee[1], SHIN, shin, width);
  c.fill('leg' + tag, up.concat(low));
  const ax = _r(ankle[0]), ay = _r(ankle[1]);
  const lift = shin < -30 ? 1 : 0;                                    // a trailing foot points its toe down
  c.fill('shoe' + tag, rect(ax - 2, ay, ax + 4, ay + 3).concat(rect(ax + 3, ay + 1 + lift, ax + 5, ay + 3 + lift)));
}

function arm(c, tag, shX, shY, swing, width = 4) {
  const [up, elbow] = limb(shX, shY, UPPER, swing, width);
  const [low, wrist] = limb(elbow[0], elbow[1], FORE, swing + (swing >= 0 ? 18 : 8), width);   // the elbow stays a little bent
  c.fill('arm' + tag, up.concat(low));
  const wx = _r(wrist[0]), wy = _r(wrist[1]);
  c.fill('hand' + tag, rect(wx - 1, wy, wx + 2, wy + 3));
}

const flat = (col) => ({ L: col, B: col, S: col, D: col });

/** Composes the 28×72 RGBA profile sprite for a hero config and pose. Unknown poses stand. */
export function composeHeroSide(cfg, pose = 'stand', outfit = 'hoodie') {
  const { body = 'masc', skin = 0, hair = 'black', style = 'standard', beard = 'none',
    hoodie = 'ink', jeans = 'indigo', glasses = 'none' } = cfg;
  const c = new Grid();
  const skinR = ramp(SKIN[skin], 1.12, 0.8, 0.62);
  const hairR = ramp(HAIR[hair], 1.35, 0.7);
  const pj = outfit === 'pj';
  const hoodR = ramp(pj ? PJ.top : HOODIE[hoodie]); const jeanR = ramp(pj ? PJ.bottom : JEANS[jeans], 1.25, 0.72);
  const shoeR = pj ? skinR : SHOE;                                  // pyjamas go barefoot
  const i = SIDE_POSES.indexOf(pose) - 1;
  const standing = i < 0;                                           // 'stand', and anything we do not know
  const near = standing ? [0, 0] : SIDE_LEG[i];
  const far = standing ? [0, 0] : SIDE_LEG[(i + 4) % 8];
  const bob = standing ? 0 : SIDE_BOB[i];
  const swing = standing ? 4 : -near[0] * 0.9;                      // each arm swings against its own leg
  const slim = body === 'fem';
  const t0 = slim ? 10 : 9, t1 = 18;                                // torso, side on

  // far arm and far leg first (darker), then the near leg; shoes point the way the hero faces
  c.oy = bob;
  if (!standing) arm(c, 'B', 14, 23, -swing);
  leg(c, 'B', 13, 45, far[0], far[1]);
  leg(c, 'F', 14, 45, near[0], near[1]);
  // back hair behind the body, hood behind the neck
  if (style === 'shoulder') c.fill('hair', rect(7, 8, 12, 21));
  else if (style === 'long') c.fill('hair', rect(6, 8, 12, 31));
  if (!pj) c.fill('hood', rect(7, 18, 12, 23));
  c.fill('torso', rect(t0, 20, t1, 45).concat(rect(t0 + 1, 19, t1 - 1, 19)));
  c.fill('neck', rect(12, 17, 15, 20));
  // head in profile: skull, face plane, nose, chin
  c.fill('head', ellipse(13.5, 10.5, 5.6, 6.6).concat(rect(13, 13, 18, 17), rect(14, 18, 17, 18)));
  c.fill('head', [[19, 11], [19, 12], [20, 12], [19, 13]]);         // nose
  c.fill('ear', rect(12, 10, 13, 12));
  // hair
  const skull = ellipse(13.5, 9.0, 6.2, 6.0);
  let hm;
  if (style === 'mohawk') {
    hm = rect(9, 1, 17, 5);                                         // the ridge, seen along its length
  } else if (style === 'fro') {
    hm = ellipse(12.0, 8.0, 9.2, 8.4).filter(([x, y]) => !(x >= 15 && y >= 8));
  } else {
    hm = skull.filter(([x, y]) => y <= 6 || x <= 11);                // crown and the back of the head
    hm = hm.filter(([x, y]) => !(x >= 13 && y >= 7));                // forehead and face stay clear
    if (style === 'standard') hm = hm.concat(rect(11, 7, 12, 9));    // sideburn in front of the ear
    else if (style === 'shoulder') hm = hm.concat(rect(7, 8, 11, 21), rect(12, 7, 12, 9));
    else if (style === 'long') hm = hm.concat(rect(6, 8, 11, 31), rect(12, 7, 12, 9));
  }
  c.fill('hair', hm);
  arm(c, 'F', 13, 23, swing);                                       // the near arm, over the torso

  c.shade('legB', { L: jeanR.S, B: jeanR.S, S: jeanR.S, D: jeanR.D }, 0, 1, false);
  c.shade('shoeB', flat(shoeR.S), 0, 0, false);
  c.shade('legF', jeanR, 1, 1, false); c.shade('shoeF', shoeR, 1, 1);
  c.shade('hood', { L: hoodR.S, B: hoodR.D, S: hoodR.D, D: hoodR.D }, 0, 0, false);
  c.shade('torso', hoodR, 1, 2, false);
  c.shade('armB', flat(hoodR.D), 0, 0, false); c.shade('handB', flat(skinR.S), 0, 0, false);
  c.shade('armF', { L: hoodR.S, B: hoodR.B, S: hoodR.S, D: hoodR.D }, 1, 1, false);
  c.shade('handF', skinR, 1, 1, false);
  c.shade('neck', { L: skinR.S, B: skinR.S, S: skinR.D, D: skinR.D }, 0, 1, false);
  c.shade('head', skinR, 1, 1); c.shade('ear', flat(skinR.S), 0, 0, false);
  c.shade('hair', hairR, 2, 2);
  if (pj) {                                                         // pyjama stripes: every third row of the cloth
    const stripe = hexc(PJ.stripe);
    for (let y = 0; y < HERO_H; y += 3) for (let x = 0; x < HERO_W; x++) {
      const p = c.part[y][x];
      if (p === 'torso' || p === 'armF' || p === 'armB' || p === 'legF' || p === 'legB') c.col[y][x] = stripe;
    }
  } else {
    for (let x = t0; x <= t1; x++) c.px(x, 45, hoodR.D);             // hem
    for (const [x, y, k] of HC_MARK_PIXELS) c.px(x + 5, y, hexc(HC_MARK[k]));   // the mark, on the chest's leading side
  }
  if (style === 'mohawk') {
    const buzz = skinR.B.map((a, n) => Math.floor((a * 11 + hairR.B[n] * 9) / 20));
    for (const [x, y] of skull) {
      if ((y <= 6 || x <= 11) && !(x >= 13 && y >= 7) && c.part[y + c.oy]?.[x] === 'head') c.px(x, y, buzz);
    }
  }
  // face, looking right
  for (const x of [16, 17, 18]) c.px(x, 9, hairR.D);
  c.px(17, 10, EYE_WHITE); c.px(18, 10, OUTLINE_C);
  c.px(17, 15, skinR.D); c.px(18, 15, skinR.D);
  const beardR = ramp(HAIR[hair], 1.3, 0.7);
  if (beard === 'short') {
    for (const [x, y] of rect(13, 14, 13, 16).concat([[16, 14], [17, 14], [18, 14]], rect(14, 16, 18, 17), rect(14, 18, 17, 18))) {
      if (!(y === 15 && (x === 17 || x === 18))) c.px(x, y, beardR.B);
    }
  } else if (beard === 'long') {
    for (const [x, y] of rect(13, 13, 18, 23)) {
      if ((y === 15 && (x === 17 || x === 18)) || (y <= 13 && x >= 15)) continue;
      if (y >= 20 && x < 13 + (y - 20)) continue;
      c.px(x, y, x <= 13 ? beardR.S : beardR.B);
    }
  }
  if (glasses === 'glasses') {
    const frame = [[17, 8], [18, 8], [17, 11], [18, 11], [16, 9], [16, 10], [19, 9], [19, 10]];
    for (let x = 12; x < 16; x++) frame.push([x, 9]);                // the arm back to the ear
    for (const [x, y] of frame) c.px(x, y, GLASSES);
    c.px(17, 9, skinR.L); c.px(18, 9, skinR.L);                      // the brow sits behind the lens
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
  if (!v) { v = composeHeroSide(cfg, pose, outfit); cache.set(key, v); if (cache.size > 64) cache.delete(cache.keys().next().value); }
  return v;
}

/** Paints the profile hero at (x, y) with `scale` px per sprite pixel; flip mirrors to walk left. */
export function drawHeroSide(ctx, cfg, pose, x, y, scale = 1, { flip = false, outfit = 'hoodie' } = {}) {
  const px = composed(cfg, pose, outfit);
  for (let r = 0; r < HERO_H; r++) for (let c = 0; c < HERO_W; c++) {
    const i = (r * HERO_W + c) * 4;
    if (!px[i + 3]) continue;
    const col = flip ? HERO_W - 1 - c : c;
    ctx.fillStyle = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
    ctx.fillRect(x + col * scale, y + r * scale, scale, scale);
  }
}
