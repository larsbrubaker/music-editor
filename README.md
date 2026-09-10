# music-editor

A gesture based music notation editor, written in JavaScript by following
Marlin Eller's course *Intermediate Java* step by step. The course builds a
"Reaction Architecture" (every mark on the page bids for each pen stroke) and
uses it to enter music notation with compass gestures. This repo ports every
step of that course to the browser and presents the lessons, the working demo
for each step, and the finished editor as a static site.

- **Site:** https://larsbrubaker.github.io/music-editor/
- **Original course:** https://depts.washington.edu/cprogs/BCS/Books/BCS_MidJava.html

## Run locally

```bash
bun dev          # static server with live reload at http://localhost:3000/
npm test         # node --test tests/  (headless, < 1s)
```

No build step and no dependencies: the site is the repo.

Open work, if any, is planned in `docs/` (working documents only, see `docs/CLAUDE.md`). See `CLAUDE.md` for the engineering guidelines (test-first bug fixing, the 800
line file limit, project map).

## How the pieces fit

Mouse → `WinApp` → `Gesture.AREA` → `Ink.BUFFER` → `new Ink()` (Norm + VS) →
`Shape.recognize` (nearest prototype, or DOT) → `Gesture` → `Reaction.best` (every
enabled reaction for that shape bids; lowest wins) → `act` → new or changed `Mass`
in a `Layer` → `paintComponent` shows `Layer.ALL`. Undo pops the gesture list,
wipes the layers and reactions, and replays what is left.

## Where this port deviates from the course

Each of these is explained in a comment at the code:

- `HC.v()` sums offsets down to ZERO (the course text's version returns 0 at the page top).
- `Ink.Buffer` resamples strokes by arc length by default, because pointer events on a
  fast flick deliver very few samples; the course's index sub-sampling is kept behind
  `Ink.Buffer.arcLength = false`.
- Reactions take `bid`/`act` as arrow functions instead of anonymous subclasses with `Box.this`.
- Array subclasses declare `Symbol.species`; `Mass` needs no `equals/hashCode` fix in JS.
- The accidental glyph codes and offsets (`Glyph.SHARP/FLAT/NATURAL`) were found by
  rendering the font; the course never lists them.
