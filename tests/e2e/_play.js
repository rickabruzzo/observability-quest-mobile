// Shared moves for the scenario e2e tests: get through the intro, pick a scenario, tap things, close windows.
import assert from 'node:assert/strict';
import { SCRIPT } from '../../js/script.js';
import { CH1 } from '../../js/chapters/ch1.js';
import { personaLine, speakerOf } from '../../js/engine/conversation.js';

/** What the window shows for a script key: the persona's lines lose their `CTO:` prefix (the name is on the window). */
export const shown = (key) => personaLine(SCRIPT[key], speakerOf(SCRIPT[CH1.persona.name])).text;

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

/** Taps the open window until it closes (one tap completes the typing, the next turns or closes). Returns its text. */
export async function dismiss(page) {
  await winOpen(page);
  const first = (await ch(page)).window;
  for (let i = 0; i < 40; i++) {
    const w = (await ch(page)).window;
    if (!w || w.id !== first.id) return first.text;
    await page.click('.msg');
  }
  throw new Error('window would not close');
}
/** Like dismiss, for any screen (the menu has no __oq.chapter): taps the open .msg until it closes or changes. */
export async function dismissMsg(page) {
  await page.waitForSelector('.msg', { timeout: 9000 });
  const first = await page.locator('.msg').getAttribute('data-text');
  for (let i = 0; i < 40; i++) {
    const now = await page.evaluate(() => document.querySelector('.msg')?.dataset.text ?? null);
    if (now !== first) return first;
    await page.click('.msg').catch(() => {});
  }
  throw new Error('window would not close');
}
/** Charity's verdict after a Claim: her header and the three lines, in order; returns the lines' texts. */
export async function charitySays(page) {
  await page.waitForSelector('#charity', { timeout: 9000 });
  const head = await page.locator('.charity-head').innerText();
  const lines = [await dismissMsg(page), await dismissMsg(page), await dismissMsg(page)];
  await page.waitForFunction(() => !document.querySelector('#charity'));
  return { head, lines };
}
export async function tapSpot(page, id) {
  const sc = await page.locator('#scene').boundingBox();
  const r = await page.evaluate((i) => window.__oq.chapter.hotspot(i).rect, id);
  await page.mouse.click(sc.x + ((r.x + r.w / 2) * sc.width) / 320, sc.y + ((r.y + r.h / 2) * sc.height) / 200);
}
export const inState = (page, s, timeout = 9000) => page.waitForFunction((v) => window.__oq.chapter.state === v && !window.__oq.chapter.busy, s, { timeout });
export const toolOpen = (page, name) => page.waitForFunction((n) => window.__oq.chapter.tool?.name === n && window.__oq.chapter.state === 'tool', name, { timeout: 9000 });
export const promptsShown = (page) => page.waitForFunction(() => { const b = document.querySelector('.tool-prompts'); return b && !b.hidden && !window.__oq.chapter.window; }, null, { timeout: 9000 });
export async function prompt(page, i) { await promptsShown(page); await page.click(`.tool-prompts .prompt[data-index="${i}"]`); }
/** A PC menu item (or an email: 'email-3'), once no window is in the way. */
export async function pcPick(page, id) {
  await page.waitForFunction((i) => window.__oq.chapter.state === 'pc' && !window.__oq.chapter.window && document.querySelector(`.pc-item[data-id="${i}"]`), id, { timeout: 9000 });
  await page.click(`.pc-item[data-id="${id}"]`);
}
export async function toPc(page) { await tapSpot(page, 'pc'); await inState(page, 'pc'); }
/** Honeycomb, opened from wherever it is open: intro (first time), two right answers, the two results. */
export async function solveHc(page, { wrongFirst = false, intro = true } = {}) {
  await toolOpen(page, 'hc');
  if (intro) assert.equal(await dismiss(page), SCRIPT['ch1.hc.intro']);
  if (wrongFirst) { await prompt(page, 1); assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.jab.2']); }
  await prompt(page, 0);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step1.result']);
  await prompt(page, 0);
  assert.equal(await dismiss(page), SCRIPT['ch1.hc.step2.result']);
}
/** [Apply the fix and deploy], then watch Otto recover on the monitor until he speaks; back on the PC (or at the win). */
export async function deployAndRecover(page) {
  await pcPick(page, 'deploy');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.deploy']);
  await page.waitForFunction(() => window.__oq.chapter.state === 'recover', null, { timeout: 9000 });
  assert.equal(await dismiss(page), SCRIPT['ch1.otto.recovered']);
}
export async function leavePc(page) {
  await pcPick(page, 'leave');
  assert.equal(await dismiss(page), SCRIPT['ch1.pc.leave']);
  await inState(page, 'room');
}
/** The persona's card, if it is up: a tap anywhere closes it. Resolves true if it was. */
export async function closeCard(page) {
  const up = await page.waitForFunction(() => !!document.querySelector('#persona-card') || !!window.__oq.chapter.window, null, { timeout: 9000 })
    .then(() => page.evaluate(() => !!document.querySelector('#persona-card')));
  if (!up) return false;
  await page.waitForTimeout(250);                        // the flip
  await page.click('#persona-card');
  await page.waitForFunction(() => !document.querySelector('#persona-card'));
  return true;
}
/** Use on the CTO: the walk over, her card the first time this visit (closed), then her line is up. */
export async function talkToCto(page) {
  await tapSpot(page, 'cto');
  await closeCard(page);
  await winOpen(page);
}
/** Walk to the CTO and hear her question; the options are up. */
export async function askCto(page) {
  await talkToCto(page);
  assert.equal(await dismiss(page), shown('ch1.cto.ask'));
  await inState(page, 'decide');
}
/** The persona's options are up (after one of her lines); pick one by id: sign, hc, show, leave. */
export async function pickOption(page, id) {
  await page.waitForFunction((i) => window.__oq.chapter.state === 'decide' && !window.__oq.chapter.window && document.querySelector(`#decide-${i}`), id, { timeout: 9000 });
  await page.click(`#decide-${id}`);
}
export async function winLines(page) {
  assert.equal(await dismiss(page), SCRIPT['ch1.win']);
  assert.equal(await dismiss(page), shown('ch1.hero.line'));
  assert.equal((await ch(page)).state, 'verdict');
  assert.equal(await dismiss(page), SCRIPT['ch1.verdict']);
  await page.waitForSelector('#summary');
}

/** The shortest path: card → PC → Honeycomb (direct, or one nudge first) → deploy → recovery → leave → CTO → [Get Honeycomb] → summary. */
export async function playShortest(page, { wrongFirst = false, cave = false } = {}) {
  await page.click('#class-card');
  assert.equal(await dismiss(page), SCRIPT['ch1.room.enter']);
  await toPc(page);
  if (cave) {                                                          // one Cave Logs prompt first: a misstep
    await pcPick(page, 'old'); await toolOpen(page, 'old'); await dismiss(page);
    await prompt(page, 0); await dismiss(page);
    await promptsShown(page); await page.click('#tool-exit');
    assert.equal(await dismiss(page), SCRIPT['ch1.old.exit']);
  }
  await pcPick(page, 'hc');
  await solveHc(page, { wrongFirst });
  await inState(page, 'pc');
  await deployAndRecover(page);
  await inState(page, 'pc');
  await leavePc(page);
  await askCto(page);
  await page.click('#decide-hc');
  await winLines(page);
}
