// The wall displays (Warp brief 08): one small painter per scenario, pure apart from the canvas it is handed.
// The engine builds `s` ({ state, t, tAll, reduced, nudges, text, cfg }) and asks the painter what to draw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS } from '../js/chapters/index.js';
import { SCRIPT } from '../js/script.js';

/** The engine's resolution of a wall's text keys to words. */
const words = (text) => Object.fromEntries(Object.entries(text).map(([k, v]) => [k, Array.isArray(v) ? v.map((x) => SCRIPT[x]) : SCRIPT[v]]));
const S = (ch, state, extra = {}) => ({ state, t: 0, tAll: 0, reduced: false, nudges: [], text: words(ch.wall.text), cfg: ch.wall, ...extra });
const rec = () => { const calls = []; const g = new Proxy({ calls }, { get: (o, k) => (k === 'calls' ? calls : k === 'fillStyle' ? '' : (...a) => calls.push([k, ...a])), set: () => true }); return g; };

for (const n of Object.keys(CHAPTERS).map(Number)) {
  const ch = CHAPTERS[n], P = ch.wall.painter;
  test(`scenario ${n}: the painter answers every question for broken, found and fixed, and never throws drawing`, () => {
    for (const state of ['broken', 'found', 'fixed']) {
      for (const reduced of [false, true]) {
        const s = S(ch, state, { reduced, t: 1234, tAll: 5678 });
        const text = P.text(s);
        assert.ok(Array.isArray(text) && text.every((b) => b.area && Array.isArray(b.lines) && b.lines.every((l) => typeof l === 'string')), state);
        assert.ok(Array.isArray(P.hits(s)) && P.hits(s).every((h) => h.area && Number.isInteger(h.box)));
        assert.equal(typeof P.frameKey(s), 'string');
        assert.equal(typeof P.recovered(s), 'boolean');
        assert.ok(typeof P.image(s) === 'string');
        P.room(rec(), s); P.close(rec(), s);
      }
    }
  });
  test(`scenario ${n}: broken and fixed show different words; a tap on a box steps it; reduced motion recovers at once`, () => {
    const a = P.text(S(ch, 'broken', { t: 150 })).map((b) => b.lines.join(' ')).join('|');
    const b = P.text(S(ch, 'fixed', { t: 150 })).map((b) => b.lines.join(' ')).join('|');
    assert.notEqual(a, b);
    const hit = P.hits(S(ch, 'broken'))[0];
    const stepped = P.text(S(ch, 'broken', { t: 150, nudges: [{ step: 1, box: hit.box }] })).map((b) => b.lines.join(' ')).join('|');
    assert.notEqual(stepped, a, 'the tapped box moved on');
    assert.equal(P.recovered(S(ch, 'fixed', { reduced: true })), true);
    assert.equal(P.recovered(S(ch, 'fixed', { t: 0 })), false);
    assert.equal(P.recovered(S(ch, 'fixed', { t: 60000 })), true);
    assert.notEqual(P.frameKey(S(ch, 'broken')), P.frameKey(S(ch, 'fixed')));
  });
}

test('scenario 2: the sheet carries one theory at a time, in marker ink; after the fix the close-up is the painted board and the room gets the path', () => {
  const ch = CHAPTERS[2], P = ch.wall.painter;
  const sheet = P.text(S(ch, 'broken'));
  assert.equal(sheet.length, 1); assert.deepEqual(sheet[0].area, { x0: 49, x1: 107, y0: 32, y1: 100 }); assert.equal(sheet[0].cls, 'sheet');
  assert.deepEqual(sheet[0].lines, ['THEORY 1', "IT'S DNS"]);
  assert.deepEqual(P.text(S(ch, 'broken', { nudges: [{ step: 1, box: 0 }, { step: 2, box: 0 }] }))[0].lines, ['THEORY 3', 'COSMIC RAYS']);
  assert.deepEqual(P.text(S(ch, 'found'))[0].lines, ['THEORY 1', "IT'S DNS"], 'found changes nothing on a whiteboard');
  assert.deepEqual(P.text(S(ch, 'fixed'))[0].lines, ['THEORY 7', 'NODE 17']);
  assert.equal(P.image(S(ch, 'broken')), 'R2_wall_closeup'); assert.equal(P.image(S(ch, 'fixed')), 'R2_wall_closeup_fixed');
  assert.deepEqual(ch.wall.path, [[126, 75], [144, 75], [169, 73], [187, 78], [206, 73], [233, 71]]);
  const g = rec(); P.room(g, S(ch, 'fixed', { t: 9999 }));
  assert.ok(g.calls.some(([k]) => k === 'fillRect'), 'the path is drawn in the room once fixed');
  const g2 = rec(); P.room(g2, S(ch, 'broken', { t: 9999 }));
  assert.equal(g2.calls.filter(([k]) => k === 'fillRect').length, 0, 'nothing moves on a whiteboard until the fix');
  const g3 = rec(); P.room(g3, S(ch, 'fixed', { t: 100 }));
  assert.ok(g3.calls.filter(([k]) => k === 'fillRect').length < g.calls.filter(([k]) => k === 'fillRect').length, 'the path draws itself in over time');
  const g4 = rec(); P.room(g4, S(ch, 'fixed', { t: 0, reduced: true }));
  assert.equal(g4.calls.filter(([k]) => k === 'fillRect').length, g.calls.filter(([k]) => k === 'fillRect').length, 'reduced motion: the whole line at once');
});

test('scenario 1: Otto\'s vitals painter keeps its three boxes, the output line and the heartbeat', () => {
  const ch = CHAPTERS[1], P = ch.wall.painter;
  const text = P.text(S(ch, 'broken'));
  assert.equal(text.length, 4); assert.deepEqual(text.map((b) => b.cls), ['mon-box', 'mon-box', 'mon-box', 'mon-out']);
  assert.equal(P.hits(S(ch, 'broken')).length, 3);
  const f = P.frame(S(ch, 'fixed'));
  assert.equal(f.tone, 'green'); assert.equal(P.frame(S(ch, 'found')).tone, 'red');
  assert.equal(P.text(S(ch, 'fixed', { reduced: true }))[3].lines[0], SCRIPT['ch1.vitals.output.ok']);
});
