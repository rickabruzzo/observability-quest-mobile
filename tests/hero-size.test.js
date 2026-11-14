// Everything that uses the hero takes its size from the constants (Warp brief 09): no file under js/ may
// hard-code the old 28×72 or the new 56×144 where it means the sprite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HERO_W, HERO_H } from '../js/engine/hero.js';

function files(dir) {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : []; });
}
const SIZE = /\b(28|72|56|144)\b/;
const HERO = /hero|sprite|clearRect|getImageData|width="|height="|canvas/i;
const EXEMPT = new Set(['js/engine/hero.js']);        // the constants' own definition

test('no js file hard-codes the hero\'s size: HERO_W and HERO_H, never a number', () => {
  const bad = [];
  for (const f of files('js')) {
    if (EXEMPT.has(f)) continue;
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (/^\s*\*|^\s*\/\*\*/.test(line)) return;               // a doc comment
      if (SIZE.test(code) && HERO.test(line)) bad.push(`${f}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepEqual(bad, []);
  assert.equal(HERO_W, 56); assert.equal(HERO_H, 144);
});
