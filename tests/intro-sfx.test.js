import test from 'node:test'; import assert from 'node:assert/strict';
import { createSfx } from '../js/intro/sfx.js';

function fakeCtor(log) {
  return class {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.state = 'running'; }
    createOscillator() { log.push('osc'); return { type: '', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { value: 0 }, connect() {} }; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { log.push('buf'); return { buffer: null, connect() {}, start() {} }; }
    resume() { log.push('resume'); return Promise.resolve(); }
    close() { log.push('close'); return Promise.resolve(); }
  };
}
test('no AudioContext: silent, no throw', () => { const s = createSfx({ AudioContextCtor: undefined }); s.beep(); s.click(); s.close(); });
test('beep is two tones, click one noise burst', () => {
  const log = []; const s = createSfx({ AudioContextCtor: fakeCtor(log) });
  s.beep(); assert.deepEqual(log.filter((x) => x === 'osc'), ['osc', 'osc']);
  s.click(); assert.deepEqual(log.filter((x) => x === 'buf'), ['buf']);
  s.close(); assert.ok(log.includes('close'));
});
test('muted makes no sound', () => { const log = []; const s = createSfx({ AudioContextCtor: fakeCtor(log), muted: () => true }); s.beep(); s.click(); assert.deepEqual(log, []); });
test('a throwing constructor is swallowed', () => { const s = createSfx({ AudioContextCtor: class { constructor() { throw new Error('no audio'); } } }); s.beep(); s.click(); s.close(); });
test('a node that throws mid-beep is swallowed', () => {
  const C = fakeCtor([]); C.prototype.createOscillator = () => { throw new Error('boom'); };
  createSfx({ AudioContextCtor: C }).beep();
});

import { SOUNDS } from '../js/intro/sfx.js';
test('every action has a sound, each makes some, and an unknown name makes none', () => {
  for (const n of ['title', 'rustle', 'step', 'pickup', 'take', 'door', 'shut']) {
    assert.ok(SOUNDS[n], n);
    const log = []; createSfx({ AudioContextCtor: fakeCtor(log) }).play(n);
    assert.ok(log.some((x) => x === 'osc' || x === 'buf'), `${n} is silent`);
  }
  const log = []; const s = createSfx({ AudioContextCtor: fakeCtor(log) }); s.play('nope'); assert.deepEqual(log, []);
  createSfx({ AudioContextCtor: undefined }).play('title');
  createSfx({ AudioContextCtor: fakeCtor([]), muted: () => true }).play('title');
});
test('unlock creates and resumes the context inside the tap, once', () => {
  const log = []; const C = fakeCtor(log); let made = 0;
  const s = createSfx({ AudioContextCtor: class extends C { constructor() { super(); made++; this.state = 'suspended'; } } });
  s.unlock(); s.unlock(); s.play('step');
  assert.equal(made, 1); assert.ok(log.includes('resume'));
  createSfx({ AudioContextCtor: undefined }).unlock();
});
test('no sound is long or loud', () => {
  for (const [n, parts] of Object.entries(SOUNDS)) for (const p of parts) {
    assert.ok(p.gain <= 0.1, `${n} gain ${p.gain}`); assert.ok(p.at + p.ms <= 700, `${n} runs ${p.at + p.ms} ms`);
  }
});
