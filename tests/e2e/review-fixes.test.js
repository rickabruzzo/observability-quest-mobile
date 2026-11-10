// Regression tests from the whole-branch review.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function open(width = 390, height = 844, url = '') {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL + url);
  await page.waitForFunction(() => window.__oq?.ready === true, null, { timeout: 15000 });
  await page.waitForSelector('#btn-start:not([disabled])', { timeout: 20000 });
  return { ctx, page };
}
const screen = (page) => page.evaluate(() => document.body.dataset.screen);
async function nextUntil(page, pred, max = 40) { for (let i = 0; i < max; i++) { if (await pred()) return; await page.click('#btn-next', { timeout: 1500 }).catch(() => {}); await page.waitForTimeout(40); } throw new Error('exhausted'); }
async function toChoice(page) { await page.click('#btn-start'); await page.click('#btn-begin'); await nextUntil(page, async () => (await screen(page)) === 'CHOICE'); }
async function toClaim(page) {
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
}

test('resize on CHOICE keeps the choice menu', async () => {
  const { ctx, page } = await open();
  await toChoice(page);
  await page.setViewportSize({ width: 390, height: 600 });
  await page.waitForTimeout(300);
  assert.equal(await screen(page), 'CHOICE');
  assert.equal(await page.isVisible('#opt-a'), true);
  await ctx.close();
});

test('resize on CLAIM keeps the form; resize on COMPLETE keeps the panel', async () => {
  const { ctx, page } = await open();
  await toClaim(page);
  await page.setViewportSize({ width: 390, height: 600 });
  await page.waitForTimeout(300);
  assert.equal(await page.isVisible('#claim-email'), true);
  await page.fill('#claim-email', 'a@b.co'); await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'COMPLETE');
  await page.setViewportSize({ width: 390, height: 700 });
  await page.waitForTimeout(300);
  assert.equal(await page.isVisible('#btn-redeem'), true);
  assert.match(await page.textContent('#complete'), /BOOTH STAFF/);
  await ctx.close();
});

test('double-tap on a one-page outcome does not skip it', async () => {
  const { ctx, page } = await open();
  await toChoice(page);
  await page.click('#opt-a');
  await page.waitForFunction(() => document.body.dataset.screen === 'WIN');
  await page.click('#btn-next');                 // finishes typing
  await page.waitForTimeout(10);
  // second tap lands where NEXT SCENARIO is about to appear — must not advance yet
  const box = await page.locator('#controls').boundingBox();
  await page.mouse.click(box.x + box.width - 60, box.y + box.height / 2);
  await page.waitForTimeout(50);
  assert.equal(await screen(page), 'WIN');
  await page.waitForTimeout(500);
  assert.equal(await page.isVisible('#btn-continue'), true);
  await ctx.close();
});

test('no line is wider than the box at 360x640 (ellipsis included)', async () => {
  const { ctx, page } = await open(360, 640);
  await page.click('#btn-start'); await page.click('#btn-begin');
  const check = async (label) => {
    const r = await page.evaluate(() => {
      const box = document.querySelector('#textbox');
      const cs = getComputedStyle(box);
      const right = box.getBoundingClientRect().right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
      const over = [...box.querySelectorAll('.line')].map((l) => { const rg = document.createRange(); rg.selectNodeContents(l); const rr = rg.getBoundingClientRect(); return [l.textContent, rr.right - right]; }).filter(([, d]) => d > 0.5);
      return over;
    });
    assert.deepEqual(r, [], `${label}: lines past the box edge: ${JSON.stringify(r)}`);
  };
  for (let s = 0; s < 5; s++) {
    await page.evaluate(() => window.__oq.finishTyping());
    while ((await screen(page)) === 'INTRO') { await check(`s${s + 1} intro`); await page.click('#btn-next'); await page.evaluate(() => window.__oq.finishTyping()); }
    await page.click(s % 2 ? '#opt-a' : '#opt-b');
    await page.waitForFunction(() => ['WIN', 'LOSE'].includes(document.body.dataset.screen));
    await page.evaluate(() => window.__oq.finishTyping());
    while (!(await page.isVisible('#btn-continue'))) { await check(`s${s + 1} outcome`); await page.click('#btn-next'); await page.evaluate(() => window.__oq.finishTyping()); await page.waitForTimeout(400); }
    await check(`s${s + 1} outcome last`);
    await page.click('#btn-continue');
  }
  await ctx.close();
});

test('short viewport (375x548): claim form and completion panel are reachable by scrolling', async () => {
  const { ctx, page } = await open(375, 548);
  await toClaim(page);
  await page.locator('#btn-claim-submit').scrollIntoViewIfNeeded();
  await page.fill('#claim-email', 'a@b.co'); await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'COMPLETE');
  const visibleTitle = await page.evaluate(() => { const b = document.querySelector('#textbox').getBoundingClientRect(); const t = document.querySelector('.c-title').getBoundingClientRect(); return t.top >= b.top - 0.5; });
  assert.ok(visibleTitle, 'title is cut off at the top');
  await page.locator('#btn-play-again').scrollIntoViewIfNeeded();
  await page.click('#btn-play-again');
  assert.equal(await screen(page), 'TITLE');
  await ctx.close();
});

test('landscape (844x390): the text box still holds several lines', async () => {
  const { ctx, page } = await open(844, 390);
  await page.click('#btn-start'); await page.click('#btn-begin');
  const r = await page.evaluate(() => ({ box: document.querySelector('#textbox').clientHeight, lines: window.__oq.pages[0].length, pages: window.__oq.pages.length }));
  assert.ok(r.box >= 150, `box only ${r.box}px tall`);
  assert.ok(r.lines >= 4, `only ${r.lines} lines per page`);
  await ctx.close();
});

test('malformed ?e= does not stop the game from booting', async () => {
  const { ctx, page } = await open(390, 844, '?e=50%');
  assert.equal(await screen(page), 'TITLE');
  await ctx.close();
});

test('HubSpot fallback keeps the email field and shows the address on the completion screen', async () => {
  const { ctx, page } = await open();
  await page.route('**/js.hsforms.net/**', (r) => r.abort());
  await page.evaluate(() => { window.__oq.hubspot.portalId = '1'; window.__oq.hubspot.formId = 'x'; });
  await toClaim(page);
  await page.waitForSelector('#claim-email', { timeout: 10000 });
  assert.match(await page.textContent('#textbox'), /grab your email at the booth/i);
  await page.fill('#claim-email', 'fallback@example.com'); await page.click('#btn-claim-submit');
  assert.equal(await screen(page), 'COMPLETE');
  assert.match(await page.textContent('#complete'), /fallback@example\.com/);
  await ctx.close();
});
