// The title screen (Warp brief 16): Art Claude's picture, "Before the page" — the night sky over the city from an
// open bedroom window, the pager on its nightstand not gone off yet. One picture, almost still: the stars twinkle,
// the wordmark's glow breathes, glints run across its letters, and the pager goes off when you press Start. The wordmark is 1.5 game pixels to a
// letter pixel, so it is two <img> layers over the canvas, not drawn on it. If the art fails or takes too long the
// old black card with the title in type shows, and Start works either way.

import { colButton } from '../engine/ui.js';
import { loadManifest } from '../engine/images.js';
import { createSfx } from '../intro/sfx.js';
import { SCRIPT } from '../script.js';
import { starsOn, glowAt, glintAt, startBeat, STAR_COUNT } from '../title/timeline.js';

export const MANIFEST = 'assets/title/title.json';
export const LOGO = 'assets/hc_logo_white.png';           // the official file; never drawn, recoloured or generated
const LOAD_TIMEOUT_MS = 6000;
const SUBTITLE = SCRIPT['title.subtitle'] ?? '';          // the same line the intro shows under the wordmark
const CREDIT_BREAK = '(CC BY-SA).';                       // the credit breaks after this sentence
const PCT_X = (v) => `${(v / 320) * 100}%`, PCT_Y = (v) => `${(v / 200) * 100}%`;

let loading = null;
/** Fetches the manifest and its pictures, once; rejects (and forgets, so a later visit retries) on failure or after 6 s. */
export function preloadTitle() {
  if (!loading) { loading = loadManifest(MANIFEST, { timeout: LOAD_TIMEOUT_MS }); loading.catch(() => { loading = null; }); }
  return loading;
}
/** The credit in two lines, broken after the CC BY-SA sentence. */
export function creditLines(text) {
  const i = text.indexOf(CREDIT_BREAK);
  if (i < 0) return [text];
  const cut = i + CREDIT_BREAK.length;
  return [text.slice(0, cut).trim(), text.slice(cut).trim()].filter(Boolean);
}

export function createTitleScreen(game) {
  let startBtn = null, token = 0, art = null, failed = false, t = 0, starsNow = [], glowNow = null, glowEl = null, glintEl = null, glintNow = null, starting = null, sfx = null, lit = false, beeps = 0;

  let exposed = false;
  /** What the browser tests read: window.__oq.title. */
  function expose() {
    if (!window.__oq) return;
    exposed = true;
    window.__oq.title = {
      get loaded() { return art !== null; }, get failed() { return failed; }, get lit() { return lit; }, get glow() { return glowNow; },
      get stars() { return starsNow.slice(); }, get glint() { return glintNow ? { ...glintNow } : null; }, get beeps() { return beeps; }, get starting() { return starting !== null; },
    };
  }
  function placeholder(ctx) {
    const g = ctx.ctx2d;
    g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    g.fillStyle = '#1A2436'; g.fillRect(0, 140, 320, 60);        // a faint horizon line so the black isn't a dead canvas
    g.fillStyle = '#25303E'; g.fillRect(0, 140, 320, 2);
    ctx.overlay.innerHTML = `
        <div class="title-card">
          <h1>OBSERVABILITY<br>QUEST</h1>
          <p>Honeycomb presents a night on call</p>
        </div>`;
  }
  /** The picture, then the overlay: the glow under the letters, the subtitle, the small print. */
  function showArt(ctx) {
    const m = art.manifest, g = ctx.ctx2d;
    g.drawImage(art.images.get('plate'), 0, 0);
    const box = (a) => `left:${PCT_X(a.x)};top:${PCT_Y(a.y)};width:${PCT_X(a.w)};height:${PCT_Y(a.h)}`;
    const [l1, l2 = ''] = creditLines(SCRIPT['title.credit'] ?? '');
    const el = document.createElement('div');
    el.className = 'title-art';
    el.innerHTML = `
        <img class="title-layer title-glow" alt="" style="${box(m.layer)}">
        <img class="title-layer title-letters" alt="Observability Quest I" style="${box(m.layer)}">
        <div class="title-glint" hidden></div>
        <div class="title-sub" style="left:${PCT_X(m.letters.x)};width:${PCT_X(m.letters.w)};top:47.25%"></div>
        <div class="title-print" style="left:${PCT_X(m.print.x)}">
          <img class="title-logo" alt="Honeycomb">
          <div class="title-credit"><span></span><span></span></div>
        </div>`;
    el.querySelector('.title-glow').src = art.images.get('glow').src;
    el.querySelector('.title-letters').src = art.images.get('wordmark').src;
    el.querySelector('.title-sub').textContent = SUBTITLE;
    el.querySelector('.title-logo').src = LOGO;
    const [s1, s2] = el.querySelectorAll('.title-credit span'); s1.textContent = l1; s2.textContent = l2;
    ctx.overlay.replaceChildren(el);
    glowEl = el.querySelector('.title-glow'); glowNow = null;
    // the glint: one frame of its strip at a time, a glint pixel the size of a letter pixel (review of brief 16)
    glintEl = null; glintNow = null;
    const strip = art.images.get('glint'), gl = m.glint;
    if (strip && gl?.points?.length) {
      glintEl = el.querySelector('.title-glint');
      glintEl.style.width = PCT_X(gl.size * m.layer.scale); glintEl.style.height = PCT_Y(gl.size * m.layer.scale);
      glintEl.style.backgroundImage = `url("${strip.src}")`;
      glintEl.style.backgroundSize = `${gl.frames * 100}% 100%`;
    }
    starsNow = []; paintStars(ctx, starsOn(0));
  }
  /** Redraws the stars whose state changed: off is the picture's own 3×3 back, on is the manifest's pixels. */
  function paintStars(ctx, next) {
    const g = ctx.ctx2d, plate = art.images.get('plate'), stars = art.manifest.stars;
    for (const i of starsNow) if (!next.includes(i)) { const s = stars[i]; g.drawImage(plate, s.x - 1, s.y - 1, 3, 3, s.x - 1, s.y - 1, 3, 3); }
    for (const i of next) if (!starsNow.includes(i)) {
      const s = stars[i];
      if (s.cross) { g.fillStyle = s.arm; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.fillRect(s.x + dx, s.y + dy, 1, 1); }
      g.fillStyle = s.on; g.fillRect(s.x, s.y, 1, 1);
    }
    starsNow = next;
  }
  /** Shows the glint `g` ({ point, frame }) with its centre pixel on its place in the wordmark's layer, or hides it. */
  function paintGlint(g) {
    glintNow = g;
    if (!glintEl) return;
    if (!g) { glintEl.hidden = true; return; }
    const m = art.manifest, L = m.layer, [x, y] = m.glint.points[g.point], half = m.glint.size / 2;
    glintEl.style.left = PCT_X(L.x + (x - half) * L.scale); glintEl.style.top = PCT_Y(L.y + (y - half) * L.scale);
    glintEl.style.backgroundPosition = `${(g.frame / (m.glint.frames - 1)) * 100}% 0`;
    glintEl.hidden = false;
  }
  function lightPager(ctx) {
    const p = art.manifest.pager;
    ctx.ctx2d.drawImage(art.images.get('pager'), p.x, p.y);
    lit = true;
  }
  /** Start: inside the tap, full screen where the phone allows it; then the page arrives (D), or the creator at once without the art. */
  function start(ctx) {
    if (starting) return;                                        // a second tap during the 600 ms does nothing
    ctx.fullscreen?.();
    if (!art) { game.go('CREATOR'); return; }
    sfx = createSfx({ sound: ctx.sound }); sfx.unlock(); sfx.beep(); beeps = 1;
    lightPager(ctx);
    startBtn.disabled = true;
    starting = { t: 0 };
  }

  return {
    enter(ctx) {
      const mine = ++token;
      ctx.showSolved();
      art = null; failed = false; t = 0; starsNow = []; glowNow = null; glowEl = null; glintEl = null; glintNow = null; starting = null; sfx = null; lit = false; beeps = 0; exposed = false;
      ctx.ctx2d.fillStyle = '#000'; ctx.ctx2d.fillRect(0, 0, 320, 200);      // black until the picture is in
      ctx.overlay.innerHTML = '';
      startBtn = colButton({ id: 'btn-start', long: SCRIPT['title.start'] ?? 'Start', short: 'Go', className: 'go', onClick: () => start(ctx) });
      ctx.colR.appendChild(startBtn);
      preloadTitle().then((a) => { if (mine === token) { art = a; showArt(ctx); } }, () => { if (mine === token) { failed = true; placeholder(ctx); } });
      expose();
    },
    tick(dt, ctx) {
      if (!exposed) expose();                                    // at boot the title enters before window.__oq exists
      if (!art) return;
      t += dt;
      const glow = glowAt(t, !!ctx.reducedMotion);
      if (glow !== glowNow && glowEl) { glowNow = glow; glowEl.style.opacity = String(glow); }
      const next = ctx.reducedMotion ? [] : starsOn(t, Math.min(STAR_COUNT, art.manifest.stars.length));
      if (next.join() !== starsNow.join()) paintStars(ctx, next);
      const glint = glintEl ? glintAt(t, !!ctx.reducedMotion, art.manifest.glint.points.length) : null;
      if (glint?.point !== glintNow?.point || glint?.frame !== glintNow?.frame) paintGlint(glint);
      if (starting) {
        starting.t += dt;
        const b = startBeat(starting.t);
        if (b.beeps > beeps) { sfx?.beep(); beeps = b.beeps; }
        if (b.go) { starting = null; game.go('CREATOR'); }
      }
    },
    exit(ctx) {
      token++;
      ctx.overlay.innerHTML = '';
      startBtn?.remove(); startBtn = null;
      starting = null; glowEl = null; glintEl = null; glintNow = null; art = null;
    },
  };
}
