// The intro cutscene. Limited animation, the way a 1990 PC did it: whole stills replaced on a cut,
// two-state flashes, text drawn by code on a recycled plate. All timing lives in ../intro/timeline.js;
// this module loads the pictures, draws the frame the timeline asks for, and gets out of the way.

import { SHOTS, frameAt, heroAt, nextShot } from '../intro/timeline.js';
import { lcdScale, marqueeScale, marqueeX, drawLcd, lcdPages, drawLcdPage } from '../intro/pager.js';
import { createSfx } from '../intro/sfx.js';
import { composeHero, drawHero, HERO_W, HERO_H } from '../engine/hero.js';
import { planWalk, stepWalk } from '../engine/walk.js';
import { colButton } from '../engine/ui.js';

const BASE = 'assets/intro/';
const LOAD_TIMEOUT_MS = 6000;
const TAP_GUARD_MS = 250;            // a tap this soon after a cut is the tail of the last tap
const STAND_DX = 30;                 // standing spot, right of the bed
const AMBLE = 140;                   // px/s — a sleepy walk to the door
const REDUCED_BEDROOM_MS = 2500;
const NEXT = 'PREVIEW';
const TITLE = ['OBSERVABILITY QUEST I', 'So you want to be on-call?'];

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

export function createIntroScreen(game) {
  let token = 0, assets = null, shot = 0, t = 0, out = false, done = false;
  let skip = null, onTap = null, sfx = null, titleEl = null;
  let lastOn = false, clicked = false, walk = null, walkT = 0, heroState = null;

  function cut(i) { shot = i; t = 0; lastOn = false; clicked = false; walk = null; walkT = 0; heroState = null; }

  function finish() {            // idempotent; the game's double-tap guard may refuse the first go(), so tick retries
    out = true;
    if (!done && game.go(NEXT)) done = true;
  }

  function advance() {
    const n = nextShot(shot);
    if (n === null) finish(); else cut(n);
  }

  function showTitle(ctx, m, on) {
    if (on && !titleEl) {
      titleEl = document.createElement('div');
      titleEl.className = 'intro-title';
      const w = m.wall;
      Object.assign(titleEl.style, { left: `${(w.x / 320) * 100}%`, top: `${(w.y / 200) * 100}%`, width: `${(w.w / 320) * 100}%`, height: `${(w.h / 200) * 100}%` });
      const h = document.createElement('div'); h.className = 'intro-title-h'; h.textContent = TITLE[0];
      const s = document.createElement('div'); s.className = 'intro-title-s'; s.textContent = TITLE[1];
      titleEl.append(h, s);
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

  function paintHero(ctx, m, dt) {
    const g = ctx.ctx2d, cfg = ctx.hero;
    const standX = m.bed.x + STAND_DX, standY = m.floorY - HERO_H;
    if (ctx.reducedMotion) {
      showTitle(ctx, m, true);
      drawHero(g, cfg, 'idle', standX, standY, 1);
      heroState = { pose: 'idle', outfit: 'hoodie', x: standX };
      if (t >= REDUCED_BEDROOM_MS) finish();
      return;
    }
    const h = heroAt(t);
    showTitle(ctx, m, h.titled);
    if (!h.visible) { heroState = null; return; }
    if (h.walking) {
      if (!walk) { walk = planWalk(standX, m.door.x, { speed: AMBLE }); walkT = 0; } else walkT += dt;
      const s = stepWalk(walk, walkT);
      drawHero(g, cfg, s.pose, s.x, standY, 1, { flip: s.flip });
      heroState = { pose: s.pose, outfit: 'hoodie', x: s.x };
      if (s.done) finish();
      return;
    }
    if (h.pose === 'situp') {
      const px = composeHero(cfg, 'situp', 'pj');
      drawHero(g, cfg, 'situp', m.bed.x, m.bed.y - (lastOpaqueRow(px) + 1), 1, { outfit: 'pj' });   // bed.y is the blanket line
      heroState = { pose: 'situp', outfit: 'pj', x: m.bed.x };
      return;
    }
    if (h.flash) drawSilhouette(g, composeHero(cfg, 'idle', h.outfit), standX, standY, '#FFFFFF');
    else drawHero(g, cfg, 'idle', standX, standY, 1, { outfit: h.outfit });
    heroState = { pose: 'idle', outfit: h.outfit, x: standX };
  }

  function paint(ctx, dt = 0) {
    const g = ctx.ctx2d;
    if (!assets) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); return; }
    const s = SHOTS[shot], m = assets.manifest, f = frameAt(shot, t, { reduced: ctx.reducedMotion });
    if (f.black) { g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200); } else g.drawImage(assets.images.get(f.image), 0, 0, 320, 200);
    if (!f.black) paintLcd(g, m, s, f.lcd);
    if (s.hero) paintHero(ctx, m, dt); else showTitle(ctx, m, false);
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
