// SCI message windows over the scene (DOM): white, black border, hard shadow, VT323, typewriter at
// 25 ms a character, tap to complete, tap again to turn the page or close. The wrapping, paging and
// typing are js/engine/message.js; this module measures, draws and routes taps. Time comes from tick(),
// so a paused game (the rotate gate) freezes the typing too.

import { paginate, createMessage, stepMessage, tapMessage, visibleLines, linesFor } from './message.js';

const FONT_PX = 24;

let measurer = null;
function measureFn() {
  if (!measurer) { const c = document.createElement('canvas').getContext('2d'); c.font = `${FONT_PX}px VT323, monospace`; measurer = c; }
  return (s) => measurer.measureText(s).width;
}

/**
 * @param {object} ctx the game ctx (overlay, fit, reducedMotion)
 * @param {{ onShow?: (text: string) => void }} hooks onShow is called once per window (the stopwatch counts them)
 */
export function createWindows(ctx, { onShow } = {}) {
  let el = null, msg = null, resolve = null, layer = null;

  function close() {
    el?.remove(); el = null; msg = null;
    const r = resolve; resolve = null; r?.();
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
    /** Opens a window (closing any open one) and resolves when the player dismisses it. */
    say(text, { where = 'center', className = '' } = {}) {
      if (el) close();
      onShow?.(text);
      el = document.createElement('div');
      el.className = `msg ${where} ${className}`.trim();
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-live', 'polite');
      el.innerHTML = '<div class="msg-body"></div>';
      (layer || ctx.overlay).appendChild(el);
      const cs = getComputedStyle(el);
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const maxLines = linesFor(ctx.fit?.sceneH ?? 370);
      msg = createMessage(paginate(text, measureFn(), width - 2, maxLines), { instant: ctx.reducedMotion });
      el.dataset.text = text;
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
    },
    /** Drops any open window without resolving it (the screen is going away). */
    reset() { el?.remove(); el = null; msg = null; resolve = null; layer = null; },
  };
}
