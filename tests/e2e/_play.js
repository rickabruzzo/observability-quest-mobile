// Shared moves for the scenario e2e tests: get through the intro, pick a scenario, tap things, close windows.
import assert from 'node:assert/strict';
import { SCRIPT } from '../../js/script.js';

/** Title → sheet → Start → Skip; lands on the menu, or straight in the chapter with ?ch=1. */
export async function openGame(browser, server, { w = 844, h = 390, query = '', reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e));
  page.errors = errors;
  await page.goto(server.baseURL + query, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__oq?.ready === true);
  await throughIntro(page);
  return { ctx, page };
}
export async function throughIntro(page) {
  await page.click('#btn-start');
  await page.waitForFunction(() => document.body.dataset.screen === 'CREATOR');
  await page.waitForTimeout(400);
  await page.click('#btn-start-game');
  await page.click('#btn-skip');
  await page.waitForFunction(() => ['MENU', 'CHAPTER'].includes(document.body.dataset.screen));
  await page.waitForTimeout(400);                       // past the double-tap guard, like a person
}
export async function pickScenario(page, n = 1) {
  await page.click(`.menu-row[data-ch="${n}"]`);
  await page.waitForFunction(() => document.body.dataset.screen === 'CHAPTER' && window.__oq.chapter?.state === 'card');
}
export const ch = (page) => page.evaluate(() => { const c = window.__oq.chapter; return { state: c.state, mode: c.mode, x: c.x, walking: c.walking, window: c.window, tool: c.tool, busy: c.busy }; });
export const run = (page) => page.evaluate(() => window.__oq.run);
export const winOpen = (page) => page.waitForFunction(() => !!window.__oq.chapter.window, null, { timeout: 9000 });

/** Taps the open window until it closes (one tap completes the typing, the next turns or closes). */
export async function dismiss(page) {
  await winOpen(page);
  const first = (await ch(page)).window.text;
  for (let i = 0; i < 40; i++) {
    const w = (await ch(page)).window;
    if (!w || w.text !== first) return first;
    await page.click('.msg');
  }
  throw new Error('window would not close');
}
export async function tapSpot(page, id) {
  const sc = await page.locator('#scene').boundingBox();
  const r = await page.evaluate((i) => window.__oq.chapter.hotspot(i).rect, id);
  await page.mouse.click(sc.x + ((r.x + r.w / 2) * sc.width) / 320, sc.y + ((r.y + r.h / 2) * sc.height) / 200);
}
export const toolOpen = (page, name) => page.waitForFunction((n) => window.__oq.chapter.tool?.name === n && window.__oq.chapter.state === 'tool', name, { timeout: 9000 });
export const promptsShown = (page) => page.waitForFunction(() => { const b = document.querySelector('.tool-prompts'); return b && !b.hidden && !window.__oq.chapter.window; }, null, { timeout: 9000 });
export async function prompt(page, i) { await promptsShown(page); await page.click(`.tool-prompts .prompt[data-index="${i}"]`); }

/** From the class card to the summary by the Honeycomb path; `wrongFirst` tries prompt 2 of step 1 first. */
export async function playShortest(page, { wrongFirst = false } = {}) {
  await page.click('#class-card');
  assert.equal(await dismiss(page), SCRIPT['ch1.room.enter']);
  await tapSpot(page, 'workstation');
  await toolOpen(page, 'hc');
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.intro']);
  if (wrongFirst) { await prompt(page, 1); assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.jab.2']); }
  await prompt(page, 0);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.result']);
  await prompt(page, 0);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step2.result']);
  assert.equal(await dismiss(page), SCRIPT['ch1.win']);
  assert.equal(await dismiss(page), SCRIPT['ch1.hero.line']);
  assert.equal((await ch(page)).state, 'verdict');
  assert.equal(await dismiss(page), SCRIPT['ch1.verdict']);
  await page.waitForSelector('#summary');
}

