// Observability Quest Mobile — game state machine.
// Mirrors the badge game's update() loop (source/badge/__init__.py) with taps instead of buttons.

import { SCENARIOS, VERDICTS, CHARITY, HOW_TO_PLAY } from './scenarios.js';
import { parseIntro, introLead, wrap, paginate, isCTA } from './text.js';
import {
  preload, image, initCanvas, flashBlack, makeMeasure, textMetrics, headerHeight,
  setBoxLines, typewrite, setChoiceMenu, reducedMotion,
} from './screen.js';
import { createLayer } from './anim/layer.js';
import { sceneFor } from './anim/scenes.js';
import { createAudio } from './audio.js';
import { HUBSPOT, mountClaimForm, getEventCode, redeemed, pendingEmail } from './claim.js';

const COMPLETE_KEY = 'oq.complete';
const EVENT_CODE = getEventCode(location.search);

const LOOP_IN_GAME = true; // keep the title loop playing (quietly) during scenarios
const audio = createAudio();

export const S = Object.freeze({
  TITLE: 'TITLE', HOWTO: 'HOWTO', INTRO: 'INTRO', CHOICE: 'CHOICE', WIN: 'WIN', LOSE: 'LOSE',
  FINAL: 'FINAL', CLAIM: 'CLAIM', COMPLETE: 'COMPLETE',
});

const TYPE_MS = 25;
const TOTAL = SCENARIOS.length;

const $ = (sel) => document.querySelector(sel);
const el = {
  body: document.body,
  art: $('#art'), flash: $('#flash'), box: $('#textbox'), status: $('#status'),
  back: $('#btn-back'), next: $('#btn-next'), cont: $('#btn-continue'), claim: $('#btn-claim'),
  start: $('#btn-start'), begin: $('#btn-begin'), mute: $('#btn-mute'),
};

// ---- game state ----
let state = S.TITLE;
let score = 0;
let scenarioIdx = 0;
let pages = [[]];
let pageIdx = 0;
let pageSource = null; // { texts: string[], header }
let tw = null;         // current typewriter handle
let ready = false;
let loaded = false;   // all scene art preloaded
let countTimer = null;
let layer = null;      // canvas animation layer (created at boot)
let advanceGuardUntil = 0; // after a page finishes typing, NEXT stays a no-op briefly so a double-tap can't skip
const ADVANCE_GUARD_MS = 350;

/** Show a scene (still + its animation module, if any). */
function showScene(name, state = {}) {
  if (!image(name)) {
    // a still that failed to preload: fetch it now, then show (if we're still on this scene)
    preload([name], { fonts: false }).then(() => { if (layer.scene?.still === name || currentArt === name) layer.show(sceneFor(name), state); }).catch(console.error);
  }
  currentArt = name;
  layer.show(sceneFor(name), state);
}
let currentArt = null;
function showStill(name) { layer.still(name); }

// ---- helpers ----
function scenario() { return SCENARIOS[scenarioIdx]; }

function buildPages(texts, header) {
  const m = textMetrics(el.box);
  const measure = makeMeasure(m.font);
  const hdrH = header ? headerHeight(el.box) : 0;
  const boxHeight = Math.max(m.lineHeight, m.innerH - hdrH);
  const out = [];
  for (const t of texts) {
    const maxWidth = m.innerW - 4;
    const lines = wrap(t, maxWidth, measure);
    out.push(...paginate(lines, { lineHeight: m.lineHeight, blankHeight: m.blankHeight, boxHeight, measure, maxWidth }));
  }
  return out.length ? out : [[]];
}

function setPages(texts, header = null) {
  pageSource = { texts, header };
  pages = buildPages(texts, header);
  pageIdx = 0;
}

function introTexts(sc) {
  const { header, body } = parseIntro(sc.intro[0]);
  const first = header ? introLead(header.role, header.company) + body : body;
  return [first, ...sc.intro.slice(1)];
}

function isLastPage() { return pageIdx >= pages.length - 1; }
function typing() { return !!(tw && tw.typing); }

function setScreen(s) {
  state = s;
  el.body.dataset.screen = s;
}

function show(btn, visible) { btn.hidden = !visible; }

function paintMute() {
  el.mute.setAttribute('aria-pressed', audio.muted ? 'true' : 'false');
  el.mute.setAttribute('aria-label', audio.muted ? 'Sound is off. Turn sound on' : 'Sound is on. Turn sound off');
  el.mute.innerHTML = audio.muted ? '<span class="ico">&#9834;</span> SOUND OFF' : '<span class="ico">&#9835;</span> SOUND ON';
}

function setStatus(html) { el.status.innerHTML = html; }

function stopCount() { if (countTimer) { clearInterval(countTimer); countTimer = null; } }

// ---- controls ----
function updateControls() {
  const last = isLastPage();
  const typ = typing() || performance.now() < advanceGuardUntil;
  show(el.start, state === S.TITLE);
  show(el.begin, state === S.HOWTO);
  const paged = state === S.INTRO || state === S.WIN || state === S.LOSE || state === S.FINAL;
  show(el.back, paged);
  show(el.next, paged && !(last && !typ && state !== S.INTRO));
  show(el.cont, (state === S.WIN || state === S.LOSE) && last && !typ);
  show(el.claim, state === S.FINAL && last && !typ);
  el.back.disabled = !paged || pageIdx === 0;
  if (state === S.WIN || state === S.LOSE) {
    el.cont.innerHTML = scenarioIdx + 1 >= TOTAL ? 'SEE YOUR RESULT &rsaquo;' : 'NEXT SCENARIO &rsaquo;';
  }
  switch (state) {
    case S.TITLE: setStatus(''); break;
    case S.HOWTO: setStatus('<span class="hint">HOW TO PLAY</span>'); break;
    case S.INTRO: setStatus(`SCENARIO ${scenarioIdx + 1}/${TOTAL}`); break;
    case S.CHOICE: setStatus('CHOOSE YOUR MOVE'); break;
    case S.CLAIM: setStatus('ALMOST DONE'); break;
    case S.COMPLETE: setStatus(''); break;
    case S.WIN: case S.LOSE: setStatus(`SCORE <span class="score">${score}/${TOTAL}</span>`); break;
    case S.FINAL: /* count-up handled in enterFinal */ break;
    default: setStatus('');
  }
}

// ---- page rendering ----
function showPage({ slide = false } = {}) {
  const header = pageSource?.header || null;
  const lines = pages[pageIdx] || [];
  const ctaIndex = lines.findIndex(isCTA);
  const els = setBoxLines(el.box, lines, { header, slide, ctaIndex });
  tw = typewrite(els, { msPerChar: TYPE_MS });
  layer.setState({ typing: tw.typing });
  tw.done.then(() => {
    layer.setState({ typing: false });
    if (pages[pageIdx] !== lines) return;
    advanceGuardUntil = performance.now() + ADVANCE_GUARD_MS;
    updateControls();
    setTimeout(() => { if (pages[pageIdx] === lines) updateControls(); }, ADVANCE_GUARD_MS + 10);
  });
  updateControls();
}

function finishTyping() { if (tw && tw.typing) tw.finishNow(); }

function nextPage() {
  if (typing()) { finishTyping(); return false; }
  if (performance.now() < advanceGuardUntil && isLastPage()) return false; // double-tap guard
  if (!isLastPage()) { pageIdx++; showPage(); audio.blip('advance'); return true; }
  return null; // at end
}

function prevPage() {
  if (pageIdx > 0) { pageIdx--; showPage(); }
}

// ---- state transitions ----
function enterTitle() {
  stopCount();
  audio.setLoopLevel(false);
  score = 0; scenarioIdx = 0; pages = [[]]; pageIdx = 0; pageSource = null; tw = null;
  setScreen(S.TITLE);
  showScene('title_screen');
  el.box.className = '';
  el.box.innerHTML = '<div class="tagline">FIVE CUSTOMER STORIES.<br>FIVE CHOICES.<br>ONE OBSERVABILITY QUEST.<small>A HONEYCOMB ADVENTURE</small></div>';
  updateControls();
}

function enterHowTo() {
  setScreen(S.HOWTO);
  flashBlack(el.flash);
  showScene('title_screen');
  setPages([HOW_TO_PLAY]);
  showPage({ slide: true });
}

function enterIntro() {
  setScreen(S.INTRO);
  flashBlack(el.flash);
  showScene(scenario().image);
  setPages(introTexts(scenario()));
  showPage({ slide: true });
}

function enterChoice() {
  setScreen(S.CHOICE);
  const sc = scenario();
  showScene(sc.image);
  setChoiceMenu(el.box, sc.choiceA, sc.choiceB, (idx) => (idx === 0 ? enterOutcome(true) : enterOutcome(false)), () => audio.blip('select'));
  updateControls();
}

function enterOutcome(win) {
  const sc = scenario();
  if (win) score++;
  audio.blip(win ? 'win' : 'lose');
  setScreen(win ? S.WIN : S.LOSE);
  flashBlack(el.flash);
  showScene(sc.narrator.portrait, { typing: true });
  setPages([win ? sc.winText : sc.loseText], sc.narrator);
  showPage({ slide: true });
}

function continueAfterOutcome() {
  scenarioIdx++;
  if (scenarioIdx >= TOTAL) enterFinal();
  else enterIntro();
}

function enterFinal() {
  setScreen(S.FINAL);
  flashBlack(el.flash);
  showScene(CHARITY.portrait, { typing: true });
  setPages([VERDICTS[score] ?? VERDICTS[0]], CHARITY);
  showPage({ slide: true });
  audio.blip('fanfare');
  // score counts up 0→N in the control bar
  stopCount();
  let n = 0;
  const paint = () => setStatus(`SCORE <span class="score">${n}/${TOTAL}</span>`);
  paint();
  if (reducedMotion()) { n = score; paint(); return; }
  countTimer = setInterval(() => {
    if (n >= score) { stopCount(); return; }
    n++; paint();
  }, 150);
}

function enterClaim() {
  setScreen(S.CLAIM);
  stopCount();
  flashBlack(el.flash);
  el.box.className = '';
  el.box.innerHTML = '';
  el.box.scrollTop = 0;
  updateControls();
  mountClaimForm(el.box, {
    score,
    eventCode: EVENT_CODE,
    onSubmitted: ({ mode }) => { if (mode !== 'fallback') pendingEmail.clear(); enterComplete(score); },
  }).then((mode) => { el.body.dataset.claimMode = mode; });
}

function saveComplete(sc) { try { localStorage.setItem(COMPLETE_KEY, String(sc)); } catch { /* ignore */ } }
function loadComplete() { try { const v = localStorage.getItem(COMPLETE_KEY); return v === null ? null : Number(v); } catch { return null; } }
function clearComplete() { try { localStorage.removeItem(COMPLETE_KEY); } catch { /* ignore */ } }

function enterComplete(sc) {
  score = sc;
  saveComplete(sc);
  setScreen(S.COMPLETE);
  stopCount();
  flashBlack(el.flash);
  showStill(CHARITY.portrait);
  el.box.className = '';
  el.box.innerHTML = `
    <div id="complete" class="complete">
      <div class="c-title">YOU FINISHED<br>OBSERVABILITY QUEST</div>
      <div class="c-score">SCORE <span class="score">${sc}/${TOTAL}</span></div>
      <div class="c-instr">SHOW THIS SCREEN TO<br>HONEYCOMB BOOTH STAFF</div>
      ${pendingEmail.get() ? `<div class="c-pending">EMAIL NOT YET SENT — STAFF PLEASE RECORD:<br><span class="c-email"></span></div>` : ''}
      <div class="c-stamp" aria-hidden="true">REDEEMED</div>
      <div class="c-foot">
        <button id="btn-redeem" class="btn btn-small" type="button">STAFF: MARK REDEEMED</button>
        <button id="btn-play-again" class="btn btn-small btn-link" type="button">PLAY AGAIN</button>
      </div>
    </div>`;
  el.box.scrollTop = 0;
  const panel = el.box.querySelector('#complete');
  const btn = el.box.querySelector('#btn-redeem');
  const pe = el.box.querySelector('.c-email'); if (pe) pe.textContent = pendingEmail.get();
  const paintRedeemed = () => { panel.classList.add('redeemed'); btn.disabled = true; btn.textContent = 'REDEEMED'; };
  if (redeemed.get()) paintRedeemed();
  let armed = null;
  btn.addEventListener('click', () => {
    if (redeemed.get()) return;
    if (!armed) {
      btn.textContent = 'TAP AGAIN TO CONFIRM REDEEM';
      btn.classList.add('armed');
      armed = setTimeout(() => { armed = null; btn.textContent = 'STAFF: MARK REDEEMED'; btn.classList.remove('armed'); }, 4000);
      return;
    }
    clearTimeout(armed); armed = null;
    redeemed.set();
    paintRedeemed();
    navigator.vibrate?.(30);
  });
  el.box.querySelector('#btn-play-again').addEventListener('click', () => { clearComplete(); pendingEmail.clear(); enterTitle(); });
  updateControls();
}

// ---- events ----
el.start.addEventListener('click', async () => {
  if (!(ready && loaded && state === S.TITLE)) return;
  audio.unlock().catch(() => {});   // creates the context synchronously inside the tap; resume may stay pending on iOS
  audio.playLoop();
  audio.blip('select');
  enterHowTo();
});
el.mute.addEventListener('click', () => { audio.toggleMute(); paintMute(); });
document.addEventListener('visibilitychange', () => { audio.setHidden(document.hidden); });
el.begin.addEventListener('click', () => {
  if (state !== S.HOWTO) return;
  if (LOOP_IN_GAME) audio.setLoopLevel(true); else audio.stopLoop();
  audio.blip('advance');
  scenarioIdx = 0; score = 0; enterIntro();
});
el.back.addEventListener('click', () => { if (!el.back.disabled) { finishTyping(); prevPage(); } });
el.next.addEventListener('click', () => {
  const r = nextPage();
  if (r === null && state === S.INTRO) enterChoice();
  else if (r === null && state === S.HOWTO) { scenarioIdx = 0; score = 0; enterIntro(); }
});
el.cont.addEventListener('click', () => { if (state === S.WIN || state === S.LOSE) continueAfterOutcome(); });
el.claim.addEventListener('click', () => { if (state === S.FINAL) enterClaim(); });
el.box.addEventListener('click', (e) => {
  if (e.target.closest('button')) return;
  if (state === S.INTRO || state === S.WIN || state === S.LOSE || state === S.FINAL || state === S.HOWTO) {
    if (typing()) finishTyping();
    else if (!isLastPage()) { pageIdx++; showPage(); }
  }
});

let resizeT = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    const paged = state === S.INTRO || state === S.WIN || state === S.LOSE || state === S.FINAL || state === S.HOWTO;
    if (!paged || !pageSource) return;
    const keep = Math.min(pageIdx, 9999);
    pages = buildPages(pageSource.texts, pageSource.header);
    pageIdx = Math.min(keep, pages.length - 1);
    showPage();
    finishTyping();
  }, 120);
});

// ---- debug / test handle ----
window.__oq = {
  get ready() { return ready; },
  get loaded() { return loaded; },
  get state() { return state; },
  get page() { return pageIdx; },
  get pages() { return pages; },
  get score() { return score; },
  get scenario() { return scenarioIdx; },
  get typing() { return typing(); },
  finishTyping,
  audio,
  hubspot: HUBSPOT,
  get layer() { return layer; },
  go(s) {
    switch (s) {
      case S.TITLE: enterTitle(); break;
      case S.HOWTO: enterHowTo(); break;
      case S.INTRO: enterIntro(); break;
      case S.CHOICE: enterChoice(); break;
      case S.FINAL: enterFinal(); break;
      default: throw new Error(`go: unsupported state ${s}`);
    }
  },
};

// ---- boot ----
(async function boot() {
  initCanvas(el.art);
  layer = createLayer(el.art, image);
  el.body.dataset.screen = 'LOADING';
  el.start.hidden = false;
  const titleAssets = ['title_screen', 'hc_logo_white', 'hc_logomark'];
  const rest = [...new Set([...SCENARIOS.map((s) => s.image), ...SCENARIOS.map((s) => s.narrator.portrait), CHARITY.portrait])];
  // Phase 1: title screen interactive as soon as its own art and the fonts are in.
  try { await preload(titleAssets); } catch (e) { console.error(e); }
  ready = true;
  el.mute.hidden = false;
  paintMute();
  const done = loadComplete();
  if (done !== null && Number.isFinite(done)) enterComplete(done);
  else enterTitle();
  // Phase 2: everything else behind the START button, with a percentage readout.
  el.start.disabled = true;
  el.start.textContent = 'LOADING 0%';
  el.start.classList.remove('blink');
  try {
    await preload(rest, { fonts: false, onProgress: (d, t) => { el.start.textContent = `LOADING ${Math.round((d / t) * 100)}%`; } });
  } catch (e) {
    console.error(e);
  }
  el.start.disabled = false;
  el.start.textContent = 'START';
  el.start.classList.add('blink');
  loaded = true;
})();
