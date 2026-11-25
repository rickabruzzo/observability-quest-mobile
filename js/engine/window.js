// SCI message windows over the scene (DOM): white, black border, hard shadow, VT323, typewriter at
// 25 ms a character, tap to complete, tap again to turn the page or close. The wrapping, paging and
// typing are js/engine/message.js; this module measures, draws and routes taps. Time comes from tick(),
// so a paused game (the rotate gate) freezes the typing too.
//
// A conversation window (Warp brief 10) is the same window grown a portrait on its left — the persona's
// close-up, as tall as its name and lines (four, or fewer to clear the hero's head: brief 18), moving as the narrators do while the words type — with their name above the
// words. Which lines get one, and whose portrait, is the chapter's business (js/engine/conversation.js).

import { paginate, createMessage, stepMessage, tapMessage, visibleLines, linesFor, hugWidth, MAX_LINE_PX } from './message.js';
import { PORTRAIT_CROP, portraitFrame, talkLines, TALK_MAX } from './conversation.js';
import { sprite } from '../anim/sprites.js';

const FONT_PX = 24;
const NAME_MIN_PX = 16;                     // the floor for read text

let measurer = null;
function measureFn(px = FONT_PX) {
  if (!measurer) measurer = document.createElement('canvas').getContext('2d');
  measurer.font = `${px}px VT323, monospace`;
  return (s) => measurer.measureText(s).width;
}

const lineHeight = (node) => parseFloat(getComputedStyle(node).lineHeight);
/** The name's height with its margin under it, as it is set now. */
function nameHeight(el) {
  const n = el.querySelector('.msg-name');
  return n.getBoundingClientRect().height + (parseFloat(getComputedStyle(n).marginBottom) || 0);
}
/** A conversation window's measurements for talkLines, in CSS px from the overlay's (the scene's) top left: its outline's
 * edges, the height that is neither name nor lines (outline, border, padding), the name with its margin, one line. */
function talkMeasure(el) {
  const cs = getComputedStyle(el), o = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 }, r = el.getBoundingClientRect();
  const ow = cs.outlineStyle === 'none' ? 0 : parseFloat(cs.outlineWidth) || 0;
  const chrome = 2 * ow + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  return { top: r.top - o.top - ow, left: r.left - o.left - ow, right: r.right - o.left + ow, chrome, name: nameHeight(el), line: lineHeight(el.querySelector('.msg-body')) };
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
     * `maxWidth` (CSS px) keeps it off something in the scene. `clear` ({ hero, scale }: his drawn box in scene px and
     * CSS px per scene px) makes a conversation window take only the lines that end above his head (brief 18).
     */
    say(text, { where = 'center', className = '', portrait = null, maxWidth = null, name = null, maxLines = null, clear = null } = {}) {
      if (el) close();
      serial++;
      onShow?.(text);
      el = document.createElement('div');
      el.className = `msg ${where} ${className}${portrait ? ' talk' : ''}${name ? ' named' : ''}`.trim();
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
      el.innerHTML = portrait
        ? `<div class="msg-portrait"><canvas width="${PORTRAIT_CROP.w}" height="${PORTRAIT_CROP.h}" aria-hidden="true"></canvas></div><div class="msg-text"><div class="msg-name"></div><div class="msg-body"></div></div>`
        : name ? '<div class="msg-text"><div class="msg-name"></div><div class="msg-body"></div></div>' : '<div class="msg-body"></div>';
      (layer || ctx.overlay).appendChild(el);
      const cs = getComputedStyle(el);
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const chrome = el.offsetWidth - el.clientWidth;                          // the border
      let avail = el.clientWidth;
      if (maxWidth) avail = Math.min(avail, maxWidth - chrome);
      let nameW = 0;
      const shownName = portrait ? portrait.name : name;                      // a persona's, or a narrator's over a verdict (brief 12)
      if (shownName) {
        el.querySelector('.msg-name').textContent = shownName;
        const ns = getComputedStyle(el.querySelector('.msg-name'));       // the name's width as it is set: its letters and their spacing
        nameW = Math.ceil(measureFn(parseFloat(ns.fontSize))(shownName) + (parseFloat(ns.letterSpacing) || 0) * shownName.length);
      }
      let pages = null;
      /** A name wider than the words column is set smaller, down to NAME_MIN_PX, so it stays on one line: a wrapped name
       * makes the window a line taller, over the hero's head (room 3's THE FRONTEND DEVELOPER, brief 18 review). */
      const nameEl = el.querySelector('.msg-name'), namePx = shownName ? parseFloat(getComputedStyle(nameEl).fontSize) : 0;
      const nameAt = (px) => Math.ceil(measureFn(px)(shownName) + (parseFloat(getComputedStyle(nameEl).letterSpacing) || 0) * shownName.length);
      const fitName = (width) => {
        let px = namePx;
        while (px > NAME_MIN_PX && nameAt(px) > width) px--;
        nameEl.style.fontSize = px === namePx ? '' : `${px}px`;
        nameW = nameAt(px);
      };
      /** Pages the words by `lines` and sizes the window to them: a conversation window's portrait is as tall as its name
       * and its lines (brief 18), and the words column is what the portrait leaves, up to the reading measure. */
      const fitTo = (lines) => {
        let side = 0;
        if (portrait) {
          const body = el.querySelector('.msg-body'), lh = lineHeight(body);
          body.style.minHeight = `${lines * lh}px`;
          const box = el.querySelector('.msg-portrait'), bw = box.offsetWidth - box.clientWidth;
          // as tall as the name and the lines, but never taller than today's four lines: it only shrinks, to clear his head
          const inner = Math.max(1, Math.floor(Math.min(nameHeight(el) + lines * lh, TALK_MAX * lh) - bw));   // whole CSS px
          box.style.width = box.style.height = `${inner}px`;
          side = box.offsetWidth + (parseFloat(cs.columnGap) || 0);
        }
        const width = Math.min(MAX_LINE_PX, avail - pad - 2 - side);         // never wider than the reading measure
        if (shownName) fitName(width);
        pages = paginate(text, measureFn(), width, lines);
        const column = Math.min(Math.max(hugWidth(pages, measureFn()), nameW), width);
        el.style.width = `${column + 2 + pad + chrome + side}px`;            // and no wider than its longest line
      };
      let lines = maxLines ?? (portrait ? TALK_MAX : linesFor(ctx.fit?.sceneH ?? 370));
      fitTo(lines);
      // over the hero, it takes only the lines that end above his head; the name may rewrap as the portrait changes size,
      // so settle the two (each pass is a handful of measurements)
      if (portrait && clear && maxLines == null) {
        for (let i = 0, nameH = -1; i < 4; i++) {
          const m = talkMeasure(el), n = talkLines(clear.hero, clear.scale, m);
          if (n === lines && m.name === nameH) break;
          lines = n; nameH = m.name; fitTo(lines);
        }
      }
      el.dataset.lines = String(lines);
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
