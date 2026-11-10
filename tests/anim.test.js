import test from 'node:test';
import assert from 'node:assert/strict';
import { quantize } from '../js/anim/clock.js';
import { blinkOpen, mouthFrame } from '../js/anim/portrait.js';

test('quantize', () => {
  assert.equal(quantize(0, 10), 0);
  assert.equal(quantize(99, 10), 0);
  assert.equal(quantize(100, 10), 1);
  assert.equal(quantize(1234, 12), 14);
});

test('blink is rare and deterministic', () => {
  const closed = [...Array(500).keys()].filter((f) => !blinkOpen(f, 7));
  assert.ok(closed.length >= 8 && closed.length <= 24, `closed ${closed.length} of 500 frames`);
  assert.deepEqual(closed, [...Array(500).keys()].filter((f) => !blinkOpen(f, 7)));
  // different seeds blink at different times
  const other = [...Array(500).keys()].filter((f) => !blinkOpen(f, 3));
  assert.notDeepEqual(closed, other);
  // never closed for more than 2 consecutive frames
  for (let i = 1; i < closed.length; i++) if (closed[i] === closed[i - 1] + 1) assert.notEqual(closed[i + 1], closed[i] + 1);
});

test('mouth still when not typing, cycles 0,1,2,1 when typing', () => {
  assert.equal(mouthFrame(5, false), 0);
  assert.equal(mouthFrame(0, false), 0);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((f) => mouthFrame(f, true)), [0, 1, 2, 1, 0, 1]);
});
