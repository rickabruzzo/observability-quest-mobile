import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

async function openCreator(opts = {}, init = null) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { throw e; });
  if (init) await page.addInitScript(init);
  await page.goto(server.baseURL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400); // past the double-tap guard, like a person would be
  return { ctx, page };
}
const hero = (page) => page.evaluate(() => window.__oq.creator.hero);

test('sheet: 7 FACE rows, 4 KIT rows, every option 44px+, hero drawn', async () => {
  const { ctx, page } = await openCreator();
  assert.equal(await page.locator('.sheet-row').count(), 7);
  const boxes = await page.locator('.opt').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  assert.ok(boxes.every(([w, h]) => w >= 44 && h >= 44), JSON.stringify(boxes.filter(([w, h]) => w < 44 || h < 44)));
  assert.ok(boxes.length <= 5 * 7 + 3);
  await page.click('.tab[data-page="kit"]');
  assert.equal(await page.locator('.sheet-row').count(), 5); // name row + hoodie, jeans, glasses, holding
  const painted = await page.evaluate(() => {
    const c = document.querySelector('#hero-view'); const d = c.getContext('2d').getImageData(0, 0, 28, 72).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n;
  });
  assert.ok(painted > 600, `painted ${painted}`);
  await ctx.close();
});

test('picking updates state; hair drags beard colour until beard colour is picked', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="hair"][data-value="ginger"]');
  assert.equal((await hero(page)).beardCol, 'ginger');
  await page.click('.opt[data-key="beardCol"][data-value="black"]');
  await page.click('.opt[data-key="hair"][data-value="violet"]');
  const h = await hero(page);
  assert.equal(h.hair, 'violet'); assert.equal(h.beardCol, 'black');
  assert.equal(await page.locator('.opt[data-key="hair"][data-value="violet"]').getAttribute('aria-pressed'), 'true');
  await ctx.close();
});

test('preset buttons replace appearance; RANDOM changes something', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.opt[data-key="body"][data-value="fem"]');
  assert.equal((await hero(page)).hoodie, 'honey');
  const before = JSON.stringify(await hero(page));
  let changed = false;
  for (let i = 0; i < 5 && !changed; i++) { await page.click('#btn-random'); changed = JSON.stringify(await hero(page)) !== before; }
  assert.ok(changed);
  await ctx.close();
});

test('name sheet cleans input and shows on the button', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.tab[data-page="kit"]');   // the name lives on the KIT page
  await page.click('#name-btn');
  await page.click('#name-btn').catch(() => {}); // a second tap while the sheet is open is ignored
  assert.equal(await page.locator('#name-sheet').count(), 1);
  await page.fill('#name-sheet input', '  Ada\u0007 Lovelace of the Night Shift  ');
  await page.click('#name-sheet button');
  assert.equal(await page.locator('#name-sheet').count(), 0);
  assert.equal((await hero(page)).name, 'Ada Lovelace of');
  assert.equal(await page.locator('#name-btn').innerText(), 'Ada Lovelace of');
  await ctx.close();
});

test('START persists and goes to PREVIEW; reload keeps the hero', async () => {
  const { ctx, page } = await openCreator();
  await page.click('.tab[data-page="kit"]');
  await page.click('.opt[data-key="hoodie"][data-value="lime"]');
  await page.click('#btn-start-game');
  await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('oq.hero')).hoodie), 'lime');
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  assert.equal((await hero(page)).hoodie, 'lime');
  await ctx.close();
});

test('storage throwing does not break the creator or START', async () => {
  const { ctx, page } = await openCreator({}, () => { Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('denied'); } }); });
  await page.click('.opt[data-key="skin"][data-value="4"]');
  assert.equal((await hero(page)).skin, 4);
  await page.click('#btn-start-game');
  await page.waitForFunction(() => document.body.dataset.screen === 'PREVIEW');
  await ctx.close();
});

test('corrupt stored hero is sanitised', async () => {
  const { ctx, page } = await openCreator({}, () => { sessionStorage.setItem('oq.hero', '{"body":"robot","hoodie":"lime","name":42'); });
  const h = await hero(page);
  assert.equal(h.body, 'masc'); assert.equal(h.name, '');
  await ctx.close();
});

for (const [w, h] of [[667, 375], [800, 360], [844, 390], [932, 430]]) {
  test(`${w}x${h}: every sheet control is a 44px target fully inside the viewport, on both pages`, async () => {
    const { ctx, page } = await openCreator({ viewport: { width: w, height: h } });
    for (const tab of ['face', 'kit']) {
      await page.click(`.tab[data-page="${tab}"]`);
      const bad = await page.evaluate(([W, H]) => {
        const out = [];
        for (const el of document.querySelectorAll('.opt, .tab, #name-btn, #btn-random, #btn-start-game, #hero-view')) {
          const r = el.getBoundingClientRect();
          const target = el.id !== 'hero-view';
          if (r.left < -0.5 || r.top < 19.5 || r.right > W + 0.5 || r.bottom > H + 0.5) out.push(`${el.id || el.className} off-screen ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.right)},${Math.round(r.bottom)}`);
          if (target && (r.width < 44 || r.height < 44)) out.push(`${el.id || el.className} ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        return out;
      }, [w, h]);
      assert.deepEqual(bad, [], `${tab} page`);
    }
    await ctx.close();
  });
}
