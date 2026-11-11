import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIntro, introLead, wrap, paginate, isCTA } from '../js/text.js';

const mono8 = (s) => s.length * 8;

test('parseIntro splits header', () => {
  const r = parseIntro('LEAD ENGINEER\nCUSTOMER SERVICE PLATFORM\n\nBody.');
  assert.deepEqual(r.header, { role: 'LEAD ENGINEER', company: 'CUSTOMER SERVICE PLATFORM' });
  assert.equal(r.body, 'Body.');
  const n = parseIntro('No header here.');
  assert.equal(n.header, null);
  assert.equal(n.body, 'No header here.');
});

test('introLead smart casing', () => {
  assert.equal(introLead('DIRECTOR OF PLATFORM ENGINEERING', 'MUSIC INSTRUMENT BRAND'),
    'You are a Director of Platform Engineering at Music Instrument Brand. ');
  assert.equal(introLead('CTO', 'FINTECH COMPANY'), 'You are a CTO at Fintech Company. ');
  assert.equal(introLead('STAFF SITE RELIABILITY ENGINEER', 'LANGUAGE LEARNING PLATFORM'),
    'You are a Staff Site Reliability Engineer at Language Learning Platform. ');
});

test('isCTA', () => {
  assert.ok(isCTA('HOW DO YOU INVESTIGATE?'));
  assert.ok(!isCTA('How do you investigate?'));
  assert.ok(!isCTA('HOW DO YOU INVESTIGATE.'));
  assert.ok(!isCTA(''));
});

test('wrap respects width and hard breaks', () => {
  assert.deepEqual(wrap('aaa bbb ccc\n\nddd', 8 * 7, mono8), ['aaa bbb', 'ccc', '', 'ddd']);
});

test('wrap never splits a word; an over-long word gets its own line', () => {
  assert.deepEqual(wrap('ab supercalifragilistic cd', 8 * 10, mono8), ['ab', 'supercalifragilistic', 'cd']);
});

test('CTA isolated on its own page', () => {
  const pages = paginate(['one', 'two', 'HOW DO YOU INVESTIGATE?'], { lineHeight: 13, blankHeight: 6, boxHeight: 60 });
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0], ['one', 'two']);
  assert.deepEqual(pages[1], ['HOW DO YOU INVESTIGATE?']);
});

test('ellipsis on mid-sentence break only', () => {
  const p = paginate(['Your team just', 'wired twelve'], { lineHeight: 13, blankHeight: 6, boxHeight: 13 });
  assert.deepEqual(p, [['Your team just...'], ['...wired twelve']]);
  const q = paginate(['Done.', 'Next thing'], { lineHeight: 13, blankHeight: 6, boxHeight: 13 });
  assert.deepEqual(q, [['Done.'], ['Next thing']]);
});

test('trailing blank lines are trimmed from pages; blanks count at blankHeight', () => {
  const p = paginate(['a.', '', 'b.', '', 'c'], { lineHeight: 10, blankHeight: 5, boxHeight: 25 });
  // a(10) + blank(5) + b(10) = 25 fits; next blank would overflow → page 2 starts at 'c' (leading blank dropped)
  assert.deepEqual(p, [['a.', '', 'b.'], ['c']]);
});

test('ellipsis never pushes a line past maxWidth when measure is given', () => {
  // "Your aggregate metrics are a" is exactly at the limit; adding "..." must move "a" down
  const lines = ['Your aggregate metrics are a', 'beautiful lie'];
  const p = paginate(lines, { lineHeight: 13, blankHeight: 6, boxHeight: 13, measure: mono8, maxWidth: 28 * 8 });
  assert.deepEqual(p, [['Your aggregate metrics...'], ['...are a beautiful lie']]);
  for (const pg of p) for (const l of pg) assert.ok(mono8(l) <= 28 * 8, l);
});
