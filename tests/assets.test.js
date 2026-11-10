import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const NAMES = [
  'title_screen', 's1_llm', 's2_microservices', 's3_ecommerce', 's4_spaghetti', 's5_payments',
  'portrait_christine', 'portrait_emily', 'portrait_graham', 'portrait_jessitron', 'portrait_matt', 'portrait_charity',
];

function pngSize(p) {
  const b = readFileSync(p);
  assert.equal(b.toString('latin1', 1, 4), 'PNG', p);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

test('all game images are 640x428 PNG', () => {
  for (const n of NAMES) assert.deepEqual(pngSize(`assets/${n}.png`), [640, 428], n);
});

test('logos present', () => {
  assert.deepEqual(pngSize('assets/hc_logo_white.png'), [163, 48]);
  assert.deepEqual(pngSize('assets/hc_logomark.png'), [48, 48]);
});

test('total game images under 3MB', () => {
  let t = 0;
  for (const n of NAMES) t += statSync(`assets/${n}.png`).size;
  assert.ok(t < 3 * 1024 * 1024, `${t} bytes`);
});
