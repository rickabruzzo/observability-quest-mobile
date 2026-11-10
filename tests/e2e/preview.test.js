import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function snapshots(page) {
  return page.evaluate(() => [...document.querySelectorAll('canvas.preview')].map((c) => [c.dataset.scene, c.toDataURL(), c.dataset.static === '1']));
}

test('every preview canvas animates', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL + 'anim-preview.html');
  await page.waitForFunction(() => window.__preview?.ready === true, null, { timeout: 20000 });
  await page.evaluate(() => window.__preview.setTyping(true));
  await page.waitForTimeout(800);
  const samples = [];
  for (let k = 0; k < 8; k++) { samples.push(await snapshots(page)); await page.waitForTimeout(230); }
  const a = samples[0];
  assert.ok(a.length >= 6, `only ${a.length} canvases`);
  for (let i = 0; i < a.length; i++) {
    if (a[i][2]) continue; // declared static (e.g. a portrait with no frames yet)
    const distinct = new Set(samples.map((s) => s[i][1])).size;
    assert.ok(distinct >= 2, `${a[i][0]} never changed across ${samples.length} samples`);
  }
  assert.ok(a.filter((x) => !x[2]).length >= 5, 'fewer than 5 animated canvases');
  await ctx.close();
});

test('under reduced motion every canvas is a still', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(server.baseURL + 'anim-preview.html');
  await page.waitForFunction(() => window.__preview?.ready === true, null, { timeout: 20000 });
  await page.evaluate(() => window.__preview.setTyping(true));
  await page.waitForTimeout(600);
  const a = await snapshots(page);
  await page.waitForTimeout(1500);
  const b = await snapshots(page);
  for (let i = 0; i < a.length; i++) assert.equal(a[i][1], b[i][1], `${a[i][0]} changed under reduced motion`);
  await ctx.close();
});

test('in the game, the narrator portrait animates on the outcome screen', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  await page.click('#btn-start'); await page.click('#btn-begin');
  for (let i = 0; i < 12 && (await page.evaluate(() => document.body.dataset.screen)) !== 'CHOICE'; i++) { await page.click('#btn-next'); await page.waitForTimeout(20); }
  await page.click('#opt-a');
  await page.waitForFunction(() => document.body.dataset.screen === 'WIN');
  // while typing, the mouth should move: sample the canvas
  await page.waitForTimeout(400);
  const samples = [];
  for (let k = 0; k < 8; k++) { samples.push(await page.evaluate(() => document.querySelector('#art').toDataURL())); await page.waitForTimeout(230); }
  assert.ok(new Set(samples).size >= 2, 'portrait canvas never changed while typing');
  assert.equal(await page.evaluate(() => window.__oq.layer.scene?.still), 'portrait_christine');
  await ctx.close();
});
