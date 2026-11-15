// Full screen and landscape where the phone allows it (brief 13 C). Android Chrome can hide its bars and turn the screen
// inside a tap; an iPhone cannot (no Fullscreen API for a page), and a Home Screen app has no bars to hide. A desktop
// never goes full screen: Rick's laptop and the test runs stay windowed. An iPad has the API, but its Safari takes a
// tap-driven game's taps for typing on a fake keyboard, warns, and throws the page out of full screen (WebKit bug 206853),
// so nothing made by Apple goes full screen by itself (review of brief 13).

/** True only on a touch screen that is not an iPhone or iPad, with the API present, not already full screen, and not opened from the Home Screen. */
export function shouldGoFullscreen({ coarsePointer = false, standalone = false, ios = false, fullscreenNow = false, canFullscreen = false } = {}) {
  return !!coarsePointer && !!canFullscreen && !fullscreenNow && !standalone && !ios;
}

/** Reads the facts off a window. Any part missing reads as "no". `navigator.standalone` is a boolean on iOS and iPadOS and absent everywhere else. */
export function detectFullscreen(win = globalThis) {
  const mq = (q) => { try { return !!win.matchMedia?.(q)?.matches; } catch { return false; } };
  const doc = win.document;
  return {
    coarsePointer: mq('(pointer: coarse)'),
    standalone: mq('(display-mode: fullscreen), (display-mode: standalone)') || win.navigator?.standalone === true,
    ios: typeof win.navigator?.standalone === 'boolean',
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
