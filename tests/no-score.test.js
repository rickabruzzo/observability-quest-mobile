// Brief 05: there is no score. No module exports anything named for one, and no script line the game reads
// speaks of points.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

const MODULES = ['js/menu.js', 'js/chapters/ch1.js', ...readdirSync('js/engine').filter((f) => f.endsWith('.js')).map((f) => `js/engine/${f}`)];

test('nothing exported is named for a score', async () => {
  const bad = [];
  for (const m of MODULES) {
    const mod = await import(`../${m}`);
    for (const k of Object.keys(mod)) if (/score|max_score|per_scenario|clean$|messy/i.test(k)) bad.push(`${m}: ${k}`);
  }
  assert.deepEqual(bad, []);
});
