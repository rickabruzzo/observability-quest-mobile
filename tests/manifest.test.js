// A Home Screen web app (brief 13 B) and nothing lost to the notch (D).
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
const html = readFileSync('index.html', 'utf8');
const css = readFileSync('css/game.css', 'utf8');
const pngSize = (p) => { const b = readFileSync(p); assert.equal(b.toString('latin1', 1, 4), 'PNG', p); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; };
const meta = (name) => html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`))?.[1];

test('the manifest names the game, opens full screen and landscape, on black', () => {
  assert.equal(manifest.name, 'Observability Quest');
  assert.equal(manifest.short_name, 'o11y Quest');
  assert.equal(manifest.description, meta('description'));
  assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'fullscreen'); assert.equal(manifest.orientation, 'landscape');
  assert.equal(manifest.background_color, '#000000'); assert.equal(manifest.theme_color, '#000000');
});
test('the icons are the built hexagons, each the size it claims, purpose any', () => {
  assert.deepEqual(manifest.icons.map((i) => [i.src, i.sizes, i.type, i.purpose]), [
    ['assets/icons/icon-192.png', '192x192', 'image/png', 'any'],
    ['assets/icons/icon-512.png', '512x512', 'image/png', 'any'],
  ]);
  for (const i of manifest.icons) assert.equal(pngSize(i.src), i.sizes, i.src);
  assert.equal(pngSize('assets/icons/icon-180.png'), '180x180');
});
test('index.html carries the manifest, the Apple touch icon and the web-app tags', () => {
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="assets\/icons\/icon-180.png">/);
  assert.equal(meta('mobile-web-app-capable'), 'yes');
  assert.equal(meta('apple-mobile-web-app-capable'), 'yes');
  assert.equal(meta('apple-mobile-web-app-status-bar-style'), 'black-translucent');
  assert.equal(meta('apple-mobile-web-app-title'), 'o11y Quest');
  assert.match(html, /viewport-fit=cover/);
});
test('the status bar pads for both safe-area insets and stays 20 px', () => {
  const rule = css.match(/^#statusbar \{[^}]*\}/m)?.[0];
  assert.ok(rule, '#statusbar rule');
  assert.match(rule, /max\(10px, env\(safe-area-inset-left\)\)/);
  assert.match(rule, /max\(10px, env\(safe-area-inset-right\)\)/);
  assert.match(rule, /height: var\(--status-h\)/);
  assert.match(css, /--status-h: 20px/);
});
test('the shell has the Sound button at the top of the left column and the two gate lines', () => {
  assert.match(html, /<div class="col" id="col-l">\s*<button type="button" id="btn-sound"/);
  assert.match(html, /Or tap here to turn the screen\./);
  assert.match(html, /Screen not turning\? Switch off rotation lock\./);
});
