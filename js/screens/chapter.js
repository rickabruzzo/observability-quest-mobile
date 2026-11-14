// A scenario, start to finish: class card → room (tap to walk, tap to act, Look / Use / Help) → close-ups
// (the PC with its menu, Otto's vitals monitor) → tool screens (the old tool, the Honeycomb screen) → the
// CTO's decision → win → verdict → the timing summary. The chapter's words, places and pictures are data
// (js/chapters/ch1.js); the rules are the pure engine modules (scenario, vitals, prompts, room); this module
// is the DOM, the canvas and the clock.

import { SCRIPT } from '../script.js';
import { CH1 } from '../chapters/ch1.js';
import { drawHero, HERO_H } from '../engine/hero.js';
import { drawHeroSide, SIDE_FOOT_DY } from '../engine/hero-side.js';
import { planWalk, stepWalk } from '../engine/walk.js';
import { colButton } from '../engine/ui.js';
import { drawIcon, applyCursor, MARKER_MS } from '../engine/cursor.js';
import { hotspotAt, walkTarget } from '../engine/room.js';
import { createWindows } from '../engine/window.js';
import { personaLine, speakerOf, talkWindow } from '../engine/conversation.js';
import { load as loadSprites } from '../anim/sprites.js';
import { createTool, choose, promptsOf } from '../engine/prompts.js';
import { createRunlog, summaryLines, formatMs, PHASES, PHASE_LABELS, COUNT_LABELS } from '../engine/runlog.js';
import { createScenario, notePrompt, noteFound, noteDeployed, ottoState, canLeave, canDeploy, vitalsLine, ctoUse, decide, missteps, firstTalk } from '../engine/scenario.js';
import { parseStats, cardPicture, personaOptions, OPTION_KEYS } from '../engine/persona.js';
import { paintHc } from '../engine/screens.js';
import { playCharity } from './charity.js';
import { vitalsFrame, beatSamples, talkFrame, stepAt } from '../engine/vitals.js';
import { loadManifest } from '../engine/images.js';
import { recordDone, solvedCount } from '../menu.js';

export const CHAPTERS = { 1: CH1 };
export const REVEAL_MS = 2000;               // a direct prompt's next picture wipes in, then its highlights pulse
const RECOVER_HOLD_MS = 900;                 // after Otto finishes his sentence, a beat before he speaks
const LOAD_WAIT_MS = 6000;                   // the card waits this long for the room's pictures, then plays without
// The one string the script has no slot for: the stopwatch summary is Rick's tuning tool and comes out before the
// booth build. Everything else the player reads is a script slot (ui.*, menu.soon, claim.soon, chN.old.close).
export const UI = {
  summaryTitle: (n, t) => `Scenario ${n} · ${t}`,
};
const CARD_IN_MS = 200;                      // the persona card's entrance (a flip); reduced motion: it just appears

const say = (key) => SCRIPT[key] ?? key;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** CSS placement of a scene area ({x0,x1,y0,y1}, inclusive, on the 320x200 scene) as percentages of the scene box. */
const place = (a) => `left:${(a.x0 / 320) * 100}%;top:${(a.y0 / 200) * 100}%;width:${((a.x1 - a.x0 + 1) / 320) * 100}%;height:${((a.y1 - a.y0 + 1) / 200) * 100}%`;
const inArea = (a, x, y) => x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1;
const GLITCH = '#@%&*?!/<>';

export function createChapterScreen(game) {
  let ch, room, hero, run, wins, token = null, scen, art = null, hcArt = null, loading = null, recovering = null;
  let persona = null, gctx = null;             // who speaks from the close-up ({ title, name, portrait: { still, frames }, where, seed }); the game ctx, for the scene's scale
  let state = 'card', mode = 'use', busy = false, pcardClose = null;
  let x = 0, pose = 'idle', view = 'front', flip = false, plan = null, elapsed = 0, walkMs = 0, pending = null, marker = null, cursor = null;
  let tools = {}, introShown = new Set(), toolName = null, toolFrom = null, toolEl = null, reveal = null, portrait = null;
  let vitalsMode = 'critical', vitalsT = 0, nudges = [], talkT = 0, ctoQuiet = false, lastDraw = '';
  let sceneEl = null, pcView = 'menu', monFrame = null;
  let icons = [], back = null, onDown = null, onMove = null, onTapCount = null;

  // ---- the monitor's state, shared by the room and the close-up ----
  const vitals = (ctx) => vitalsFrame(vitalsT, {
    state: vitalsMode, reduced: ctx.reducedMotion, nudges,
    pool: ch.monitor.pool.map(say), okPool: ch.monitor.okPool.map(say), output: say(ch.monitor.output), outputOk: say(ch.monitor.outputOk),
  });

  // ---- drawing ----
  const img = (name) => art?.images.get(name);
  function backdrop(g, name) {
    const im = img(name);
    if (im) g.drawImage(im, 0, 0); else { g.fillStyle = '#1B2333'; g.fillRect(0, 0, 320, 200); }   // the pictures failed: keep playing
  }
  function drawLane(g, lane, samples, colour, thick) {
    const h = lane.y1 - lane.y0, step = (lane.x1 - lane.x0 + 1) / samples.length;
    g.fillStyle = colour;
    samples.forEach((v, i) => {
      const y = Math.round(lane.y0 + v * h);
      const prev = i ? Math.round(lane.y0 + samples[i - 1] * h) : y;
      const top = Math.min(y, prev), bot = Math.max(y, prev);               // join the samples so spikes read as lines
      g.fillRect(Math.round(lane.x0 + i * step), top, Math.max(1, Math.round(step)), Math.max(thick, bot - top + 1));
    });
  }
  function drawLights(g, where, f, size) {
    where.forEach(([lx, ly], i) => {                         // an unlit light is dark, not the art's idle chip
      g.fillStyle = f.lights[i] ? (f.tone === 'green' ? '#3CE070' : '#FF3030') : '#2A0C0C';
      g.fillRect(lx, ly, size[0], size[1]);
    });
  }
  const traceColour = (f) => (f.tone === 'green' ? '#3CE070' : '#FF5A3C');

  function paintRoom(ctx) {
    const g = ctx.ctx2d, m = ch.monitor.room, f = vitals(ctx);
    backdrop(g, room.image);
    // the CTO talks on the phone unless she is talking to you (or it is over)
    const frameNo = ctoQuiet || state === 'decide' || state === 'ending' ? 0 : talkFrame(talkT, ctx.reducedMotion);
    const patch = art?.manifest.patches?.[room.image];
    if (frameNo && patch && img(room.talk[frameNo - 1])) g.drawImage(img(room.talk[frameNo - 1]), patch.x, patch.y);
    // Otto's vitals, motion only: the trace, the lights, a cursor typing in the output panel
    drawLane(g, m.lane, beatSamples(vitalsT, vitalsMode, m.lane.x1 - m.lane.x0 + 1, ctx.reducedMotion), traceColour(f), 1);
    drawLights(g, m.lights, f, ch.monitor.room.lightSize);
    const o = m.output, per = Math.floor((o.x1 - o.x0 - 1) / 3), rows = Math.floor((o.y1 - o.y0 - 4) / 5);
    const shown = Math.min(per * rows - 1, f.output.glitch ? 0 : f.output.shown);   // a long answer fills the panel, never spills
    g.fillStyle = f.tone === 'green' ? '#2A9A50' : '#6A7090';
    for (let i = 0; i < shown; i++) g.fillRect(o.x0 + 2 + (i % per) * 3, o.y0 + 3 + Math.floor(i / per) * 5, 2, 2);
    if (f.output.cursor || f.output.glitch) {
      g.fillStyle = f.output.glitch ? '#FF3030' : '#E8ECF4';
      g.fillRect(o.x0 + 2 + (shown % per) * 3, o.y0 + 2 + Math.floor(shown / per) * 5, 2, 4);
    }
    const hs = room.heroScale ?? 1, heroY = room.floorY - Math.round(HERO_H * hs);     // feet on the floor line at any scale
    if (view === 'side') drawHeroSide(g, hero, pose, x, heroY + SIDE_FOOT_DY, hs, { flip });
    else drawHero(g, hero, pose, x, heroY, hs, { flip });
    if (marker) drawIcon(g, marker.icon, marker.x, marker.y);
  }
  function paintMonitor(ctx) {
    const g = ctx.ctx2d, m = ch.monitor.close, f = vitals(ctx);
    backdrop(g, ch.monitor.image);
    const n = Math.floor((m.lane.x1 - m.lane.x0 + 1) / 2);
    drawLane(g, m.lane, beatSamples(vitalsT, vitalsMode, n, ctx.reducedMotion), traceColour(f), 2);
    drawLights(g, m.lights, f, m.lightSize);
    renderMonitorText(f);
  }
  function paintTool(ctx, p = 1) {
    const def = ch.tools[toolName];
    if (def.kind === 'hc') paintHc(ctx.ctx2d, tools.hc.step, p, hcArt, ctx.reducedMotion); else def.paint(ctx.ctx2d);
  }
  function paintPortrait(ctx) {
    const g = ctx.ctx2d;
    g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    // 640x428 cropped to 16:10 and fitted above the verdict window, which takes the bottom third
    if (portrait?.complete && portrait.naturalWidth) g.drawImage(portrait, 0, 14, 640, 400, 54, 2, 211, 132);
  }
  function paint(ctx) {
    if (state === 'tool') paintTool(ctx, reveal ? Math.min(1, reveal.t / REVEAL_MS) : 1);
    else if (state === 'verdict') paintPortrait(ctx);
    else if (state === 'monitor' || state === 'recover') paintMonitor(ctx);
    else if (state === 'pc') backdrop(ctx.ctx2d, ch.pc.image);
    else if (state === 'room' || state === 'decide' || state === 'ending') paintRoom(ctx);
  }

  // ---- sequencing ----
  const live = () => token;
  /** Shows a line and waits for the player to dismiss it; resolves false if the screen went away meanwhile.
   * The persona's own lines (`CTO: …`) open the conversation window: their portrait, their name, the prefix dropped. */
  async function line(key, opts) {
    const t = live();
    const { spoken, text } = persona ? personaLine(say(key), persona.title) : { spoken: false, text: say(key) };
    if (spoken) {
      const patch = art?.manifest.patches?.[room.image] ?? null;
      const { className, maxWidth } = talkWindow(persona.where, patch, gctx?.fit?.scale ?? 1);
      await wins.say(text, { ...opts, where: className, maxWidth, portrait: { name: persona.name, seed: persona.seed, ...persona.portrait } });
    } else await wins.say(text, opts);
    return t === live();
  }
  /** The persona's close-up: the still and its three patches, loaded once per visit; a missing frame is just a still. */
  function loadPersona(ctx) {
    const p = ch.persona;
    if (!p) { persona = null; return; }
    const base = `portrait_${p.portrait}`;
    persona = { title: speakerOf(say(p.name)), name: say(p.name), where: p.where ?? 'top-left', seed: p.portrait.charCodeAt(p.portrait.length - 1),
      portrait: { still: null, frames: { talk1: `${base}_talk1`, talk2: `${base}_talk2`, blink: `${base}_blink` } } };
    const me = persona;
    const img = new Image();
    img.onload = () => { if (persona === me) me.portrait.still = img; };
    img.src = `assets/${base}.png`;
    loadSprites(Object.values(me.portrait.frames), { optional: true }).catch(() => {});
  }
  /** A line about the CTO: she stops talking on the phone while it is open. */
  async function ctoLine(key) {
    ctoQuiet = true;
    const ok = await line(key);
    ctoQuiet = false;
    return ok;
  }
  function clearScene(ctx) {
    sceneEl?.remove(); sceneEl = null; toolEl?.remove(); toolEl = null; monFrame = null;
    back?.remove(); back = null;
  }

  // ---- the title card: who paged the hero tonight, in one line (the stats moved to the persona card) ----
  function showCard(ctx) {
    state = 'card'; run.phase('card');
    const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    ctx.overlay.innerHTML = `
      <div class="card more" id="class-card" role="dialog">
        <h2>${esc(say(ch.card.title))}</h2>
        <p>${esc(say(ch.card.line))}</p>
      </div>`;
    run.count('windows');
  }

  // ---- the persona card: a trading card over the dimmed room; a tap anywhere, Enter or Escape closes it ----
  /** Opens the card and resolves when it is closed (false if the screen went away). Nothing else is tappable. */
  function showPersonaCard(ctx) {
    const p = ch.persona, t = live();
    const was = state; state = 'pcard'; ctoQuiet = true;
    run.count('cards'); run.count('windows');
    const stats = parseStats(say(p.stats));
    const dim = document.createElement('div');
    dim.className = 'pcard-dim'; dim.id = 'persona-card'; dim.setAttribute('role', 'dialog'); dim.setAttribute('aria-label', say(p.name));
    dim.innerHTML = `<div class="pcard${ctx.reducedMotion ? ' still' : ''}">
        <div class="name">${esc(say(p.name))}</div>
        <div class="art"></div>
        <div class="class">${esc(say(p.class))}</div>
        <div class="body">
          <div class="stats">${stats.map(([k, v]) => `<div class="stat"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
          <div class="flavor">${esc(say(p.flavor))}</div>
        </div></div>`;
    // the picture: the card art, or the persona cropped from the room plate if that file is missing — never empty
    const artBox = dim.querySelector('.art');
    const crop = () => {
      const pic = cardPicture(p, false), plate = img(pic.image), c = document.createElement('canvas');
      c.width = pic.w; c.height = pic.h;
      if (plate) c.getContext('2d').drawImage(plate, pic.x, pic.y, pic.w, pic.h, 0, 0, pic.w, pic.h);
      artBox.replaceChildren(c);
    };
    const pic = cardPicture(p, !!p.art);
    if (pic.kind === 'art') {
      const im = new Image(); im.alt = ''; im.decoding = 'async';
      im.onerror = crop; im.src = pic.src;
      artBox.appendChild(im);
    } else crop();
    ctx.overlay.appendChild(dim);
    return new Promise((done) => {
      const close = () => {
        if (!dim.isConnected) return;
        dim.remove(); document.removeEventListener('keydown', onKey, true);
        if (t === live()) { state = was; ctoQuiet = false; }
        done(t === live());
      };
      const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); close(); } };
      dim.addEventListener('pointerdown', (e) => { e.stopPropagation(); close(); });
      document.addEventListener('keydown', onKey, true);
      pcardClose = close;
    });
  }
  /** The card is dismissed: into the room once its pictures are in (they started loading when the card opened). */
  async function leaveCard(ctx) {
    if (state !== 'card' || busy) return;
    busy = true;
    const t = live();
    await loading;
    if (t !== live()) return;
    busy = false;
    enterRoom(ctx, { first: true });
  }

  // ---- the room ----
  function setIcons(ctx, on) {
    icons.forEach((b) => b.remove()); icons = [];
    if (!on) return;
    const mk = (id, label, fn) => { const b = colButton({ id, long: label, onClick: fn }); ctx.colR.appendChild(b); icons.push(b); return b; };
    mk('btn-look', say('ui.look'), () => { if (state === 'room' && !busy) { mode = mode === 'look' ? 'use' : 'look'; markMode(); } });
    mk('btn-use', say('ui.use'), () => { if (state === 'room' && !busy) { mode = 'use'; markMode(); } });
    mk('btn-help', say('ui.help'), () => { if (state === 'room' && !busy && !wins.open) line('help.window'); });
    markMode();
  }
  function markMode() {
    for (const b of icons) if (b.id !== 'btn-help') b.setAttribute('aria-pressed', String(b.id === `btn-${mode}`));
  }

  async function enterRoom(ctx, { first = false, at = null } = {}) {
    state = 'room'; run.phase('room'); busy = false;
    clearScene(ctx);
    ctx.overlay.innerHTML = '';
    if (at !== null) { x = at; pose = 'idle'; view = 'front'; plan = null; }
    mode = 'use'; setIcons(ctx, true);
    paint(ctx);
    if (first) await line(ch.enter);
  }

  function finishWalk() { if (walkMs || plan) run.walk(walkMs); walkMs = 0; }
  function stopWalk() { if (plan) { finishWalk(); plan = null; pose = 'idle'; view = 'front'; } pending = null; }

  function walkTo(ctx, tx) {
    if (plan) finishWalk();
    if (ctx.reducedMotion) { if (tx !== x) { flip = tx < x; run.walk(0); } x = tx; pose = 'idle'; view = 'front'; plan = null; return; }
    plan = planWalk(x, tx); elapsed = 0; walkMs = 0;
    if (plan.duration === 0) { plan = null; return; }
    flip = plan.dir < 0;
  }

  function act(ctx, spot) {
    run.visit(spot.id);
    const use = spot.use;
    if (typeof use === 'string') line(use);
    else if (use?.scene === 'pc') enterPc(ctx);
    else if (use?.scene === 'monitor') enterMonitor(ctx);
    else if (use?.action === 'cto') useCto(ctx);
    else if (use?.tool) openTool(ctx, use.tool, 'room');
    else line(spot.look);                                     // nothing to do with it: say what it is
  }

  function logical(ctx, e) {
    const r = ctx.canvas.getBoundingClientRect();
    return [Math.floor((e.clientX - r.left) / (r.width / 320)), Math.floor((e.clientY - r.top) / (r.height / 200))];
  }

  function roomTap(ctx, e) {
    const [tx, ty] = logical(ctx, e);
    const spot = hotspotAt(room, tx, ty);
    marker = { icon: spot ? 'hand' : 'walk', x: tx, y: ty, left: MARKER_MS };
    if (mode === 'look') {
      mode = 'use'; markMode();
      if (spot) {                                             // Look reads from where you stand
        run.count('looks'); run.visit(spot.id);
        if (spot.id === 'cto') ctoLine(spot.look); else line(spot.look);
        paint(ctx); return;
      }
    }
    if (spot && spot.walk === false) { stopWalk(); paint(ctx); act(ctx, spot); return; }
    pending = spot;
    walkTo(ctx, spot ? spot.standX : walkTarget(room, tx));
    if (!plan && pending) { const s = pending; pending = null; act(ctx, s); }
    paint(ctx);
  }

  // ---- the monitor close-up ----
  function monitorUi(ctx) {
    setIcons(ctx, false); clearScene(ctx);
    ctx.overlay.innerHTML = '';
    const m = ch.monitor.close;
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene-ui monitor-ui'; sceneEl.id = 'monitor';
    sceneEl.innerHTML = m.boxes.map((a, i) => `<div class="mon-box" data-box="${i}" style="${place(a)}"><span class="fit"></span><span class="fit"></span></div>`).join('')
      + `<div class="mon-out" style="${place(m.output)}"></div>`;
    ctx.overlay.appendChild(sceneEl);
  }
  async function enterMonitor(ctx) {
    state = 'monitor'; run.phase('monitor'); run.count('monitor');
    monitorUi(ctx);
    back = colButton({ id: 'btn-back', long: say('ui.back'), onClick: () => { if (state === 'monitor' && !wins.open) enterRoom(ctx); } });
    ctx.colR.appendChild(back);
    lastDraw = ''; paint(ctx);
    await line(ch.monitor.chart);
  }
  function renderMonitorText(f) {
    if (!sceneEl || (state !== 'monitor' && state !== 'recover')) return;
    const key = JSON.stringify([f.boxes, f.tone, f.output]);
    if (key === monFrame) return;
    monFrame = key;
    sceneEl.classList.toggle('ok', f.tone === 'green');
    sceneEl.querySelectorAll('.mon-box').forEach((el, i) => {
      const b = f.boxes[i], spans = el.querySelectorAll('.fit');
      el.classList.toggle('garble', b.garble);
      b.lines.forEach((l, j) => { if (spans[j].textContent !== l) { spans[j].textContent = l; fit(spans[j]); } });
    });
    const o = f.output, out = sceneEl.querySelector('.mon-out');
    const text = o.glitch ? [...o.text].map((c, i) => (c === ' ' ? ' ' : GLITCH[(i * 7 + f.step) % GLITCH.length])).join('') : o.text.slice(0, o.shown);
    out.innerHTML = `${esc(text)}<span class="mon-cursor${o.cursor ? '' : ' off'}"></span>`;
  }
  /** A line wider than its box is condensed sideways to fit, never cut and never smaller than the box's font. */
  function fit(span) {
    span.style.transform = '';
    const w = span.parentElement.clientWidth, need = span.scrollWidth;
    if (need > w && w > 0) span.style.transform = `scaleX(${(w / need).toFixed(3)})`;
  }
  function monitorTap(ctx, e) {
    const [tx, ty] = logical(ctx, e), m = ch.monitor.close;
    const box = m.boxHits.findIndex((a) => inArea(a, tx, ty));
    if (box >= 0) { nudges.push({ step: ctx.reducedMotion ? nudges.length + 1 : stepAt(vitalsT), box }); monFrame = null; paint(ctx); return; }
    if (!inArea(m.screen, tx, ty)) enterRoom(ctx);               // off the glass: back to the room
  }

  // ---- the PC ----
  function enterPc(ctx, { view: v = 'menu' } = {}) {
    state = 'pc'; run.phase('pc');
    setIcons(ctx, false); clearScene(ctx);
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene-ui pc-ui'; sceneEl.id = 'pc';
    sceneEl.innerHTML = `<div class="pc-screen" style="${place(ch.pc.screen)}"><div class="pc-title">${esc(say(ch.pc.title))}</div><div class="pc-grid"></div></div>`;
    ctx.overlay.appendChild(sceneEl);
    paint(ctx);
    showPc(ctx, v);
  }
  function showPc(ctx, v) {
    pcView = v;
    const grid = sceneEl.querySelector('.pc-grid');
    grid.className = `pc-grid view-${v}`;
    const deploy = { id: 'deploy', key: ch.pc.deploy.item };
    let items = ch.pc.menu;
    if (v === 'email') items = ch.pc.emails.map((key, i) => ({ id: `email-${i + 1}`, key }));
    else if (v === 'deploy') items = [deploy];                     // "show me": the one prompt, on the spot
    else if (canDeploy(scen)) items = [...items.slice(0, -1), deploy, items[items.length - 1]];   // before Leave
    grid.innerHTML = items.map((it) => `<button type="button" class="pc-item" data-id="${it.id}">${esc(say(it.key))}</button>`).join('');
    grid.querySelectorAll('.pc-item').forEach((b) => b.addEventListener('click', () => pcPick(ctx, b.dataset.id)));
  }
  async function pcPick(ctx, id) {
    if (state !== 'pc' || wins.open || busy) return;
    const p = ch.pc;
    if (id.startsWith('email-')) { run.count('emails'); if (await line(p.reply)) showPc(ctx, 'menu'); return; }
    if (id === 'email') { showPc(ctx, 'email'); return; }
    if (id === 'vitals') { run.count('vitals'); line(p.vitals[vitalsLine(scen)]); return; }
    if (id === 'old' || id === 'hc') { openTool(ctx, id, 'pc'); return; }
    if (id === 'deploy' && canDeploy(scen)) { deployFix(ctx, pcView === 'deploy' ? 'win' : 'pc'); return; }
    if (id === 'leave') {
      if (!canLeave(scen)) { line(p.locked); return; }            // never greyed: the line is the joke
      if (await line(p.leave)) enterRoom(ctx, { at: room.hotspots.find((h) => h.id === 'pc').standX });
    }
  }

  // ---- tool screens ----
  async function openTool(ctx, name, from) {
    state = 'tool'; toolName = name; toolFrom = from; busy = false;
    const def = ch.tools[name];
    tools[name] ||= createTool(def);                         // progress is kept between visits
    run.phase(def.kind === 'hc' ? 'hc' : 'old');
    if (def.kind === 'hc' && !portrait) { portrait = new Image(); portrait.src = ch.verdict.portrait; }
    setIcons(ctx, false); clearScene(ctx);
    ctx.overlay.innerHTML = '';
    toolEl = document.createElement('div');
    toolEl.className = `tool ${def.kind}`; toolEl.id = `tool-${name}`;
    toolEl.innerHTML = `<div class="tool-title">${esc(say(def.title))}</div><div class="tool-prompts" hidden></div>`;
    ctx.overlay.appendChild(toolEl);
    paint(ctx);
    if (!introShown.has(name) && !tools[name].done) {
      introShown.add(name);
      if (!(await line(def.intro))) return;
    }
    showPrompts(ctx);
  }

  function showPrompts(ctx) {
    const def = ch.tools[toolName], t = tools[toolName], box = toolEl.querySelector('.tool-prompts');
    box.innerHTML = '';
    if (!t.done) for (const p of promptsOf(t)) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'prompt'; b.textContent = say(p.key); b.disabled = p.disabled; b.dataset.index = p.index;
      b.addEventListener('click', () => pick(ctx, p.index));
      box.appendChild(b);
    }
    const exit = document.createElement('button');
    exit.type = 'button'; exit.className = 'prompt exit'; exit.id = 'tool-exit'; exit.textContent = say(def.close ?? 'ui.close.hc');   // per tool: [Close Cave Logs], [Close Honeycomb]
    exit.addEventListener('click', () => leaveTool(ctx));
    box.appendChild(exit);
    box.hidden = false;
  }
  const hidePrompts = () => { const box = toolEl?.querySelector('.tool-prompts'); if (box) box.hidden = true; };

  async function pick(ctx, index) {
    if (state !== 'tool' || busy || wins.open) return;
    const def = ch.tools[toolName], t = live();
    const r = choose(tools[toolName], index);
    if (r.outcome === 'wrong' || r.outcome === 'right') notePrompt(scen, def.kind);
    if (r.outcome === 'wrong') {
      run.count(def.kind === 'hc' ? 'nudges' : 'oldPrompts');
      hidePrompts();
      if (await line(r.jab)) showPrompts(ctx);
      return;
    }
    if (r.outcome !== 'right') return;
    hidePrompts(); busy = true;
    await new Promise((done) => { reveal = { t: ctx.reducedMotion ? REVEAL_MS : 0, done }; if (ctx.reducedMotion) { reveal = null; done(); } });
    if (t !== live()) return;
    reveal = null; busy = false; paint(ctx);
    if (r.finished) noteFound(scen);                             // the cause is found; Otto is still critical
    if (!(await line(r.result))) return;
    if (!r.finished) { showPrompts(ctx); return; }
    if (toolFrom === 'cto') enterPc(ctx, { view: 'deploy' });    // "show me", and it did: now deploy it, then the win
    else enterPc(ctx);
  }

  async function leaveTool(ctx) {
    if (state !== 'tool' || busy || wins.open) return;
    const def = ch.tools[toolName];
    if (toolFrom === 'pc') {
      enterPc(ctx);
      if (def.kind === 'old') line(def.exit);
    } else enterRoom(ctx);                                       // backed out of "show me": back to the room
  }

  // ---- the CTO: her card the first time, then her line, then the options every conversation ends in ----
  async function useCto(ctx) {
    run.phase('cto');
    if (firstTalk(scen)) { if (!(await showPersonaCard(ctx))) return; }   // the card's time belongs to the cto phase
    const u = ctoUse(scen);
    const ok = u.kind === 'call'
      ? await line(ch.cto.calls[u.n - 1])                           // her own words: she keeps talking in the room while they show
      : await line(ch.cto.ask);
    if (ok) showDecision(ctx);
  }
  /** The option list, drawn like the decision prompts: before a tool is tried, the card again or leave; after, the decision and the card. */
  function showDecision(ctx) {
    state = 'decide'; ctoQuiet = true; setIcons(ctx, false); clearScene(ctx);
    const label = { sign: say(ch.cto.sign), hc: say(ch.cto.hc), show: say(OPTION_KEYS.show), leave: say(OPTION_KEYS.leave) };
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene-ui decide'; sceneEl.id = 'decide';
    sceneEl.innerHTML = `<div class="decide-prompts">${personaOptions(scen).map((id) =>
      `<button type="button" class="prompt" id="decide-${id}"${id === 'sign' && scen.signed ? ' disabled' : ''}>${esc(label[id])}</button>`).join('')}</div>`;
    ctx.overlay.appendChild(sceneEl);
    for (const b of sceneEl.querySelectorAll('button')) b.addEventListener('click', () => advise(ctx, b.id.slice('decide-'.length)));
    paint(ctx);
  }
  async function advise(ctx, choice) {
    if (state !== 'decide' || wins.open) return;
    if (choice === 'show') {                                        // never a wrong choice: the card, then the same options
      clearScene(ctx);
      if (await showPersonaCard(ctx)) showDecision(ctx);
      return;
    }
    if (choice === 'leave') { clearScene(ctx); ctoQuiet = false; enterRoom(ctx); return; }
    const r = decide(scen, choice);
    if (r.outcome === 'tried') return;
    clearScene(ctx);
    if (r.outcome === 'jab') {
      run.count('signed');
      if (await line(ch.cto.jab)) showDecision(ctx);             // the choice comes back
      return;
    }
    if (r.outcome === 'win') { win(ctx); return; }
    ctoQuiet = false;                                               // she speaks again: the loop is back while her line shows
    if (!(await line(ch.cto.show))) return;
    if (r.outcome === 'deploy') enterPc(ctx, { view: 'deploy' });   // found already: just deploy it
    else openTool(ctx, 'hc', 'cto');
  }

  // ---- deploying the fix: the line, then the monitor recovering, then Otto ----
  async function deployFix(ctx, after) {
    run.phase('deploy');
    if (!(await line(ch.pc.deploy.line))) return;
    noteDeployed(scen);
    vitalsMode = 'ok'; vitalsT = 0; nudges = [];                  // Otto recovers now, and the close-up shows it
    state = 'recover'; monitorUi(ctx); lastDraw = ''; monFrame = null; paint(ctx);
    const t = live();
    if (!ctx.reducedMotion) await new Promise((done) => { recovering = { done, hold: 0 }; });
    recovering = null;
    if (t !== live()) return;
    if (!(await line(ch.pc.deploy.recovered))) return;
    if (after === 'win') win(ctx); else enterPc(ctx);
  }

  // ---- the win, the verdict, the summary ----
  async function win(ctx) {
    const steps = missteps(scen);
    clearScene(ctx);
    ctx.overlay.innerHTML = '';
    state = 'ending'; run.phase('win'); setIcons(ctx, false);
    paint(ctx);
    const done = recordDone(ctx.loadDone(), ch.id, steps);         // solved: the status bar ticks up as the win is declared
    ctx.saveDone(done); ctx.setSolved(solvedCount(done));
    for (const k of ch.win) if (!(await line(k))) return;
    state = 'verdict'; paint(ctx);
    if (!(await line(ch.verdict.key, { where: 'bottom', className: 'verdict' }))) return;
    run.end(steps);
    showSummary(ctx);
  }

  function showSummary(ctx) {
    state = 'summary';
    const s = run.snapshot();
    const g = ctx.ctx2d; g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    const rows = (pairs) => pairs.map(([k, v]) => `<div class="sum-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
    const phases = PHASES.map((p) => [PHASE_LABELS[p], formatMs(s.phases[p])]);
    const counts = COUNT_LABELS.map(([k, label]) => [label, k === 'walkMs' ? formatMs(s.counts[k]) : String(s.counts[k])]);
    const half = Math.ceil(counts.length / 2);
    ctx.overlay.innerHTML = `
      <div class="summary" id="summary" role="dialog">
        <h2>${esc(UI.summaryTitle(ch.id, formatMs(s.total)))}</h2>
        <div class="sum-grid"><div class="sum-col">${rows(phases)}${rows([['Missteps', String(s.missteps)]])}</div><div class="sum-col">${rows(counts.slice(0, half))}</div><div class="sum-col">${rows(counts.slice(half))}</div></div>
        <p class="sum-prompt">${esc(say('after.prompt'))}</p>
        <div class="sum-btns">
          <button type="button" class="prompt" id="btn-claim">${esc(say('after.claim'))}</button>
          <button type="button" class="prompt" id="btn-more">${esc(say('after.more'))}</button>
          <button type="button" class="prompt" id="btn-copy">${esc(say('ui.copy'))}</button>
        </div>
      </div>`;
    const t = live();
    ctx.overlay.querySelector('#btn-more').addEventListener('click', () => game.go('MENU'));
    ctx.overlay.querySelector('#btn-claim').addEventListener('click', async () => {
      if (wins.open) return;
      if (ctx.overlay.querySelector('#charity')) return;
      if (await playCharity(ctx, wins, say('claim.soon'), () => t === live())) game.go('MENU');
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
    btn.textContent = say('ui.copied');
  }

  return {
    enter(ctx) {
      ch = CHAPTERS[ctx.chapterId] || CH1;
      room = ch.room; hero = ctx.hero;
      token = {};
      x = room.start; pose = 'idle'; view = 'front'; flip = false; plan = null; elapsed = 0; walkMs = 0; pending = null; marker = null; cursor = null;
      mode = 'use'; busy = false; tools = {}; introShown = new Set(); toolName = null; toolFrom = null; toolEl = null; reveal = null;
      scen = createScenario(); vitalsMode = 'critical'; vitalsT = 0; nudges = []; talkT = 0; ctoQuiet = false; lastDraw = ''; sceneEl = null; monFrame = null;
      art = null; hcArt = null; recovering = null;
      gctx = ctx; loadPersona(ctx);
      // the room's and the Honeycomb screen's pictures load while the card is read; either may fail and play on
      const want = (url, set) => loadManifest(url, { timeout: LOAD_WAIT_MS }).then(set, () => {});
      loading = Promise.all([want(ch.manifest, (a) => { art = a; }), want(ch.tools.hc.screens, (a) => { hcArt = a; })]);
      run = createRunlog({ chapter: ch.id });
      for (const [reason, on] of Object.entries(ctx.holds || {})) if (on) run.hold(reason, true);
      ctx.runlog = run;
      wins = createWindows(ctx, { onShow: () => run.count('windows') });
      ctx.showSolved();
      const box = ctx.canvas.parentElement;
      onTapCount = () => run.count('taps');
      document.addEventListener('pointerdown', onTapCount, true);
      onDown = (e) => {
        if (e.target.closest?.('button')) return;               // buttons answer their own clicks
        if (wins.open) { wins.tap(); return; }
        if (state === 'card') { leaveCard(ctx); return; }
        if (state === 'pcard') { pcardClose?.(); return; }      // the whole scene is the card's close target
        if (state === 'room' && !busy) roomTap(ctx, e);
        else if (state === 'monitor') monitorTap(ctx, e);
        else if (state === 'recover' && recovering) recovering.done();     // a tap skips to Otto's line
      };
      onMove = (e) => {
        if (state !== 'room' || wins.open) { if (cursor) { cursor = null; applyCursor(box, null); } return; }
        const [mx, my] = logical(ctx, e);
        const name = hotspotAt(room, mx, my) ? 'hand' : 'walk';
        if (name !== cursor) { cursor = name; applyCursor(box, name); }
      };
      box.addEventListener('pointerdown', onDown);
      box.addEventListener('pointermove', onMove);
      showCard(ctx);
      window.__oq && (window.__oq.chapter = {
        get state() { return state; }, get mode() { return mode; }, get x() { return x; }, get walking() { return plan !== null; },
        get view() { return view; }, get busy() { return busy; }, get pcView() { return pcView; },
        get loaded() { return art !== null; }, get screensLoaded() { return hcArt !== null; },
        get window() { return wins.open ? { id: wins.serial, text: wins.element.dataset.text, pages: wins.pages, page: wins.page } : null; },
        get tool() { const t = tools[toolName]; return t && state === 'tool' ? { name: toolName, from: toolFrom, step: t.step, done: t.done, wrong: t.wrong, prompts: promptsOf(t) } : null; },
        get scenario() { return { ...scen }; },
        get vitals() { return vitals(ctx); },
        get ctoFrame() { return ctoQuiet || state === 'decide' || state === 'ending' ? 0 : talkFrame(talkT, ctx.reducedMotion); },
        get otto() { return ottoState(scen); },
        hotspot(id) { return room.hotspots.find((h) => h.id === id); },
      });
    },
    tick(dt, ctx) {
      wins.tick(dt);
      vitalsT += dt; talkT += dt;
      let dirty = false;
      if (marker && (marker.left -= dt) <= 0) { marker = null; dirty = true; }
      if (plan) {
        elapsed += dt; walkMs += dt;
        const s = stepWalk(plan, elapsed);
        x = s.x; pose = s.pose; view = s.view; flip = s.flip; dirty = true;
        if (s.done) { plan = null; finishWalk(); if (pending) { const p = pending; pending = null; act(ctx, p); } }
      } else if (marker) dirty = true;
      if (reveal) { reveal.t += dt; dirty = true; if (reveal.t >= REVEAL_MS) { const d = reveal.done; reveal.t = REVEAL_MS; d(); } }
      if (recovering) {
        const o = vitals(ctx).output;
        if (o.shown >= o.text.length && (recovering.hold += dt) >= RECOVER_HOLD_MS) recovering.done();
      }
      // the monitor and the CTO move on their own: redraw when either has a new frame
      if (['room', 'decide', 'ending', 'monitor', 'recover'].includes(state)) {
        const key = `${stepAt(vitalsT)}:${talkFrame(talkT, ctx.reducedMotion)}:${ctoQuiet}:${nudges.length}`;
        if (key !== lastDraw) { lastDraw = key; dirty = true; }
      }
      if (dirty) paint(ctx);
    },
    exit(ctx) {
      token = null;
      const box = ctx.canvas.parentElement;
      box.removeEventListener('pointerdown', onDown); box.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onTapCount, true);
      applyCursor(box, null);
      wins.reset(); setIcons(ctx, false); clearScene(ctx); pcardClose?.(); pcardClose = null;
      ctx.overlay.innerHTML = '';
      toolEl = null; reveal = null; plan = null;
    },
  };
}
