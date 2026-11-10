// Text engine — wrap, paginate, intro header. Pure functions, no DOM.
// Ported from the badge game's start_text() (source/badge/__init__.py).

const LOWER_WORDS = new Set(['of', 'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'nor', 'by']);
const SENTENCE_END = ['.', '!', '?', '"', "'"];

/** "ROLE\nCOMPANY\n\nbody" → { header: {role, company} | null, body } */
export function parseIntro(text) {
  const lines = text.split('\n');
  if (lines.length >= 3 && lines[0] && lines[1] && lines[2] === '') {
    return { header: { role: lines[0], company: lines[1] }, body: lines.slice(3).join('\n').trim() };
  }
  return { header: null, body: text };
}

function smartCase(word) {
  const lw = word.toLowerCase();
  if (LOWER_WORDS.has(lw)) return lw;
  if (word === word.toUpperCase() && word.length <= 3) return word;
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

/** "You are a {Role} at {Company}. " with the badge's smart casing. */
export function introLead(role, company) {
  const fmt = (s) => s.split(/\s+/).filter(Boolean).map(smartCase).join(' ');
  return `You are a ${fmt(role)} at ${fmt(company)}. `;
}

/** ALL CAPS and ends with "?" */
export function isCTA(line) {
  const t = (line || '').trim();
  return t.length > 0 && t.endsWith('?') && t === t.toUpperCase();
}

/**
 * Word-wrap to maxWidth using measure(str)→px. "\n" is a hard break; an empty
 * paragraph yields an empty line. A single word wider than maxWidth gets its own line.
 */
export function wrap(text, maxWidth, measure) {
  const out = [];
  for (const para of text.split('\n')) {
    if (para === '') { out.push(''); continue; }
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (line && measure(test) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

function trimBlanks(page) {
  let a = 0, b = page.length;
  while (a < b && page[a] === '') a++;
  while (b > a && page[b - 1] === '') b--;
  return page.slice(a, b);
}

function lastNonEmpty(page) { for (let i = page.length - 1; i >= 0; i--) if (page[i]) return i; return -1; }
function firstNonEmpty(page) { for (let i = 0; i < page.length; i++) if (page[i]) return i; return -1; }

/**
 * Split wrapped lines into pages that fit boxHeight. A CTA line is always alone on
 * its own page. Where a page break falls mid-sentence, "..." is appended to the last
 * line of the page and prepended to the first line of the next.
 */
export function paginate(lines, { lineHeight, blankHeight, boxHeight }) {
  const pages = [];
  let buf = [];
  let y = 0;

  const flush = () => {
    const t = trimBlanks(buf);
    if (t.length) pages.push(t);
    buf = [];
    y = 0;
  };

  for (const ln of lines) {
    if (isCTA(ln)) {
      flush();
      pages.push([ln]);
      continue;
    }
    const h = ln === '' ? blankHeight : lineHeight;
    if (buf.length && y + h > boxHeight) flush();
    if (ln === '' && buf.length === 0) continue; // never start a page with a blank
    buf.push(ln);
    y += h;
  }
  flush();
  if (!pages.length) pages.push([]);

  for (let i = 0; i + 1 < pages.length; i++) {
    const a = pages[i], b = pages[i + 1];
    const la = lastNonEmpty(a), fb = firstNonEmpty(b);
    if (la < 0 || fb < 0) continue;
    const endsSentence = SENTENCE_END.some((c) => a[la].trimEnd().endsWith(c));
    const startsLower = /^[a-z]/.test(b[fb]);
    if (!endsSentence && startsLower && !isCTA(b[fb])) {
      a[la] = a[la] + '...';
      b[fb] = '...' + b[fb];
    }
  }
  return pages;
}
