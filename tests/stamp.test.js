import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('stamp.mjs versions the css and js references and is idempotent', () => {
  const orig = readFileSync('index.html', 'utf8');
  try {
    execFileSync('node', ['tools/stamp.mjs', 'abc1234']);
    const a = readFileSync('index.html', 'utf8');
    assert.match(a, /href="css\/game\.css\?v=abc1234"/);
    assert.match(a, /src="js\/game\.js\?v=abc1234"/);
    execFileSync('node', ['tools/stamp.mjs', 'def5678']);
    const b = readFileSync('index.html', 'utf8');
    assert.match(b, /css\/game\.css\?v=def5678"/);
    assert.equal((b.match(/\?v=/g) || []).length, 2);
  } finally {
    writeFileSync('index.html', orig);
  }
});
