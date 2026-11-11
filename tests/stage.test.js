import test from 'node:test';
import assert from 'node:assert/strict';
import { fitStage, isPortrait } from '../js/engine/stage.js';

test('844x390: height-bound, 16:10, columns split the rest', () => {
  const f = fitStage(844, 390);
  assert.equal(f.sceneH, 370); assert.equal(f.sceneW, 592); assert.equal(f.colW, 126);
  assert.ok(Math.abs(f.scale - 1.85) < 0.001);
});

test('667x375: columns never below 56, scene shrinks to fit', () => {
  const f = fitStage(667, 375);
  assert.ok(f.colW >= 56);
  assert.ok(f.sceneW + 2 * f.colW <= 667);
  assert.equal(Math.round(f.sceneW / f.sceneH * 10), 16);
});

test('1280x800: columns keep their minimum even on desktop', () => {
  const f = fitStage(1280, 800);
  assert.equal(f.colW, 56); assert.equal(f.sceneW, 1168); assert.equal(f.sceneH, 730);
});

test('4:3 and tablet viewports never overflow or go negative', () => {
  for (const [w, h] of [[1024, 768], [1180, 820], [1194, 834], [1366, 1024], [1100, 900], [800, 360]]) {
    const f = fitStage(w, h);
    assert.ok(f.colW >= 56, `${w}x${h} colW ${f.colW}`);
    assert.ok(f.sceneW + 2 * f.colW <= w, `${w}x${h} overflow`);
    assert.ok(f.sceneH <= h - 20, `${w}x${h} too tall`);
    assert.equal(Math.round(f.sceneW / f.sceneH * 10), 16, `${w}x${h} ratio`);
  }
});

test('932x430 keeps 16:10 and fills the height', () => {
  const f = fitStage(932, 430);
  assert.equal(f.sceneH, 410); assert.equal(f.sceneW, 656);
});

test('isPortrait', () => {
  assert.equal(isPortrait(390, 844), true);
  assert.equal(isPortrait(844, 390), false);
});
