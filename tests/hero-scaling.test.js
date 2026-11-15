// The hero drawn smaller than his sprite (he is scaled by depth in every room since brief 11). Rick, 2026-11-14:
// "the game model now looks like crap, it's gotten worse since the last time." Nearest-neighbour scaling takes
// whichever rows and columns fall under the destination's centres, and his eyes are four columns by two rows: at
// 0.86 they came out as slits, at 0.73 one eye lost its pupil, at 0.65 both did. A smaller hero is still whole rows
// and columns of the sprite, evenly spaced, so he stays crisp; the spacing is slid to keep the most detail, and
// above all a white and a pupil in each eye.
import test from 'node:test';
import assert from 'node:assert/strict';
import { composeHero, scaleSprite, evenLines, drawHero, HERO_W, HERO_H, EYE_WHITE, OUTLINE_C } from '../js/engine/hero.js';
import { PRESETS, EYES } from '../js/engine/hero-parts.js';

const ROOM_SCALES = [0.95, 0.91, 0.86, 0.84, 0.81, 0.77, 0.73, 0.69, 0.65, 0.61, 0.57, 0.51];   // what the five rooms draw him at, front to back
const is = (d, i, c) => d[i + 3] === 255 && d[i] === c[0] && d[i + 1] === c[1] && d[i + 2] === c[2];

/** The rows of the sprite his eyes are on: where both eyes' first column is the eye's white. */
function eyeRows(px) {
  const rows = [];
  for (let y = 0; y < 60; y++) if (EYES.every((x) => is(px, (y * HERO_W + x) * 4, EYE_WHITE))) rows.push(y);
  return rows;
}
/** How many white and how many pupil pixels the scaled sprite has where the sprite's eye (4 px wide from x0, on `rows`) lands. */
function eyeIn(s, x0, rows) {
  const kx = HERO_W / s.w, ky = HERO_H / s.h;
  let white = 0, pupil = 0;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (Math.min((x + 1) * kx, x0 + 5) - Math.max(x * kx, x0 - 1) <= 0 || Math.min((y + 1) * ky, rows.at(-1) + 2) - Math.max(y * ky, rows[0] - 1) <= 0) continue;
    const i = (y * s.w + x) * 4;
    if (is(s.data, i, EYE_WHITE)) white++; else if (is(s.data, i, OUTLINE_C)) pupil++;
  }
  return { white, pupil };
}

for (const [name, cfg] of Object.entries(PRESETS)) {
  test(`${name}, drawn smaller: each eye keeps a white and a pupil at every size a room uses`, () => {
    const px = composeHero(cfg, 'idle'), rows = eyeRows(px);
    assert.ok(rows.length >= 1, 'the sprite has eyes');
    for (const scale of ROOM_SCALES) {
      const s = scaleSprite(px, scale);
      for (const [i, side] of [[0, 'left'], [1, 'right']]) {
        const e = eyeIn(s, EYES[i], rows);
        assert.ok(e.white >= 1 && e.pupil >= 1, `${scale}: the ${side} eye has ${e.white} white and ${e.pupil} pupil pixels`);
      }
    }
  });
}

test('a smaller hero is crisp: every pixel is a pixel of the sprite, in rows and columns evenly spaced', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  const colours = new Set(); for (let i = 0; i < px.length; i += 4) colours.add(px[i + 3] ? `${px[i]},${px[i + 1]},${px[i + 2]}` : 'clear');
  for (const scale of ROOM_SCALES) {
    const s = scaleSprite(px, scale);
    for (let i = 0; i < s.data.length; i += 4) assert.ok(colours.has(s.data[i + 3] ? `${s.data[i]},${s.data[i + 1]},${s.data[i + 2]}` : 'clear'), `${scale}: a colour the sprite does not have`);
  }
  const lines = evenLines(144, 105, 0.3);
  assert.equal(lines.length, 105);
  for (let i = 1; i < lines.length; i++) assert.ok(lines[i] - lines[i - 1] >= 1 && lines[i] - lines[i - 1] <= 2, 'never a line twice, never two skipped');
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
