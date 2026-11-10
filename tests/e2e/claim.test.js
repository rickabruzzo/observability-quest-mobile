import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function open(url = '') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL + url);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}
const screen = (page) => page.evaluate(() => document.body.dataset.screen);

async function nextUntil(page, pred, max = 30) {
  for (let i = 0; i < max; i++) {
    if (await pred()) return;
    await page.click('#btn-next'); // finishes typing on first tap, advances on the next
    await page.waitForTimeout(20);
  }
  throw new Error('nextUntil exhausted');
}

async function reachClaim(page) {
  await page.click('#btn-start'); await page.click('#btn-begin');
  for (let i = 0; i < 5; i++) {
    await nextUntil(page, async () => (await screen(page)) === 'CHOICE');
    await page.click('#opt-a');
    await page.waitForFunction(() => document.body.dataset.screen === 'WIN');
    await nextUntil(page, () => page.isVisible('#btn-continue'));
    await page.click('#btn-continue');
  }
  await nextUntil(page, () => page.isVisible('#btn-claim'));
  await page.click('#btn-claim');
  assert.equal(await screen(page), 'CLAIM');
}

test('placeholder form validates, then completes with score', async () => {
  const { ctx, page } = await open('?e=testshow');
  await reachClaim(page);
  await page.fill('#claim-email', 'nope');
  await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'CLAIM');
  assert.match(await page.textContent('#claim-error'), /email/i);
  await page.fill('#claim-email', 'a@b.co');
  await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'COMPLETE');
  const txt = await page.textContent('#complete');
  assert.match(txt, /YOU FINISHED/); assert.match(txt, /5\/5/); assert.match(txt, /BOOTH STAFF/);
  assert.equal(await page.isVisible('#btn-redeem'), true);
  await ctx.close();
});

test('redeem needs two taps, persists across reload, and play-again keeps it', async () => {
  const { ctx, page } = await open();
  await reachClaim(page);
  await page.fill('#claim-email', 'a@b.co'); await page.click('#btn-claim-submit');
  await page.click('#btn-redeem');
  assert.equal(await page.evaluate(() => document.querySelector('#complete').classList.contains('redeemed')), false);
  assert.match(await page.textContent('#btn-redeem'), /CONFIRM/);
  await page.click('#btn-redeem');
  assert.equal(await page.evaluate(() => document.querySelector('#complete').classList.contains('redeemed')), true);
  assert.equal(await page.evaluate(() => localStorage.getItem('oq.redeemed')), '1');
  // reload lands on the completion screen, still redeemed
  await page.reload();
  await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await screen(page), 'COMPLETE');
  assert.equal(await page.evaluate(() => document.querySelector('#complete').classList.contains('redeemed')), true);
  // play again returns to title with a fresh score; redeemed flag stays
  await page.click('#btn-play-again');
  assert.equal(await screen(page), 'TITLE');
  assert.equal(await page.evaluate(() => window.__oq.score), 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('oq.redeemed')), '1');
  await ctx.close();
});

test('reload mid-game returns to the title', async () => {
  const { ctx, page } = await open();
  await page.click('#btn-start'); await page.click('#btn-begin');
  assert.equal(await screen(page), 'INTRO');
  await page.reload();
  await page.waitForFunction(() => window.__oq?.ready === true);
  assert.equal(await screen(page), 'TITLE');
  await ctx.close();
});

test('fallback path when HubSpot is configured but unreachable', async () => {
  const { ctx, page } = await open();
  await page.route('**/js.hsforms.net/**', (r) => r.abort());
  await page.evaluate(() => { window.__oq.hubspot.portalId = '1'; window.__oq.hubspot.formId = 'x'; });
  await reachClaim(page);
  await page.waitForSelector('#btn-claim-continue', { timeout: 10000 });
  assert.match(await page.textContent('#textbox'), /grab your email at the booth/i);
  await page.click('#btn-claim-continue');
  assert.equal(await screen(page), 'COMPLETE');
  await ctx.close();
});
