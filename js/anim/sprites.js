// Sprite/patch loader: assets/anim/<name>.png + <name>.json {x, y, w, h, ...}
// load()/warm() are async; sprite() is synchronous for use inside draw().
const BASE = 'assets/anim/';
const PENDING = new Map();   // name → Promise<sprite|null>
const LOADED = new Map();    // name → sprite | null (null = known missing)

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sprite image failed: ${src}`));
    img.src = src;
  });
}

function fetchOne(name) {
  if (PENDING.has(name)) return PENDING.get(name);
  const p = (async () => {
    const [img, meta] = await Promise.all([
      loadImage(`${BASE}${name}.png`),
      fetch(`${BASE}${name}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`sprite meta failed: ${name}`)))),
    ]);
    return { img, ...meta };
  })();
  PENDING.set(name, p);
  return p;
}

/**
 * Load sprites by name. Resolves to Map<name, sprite|null>. With optional=true a missing
 * sprite becomes null (and is remembered as missing) instead of rejecting.
 */
export async function load(names, { optional = false } = {}) {
  const out = new Map();
  await Promise.all(names.map(async (n) => {
    if (LOADED.has(n)) { out.set(n, LOADED.get(n)); return; }
    try {
      const s = await fetchOne(n);
      LOADED.set(n, s); out.set(n, s);
    } catch (e) {
      PENDING.delete(n);
      if (!optional) throw e;
      LOADED.set(n, null); out.set(n, null);
    }
  }));
  return out;
}

export const warm = load;

/** Synchronous access to a loaded sprite, or null if not loaded / missing. */
export function sprite(name) {
  return LOADED.get(name) ?? null;
}

/** Draw a sprite at its own position (or an offset). */
export function blit(ctx, name, dx = 0, dy = 0) {
  const s = sprite(name);
  if (s) ctx.drawImage(s.img, s.x + dx, s.y + dy, s.w, s.h);
  return !!s;
}

/** Load a JSON data file from assets/anim/. */
export async function data(name) {
  const r = await fetch(`${BASE}${name}.json`);
  if (!r.ok) throw new Error(`data failed: ${name}`);
  return r.json();
}
