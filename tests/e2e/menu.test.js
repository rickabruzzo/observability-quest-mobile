// The scenario menu: five rows, only the first playable; solved scenarios ticked (no number) and kept across a
// reload; a replay keeps the fewer missteps and restarts the clock; ?ch=1 skips the menu; Charity on Claim.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { openGame, throughIntro, pickScenario, run, dismiss, playShortest, charitySays } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const backToMenu = async (page) => {
  await page.click('#btn-more');
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU');
  await page.waitForTimeout(400);
};

for (const [w, h] of [[844, 390], [667, 375]]) {
  test(`${w}x${h}: five rows from the script, only the first enabled, 44 px, no scrolling`, async () => {
    const { ctx, page } = await openGame(browser, server, { w, h });
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU');
    assert.equal(await page.locator('.menu h2').innerText(), SCRIPT['menu.title']);
    assert.equal(await page.locator('.menu-hint').innerText(), SCRIPT['menu.hint']);
    const rows = page.locator('.menu-row');
    assert.equal(await rows.count(), 5);
    assert.deepEqual(await rows.evaluateAll((bs) => bs.map((b) => b.disabled)), [false, false, true, true, true]);
    for (let n = 1; n <= 5; n++) {
      const t = (await rows.nth(n - 1).innerText()).replace(/\s+/g, ' ');
      assert.ok(t.includes(SCRIPT[`menu.ch${n}.name`]) && t.includes(SCRIPT[`menu.ch${n}.hook`]), t);
    }
    assert.match(await rows.nth(2).innerText(), /coming soon/);
    const bad = await page.evaluate(() => {
      const b = document.querySelector('#scene-box').getBoundingClientRect(), m = document.querySelector('.menu');
      const out = [];
      if (m.scrollHeight > m.clientHeight + 1) out.push('menu scrolls');
      for (const r of document.querySelectorAll('.menu-row')) {
        const q = r.getBoundingClientRect();
        if (q.height < 44 || q.width < 44) out.push(`row ${q.width}x${q.height}`);
        if (q.top < b.top || q.bottom > b.bottom + 0.5 || q.left < b.left || q.right > b.right + 0.5) out.push(`row outside ${JSON.stringify(q)}`);
        for (const s of r.querySelectorAll('span')) if (s.scrollHeight > r.clientHeight + 1) out.push(`text overflows: ${s.textContent}`);
        if (r.scrollHeight > r.clientHeight + 1) out.push(`row overflows: ${r.textContent.trim().slice(0, 30)}`);
      }
      return out;
    });
    assert.deepEqual(bad, []);
    assert.equal(await page.locator('#btn-menu-claim').count(), 0, 'no claim before a scenario is done');
    await page.locator('.menu-row[data-ch="3"]').click({ force: true });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU', 'a disabled row does nothing');
    await ctx.close();
  });
}

test('solving scenario 1 ticks it, with no number; the status bar counts it; the mark survives a reload; a replay keeps the fewer missteps', async () => {
  const { ctx, page } = await openGame(browser, server);
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 0 of 5');
  await pickScenario(page);
  await playShortest(page);
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');
  await backToMenu(page);
  const row = page.locator('.menu-row[data-ch="1"]');
  assert.equal(await row.locator('.mr-tick').count(), 1);
  assert.equal((await row.locator('.mr-mark').innerText()).trim(), SCRIPT['menu.done']);
  assert.doesNotMatch(await page.locator('.menu').innerText(), /\d{2,}|score/i, 'no number on the menu');
  assert.ok(await page.locator('#btn-menu-claim').isVisible(), 'the menu carries the claim button once one is solved');
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.done'))), { v: 2, done: { 1: 0 } });

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await throughIntro(page);
  assert.equal(await page.locator('.menu-row[data-ch="1"] .mr-tick').count(), 1);
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');

  await pickScenario(page);                                            // a replay with a misstep keeps the clean record
  await playShortest(page, { cave: true });
  assert.equal((await run(page)).missteps, 1);
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.done'))), { v: 2, done: { 1: 0 } });
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');
  await ctx.close();
});

test('an old-format oq.done (scenario → score) is read: 100 is a clean solve, and the game carries on', async () => {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e));
  await page.addInitScript(() => { if (!sessionStorage.getItem('oq.seeded')) { sessionStorage.setItem('oq.done', '{"1":100}'); sessionStorage.setItem('oq.seeded', '1'); } });
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await throughIntro(page);
  assert.equal(await page.locator('#sb-done').innerText(), 'Solved: 1 of 5');
  assert.equal(await page.locator('.menu-row[data-ch="1"] .mr-tick').count(), 1);
  await page.click('#btn-menu-claim');
  const { lines } = await charitySays(page);
  assert.equal(lines[0], SCRIPT['final.clean']);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('a replay from the menu starts at the class card with the clock reset', async () => {
  const { ctx, page } = await openGame(browser, server);
  await pickScenario(page);
  await playShortest(page);
  const first = await run(page);
  await backToMenu(page);
  await pickScenario(page);
  const fresh = await run(page);
  assert.equal(await page.evaluate(() => window.__oq.chapter.state), 'card');
  assert.equal(fresh.done, false); assert.equal(fresh.phase, 'card');
  assert.ok(fresh.total < 1000 && fresh.total < first.total, `${fresh.total}`);
  assert.equal(fresh.counts.windows, 1);
  await ctx.close();
});

test('?ch=1 skips the menu; ?ch=3 (not built) and junk show it', async () => {
  for (const [q, want] of [['?ch=1', 'CHAPTER'], ['?ch=3', 'MENU'], ['?ch=x', 'MENU']]) {
    const { ctx, page } = await openGame(browser, server, { query: q });
    assert.equal(await page.evaluate(() => document.body.dataset.screen), want, q);
    if (want === 'CHAPTER') assert.equal(await page.evaluate(() => window.__oq.chapter.state), 'card');
    await ctx.close();
  }
});

test('Claim: Charity\'s portrait, her header, the clean line, the count line, the not-yet line, then the menu; the menu\'s Claim does the same', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await playShortest(page);
  await page.click('#btn-claim');
  const portrait = await page.locator('.charity-portrait').evaluate((img) => new Promise((ok) => (img.complete ? ok(img.naturalWidth) : img.addEventListener('load', () => ok(img.naturalWidth)))));
  assert.equal(portrait, 640);
  const a = await charitySays(page);
  assert.equal(a.head, SCRIPT['final.header']);
  assert.deepEqual(a.lines, [SCRIPT['final.clean'], SCRIPT['final.count.one'], 'The prize desk opens in a later build. For now, back to the menu.']);
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU');
  await page.waitForTimeout(400);
  await page.click('#btn-menu-claim');
  const b = await charitySays(page);
  assert.deepEqual(b.lines.slice(0, 2), [SCRIPT['final.clean'], SCRIPT['final.count.one']]);
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU');
  assert.ok(await page.locator('.menu').isVisible());
  await ctx.close();
});
