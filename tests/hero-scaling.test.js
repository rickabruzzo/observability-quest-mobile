// The hero drawn smaller than his sprite (he is scaled by depth in every room since brief 11). Rick, 2026-11-14:
// "the game model now looks like crap, it's gotten worse since the last time." Nearest-neighbour scaling drops
// whole rows and columns of a 56×144 sprite, and his eyes are two columns wide: at 0.73 one eye lost its pupil and
// the other its white. A smaller hero is the average of the sprite pixels each destination pixel covers.
import test from 'node:test';
import assert from 'node:assert/strict';
import { composeHero, scaleSprite, drawHero, HERO_W, HERO_H } from '../js/engine/hero.js';
import { PRESETS, EYES } from '../js/engine/hero-parts.js';

const ROOM_SCALES = [0.95, 0.91, 0.86, 0.81, 0.77, 0.73, 0.57, 0.51];     // what the five rooms draw him at, front to back
const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

/** The rows of the sprite his eyes are on: where both eyes' first column is the eye's white. */
function eyeRows(px) {
  const rows = [];
  for (let y = 0; y < 60; y++) if ([EYES[0], EYES[1]].every((x) => px[(y * HERO_W + x) * 4 + 3] && lum(px, (y * HERO_W + x) * 4) > 230)) rows.push(y);
  return rows;
}
/** Mean brightness of the sprite rectangle x0..x0+3 × rows, read back from a scaled copy: each scaled pixel counts by how much of the rectangle it covers. */
function meanOver(s, x0, rows) {
  const kx = HERO_W / s.w, ky = HERO_H / s.h, y0 = rows[0], y1 = rows.at(-1) + 1;
  let sum = 0, area = 0;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const ox = Math.min((x + 1) * kx, x0 + 4) - Math.max(x * kx, x0), oy = Math.min((y + 1) * ky, y1) - Math.max(y * ky, y0);
    if (ox > 0 && oy > 0) { sum += lum(s.data, (y * s.w + x) * 4) * ox * oy; area += ox * oy; }
  }
  return sum / area;
}

test('drawn smaller, each eye keeps its share of white and pupil at every size a room uses', () => {
  const px = composeHero(PRESETS.masc, 'idle'), rows = eyeRows(px);
  assert.ok(rows.length >= 1, 'the sprite has eyes');
  const full = { w: HERO_W, h: HERO_H, data: px };
  const want = [meanOver(full, EYES[0], rows), meanOver(full, EYES[1], rows)];
  assert.ok(want[0] > 90 && want[0] < 180, `an eye is part white, part pupil: ${want[0]}`);
  for (const scale of ROOM_SCALES) {
    const s = scaleSprite(px, scale);
    for (const [i, name] of [[0, 'left'], [1, 'right']]) {
      const got = meanOver(s, EYES[i], rows);
      assert.ok(Math.abs(got - want[i]) < 40, `${scale}: the ${name} eye reads ${Math.round(got)}, the sprite's is ${Math.round(want[i])} (a lost pupil reads white, a lost white reads dark)`);
    }
  }
});

test('a smaller sprite is round(W×s) by round(H×s), stands on its last row, and has no see-through edge', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  for (const scale of ROOM_SCALES) {
    const s = scaleSprite(px, scale);
    assert.equal(s.w, Math.round(HERO_W * scale)); assert.equal(s.h, Math.round(HERO_H * scale));
    let last = -1;
    for (let i = 3; i < s.data.length; i += 4) { assert.ok(s.data[i] === 0 || s.data[i] === 255, 'a pixel is his or it is not'); if (s.data[i]) last = Math.floor(i / 4 / s.w); }
    assert.equal(last, s.h - 1, `${scale}: his feet are on the last row`);
  }
});

test('at scale 1 and at whole multiples the sprite is untouched: every pixel as composed', () => {
  const px = composeHero(PRESETS.masc, 'idle'), s = scaleSprite(px, 1);
  assert.equal(s.w, HERO_W); assert.equal(s.h, HERO_H);
  assert.deepEqual([...s.data], [...px]);
  const m = scaleSprite(px, 1, true);                                     // mirrored
  for (let y = 0; y < HERO_H; y += 7) for (let x = 0; x < HERO_W; x++) for (let k = 0; k < 4; k++) assert.equal(m.data[(y * HERO_W + x) * 4 + k], px[(y * HERO_W + (HERO_W - 1 - x)) * 4 + k]);
});

test('drawHero paints the scaled sprite in whole pixels, one row at a time', () => {
  const calls = [], g = { fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h]); } };
  drawHero(g, PRESETS.masc, 'idle', 3, 5, 0.77);
  const w = Math.round(HERO_W * 0.77), h = Math.round(HERO_H * 0.77);
  assert.ok(calls.length > 50);
  assert.ok(calls.every(([x, y, cw, ch]) => Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(cw) && ch === 1 && x >= 3 && x + cw <= 3 + w && y >= 5 && y < 5 + h));
});
