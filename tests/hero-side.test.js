import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { composeHeroSide, drawHeroSide, SIDE_FOOT_DY, SIDE_POSES } from '../js/engine/hero-side.js';
import { composeHero, HERO_W, HERO_H } from '../js/engine/hero.js';
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
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % HERO_W},${Math.floor(firstDiff / 4 / HERO_W)}`);
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

/** Every pixel the calls covered, 'x,y' → colour. */
function painted(ctx) {
  const m = new Map();
  for (const [x, y, w, h, c] of ctx.calls) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) m.set(`${x + dx},${y + dy}`, c);
  return m;
}
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

test('drawHeroSide paints the sprite at the offset exactly as drawHero does, and flips to walk left', () => {
  const px = composeHeroSide(PRESETS.masc, 'w1');
  const want = new Map();
  for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) { const i = (y * HERO_W + x) * 4; if (px[i + 3]) want.set(`${10 + x},${20 + y}`, `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`); }
  const a = fakeCtx(); drawHeroSide(a, PRESETS.masc, 'w1', 10, 20, 1);
  assert.ok(same(painted(a), want));
  const b = fakeCtx(); drawHeroSide(b, PRESETS.masc, 'w1', 10, 20, 1, { flip: true });
  const mirrored = new Map([...want].map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [`${10 + (HERO_W - 1) - (x - 10)},${y}`, v]; }));
  assert.ok(same(painted(b), mirrored));
  const c = fakeCtx(); drawHeroSide(c, PRESETS.masc, 'w1', 0, 0, 0.85);
  const ys = [...painted(c).keys()].map((k) => +k.split(',')[1]);
  assert.equal(Math.max(...ys), Math.round(HERO_H * 0.85) - 1, 'a scaled hero still stands on its last row');
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

test('the profile stands on the same floor line as the front view, once SIDE_FOOT_DY is applied', () => {
  // Both sprites are 56x144 and both stand on hero_gen.FLOOR; SIDE_FOOT_DY is whatever difference remains
  // (none now), and the screens add it when they draw the side view against the floor.
  const lowest = (px) => { let b = -1; for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) if (px[(y * HERO_W + x) * 4 + 3]) b = y; return b; };
  for (const name of ['masc', 'fem', 'nb']) {
    const front = lowest(composeHero(PRESETS[name], 'idle'));
    const side = lowest(composeHeroSide(PRESETS[name], 'stand'));
    assert.equal(side + SIDE_FOOT_DY, front, `${name}: side ${side} + ${SIDE_FOOT_DY} != front ${front}`);
  }
  assert.equal(lowest(composeHeroSide(PRESETS.masc, 'stand', 'pj')) + SIDE_FOOT_DY, lowest(composeHero(PRESETS.masc, 'idle', 'pj')));
});

test('no walk frame drops below the standing floor line', () => {
  const lowest = (px) => { let b = -1; for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) if (px[(y * HERO_W + x) * 4 + 3]) b = y; return b; };
  const floor = lowest(composeHeroSide(PRESETS.nb, 'stand'));
  for (const p of SIDE_POSES) assert.ok(lowest(composeHeroSide(PRESETS.nb, p)) <= floor, `${p} sinks through the floor`);
});
