// Hero sprite, seen from the side — a line-for-line port of hero_side() in tools/hero_gen.py at the era-look
// size. Same 56×144 canvas, same colour ramps, same shade/seam/outline passes as the front view; the figure
// faces right and the game mirrors it to walk left. The Python file is the reference; tests/hero-side.test.js
// proves this port byte for byte against the fixtures in tests/fixtures/hero-side.
//
// Rounding: every joint here goes through _r — floor(v + 0.5), half up — because Python's round() is
// banker's rounding and would put a limb on a different pixel. hero_gen._r is the same rule.

import { blit, ellipse, EYE_WHITE, GLASSES, Grid, HERO_H, HERO_W, hexc, OUTLINE_C, ramp, rect, SHOE, SOLE_C } from './hero.js';
import { ARM_W, FORE, HAIR, HC_MARK, HC_MARK_PIXELS, HC_MARK_SIDE_AT, HOODIE, JEANS, LEG_W, PJ, SHIN, SIDE_BOB, SIDE_LEG, SIDE_POSES, SKIN, THIGH, TOP, UPPER } from './hero-parts.js';

export { SIDE_POSES, HERO_W, HERO_H };                  // the profile shares the front view's 56×144 canvas

// Both views stand on the same floor row (hero_gen.FLOOR), so a hero drawn at one y does not hop when it
// stops walking. Kept as a named constant so the screens' arithmetic reads the same as before; a test holds it.
export const SIDE_FOOT_DY = 0;

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

function leg(c, tag, hipX, hipY, thigh, shin, width = LEG_W) {
  const [up, knee] = limb(hipX, hipY, THIGH, thigh, width);
  const [low, ankle] = limb(knee[0], knee[1], SHIN, shin, width);
  c.fill('leg' + tag, up.concat(low));
  const ax = _r(ankle[0]), ay = _r(ankle[1]);
  const lift = shin < -30 ? 2 : 0;                                    // a trailing foot points its toe down
  c.fill('shoe' + tag, rect(ax - 4, ay, ax + 8, ay + 5).concat(rect(ax + 7, ay + 2 + lift, ax + 11, ay + 5 + lift)));
  return [ax, ay, lift];
}

function arm(c, tag, shX, shY, swing, width = ARM_W) {
  const [up, elbow] = limb(shX, shY, UPPER, swing, width);
  const [low, wrist] = limb(elbow[0], elbow[1], FORE, swing + (swing >= 0 ? 18 : 8), width);   // the elbow stays a little bent
  c.fill('arm' + tag, up.concat(low));
  const wx = _r(wrist[0]), wy = _r(wrist[1]);
  c.fill('hand' + tag, rect(wx - 3, wy, wx + 3, wy + 8));
  return [wx, wy];
}

const flat = (col) => ({ L: col, B: col, S: col, D: col });

/** Composes the 56×144 RGBA profile sprite for a hero config and pose. Unknown poses stand. */
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
  const farSwing = standing ? -30 : -swing;                         // standing: the far arm hangs a little behind, so it shows
  const slim = body === 'fem';
  const t0 = slim ? 17 : 15, t1 = 41;                               // torso, side on: about 26 deep

  // far arm and far leg first (darker), then the near leg; shoes point the way the hero faces
  c.oy = TOP + bob;
  arm(c, 'B', 28, 46, farSwing);
  const shoeB = leg(c, 'B', 26, 90, far[0], far[1]);
  const shoeF = leg(c, 'F', 28, 90, near[0], near[1]);
  // back hair behind the body, hood behind the neck
  if (style === 'shoulder') c.fill('hair', rect(14, 16, 24, 43));
  else if (style === 'long') c.fill('hair', rect(12, 16, 24, 63));
  if (!pj) c.fill('hood', rect(14, 36, 24, 47));
  c.fill('torso', rect(t0, 40, t1, 92).concat(rect(t0 + 2, 38, t1 - 2, 39)));
  c.fill('neck', rect(24, 33, 31, 41));
  // head in profile: skull, face plane, nose, chin
  c.fill('head', ellipse(27.0, 21.0, 11.5, 13.5).concat(rect(26, 26, 37, 34), rect(28, 35, 35, 35)));
  c.fill('head', rect(38, 22, 39, 26).concat([[40, 24], [40, 25], [41, 25]]));   // nose
  c.fill('ear', rect(23, 19, 26, 25));
  // hair
  const skull = ellipse(27.0, 17.5, 12.5, 12.0);
  let hm;
  if (style === 'mohawk') {
    const top = (x) => _r(17.5 - 12.0 * Math.sqrt(Math.max(0.0, 1 - ((x - 27.0) / 12.5) ** 2)));   // the skull's top, per column
    hm = [];
    for (let x = 19; x < 35; x++) for (let y = top(x) - 5; y < top(x) + 2; y++) hm.push([x, y]);  // the ridge, following the skull
  } else if (style === 'fro') {
    hm = ellipse(24.0, 16.0, 18.5, 17.0).filter(([x, y]) => !(x >= 30 && y >= 15));
  } else {
    hm = skull.filter(([x, y]) => y <= 12 || x <= 22);               // crown and the back of the head
    hm = hm.filter(([x, y]) => !(x >= 26 && y >= 13));               // forehead and face stay clear
    if (style === 'standard') hm = hm.concat(rect(22, 14, 25, 19));  // sideburn in front of the ear
    else if (style === 'shoulder') hm = hm.concat(rect(14, 16, 23, 43), rect(24, 14, 25, 19));
    else if (style === 'long') hm = hm.concat(rect(12, 16, 23, 63), rect(24, 14, 25, 19));
  }
  c.fill('hair', hm);
  const handF = arm(c, 'F', 26, 46, swing);                         // the near arm, over the torso

  c.shade('legB', { L: jeanR.S, B: jeanR.S, S: jeanR.S, D: jeanR.D }, 0, 2, false);
  c.shade('shoeB', flat(shoeR.S), 0, 0, false);
  c.shade('legF', jeanR, 2, 2, false); c.shade('shoeF', shoeR, 2, 2);
  c.shade('hood', { L: hoodR.S, B: hoodR.D, S: hoodR.D, D: hoodR.D }, 0, 0, false);
  c.shade('torso', hoodR, 2, 4, false);
  c.shade('armB', flat(hoodR.D), 0, 0, false); c.shade('handB', flat(skinR.S), 0, 0, false);
  c.shade('armF', { L: hoodR.S, B: hoodR.B, S: hoodR.S, D: hoodR.D }, 2, 2, false);
  c.shade('handF', skinR, 1, 2, false);
  c.shade('neck', { L: skinR.S, B: skinR.S, S: skinR.D, D: skinR.D }, 0, 2, false);
  c.shade('head', skinR, 2, 2); c.shade('ear', flat(skinR.S), 0, 0, false);
  c.shade('hair', hairR, 3, 4);
  if (pj) {                                                         // pyjama stripes: every fourth column of the cloth
    const stripe = hexc(PJ.stripe);
    for (let y = 0; y < HERO_H; y++) for (let x = 1; x < HERO_W; x += 4) {
      const p = c.part[y][x];
      if (p === 'torso' || p === 'armF' || p === 'armB' || p === 'legF' || p === 'legB') c.col[y][x] = stripe;
    }
  } else {
    for (let x = t0; x <= t1; x++) { c.px(x, 91, hoodR.D); c.px(x, 92, hoodR.D); }   // hem
    for (let y = 76; y <= 89; y++) c.px(t1 - 4, y, hoodR.S);                          // the pocket's leading edge
    for (let x = t0 + 4; x < t1 - 3; x++) c.px(x, 89, hoodR.S);
    for (let y = 46; y <= 59; y++) c.px(33, y, hoodR.L);                               // the near drawstring
    c.px(33, 60, hoodR.D);
    const [ax, ay] = HC_MARK_SIDE_AT;
    for (const [x, y, k] of HC_MARK_PIXELS) c.px(ax + x, ay + y, hexc(HC_MARK[k]));   // the mark, on the chest's leading side
    for (const [sx, sy, lift] of [shoeB, shoeF]) {
      for (let x = sx - 3; x < sx + 8; x++) { c.px(x, sy + 4, SOLE_C); c.px(x, sy + 5, SOLE_C); }   // soles
      for (let x = sx + 8; x < sx + 11; x++) { c.px(x, sy + 4 + lift, SOLE_C); c.px(x, sy + 5 + lift, SOLE_C); }
    }
  }
  // the near hand's fingers
  const [wx, wy] = handF;
  for (let x = wx - 2; x < wx + 3; x++) c.px(x, wy + 5, skinR.S);
  if (style === 'mohawk') {
    const buzz = skinR.B.map((a, n) => Math.floor((a * 11 + hairR.B[n] * 9) / 20));
    for (const [x, y] of skull) {
      if ((y <= 12 || x <= 22) && !(x >= 26 && y >= 13) && c.part[y + c.oy]?.[x] === 'head') c.px(x, y, buzz);
    }
  }
  if (style === 'fro') for (const [x, y] of [[14, 4], [24, 1], [8, 12], [18, 8], [10, 24], [20, 28], [30, 5], [6, 18]]) if (c.part[y + c.oy]?.[x] === 'hair') c.px(x, y, hairR.D);
  // face, looking right
  for (let x = 32; x < 37; x++) c.px(x, 17, hairR.D);                                      // brow
  c.px(33, 19, EYE_WHITE); c.px(33, 20, EYE_WHITE); c.px(34, 19, OUTLINE_C); c.px(34, 20, OUTLINE_C); c.px(35, 20, OUTLINE_C); c.px(35, 19, EYE_WHITE);
  c.px(38, 26, skinR.S);                                                                   // nostril
  for (let x = 33; x < 38; x++) c.px(x, 29, skinR.D);                                      // mouth
  const beardR = ramp(HAIR[hair], 1.3, 0.7);
  if (beard === 'short') {
    const pts = rect(26, 27, 27, 33).concat(rect(32, 27, 37, 28), rect(28, 31, 37, 33), rect(28, 34, 35, 35));
    for (const [x, y] of pts) if (!(y === 29 && x >= 33)) c.px(x, y, beardR.B);
  } else if (beard === 'long') {
    for (const [x, y] of rect(26, 26, 37, 45)) {
      if ((y === 29 && x >= 33) || (y <= 27 && x >= 30)) continue;
      if (y >= 38 && x < 26 + (y - 38)) continue;
      c.px(x, y, x <= 27 ? beardR.S : beardR.B);
    }
  }
  if (glasses === 'glasses') {
    const frame = [];
    for (let x = 33; x < 37; x++) frame.push([x, 17], [x, 22]);
    for (let y = 18; y < 22; y++) frame.push([32, y], [37, y]);
    for (let x = 24; x < 32; x++) frame.push([x, 19]);                // the arm back to the ear
    for (const [x, y] of frame) c.px(x, y, GLASSES);
    for (let x = 33; x < 37; x++) c.px(x, 18, skinR.L);               // the brow sits behind the lens
  }
  c.oy = 0;
  c.seam('torso', 'armF'); c.seam('legF', 'legB'); c.seam('torso', 'legF'); c.seam('torso', 'legB');
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
  blit(ctx, composed(cfg, pose, outfit), x, y, scale, flip);
}
