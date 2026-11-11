import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function open(width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const box = (page, sel) => page.locator(sel).boundingBox();

for (const [w, h] of [[844, 390], [667, 375], [932, 430]]) {
  test(`${w}x${h}: scene is 16:10 under the bar, columns >= 56, no overflow`, async () => {
    const { ctx, page } = await open(w, h);
    const sb = await box(page, '#statusbar'), sc = await box(page, '#scene'), cl = await box(page, '#col-l');
    assert.equal(Math.round(sb.height), 20);
    assert.ok(Math.abs(sc.width / sc.height - 1.6) < 0.02, `ratio ${sc.width / sc.height}`);
    assert.ok(sc.y >= 20 && sc.y + sc.height <= h + 1, `scene y ${sc.y} h ${sc.height}`);
    assert.ok(cl.width >= 56, `col ${cl.width}`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'TITLE');
    await ctx.close();
  });
}

test('portrait shows the rotate gate and pauses; landscape hides it', async () => {
  const { ctx, page } = await open(390, 844);
  assert.equal(await page.locator('#rotate').isVisible(), true);
  assert.equal(await page.evaluate(() => window.__oq.paused), true);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#rotate').isVisible(), false);
  assert.equal(await page.evaluate(() => window.__oq.paused), false);
  await ctx.close();
});

test('desktop never sees the gate and START reaches the creator once per tap', async () => {
  const { ctx, page } = await open(1280, 800, { isMobile: false, hasTouch: false });
  assert.equal(await page.locator('#rotate').isVisible(), false);
  const b = await box(page, '#btn-start');
  assert.ok(b.width >= 44 && b.height >= 44);
  await page.click('#btn-start');
  await page.click('#btn-start').catch(() => {});
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal(await page.evaluate(() => window.__oq.transitions), 1);
  await ctx.close();
});
