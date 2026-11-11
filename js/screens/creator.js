// Character creation — a Quest-for-Glory-style sheet (spec: Character creation › Sheet language).

import { drawHero, drawHeroCrop, HEAD_CROP, HAND_CROP } from '../engine/hero.js';
import { OPTIONS, SKIN, HAIR, HOODIE, JEANS } from '../engine/hero-parts.js';
import { FACE_ROWS, KIT_ROWS, LABELS, BODY_LABELS, pick, randomHero, cleanName, displayName, sanitizeHero } from '../creator-state.js';
import { colButton } from '../engine/ui.js';

const SWATCH = { skin: (v) => SKIN[v], hair: (v) => HAIR[v], hoodie: (v) => HOODIE[v], jeans: (v) => JEANS[v] };
const THUMB = { style: HEAD_CROP, beard: HEAD_CROP, glasses: HEAD_CROP, hold: HAND_CROP };

export function createCreatorScreen(game) {
  let hero, page = 'face', els = {}, heroCtx = null, nameSheet = null;

  function thumb(key, value) {
    const crop = THUMB[key];
    const c = document.createElement('canvas');
    c.width = crop.w * 2; c.height = crop.h * 2;
    c.setAttribute('aria-hidden', 'true');
    // a thumbnail previews the choice on the current hero
    drawHeroCrop(c.getContext('2d'), pick(hero, key, value), crop, 2);
    return c;
  }

  function optionButton(key, value) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt'; b.dataset.key = key; b.dataset.value = String(value);
    b.setAttribute('aria-pressed', String(hero[key] === value));
    if (key === 'body') { b.classList.add('wide'); b.textContent = BODY_LABELS[value]; b.setAttribute('aria-label', `${BODY_LABELS[value]} body`); }
    else if (SWATCH[key]) { const s = document.createElement('span'); s.className = 'sw'; s.style.background = SWATCH[key](value); b.appendChild(s); b.setAttribute('aria-label', `${LABELS[key]} ${value}`); }
    else { b.appendChild(thumb(key, value)); b.setAttribute('aria-label', `${LABELS[key]} ${value}`); }
    b.addEventListener('click', () => update(pick(hero, key, b.dataset.value)));
    return b;
  }

  function renderRows() {
    els.rows.innerHTML = '';
    if (page === 'kit') {
      const row = document.createElement('div'); row.className = 'sheet-row name-row';
      const label = document.createElement('span'); label.className = 'sheet-label'; label.textContent = 'Name';
      const btn = document.createElement('button'); btn.type = 'button'; btn.id = 'name-btn';
      btn.addEventListener('click', openNameSheet);
      row.append(label, btn); els.rows.appendChild(row);
      els.nameBtn = btn; renderName();
    }
    for (const key of page === 'face' ? FACE_ROWS : KIT_ROWS) {
      const row = document.createElement('div'); row.className = 'sheet-row';
      const label = document.createElement('span'); label.className = 'sheet-label'; label.textContent = LABELS[key];
      row.appendChild(label);
      for (const v of OPTIONS[key]) row.appendChild(optionButton(key, v));
      els.rows.appendChild(row);
    }
    if (page === 'kit') {
      const note = document.createElement('div'); note.className = 'sheet-note';
      note.textContent = 'Tonight’s class is dealt by each chapter — with its own silly stats. The sheet is only who you look like.';
      els.rows.appendChild(note);
    }
  }

  function renderHero() {
    heroCtx.clearRect(0, 0, 28, 72);
    drawHero(heroCtx, hero, 'idle', 0, 0, 1);
  }

  function renderName() {
    if (!els.nameBtn || !els.nameBtn.isConnected) return;
    els.nameBtn.textContent = hero.name || 'optional';
    els.nameBtn.classList.toggle('empty', !hero.name);
    els.nameBtn.setAttribute('aria-label', `Name: ${displayName(hero)}. Tap to change`);
  }

  function update(next, { rerender = false } = {}) {
    const bodyChanged = next.body !== hero?.body;
    hero = next;
    if (rerender || bodyChanged) renderRows();
    else {
      // thumbnails depend on the hero, so redraw them; pressed state follows the config
      for (const b of els.rows.querySelectorAll('.opt')) {
        const { key, value } = b.dataset;
        b.setAttribute('aria-pressed', String(String(hero[key]) === value));
        if (THUMB[key]) { b.replaceChildren(thumb(key, OPTIONS[key].find((v) => String(v) === value))); }
      }
    }
    renderHero(); renderName();
  }

  function openNameSheet() {
    if (nameSheet) return;                      // a second tap while open does nothing
    const sheet = nameSheet = document.createElement('div');
    sheet.id = 'name-sheet';
    sheet.innerHTML = `
      <div class="row"><span class="lbl">Name :</span><input type="text" maxlength="24" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Hero name"></div>
      <div class="small">Up to 16 characters. Leave it blank to be “the Engineer”.</div>
      <div class="row"><button type="button" class="btn-sierra go">Done</button></div>`;
    const input = sheet.querySelector('input'); input.value = hero.name;
    const done = () => { if (!sheet.isConnected) return; update({ ...hero, name: cleanName(input.value) }); sheet.remove(); if (nameSheet === sheet) nameSheet = null; };
    sheet.querySelector('button').addEventListener('click', done);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    document.body.appendChild(sheet);
    input.focus();
  }

  return {
    enter(ctx) {
      hero = sanitizeHero(ctx.hero);
      page = 'face';
      ctx.overlay.innerHTML = `
        <div class="sheet">
          <div class="frame"><div class="jewel l" aria-hidden="true"></div><div class="jewel r" aria-hidden="true"></div>
            <div class="frame-inner"><canvas id="hero-view" width="28" height="72" aria-label="Your hero"></canvas></div></div>
          <div class="sheet-rows"></div>
        </div>`;
      els = { rows: ctx.overlay.querySelector('.sheet-rows'), nameBtn: null };
      heroCtx = ctx.overlay.querySelector('#hero-view').getContext('2d');
      // page tabs sit in the left thumb column, above RANDOM
      const tabs = document.createElement('nav'); tabs.className = 'tabs'; tabs.setAttribute('aria-label', 'Sheet pages');
      for (const [id, label] of [['face', 'Face'], ['kit', 'Kit']]) {
        const t = colButton({ id: `tab-${id}`, long: label, className: `tab${id === page ? ' on' : ''}` });
        t.dataset.page = id;
        t.addEventListener('click', () => {
          page = id;
          for (const x of tabs.querySelectorAll('.tab')) x.classList.toggle('on', x === t);
          renderRows();
        });
        tabs.appendChild(t);
      }
      ctx.colL.appendChild(tabs); els.tabs = tabs;
      const random = colButton({ id: 'btn-random', long: 'Random', short: 'Roll', onClick: () => update({ ...randomHero(), name: hero.name }, { rerender: true }) });
      const start = colButton({ id: 'btn-start-game', long: 'Start', short: 'Go', className: 'go', onClick: () => { ctx.hero = hero; ctx.saveHero(hero); game.go('PREVIEW'); } });
      ctx.colL.appendChild(random); ctx.colR.appendChild(start);
      els.random = random; els.start = start;
      update(hero, { rerender: true });
      window.__oq && (window.__oq.creator = { get hero() { return hero; }, get page() { return page; } });
    },
    exit(ctx) {
      nameSheet?.remove(); nameSheet = null;
      els.tabs?.remove(); els.random?.remove(); els.start?.remove();
      ctx.overlay.innerHTML = '';
      els = {}; heroCtx = null;
    },
  };
}
