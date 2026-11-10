import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const screen = (page) => page.evaluate(() => document.body.dataset.screen);
const canvas = (page) => page.evaluate(() => document.querySelector('#art').toDataURL());
async function nextUntil(page, pred, max = 40) { for (let i = 0; i < max; i++) { if (await pred()) return; await page.click('#btn-next', { timeout: 1500 }).catch(() => {}); await page.waitForTimeout(40); } throw new Error('exhausted'); }
async function fullRun(page) {
  await page.click('#btn-start'); await page.click('#btn-begin');
  for (let i = 0; i < 5; i++) {
    await nextUntil(page, async () => (await screen(page)) === 'CHOICE');
    await page.click(i % 2 ? '#opt-b' : '#opt-a');
    await page.waitForFunction(() => ['WIN', 'LOSE'].includes(document.body.dataset.screen));
    await nextUntil(page, () => page.isVisible('#btn-continue'));
    await page.click('#btn-continue');
  }
  await nextUntil(page, () => page.isVisible('#btn-claim'));
  await page.click('#btn-claim');
  await page.fill('#claim-email', 'a@b.co'); await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'COMPLETE');
}

test('reduced motion: full run works and every scene canvas is a still', async () => {
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  // title still (with static logo) does not change
  await page.waitForTimeout(300);
  const t1 = await canvas(page); await page.waitForTimeout(1000); const t2 = await canvas(page);
  assert.equal(t1, t2, 'title canvas changed under reduced motion');
  await page.click('#btn-start'); await page.click('#btn-begin');
  await page.waitForTimeout(300);
  const a = await canvas(page); await page.waitForTimeout(1000); const b = await canvas(page);
  assert.equal(a, b, 'scene canvas changed under reduced motion');
  // typewriter completes instantly
  assert.equal(await page.evaluate(() => window.__oq.typing), false);
  await page.goto(server.baseURL); await page.waitForFunction(() => window.__oq?.ready === true);
  await fullRun(page);
  await ctx.close();
});

test('normal motion: full run works and scene canvases animate', async () => {
  const { ctx, page } = await open();
  await page.click('#btn-start'); await page.click('#btn-begin');
  await page.waitForTimeout(600);
  const samples = [];
  for (let k = 0; k < 6; k++) { samples.push(await canvas(page)); await page.waitForTimeout(250); }
  assert.ok(new Set(samples).size >= 2, 'S1 canvas never changed');
  await page.goto(server.baseURL); await page.waitForFunction(() => window.__oq?.ready === true);
  await fullRun(page);
  await ctx.close();
});
