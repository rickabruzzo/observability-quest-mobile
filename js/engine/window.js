// SCI message windows over the scene (DOM): white, black border, hard shadow, VT323, typewriter at
// 25 ms a character, tap to complete, tap again to turn the page or close. The wrapping, paging and
// typing are js/engine/message.js; this module measures, draws and routes taps. Time comes from tick(),
// so a paused game (the rotate gate) freezes the typing too.
//
// A conversation window (Warp brief 10) is the same window grown a portrait on its left — the persona's
// close-up, four lines tall, moving as the narrators do while the words type — with their name above the
// words. Which lines get one, and whose portrait, is the chapter's business (js/engine/conversation.js).

import { paginate, createMessage, stepMessage, tapMessage, visibleLines, linesFor, hugWidth, MAX_LINE_PX } from './message.js';
import { PORTRAIT_CROP, portraitFrame } from './conversation.js';
import { sprite } from '../anim/sprites.js';

const FONT_PX = 24;
const TALK_LINES = 4;                        // a conversation window pages by the portrait's height

let measurer = null;
function measureFn(px = FONT_PX) {
  if (!measurer) measurer = document.createElement('canvas').getContext('2d');
  measurer.font = `${px}px VT323, monospace`;
  return (s) => measurer.measureText(s).width;
}

/** Paints the portrait's square: the still, then the mouth patch and the blink patch for this frame. */
function paintPortrait(canvas, portrait, { mouth, blink }) {
  const g = canvas.getContext('2d'), c = PORTRAIT_CROP;
  g.clearRect(0, 0, canvas.width, canvas.height);
  if (portrait.still) g.drawImage(portrait.still, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
  const patch = (name) => { const s = sprite(name); if (s) g.drawImage(s.img, s.x - c.x, s.y - c.y, s.w, s.h); };
  if (mouth > 0) patch(portrait.frames[mouth === 1 ? 'talk1' : 'talk2']);
  if (blink) patch(portrait.frames.blink);
}

/**
 * @param {object} ctx the game ctx (overlay, fit, reducedMotion)
 * @param {{ onShow?: (text: string) => void }} hooks onShow is called once per window (the stopwatch counts them)
 */
export function createWindows(ctx, { onShow } = {}) {
  let el = null, msg = null, resolve = null, layer = null, serial = 0;
  let face = null;                           // the open conversation window's portrait: { canvas, portrait, elapsed, key }

  function close() {
    el?.remove(); el = null; msg = null; face = null;
    const r = resolve; resolve = null; r?.();
  }

  /** The portrait's frame for now: repainted only when it changes. */
  function animateFace() {
    if (!face) return;
    const typing = !msg.instant && msg.shown < msg.pages[msg.page].join(' ').length;
    const f = portraitFrame(face.elapsed, typing, !!ctx.reducedMotion, face.portrait.seed);
    const key = `${f.mouth}:${f.blink}`;
    if (key !== face.key) { face.key = key; paintPortrait(face.canvas, face.portrait, f); }
  }

  function render() {
    const lines = visibleLines(msg);
    el.querySelectorAll('.msg-line').forEach((d, i) => { d.textContent = lines[i] ?? ''; });
    el.classList.toggle('more', msg.page < msg.pages.length - 1 && msg.shown >= msg.pages[msg.page].join(' ').length);
  }

  function layout() {
    const lines = msg.pages[msg.page];
    el.querySelector('.msg-body').innerHTML = lines.map(() => '<div class="msg-line"></div>').join('');
    render();
  }

  return {
    get open() { return el !== null; },
    get pages() { return msg ? msg.pages.length : 0; },
    get page() { return msg ? msg.page : -1; },
    get element() { return el; },
    /** Counts windows opened: tells two windows with the same words apart. */
    get serial() { return serial; },
    /**
     * Opens a window (closing any open one) and resolves when the player dismisses it.
     * `portrait` ({ name, still, frames: { talk1, talk2, blink }, seed }) makes it a conversation window;
     * `maxWidth` (CSS px) keeps it off something in the scene.
     */
    say(text, { where = 'center', className = '', portrait = null, maxWidth = null } = {}) {
      if (el) close();
      serial++;
      onShow?.(text);
      el = document.createElement('div');
      el.className = `msg ${where} ${className}${portrait ? ' talk' : ''}`.trim();
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
      el.innerHTML = portrait
        ? `<div class="msg-portrait"><canvas width="${PORTRAIT_CROP.w}" height="${PORTRAIT_CROP.h}" aria-hidden="true"></canvas></div><div class="msg-text"><div class="msg-name"></div><div class="msg-body"></div></div>`
        : '<div class="msg-body"></div>';
      (layer || ctx.overlay).appendChild(el);
      const cs = getComputedStyle(el);
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const chrome = el.offsetWidth - el.clientWidth;                          // the border
      let avail = el.clientWidth;
      if (maxWidth) avail = Math.min(avail, maxWidth - chrome);
      let side = 0, nameW = 0;
      if (portrait) {
        el.querySelector('.msg-name').textContent = portrait.name;
        side = el.querySelector('.msg-portrait').offsetWidth + (parseFloat(cs.columnGap) || 0);
        nameW = Math.ceil(measureFn(parseFloat(getComputedStyle(el.querySelector('.msg-name')).fontSize))(portrait.name));
      }
      const width = Math.min(MAX_LINE_PX, avail - pad - 2 - side);           // never wider than the reading measure
      const maxLines = portrait ? TALK_LINES : linesFor(ctx.fit?.sceneH ?? 370);
      const pages = paginate(text, measureFn(), width, maxLines);
      const column = Math.min(Math.max(hugWidth(pages, measureFn()), nameW), width);
      el.style.width = `${column + 2 + pad + chrome + side}px`;              // and no wider than its longest line
      msg = createMessage(pages, { instant: ctx.reducedMotion });
      el.dataset.text = text;
      if (portrait) { face = { canvas: el.querySelector('canvas'), portrait, elapsed: 0, key: null }; animateFace(); }
      layout();
      return new Promise((r) => { resolve = r; });
    },
    /** Where windows are added (a tool screen puts them inside itself); null for the overlay. */
    setLayer(node) { layer = node; },
    tap() {
      if (!msg) return false;
      const what = tapMessage(msg);
      if (what === 'closed') close();
      else if (what === 'page') layout();
      else render();
      return true;
    },
    tick(dt) {
      if (!msg || msg.closed) return;
      const before = msg.shown;
      stepMessage(msg, dt);
      if (msg.shown !== before) render();
      if (face) { face.elapsed += dt; animateFace(); }
    },
    /** Drops any open window without resolving it (the screen is going away). */
    reset() { el?.remove(); el = null; msg = null; face = null; resolve = null; layer = null; },
  };
}
