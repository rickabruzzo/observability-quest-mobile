// Prize claim: placeholder email form now, HubSpot embed slot for later.
//
// ──────────────────────────────────────────────────────────────────────────────
// HUBSPOT SLOT — fill these in after PMM review (from the HubSpot embed snippet).
// With both ids set, mountClaimForm loads js.hsforms.net and renders the real form,
// restyled by css/game.css `.hs-form` rules. Free-email blocking is configured in HubSpot.
// Hidden fields the game fills if they exist on the form: quest_score, quest_event.
// ──────────────────────────────────────────────────────────────────────────────
export const HUBSPOT = {
  portalId: '',
  formId: '',
  region: 'na1',
};

const HS_SCRIPT = 'https://js.hsforms.net/forms/embed/v2.js';
const REDEEM_KEY = 'oq.redeemed';

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

/** ?e=<code> from the QR URL; letters, digits, _ and - only. */
export function getEventCode(search) {
  const m = /[?&]e=([^&]*)/.exec(search || '');
  return m ? decodeURIComponent(m[1]).replace(/[^A-Za-z0-9_-]/g, '') : '';
}

export const redeemed = {
  get() { try { return localStorage.getItem(REDEEM_KEY) === '1'; } catch { return false; } },
  set() { try { localStorage.setItem(REDEEM_KEY, '1'); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem(REDEEM_KEY); } catch { /* ignore */ } },
};

function defaultLoader(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`script failed: ${src}`));
    const t = setTimeout(() => reject(new Error('script timeout')), 8000);
    s.addEventListener('load', () => clearTimeout(t));
    document.head.appendChild(s);
  });
}

/**
 * Mount the claim form into container.
 * Returns 'hubspot' | 'placeholder' | 'fallback'.
 *   placeholder: no HubSpot ids configured — styled email field, submit advances.
 *   hubspot:     embed rendered; onSubmitted fires from HubSpot's callback.
 *   fallback:    HubSpot configured but the script could not load (offline) — message + continue.
 */
export async function mountClaimForm(container, { onSubmitted, loadScript = defaultLoader, score = 0, eventCode = '' } = {}) {
  const configured = Boolean(HUBSPOT.portalId && HUBSPOT.formId);
  if (!configured) { renderPlaceholder(container, onSubmitted); return 'placeholder'; }
  try {
    await loadScript(HS_SCRIPT);
    const hb = globalThis.hbspt;
    if (!hb?.forms?.create) throw new Error('hbspt missing');
    container.innerHTML = '<div id="hs-form" class="hs-slot"></div>';
    hb.forms.create({
      portalId: HUBSPOT.portalId,
      formId: HUBSPOT.formId,
      region: HUBSPOT.region,
      target: '#hs-form',
      onFormReady: ($form) => {
        try {
          const set = (n, v) => { const f = $form?.querySelector?.(`[name="${n}"]`); if (f) f.value = v; };
          set('quest_score', String(score));
          set('quest_event', eventCode);
        } catch { /* ignore */ }
      },
      onFormSubmitted: () => onSubmitted?.({ mode: 'hubspot' }),
    });
    return 'hubspot';
  } catch {
    renderFallback(container, onSubmitted);
    return 'fallback';
  }
}

function renderPlaceholder(container, onSubmitted) {
  container.innerHTML = `
    <form id="claim-form" class="claim" novalidate>
      <div class="claim-title">CLAIM YOUR PRIZE</div>
      <div class="claim-sub">Enter your work email, then show the next screen to Honeycomb booth staff.</div>
      <label class="claim-label" for="claim-email">WORK EMAIL</label>
      <input id="claim-email" class="claim-input" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@company.com" required>
      <div id="claim-error" class="claim-error" role="alert" aria-live="polite"></div>
      <button id="btn-claim-submit" class="btn btn-go" type="submit">CLAIM PRIZE</button>
      <div class="claim-note">Placeholder form — HubSpot embed goes here after review.</div>
    </form>`;
  const form = container.querySelector?.('#claim-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector('#claim-email');
    const err = form.querySelector('#claim-error');
    const v = input.value.trim();
    if (!isValidEmail(v)) { err.textContent = 'That doesn\'t look like an email address.'; input.focus(); return; }
    err.textContent = '';
    onSubmitted?.({ mode: 'placeholder', email: v });
  });
}

function renderFallback(container, onSubmitted) {
  container.innerHTML = `
    <div class="claim">
      <div class="claim-title">ALMOST THERE</div>
      <div class="claim-sub">We couldn't reach the sign-up form right now. We'll grab your email at the booth.</div>
      <button id="btn-claim-continue" class="btn btn-go" type="button">CONTINUE</button>
    </div>`;
  container.querySelector?.('#btn-claim-continue')?.addEventListener('click', () => onSubmitted?.({ mode: 'fallback' }));
}
