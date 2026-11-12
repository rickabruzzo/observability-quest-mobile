// Loads a room manifest (assets/rooms/*.json, built by tools/build_rooms.py) and every image it lists, once.
// Resolves { manifest, images: Map<name, HTMLImageElement> }; rejects (and forgets, so a later call retries)
// on any failure or after the timeout.

const loading = new Map();

export function loadManifest(url, { timeout = 6000 } = {}) {
  if (loading.has(url)) return loading.get(url);
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const work = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const manifest = await res.json();
    if (!manifest.images || typeof manifest.images !== 'object') throw new Error(`${url}: no images`);
    const images = new Map();
    await Promise.all(Object.entries(manifest.images).map(([name, file]) => new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => { images.set(name, img); ok(); };
      img.onerror = () => fail(new Error(`${file} failed`));
      img.src = base + file;
    })));
    return { manifest, images };
  })();
  const timed = Promise.race([work, new Promise((_, fail) => setTimeout(() => fail(new Error(`${url}: timed out`)), timeout))]);
  const p = timed.catch((e) => { loading.delete(url); throw e; });
  loading.set(url, p);
  return p;
}
