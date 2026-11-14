// Scenarios 2 to 5, played from their data (Warp brief 08): the shortest path wins and ticks the menu, the wrong
// advice gets its jab and the choice returns, Leave is locked before a tool is tried, the wall close-up opens and
// closes, the text on the PC and wall close-ups stays inside its rectangles at both phone sizes, reduced motion
// plays through. Every expectation comes from the chapter's data module and the script; nothing here names one.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './_server.js';
import { SCRIPT } from '../../js/script.js';
import { CHAPTERS } from '../../js/chapters/index.js';
import { personaLine, speakerOf } from '../../js/engine/conversation.js';
import { openGame, ch, run, winOpen, dismiss, tapSpot, toolOpen, promptsShown, prompt, inState, pcPick, closeCard, pickOption } from './_play.js';

let server, browser;
before(async () => { server = await startServer(); browser = await chromium.launch(); });
after(async () => { await browser?.close(); await server?.close(); });

const PHONES = [[844, 390], [667, 375]];
const NS = Object.keys(CHAPTERS).map(Number).filter((n) => n > 1);

/** The words the window shows for a key of scenario n: the persona's lines lose their prefix. */
const shown = (n, key) => personaLine(SCRIPT[key], speakerOf(SCRIPT[CHAPTERS[n].persona.name])).text;
const item = (n, action) => CHAPTERS[n].pc.menu.find((i) => i.action === action).id;
const spot = (n, what) => CHAPTERS[n].room.hotspots.find((h) => (what === 'persona' ? h.use?.action === 'persona' : h.use?.scene === what)).id;

async function into(n, page) { await page.click('#class-card'); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].enter]); }
async function toPc(n, page) { await tapSpot(page, spot(n, 'pc')); await inState(page, 'pc'); }
async function solveHc(n, page, { nudges = false } = {}) {
  const c = CHAPTERS[n];
  await pcPick(page, item(n, 'tool') === 'hc' ? 'hc' : c.pc.menu.find((i) => i.tool === 'hc').id);
  await toolOpen(page, 'hc');
  assert.equal(await dismiss(page), SCRIPT[c.tools.hc.intro]);
  for (const [i, step] of c.tools.hc.steps.entries()) {
    if (nudges) for (const j of [1, 2]) { await prompt(page, j); assert.equal(await dismiss(page), SCRIPT[step.prompts[j].jab]); }
    await prompt(page, 0);
    assert.equal(await dismiss(page), SCRIPT[step.result], `step ${i + 1}`);
  }
  await inState(page, 'pc');
}
async function deploy(n, page) {
  const c = CHAPTERS[n];
  await pcPick(page, 'deploy');
  assert.equal(await dismiss(page), SCRIPT[c.pc.deploy.line]);
  await page.waitForFunction(() => window.__oq.chapter.state === 'recover', null, { timeout: 9000 });
  assert.equal(await dismiss(page), SCRIPT[c.pc.deploy.recovered]);
}
async function leavePc(n, page) { await pcPick(page, item(n, 'leave')); assert.equal(await dismiss(page), SCRIPT[CHAPTERS[n].pc.leave]); await inState(page, 'room'); }
async function talk(n, page) { await tapSpot(page, spot(n, 'persona')); await closeCard(page); await winOpen(page); }
async function ask(n, page) { await talk(n, page); assert.equal(await dismiss(page), shown(n, CHAPTERS[n].persona.ask)); await inState(page, 'decide'); }
async function winLines(n, page) {
  const c = CHAPTERS[n];
  for (const k of c.win) assert.equal(await dismiss(page), shown(n, k));
  assert.equal((await ch(page)).state, 'verdict');
  assert.equal(await dismiss(page), SCRIPT[c.verdict.key]);
  await page.waitForSelector('#summary');
}

for (const n of NS) {
  const c = CHAPTERS[n];

  test(`scenario ${n}: the shortest path wins, the persona holds the win frame, Solved ticks up, no misstep`, async () => {
    const { ctx, page } = await openGame(browser, server, { query: `?ch=${n}` });
    const before = await page.locator('#sb-done').innerText();
    await into(n, page); await toPc(n, page);
    await solveHc(n, page); await deploy(n, page); await inState(page, 'pc'); await leavePc(n, page);
    await ask(n, page);
    assert.equal(await page.locator(`#decide-${c.persona.options.wrong.id ?? 'wrong'}`).innerText(), SCRIPT[c.persona.options.wrong.key]);
    await pickOption(page, 'hc');
    await winOpen(page);
    if (c.persona.frames.win) assert.equal(await page.evaluate(() => window.__oq.chapter.personaFrame), c.persona.frames.win, 'the win frame holds from the win on');
    await winLines(n, page);
    assert.notEqual(await page.locator('#sb-done').innerText(), before);
    const s = await run(page);
    assert.equal(s.missteps, 0); assert.equal(s.chapter, n);
    for (const p of ['card', 'room', 'pc', 'hc', 'deploy', 'persona', 'win']) assert.ok(s.phases[p] > 0, p);
    assert.deepEqual(page.errors, []);
    await ctx.close();
  });

  test(`scenario ${n}: the wrong advice gets its jab and the choice comes back greyed; Leave is locked before a tool is tried; the persona's calls run in order`, async () => {
    const { ctx, page } = await openGame(browser, server, { query: `?ch=${n}` });
    await into(n, page);
    // before any tool: the persona's calls, with the card the first time, each ending in show / leave
    for (const k of [1, 2]) {
      await talk(n, page);
      assert.equal(await dismiss(page), shown(n, c.persona.calls[k - 1]));
      await pickOption(page, 'leave'); await inState(page, 'room');
    }
    await toPc(n, page);
    await pcPick(page, item(n, 'leave'));
    assert.equal(await dismiss(page), SCRIPT[c.pc.locked]);
    assert.equal((await ch(page)).state, 'pc', 'still at the computer');
    await pcPick(page, item(n, 'status')); assert.equal(await dismiss(page), SCRIPT[c.pc.status.before]);
    // the old tool: every prompt is a misstep, then back
    await pcPick(page, c.pc.menu.find((i) => i.tool === 'old').id); await toolOpen(page, 'old');
    assert.equal(await dismiss(page), SCRIPT[c.tools.old.intro]);
    await prompt(page, 0); assert.equal(await dismiss(page), SCRIPT[c.tools.old.steps[0].prompts[0].jab]);
    await promptsShown(page);
    assert.equal(await page.locator('#tool-exit').innerText(), SCRIPT[c.tools.old.close]);
    await page.click('#tool-exit'); assert.equal(await dismiss(page), SCRIPT[c.tools.old.exit]); await inState(page, 'pc');
    await pcPick(page, item(n, 'status')); assert.equal(await dismiss(page), SCRIPT[c.pc.status.old]);
    await leavePc(n, page);
    await ask(n, page);
    const wrong = c.persona.options.wrong.id ?? 'wrong';
    await pickOption(page, wrong);
    assert.equal(await dismiss(page), SCRIPT[c.persona.options.wrong.jab]);
    await inState(page, 'decide');
    assert.equal(await page.locator(`#decide-${wrong}`).isDisabled(), true, 'greyed');
    await pickOption(page, 'hc');
    assert.equal(await dismiss(page), shown(n, c.persona.options.hc.show));   // not found yet: show me
    await toolOpen(page, 'hc');
    const s = await run(page), sc = await page.evaluate(() => window.__oq.chapter.scenario);
    assert.equal(s.counts.wrong, 1); assert.equal(s.counts.oldPrompts, 1);          // the missteps so far (the stopwatch totals them at the end)
    assert.equal(sc.wrong, true); assert.equal(sc.oldPicks, 1);
    await ctx.close();
  });

  for (const [w, h] of PHONES) {
    test(`${w}x${h} scenario ${n}: the wall close-up opens with its line and its text inside its boxes, closes by Back and by a tap off the glass; the PC text stays inside its screen`, async () => {
      const { ctx, page } = await openGame(browser, server, { w, h, query: `?ch=${n}` });
      await into(n, page);
      const inside = (sel, area) => page.evaluate(([s, a]) => {
        const c = document.querySelector('#scene').getBoundingClientRect(), k = c.width / 320;
        const box = { left: c.left + a.x0 * k - 0.5, right: c.left + (a.x1 + 1) * k + 0.5, top: c.top + a.y0 * k - 0.5, bottom: c.top + (a.y1 + 1) * k + 0.5 };
        return [...document.querySelectorAll(s)].filter((e) => { const r = e.getBoundingClientRect(); return r.width && !(r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom); }).map((e) => e.className + ' ' + e.textContent.slice(0, 30));
      }, [sel, area]);
      await tapSpot(page, spot(n, 'wall'));
      assert.equal(await dismiss(page), SCRIPT[c.wall.chart]);
      assert.equal((await ch(page)).state, 'wall');
      const boxes = await page.locator('.wall-box').count();
      assert.ok(boxes >= 1, 'text boxes');
      const spill = await page.evaluate(() => [...document.querySelectorAll('.wall-box')].flatMap((b) => {
        const r = b.getBoundingClientRect();
        return [...b.querySelectorAll('.fit')].filter((s) => s.textContent && (s.getBoundingClientRect().left < r.left - 1 || s.getBoundingClientRect().right > r.right + 1 || s.getBoundingClientRect().bottom > r.bottom + 1)).map((s) => s.textContent);
      }));
      assert.deepEqual(spill, [], 'wall text spills its box');
      const small = await page.evaluate(() => [...document.querySelectorAll('.wall-box .fit')].filter((s) => s.textContent).map((s) => parseFloat(getComputedStyle(s).fontSize)).filter((f) => f < 14));
      assert.deepEqual(small, [], 'wall text under 14 px');
      await page.click('#btn-back'); await inState(page, 'room');
      await tapSpot(page, spot(n, 'wall')); await dismiss(page);
      const sc = await page.locator('#scene').boundingBox();
      await page.mouse.click(sc.x + 0.5 * sc.width, sc.y + (197 / 200) * sc.height);          // off the glass
      await inState(page, 'room');
      await toPc(n, page);
      assert.deepEqual(await inside('.pc-title, .pc-item', c.pc.screen), []);
      const smallPc = await page.locator('.pc-item').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).filter((r) => r.width < 44 || r.height < 44).map((r) => `${r.width}x${r.height}`));
      assert.deepEqual(smallPc, []);
      await ctx.close();
    });
  }

  test(`scenario ${n}: reduced motion plays through — no walking, the persona rests, the wall is a still, the same win`, async () => {
    const { ctx, page } = await openGame(browser, server, { query: `?ch=${n}`, reduced: true });
    await into(n, page);
    const f1 = await page.evaluate(() => window.__oq.chapter.personaFrame);
    assert.equal(f1, c.persona.frames.rest);
    await tapSpot(page, spot(n, 'wall')); await dismiss(page);
    const t1 = await page.evaluate(() => JSON.stringify(window.__oq.chapter.wall.text));
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => JSON.stringify(window.__oq.chapter.wall.text)), t1, 'a still');
    await page.click('#btn-back'); await inState(page, 'room');
    await toPc(n, page);
    assert.equal((await ch(page)).walking, false);
    await solveHc(n, page); await deploy(n, page); await inState(page, 'pc'); await leavePc(n, page);
    await ask(n, page); await pickOption(page, 'hc'); await winLines(n, page);
    const s = await run(page);
    assert.equal(s.missteps, 0); assert.equal(s.counts.walkMs, 0);
    await ctx.close();
  });
}
