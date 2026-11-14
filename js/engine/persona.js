// The persona card (Warp brief 07), the pure part: the stats, the picture, the options a conversation ends in.
// The card's DOM is js/screens/chapter.js; whether it opens is the scenario's (firstTalk in scenario.js).

/** The script's option slots that every conversation with the persona may end in. */
export const OPTION_KEYS = { show: 'persona.show', leave: 'persona.leave' };

/** `Name number · Name number · …` → [[name, number], …]. A part with no number keeps its text and an empty number. */
export function parseStats(text) {
  return String(text).split(/\s*·\s*/).filter(Boolean).map((s) => {
    const m = s.match(/^(.*?)\s+(\d+)$/);
    return m ? [m[1], m[2]] : [s, ''];
  });
}

/**
 * What the card's picture is: the card art when the chapter names one and it exists, else the persona cropped
 * from the room plate ({ image, x, y, w, h } in the 320×200 scene). The card is never empty.
 */
export function cardPicture(persona, hasArt) {
  if (persona.art && hasArt) return { kind: 'art', src: persona.art };
  return { kind: 'crop', ...persona.crop };
}

/**
 * The options the persona's conversation ends in: before a tool has been tried, show the card again or leave;
 * after, the decision (the wrong instinct, Honeycomb) and the card again. Showing the card is never a wrong choice.
 */
export function personaOptions(s) {
  return s.tried ? ['sign', 'hc', 'show'] : ['show', 'leave'];
}
