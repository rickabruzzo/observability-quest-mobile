// The intro cutscene. Limited animation, the way a 1990 PC did it: whole stills replaced on a cut,
// two-state flashes, text drawn by code on a recycled plate. All timing lives in ../intro/timeline.js;
// this module loads the pictures, draws the frame the timeline asks for, and gets out of the way.

import { SHOTS, HERO_STEPS, frameAt, heroAt, nextShot, exitPlan, exitAt } from '../intro/timeline.js';
import { lcdScale, marqueeScale, marqueeX, drawLcd, lcdPages, drawLcdPage } from '../intro/pager.js';
import { createSfx } from '../intro/sfx.js';
import { blit, composeFigure, composeProp, drawHero, placeHero, silhouette, HERO_W } from '../engine/hero.js';
import { colButton } from '../engine/ui.js';

const BASE = 'assets/intro/';
const LOAD_TIMEOUT_MS = 6000;
const DIM = 0.16;                    // how much of the title shows on the unlit wall
const TAP_GUARD_MS = 250;            // a tap this soon after a cut is the tail of the last tap
const BED_RIGHT = 112;                // the bed's right edge in the bedroom plate: left of it, below the blanket line, is bed
const STAND_DX = 30;                 // standing spot when the manifest has none: just right of the bed's left edge
const WALK_AT = HERO_STEPS.find((s) => s.walkTo).at;
const REDUCED_BEDROOM_MS = 2500;
const NEXT = 'AFTER_INTRO';                // the game routes it: the scenario menu, or ?ch=N / ?preview=1
const TITLE = ['OBSERVABILITY QUEST I', 'So you want to be on-call?'];     // lettered whole when the wordmark picture is missing
const SUBTITLE = 'So you want to be on-call?';                             // under the wordmark, which carries the I
const TITLE_LABEL = 'Observability Quest I: So you want to be on-call?';

let loading = null;

/** Fetches the manifest and every still, once. Rejects (and forgets, so a later call retries) on any failure or after 6 s. */
export function preloadIntro() {
  if (loading) return loading;
  const work = (async () => {
    const res = await fetch(`${BASE}intro.json`);
    if (!res.ok) throw new Error(`intro.json ${res.status}`);
    const manifest = await res.json();
    for (const k of ['images', 'lcd', 'wall', 'bed', 'door']) if (!manifest[k] || typeof manifest[k] !== 'object') throw new Error(`intro.json: no ${k}`);
    if (!Number.isFinite(manifest.floorY)) throw new Error('intro.json: no floorY');
    const need = new Set(SHOTS.flatMap((s) => [s.image, s.alt].filter(Boolean)));
    if (manifest.images.wall_logo && manifest.logo && manifest.subtitle) need.add('wall_logo');
    for (const n of ['D_door_open', 'D_laptop_gone']) if (manifest.images[n]) need.add(n);
    const images = new Map();
    await Promise.all([...need].map((name) => new Promise((ok, fail) => {
      if (!manifest.images[name]) return fail(new Error(`intro.json: no image ${name}`));
      const img = new Image();
      img.onload = () => { images.set(name, img); ok(); };
      img.onerror = () => fail(new Error(`intro image ${name} failed`));
      img.src = BASE + manifest.images[name];
    })));
    return { manifest, images };
  })();
  let timer;
  const timeout = new Promise((_, fail) => { timer = setTimeout(() => fail(new Error('intro load timed out')), LOAD_TIMEOUT_MS); });
  loading = Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  loading.catch(() => { loading = null; });
  return loading;
}

/** The figure's silhouette in one colour (the flash into day clothes), at the hero's scale, for his feet at (feetX, feetY). */
function drawFlash(g, cfg, outfit, feetX, feetY, scale) {
  const p = placeHero(cfg, 'idle', feetX, feetY, scale, { outfit });
  if (p) blit(g, silhouette(p.fig, [255, 255, 255]), p.x, p.y, p.scale, false);
}

/** Yesterday's clothes on the floor, in the hero's own colours and with the mark on the hoodie: Art Claude's painting
 * (props.clothes, art brief 08) at the hero's scale `hs`, the middle of its bottom edge at (x, y). Draws nothing without
 * the sheet. */
export function drawClothes(g, cfg, x, y, hs = 1) {
  const clothes = composeProp('clothes', cfg);
  if (!clothes) return;
  const w = Math.round(clothes.w * hs), h = Math.round(clothes.h * hs);
  blit(g, clothes, x - Math.round(w / 2), y - h, hs, false);
}

export function createIntroScreen(game) {
  let token = 0, assets = null, shot = 0, t = 0, out = false, done = false;
  let skip = null, onTap = null, sfx = null, titleEl = null;
  let lastOn = false, clicked = false, heroState = null;
  let fired = new Set(), sounds = [];

  function cut(i) { shot = i; t = 0; lastOn = false; clicked = false; heroState = null; fired = new Set(); }

  /** Each action is heard once, the moment it happens. */
  function sound(name, on = true) {
    if (!on || fired.has(name)) return;
    fired.add(name); sounds.push(name); sfx?.play(name);
  }

  function finish() {            // idempotent; the game's double-tap guard may refuse the first go(), so tick retries
    out = true;
    if (!done && game.go(NEXT)) done = true;
  }

  function advance() {
    const n = nextShot(shot);
    if (n === null) finish(); else cut(n);
  }

  // The title on the wall: the app's wordmark (a picture, drawn on the canvas) with the subtitle under it as
  // page text. Without the wordmark picture, both lines are lettered as text.
  function showTitle(ctx, m, on, dim = false) {
    const logo = assets?.images.get('wall_logo'), g = ctx.ctx2d;
    if (on && logo) { g.globalAlpha = dim ? DIM : 1; g.drawImage(logo, m.logo.x, m.logo.y); g.globalAlpha = 1; }
    if (titleEl && titleEl.classList.contains('dim') !== dim) { titleEl.remove(); titleEl = null; }
    if (on && !titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = dim ? 'intro-title dim' : 'intro-title';
      titleEl.setAttribute('role', 'img'); titleEl.setAttribute('aria-label', TITLE_LABEL);
      const r = logo ? m.subtitle : m.wall;
      Object.assign(titleEl.style, { left: `${(r.x / 320) * 100}%`, top: `${(r.y / 200) * 100}%`, width: `${(r.w / 320) * 100}%`, height: `${(r.h / 200) * 100}%` });
      if (!logo) { const h = document.createElement('div'); h.className = 'intro-title-h'; h.textContent = TITLE[0]; titleEl.append(h); }
      const s = document.createElement('div'); s.className = 'intro-title-s'; s.textContent = logo ? SUBTITLE : TITLE[1];
      titleEl.append(s);
      ctx.overlay.appendChild(titleEl);
    } else if (!on && titleEl) { titleEl.remove(); titleEl = null; }
  }

  function paintLcd(g, m, s, lcd) {
    if (!lcd || !lcd.on) return;
    if (lcd.mode === 'marquee') {
      const sc = marqueeScale(m.lcd);
      drawLcd(g, m.lcd, lcd.text, marqueeX(lcd.text, m.lcd, sc, t, s.ms), sc);
    } else {
      const { scale, pages } = lcdPages(lcd.text, m.lcd);
      drawLcdPage(g, m.lcd, pages[Math.min(pages.length - 1, Math.floor((t / s.ms) * pages.length))], scale);
    }
  }

  function openDoor(g, m) {
    const still = assets.images.get('D_door_open');
    if (still) { g.drawImage(still, 0, 0, 320, 200); return; }
    const d = m.doorway;                                   // no open-door still: a dark doorway, the door swung in at the hinge side
    g.fillStyle = '#07070D'; g.fillRect(d.x, d.y, d.w, d.h);
    g.fillStyle = '#3A2414'; g.fillRect(d.x, d.y, Math.max(2, Math.round(d.w * 0.12)), d.h);
  }

  function paintHero(ctx, m) {
    const g = ctx.ctx2d, cfg = ctx.hero;
    const shotData = SHOTS[shot], hs = shotData.heroScale ?? 1;   // the bedroom draws the hero smaller than his sprite
    const floorY = shotData.standY ?? m.floorY;                     // where his feet stand: the front of the room (brief 11)
    // standX is the sprite's left edge, as the manifest gives it; the painted figure's feet are HERO_W / 2 to its right (brief 15)
    const standX = Number.isFinite(m.stand?.x) ? m.stand.x : m.bed.x + STAND_DX, feet = (left) => left + Math.round((HERO_W * hs) / 2);
    const box = (p, pose = 'idle') => (p ? { x: p.x, y: p.y, w: p.w, h: p.h, pose } : { x: standX, y: floorY, w: 0, h: 0, pose });   // the figure's own box: hair to soles
    if (ctx.reducedMotion) {
      const bareRoom = assets.images.get('D_laptop_gone');      // the hero already has their item
      if (bareRoom) g.drawImage(bareRoom, 0, 0, 320, 200);
      showTitle(ctx, m, true);
      const p = drawHero(g, cfg, 'idle', feet(standX), floorY, hs);
      heroState = { pose: 'idle', view: 'front', outfit: 'hoodie', x: standX, visible: true, pile: false, holding: true, doorOpen: false, box: box(p) };
      if (t >= REDUCED_BEDROOM_MS) finish();
      return;
    }
    const h = heroAt(t);
    const e = h.walking ? exitAt(exitPlan({ standX, doorX: m.door.x, floorY, doorY: Number.isFinite(m.door.y) ? m.door.y : m.floorY, heroScale: hs }), t - WALK_AT) : null;
    const pile = h.outfit === 'pj' && !!m.clothes;         // on the floor until the change puts them on the hero
    // The room is painted with a laptop on the dresser, and again without it: taking it is a cut between the two.
    // Sierra inventory style — it is simply the hero's now; nothing is drawn in their hand.
    const bareRoom = assets.images.get('D_laptop_gone');
    let plate = 'D_bedroom_vga';
    if (bareRoom && h.holding) { g.drawImage(bareRoom, 0, 0, 320, 200); plate = 'D_laptop_gone'; }
    if (e?.doorOpen) { openDoor(g, m); plate = assets.images.get('D_door_open') ? 'D_door_open' : plate; }
    showTitle(ctx, m, h.titled);
    if (pile) drawClothes(g, cfg, m.clothes.x, m.clothes.y, hs);
    heroState = { pose: h.pose, view: 'front', outfit: h.outfit, x: standX, visible: h.visible, pile, holding: h.holding, doorOpen: !!e?.doorOpen, plate, box: box(placeHero(cfg, 'idle', feet(standX), floorY, hs, { outfit: h.outfit })) };
    sound('title', h.titled); sound('rustle', h.stirring); sound('step', h.standing); sound('pickup', h.outfit === 'hoodie');
    sound('take', h.holding); sound('door', !!e?.doorOpen); sound('shut', !!e && !e.visible && !e.doorOpen);
    if (e) {
      const p = e.visible ? drawHero(g, cfg, e.pose, feet(e.x), e.y, hs, { flip: e.flip, dy: e.dy }) : placeHero(cfg, e.pose, feet(e.x), e.y, hs, { flip: e.flip, dy: e.dy });   // the way out is side on throughout
      Object.assign(heroState, { pose: e.pose, view: e.view, outfit: 'hoodie', x: e.x, visible: e.visible, box: box(p, e.pose) });
      if (e.done) finish();
      return;
    }
    if (!h.visible) return;
    if (h.pose === 'situp') {
      // in the bed (brief 11, and its review): he sits in front of the pillow (sitX) at sitY, a little below the plate's
      // blanket line, and the bed's own blanket covers his hips: the plate is drawn again over him from that line down,
      // across the bed. Nothing is drawn for the blanket; it is the painting's.
      // pj_sit is cut straight across at the waist (brief 15 F): its last row goes on sitY and the plate's blanket is drawn
      // back over him from the blanket's line down, so the cut never shows
      // (one row lower than the brief's "last row on sitY": the painted sitting figure is a row taller than the old one and
      // its hair touched the subtitle's box; sitY is the timeline's, and the blanket still covers the cut)
      const sitY = shotData.sitY ?? m.bed.y, sitX = shotData.sitX ?? m.bed.x;
      const p = drawHero(g, cfg, 'situp', feet(sitX), sitY + 2, hs, { outfit: 'pj' });
      const bed = assets.images.get(plate), by = m.bed.y + 1;
      if (bed) g.drawImage(bed, 0, by, BED_RIGHT, 200 - by, 0, by, BED_RIGHT, 200 - by);
      heroState.x = sitX;
      heroState.box = p ? { x: p.x, y: p.y, w: p.w, h: m.bed.y - p.y + 1, pose: 'situp' } : { x: sitX, y: m.bed.y, w: 0, h: 0, pose: 'situp' };   // the figure's own box: hair to the blanket line
      heroState.blanketLine = m.bed.y; heroState.sitY = sitY;
      return;
    }
    if (h.flash) drawFlash(g, cfg, h.outfit, feet(standX), floorY, hs);
    else drawHero(g, cfg, 'idle', feet(standX), floorY, hs, { outfit: h.outfit });
  }

  function paint(ctx, dt = 0) {
    const g = ctx.ctx2d;
    if (!assets) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); return; }
    const s = SHOTS[shot], m = assets.manifest, f = frameAt(shot, t, { reduced: ctx.reducedMotion });
    if (f.black) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); } else g.drawImage(assets.images.get(f.image), 0, 0, 320, 200);
    if (!f.black) paintLcd(g, m, s, f.lcd);
    if (s.clickAt != null && !clicked && t >= s.clickAt) { clicked = true; sfx?.click(); sounds.push('click'); }   // the light switch comes first
    // the dark wide shot is the same room once its art matches (manifest.darkTitle): the title is already on the wall, barely lit
    if (s.hero) paintHero(ctx, m); else showTitle(ctx, m, s.title === 'dim' && m.darkTitle === true && !f.black, true);
    // sound follows the picture: a beep each time the flash comes on, a click when the lamp does
    if (s.beepOnFlash && !ctx.reducedMotion) {
      const on = s.flash === 'black' ? !f.black : !!f.lcd?.on;
      if (on && !lastOn) { sfx?.beep(); sounds.push('beep'); }
      lastOn = on;
    }
  }

  return {
    enter(ctx) {
      const mine = ++token;
      assets = null; out = false; done = false; cut(0);
      sfx = createSfx({ sound: ctx.sound }); sfx.unlock();   // we are inside the Start tap: the one moment a phone lets sound begin
      sounds = [];
      skip = colButton({ id: 'btn-skip', long: 'Skip', short: 'Skip', onClick: finish });
      ctx.colR.appendChild(skip);
      onTap = () => { if (assets && !out && t >= TAP_GUARD_MS) advance(); };
      ctx.canvas.parentElement.addEventListener('pointerdown', onTap);
      paint(ctx);
      preloadIntro().then((a) => { if (mine === token) { assets = a; paint(ctx); } }, () => { if (mine === token) finish(); });
      if (window.__oq) {
        window.__oq.intro = {
          get shot() { return shot; }, get id() { return SHOTS[shot].id; }, get t() { return t; }, get done() { return done; },
          get loaded() { return assets !== null; }, get manifest() { return assets?.manifest ?? null; }, get hero() { return heroState; }, get sounds() { return sounds; },
        };
      }
    },
    tick(dt, ctx) {
      if (out) { if (!done) finish(); return; }
      if (!assets) return;
      t += dt;
      if (t >= SHOTS[shot].ms) { advance(); if (out) return; }
      paint(ctx, dt);
    },
    exit(ctx) {
      token++;
      ctx.canvas.parentElement.removeEventListener('pointerdown', onTap); onTap = null;
      skip?.remove(); skip = null;
      titleEl = null; ctx.overlay.innerHTML = '';
      sfx?.close(); sfx = null;
      assets = null; done = true;
    },
  };
}
