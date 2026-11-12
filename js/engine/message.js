// Message windows, the pure part: word wrap, pagination and typewriter progress. The DOM lives in
// js/engine/window.js; this module never touches it, so it is tested without a browser.

export const MS_PER_CHAR = 25;

/** Greedy word wrap. `measure(str)` gives its width in the same unit as `width`. A word wider than a line is broken. */
export function wrapLines(text, measure, width) {
  const lines = [];
  let line = '';
  for (let word of String(text).split(/\s+/).filter(Boolean)) {
    const tryLine = line ? `${line} ${word}` : word;
    if (measure(tryLine) <= width) { line = tryLine; continue; }
    if (line) { lines.push(line); line = ''; }
    while (measure(word) > width && word.length > 1) {      // longer than a whole line: break it
      let n = word.length - 1;
      while (n > 1 && measure(word.slice(0, n)) > width) n--;
      lines.push(word.slice(0, n)); word = word.slice(n);
    }
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

/** Pages of at most `maxLines` lines each (arrays of line strings). */
export function paginate(text, measure, width, maxLines) {
  const lines = wrapLines(text, measure, width), pages = [];
  for (let i = 0; i < lines.length; i += maxLines) pages.push(lines.slice(i, i + maxLines));
  return pages.length ? pages : [['']];
}

/** How many characters of `text` the typewriter has put down after `elapsedMs`. */
export function typedChars(text, elapsedMs, msPerChar = MS_PER_CHAR) {
  return Math.max(0, Math.min(text.length, Math.floor(elapsedMs / msPerChar)));
}

/** Lines one window holds for a scene this tall (CSS px): three on a 375-px phone (spec: Interface), up to five. */
export function linesFor(sceneH) {
  if (sceneH < 360) return 3;
  if (sceneH < 400) return 4;
  return 5;
}

const pageText = (m) => m.pages[m.page].join(' ');

/** A window's state: which page, how much of it is typed. `instant` (reduced motion) types each page at once. */
export function createMessage(pages, { instant = false } = {}) {
  const m = { pages, page: 0, elapsed: 0, shown: 0, instant, closed: false };
  if (instant) m.shown = pageText(m).length;
  return m;
}

export function stepMessage(m, dt) {
  if (m.closed || m.instant) return m;
  m.elapsed += dt;
  m.shown = typedChars(pageText(m), m.elapsed);
  return m;
}

/** A tap: completes the page if it is still typing ('typed'), else turns it ('page'), else closes ('closed'). */
export function tapMessage(m) {
  const len = pageText(m).length;
  if (m.shown < len) { m.shown = len; m.elapsed = len * MS_PER_CHAR; return 'typed'; }
  if (m.page < m.pages.length - 1) {
    m.page++; m.elapsed = 0;
    m.shown = m.instant ? pageText(m).length : 0;
    return 'page';
  }
  m.closed = true;
  return 'closed';
}

/** The visible lines of the current page, cut at the typewriter's position. */
export function visibleLines(m) {
  let left = m.shown;
  return m.pages[m.page].map((line, i) => {
    const take = Math.max(0, Math.min(line.length, left));
    left -= line.length + (i < m.pages[m.page].length - 1 ? 1 : 0);   // the space the wrap removed
    return line.slice(0, take);
  });
}
