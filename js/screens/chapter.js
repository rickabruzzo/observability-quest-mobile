// A scenario, start to finish: title card → room (tap to walk, tap to act, Look / Use / Help) → close-ups (the
// lent computer with its menu, the wall display) → tool screens (the old tool, the Honeycomb screen) → the
// persona's card and decision → win → verdict → the timing summary. Every scenario's words, places, pictures
// and wall-display painter are data (js/chapters/chN.js, through js/chapters/index.js); the rules are the pure
// engine modules (scenario, persona, prompts, room); this module is the DOM, the canvas and the clock. It names
// no scenario: tests/chapter-data.test.js greps it.

import { SCRIPT } from '../script.js';
import { CHAPTERS } from '../chapters/index.js';
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
import { createScenario, notePrompt, noteFound, noteDeployed, wallState, canLeave, canDeploy, statusLine, personaUse, decide, missteps, firstTalk } from '../engine/scenario.js';
import { parseStats, cardPicture, personaOptions, OPTION_KEYS, personaFrame, cardFrameAt, phoneRows } from '../engine/persona.js';
import { paintHc } from '../engine/screens.js';
import { playCharity } from './charity.js';
import { loadManifest } from '../engine/images.js';
import { recordDone, solvedCount } from '../menu.js';

export { CHAPTERS };
export const REVEAL_MS = 2000;               // a direct prompt's next picture wipes in, then its highlights pulse
const RECOVER_HOLD_MS = 900;                 // after the wall display has recovered, a beat before its line
const LOAD_WAIT_MS = 6000;                   // the card waits this long for the room's pictures, then plays without
const CARDS_MANIFEST = 'assets/cards/cards.json';
// The one string the script has no slot for: the stopwatch summary is Rick's tuning tool and comes out before the
// booth build. Everything else the player reads is a script slot (ui.*, menu.soon, claim.soon, chN.old.close).
export const UI = {
  summaryTitle: (n, t) => `Scenario ${n} · ${t}`,
};

const say = (key) => SCRIPT[key] ?? key;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/** CSS placement of a scene area ({x0,x1,y0,y1}, inclusive, on the 320x200 scene) as percentages of the scene box. */
const place = (a) => `left:${(a.x0 / 320) * 100}%;top:${(a.y0 / 200) * 100}%;width:${((a.x1 - a.x0 + 1) / 320) * 100}%;height:${((a.y1 - a.y0 + 1) / 200) * 100}%`;
const inArea = (a, x, y) => x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1;
/** The wall display's words: its text keys resolved through the script (arrays of keys too). */
const wallWords = (text) => Object.fromEntries(Object.entries(text || {}).map(([k, v]) => [k, Array.isArray(v) ? v.map(say) : say(v)]));

let cardsManifest = null;                    // assets/cards/cards.json, fetched once: which card has painted frames

export function createChapterScreen(game) {
  let ch, room, hero, run, wins, token = null, scen, art = null, hcArt = null, loading = null, recovering = null;
  let persona = null, gctx = null;             // who speaks from the close-up; the game ctx, for the scene's scale
  let state = 'card', mode = 'use', busy = false, pcardClose = null, card = null;
  let x = 0, pose = 'idle', view = 'front', flip = false, plan = null, elapsed = 0, walkMs = 0, pending = null, marker = null, cursor = null;
  let tools = {}, introShown = new Set(), toolName = null, toolFrom = null, toolEl = null, reveal = null, portrait = null;
  let wallT = 0, wallAll = 0, nudges = [], talkT = 0, personaQuiet = false, personaTalking = false, won = false, lastDraw = '';
  let sceneEl = null, pcView = 'menu', wallFrame = null, wallWordsCache = null;
  let icons = [], back = null, onDown = null, onMove = null, onTapCount = null;

  // ---- the wall display's state, shared by the room and the close-up ----
  const wall = (ctx) => ({ state: wallState(scen), t: wallT, tAll: wallAll, reduced: !!ctx.reducedMotion, nudges, text: wallWordsCache, cfg: ch.wall });
  const painter = () => ch.wall.painter;

  // ---- drawing ----
  const img = (name) => art?.images.get(name);
  function backdrop(g, name) {
    const im = img(name);
    if (im) g.drawImage(im, 0, 0); else { g.fillStyle = '#1B2333'; g.fillRect(0, 0, 320, 200); }   // the pictures failed: keep playing
  }
  /** The persona's frame over the plate right now (a manifest name, or null for the plate). */
  function personaNow(ctx) {
    const p = ch.persona;
    return personaFrame({ t: talkT, talking: personaTalking, quiet: personaQuiet || state === 'decide', won, reduced: !!ctx.reducedMotion, loop: p.loop ?? 'speak', frames: p.frames, seed: ch.id });
  }
  function paintRoom(ctx) {
    const g = ctx.ctx2d;
    backdrop(g, room.image);
    painter().room(g, wall(ctx));                                   // the wall display, under the persona's frame
    const frame = personaNow(ctx), patch = art?.manifest.patches?.[room.image];
    if (frame && patch && img(frame)) g.drawImage(img(frame), patch.x, patch.y);
    const hs = room.heroScale ?? 1, heroY = room.floorY - Math.round(HERO_H * hs);     // feet on the floor line at any scale
    if (view === 'side') drawHeroSide(g, hero, pose, x, heroY + SIDE_FOOT_DY, hs, { flip });
    else drawHero(g, hero, pose, x, heroY, hs, { flip });
    if (marker) drawIcon(g, marker.icon, marker.x, marker.y);
  }
  function paintWall(ctx) {
    const g = ctx.ctx2d, s = wall(ctx);
    backdrop(g, painter().image(s));
    painter().close(g, s);
    renderWallText(s);
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
    else if (state === 'wall' || state === 'recover') paintWall(ctx);
    else if (state === 'pc') backdrop(ctx.ctx2d, ch.pc.image);
    else if (state === 'room' || state === 'decide' || state === 'ending' || state === 'pcard') paintRoom(ctx);
  }

  // ---- sequencing ----
  const live = () => token;
  /** Shows a line and waits for the player to dismiss it; resolves false if the screen went away meanwhile.
   * The persona's own lines (`TITLE: …`) open the conversation window: their portrait, their name, the prefix dropped;
   * in the room their talk frames play while the line is up. */
  async function line(key, opts) {
    const t = live();
    const { spoken, text } = persona ? personaLine(say(key), persona.title) : { spoken: false, text: say(key) };
    if (spoken) {
      const patch = art?.manifest.patches?.[room.image] ?? null;
      const { className, maxWidth } = talkWindow(persona.where, patch, gctx?.fit?.scale ?? 1);
      personaTalking = true;
      await wins.say(text, { ...opts, where: className, maxWidth, portrait: { name: persona.name, seed: persona.seed, ...persona.portrait } });
      if (t === live()) personaTalking = false;
    } else await wins.say(text, opts);
    return t === live();
  }
  /** A line about the persona (Look): one whose loop runs all the time goes quiet while it is open. */
  async function personaQuietLine(key) {
    personaQuiet = true;
    const ok = await line(key);
    if (ok) personaQuiet = false;
    return ok;
  }
  /** The persona's close-up: the still and its three patches, loaded once per visit; a missing frame is just a still. */
  function loadPersona() {
    const p = ch.persona;
    const base = `portrait_${p.portrait}`;
    persona = { title: speakerOf(say(p.name)), name: say(p.name), where: p.where ?? 'top-left', seed: p.portrait.charCodeAt(p.portrait.length - 1),
      portrait: { still: null, frames: { talk1: `${base}_talk1`, talk2: `${base}_talk2`, blink: `${base}_blink` } } };
    const me = persona;
    const im = new Image();
    im.onload = () => { if (persona === me) me.portrait.still = im; };
    im.src = `assets/${base}.png`;
    loadSprites(Object.values(me.portrait.frames), { optional: true }).catch(() => {});
    if (!cardsManifest) fetch(CARDS_MANIFEST).then((r) => (r.ok ? r.json() : null)).then((m) => { if (m) cardsManifest = m; }).catch(() => {});
  }
  function clearScene() {
    sceneEl?.remove(); sceneEl = null; toolEl?.remove(); toolEl = null; wallFrame = null;
    back?.remove(); back = null;
  }

  // ---- the title card: who paged the hero tonight, in one line (the stats are on the persona's card) ----
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
    const was = state; state = 'pcard'; personaQuiet = true;
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
    // the picture: the card art (with its painted frames, if the manifest lists any, and any overlay the data asks
    // for), or the persona cropped from the room plate if that file is missing — never empty, never waiting
    const artBox = dim.querySelector('.art');
    const crop = () => {
      const pic = cardPicture(p, false), plate = img(pic.image), c = document.createElement('canvas');
      c.width = pic.w; c.height = pic.h;
      if (plate) c.getContext('2d').drawImage(plate, pic.x, pic.y, pic.w, pic.h, 0, 0, pic.w, pic.h);
      artBox.replaceChildren(c); card = null;
    };
    const pic = cardPicture(p, !!p.art);
    if (pic.kind === 'art') {
      const base = new Image();
      const dir = pic.src.slice(0, pic.src.lastIndexOf('/') + 1);
      const frames = (cardsManifest?.frames?.[p.card] || []).map((f) => { const im = new Image(); im.src = dir + f; return im; });
      base.onload = () => {
        const c = document.createElement('canvas'); c.width = base.naturalWidth; c.height = base.naturalHeight;
        artBox.replaceChildren(c);
        card = { canvas: c, base, frames, files: cardsManifest?.frames?.[p.card] || [], overlay: p.overlay ?? null, t: 0, key: null, reduced: !!ctx.reducedMotion };
        drawCard();
      };
      base.onerror = crop; base.src = pic.src;
    } else crop();
    ctx.overlay.appendChild(dim);
    paint(ctx);
    return new Promise((done) => {
      const close = () => {
        if (!dim.isConnected) return;
        dim.remove(); card = null; document.removeEventListener('keydown', onKey, true);
        if (t === live()) { state = was; personaQuiet = false; }
        done(t === live());
      };
      const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); close(); } };
      dim.addEventListener('pointerdown', (e) => { e.stopPropagation(); close(); });
      document.addEventListener('keydown', onKey, true);
      pcardClose = close;
    });
  }
  /** The card's picture at this moment: the card, or one of its painted frames; then the overlay the data names. */
  function drawCard() {
    if (!card) return;
    const file = cardFrameAt(card.t, card.files, card.reduced);
    const rows = card.overlay?.kind === 'phone' ? phoneRows(card.t, card.overlay, card.reduced) : null;
    const key = `${file}:${rows ? rows.map((r) => `${r.y}.${r.w}`).join(',') : ''}`;
    if (key === card.key) return;
    card.key = key;
    const g = card.canvas.getContext('2d');
    g.clearRect(0, 0, card.canvas.width, card.canvas.height);
    g.drawImage(card.base, 0, 0);
    const i = card.files.indexOf(file);
    if (i >= 0 && card.frames[i].complete && card.frames[i].naturalWidth) g.drawImage(card.frames[i], 0, 0);
    if (rows) {                                                     // a phone's screen with urgent notifications scrolling up it
      const o = card.overlay;
      g.fillStyle = '#DFF4FF'; g.fillRect(o.x, o.y, o.w, o.h);
      for (const r of rows) { g.fillStyle = '#E04040'; g.fillRect(o.x, o.y + r.y, 1, 1); g.fillStyle = '#1A1C22'; g.fillRect(o.x + 1, o.y + r.y, Math.min(r.w, o.w - 1), 1); }
    }
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
    clearScene();
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

  const isPersona = (spot) => spot.use?.action === 'persona';
  function act(ctx, spot) {
    run.visit(spot.id);
    const use = spot.use;
    if (typeof use === 'string') line(use);
    else if (use?.scene === 'pc') enterPc(ctx);
    else if (use?.scene === 'wall') enterWall(ctx);
    else if (use?.action === 'persona') usePersona(ctx);
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
        if (isPersona(spot)) personaQuietLine(spot.look); else line(spot.look);
        paint(ctx); return;
      }
    }
    if (spot && spot.walk === false) { stopWalk(); paint(ctx); act(ctx, spot); return; }
    pending = spot;
    walkTo(ctx, spot ? spot.standX : walkTarget(room, tx));
    if (!plan && pending) { const s = pending; pending = null; act(ctx, s); }
    paint(ctx);
  }

  // ---- the wall display's close-up: the painter's text boxes are real text placed from the scene's rectangles ----
  function wallUi(ctx) {
    setIcons(ctx, false); clearScene();
    ctx.overlay.innerHTML = '';
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene-ui wall-ui'; sceneEl.id = 'wall';
    ctx.overlay.appendChild(sceneEl);
    renderWallText(wall(ctx), true);
  }
  /** Lays the painter's boxes out once, then updates their words only when the frame changes. */
  function renderWallText(s, build = false) {
    if (!sceneEl || (state !== 'wall' && state !== 'recover')) return;
    const boxes = painter().text(s);
    if (build || sceneEl.childElementCount !== boxes.length) {
      sceneEl.innerHTML = boxes.map((b, i) => `<div class="wall-box ${b.cls ?? ''}${b.wrap ? ' wrap' : ''}" data-box="${i}" data-id="${b.id}" style="${place(b.area)}">${b.lines.map(() => '<span class="fit"></span>').join('')}${b.cursor !== undefined ? '<span class="mon-cursor"></span>' : ''}</div>`).join('');
      wallFrame = null;
    }
    const key = JSON.stringify(boxes) + painter().tone?.(s);
    if (key === wallFrame) return;
    wallFrame = key;
    sceneEl.classList.toggle('ok', painter().tone?.(s) === 'ok');
    sceneEl.querySelectorAll('.wall-box').forEach((el, i) => {
      const b = boxes[i], spans = el.querySelectorAll('.fit');
      el.classList.toggle('garble', b.mod === 'garble');
      if (spans.length !== b.lines.length) { el.innerHTML = b.lines.map(() => '<span class="fit"></span>').join('') + (b.cursor !== undefined ? '<span class="mon-cursor"></span>' : ''); }
      b.lines.forEach((l, j) => { const sp = el.querySelectorAll('.fit')[j]; if (sp.textContent !== l) { sp.textContent = l; if (!b.wrap) fit(sp); } });
      const cur = el.querySelector('.mon-cursor'); if (cur) cur.classList.toggle('off', !b.cursor);
    });
  }
  /** A line wider than its box is condensed sideways to fit, never cut and never smaller than the box's font. */
  function fit(span) {
    span.style.transform = '';
    const w = span.parentElement.clientWidth, need = span.scrollWidth;
    if (need > w && w > 0) span.style.transform = `scaleX(${(w / need).toFixed(3)})`;
  }
  async function enterWall(ctx) {
    state = 'wall'; run.phase('wall'); run.count('wall');
    wallUi(ctx);
    back = colButton({ id: 'btn-back', long: say('ui.back'), onClick: () => { if (state === 'wall' && !wins.open) enterRoom(ctx); } });
    ctx.colR.appendChild(back);
    lastDraw = ''; paint(ctx);
    await line(ch.wall.chart);
  }
  function wallTap(ctx, e) {
    const [tx, ty] = logical(ctx, e), s = wall(ctx);
    const hit = painter().hits(s).find((h) => inArea(h.area, tx, ty));
    if (hit) { nudges.push({ step: ctx.reducedMotion ? nudges.length + 1 : Math.floor(wallT / 100), box: hit.box }); wallFrame = null; paint(ctx); return; }
    if (!inArea(ch.wall.close.screen, tx, ty)) enterRoom(ctx);     // off the glass: back to the room
  }

  // ---- the lent computer ----
  function enterPc(ctx, { view: v = 'menu' } = {}) {
    state = 'pc'; run.phase('pc');
    setIcons(ctx, false); clearScene();
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
    const deploy = { id: 'deploy', key: ch.pc.deploy.item, action: 'deploy' };
    let items = ch.pc.menu;
    if (v === 'email') items = ch.pc.emails.map((key, i) => ({ id: `email-${i + 1}`, key, action: 'read' }));
    else if (v === 'deploy') items = [deploy];                     // "show me": the one prompt, on the spot
    else if (canDeploy(scen)) items = [...items.slice(0, -1), deploy, items[items.length - 1]];   // before Leave
    grid.innerHTML = items.map((it) => `<button type="button" class="pc-item" data-id="${it.id}">${esc(say(it.key))}</button>`).join('');
    grid.querySelectorAll('.pc-item').forEach((b) => b.addEventListener('click', () => pcPick(ctx, items.find((it) => it.id === b.dataset.id))));
  }
  async function pcPick(ctx, item) {
    if (state !== 'pc' || wins.open || busy || !item) return;
    const p = ch.pc;
    switch (item.action) {
      case 'read': run.count('emails'); if (await line(p.reply)) showPc(ctx, 'menu'); return;
      case 'email': showPc(ctx, 'email'); return;
      case 'status': run.count('status'); line(p.status[statusLine(scen)]); return;
      case 'tool': openTool(ctx, item.tool, 'pc'); return;
      case 'deploy': if (canDeploy(scen)) deployFix(ctx, pcView === 'deploy' ? 'win' : 'pc'); return;
      case 'leave':
        if (!canLeave(scen)) { line(p.locked); return; }          // never greyed: the line is the joke
        if (await line(p.leave)) enterRoom(ctx, { at: room.hotspots.find((h) => h.use?.scene === 'pc').standX });
        return;
      default: line(item.key);
    }
  }

  // ---- tool screens ----
  async function openTool(ctx, name, from) {
    state = 'tool'; toolName = name; toolFrom = from; busy = false;
    const def = ch.tools[name];
    tools[name] ||= createTool(def);                         // progress is kept between visits
    run.phase(def.kind === 'hc' ? 'hc' : 'old');
    if (def.kind === 'hc' && !portrait) { portrait = new Image(); portrait.src = ch.verdict.portrait; }
    setIcons(ctx, false); clearScene();
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
    exit.type = 'button'; exit.className = 'prompt exit'; exit.id = 'tool-exit'; exit.textContent = say(def.close ?? 'ui.close.hc');   // per tool
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
    if (r.finished) noteFound(scen);                             // the cause is found; the wall display is still broken
    if (!(await line(r.result))) return;
    if (!r.finished) { showPrompts(ctx); return; }
    if (toolFrom === 'persona') enterPc(ctx, { view: 'deploy' });   // "show me", and it did: now deploy it, then the win
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

  // ---- the persona: their card the first time, then their line, then the options every conversation ends in ----
  async function usePersona(ctx) {
    run.phase('persona');
    if (firstTalk(scen)) { if (!(await showPersonaCard(ctx))) return; }   // the card's time belongs to the persona phase
    const p = ch.persona, u = personaUse(scen);
    const ok = u.kind === 'call' ? await line(p.calls[u.n - 1]) : await line(p.ask);
    if (ok) showDecision(ctx);
  }
  const wrongId = () => ch.persona.options.wrong.id ?? 'wrong';
  /** The option list, drawn like the decision prompts: before a tool is tried, the card again or leave; after, the decision and the card. */
  function showDecision(ctx) {
    state = 'decide'; setIcons(ctx, false); clearScene();
    const o = ch.persona.options;
    const ids = personaOptions(scen).map((id) => (id === 'sign' ? wrongId() : id));
    const label = { [wrongId()]: say(o.wrong.key), hc: say(o.hc.key), show: say(OPTION_KEYS.show), leave: say(OPTION_KEYS.leave) };
    sceneEl = document.createElement('div');
    sceneEl.className = 'scene-ui decide'; sceneEl.id = 'decide';
    sceneEl.innerHTML = `<div class="decide-prompts">${ids.map((id) =>
      `<button type="button" class="prompt" id="decide-${id}"${id === wrongId() && scen.wrong ? ' disabled' : ''}>${esc(label[id])}</button>`).join('')}</div>`;
    ctx.overlay.appendChild(sceneEl);
    for (const b of sceneEl.querySelectorAll('button')) b.addEventListener('click', () => advise(ctx, b.id.slice('decide-'.length)));
    paint(ctx);
  }
  async function advise(ctx, choice) {
    if (state !== 'decide' || wins.open) return;
    const o = ch.persona.options;
    if (choice === 'show') {                                        // never a wrong choice: the card, then the same options
      clearScene();
      if (await showPersonaCard(ctx)) showDecision(ctx);
      return;
    }
    if (choice === 'leave') { clearScene(); enterRoom(ctx); return; }
    const r = decide(scen, choice === wrongId() ? 'wrong' : choice);
    if (r.outcome === 'tried') return;
    clearScene();
    if (r.outcome === 'jab') {
      run.count('wrong');
      if (await line(o.wrong.jab)) showDecision(ctx);             // the choice comes back
      return;
    }
    if (r.outcome === 'win') { win(ctx); return; }
    state = 'room';                                                 // they speak again: the loop is back while the line shows
    if (!(await line(o.hc.show))) return;
    if (r.outcome === 'deploy') enterPc(ctx, { view: 'deploy' });   // found already: just deploy it
    else openTool(ctx, 'hc', 'persona');
  }

  // ---- deploying the fix: the line, then the wall display recovering, then its line ----
  async function deployFix(ctx, after) {
    run.phase('deploy');
    if (!(await line(ch.pc.deploy.line))) return;
    noteDeployed(scen);
    wallT = 0; nudges = [];                                         // the display recovers now, and the close-up shows it
    state = 'recover'; wallUi(ctx); lastDraw = ''; wallFrame = null; paint(ctx);
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
    clearScene();
    ctx.overlay.innerHTML = '';
    state = 'ending'; won = true; run.phase('win'); setIcons(ctx, false);
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
      ch = CHAPTERS[ctx.chapterId] || CHAPTERS[1];
      room = ch.room; hero = ctx.hero;
      token = {};
      x = room.start; pose = 'idle'; view = 'front'; flip = false; plan = null; elapsed = 0; walkMs = 0; pending = null; marker = null; cursor = null;
      mode = 'use'; busy = false; tools = {}; introShown = new Set(); toolName = null; toolFrom = null; toolEl = null; reveal = null; portrait = null; card = null;
      scen = createScenario(); wallT = 0; wallAll = 0; nudges = []; talkT = 0; personaQuiet = false; personaTalking = false; won = false; lastDraw = ''; sceneEl = null; wallFrame = null;
      wallWordsCache = wallWords(ch.wall.text);
      art = null; hcArt = null; recovering = null;
      gctx = ctx; loadPersona();
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
        else if (state === 'wall') wallTap(ctx, e);
        else if (state === 'recover' && recovering) recovering.done();     // a tap skips to the display's line
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
        /** The wall display: its state, its tone and whatever frame its painter exposes. */
        get wall() { const s = wall(ctx); return { state: s.state, tone: painter().tone?.(s) === 'ok' ? 'green' : 'red', frame: painter().frame?.(s) ?? null, image: painter().image(s), text: painter().text(s) }; },
        get personaFrame() { return personaNow(ctx); },
        get won() { return won; },
        hotspot(id) { return room.hotspots.find((h) => h.id === id); },
      });
    },
    tick(dt, ctx) {
      wins.tick(dt);
      wallT += dt; wallAll += dt; talkT += dt;
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
        if (painter().recovered(wall(ctx)) && (recovering.hold += dt) >= RECOVER_HOLD_MS) recovering.done();
      }
      if (card) { card.t += dt; drawCard(); }
      // the wall display and the persona move on their own: redraw when either has a new frame
      if (['room', 'decide', 'ending', 'wall', 'recover', 'pcard'].includes(state)) {
        const key = `${painter().frameKey(wall(ctx))}:${personaNow(ctx)}`;
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
      wins.reset(); setIcons(ctx, false); clearScene(); pcardClose?.(); pcardClose = null;
      ctx.overlay.innerHTML = '';
      toolEl = null; reveal = null; plan = null; card = null; recovering = null;
    },
  };
}
