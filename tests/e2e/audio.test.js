import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); });
after(async () => { await browser?.close(); await server?.close(); });

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}

test('music is silent on the title screen and starts on START', async () => {
  const { ctx, page } = await open();
  assert.equal(await page.evaluate(() => window.__oq.audio.running), false);
  await page.click('#btn-start');
  assert.equal(await page.evaluate(() => window.__oq.audio.running), true);
  assert.equal(await page.evaluate(() => !!window.__oq.audio.context), true);
  await ctx.close();
});

test('mute toggle persists for the session and is visible on every screen', async () => {
  const { ctx, page } = await open();
  assert.equal(await page.isVisible('#btn-mute'), true);
  await page.click('#btn-mute');
  assert.equal(await page.getAttribute('#btn-mute', 'aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('oq.muted')), '1');
  await page.reload();
  await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await page.getAttribute('#btn-mute', 'aria-pressed'), 'true');
  await page.click('#btn-start'); assert.equal(await page.isVisible('#btn-mute'), true);
  await page.click('#btn-begin'); assert.equal(await page.isVisible('#btn-mute'), true);
  await ctx.close();
});
