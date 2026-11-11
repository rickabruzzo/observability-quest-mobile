// The intro cutscene. Limited animation, the way a 1990 PC did it: whole stills replaced on a cut,
// two-state flashes, text drawn by code on a recycled plate. All timing lives in ../intro/timeline.js;
// this module loads the pictures, draws the frame the timeline asks for, and gets out of the way.

import { SHOTS, HERO_STEPS, frameAt, heroAt, nextShot, exitPlan, exitAt } from '../intro/timeline.js';
import { lcdScale, marqueeScale, marqueeX, drawLcd, lcdPages, drawLcdPage } from '../intro/pager.js';
import { createSfx } from '../intro/sfx.js';
import { composeHero, drawHero, HERO_W, HERO_H } from '../engine/hero.js';
import { HOODIE, JEANS, HC_MARK, HC_MARK_PIXELS, OUTLINE } from '../engine/hero-parts.js';
import { colButton } from '../engine/ui.js';

const BASE = 'assets/intro/';
const LOAD_TIMEOUT_MS = 6000;
const TAP_GUARD_MS = 250;            // a tap this soon after a cut is the tail of the last tap
const STAND_DX = 30;                 // standing spot when the manifest has none: just right of the bed's left edge
const WALK_AT = HERO_STEPS.find((s) => s.walkTo).at;
const REDUCED_BEDROOM_MS = 2500;
const NEXT = 'PREVIEW';
const TITLE = ['OBSERVABILITY QUEST I', 'So you want to be on-call?'];     // lettered whole when the wordmark picture is missing
const SUBTITLE = 'I: So you want to be on-call?';                          // under the wordmark
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
    if (manifest.images.D_door_open) need.add('D_door_open');
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

function lastOpaqueRow(px) {
  for (let y = HERO_H - 1; y >= 0; y--) for (let x = 0; x < HERO_W; x++) if (px[(y * HERO_W + x) * 4 + 3]) return y;
  return HERO_H - 1;
}

function drawSilhouette(g, px, x, y, color) {
  g.fillStyle = color;
  for (let r = 0; r < HERO_H; r++) for (let c = 0; c < HERO_W; c++) if (px[(r * HERO_W + c) * 4 + 3]) g.fillRect(x + c, y + r, 1, 1);
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Yesterday's clothes in a heap, in the hero's own colours: jeans under a crumpled Honeycomb hoodie. (x, y) = left, floor row. */
export function drawClothes(g, cfg, x, y) {
  const hood = HOODIE[cfg.hoodie] || HOODIE.ink, jean = JEANS[cfg.jeans] || JEANS.indigo;
  const R = (c, dx, dy, w, h) => { g.fillStyle = c; g.fillRect(x + dx, y + dy, w, h); };
  for (const [dx, dy, w, h] of [[0, -4, 13, 4], [10, -3, 10, 3], [3, -9, 14, 6], [5, -10, 5, 1], [15, -6, 5, 3]]) R(OUTLINE, dx - 1, dy - 1, w + 2, h + 2);
  R(jean, 0, -4, 13, 4); R(jean, 10, -3, 10, 3); R(shade(jean, 0.7), 0, -1, 20, 1); R(shade(jean, 1.25), 11, -3, 8, 1);   // jeans, one leg trailing
  R(hood, 3, -9, 14, 6); R(hood, 5, -10, 5, 1); R(hood, 15, -6, 5, 3);                                                   // hoodie body, hood, a sleeve
  R(shade(hood, 1.3), 3, -9, 14, 1); R(shade(hood, 0.7), 3, -4, 14, 1); R(shade(hood, 0.7), 15, -4, 5, 1);
  for (const [mx, my, k] of HC_MARK_PIXELS) R(HC_MARK[k], 8 + (mx - 12), -8 + (my - 32), 1, 1);                           // the mark, face up
}

export function createIntroScreen(game) {
  let token = 0, assets = null, shot = 0, t = 0, out = false, done = false;
  let skip = null, onTap = null, sfx = null, titleEl = null;
  let lastOn = false, clicked = false, heroState = null;

  function cut(i) { shot = i; t = 0; lastOn = false; clicked = false; heroState = null; }

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
  function showTitle(ctx, m, on) {
    const logo = assets?.images.get('wall_logo');
    if (on && logo) ctx.ctx2d.drawImage(logo, m.logo.x, m.logo.y);
    if (on && !titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = 'intro-title';
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
    const standX = Number.isFinite(m.stand?.x) ? m.stand.x : m.bed.x + STAND_DX, standY = m.floorY - HERO_H;
    if (ctx.reducedMotion) {
      showTitle(ctx, m, true);
      drawHero(g, cfg, 'idle', standX, standY, 1);
      heroState = { pose: 'idle', outfit: 'hoodie', x: standX, visible: true, pile: false, doorOpen: false };
      if (t >= REDUCED_BEDROOM_MS) finish();
      return;
    }
    const h = heroAt(t);
    const e = h.walking ? exitAt(exitPlan({ standX, doorX: m.door.x, floorY: m.floorY, doorY: Number.isFinite(m.door.y) ? m.door.y : m.floorY }), t - WALK_AT) : null;
    const pile = h.outfit === 'pj' && !!m.clothes;         // on the floor until the change puts them on the hero
    if (e?.doorOpen) openDoor(g, m);
    showTitle(ctx, m, h.titled);
    if (pile) drawClothes(g, cfg, m.clothes.x, m.clothes.y);
    heroState = { pose: h.pose, outfit: h.outfit, x: standX, visible: h.visible, pile, doorOpen: !!e?.doorOpen };
    if (e) {
      if (e.visible) drawHero(g, cfg, e.pose, e.x, e.y - HERO_H, 1, { flip: e.flip });
      Object.assign(heroState, { pose: e.pose, outfit: 'hoodie', x: e.x, visible: e.visible });
      if (e.done) finish();
      return;
    }
    if (!h.visible) return;
    if (h.pose === 'situp') {
      const px = composeHero(cfg, 'situp', 'pj');
      drawHero(g, cfg, 'situp', m.bed.x, m.bed.y - (lastOpaqueRow(px) + 1), 1, { outfit: 'pj' });   // bed.y is the blanket line
      heroState.x = m.bed.x;
      return;
    }
    if (h.flash) drawSilhouette(g, composeHero(cfg, 'idle', h.outfit), standX, standY, '#FFFFFF');
    else drawHero(g, cfg, 'idle', standX, standY, 1, { outfit: h.outfit });
  }

  function paint(ctx, dt = 0) {
    const g = ctx.ctx2d;
    if (!assets) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); return; }
    const s = SHOTS[shot], m = assets.manifest, f = frameAt(shot, t, { reduced: ctx.reducedMotion });
    if (f.black) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); } else g.drawImage(assets.images.get(f.image), 0, 0, 320, 200);
    if (!f.black) paintLcd(g, m, s, f.lcd);
    if (s.hero) paintHero(ctx, m); else showTitle(ctx, m, false);
    // sound follows the picture: a beep each time the flash comes on, a click when the lamp does
    if (s.beepOnFlash && !ctx.reducedMotion) {
      const on = s.flash === 'black' ? !f.black : !!f.lcd?.on;
      if (on && !lastOn) sfx?.beep();
      lastOn = on;
    }
    if (s.clickAt != null && !clicked && t >= s.clickAt) { clicked = true; sfx?.click(); }
  }

  return {
    enter(ctx) {
      const mine = ++token;
      assets = null; out = false; done = false; cut(0);
      sfx = createSfx();
      skip = colButton({ id: 'btn-skip', long: 'Skip', short: 'Skip', onClick: finish });
      ctx.colR.appendChild(skip);
      onTap = () => { if (assets && !out && t >= TAP_GUARD_MS) advance(); };
      ctx.canvas.parentElement.addEventListener('pointerdown', onTap);
      paint(ctx);
      preloadIntro().then((a) => { if (mine === token) { assets = a; paint(ctx); } }, () => { if (mine === token) finish(); });
      if (window.__oq) {
        window.__oq.intro = {
          get shot() { return shot; }, get id() { return SHOTS[shot].id; }, get t() { return t; }, get done() { return done; },
          get loaded() { return assets !== null; }, get manifest() { return assets?.manifest ?? null; }, get hero() { return heroState; },
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
