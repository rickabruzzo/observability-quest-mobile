// Charity's verdict, the pure part (spec: No score): her mood by whether any solved scenario had missteps,
// and one closing line by how many are solved. Returns script keys; the screen shows them.

import { SCENARIOS } from '../menu.js';

/** @param {Record<number, number>} done scenario → missteps, as js/menu.js keeps it */
export function charityVerdict(done) {
  const solved = Object.values(done);
  const n = solved.length;
  const mood = solved.every((m) => m === 0) ? 'final.clean' : 'final.grief';
  const count = n <= 1 ? 'final.count.one' : n >= SCENARIOS.length ? 'final.count.all' : 'final.count.some';
  return { header: 'final.header', mood, count, n };
}

/** Fills `{n}` in a script line. */
export function fillN(text, n) {
  return String(text).replaceAll('{n}', String(n));
}
