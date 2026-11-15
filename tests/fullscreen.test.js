// Full screen and landscape where the phone allows it (brief 13 C): a touch screen with the API, never a desktop, never a Home Screen app.
import test from 'node:test'; import assert from 'node:assert/strict';
import { shouldGoFullscreen, goFullscreen, detectFullscreen } from '../js/engine/fullscreen.js';

test('shouldGoFullscreen: only a touch screen with the API, not already full screen, not from the Home Screen', () => {
  const base = { coarsePointer: true, standalone: false, fullscreenNow: false, canFullscreen: true };
  assert.equal(shouldGoFullscreen(base), true);
  assert.equal(shouldGoFullscreen({ ...base, coarsePointer: false }), false, 'a desktop stays windowed');
  assert.equal(shouldGoFullscreen({ ...base, canFullscreen: false }), false, 'an iPhone has no API');
  assert.equal(shouldGoFullscreen({ ...base, fullscreenNow: true }), false);
  assert.equal(shouldGoFullscreen({ ...base, standalone: true }), false, 'a Home Screen app has no bars to hide');
  assert.equal(shouldGoFullscreen({ ...base, ios: true }), false, 'an iPad has the API, but its full screen takes a game\'s taps for typing and throws the page out');
  assert.equal(shouldGoFullscreen({}), false);
});

const fakeWin = ({ coarse = true, mode = false, apple, fsEl = null, api = true } = {}) => ({
  matchMedia: (q) => ({ matches: q.includes('pointer') ? coarse : mode }),
  navigator: apple === undefined ? {} : { standalone: apple },
  document: { fullscreenElement: fsEl, documentElement: api ? { requestFullscreen() {} } : {} },
});
test('detectFullscreen reads the media queries, navigator.standalone, fullscreenElement and the API', () => {
  assert.deepEqual(detectFullscreen(fakeWin()), { coarsePointer: true, standalone: false, ios: false, fullscreenNow: false, canFullscreen: true });
  assert.equal(detectFullscreen(fakeWin({ apple: true })).standalone, true);
  assert.equal(detectFullscreen(fakeWin({ apple: true })).ios, true, 'navigator.standalone is a boolean on an iPhone or iPad and nowhere else');
  assert.equal(detectFullscreen(fakeWin({ apple: false })).ios, true, 'in a Safari tab it is false, and still there');
  assert.equal(detectFullscreen(fakeWin({ apple: false })).standalone, false);
  assert.equal(detectFullscreen(fakeWin({ mode: true })).standalone, true);
  assert.equal(detectFullscreen(fakeWin({ fsEl: {} })).fullscreenNow, true);
  assert.equal(detectFullscreen(fakeWin({ api: false })).canFullscreen, false);
  assert.equal(detectFullscreen(fakeWin({ coarse: false })).coarsePointer, false);
  assert.deepEqual(detectFullscreen({}), { coarsePointer: false, standalone: false, ios: false, fullscreenNow: false, canFullscreen: false });
});

test('goFullscreen asks for full screen with the navigation UI hidden, then locks landscape', async () => {
  const calls = [];
  const doc = { documentElement: { requestFullscreen(o) { calls.push(['fs', o]); return Promise.resolve(); } } };
  const screen = { orientation: { lock(o) { calls.push(['lock', o]); return Promise.resolve(); } } };
  assert.deepEqual(await goFullscreen({ doc, screen }), { fullscreen: true, locked: true });
  assert.deepEqual(calls, [['fs', { navigationUI: 'hide' }], ['lock', 'landscape']]);
});
test('goFullscreen never throws: missing API, rejecting requestFullscreen, rejecting lock', async () => {
  assert.deepEqual(await goFullscreen({ doc: { documentElement: {} }, screen: {} }), { fullscreen: false, locked: false });
  const reject = () => Promise.reject(new Error('not allowed'));
  assert.deepEqual(await goFullscreen({ doc: { documentElement: { requestFullscreen: reject } }, screen: { orientation: { lock: () => Promise.resolve() } } }), { fullscreen: false, locked: false });
  assert.deepEqual(await goFullscreen({ doc: { documentElement: { requestFullscreen: () => Promise.resolve() } }, screen: { orientation: { lock: reject } } }), { fullscreen: true, locked: false });
  assert.deepEqual(await goFullscreen({ doc: { documentElement: { requestFullscreen() { throw new Error('sync'); } } }, screen: {} }), { fullscreen: false, locked: false });
  assert.deepEqual(await goFullscreen({ doc: { documentElement: { requestFullscreen: () => Promise.resolve() } }, screen: { orientation: { lock() { throw new Error('sync'); } } } }), { fullscreen: true, locked: false });
  assert.deepEqual(await goFullscreen({}), { fullscreen: false, locked: false });
});
