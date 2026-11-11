// Sub-project 1 ships light: every file the title needs totals under 600 KB, and the game
// reaches `ready` with the network restricted to exactly those files.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

const BUDGET = 600 * 1024;
const FONTS = ['assets/fonts/vt323-latin-400-normal.woff2', 'assets/fonts/gloryquest/gloryquest.otf'];

/** Walks static `import` statements from js/game.js. */
function moduleGraph(entry) {
  const seen = new Set(); const stack = [entry];
  while (stack.length) {
    const f = stack.pop(); if (seen.has(f)) continue; seen.add(f);
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/import\s+[^'"]*from\s+['"]([^'"]+)['"]/g)) stack.push(normalize(join(dirname(f), m[1])));
  }
  return [...seen];
}

const FILES = ['index.html', 'css/game.css', ...moduleGraph('js/game.js'), ...FONTS];

test('title files total under 600 KB', () => {
  const sizes = FILES.map((f) => [f, statSync(f).size]);
  const total = sizes.reduce((t, [, s]) => t + s, 0);
  assert.ok(total <= BUDGET, `${total} bytes:\n` + sizes.map(([f, s]) => `  ${s}\t${f}`).join('\n'));
});

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

test('game reaches ready with only those files reachable', async () => {
  const allowed = new Set(FILES.map((f) => '/' + f.replace(/\\/g, '/')));
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const blocked = [];
  await page.route('**/*', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/' || allowed.has(p)) return route.continue();
    blocked.push(p); return route.abort();
  });
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'TITLE');
  assert.deepEqual(blocked.filter((p) => !p.endsWith('favicon.ico') && !p.endsWith('hc_logomark.png')), [], 'unexpected requests');
  await ctx.close();
});
