// The sunrise coda (Warp brief 17): after Charity's verdict, the hero walks out of the building into the dawn, the sun
// comes up behind the horizon, he turns to us and puts his sunglasses on; three narration windows, then the screen to
// show booth staff. Built the way the intro is: a pure timeline (js/coda/timeline.js), pictures loaded once, cuts and
// whole pixels. Every position comes from assets/coda/coda.json: the pictures are stand-ins today and the real ones
// arrive with the same names and other numbers.

import { colButton } from '../engine/ui.js';
import { createWindows } from '../engine/window.js';
import { createSfx } from '../intro/sfx.js';
import { placeHero, blit } from '../engine/hero.js';
import { displayName } from '../creator-state.js';
import { SCRIPT } from '../script.js';
import { codaPlan, beat1At, sunAt, beat3At, BEAT0_MS, CODA_LINES } from '../coda/timeline.js';

export const MANIFEST = 'assets/coda/coda.json';
const LOAD_TIMEOUT_MS = 6000;
const NEXT = 'COMPLETE';

let loading = null;
/** The pictures a coda manifest lists, by the names the screen draws: frame_0 … frame_n, door, sun. */
export function codaImages(m) {
  return { ...Object.fromEntries((m.images?.frames ?? []).map((f, i) => [`frame_${i}`, f])), door: m.images?.door, sun: m.images?.sun };
}
/** Fetches the manifest and every picture, once (as preloadIntro does); rejects, and forgets so a later visit retries, on any failure or after 6 s. */
export function preloadCoda(url = MANIFEST) {
  if (loading) return loading;
  const base = url.slice(0, url.lastIndexOf('/') + 1);
  const work = (async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const manifest = await res.json();
    const list = Object.entries(codaImages(manifest));
    if (!list.length || list.some(([, f]) => !f) || !manifest.sun || !manifest.sky || !manifest.door || !manifest.doorway || !manifest.stand) throw new Error('coda.json: incomplete');
    const images = new Map();
    await Promise.all(list.map(([name, file]) => new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => { images.set(name, img); ok(); };
      img.onerror = () => fail(new Error(`${file} failed`));
      img.src = base + file;
    })));
    return { manifest, images };
  })();
  let timer;
  const timeout = new Promise((_, fail) => { timer = setTimeout(() => fail(new Error('coda load timed out')), LOAD_TIMEOUT_MS); });
  loading = Promise.race([work, timeout]).finally(() => clearTimeout(timer));
  loading.catch(() => { loading = null; });
  return loading;
}

export function createCodaScreen(game) {
  let token = 0, assets = null, plan = null, failed = false, wins = null, skip = null, onDown = null, sfx = null;
  let beat = 0, t = 0, frame = 0, sunY = null, hero = null, doorOpen = false, shades = false, done = false, out = false, waiting = false, fired = new Set();
  const name = (ctx) => displayName(ctx.hero);
  const lines = (ctx) => CODA_LINES.map((k) => String(SCRIPT[k] ?? k).replaceAll('{name}', name(ctx)));

  function sound(what, on = true) { if (!on || fired.has(what)) return; fired.add(what); sfx?.play(what); }

  function paint(ctx) {
    const g = ctx.ctx2d;
    g.fillStyle = '#000'; g.fillRect(0, 0, 320, 200);
    if (!assets) return;
    const m = assets.manifest;
    g.drawImage(assets.images.get(`frame_${frame}`), 0, 0);
    if (sunY !== null) {                                            // the sun, clipped to the sky, so it comes up from behind the horizon
      g.save(); g.beginPath(); g.rect(m.sky.x, m.sky.y, m.sky.w, m.sky.h); g.clip();
      g.drawImage(assets.images.get('sun'), m.sun.x, sunY); g.restore();
    }
    if (doorOpen) g.drawImage(assets.images.get('door'), m.door.x, m.door.y);
    if (hero?.visible) {
      const p = placeHero(ctx.hero, hero.pose, hero.x, hero.y, m.heroScale, { flip: hero.flip, dy: hero.dy, shades });
      if (p) blit(g, p.fig, p.x, p.y, p.scale, p.flip);
    }
  }
  /** One narration window, top left, no portrait; it ends above the manifest's windowBottom. */
  async function narrate(ctx, text) {
    const mine = token;
    waiting = true;
    const scale = ctx.fit?.scale ?? 1, bottom = assets ? assets.manifest.windowBottom : 60;
    await wins.say(text, { where: 'top-left', maxLines: Math.max(2, Math.floor(((bottom - 6) * scale - 22) / 27)) });
    waiting = false;
    return mine === token;
  }
  /** Idempotent; the game's double-tap guard may refuse the first go() (Skip right after the screen opened), so tick retries. */
  function finish() { out = true; if (!done && game.go(NEXT)) done = true; }
  /** The beats in turn; each narration waits for the player's tap. */
  async function play(ctx) {
    const mine = token;
    const alive = () => mine === token;
    if (!assets) {                                                   // no pictures: the words over black, then on
      for (const text of lines(ctx)) { paint(ctx); if (!(await narrate(ctx, text)) || !alive()) return; }
      if (alive()) finish();
      return;
    }
    const m = assets.manifest;
    beat = 0; frame = 0; sunY = m.sun.y0; hero = null; doorOpen = false; t = 0; paint(ctx);
    await waitFor(() => t >= BEAT0_MS, alive, ctx); if (!alive()) return;
    beat = 1; t = 0; advance(ctx); paint(ctx);                       // the beat's state at 0 (reduced motion: its end at once)
    await waitFor(() => beat1At(plan, t, !!ctx.reducedMotion).done, alive, ctx); if (!alive()) return;
    if (!(await narrate(ctx, lines(ctx)[0])) || !alive()) return;
    beat = 2; t = 0; advance(ctx); paint(ctx);
    await waitFor(() => sunAt(m, t, !!ctx.reducedMotion).done, alive, ctx); if (!alive()) return;
    if (!(await narrate(ctx, lines(ctx)[1])) || !alive()) return;
    beat = 3; t = 0; advance(ctx); paint(ctx);
    await waitFor(() => beat3At(t).done, alive, ctx); if (!alive()) return;
    if (!(await narrate(ctx, lines(ctx)[2])) || !alive()) return;
    finish();
  }
  /** Resolves once `until()` holds; tick() moves the clock and repaints meanwhile. */
  function waitFor(until, alive, ctx) {
    return new Promise((ok) => { const check = () => { if (!alive() || until()) ok(); else pending = check; }; pending = check; check(); });
  }
  let pending = null;
  /** The beat's state at the clock: what paint() draws. */
  function advance(ctx) {
    if (!assets) return;
    const m = assets.manifest, reduced = !!ctx.reducedMotion;
    if (beat === 1) {
      const b = beat1At(plan, t, reduced);
      if (b.doorOpen && !doorOpen) sound('door');
      if (!b.doorOpen && doorOpen) sound('shut');
      doorOpen = b.doorOpen; hero = b.hero;
      if (b.hero?.pose === 'stand') sound('step');
    } else if (beat === 2) {
      const s = sunAt(m, t, reduced); sunY = s.y; frame = s.frame;
    } else if (beat === 3) {
      const b = beat3At(t); hero = { ...hero, pose: b.pose, view: b.view, dy: 0 }; shades = b.shades;
    }
  }

  return {
    enter(ctx) {
      const mine = ++token;
      assets = null; plan = null; failed = false; beat = 0; t = 0; frame = 0; sunY = null; hero = null; doorOpen = false; shades = false; done = false; out = false; waiting = false; fired = new Set(); pending = null;
      ctx.showSolved();
      wins = createWindows(ctx);
      sfx = createSfx({ sound: ctx.sound });
      skip = colButton({ id: 'btn-skip', long: 'Skip', short: 'Skip', onClick: finish });
      ctx.colR.appendChild(skip);
      onDown = (e) => { if (wins.open && !e.target.closest?.('button')) wins.tap(); };
      ctx.canvas.parentElement.addEventListener('pointerdown', onDown);
      paint(ctx);
      preloadCoda().then((a) => {
        if (mine !== token) return;
        assets = { manifest: a.manifest, images: a.images }; plan = codaPlan(a.manifest); paint(ctx); play(ctx);
      }, () => { if (mine === token) { failed = true; play(ctx); } });
      if (window.__oq) {
        window.__oq.coda = {
          get loaded() { return assets !== null; }, get failed() { return failed; }, get beat() { return beat; }, get frame() { return frame; }, get sun() { return sunY; },
          get hero() { return hero ? { x: hero.x, y: hero.y, pose: hero.pose, view: hero.view, visible: hero.visible, shades } : null; },
          get doorOpen() { return doorOpen; }, get done() { return done; }, get waiting() { return waiting; }, get manifest() { return assets?.manifest ?? null; },
        };
      }
    },
    tick(dt, ctx) {
      wins?.tick(dt);
      if (out) { if (!done) finish(); return; }
      if (!assets) return;
      if (!waiting) { t += dt; advance(ctx); paint(ctx); }
      if (pending) { const p = pending; pending = null; p(); }
    },
    exit(ctx) {
      token++;
      ctx.canvas.parentElement.removeEventListener('pointerdown', onDown); onDown = null;
      wins?.reset(); wins = null;
      skip?.remove(); skip = null;
      sfx?.close(); sfx = null;
      ctx.overlay.innerHTML = '';
      assets = null; pending = null; done = true; out = true;
    },
  };
}
