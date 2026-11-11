import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHero, applyPreset, pick, randomHero, sanitizeHero, cleanName, displayName, FACE_ROWS, KIT_ROWS } from '../js/creator-state.js';
import { OPTIONS, PRESETS } from '../js/engine/hero-parts.js';

test('default is the masc preset with an empty name', () => assert.deepEqual(defaultHero(), { ...PRESETS.masc, name: '' }));

test('preset replaces appearance, keeps the name', () => {
  const h = applyPreset({ ...defaultHero(), name: 'Ada' }, 'fem');
  assert.equal(h.hoodie, PRESETS.fem.hoodie); assert.equal(h.name, 'Ada');
});

test('pick validates key and value', () => {
  const h = defaultHero();
  assert.equal(pick(h, 'hoodie', 'plaid'), h);
  assert.equal(pick(h, 'cape', 'red'), h);
  assert.equal(pick(h, 'hoodie', 'lime').hoodie, 'lime');
});

test('pick coerces numeric options from DOM strings', () => {
  assert.equal(pick(defaultHero(), 'skin', '3').skin, 3);
  const h = defaultHero();
  assert.equal(pick(h, 'skin', '4'), h); // out of range: same object back
});

test('the simplified option lists: no beard colour, no length', () => {
  assert.deepEqual(Object.keys(OPTIONS).sort(), ['beard', 'body', 'glasses', 'hair', 'hoodie', 'hold', 'jeans', 'skin', 'style'].sort());
  assert.deepEqual(OPTIONS.style, ['mohawk', 'standard', 'shoulder', 'long', 'fro']);
  assert.deepEqual(OPTIONS.beard, ['none', 'short', 'long']);
  assert.deepEqual(OPTIONS.glasses, ['none', 'glasses']);
  assert.deepEqual(OPTIONS.skin, [0, 1, 2, 3]);
});

test('random stays inside the option lists, 200 rolls', () => {
  for (let i = 0; i < 200; i++) {
    const h = randomHero();
    for (const [k, vs] of Object.entries(OPTIONS)) assert.ok(vs.includes(h[k]), k);
  }
});

test('sanitize repairs garbage', () => {
  assert.deepEqual(sanitizeHero(null), defaultHero());
  assert.deepEqual(sanitizeHero('{not json'), defaultHero());
  const h = sanitizeHero({ body: 'robot', hoodie: 'lime', length: 'long', beardCol: 'ginger', style: 'locs', name: 42 });
  assert.equal(h.body, 'masc'); assert.equal(h.hoodie, 'lime'); assert.equal(h.style, defaultHero().style); assert.equal(h.name, '');
  assert.ok(!('length' in h) && !('beardCol' in h), 'old keys dropped');
});

test('cleanName strips controls, trims, clamps to 16 code points', () => {
  assert.equal(cleanName('  Ada\u0007 Lovelace  '), 'Ada Lovelace');
  assert.equal([...cleanName('🐝'.repeat(40))].length, 16);
  assert.equal(cleanName(undefined), ''); assert.equal(cleanName({}), '');
});

test('displayName falls back', () => {
  assert.equal(displayName(defaultHero()), 'the Engineer');
  assert.equal(displayName({ ...defaultHero(), name: 'Ada' }), 'Ada');
});

test('rows cover every option exactly once', () => assert.deepEqual([...FACE_ROWS, ...KIT_ROWS].sort(), Object.keys(OPTIONS).sort()));
