// Where a persona stands in front of the wall display (review of Warp brief 12): a few small rectangles traced from
// the plate. The wall painter stays out of these and nothing else, so the rest of the display animates right up
// to the figure.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTERS } from '../js/chapters/index.js';

for (const n of [3, 4]) {
  test(`room ${n}: the persona's covers are small, apart, and inside the box their frames move in`, () => {
    const c = CHAPTERS[n], covers = c.persona.covers;
    const patch = JSON.parse(readFileSync(`assets/rooms/ch${n}.json`, 'utf8')).patches[c.room.image];
    assert.ok(covers.length >= 1);
    let area = 0;
    for (const [i, r] of covers.entries()) {
      assert.ok(Number.isInteger(r.x) && Number.isInteger(r.y) && r.w > 0 && r.h > 0, 'whole pixels: the clip stays crisp');
      assert.ok(r.x >= patch.x && r.y >= patch.y && r.x + r.w <= patch.x + patch.w && r.y + r.h <= patch.y + patch.h, `cover ${i} inside the patch`);
      for (const o of covers.slice(i + 1)) assert.ok(r.x + r.w <= o.x || o.x + o.w <= r.x || r.y + r.h <= o.y || o.y + o.h <= r.y, 'covers do not overlap');
      area += r.w * r.h;
    }
    assert.ok(area < 0.1 * patch.w * patch.h, `the covers are ${area} px of a ${patch.w * patch.h}-px patch`);
  });
}

test('rooms whose persona stands clear of the wall display list no covers', () => {
  for (const n of [1, 2, 5]) assert.equal(CHAPTERS[n].persona.covers, undefined, `room ${n}`);
});
