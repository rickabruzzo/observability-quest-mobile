// A scenario, start to finish: class card → room (tap to walk, tap to act, Look / Use / Help) → tool screens
// (the old tool, the Honeycomb screen) → win → verdict → the timing summary. The chapter's words, places
// and pictures are data (js/chapters/ch1.js); the rules are the pure engine modules; this module is the DOM,
// the canvas and the clock.

import { SCRIPT } from '../script.js';
import { CH1 } from '../chapters/ch1.js';
import { drawHero, HERO_H } from '../engine/hero.js';
import { drawHeroSide, SIDE_FOOT_DY } from '../engine/hero-side.js';
import { planWalk, stepWalk } from '../engine/walk.js';
import { colButton } from '../engine/ui.js';
import { drawIcon, applyCursor, MARKER_MS } from '../engine/cursor.js';
import { hotspotAt, walkTarget } from '../engine/room.js';
import { createWindows } from '../engine/window.js';
import { createTool, choose, promptsOf, toolScore } from '../engine/prompts.js';
import { createRunlog, summaryLines, formatMs, PHASES, PHASE_LABELS, COUNT_LABELS } from '../engine/runlog.js';
import { recordDone, totalScore } from '../menu.js';

export const CHAPTERS = { 1: CH1 };
export const REVEAL_MS = 1600;               // a right answer's result is drawn in over this long
// Strings the script has no slot for (listed in the hand-back for Rick).
export const UI = {
  look: 'Look', use: 'Use', help: 'Help',
  exitOld: '[Close the terminal]',
  copy: 'Copy results', copied: 'Copied',
  claimSoon: 'The prize desk opens in a later build. For now, back to the menu.',
  summaryTitle: (n, t) => `Scenario ${n} · ${t}`,
};

const say = (key) => SCRIPT[key] ?? key;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createChapterScreen(game) {
  let ch, room, hero, run, wins, token = null;
  let state = 'card', mode = 'use', busy = false;
  let x = 0, pose = 'idle', view = 'front', flip = false, plan = null, elapsed = 0, walkMs = 0, pending = null, marker = null, cursor = null;
  let toolName = null, toolState = null, toolEl = null, reveal = null, portrait = null;
  let icons = [], onDown = null, onMove = null, onTapCount = null;

  // ---- drawing ----
  function paintRoom(ctx) {
    const g = ctx.ctx2d;
    room.paint(g);
    if (view === 'side') drawHeroSide(g, hero, pose, x, room.floorY - HERO_H + SIDE_FOOT_DY, 1, { flip });
    else drawHero(g, hero, pose, x, room.floorY - HERO_H, 1, { flip });
    if (marker) drawIcon(g, marker.icon, marker.x, marker.y);
  }
  function paintTool(ctx, p = 1) {
    const def = ch.tools[toolName];
    if (def.kind === 'hc') def.paint(ctx.ctx2d, toolState.step, p); else def.paint(ctx.ctx2d);
  }
  function paintPortrait(ctx) {
    const g = ctx.ctx2d;
    g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    if (portrait?.complete && portrait.naturalWidth) g.drawImage(portrait, 0, 14, 640, 400, 0, 0, 320, 200);  // 640x428 cropped to 16:10
  }
  function paint(ctx) {
    if (state === 'tool') paintTool(ctx, reveal ? Math.min(1, reveal.t / REVEAL_MS) : 1);
    else if (state === 'verdict') paintPortrait(ctx);
    else if (state === 'room' || state === 'ending') paintRoom(ctx);
  }

  // ---- sequencing ----
  const live = () => token;
  /** Shows a line and waits for the player to dismiss it; resolves false if the screen went away meanwhile. */
  async function line(key, opts) {
    const t = live();
    await wins.say(say(key), opts);
    return t === live();
  }

  // ---- the class card ----
  function showCard(ctx) {
    state = 'card'; run.phase('card');
    const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    const stats = say(ch.card.stats).split(/\s*·\s*/).map((s) => { const m = s.match(/^(.*?)\s+(\S+)$/); return m ? [m[1], m[2]] : [s, '']; });
    ctx.overlay.innerHTML = `
      <div class="card more" id="class-card" role="dialog">
        <h2>${esc(say(ch.card.title))}</h2>
        <div class="card-stats">${stats.map(([k, v]) => `<div class="stat"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
        <p>${esc(say(ch.card.line))}</p>
      </div>`;
    run.count('windows');
  }

  // ---- the room ----
  function setIcons(ctx, on) {
    icons.forEach((b) => b.remove()); icons = [];
    if (!on) return;
    const mk = (id, label, fn) => { const b = colButton({ id, long: label, onClick: fn }); ctx.colR.appendChild(b); icons.push(b); return b; };
    mk('btn-look', UI.look, () => { if (state === 'room' && !busy) { mode = mode === 'look' ? 'use' : 'look'; markMode(); } });
    mk('btn-use', UI.use, () => { if (state === 'room' && !busy) { mode = 'use'; markMode(); } });
    mk('btn-help', UI.help, () => { if (state === 'room' && !busy && !wins.open) line('help.window'); });
    markMode();
  }
  function markMode() {
    for (const b of icons) if (b.id !== 'btn-help') b.setAttribute('aria-pressed', String(b.id === `btn-${mode}`));
  }

  async function enterRoom(ctx, { first }) {
    state = 'room'; run.phase('room');
    ctx.overlay.innerHTML = '';
    wins.setLayer(null);
    mode = 'use'; setIcons(ctx, true);
    paint(ctx);
    if (first) await line(ch.enter);
  }

  function finishWalk() { if (walkMs || plan) run.walk(walkMs); walkMs = 0; }

  function walkTo(ctx, tx) {
    if (plan) finishWalk();
    if (ctx.reducedMotion) { if (tx !== x) { flip = tx < x; run.walk(0); } x = tx; pose = 'idle'; view = 'front'; plan = null; return; }
    plan = planWalk(x, tx); elapsed = 0; walkMs = 0;
    if (plan.duration === 0) { plan = null; return; }
    flip = plan.dir < 0;
  }

  function act(ctx, spot) {
    run.visit(spot.id);
    if (typeof spot.use === 'string') line(spot.use);
    else if (spot.use?.tool) openTool(ctx, spot.use.tool);
    else line(spot.look);                                     // nothing to do with it: say what it is
  }

  function roomTap(ctx, e) {
    const r = ctx.canvas.getBoundingClientRect();
    const tx = Math.floor((e.clientX - r.left) / (r.width / 320)), ty = Math.floor((e.clientY - r.top) / (r.height / 200));
    const spot = hotspotAt(room, tx, ty);
    marker = { icon: spot ? 'hand' : 'walk', x: tx, y: ty, left: MARKER_MS };
    if (mode === 'look') {
      mode = 'use'; markMode();
      if (spot) { run.count('looks'); run.visit(spot.id); line(spot.look); paint(ctx); return; }   // Look reads from where you stand
    }
    pending = spot;
    walkTo(ctx, spot ? spot.standX : walkTarget(room, tx));
    if (!plan && pending) { const s = pending; pending = null; act(ctx, s); }
    paint(ctx);
  }

  // ---- tool screens ----
  function openTool(ctx, name) {
    state = 'tool'; toolName = name; busy = false;
    const def = ch.tools[name];
    toolState = createTool(def);
    run.phase(def.kind === 'hc' ? 'hc' : 'old');
    if (def.kind === 'hc' && !portrait) { portrait = new Image(); portrait.src = ch.verdict.portrait; }
    setIcons(ctx, false);
    ctx.overlay.innerHTML = '';
    toolEl = document.createElement('div');
    toolEl.className = `tool ${def.kind}`; toolEl.id = `tool-${name}`;
    toolEl.innerHTML = `<div class="tool-title">${esc(say(def.title))}</div><div class="tool-prompts" hidden></div>`;
    ctx.overlay.appendChild(toolEl);
    paint(ctx);
    line(def.intro).then((ok) => { if (ok) showPrompts(ctx); });
  }

  function showPrompts(ctx) {
    const def = ch.tools[toolName], box = toolEl.querySelector('.tool-prompts');
    box.innerHTML = '';
    for (const p of promptsOf(toolState)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'prompt'; b.textContent = say(p.key); b.disabled = p.disabled; b.dataset.index = p.index;
      b.addEventListener('click', () => pick(ctx, p.index));
      box.appendChild(b);
    }
    if (def.kind === 'old') {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'prompt exit'; b.id = 'tool-exit'; b.textContent = UI.exitOld;
      b.addEventListener('click', () => leaveOld(ctx));
      box.appendChild(b);
    }
    box.hidden = false;
  }
  const hidePrompts = () => { const box = toolEl?.querySelector('.tool-prompts'); if (box) box.hidden = true; };

  async function pick(ctx, index) {
    if (state !== 'tool' || busy || wins.open) return;
    const def = ch.tools[toolName], t = live();
    const r = choose(toolState, index);
    if (r.outcome === 'wrong') {
      run.count(def.kind === 'hc' ? 'wrong' : 'oldPrompts');
      hidePrompts();
      if (await line(r.jab)) showPrompts(ctx);
      return;
    }
    if (r.outcome !== 'right') return;
    hidePrompts(); busy = true;
    await new Promise((done) => { reveal = { t: ctx.reducedMotion ? REVEAL_MS : 0, done }; if (ctx.reducedMotion) { reveal = null; done(); } });
    if (t !== live()) return;
    reveal = null; busy = false; paint(ctx);
    if (!(await line(r.result))) return;
    if (r.finished) finish(ctx); else showPrompts(ctx);
  }

  async function leaveOld(ctx) {
    if (state !== 'tool' || busy || wins.open) return;
    toolEl?.remove(); toolEl = null;
    await enterRoom(ctx, { first: false });
    line(ch.tools.old.exit);
  }

  // ---- the win, the verdict, the summary ----
  async function finish(ctx) {
    const score = toolScore(toolState);
    toolEl?.remove(); toolEl = null;
    state = 'ending'; run.phase('win');
    ctx.overlay.innerHTML = '';
    paint(ctx);
    const done = recordDone(ctx.loadDone(), ch.id, score);         // the score ticks up as the win is declared
    ctx.saveDone(done); ctx.setScore(totalScore(done));
    for (const k of ch.win) if (!(await line(k))) return;
    state = 'verdict'; paint(ctx);
    if (!(await line(ch.verdict.key, { where: 'bottom', className: 'verdict' }))) return;
    run.end(score);
    showSummary(ctx);
  }

  function showSummary(ctx) {
    state = 'summary';
    const s = run.snapshot();
    const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    const rows = (pairs) => pairs.map(([k, v]) => `<div class="sum-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    const phases = PHASES.map((p) => [PHASE_LABELS[p], formatMs(s.phases[p])]);
    const counts = COUNT_LABELS.map(([k, label]) => [label, k === 'walkMs' ? formatMs(s.counts[k]) : String(s.counts[k])]);
    ctx.overlay.innerHTML = `
      <div class="summary" id="summary" role="dialog">
        <h2>${esc(UI.summaryTitle(ch.id, formatMs(s.total)))}</h2>
        <div class="sum-grid"><div class="sum-col">${rows(phases)}${rows([['Score', `${s.score} of 100`]])}</div><div class="sum-col">${rows(counts)}</div></div>
        <p class="sum-prompt">${esc(say('after.prompt'))}</p>
        <div class="sum-btns">
          <button type="button" class="prompt" id="btn-claim">${esc(say('after.claim'))}</button>
          <button type="button" class="prompt" id="btn-more">${esc(say('after.more'))}</button>
          <button type="button" class="prompt" id="btn-copy">${esc(UI.copy)}</button>
        </div>
      </div>`;
    const t = live();
    ctx.overlay.querySelector('#btn-more').addEventListener('click', () => game.go('MENU'));
    ctx.overlay.querySelector('#btn-claim').addEventListener('click', async () => {
      if (wins.open) return;
      await wins.say(UI.claimSoon);
      if (t === live()) game.go('MENU');
    });
    ctx.overlay.querySelector('#btn-copy').addEventListener('click', (e) => copyResults(e.currentTarget));
  }

  function copyResults(btn) {
    const s = run.snapshot();
    const text = summaryLines(s).join('\n');
    console.log(JSON.stringify({ oq: 'run', ...s }));
    const fallback = () => {
      const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* nothing more to try */ }
      ta.remove();
    };
    try { navigator.clipboard.writeText(text).catch(fallback); } catch { fallback(); }
    btn.textContent = UI.copied;
  }

  return {
    enter(ctx) {
      ch = CHAPTERS[ctx.chapterId] || CH1;
      room = ch.room; hero = ctx.hero;
      token = {};
      x = room.start; pose = 'idle'; view = 'front'; flip = false; plan = null; elapsed = 0; walkMs = 0; pending = null; marker = null; cursor = null;
      mode = 'use'; busy = false; toolName = null; toolState = null; toolEl = null; reveal = null;
      run = createRunlog({ chapter: ch.id });
      for (const [reason, on] of Object.entries(ctx.holds || {})) if (on) run.hold(reason, true);
      ctx.runlog = run;
      wins = createWindows(ctx, { onShow: () => run.count('windows') });
      ctx.setScore(totalScore(ctx.loadDone()));
      const box = ctx.canvas.parentElement;
      onTapCount = () => run.count('taps');
      document.addEventListener('pointerdown', onTapCount, true);
      onDown = (e) => {
        if (e.target.closest?.('button')) return;               // buttons answer their own clicks
        if (wins.open) { wins.tap(); return; }
        if (state === 'card') { enterRoom(ctx, { first: true }); return; }
        if (state === 'room' && !busy) roomTap(ctx, e);
      };
      onMove = (e) => {
        if (state !== 'room' || wins.open) { if (cursor) { cursor = null; applyCursor(box, null); } return; }
        const r = ctx.canvas.getBoundingClientRect();
        const name = hotspotAt(room, Math.floor((e.clientX - r.left) / (r.width / 320)), Math.floor((e.clientY - r.top) / (r.height / 200))) ? 'hand' : 'walk';
        if (name !== cursor) { cursor = name; applyCursor(box, name); }
      };
      box.addEventListener('pointerdown', onDown);
      box.addEventListener('pointermove', onMove);
      showCard(ctx);
      window.__oq && (window.__oq.chapter = {
        get state() { return state; }, get mode() { return mode; }, get x() { return x; }, get walking() { return plan !== null; },
        get view() { return view; }, get busy() { return busy; },
        get window() { return wins.open ? { text: wins.element.dataset.text, pages: wins.pages, page: wins.page } : null; },
        get tool() { return toolState ? { name: toolName, step: toolState.step, done: toolState.done, wrong: toolState.wrong, prompts: promptsOf(toolState) } : null; },
        get score() { return toolState ? toolScore(toolState) : 0; },
        hotspot(id) { return room.hotspots.find((h) => h.id === id); },
      });
    },
    tick(dt, ctx) {
      wins.tick(dt);
      let dirty = false;
      if (marker && (marker.left -= dt) <= 0) { marker = null; dirty = true; }
      if (plan) {
        elapsed += dt; walkMs += dt;
        const s = stepWalk(plan, elapsed);
        x = s.x; pose = s.pose; view = s.view; flip = s.flip; dirty = true;
        if (s.done) { plan = null; finishWalk(); if (pending) { const p = pending; pending = null; act(ctx, p); } }
      } else if (marker) dirty = true;
      if (reveal) { reveal.t += dt; dirty = true; if (reveal.t >= REVEAL_MS) { const d = reveal.done; reveal.t = REVEAL_MS; d(); } }
      if (dirty) paint(ctx);
    },
    exit(ctx) {
      token = null;
      const box = ctx.canvas.parentElement;
      box.removeEventListener('pointerdown', onDown); box.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onTapCount, true);
      applyCursor(box, null);
      wins.reset(); setIcons(ctx, false);
      ctx.overlay.innerHTML = '';
      toolEl = null; reveal = null; plan = null;
    },
  };
}
