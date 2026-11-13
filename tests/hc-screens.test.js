// Scenario 1's Honeycomb screens: the ready-made pictures (assets/screens/ch1_hc*), how they are drawn,
// wiped in and outlined (brief 06).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CH1, TOOL_PIC } from '../js/chapters/ch1.js';
import { hcFrame, paintHc, HIGHLIGHT } from '../js/engine/screens.js';

const manifest = JSON.parse(readFileSync('assets/screens/ch1_hc.json', 'utf8'));
const images = new Map(manifest.stages.map((s) => [s.image.replace(/\.png$/, ''), { name: s.image }]));
const screens = { manifest, images };

/** A canvas that records what was drawn. */
function fakeG() {
  const calls = [];
  return {
    calls, fillStyle: '',
    fillRect(...a) { calls.push(['fillRect', this.fillStyle, ...a]); },
    drawImage(img, ...a) { calls.push(['drawImage', img.name, ...a]); },
  };
}

test('one picture per stage: the tool\'s steps plus one; the files exist at 188x176', () => {
  assert.equal(manifest.stages.length, CH1.tools.hc.steps.length + 1);
  for (const s of manifest.stages) {
    const png = readFileSync(`assets/screens/${s.image}`);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [manifest.pic.w, manifest.pic.h], s.image);
  }
  assert.equal(CH1.tools.hc.screens, 'assets/screens/ch1_hc.json');
});

test('every highlight sits inside the picture', () => {
  const { w, h } = manifest.pic;
  for (const [i, s] of manifest.stages.entries()) for (const r of s.highlights) {
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= w && r.y + r.h <= h, `stage ${i}: ${JSON.stringify(r)}`);
  }
});

test('both tools share the picture rectangle, which leaves the right 38.5% for prompts', () => {
  assert.deepEqual(TOOL_PIC, manifest.pic);
  assert.ok((TOOL_PIC.x + TOOL_PIC.w + 2) / 320 <= 0.615, 'the picture and its frame end before the prompts column');
});

test('the reveal: the new picture wipes in left to right, then its highlights pulse on/off four times and end on', () => {
  assert.deepEqual(hcFrame(0, 1), { base: null, stage: 0, wipe: 1, outline: true });
  const early = hcFrame(1, 0.1);
  assert.equal(early.base, 0); assert.ok(early.wipe > 0 && early.wipe < 1); assert.equal(early.outline, false);
  const ws = [0, 0.1, 0.2, 0.3].map((p) => hcFrame(1, p).wipe);
  assert.ok(ws.every((w, i) => !i || w > ws[i - 1]), `wipe should grow: ${ws}`);
  const pulses = [];
  for (let p = 0; p <= 1.0001; p += 0.005) pulses.push(hcFrame(1, Math.min(1, p)).outline);
  let flips = 0; for (let i = 1; i < pulses.length; i++) if (pulses[i] !== pulses[i - 1]) flips++;
  assert.equal(hcFrame(1, 1).outline, true, 'ends on');
  assert.ok(flips >= 8 && flips <= 9, `${flips} on/off changes`);
  assert.equal(hcFrame(2, 1, true).wipe, 1, 'reduced motion: the picture at once');
  assert.equal(hcFrame(2, 0, true).outline, true, 'reduced motion: outlined at once');
});

test('paintHc draws the right picture per stage at the manifest\'s rectangle, framed, with its highlights', () => {
  for (const stage of [0, 1, 2]) {
    const g = fakeG();
    paintHc(g, stage, 1, screens);
    const imgs = g.calls.filter((c) => c[0] === 'drawImage');
    assert.deepEqual(imgs.map((c) => c[1]), [manifest.stages[stage].image]);
    assert.deepEqual(imgs[0].slice(2), [manifest.pic.x, manifest.pic.y]);
    assert.ok(g.calls.some((c) => c[0] === 'fillRect' && c[1] === '#2A3346'), 'the 2 px frame');
    const outlines = g.calls.filter((c) => c[0] === 'fillRect' && c[1] === HIGHLIGHT);
    assert.equal(outlines.length, manifest.stages[stage].highlights.length * 4, 'four edges per highlight');
  }
});

test('mid-wipe the old picture shows under a growing slice of the new one', () => {
  const g = fakeG();
  paintHc(g, 1, 0.15, screens);
  const imgs = g.calls.filter((c) => c[0] === 'drawImage');
  assert.deepEqual(imgs.map((c) => c[1]), ['ch1_hc_0.png', 'ch1_hc_1.png']);
  const [, , sx, sy, sw, sh, dx, dy, dw, dh] = imgs[1];
  assert.deepEqual([sx, sy, sh, dx, dy, dh], [0, 0, manifest.pic.h, manifest.pic.x, manifest.pic.y, manifest.pic.h]);
  assert.ok(sw > 0 && sw < manifest.pic.w && dw === sw);
});

test('without the pictures it still draws the frame, never throws', () => {
  const g = fakeG();
  paintHc(g, 1, 0.5, { manifest, images: new Map() });
  assert.ok(g.calls.some((c) => c[1] === '#2A3346'));
  paintHc(fakeG(), 0, 1, null);
});

test('the loader lists a screen manifest\'s pictures by name, and a room manifest\'s as before', async () => {
  const { manifestImages } = await import('../js/engine/images.js');
  assert.deepEqual(manifestImages(manifest), [['ch1_hc_0', 'ch1_hc_0.png'], ['ch1_hc_1', 'ch1_hc_1.png'], ['ch1_hc_2', 'ch1_hc_2.png']]);
  const room = JSON.parse(readFileSync('assets/rooms/ch1.json', 'utf8'));
  assert.equal(manifestImages(room).length, Object.keys(room.images).length);
});
