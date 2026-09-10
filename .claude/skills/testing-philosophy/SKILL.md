---
name: testing-philosophy
description: "Guidance on writing and running tests in this project: the node:test runner, headless testing of canvas apps with RecordingGraphics, driving gestures with synthetic strokes, and what is worth testing."
---

# Testing Philosophy

Tests exist to give us **confidence to change code**. They are most valuable when fast (so they get run), when they exercise real behavior, and when a failure says what went wrong.

## Runner

Node's built in runner, no dependencies:
```bash
node --test tests/                              # everything
node --test tests/recognition.test.js           # one file
node --test --test-name-pattern="undo" tests/   # by name
```
Files are `tests/*.test.js`, using `import { test } from 'node:test'` and `node:assert/strict`.

## Headless by design

The apps are canvas apps, but nothing in `src/` needs a browser to be tested:

- **Drawing**: pass `new RecordingGraphics()` (`tests/helpers/RecordingGraphics.js`) to any `paintComponent`/`show`. It records every call with its color; assert on `g.named('drawLine')`, `g.named('fillPolygon')`, the glyph characters passed to `drawString`, etc.
- **Mouse strokes**: `tests/helpers/strokes.js` makes synthetic strokes (`compassStroke('S-S', {...})`, `circleStroke`) and feeds them through `Ink.BUFFER` (`inkFromPoints`) or through an area (`gesture(Gesture.AREA, points)`), exactly as the mouse handlers would.
- **Recognition**: tests load `assets/shapes.json` into `Shape.DB` and call `Shape.recognize(ink)` on the real pipeline.
- **Apps**: `new MusicEd()` in Node; drive `Gesture.AREA`; inspect `Layer.ALL`, `app.PAGE`, the masses.

Anything that touches `window`, `document`, `fetch`, `FontFace` or `localStorage` is feature-guarded so that it degrades to a no-op under Node.

## What to test
- **Bug fixes**: a regression test first, always.
- **Complex logic**: normalization and distance math, bidding order, stem length rules, wrong-side layout, beam stacks, undo replay.
- **Data**: `shapes.json` round trips; every shipped gesture recognizes at several sizes with jitter.

## What not to test
- One-line getters, pure wiring, the demos' cosmetic details.

## Speed and isolation
- Static state (`Shape.DB`, `Layer.ALL`, `Reaction.byShape`, `Gesture.UNDO`, `Ink.BUFFER`) is shared. Use `World.reset()` (or `new MusicEd()`, which calls it) in `beforeEach`.
- Node runs each test file in its own process; within a file, tests run sequentially.

## Bug fix workflow
1. Reproduce. 2. Write the failing test. 3. See it fail. 4. Fix production code. 5. See it pass. 6. Commit test and fix together.

## Browser checks
Only for what a Node test cannot see: that the Sinfonia font renders the glyph at the expected hot spot, that pointer events map to canvas coordinates under CSS scaling. Do those with the dev server (`bun dev`) and the browser, and keep the logic they exercise in methods that also have a headless test.
