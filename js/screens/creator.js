// Character creation — a Quest-for-Glory-style sheet (spec: Character creation › Sheet language).

import { drawHero, drawHeroCrop, HEAD_CROP, HAND_CROP } from '../engine/hero.js';
import { OPTIONS, SKIN, HAIR, HOODIE, JEANS } from '../engine/hero-parts.js';
import { FACE_ROWS, KIT_ROWS, LABELS, BODY_LABELS, pick, randomHero, cleanName, displayName, sanitizeHero } from '../creator-state.js';

const SWATCH = { skin: (v) => SKIN[v], hair: (v) => HAIR[v], beardCol: (v) => HAIR[v], hoodie: (v) => HOODIE[v], jeans: (v) => JEANS[v] };
const THUMB = { length: HEAD_CROP, style: HEAD_CROP, beard: HEAD_CROP, glasses: HEAD_CROP, hold: HAND_CROP };

export function createCreatorScreen(game) {
  let hero, page = 'face', els = {}, heroCtx = null, nameSheet = null;

  function thumb(key, value) {
    const crop = THUMB[key];
    const c = document.createElement('canvas');
    c.width = crop.w * 2; c.height = crop.h * 2;
    c.setAttribute('aria-hidden', 'true');
    // a thumbnail previews the choice on the current hero; buzz hides style, so style thumbs use a visible length
    let preview = pick(hero, key, value);
    if (key === 'style' && preview.length === 'buzz') preview = { ...preview, length: 'short' };
    drawHeroCrop(c.getContext('2d'), preview, crop, 2);
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
    nameSheet = document.createElement('div');
    nameSheet.id = 'name-sheet';
    nameSheet.innerHTML = `
      <div class="row"><span class="lbl">Name :</span><input type="text" maxlength="24" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Hero name"></div>
      <div class="small">Up to 16 characters. Leave it blank to be “the Engineer”.</div>
      <div class="row"><button type="button" class="btn-sierra go">Done</button></div>`;
    const input = nameSheet.querySelector('input'); input.value = hero.name;
    const done = () => { update({ ...hero, name: cleanName(input.value) }); nameSheet.remove(); nameSheet = null; };
    nameSheet.querySelector('button').addEventListener('click', done);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
    document.body.appendChild(nameSheet);
    input.focus();
  }

  return {
    enter(ctx) {
      hero = sanitizeHero(ctx.hero);
      page = 'face';
      ctx.overlay.innerHTML = `
        <div class="sheet">
          <div class="sheet-top">
            <div class="sheet-name"><span class="lbl">Name :</span><button type="button" id="name-btn"></button></div>
            <div class="hint">Tap a square to change · Random rolls the dice</div>
            <nav class="tabs" aria-label="Sheet pages"><button type="button" class="tab on" data-page="face">Face</button><button type="button" class="tab" data-page="kit">Kit</button></nav>
          </div>
          <div class="frame"><div class="jewel l" aria-hidden="true"></div><div class="jewel r" aria-hidden="true"></div>
            <div class="frame-inner"><canvas id="hero-view" width="28" height="72" aria-label="Your hero"></canvas></div></div>
          <div class="sheet-rows"></div>
        </div>`;
      els = { rows: ctx.overlay.querySelector('.sheet-rows'), nameBtn: ctx.overlay.querySelector('#name-btn') };
      heroCtx = ctx.overlay.querySelector('#hero-view').getContext('2d');
      for (const t of ctx.overlay.querySelectorAll('.tab')) t.addEventListener('click', () => {
        page = t.dataset.page;
        for (const x of ctx.overlay.querySelectorAll('.tab')) x.classList.toggle('on', x === t);
        renderRows();
      });
      els.nameBtn.addEventListener('click', openNameSheet);
      const random = document.createElement('button');
      random.type = 'button'; random.id = 'btn-random'; random.className = 'btn-sierra'; random.textContent = 'Random';
      random.addEventListener('click', () => update({ ...randomHero(), name: hero.name }, { rerender: true }));
      const start = document.createElement('button');
      start.type = 'button'; start.id = 'btn-start-game'; start.className = 'btn-sierra go'; start.textContent = 'Start';
      start.addEventListener('click', () => { ctx.hero = hero; ctx.saveHero(hero); game.go('PREVIEW'); });
      ctx.colL.appendChild(random); ctx.colR.appendChild(start);
      els.random = random; els.start = start;
      update(hero, { rerender: true });
      window.__oq && (window.__oq.creator = { get hero() { return hero; }, get page() { return page; } });
    },
    exit(ctx) {
      nameSheet?.remove(); nameSheet = null;
      els.random?.remove(); els.start?.remove();
      ctx.overlay.innerHTML = '';
      els = {}; heroCtx = null;
    },
  };
}
