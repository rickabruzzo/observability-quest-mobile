import test from 'node:test';
import assert from 'node:assert/strict';

// Minimal DOM stand-ins so claim.js can run under node.
function fakeContainer() {
  const el = { innerHTML: '', children: [], appendChild(c) { this.children.push(c); return c; }, querySelector() { return null; } };
  return el;
}
globalThis.document ??= { createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {} }), head: { appendChild() {} } };
const store = new Map();
globalThis.localStorage ??= { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { HUBSPOT, mountClaimForm, isValidEmail, getEventCode, redeemed } = await import('../js/claim.js');

test('placeholder mode when no HUBSPOT ids', async () => {
  HUBSPOT.portalId = ''; HUBSPOT.formId = '';
  const mode = await mountClaimForm(fakeContainer(), { onSubmitted() {} });
  assert.equal(mode, 'placeholder');
});

test('fallback when the HubSpot script loader rejects', async () => {
  HUBSPOT.portalId = '1'; HUBSPOT.formId = 'x';
  const mode = await mountClaimForm(fakeContainer(), { onSubmitted() {}, loadScript: () => Promise.reject(new Error('offline')) });
  assert.equal(mode, 'fallback');
  HUBSPOT.portalId = ''; HUBSPOT.formId = '';
});

test('hubspot mode when the script loads and hbspt is present', async () => {
  HUBSPOT.portalId = '1'; HUBSPOT.formId = 'x';
  let created = null;
  globalThis.hbspt = { forms: { create(opts) { created = opts; opts.onFormReady({ querySelector() { return null; } }); } } };
  const mode = await mountClaimForm(fakeContainer(), { onSubmitted() {}, loadScript: () => Promise.resolve() });
  assert.equal(mode, 'hubspot');
  assert.equal(created.portalId, '1'); assert.equal(created.formId, 'x'); assert.equal(created.region, 'na1');
  delete globalThis.hbspt;
  HUBSPOT.portalId = ''; HUBSPOT.formId = '';
});

test('isValidEmail', () => {
  assert.ok(isValidEmail('a@b.co'));
  assert.ok(isValidEmail('first.last+tag@sub.example.com'));
  assert.ok(!isValidEmail('nope'));
  assert.ok(!isValidEmail('a@b'));
  assert.ok(!isValidEmail(''));
  assert.ok(!isValidEmail('a b@c.co'));
});

test('getEventCode reads ?e= and is safe', () => {
  assert.equal(getEventCode('?e=reinvent26'), 'reinvent26');
  assert.equal(getEventCode('?x=1&e=kubecon-na-26'), 'kubecon-na-26');
  assert.equal(getEventCode(''), '');
  assert.equal(getEventCode('?e=<script>'), 'script'); // non [A-Za-z0-9_-] stripped
});

test('redeemed persists in localStorage', () => {
  redeemed.clear();
  assert.equal(redeemed.get(), false);
  redeemed.set();
  assert.equal(redeemed.get(), true);
  assert.equal(store.get('oq.redeemed'), '1');
  redeemed.clear();
  assert.equal(redeemed.get(), false);
});

test('getEventCode survives a malformed percent-encoding', () => {
  assert.equal(getEventCode('?e=50%'), '50');
  assert.equal(getEventCode('?e=%E0%A4%A'), 'E0A4A');
});

test('hubspot mode falls back when the form never becomes ready', async () => {
  HUBSPOT.portalId = '1'; HUBSPOT.formId = 'x';
  globalThis.hbspt = { forms: { create() { /* never calls onFormReady */ } } };
  const c = fakeContainer();
  const mode = await mountClaimForm(c, { onSubmitted() {}, loadScript: () => Promise.resolve(), readyTimeoutMs: 30 });
  assert.equal(mode, 'fallback');
  delete globalThis.hbspt;
  HUBSPOT.portalId = ''; HUBSPOT.formId = '';
});

test('pendingEmail is stored by the fallback form for the completion screen', async () => {
  const { pendingEmail } = await import('../js/claim.js');
  pendingEmail.clear();
  assert.equal(pendingEmail.get(), '');
  pendingEmail.set('x@y.co');
  assert.equal(pendingEmail.get(), 'x@y.co');
  pendingEmail.clear();
});
