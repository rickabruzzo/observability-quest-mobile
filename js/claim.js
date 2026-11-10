// Prize claim: placeholder email form now, HubSpot embed slot for later.
//
// ──────────────────────────────────────────────────────────────────────────────
// HUBSPOT SLOT — fill these in after PMM review (from the HubSpot embed snippet).
// With both ids set, mountClaimForm loads js.hsforms.net and renders the real form,
// restyled by css/game.css `.hs-form` rules. Free-email blocking is configured in HubSpot.
// Hidden fields the game fills if they exist on the form: quest_score, quest_event.
// REQUIRED form settings in HubSpot: "Display a thank you message" (NOT redirect to a page) —
// the game advances on onFormSubmitted and a redirect would leave the page. Use the *script*
// embed (hbspt.forms.create), not the iframe embed, so css/game.css can style it.
// ──────────────────────────────────────────────────────────────────────────────
export const HUBSPOT = {
  portalId: '',
  formId: '',
  region: 'na1',
};

const HS_SCRIPT = 'https://js.hsforms.net/forms/embed/v2.js';
const REDEEM_KEY = 'oq.redeemed';
const PENDING_KEY = 'oq.pendingEmail';

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());
}

/** ?e=<code> from the QR URL; letters, digits, _ and - only. */
export function getEventCode(search) {
  const m = /[?&]e=([^&]*)/.exec(search || '');
  if (!m) return '';
  let raw = m[1];
  try { raw = decodeURIComponent(raw); } catch { /* malformed percent-encoding: use it as-is */ }
  return raw.replace(/[^A-Za-z0-9_-]/g, '');
}

/** Email captured by the offline fallback form, shown to staff on the completion screen. */
export const pendingEmail = {
  get() { try { return localStorage.getItem(PENDING_KEY) || ''; } catch { return ''; } },
  set(v) { try { localStorage.setItem(PENDING_KEY, String(v)); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ } },
};

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
export async function mountClaimForm(container, { onSubmitted, loadScript = defaultLoader, score = 0, eventCode = '', readyTimeoutMs = 10000 } = {}) {
  const configured = Boolean(HUBSPOT.portalId && HUBSPOT.formId);
  if (!configured) { renderPlaceholder(container, onSubmitted, { mode: 'placeholder' }); return 'placeholder'; }
  try {
    await loadScript(HS_SCRIPT);
    const hb = globalThis.hbspt;
    if (!hb?.forms?.create) throw new Error('hbspt missing');
    container.innerHTML = '<div class="claim-loading">LOADING FORM&hellip;</div><div id="hs-form" class="hs-slot"></div>';
    const ready = new Promise((resolve) => {
      const t = setTimeout(() => resolve(false), readyTimeoutMs);
      hb.forms.create({
        portalId: HUBSPOT.portalId,
        formId: HUBSPOT.formId,
        region: HUBSPOT.region,
        target: '#hs-form',
        onFormReady: ($form) => {
          clearTimeout(t);
          try {
            const set = (n, v) => {
              const f = $form?.querySelector?.(`[name="${n}"]`);
              if (!f) return;
              f.value = v;
              f.dispatchEvent?.(new Event('input', { bubbles: true }));
              f.dispatchEvent?.(new Event('change', { bubbles: true }));
            };
            set('quest_score', String(score));
            set('quest_event', eventCode);
          } catch { /* ignore */ }
          container.querySelector?.('.claim-loading')?.remove();
          resolve(true);
        },
        onFormSubmitted: () => onSubmitted?.({ mode: 'hubspot' }),
      });
    });
    if (!(await ready)) throw new Error('form not ready');
    return 'hubspot';
  } catch {
    // Offline or HubSpot unreachable: keep the email field so staff can record the address.
    renderPlaceholder(container, onSubmitted, { mode: 'fallback' });
    return 'fallback';
  }
}

function renderPlaceholder(container, onSubmitted, { mode }) {
  const fallback = mode === 'fallback';
  container.innerHTML = `
    <form id="claim-form" class="claim" novalidate>
      <div class="claim-title">${fallback ? 'ALMOST THERE' : 'CLAIM YOUR PRIZE'}</div>
      <div class="claim-sub">${fallback
        ? "We couldn't reach the sign-up form right now. Enter your work email anyway and we'll grab your email at the booth."
        : 'Enter your work email, then show the next screen to Honeycomb booth staff.'}</div>
      <label class="claim-label" for="claim-email">WORK EMAIL</label>
      <input id="claim-email" class="claim-input" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="you@company.com" required>
      <div id="claim-error" class="claim-error" role="alert" aria-live="polite"></div>
      <button id="btn-claim-submit" class="btn btn-go" type="submit">CLAIM PRIZE</button>
      ${fallback ? '' : '<div class="claim-note">Placeholder form — HubSpot embed goes here after review.</div>'}
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
    if (fallback) pendingEmail.set(v);
    onSubmitted?.({ mode, email: v });
  });
}
