// Full screen and landscape where the phone allows it (brief 13 C). Android Chrome can hide its bars and turn the screen
// inside a tap; an iPhone cannot (no Fullscreen API for a page), and a Home Screen app has no bars to hide. A desktop
// never goes full screen: Rick's laptop and the test runs stay windowed.

/** True only on a touch screen, with the API present, not already full screen, and not opened from the Home Screen. */
export function shouldGoFullscreen({ coarsePointer = false, standalone = false, fullscreenNow = false, canFullscreen = false } = {}) {
  return !!coarsePointer && !!canFullscreen && !fullscreenNow && !standalone;
}

/** Reads the four facts off a window. Any part missing reads as "no". */
export function detectFullscreen(win = globalThis) {
  const mq = (q) => { try { return !!win.matchMedia?.(q)?.matches; } catch { return false; } };
  const doc = win.document;
  return {
    coarsePointer: mq('(pointer: coarse)'),
    standalone: mq('(display-mode: fullscreen), (display-mode: standalone)') || win.navigator?.standalone === true,
    fullscreenNow: !!doc?.fullscreenElement,
    canFullscreen: typeof doc?.documentElement?.requestFullscreen === 'function',
  };
}

/** Asks for full screen with the browser's UI hidden, then locks landscape. Every failure is swallowed; the result says what happened. */
export async function goFullscreen({ doc = globalThis.document, screen = globalThis.screen } = {}) {
  const result = { fullscreen: false, locked: false };
  try { await doc.documentElement.requestFullscreen({ navigationUI: 'hide' }); result.fullscreen = true; } catch { return result; }
  try { await screen.orientation.lock('landscape'); result.locked = true; } catch { /* the phone keeps its own orientation */ }
  return result;
}
