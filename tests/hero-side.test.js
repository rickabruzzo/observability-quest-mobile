import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { composeHeroSide, drawHeroSide, SIDE_POSES } from '../js/engine/hero-side.js';
import { HERO_W, HERO_H } from '../js/engine/hero.js';
import { OPTIONS, PRESETS } from '../js/engine/hero-parts.js';

const DIR = 'tests/fixtures/hero-side/';
const names = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

test('fixtures exist', () => assert.ok(names.length >= 15, `${names.length} fixtures`));

for (const n of names) {
  test(`matches Python fixture ${n}`, () => {
    const { pose, outfit = 'hoodie', ...cfg } = JSON.parse(readFileSync(DIR + n + '.json', 'utf8'));
    const want = readFileSync(DIR + n + '.rgba');
    const got = Buffer.from(composeHeroSide(cfg, pose, outfit).buffer);
    assert.equal(got.length, HERO_W * HERO_H * 4);
    const firstDiff = got.findIndex((b, i) => b !== want[i]);
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % 28},${Math.floor(firstDiff / 4 / 28)}`);
  });
}

test('stand plus an eight-frame walk, facing right', () => {
  assert.deepEqual(SIDE_POSES, ['stand', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8']);
});

test('every option value and side pose composes without throwing', () => {
  for (const [k, vs] of Object.entries(OPTIONS)) for (const v of vs) composeHeroSide({ ...PRESETS.masc, [k]: v });
  for (const p of SIDE_POSES) composeHeroSide(PRESETS.fem, p);
  for (const p of SIDE_POSES) composeHeroSide(PRESETS.nb, p, 'pj');
});

test('every walk frame differs from standing', () => {
  const stand = Buffer.from(composeHeroSide(PRESETS.nb, 'stand').buffer).toString('hex');
  for (const p of SIDE_POSES.slice(1)) {
    assert.notEqual(Buffer.from(composeHeroSide(PRESETS.nb, p).buffer).toString('hex'), stand, p);
  }
});

function fakeCtx() {
  const calls = [];
  return { calls, fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h, this.fillStyle]); } };
}

test('drawHeroSide paints scale-sized rects at the offset; flip mirrors x exactly as drawHero does', () => {
  const a = fakeCtx(); drawHeroSide(a, PRESETS.masc, 'w1', 10, 20, 2);
  assert.ok(a.calls.length > 0);
  assert.ok(a.calls.every(([, , w, h]) => w === 2 && h === 2));
  assert.ok(a.calls.every(([x, y]) => x >= 10 && y >= 20));
  const b = fakeCtx(); drawHeroSide(b, PRESETS.masc, 'w1', 10, 20, 2, { flip: true });
  const xsA = new Set(a.calls.map(([x]) => x)), xsB = new Set(b.calls.map(([x]) => x));
  assert.deepEqual([...xsB].sort((p, q) => p - q), [...xsA].map((x) => 10 + (27 * 2) - (x - 10)).sort((p, q) => p - q));
});

test('drawHeroSide forwards the outfit', () => {
  const a = fakeCtx(); drawHeroSide(a, PRESETS.masc, 'stand', 0, 0, 1);
  const b = fakeCtx(); drawHeroSide(b, PRESETS.masc, 'stand', 0, 0, 1, { outfit: 'pj' });
  const cols = (c) => [...new Set(c.calls.map((x) => x[4]))].sort().join();
  assert.notEqual(cols(a), cols(b));
});

test('an unknown pose falls back to standing rather than throwing', () => {
  assert.deepEqual(
    Buffer.from(composeHeroSide(PRESETS.masc, 'walk1').buffer),
    Buffer.from(composeHeroSide(PRESETS.masc, 'stand').buffer),
  );
});
