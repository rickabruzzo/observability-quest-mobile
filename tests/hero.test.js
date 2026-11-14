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
    const { pose, outfit = 'hoodie', ...cfg } = JSON.parse(readFileSync(DIR + n + '.json', 'utf8'));
    const want = readFileSync(DIR + n + '.rgba');
    const got = Buffer.from(composeHero(cfg, pose, outfit).buffer);
    assert.equal(got.length, HERO_W * HERO_H * 4);
    const firstDiff = got.findIndex((b, i) => b !== want[i]);
    assert.equal(firstDiff, -1, `first differing byte ${firstDiff} → pixel ${Math.floor(firstDiff / 4) % HERO_W},${Math.floor(firstDiff / 4 / HERO_W)}`);
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
/** Every pixel the calls covered, 'x,y' → colour. */
function painted(ctx) {
  const m = new Map();
  for (const [x, y, w, h, c] of ctx.calls) for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) m.set(`${x + dx},${y + dy}`, c);
  return m;
}
/** The sprite's opaque pixels as the blitter should paint them at (ox, oy), `scale` px each, mirrored when flip. */
function expected(px, ox, oy, scale, flip = false) {
  const m = new Map(), dw = Math.round(HERO_W * scale), dh = Math.round(HERO_H * scale);
  for (let dr = 0; dr < dh; dr++) for (let dc = 0; dc < dw; dc++) {
    const sr = Math.min(HERO_H - 1, Math.floor((dr + 0.5) / scale)), sc0 = Math.min(HERO_W - 1, Math.floor((dc + 0.5) / scale));
    const sc = flip ? HERO_W - 1 - sc0 : sc0, i = (sr * HERO_W + sc) * 4;
    if (px[i + 3]) m.set(`${ox + dc},${oy + dr}`, `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`);
  }
  return m;
}
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

test('drawHero paints every opaque sprite pixel at the offset, scale-sized, and nothing else', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  for (const scale of [1, 2]) {
    const c = fakeCtx(); drawHero(c, PRESETS.masc, 'idle', 10, 20, scale);
    assert.ok(same(painted(c), expected(px, 10, 20, scale)), `scale ${scale}`);
    assert.ok(c.calls.every(([x, y, w, h]) => x >= 10 && y >= 20 && w >= 1 && h >= 1));
  }
});

test('drawHero flips about the sprite\'s centre', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  const c = fakeCtx(); drawHero(c, PRESETS.masc, 'idle', 10, 20, 1, { flip: true });
  assert.ok(same(painted(c), expected(px, 10, 20, 1, true)));
  const plain = fakeCtx(); drawHero(plain, PRESETS.masc, 'idle', 10, 20, 1);
  const mirrored = new Map([...painted(plain)].map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [`${10 + (HERO_W - 1) - (x - 10)},${y}`, v]; }));
  assert.ok(same(painted(c), mirrored));
});

test('a fractional scale is nearest neighbour: round(W×s) by round(H×s) px, crisp, the feet on the last row', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  const c = fakeCtx(); drawHero(c, PRESETS.masc, 'idle', 0, 0, 0.85);
  const got = painted(c);
  assert.ok(same(got, expected(px, 0, 0, 0.85)));
  const xs = [...got.keys()].map((k) => +k.split(',')[0]), ys = [...got.keys()].map((k) => +k.split(',')[1]);
  assert.ok(Math.max(...xs) < Math.round(HERO_W * 0.85) && Math.max(...ys) === Math.round(HERO_H * 0.85) - 1, `${Math.max(...xs)},${Math.max(...ys)}`);
  assert.ok(c.calls.every(([x, y, w, h]) => Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(w) && h === 1), 'whole pixels only');
});

test('drawHero merges runs: far fewer rects than opaque pixels', () => {
  const px = composeHero(PRESETS.masc, 'idle');
  let opaque = 0; for (let i = 3; i < px.length; i += 4) if (px[i]) opaque++;
  const c = fakeCtx(); drawHero(c, PRESETS.masc, 'idle', 0, 0, 1);
  assert.ok(c.calls.length < opaque / 2, `${c.calls.length} rects for ${opaque} px`);
});

test('drawHeroCrop paints only inside the crop', () => {
  const c = fakeCtx(); drawHeroCrop(c, PRESETS.masc, HEAD_CROP, 2);
  assert.ok(c.calls.length > 0);
  assert.ok(c.calls.every(([x, y]) => x < HEAD_CROP.w * 2 && y < HEAD_CROP.h * 2));
  assert.deepEqual(HEAD_CROP, { x: 8, y: 4, w: 40, h: 42 });                       // the head, at the new size (TOP rows down)
});

test('drawHero forwards the outfit', () => {
  const a = fakeCtx(); drawHero(a, PRESETS.masc, 'idle', 0, 0, 1);
  const b = fakeCtx(); drawHero(b, PRESETS.masc, 'idle', 0, 0, 1, { outfit: 'pj' });
  const cols = (c) => [...new Set(c.calls.map((x) => x[4]))].sort().join();
  assert.notEqual(cols(a), cols(b));
});

test('the canvas is 56×144 and the figure fills it to the floor row', () => {
  assert.equal(HERO_W, 56); assert.equal(HERO_H, 144);
  const px = composeHero(PRESETS.masc, 'idle');
  let low = -1, top = -1;
  for (let y = 0; y < HERO_H; y++) for (let x = 0; x < HERO_W; x++) if (px[(y * HERO_W + x) * 4 + 3]) { low = y; if (top < 0) top = y; }
  assert.equal(low, HERO_H - 1, 'the soles sit on the last row, so floorY - HERO_H stands the hero on the floor');
  assert.ok(low - top + 1 >= 130, `figure ${low - top + 1} px tall`);
});
