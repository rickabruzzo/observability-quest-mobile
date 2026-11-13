// Observability Quest v2 — shell: stage fitting, rotate gate, screen state machine, frame loop.

import { fitStage, applyStage, isPortrait } from './engine/stage.js';
import { createTitleScreen } from './screens/title.js';
import { createCreatorScreen } from './screens/creator.js';
import { createPreviewScreen } from './screens/preview.js';
import { createIntroScreen } from './screens/intro.js';
import { createMenuScreen } from './screens/menu.js';
import { createChapterScreen } from './screens/chapter.js';
import { sanitizeHero } from './creator-state.js';
import { parseDone, serializeDone, afterIntro, solvedCount, DONE_KEY } from './menu.js';
import { SCRIPT } from './script.js';

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
  chapterId: 1,          // the scenario the CHAPTER screen plays; the menu sets it
  claimed: false,        // the prize: nothing claims it yet (the claim flow is a later brief)
  runlog: null,          // the current scenario's stopwatch (js/engine/runlog.js)
  holds: { rotate: false, hidden: false },   // why the clock is stopped, if it is
  /** The status bar's right side: how many scenarios are solved (no score: spec, No score). */
  setSolved(n) { document.getElementById('sb-done').textContent = SCRIPT['status.done'].replace('{n}', String(n)); },
  showSolved() { ctx.setSolved(solvedCount(ctx.loadDone())); },
  loadDone() { let raw = null; try { raw = sessionStorage.getItem(DONE_KEY); } catch { raw = null; } return parseDone(raw); },
  saveDone(done) { try { sessionStorage.setItem(DONE_KEY, serializeDone(done)); } catch { /* storage unavailable: keep going */ } },
  saveHero(hero) { try { sessionStorage.setItem(HERO_KEY, JSON.stringify(hero)); } catch { /* storage unavailable: keep going */ } },
  loadHero() { let raw = null; try { raw = sessionStorage.getItem(HERO_KEY); } catch { raw = null; } return sanitizeHero(raw); },
};

const game = { go, screens: {}, ctx };
game.screens.TITLE = createTitleScreen(game);
game.screens.CREATOR = createCreatorScreen(game);
game.screens.INTRO = createIntroScreen(game);
game.screens.PREVIEW = createPreviewScreen(game);
game.screens.MENU = createMenuScreen(game);
game.screens.CHAPTER = createChapterScreen(game);

let current = null, currentName = 'LOADING', lastGo = -Infinity, transitions = 0;
let paused = false, lastT = 0;

function go(name) {
  const now = performance.now();
  if (name === 'AFTER_INTRO') {           // the intro's way out: ?ch=N straight into a scenario, ?preview=1 the test room, else the menu
    const route = afterIntro(location.search);
    if (route.ch) ctx.chapterId = route.ch;
    name = route.screen;
  }
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
  document.body.dataset.cols = ctx.fit.colW < 96 ? 'narrow' : 'wide';
  paused = isPortrait(vw, vh) && vw <= 700;
  hold('rotate', paused);
}

/** Stops (or restarts) the scenario clock for one reason; the rotate gate and a hidden tab are the reasons. */
function hold(reason, on) {
  ctx.holds[reason] = on;
  ctx.runlog?.hold(reason, on);
}

function frame(t) {
  const dt = lastT ? Math.min(100, t - lastT) : 0;
  lastT = t;
  if (!paused) current?.tick?.(dt, ctx);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', resize);
document.addEventListener('visibilitychange', () => hold('hidden', document.visibilityState === 'hidden'));
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
  get run() { return ctx.runlog?.snapshot() ?? null; },
  go,
  ctx,
  game,
};

export { game, ctx };
