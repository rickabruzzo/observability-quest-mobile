// One AudioContext for the whole game (brief 13 E): unlocked inside a tap, the playback audio session on an iPhone, a master gain everything hangs off.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createSound, MUTE_KEY } from '../js/engine/sound.js';

function fakeCtor(log, state = 'suspended') {
  return class {
    constructor() { log.push('new'); this.currentTime = 0; this.sampleRate = 48000; this.destination = { id: 'dest' }; this.state = state; }
    createGain() { const g = { gain: { value: 1 }, to: null, connect(x) { this.to = x; } }; log.push('gain'); return g; }
    resume() { log.push('resume'); this.state = 'running'; return Promise.resolve(); }
    suspend() { log.push('suspend'); this.state = 'suspended'; return Promise.resolve(); }
  };
}
const memStorage = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

test('one context however many unlocks; a suspended context is resumed on unlock', () => {
  const log = []; const s = createSound({ AudioContextCtor: fakeCtor(log), audioSession: null, storage: memStorage() });
  assert.equal(s.context(), null); assert.equal(s.info.state, 'none');
  s.unlock(); s.unlock(); s.unlock();
  assert.equal(log.filter((x) => x === 'new').length, 1);
  assert.ok(log.includes('resume'));
  assert.equal(s.info.contexts, 1); assert.equal(s.info.state, 'running'); assert.equal(s.info.sampleRate, 48000);
  assert.equal(s.out.to, s.context().destination, 'the master gain is wired to the destination');
});
test('unlock asks for the playback audio session, once', () => {
  const session = { type: 'auto' }; const s = createSound({ AudioContextCtor: fakeCtor([]), audioSession: session, storage: memStorage() });
  s.unlock(); assert.equal(session.type, 'playback'); assert.equal(s.info.session, 'playback');
  session.type = 'auto'; s.unlock(); assert.equal(session.type, 'auto', 'set on the first unlock only');
});
test('a missing or throwing audioSession is harmless', () => {
  const none = createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage: memStorage() });
  none.unlock(); assert.equal(none.info.session, null);
  const bad = createSound({ AudioContextCtor: fakeCtor([]), audioSession: { set type(v) { throw new Error('nope'); }, get type() { throw new Error('nope'); } }, storage: memStorage() });
  bad.unlock(); assert.equal(bad.info.state, 'running'); assert.equal(bad.info.session, null);
});
test('no AudioContext: state none, nothing throws', () => {
  const s = createSound({ AudioContextCtor: undefined, audioSession: null, storage: memStorage() });
  s.unlock(); s.setMuted(true); s.suspend(); s.resume();
  assert.equal(s.context(), null); assert.equal(s.out, null);
  assert.deepEqual(s.info, { state: 'none', session: null, sampleRate: null, contexts: 0 });
});
test('a throwing constructor is swallowed', () => {
  const s = createSound({ AudioContextCtor: class { constructor() { throw new Error('no audio'); } }, audioSession: null, storage: memStorage() });
  s.unlock(); s.unlock(); assert.equal(s.info.state, 'none');
});
test('setMuted sets the master gain, flips state to muted, and is kept in storage under oq.muted', () => {
  const storage = memStorage(); const s = createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage });
  s.unlock(); assert.equal(s.muted, false); assert.equal(s.out.gain.value, 1);
  s.setMuted(true); assert.equal(s.muted, true); assert.equal(s.out.gain.value, 0); assert.equal(s.info.state, 'muted'); assert.equal(storage.getItem(MUTE_KEY), '1');
  const again = createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage });
  assert.equal(again.muted, true, 'the choice survives a new createSound on the same storage');
  again.unlock(); assert.equal(again.out.gain.value, 0);
  again.setMuted(false); assert.equal(storage.getItem(MUTE_KEY), '0'); assert.equal(again.out.gain.value, 1); assert.equal(again.info.state, 'running');
});
test('muted before any unlock: state is none until a context exists, then muted', () => {
  const storage = memStorage(); storage.setItem(MUTE_KEY, '1');
  const s = createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage });
  assert.equal(s.info.state, 'none'); s.unlock(); assert.equal(s.info.state, 'muted');
});
test('a throwing storage is harmless', () => {
  const storage = { getItem() { throw new Error('private mode'); }, setItem() { throw new Error('private mode'); } };
  const s = createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage }); s.unlock(); s.setMuted(true); assert.equal(s.muted, true);
  createSound({ AudioContextCtor: fakeCtor([]), audioSession: null, storage: null }).unlock();
});
test('suspend and resume reach the context; before unlock they do nothing', () => {
  const log = []; const s = createSound({ AudioContextCtor: fakeCtor(log, 'running'), audioSession: null, storage: memStorage() });
  s.suspend(); s.resume(); assert.deepEqual(log, []);
  s.unlock(); s.suspend(); assert.equal(s.info.state, 'suspended'); s.resume(); assert.equal(s.info.state, 'running');
});
