// The deploy serves the game and nothing else (brief 13 A): .vercelignore is an allow-list and the test server obeys it.
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { allowedRoots, isServed } from './e2e/_server.js';

const ALLOW = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
const text = readFileSync('.vercelignore', 'utf8');

test('.vercelignore is the allow-list, in that form', () => {
  assert.deepEqual(text.trim().split('\n'), ['/*', ...ALLOW.map((p) => `!${p}`)]);
});
test('each allowed path exists', () => { for (const p of ALLOW) assert.ok(existsSync(p), p); });
test('everything that is not the game is outside the list', () => {
  const roots = allowedRoots(text);
  assert.deepEqual([...roots].sort(), [...ALLOW].sort());
  for (const p of ['briefs', 'handbacks', 'docs', 'script', 'source', 'tests', 'tools', 'art-drops', 'README.md', 'package.json', 'anim-preview.html', 'ASSET_PROMPTS.md', '.env']) {
    assert.ok(existsSync(p) || p === '.env', `${p} should exist to be worth excluding`);
    assert.equal(isServed(`/${p}`, roots), false, p);
    assert.equal(isServed(`/${p}/x.md`, roots), false, p);
  }
  for (const p of ['/index.html', '/manifest.webmanifest', '/js/game.js', '/css/game.css', '/assets/icons/icon-192.png', '/assets/intro/intro.json']) assert.equal(isServed(p, roots), true, p);
  assert.equal(isServed('/', roots), true, 'the root is index.html');
  assert.equal(isServed('/jsx/game.js', roots), false, 'a prefix is not a match');
  assert.equal(isServed('/index.html.bak', roots), false);
});
