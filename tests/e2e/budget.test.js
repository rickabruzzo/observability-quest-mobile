import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const screen = (page) => page.evaluate(() => document.body.dataset.screen);
async function nextUntil(page, pred, max = 30) { for (let i = 0; i < max; i++) { if (await pred()) return; await page.click('#btn-next'); await page.waitForTimeout(20); } throw new Error('exhausted'); }

test('a full run transfers under 3 MB', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  let bytes = 0; const seen = new Map();
  page.on('response', async (r) => { try { const b = await r.body(); bytes += b.length; seen.set(new URL(r.url()).pathname, b.length); } catch { /* aborted */ } });
  await page.goto(server.baseURL);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  await page.waitForSelector('#btn-start:not([disabled])', { timeout: 20000 });
  await page.click('#btn-start'); await page.click('#btn-begin');
  for (let i = 0; i < 5; i++) {
    await nextUntil(page, async () => (await screen(page)) === 'CHOICE');
    await page.waitForTimeout(400); // let the scene's sprites load
    await page.click('#opt-a');
    await page.waitForFunction(() => document.body.dataset.screen === 'WIN');
    await page.waitForTimeout(400);
    await nextUntil(page, () => page.isVisible('#btn-continue'));
    await page.click('#btn-continue');
  }
  await nextUntil(page, () => page.isVisible('#btn-claim'));
  await page.waitForTimeout(400);
  const top = [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p, n]) => `${p} ${(n / 1024).toFixed(0)}K`).join(', ');
  assert.ok(bytes < 3 * 1024 * 1024, `transferred ${(bytes / 1024 / 1024).toFixed(2)} MB; largest: ${top}`);
  await ctx.close();
});

test('title screen is interactive within 2 s on throttled 4G', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 60, downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 1024 * 1024 / 8 });
  const t0 = Date.now();
  await page.goto(server.baseURL);
  await page.waitForFunction(() => window.__oq?.ready === true && document.body.dataset.screen === 'TITLE', null, { timeout: 15000 });
  const dt = Date.now() - t0;
  assert.ok(dt < 2000, `title took ${dt} ms`);
  // and START becomes enabled once everything is preloaded
  await page.waitForSelector('#btn-start:not([disabled])', { timeout: 20000 });
  await ctx.close();
});
