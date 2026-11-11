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
  assert.equal(pick(defaultHero(), 'skin', '4').skin, 4);
});

test('beard colour follows hair until changed on its own', () => {
  let h = defaultHero(); h = pick(h, 'hair', 'ginger'); assert.equal(h.beardCol, 'ginger');
  h = pick(h, 'beardCol', 'black'); h = pick(h, 'hair', 'violet'); assert.equal(h.beardCol, 'black');
});

test('random stays inside the option lists, 200 rolls', () => {
  for (let i = 0; i < 200; i++) {
    const h = randomHero();
    for (const [k, vs] of Object.entries(OPTIONS)) assert.ok(vs.includes(h[k]), k);
    assert.equal(h.beardCol, h.hair);
  }
});

test('sanitize repairs garbage', () => {
  assert.deepEqual(sanitizeHero(null), defaultHero());
  assert.deepEqual(sanitizeHero('{not json'), defaultHero());
  const h = sanitizeHero({ body: 'robot', hoodie: 'lime', len: 'long', name: 42 });
  assert.equal(h.body, 'masc'); assert.equal(h.hoodie, 'lime'); assert.equal(h.length, defaultHero().length); assert.equal(h.name, '');
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
