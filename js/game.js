// Observability Quest Mobile — game state machine.
// Mirrors the badge game's update() loop (source/badge/__init__.py) with taps instead of buttons.

import { SCENARIOS, VERDICTS, CHARITY, HOW_TO_PLAY } from './scenarios.js';
import { parseIntro, introLead, wrap, paginate, isCTA } from './text.js';
import {
  preload, initCanvas, drawStill, drawTitle, flashBlack, makeMeasure, textMetrics, headerHeight,
  setBoxLines, typewrite, setChoiceMenu, reducedMotion,
} from './screen.js';

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
let countTimer = null;

// ---- helpers ----
function scenario() { return SCENARIOS[scenarioIdx]; }

function buildPages(texts, header) {
  const m = textMetrics(el.box);
  const measure = makeMeasure(m.font);
  const hdrH = header ? headerHeight(el.box) : 0;
  const boxHeight = Math.max(m.lineHeight, m.innerH - hdrH);
  const out = [];
  for (const t of texts) {
    const lines = wrap(t, m.innerW - 4, measure);
    out.push(...paginate(lines, { lineHeight: m.lineHeight, blankHeight: m.blankHeight, boxHeight }));
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

function setStatus(html) { el.status.innerHTML = html; }

function stopCount() { if (countTimer) { clearInterval(countTimer); countTimer = null; } }

// ---- controls ----
function updateControls() {
  const last = isLastPage();
  const typ = typing();
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
  tw.done.then(() => { if (pages[pageIdx] === lines) updateControls(); });
  updateControls();
}

function finishTyping() { if (tw && tw.typing) tw.finishNow(); }

function nextPage() {
  if (typing()) { finishTyping(); return false; }
  if (!isLastPage()) { pageIdx++; showPage(); return true; }
  return null; // at end
}

function prevPage() {
  if (pageIdx > 0) { pageIdx--; showPage(); }
}

// ---- state transitions ----
function enterTitle() {
  stopCount();
  score = 0; scenarioIdx = 0; pages = [[]]; pageIdx = 0; pageSource = null; tw = null;
  setScreen(S.TITLE);
  drawTitle();
  el.box.className = '';
  el.box.innerHTML = '<div class="tagline">FIVE CUSTOMER STORIES.<br>FIVE CHOICES.<br>ONE OBSERVABILITY QUEST.<small>A HONEYCOMB ADVENTURE</small></div>';
  updateControls();
}

function enterHowTo() {
  setScreen(S.HOWTO);
  flashBlack(el.flash);
  drawTitle();
  setPages([HOW_TO_PLAY]);
  showPage({ slide: true });
}

function enterIntro() {
  setScreen(S.INTRO);
  flashBlack(el.flash);
  drawStill(scenario().image);
  setPages(introTexts(scenario()));
  showPage({ slide: true });
}

function enterChoice() {
  setScreen(S.CHOICE);
  const sc = scenario();
  drawStill(sc.image);
  setChoiceMenu(el.box, sc.choiceA, sc.choiceB, (idx) => (idx === 0 ? enterOutcome(true) : enterOutcome(false)));
  updateControls();
}

function enterOutcome(win) {
  const sc = scenario();
  if (win) score++;
  setScreen(win ? S.WIN : S.LOSE);
  flashBlack(el.flash);
  drawStill(sc.narrator.portrait);
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
  drawStill(CHARITY.portrait);
  setPages([VERDICTS[score] ?? VERDICTS[0]], CHARITY);
  showPage({ slide: true });
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
  // Task 6 replaces this stub with the prize-claim form.
  setScreen(S.CLAIM);
  stopCount();
  flashBlack(el.flash);
  el.box.className = '';
  el.box.innerHTML = '<div class="line">PRIZE CLAIM — coming soon.</div>';
  updateControls();
}

// ---- events ----
el.start.addEventListener('click', () => { if (ready && state === S.TITLE) enterHowTo(); });
el.begin.addEventListener('click', () => { if (state === S.HOWTO) { scenarioIdx = 0; score = 0; enterIntro(); } });
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
    if (!pageSource) return;
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
  get state() { return state; },
  get page() { return pageIdx; },
  get pages() { return pages; },
  get score() { return score; },
  get scenario() { return scenarioIdx; },
  get typing() { return typing(); },
  finishTyping,
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
  el.body.dataset.screen = 'LOADING';
  el.start.hidden = false;
  const names = [
    'title_screen', 'hc_logo_white', 'hc_logomark',
    ...SCENARIOS.map((s) => s.image), ...SCENARIOS.map((s) => s.narrator.portrait), CHARITY.portrait,
  ];
  try {
    await preload([...new Set(names)]);
  } catch (e) {
    console.error(e);
  }
  ready = true;
  enterTitle();
  el.start.disabled = false;
  el.start.textContent = 'START';
})();
