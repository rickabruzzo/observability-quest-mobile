import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { composeHero, HERO_W, HERO_H, drawHero, drawHeroCrop, HEAD_CROP } from '../js/engine/hero.js';
import { OPTIONS, PRESETS, POSES } from '../js/engine/hero-parts.js';

const DIR = 'tests/fixtures/hero/';
const names = readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));

test('fixtures exist', () => assert.ok(names.length >= 10));

for (const n of names) {
  test(`matches Python fixture ${n}`, () => {
    const { pose, ...cfg } = JSON.parse(readFileSync(DIR + n + '.json', 'utf8'));
    const want = readFileSync(DIR + n + '.rgba');
    const got = Buffer.from(composeHero(cfg, pose).buffer);
    assert.equal(got.length, HERO_W * HERO_H * 4);
    const firstDiff = got.findIndex((b, i) => b !== want[i]);
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % 28},${Math.floor(firstDiff / 4 / 28)}`);
  });
}

test('every option value and pose composes without throwing', () => {
  for (const [k, vs] of Object.entries(OPTIONS)) for (const v of vs) composeHero({ ...PRESETS.masc, [k]: v });
  for (const p of POSES) composeHero(PRESETS.fem, p);
});

function fakeCtx() {
  const calls = [];
  return { calls, fillStyle: '', fillRect(x, y, w, h) { calls.push([x, y, w, h, this.fillStyle]); } };
}

test('drawHero paints scale-sized rects at the offset; flip mirrors x', () => {
  const a = fakeCtx(); drawHero(a, PRESETS.masc, 'idle', 10, 20, 2);
  assert.ok(a.calls.every(([, , w, h]) => w === 2 && h === 2));
  assert.ok(a.calls.every(([x, y]) => x >= 10 && y >= 20));
  const b = fakeCtx(); drawHero(b, PRESETS.masc, 'idle', 10, 20, 2, { flip: true });
  const xsA = new Set(a.calls.map(([x]) => x)), xsB = new Set(b.calls.map(([x]) => x));
  assert.deepEqual([...xsB].sort((p, q) => p - q), [...xsA].map((x) => 10 + (27 * 2) - (x - 10)).sort((p, q) => p - q));
});

test('drawHeroCrop paints only inside the crop', () => {
  const c = fakeCtx(); drawHeroCrop(c, PRESETS.masc, HEAD_CROP, 2);
  assert.ok(c.calls.length > 0);
  assert.ok(c.calls.every(([x, y]) => x < HEAD_CROP.w * 2 && y < HEAD_CROP.h * 2));
});
