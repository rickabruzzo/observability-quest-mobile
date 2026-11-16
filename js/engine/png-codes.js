// A PNG's pixel values read from the file's own bytes (review of Warp brief 15, 2026-11-16). The hero's sheet is data,
// not a picture: a pixel's value is a code, and one wrong value is a pixel of the wrong part. Reading it back from a
// canvas is not exact everywhere: a browser that guards against fingerprinting (Brave by default, Firefox in a private
// window or in strict mode, Safari in places) changes what a page reads from a canvas by a little. So the game takes
// the values from the file: the chunks, the zlib stream through the browser's own DecompressionStream, the row filters
// undone. No canvas, nothing to guard. Only what it can read exactly is read: 8 bits a pixel, a palette or greys, not
// interlaced. Anything else, or a browser without DecompressionStream (before Safari 16.4), is null and the caller
// falls back to a canvas; those older browsers do not alter what a canvas gives back.

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PALETTE = 3, GREYS = 0;

/** Paeth's predictor (PNG filter 4): whichever of left, up and up-left is nearest left + up − up-left. */
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/**
 * { w, h, codes } for an ArrayBuffer (or typed array) holding a PNG: `codes` is a Uint8Array of w × h values, row by
 * row; for a palette PNG a value is the pixel's palette index, for greys its level. null when it is not such a PNG,
 * when the data is short or damaged, or when the browser has no DecompressionStream. Never throws.
 */
export async function pngCodes(buffer) {
  try {
    if (!buffer || typeof DecompressionStream !== 'function') return null;
    const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer), v = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (b.length < 8 || SIGNATURE.some((s, i) => b[i] !== s)) return null;
    let w = 0, h = 0, readable = false;
    const data = [];
    for (let i = 8; i + 12 <= b.length;) {
      const n = v.getUint32(i), type = String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]), at = i + 8;
      if (at + n + 4 > b.length) return null;
      if (type === 'IHDR') { w = v.getUint32(at); h = v.getUint32(at + 4); readable = b[at + 8] === 8 && (b[at + 9] === PALETTE || b[at + 9] === GREYS) && b[at + 12] === 0; }
      else if (type === 'IDAT') data.push(b.subarray(at, at + n));
      else if (type === 'IEND') break;
      i = at + n + 4;
    }
    if (!readable || !w || !h || !data.length) return null;
    const raw = new Uint8Array(await new Response(new Blob(data).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
    if (raw.length !== h * (w + 1)) return null;              // a filter byte, then a byte a pixel, on every row
    const codes = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const filter = raw[y * (w + 1)], src = y * (w + 1) + 1, row = y * w, above = row - w;
      for (let x = 0; x < w; x++) {
        const left = x ? codes[row + x - 1] : 0, up = y ? codes[above + x] : 0, upLeft = x && y ? codes[above + x - 1] : 0;
        let add;
        if (filter === 0) add = 0;
        else if (filter === 1) add = left;
        else if (filter === 2) add = up;
        else if (filter === 3) add = (left + up) >> 1;
        else if (filter === 4) add = paeth(left, up, upLeft);
        else return null;
        codes[row + x] = (raw[src + x] + add) & 255;
      }
    }
    return { w, h, codes };
  } catch { return null; }
}
