// Screen helpers: canvas art, text box DOM, typewriter, controls.
// game.js owns state; this module only draws.

const ASSET_BASE = 'assets/';
const IMAGES = {};
let ctx = null;

export const ART_W = 640;
export const ART_H = 428;

export function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function loadImage(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image failed: ${name}`));
    img.src = `${ASSET_BASE}${name}.png`;
  });
}

/** Preload every image by name; resolves when all are decoded. */
export async function preload(names) {
  const imgs = await Promise.all(names.map(loadImage));
  names.forEach((n, i) => { IMAGES[n] = imgs[i]; });
  if (document.fonts?.load) {
    const cs = getComputedStyle(document.documentElement);
    const body = cs.getPropertyValue('--font-body').trim();
    const small = cs.getPropertyValue('--font-small').trim();
    await Promise.all([
      document.fonts.load(`700 20px ${body}`), document.fonts.load(`400 20px ${body}`),
      document.fonts.load(`700 12px ${small}`), document.fonts.load(`400 12px ${small}`),
    ]).catch(() => {});
  }
}

export function image(name) { return IMAGES[name]; }

export function initCanvas(canvas) {
  ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Draw a full-frame still by asset name. Task 8 replaces this with the animation layer. */
export function drawStill(name) {
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ART_W, ART_H);
  const img = IMAGES[name];
  if (img) ctx.drawImage(img, 0, 0, ART_W, ART_H);
}

/** Title: art plus the white Honeycomb logo near the top, as on the badge. */
export function drawTitle() {
  drawStill('title_screen');
  const logo = IMAGES.hc_logo_white;
  if (logo) {
    const w = logo.width * 2, h = logo.height * 2;
    ctx.drawImage(logo, Math.round((ART_W - w) / 2), 22, w, h);
  }
}

/** 200ms fade-to-black-and-back over the art. Visual only; never delays state. */
export function flashBlack(flashEl) {
  if (reducedMotion()) return;
  flashEl.classList.remove('off');
  flashEl.classList.add('on');
  // force reflow so the transition runs
  void flashEl.offsetWidth;
  flashEl.classList.remove('on');
  flashEl.classList.add('off');
}

/** Measure text width in the body font using an offscreen canvas. */
export function makeMeasure(fontCss) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = fontCss;
  return (s) => c.measureText(s).width;
}

/** Current body font CSS string and metrics from the text box's computed style. */
export function textMetrics(boxEl) {
  const cs = getComputedStyle(boxEl);
  const lineHeight = parseFloat(cs.lineHeight);
  const root = getComputedStyle(document.documentElement);
  const blankHeight = parseFloat(root.getPropertyValue('--blank-h')) || Math.round(lineHeight / 2);
  const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const innerW = boxEl.clientWidth - padX;
  const innerH = boxEl.clientHeight - padY;
  return { lineHeight, blankHeight, font, innerW, innerH };
}

/** Height the narrator header will occupy, measured from a throwaway element. */
export function headerHeight(boxEl) {
  const probe = document.createElement('div');
  probe.className = 'hdr';
  probe.innerHTML = '<span class="name">X</span><span class="title">X</span>';
  probe.style.visibility = 'hidden';
  boxEl.appendChild(probe);
  const h = probe.getBoundingClientRect().height + parseFloat(getComputedStyle(probe).marginBottom);
  probe.remove();
  return h;
}

/** Render a page of lines (and optional header) into the box, with text hidden for typing. */
export function setBoxLines(boxEl, lines, { header = null, cobalt = false, slide = false, ctaIndex = -1 } = {}) {
  boxEl.className = cobalt ? 'cobalt' : '';
  boxEl.innerHTML = '';
  if (header) {
    const h = document.createElement('div');
    h.className = 'hdr';
    h.innerHTML = `<span class="name"></span><span class="title"></span>`;
    h.querySelector('.name').textContent = header.name;
    h.querySelector('.title').textContent = header.title;
    boxEl.appendChild(h);
  }
  const els = lines.map((ln, i) => {
    const d = document.createElement('div');
    d.className = 'line' + (ln === '' ? ' blank' : '') + (i === ctaIndex ? ' cta' : '');
    d.dataset.full = ln;
    d.textContent = '';
    boxEl.appendChild(d);
    return d;
  });
  if (slide && !reducedMotion()) {
    boxEl.classList.add('slide');
    boxEl.addEventListener('animationend', () => boxEl.classList.remove('slide'), { once: true });
  }
  return els;
}

/**
 * Reveal the lines' text character by character.
 * Returns { done: Promise, finishNow(), get typing() }.
 */
export function typewrite(lineEls, { msPerChar = 25, instant = false, onTick } = {}) {
  const full = lineEls.map((el) => el.dataset.full ?? '');
  let li = 0, ci = 0, timer = null, finished = false;
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });

  const showAll = () => {
    lineEls.forEach((el, i) => { el.textContent = full[i]; el.classList.remove('caret'); });
  };
  const finish = () => {
    if (finished) return;
    finished = true;
    if (timer) { clearTimeout(timer); timer = null; }
    showAll();
    resolveDone();
  };
  const step = () => {
    if (finished) return;
    while (li < full.length && ci >= full[li].length) { lineEls[li].classList.remove('caret'); li++; ci = 0; }
    if (li >= full.length) { finish(); return; }
    ci++;
    lineEls[li].textContent = full[li].slice(0, ci);
    lineEls[li].classList.add('caret');
    onTick?.(li, ci);
    timer = setTimeout(step, msPerChar);
  };

  if (instant || reducedMotion()) finish();
  else step();

  return { done, finishNow: finish, get typing() { return !finished; } };
}

/** Render the two-option choice menu into the box. onPick(0|1) is called after the flash. */
export function setChoiceMenu(boxEl, choiceA, choiceB, onPick) {
  boxEl.className = 'cobalt';
  boxEl.innerHTML = '';
  const menu = document.createElement('div');
  menu.className = 'menu';
  const mk = (id, c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.id = id; b.className = 'opt';
    b.innerHTML = `<span class="cursor">&gt;</span><span class="txt"><span class="opt-title"></span><span class="opt-sub"></span></span>`;
    b.querySelector('.opt-title').textContent = c.title;
    b.querySelector('.opt-sub').textContent = c.sub;
    return b;
  };
  const a = mk('opt-a', choiceA), b = mk('opt-b', choiceB);
  a.classList.add('sel');
  let picked = false;
  const pick = (idx, el) => {
    if (picked) return;
    picked = true;
    a.disabled = b.disabled = true;
    a.classList.remove('sel'); b.classList.remove('sel');
    el.classList.add('sel');
    navigator.vibrate?.(15);
    if (reducedMotion()) { onPick(idx); return; }
    let n = 0;
    const t = setInterval(() => {
      el.classList.toggle('flash');
      if (++n >= 4) { clearInterval(t); el.classList.remove('flash'); onPick(idx); }
    }, 70);
  };
  a.addEventListener('click', () => pick(0, a));
  b.addEventListener('click', () => pick(1, b));
  menu.append(a, b);
  boxEl.appendChild(menu);
}
