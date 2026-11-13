// Loads a manifest and every image it lists, once: a room (assets/rooms/*.json, `images: { name: file }`) or a
// product screen (assets/screens/*.json, `stages: [{ image: file }]`, named by the file without .png).
// Resolves { manifest, images: Map<name, HTMLImageElement> }; rejects (and forgets, so a later call retries)
// on any failure or after the timeout.

/** [name, file] for every image a manifest lists, in either shape. */
export function manifestImages(manifest) {
  const out = [];
  if (manifest.images && typeof manifest.images === 'object') out.push(...Object.entries(manifest.images));
  if (Array.isArray(manifest.stages)) for (const s of manifest.stages) if (s?.image) out.push([String(s.image).replace(/\.png$/i, ''), s.image]);
  return out;
}

const loading = new Map();

export function loadManifest(url, { timeout = 6000 } = {}) {
  if (loading.has(url)) return loading.get(url);
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const work = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const manifest = await res.json();
    const list = manifestImages(manifest);
    if (!list.length) throw new Error(`${url}: no images`);
    const images = new Map();
    await Promise.all(list.map(([name, file]) => new Promise((ok, fail) => {
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
