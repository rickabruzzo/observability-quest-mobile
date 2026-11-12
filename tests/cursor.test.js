import test from 'node:test';
import assert from 'node:assert/strict';
import { ICONS, iconPixels, actionAt, MARKER_MS } from '../js/engine/cursor.js';

test('two icons — a walking figure and a hand — that fit a 16x16 cursor and differ', () => {
  for (const name of ['walk', 'hand']) {
    const rows = ICONS[name].rows;
    assert.ok(rows.length <= 16 && rows.every((r) => r.length === rows[0].length && r.length <= 16), name);
    const px = iconPixels(name);
    assert.ok(px.length >= 30, `${name} is nearly empty`);
    assert.ok(px.some((p) => p[2] !== px[0][2]), `${name} is one flat colour`);     // an outline and a fill
    const [hx, hy] = ICONS[name].hot; assert.ok(hx >= 0 && hx < rows[0].length && hy >= 0 && hy < rows.length);
  }
  assert.notDeepEqual(ICONS.walk.rows, ICONS.hand.rows);
});

test('a point over something usable gets the hand; anywhere else, the walker', () => {
  const spots = [{ id: 'desk', x: 166, y: 64, w: 110, h: 68 }, { id: 'door', x: 10, y: 20, w: 30, h: 90 }];
  assert.deepEqual(actionAt(200, 100, spots), { icon: 'hand', spot: spots[0] });
  assert.deepEqual(actionAt(166, 64, spots), { icon: 'hand', spot: spots[0] });       // edges count
  assert.deepEqual(actionAt(276, 132, spots), { icon: 'walk', spot: null });          // one past the far corner
  assert.deepEqual(actionAt(20, 50, spots), { icon: 'hand', spot: spots[1] });
  assert.deepEqual(actionAt(100, 180, spots), { icon: 'walk', spot: null });
  assert.deepEqual(actionAt(100, 180, []), { icon: 'walk', spot: null });
  assert.deepEqual(actionAt(NaN, 5, spots), { icon: 'walk', spot: null });
});

test('the tap marker is brief', () => assert.ok(MARKER_MS >= 300 && MARKER_MS <= 800));
