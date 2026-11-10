import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { TEMPO, TRACKS, loopBeats } from '../js/audio/title-loop.js';

const sum = (t) => t.reduce((a, [, b]) => a + b, 0);

test('loop length 30–45 s and tracks aligned', () => {
  const secs = (loopBeats * 60) / TEMPO;
  assert.ok(secs >= 30 && secs <= 45, `loop is ${secs}s`);
  for (const [name, t] of Object.entries(TRACKS)) {
    assert.ok(Math.abs(sum(t) - loopBeats) < 1e-9, `${name} sums to ${sum(t)}, loop is ${loopBeats}`);
  }
});

test('lead stays in a sane range and is not a single repeated phrase', () => {
  const notes = TRACKS.lead.filter(([n]) => n > 0).map(([n]) => n);
  assert.ok(Math.min(...notes) >= 55 && Math.max(...notes) <= 91, `range ${Math.min(...notes)}–${Math.max(...notes)}`);
  assert.ok(TRACKS.lead.length >= 48, `lead has ${TRACKS.lead.length} events`);
  const bars = [];
  let acc = 0, cur = [];
  for (const [n, b] of TRACKS.lead) { cur.push(n); acc += b; if (acc >= 4) { bars.push(cur.join(',')); cur = []; acc = 0; } }
  assert.ok(new Set(bars).size >= 6, `only ${new Set(bars).size} distinct bars`);
});

test('every event is a valid [midi|0, beats>0] tuple', () => {
  for (const [name, t] of Object.entries(TRACKS)) {
    for (const ev of t) {
      assert.equal(ev.length, 2, `${name} event ${JSON.stringify(ev)}`);
      if (name === 'drums') assert.ok(['k', 's', 'h', '-'].includes(ev[0]), `${name} drum ${ev[0]}`);
      else assert.ok(Number.isInteger(ev[0]) && ev[0] >= 0 && ev[0] <= 127, `${name} note ${ev[0]}`);
      assert.ok(ev[1] > 0, `${name} beats ${ev[1]}`);
    }
  }
});

test('render-loop writes a WAV of the right length', () => {
  mkdirSync('scratch', { recursive: true });
  execFileSync('node', ['tools/render-loop.mjs', 'scratch/title-loop-preview.wav'], { stdio: 'pipe' });
  const b = readFileSync('scratch/title-loop-preview.wav');
  assert.equal(b.toString('latin1', 0, 4), 'RIFF');
  assert.equal(b.toString('latin1', 8, 12), 'WAVE');
  const channels = b.readUInt16LE(22), rate = b.readUInt32LE(24), bits = b.readUInt16LE(34);
  assert.equal(rate, 44100); assert.equal(bits, 16);
  const dataLen = b.readUInt32LE(40);
  const secs = dataLen / (rate * channels * 2);
  const expected = (loopBeats * 60) / TEMPO;
  assert.ok(Math.abs(secs - expected) < 0.1, `wav ${secs}s vs loop ${expected}s`);
  // not silent
  let peak = 0;
  for (let i = 44; i < b.length; i += 2) peak = Math.max(peak, Math.abs(b.readInt16LE(i)));
  assert.ok(peak > 8000, `peak ${peak}`);
});
