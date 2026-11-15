// Tiny static server for e2e tests. Serves what the deploy serves (the allow-list in .vercelignore) and 404s the rest,
// so every browser test proves the deployed files are enough (brief 13 A).
import http from 'node:http';
import { createReadStream, statSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2', '.otf': 'font/otf', '.wav': 'audio/wav',
};

/** The allowed top-level names of an allow-list .vercelignore (`/*` then `!name` lines). */
export function allowedRoots(text) {
  const roots = new Set();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('!')) roots.add(line.slice(1).replace(/^\/|\/$/g, ''));
  }
  return roots;
}
/** Whether a request path (already normalised) falls inside one of the allowed roots. `/` is index.html. */
export function isServed(pathname, roots) {
  const p = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const first = p.replace(/^\/+/, '').split('/')[0];
  return roots.has(first);
}

/** Keeps a test context windowed: the game asks for full screen on a touch screen (brief 13 C), and the headless browser
 * would grant it, after which the viewport cannot be resized. The API stays present, so body[data-fs] still reads "yes". */
export const windowed = (ctx) => ctx.addInitScript(`Object.defineProperty(Element.prototype, 'requestFullscreen', { value() { return Promise.reject(new Error('windowed test')); }, configurable: true });`);

export async function startServer() {
  const roots = allowedRoots(readFileSync(join(ROOT, '.vercelignore'), 'utf8'));
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = normalize(decodeURIComponent(url.pathname));
    if (p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, p);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!isServed(p, roots)) { res.writeHead(404); return res.end('not deployed'); }
    try {
      const st = statSync(file);
      if (!st.isFile()) throw new Error('not a file');
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'content-length': st.size, 'cache-control': 'no-store' });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return { baseURL: `http://127.0.0.1:${port}/`, close: () => new Promise((r) => server.close(r)) };
}
