import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const css = readFileSync('css/game.css', 'utf8');

test('only VT323 and GloryQuest are declared', () => {
  const faces = [...css.matchAll(/@font-face\s*{[^}]*font-family:\s*'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(faces)].sort(), ['GloryQuest', 'VT323']);
  assert.ok(!/Silkscreen|Pixelify/.test(css));
});

test('font files and licences ship together', () => {
  for (const f of ['assets/fonts/vt323-latin-400-normal.woff2', 'assets/fonts/LICENSE-vt323.txt', 'assets/fonts/gloryquest/gloryquest.otf', 'assets/fonts/gloryquest/license.txt', 'assets/fonts/gloryquest/readme.txt']) assert.ok(existsSync(f), f);
});

test('no read text below 16px and the sheet colours are the spec colours', () => {
  for (const m of css.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 16, `font-size ${m[1]}px`);
  for (const c of ['#3C3CB4', '#E04040', '#8C3A1C', '#4A1E0C', '#C8723A', '#4CAF50', '#3A4660', '#D8D8D8']) assert.ok(css.toUpperCase().includes(c), c);
});

test('rotate gate is CSS-driven and exempts the form screens', () => {
  assert.match(css, /@media\s*\(orientation:\s*portrait\)/);
  assert.match(css, /data-screen="CLAIM"/); assert.match(css, /data-screen="COMPLETE"/);
});

test('README credits GloryQuest', () => assert.match(readFileSync('README.md', 'utf8'), /GloryQuest.*the12thdoctor/s));
