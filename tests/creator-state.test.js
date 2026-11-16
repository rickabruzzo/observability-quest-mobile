import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHero, pick, randomHero, sanitizeHero, cleanName, displayName, FACE_ROWS, KIT_ROWS, LABELS } from '../js/creator-state.js';
import { OPTIONS, DEFAULT_HERO } from '../js/engine/hero-parts.js';

test('the default is the figure Rick approved, with an empty name and no body', () => {
  assert.deepEqual(defaultHero(), { ...DEFAULT_HERO, name: '' });
  assert.deepEqual(DEFAULT_HERO, { skin: 0, hair: 'black', style: 'standard', beard: 'short', hoodie: 'ink', jeans: 'indigo', glasses: 'none' });
  assert.ok(!('body' in DEFAULT_HERO));
});
test('pick validates key and value', () => {
  const h = defaultHero();
  assert.equal(pick(h, 'hoodie', 'plaid'), h); assert.equal(pick(h, 'cape', 'red'), h); assert.equal(pick(h, 'body', 'fem'), h);
  assert.equal(pick(h, 'hoodie', 'lime').hoodie, 'lime');
});
test('pick coerces numeric options from DOM strings', () => {
  assert.equal(pick(defaultHero(), 'skin', '3').skin, 3);
  const h = defaultHero(); assert.equal(pick(h, 'skin', '4'), h);
});
test('the options (brief 15 E): one build, four hair styles, a beard or none, glasses or none; colours untouched', () => {
  assert.deepEqual(Object.keys(OPTIONS).sort(), ['beard', 'glasses', 'hair', 'hoodie', 'jeans', 'skin', 'style'].sort());
  assert.deepEqual(OPTIONS.style, ['standard', 'long', 'fro', 'mohawk']);
  assert.deepEqual(OPTIONS.beard, ['none', 'short']);
  assert.deepEqual(OPTIONS.glasses, ['none', 'glasses']); assert.deepEqual(OPTIONS.skin, [0, 1, 2, 3]);
  assert.deepEqual(OPTIONS.hair, ['black', 'brown', 'blonde', 'ginger', 'violet']);
  assert.deepEqual(OPTIONS.hoodie, ['honey', 'ink', 'teal', 'indigo', 'lime']); assert.deepEqual(OPTIONS.jeans, ['indigo', 'black', 'light', 'grey', 'khaki']);
  assert.ok(!('body' in LABELS));
});
test('random rolls only what exists, 200 rolls', () => {
  for (let i = 0; i < 200; i++) {
    const h = randomHero();
    assert.deepEqual(Object.keys(h).sort(), [...Object.keys(OPTIONS), 'name'].sort());
    for (const [k, vs] of Object.entries(OPTIONS)) assert.ok(vs.includes(h[k]), k);
  }
});
test('sanitize repairs garbage', () => {
  assert.deepEqual(sanitizeHero(null), defaultHero());
  assert.deepEqual(sanitizeHero('{not json'), defaultHero());
  const h = sanitizeHero({ body: 'robot', hoodie: 'lime', length: 'long', beardCol: 'ginger', style: 'locs', name: 42 });
  assert.equal(h.hoodie, 'lime'); assert.equal(h.style, defaultHero().style); assert.equal(h.name, '');
  assert.ok(!('length' in h) && !('beardCol' in h) && !('body' in h), 'old keys dropped');
});
test('a hero saved before the painted hero loads: shoulder → long, a long beard → short, body ignored', () => {
  const h = sanitizeHero({ body: 'fem', skin: 1, hair: 'brown', style: 'shoulder', beard: 'long', hoodie: 'honey', jeans: 'black', glasses: 'glasses', hold: 'coffee', name: 'Ada' });
  assert.deepEqual(h, { skin: 1, hair: 'brown', style: 'long', beard: 'short', hoodie: 'honey', jeans: 'black', glasses: 'glasses', name: 'Ada' });
  assert.equal(sanitizeHero({ style: 'long', beard: 'short' }).style, 'long');
  assert.equal(sanitizeHero({ body: 'nb', style: 'mohawk' }).style, 'mohawk');
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
test('rows cover every option exactly once, and there is no Body row', () => {
  assert.deepEqual([...FACE_ROWS, ...KIT_ROWS].sort(), Object.keys(OPTIONS).sort());
  assert.deepEqual(FACE_ROWS, ['skin', 'hair', 'style', 'beard']);
});
