// Reading the hero's sheet straight from its file (review of Warp brief 15, 2026-11-16). The sheet is data, not a
// picture: one wrong value is a pixel of the wrong part. A browser that guards against fingerprinting (Brave by
// default, Firefox in a private window, Safari in places) changes what a page reads back from a canvas by a little,
// so the game reads the PNG's own bytes instead, and only an old browser without DecompressionStream uses a canvas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { pngCodes } from '../js/engine/png-codes.js';

const file = (p) => { const b = readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const chunk = (type, body = Buffer.alloc(0)) => { const b = Buffer.alloc(12 + body.length); b.writeUInt32BE(body.length, 0); b.write(type, 4, 'latin1'); body.copy(b, 8); return b; };   // the CRC is left 0: the reader does not check it
const ihdr = (w, h, depth = 8, type = 3, interlace = 0) => { const b = Buffer.alloc(13); b.writeUInt32BE(w, 0); b.writeUInt32BE(h, 4); b[8] = depth; b[9] = type; b[12] = interlace; return chunk('IHDR', b); };
/** A PNG of unfiltered rows, its data split over `parts` IDAT chunks. */
function png(w, h, rows, { depth = 8, type = 3, interlace = 0, parts = 1, cut = 0 } = {}) {
  const raw = Buffer.concat(rows.map((r) => Buffer.from([0, ...r]))), z = deflateSync(raw).subarray(0, cut ? -cut : undefined), n = Math.ceil(z.length / parts);
  const idat = Array.from({ length: parts }, (_, i) => chunk('IDAT', z.subarray(i * n, (i + 1) * n)));
  const b = Buffer.concat([SIG, ihdr(w, h, depth, type, interlace), ...idat, chunk('IEND')]);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
}

test('the hero\'s sheet read from its file is the fixture\'s codes, byte for byte, at the manifest\'s size', async () => {
  const m = JSON.parse(readFileSync('assets/hero/hero.json', 'utf8')), want = readFileSync('tests/fixtures/hero-painted/sheet.codes');
  const got = await pngCodes(file(`assets/hero/${m.image}`));
  assert.ok(got, 'the sheet is a PNG this reader takes');
  assert.equal(got.w * got.h, want.length);
  const header = readFileSync(`assets/hero/${m.image}`);
  assert.deepEqual([got.w, got.h], [header.readUInt32BE(16), header.readUInt32BE(20)]);
  assert.ok(Buffer.from(got.codes).equals(want), 'every code');
});

test('every PNG row filter is undone: a picture another encoder wrote with all five comes back exact', async () => {
  // tests/fixtures/png-codes/grey-filters.png: 64×40 greys written by ImageMagick (libpng, adaptive filtering); its rows
  // use filters 0, 1, 2, 3 and 4. grey-filters.codes is the same picture's bytes, row by row.
  const got = await pngCodes(file('tests/fixtures/png-codes/grey-filters.png')), want = readFileSync('tests/fixtures/png-codes/grey-filters.codes');
  assert.deepEqual([got.w, got.h], [64, 40]);
  assert.ok(Buffer.from(got.codes).equals(want));
});

test('data split over several IDAT chunks is one stream', async () => {
  const rows = [[1, 2, 3, 4], [5, 6, 7, 8], [250, 0, 255, 9]];
  const got = await pngCodes(png(4, 3, rows, { parts: 3 }));
  assert.deepEqual([...got.codes], rows.flat());
});

test('anything it cannot read exactly is null, never a guess', async () => {
  const rows = [[1, 2], [3, 4]];
  assert.equal(await pngCodes(new Uint8Array([1, 2, 3, 4]).buffer), null, 'not a PNG');
  assert.equal(await pngCodes(png(2, 2, rows, { depth: 4 })), null, 'not 8 bits a pixel');
  assert.equal(await pngCodes(png(2, 2, rows, { type: 2 })), null, 'colour, not a palette or greys');
  assert.equal(await pngCodes(png(2, 2, rows, { interlace: 1 })), null, 'interlaced');
  assert.equal(await pngCodes(png(2, 3, rows)), null, 'fewer rows than it says');
  assert.equal(await pngCodes(png(2, 2, rows, { cut: 4 })), null, 'data cut short');
  assert.equal(await pngCodes(null), null);
});

test('without DecompressionStream it is null (the game then falls back to a canvas)', async () => {
  const keep = globalThis.DecompressionStream;
  try { globalThis.DecompressionStream = undefined; assert.equal(await pngCodes(png(2, 1, [[7, 8]])), null); }
  finally { globalThis.DecompressionStream = keep; }
  assert.deepEqual([...(await pngCodes(png(2, 1, [[7, 8]]))).codes], [7, 8]);
});
