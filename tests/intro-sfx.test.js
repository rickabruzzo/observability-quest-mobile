import test from 'node:test'; import assert from 'node:assert/strict';
import { createSfx } from '../js/intro/sfx.js';
import { createSound } from '../js/engine/sound.js';

// createSfx builds on the game's one sound (brief 13 E): where this file built createSfx({ AudioContextCtor }), it now builds the sound first.
const sfxOn = (AudioContextCtor, rest = {}) => createSfx({ sound: createSound({ AudioContextCtor, audioSession: null, storage: null }), ...rest });

function fakeCtor(log) {
  return class {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = {}; this.state = 'running'; }
    createOscillator() { log.push('osc'); return { type: '', frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
    createGain() { return { gain: { value: 0 }, connect(x) { this.to = x; } }; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { log.push('buf'); return { buffer: null, connect() {}, start() {} }; }
    resume() { log.push('resume'); return Promise.resolve(); }
    close() { log.push('close'); return Promise.resolve(); }
  };
}
test('no AudioContext: silent, no throw', () => { const s = sfxOn(undefined); s.beep(); s.click(); s.close(); });
test('beep is two tones, click one noise burst', () => {
  const log = []; const s = sfxOn(fakeCtor(log));
  s.beep(); assert.deepEqual(log.filter((x) => x === 'osc'), ['osc', 'osc']);
  s.click(); assert.deepEqual(log.filter((x) => x === 'buf'), ['buf']);
  s.close(); assert.ok(!log.includes('close'), 'the context is the game\'s: close() leaves it alone');
});
test('muted makes no sound', () => { const log = []; const s = sfxOn(fakeCtor(log), { muted: () => true }); s.beep(); s.click(); assert.deepEqual(log, []); });
test('a throwing constructor is swallowed', () => { const s = sfxOn(class { constructor() { throw new Error('no audio'); } }); s.beep(); s.click(); s.close(); });
test('a node that throws mid-beep is swallowed', () => {
  const C = fakeCtor([]); C.prototype.createOscillator = () => { throw new Error('boom'); };
  sfxOn(C).beep();
});

import { SOUNDS } from '../js/intro/sfx.js';
test('every action has a sound, each makes some, and an unknown name makes none', () => {
  for (const n of ['title', 'rustle', 'step', 'pickup', 'take', 'door', 'shut']) {
    assert.ok(SOUNDS[n], n);
    const log = []; sfxOn(fakeCtor(log)).play(n);
    assert.ok(log.some((x) => x === 'osc' || x === 'buf'), `${n} is silent`);
  }
  const log = []; const s = sfxOn(fakeCtor(log)); s.play('nope'); assert.deepEqual(log, []);
  sfxOn(undefined).play('title');
  sfxOn(fakeCtor([]), { muted: () => true }).play('title');
});
test('unlock creates and resumes the context inside the tap, once', () => {
  const log = []; const C = fakeCtor(log); let made = 0;
  const s = sfxOn(class extends C { constructor() { super(); made++; this.state = 'suspended'; } });
  s.unlock(); s.unlock(); s.play('step');
  assert.equal(made, 1); assert.ok(log.includes('resume'));
  sfxOn(undefined).unlock();
});
test('no sound is long or loud', () => {
  for (const [n, parts] of Object.entries(SOUNDS)) for (const p of parts) {
    assert.ok(p.gain <= 0.1, `${n} gain ${p.gain}`); assert.ok(p.at + p.ms <= 700, `${n} runs ${p.at + p.ms} ms`);
  }
});

test('two createSfx on one sound share its context and connect to its master gain; close() does not close it', () => {
  const log = []; const C = fakeCtor(log); let made = 0, connected = [];
  const sound = createSound({ AudioContextCtor: class extends C { constructor() { super(); made++; } createGain() { const g = super.createGain(); g.connect = (x) => { connected.push(x); }; return g; } }, audioSession: null, storage: null });
  const a = createSfx({ sound }), b = createSfx({ sound });
  a.unlock(); b.unlock(); a.beep(); b.play('step'); a.close(); b.close();
  assert.equal(made, 1); assert.equal(sound.info.contexts, 1);
  assert.ok(!log.includes('close'));
  const toOut = connected.filter((x) => x === sound.out).length, toDest = connected.filter((x) => x === sound.context().destination).length;
  assert.equal(toDest, 1, 'only the master gain reaches the destination');
  assert.ok(toOut >= 3, `every voice connects to out (${toOut})`);
  assert.equal(sound.info.state, 'running');
});
test('no sound object at all: silent, no throw', () => { const s = createSfx(); s.unlock(); s.beep(); s.click(); s.play('title'); s.close(); });
