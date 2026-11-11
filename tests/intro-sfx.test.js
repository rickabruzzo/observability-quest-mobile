import test from 'node:test'; import assert from 'node:assert/strict';
import { createSfx } from '../js/intro/sfx.js';

function fakeCtor(log) {
  return class {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.state = 'running'; }
    createOscillator() { log.push('osc'); return { type: '', frequency: { value: 0 }, connect() {}, start() {}, stop() {} }; }
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
