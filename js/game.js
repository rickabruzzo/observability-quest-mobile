// Observability Quest v2 — shell: stage fitting, rotate gate, screen state machine, frame loop.

import { fitStage, applyStage, isPortrait } from './engine/stage.js';
import { createTitleScreen } from './screens/title.js';
import { createCreatorScreen } from './screens/creator.js';
import { sanitizeHero } from './creator-state.js';

export const ADVANCE_GUARD_MS = 350;
const HERO_KEY = 'oq.hero';

const canvas = document.getElementById('scene');
const ctx2d = canvas.getContext('2d');
ctx2d.imageSmoothingEnabled = false;

const ctx = {
  canvas, ctx2d,
  overlay: document.getElementById('overlay'),
  colL: document.getElementById('col-l'),
  colR: document.getElementById('col-r'),
  hero: null,
  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  fit: null,
  setScore(n) { document.getElementById('sb-score').textContent = `Score: ${n} of 300`; },
  saveHero(hero) { try { sessionStorage.setItem(HERO_KEY, JSON.stringify(hero)); } catch { /* storage unavailable: keep going */ } },
  loadHero() { let raw = null; try { raw = sessionStorage.getItem(HERO_KEY); } catch { raw = null; } return sanitizeHero(raw); },
};

const game = { go, screens: {}, ctx };
game.screens.TITLE = createTitleScreen(game);
game.screens.CREATOR = createCreatorScreen(game);
// PREVIEW is filled by its own module (plan task 10); the placeholder keeps the flow testable.
game.screens.PREVIEW = { enter() {}, exit() {} };

let current = null, currentName = 'LOADING', lastGo = -Infinity, transitions = 0;
let paused = false, lastT = 0;

function go(name) {
  const now = performance.now();
  if (name === currentName) return false;
  if (now - lastGo < ADVANCE_GUARD_MS && currentName !== 'LOADING') return false;
  const next = game.screens[name];
  if (!next) throw new Error(`unknown screen ${name}`);
  const initial = currentName === 'LOADING';
  current?.exit?.(ctx);
  current = next; currentName = name;
  if (!initial) { lastGo = now; transitions++; }   // the boot transition neither arms the guard nor counts
  document.body.dataset.screen = name;
  current.enter(ctx);
  return true;
}

function resize() {
  const vw = window.innerWidth, vh = window.innerHeight;
  ctx.fit = fitStage(vw, vh);
  applyStage(document.documentElement, ctx.fit);
  paused = isPortrait(vw, vh) && vw <= 700;
}

function frame(t) {
  const dt = lastT ? Math.min(100, t - lastT) : 0;
  lastT = t;
  if (!paused) current?.tick?.(dt, ctx);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
resize();
ctx.hero = ctx.loadHero();
go('TITLE');
requestAnimationFrame(frame);

window.__oq = {
  get ready() { return true; },
  get state() { return currentName; },
  get hero() { return ctx.hero; },
  get fit() { return ctx.fit; },
  get paused() { return paused; },
  get transitions() { return transitions; },
  go,
  ctx,
  game,
};

export { game, ctx };
