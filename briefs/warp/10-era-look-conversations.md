# Warp brief 10 — era-look fork: the persona speaks from a close-up portrait

Read `briefs/warp/PROTOCOL.md` and `briefs/PROTOCOL.md` first, **and the fork rule in `briefs/PROTOCOL.md`**:
this is for the `era-look` fork. Branch `warp/era-conversations` from `origin/era-look`; the pull request's
base is `era-look`. Do it **after brief 09**. Scenario 1 is enough to build and test it on: the window is driven
by the chapter's data, so scenarios 2 to 5 get it when brief 08 lands.

## Why

In Rick's references a person standing in a room is a simple figure, and their face only gets detail when they
speak: a framed portrait beside the words. Rick, 2026-11-13: "the NPC interactions should go back to the
close-up portrait look." The personas in the rooms are now simple figures, so their lines need a face.

## What is ready (built on this branch; do not rebuild)

For each persona `p1`–`p5` (scenario 1's CTO to scenario 5's release engineer), in the narrators' format, so
`js/anim/portrait.js` plays them as it plays the narrators:

- `assets/portrait_p<n>.png`: 640×428, head and shoulders on black;
- `assets/anim/portrait_p<n>_blink.png`, `_talk1.png`, `_talk2.png`, each with a `.json` giving where the patch
  goes (`x, y, w, h` in the 640×428 picture). A patch is transparent wherever the art did not change.

Tool: `tools/build_persona_portraits.py`. Source: `art-drops/2026-11-13-era-look-portraits/`.

## Build

1. **A conversation window.** Whenever the persona speaks, the message window grows a portrait on its left:
   - the picture is the square **x 170–470, y 20–320** of the 640×428 portrait (head and shoulders), shown at
     the height of four lines of text and never under 96 CSS px on a 667×375 phone;
   - a 2 px dark frame round it, the window's own colours, nothing ornate: it is our window, not a copy of any
     game's;
   - the persona's name above the words (`chN.persona.name`), in the accent colour;
   - the words to the right, with the usual line cap and paging.
2. **Which lines are the persona's.** A line whose text starts with the persona's title and a colon (`CLOUD
   ENGINEER: …`) is theirs: show it in the conversation window and **drop the prefix**, since the name is on
   the window. That covers `npc.call.*`, `npc.ask`, `hero.line` and any `decide.*` reply written that way.
   Narration that only quotes them (`"Try again," she says.`) stays an ordinary window. Each chapter's data
   names its portrait (`persona.portrait: 'p2'`); nothing in the window's code names a persona.
3. **It moves like the narrators.** While the words are typing: rest → talk1 → talk2 → talk1, about 120 ms a
   frame; when they stop, the mouth rests. A blink every few seconds, on its own schedule per persona (the
   seed `blinkOpen` already takes). Reduced motion: the still only.
4. **The room keeps going behind it.** The persona's talk frames in the room still play while they speak, as
   brief 08 has them. The window sits where it hides neither figure: top left for rooms whose persona is on
   the right, top right for room 3.
5. **Scenario 1 too.** The CTO's lines get the same window with `p1`.

## Not in this brief

The persona card (brief 07) is unchanged: it still opens the first time you talk to them, and the conversation
window follows it. Charity's verdict keeps its own full-scene portrait.

## Tests

- Unit: which lines count as the persona's (prefix, no prefix, narration that quotes them); the prefix is
  dropped from what is shown and from nothing else; the mouth frame while typing and at rest; reduced motion.
- e2e: in scenario 1 the CTO's first line shows the window with her name and a portrait whose natural size is
  not zero; the window fits inside the scene at 667×375 and 844×390 and does not cover the hero or the CTO; a
  narration line shows no portrait.

## Hand-back

`handbacks/<date>-warp-era-conversations.md` on the branch: what you built, the suites' counts, a screenshot of
the window in two rooms (`scratch/` is fine), and anything you changed in this brief's numbers.
