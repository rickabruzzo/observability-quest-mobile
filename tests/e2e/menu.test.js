// The scenario menu: five rows, only the first playable; completion ticks and best scores that survive a
// reload; replays keep the better score and restart the clock; ?ch=1 skips the menu; the claim placeholder.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { openGame, throughIntro, pickScenario, run, dismiss, playShortest } from './_play.js';

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
    assert.deepEqual(await rows.evaluateAll((bs) => bs.map((b) => b.disabled)), [false, true, true, true, true]);
    for (let n = 1; n <= 5; n++) {
      const t = (await rows.nth(n - 1).innerText()).replace(/\s+/g, ' ');
      assert.ok(t.includes(SCRIPT[`menu.ch${n}.name`]) && t.includes(SCRIPT[`menu.ch${n}.hook`]), t);
    }
    assert.match(await rows.nth(1).innerText(), /coming soon/);
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
    await page.locator('.menu-row[data-ch="2"]').click({ force: true });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU', 'a disabled row does nothing');
    await ctx.close();
  });
}

test('finishing scenario 1 ticks it with its score; the mark survives a reload; a worse replay keeps the better score', async () => {
  const { ctx, page } = await openGame(browser, server);
  await pickScenario(page);
  await playShortest(page);
  await backToMenu(page);
  const row = page.locator('.menu-row[data-ch="1"]');
  assert.match(await row.innerText(), new RegExp(`${SCRIPT['menu.done']}\\s*100`));
  assert.match(await page.locator('#sb-score').innerText(), /Score: 100 of 500/);
  assert.ok(await page.locator('#btn-menu-claim').isVisible(), 'the menu carries the claim button once one is done');
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.done'))), { 1: 100 });

  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await throughIntro(page);
  assert.match(await page.locator('.menu-row[data-ch="1"]').innerText(), /100/);
  assert.match(await page.locator('#sb-score').innerText(), /Score: 100 of 500/);

  await pickScenario(page);
  await playShortest(page, { wrongFirst: true });
  assert.equal((await run(page)).score, 50);
  assert.match(await page.locator('#sb-score').innerText(), /Score: 100 of 500/, 'the score never goes down');
  await backToMenu(page);
  assert.match(await page.locator('.menu-row[data-ch="1"]').innerText(), /100/);
  assert.deepEqual(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.done'))), { 1: 100 });
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

test('?ch=1 skips the menu; ?ch=2 (not built) and junk show it', async () => {
  for (const [q, want] of [['?ch=1', 'CHAPTER'], ['?ch=2', 'MENU'], ['?ch=x', 'MENU']]) {
    const { ctx, page } = await openGame(browser, server, { query: q });
    assert.equal(await page.evaluate(() => document.body.dataset.screen), want, q);
    if (want === 'CHAPTER') assert.equal(await page.evaluate(() => window.__oq.chapter.state), 'card');
    await ctx.close();
  }
});

test('Claim says it is not built yet and returns to the menu; so does the menu\'s claim button', async () => {
  const { ctx, page } = await openGame(browser, server, { query: '?ch=1' });
  await playShortest(page);
  await page.click('#btn-claim');
  await dismiss(page);
  await page.waitForFunction(() => document.body.dataset.screen === 'MENU');
  await page.waitForTimeout(400);
  await page.click('#btn-menu-claim');
  await page.waitForSelector('.msg');
  await page.click('.msg'); await page.click('.msg');
  await page.waitForFunction(() => !document.querySelector('.msg'));
  assert.equal(await page.evaluate(() => document.body.dataset.screen), 'MENU');
  await ctx.close();
});
