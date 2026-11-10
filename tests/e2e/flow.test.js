import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openGame(width = 390, height = 844, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq && window.__oq.ready === true, null, { timeout: 15000 });
  return { ctx, page };
}

const screen = (page) => page.evaluate(() => document.body.dataset.screen);
const oq = (page, expr) => page.evaluate((e) => Function('return (' + e + ')')().call(null), `window.__oq.${expr}`);

async function clickNextUntil(page, pred, max = 20) {
  for (let i = 0; i < max; i++) {
    if (await pred()) return;
    await page.click('#btn-next');
    await page.waitForTimeout(30);
  }
  throw new Error('clickNextUntil exhausted');
}

async function playScenario(page, choice) {
  await clickNextUntil(page, async () => (await screen(page)) === 'CHOICE');
  await page.click(choice === 'A' ? '#opt-a' : '#opt-b');
  await page.waitForFunction(() => ['WIN', 'LOSE'].includes(document.body.dataset.screen));
  await clickNextUntil(page, async () => page.isVisible('#btn-continue'));
  await page.click('#btn-continue');
}

test('full flow, all-Honeycomb run, at 390', async () => {
  const { ctx, page } = await openGame();
  assert.equal(await screen(page), 'TITLE');
  await page.click('#btn-start');
  assert.equal(await screen(page), 'HOWTO');
  await page.click('#btn-begin');
  assert.equal(await screen(page), 'INTRO');
  for (let i = 0; i < 5; i++) await playScenario(page, 'A');
  assert.equal(await screen(page), 'FINAL');
  assert.equal(await page.evaluate(() => window.__oq.score), 5);
  await clickNextUntil(page, async () => page.isVisible('#btn-claim'));
  const txt = await page.textContent('#textbox');
  assert.match(txt, /Perfect score\./);
  assert.match(txt, /CHARITY MAJORS/);
  await ctx.close();
});

test('mixed run scores 3 and shows the right verdict', async () => {
  const { ctx, page } = await openGame();
  await page.click('#btn-start'); await page.click('#btn-begin');
  for (const c of ['A', 'B', 'A', 'B', 'A']) await playScenario(page, c);
  assert.equal(await page.evaluate(() => window.__oq.score), 3);
  await clickNextUntil(page, async () => page.isVisible('#btn-claim'));
  assert.match(await page.textContent('#textbox'), /Three out of five/);
  await ctx.close();
});

test('narrator header and title shown on outcome', async () => {
  const { ctx, page } = await openGame();
  await page.click('#btn-start'); await page.click('#btn-begin');
  await clickNextUntil(page, async () => (await screen(page)) === 'CHOICE');
  await page.click('#opt-b');
  await page.waitForFunction(() => document.body.dataset.screen === 'LOSE');
  const hdr = await page.textContent('#textbox .hdr');
  assert.match(hdr, /CHRISTINE YEN/); assert.match(hdr, /CEO & CO-FOUNDER/);
  await ctx.close();
});

test('NEXT during typewriter completes page, does not skip', async () => {
  const { ctx, page } = await openGame();
  await page.click('#btn-start'); await page.click('#btn-begin');
  assert.equal(await page.evaluate(() => window.__oq.page), 0);
  // typewriter is running; a tap on NEXT should finish the page, not advance
  await page.click('#btn-next');
  assert.equal(await page.evaluate(() => window.__oq.page), 0);
  assert.equal(await page.evaluate(() => window.__oq.typing), false);
  await page.click('#btn-next');
  assert.equal(await page.evaluate(() => window.__oq.page), 1);
  await ctx.close();
});

test('BACK disabled on first page; BACK from page 1 returns to 0', async () => {
  const { ctx, page } = await openGame();
  await page.click('#btn-start'); await page.click('#btn-begin');
  assert.equal(await page.isDisabled('#btn-back'), true);
  await page.click('#btn-next'); await page.click('#btn-next');
  assert.equal(await page.evaluate(() => window.__oq.page), 1);
  assert.equal(await page.isDisabled('#btn-back'), false);
  await page.click('#btn-back');
  assert.equal(await page.evaluate(() => window.__oq.page), 0);
  await ctx.close();
});

for (const width of [360, 390, 430]) {
  test(`pages never clip at ${width}`, async () => {
    const { ctx, page } = await openGame(width, 800);
    await page.click('#btn-start'); await page.click('#btn-begin');
    const check = async (label) => {
      const r = await page.evaluate(() => {
        const box = document.querySelector('#textbox');
        const lines = [...box.querySelectorAll('.line')];
        return { n: lines.length, pageLen: window.__oq.pages[window.__oq.page].length, sh: box.scrollHeight, ch: box.clientHeight,
          overflow: lines.some((l) => l.getBoundingClientRect().bottom > box.getBoundingClientRect().bottom + 0.5) };
      });
      assert.equal(r.n, r.pageLen, `${label}: line count`);
      assert.ok(r.sh <= r.ch + 1, `${label}: scrollHeight ${r.sh} > clientHeight ${r.ch}`);
      assert.ok(!r.overflow, `${label}: a line overflows the box`);
    };
    // every intro page of every scenario, plus one outcome per scenario
    for (let s = 0; s < 5; s++) {
      await page.evaluate(() => window.__oq.finishTyping());
      while ((await screen(page)) === 'INTRO') {
        await check(`s${s + 1} intro p${await page.evaluate(() => window.__oq.page)}`);
        await page.click('#btn-next'); await page.evaluate(() => window.__oq.finishTyping());
      }
      await page.click(s % 2 ? '#opt-a' : '#opt-b');
      await page.waitForFunction(() => ['WIN', 'LOSE'].includes(document.body.dataset.screen));
      await page.evaluate(() => window.__oq.finishTyping());
      while (!(await page.isVisible('#btn-continue'))) {
        await check(`s${s + 1} outcome p${await page.evaluate(() => window.__oq.page)}`);
        await page.click('#btn-next'); await page.evaluate(() => window.__oq.finishTyping());
      }
      await check(`s${s + 1} outcome last`);
      await page.click('#btn-continue');
    }
    await page.evaluate(() => window.__oq.finishTyping());
    await check('final');
    await ctx.close();
  });
}

test('choice options are at least 48px tall tap targets', async () => {
  const { ctx, page } = await openGame();
  await page.click('#btn-start'); await page.click('#btn-begin');
  await clickNextUntil(page, async () => (await screen(page)) === 'CHOICE');
  for (const id of ['#opt-a', '#opt-b']) {
    const h = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, id);
    assert.ok(h >= 48, `${id} height ${h}`);
  }
  await ctx.close();
});
