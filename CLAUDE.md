# Claude Code Guidelines

## Philosophy

**YAGNI** - Don't build features until needed. Write the simplest code that works today.

**Circumstances alter cases** - Use judgment. There are no rigid rules; context determines the right approach.

**Quality through iterations** - Start fast and simple, then improve to meet actual needs. Code that doesn't matter can be quick and dirty. But code that matters *really* matters; treat it with respect and improve it meticulously.

**Stay faithful to the course** - This repo is a JavaScript port of Marlin Eller's *Intermediate Java* course (a gesture based music notation editor). Keep class names, method names and the shape of the code recognizably the same as the course so that a reader can follow the lessons side by side with the code. Where JavaScript forces a difference (arrow functions instead of `Box.this`, `Math.trunc` for int division, no static-init order rules) say so in a comment.

## Test-First Bug Fixing (Critical Practice)

**This is the single most important practice for agent performance and reliability.**

When a bug is reported, always follow this workflow:

1. **Write a reproducing test first** - Create a test that fails, demonstrating the bug
2. **Fix the bug** - Make the minimal change needed to address the issue
3. **Verify via passing test** - The previously failing test should now pass

**Do not skip the reproducing test.** Even if the fix seems obvious, the test validates your understanding and prevents regressions.

## Testing

- Tests MUST test actual production code, not copies. Import the real modules under `src/`; never re-implement logic in a test.
- Tests should run as fast as possible. The whole suite runs headless in well under a second.
- Write tests for regressions and complex logic (recognition math, bidding, stem/beam layout, undo replay).
- Avoid redundant tests that verify the same behavior.
- All tests must pass before merging.
- **Prefer headless unit tests over browser tests.** Drawing code is tested with `tests/helpers/RecordingGraphics.js`, a fake `Graphics` that records calls; mouse input is tested by driving `Gesture.AREA` or the app's `mousePressed/Dragged/Released` with synthetic strokes from `tests/helpers/strokes.js`. Only check in the browser what genuinely needs a browser (font rendering, event wiring).
- Anything that needs a browser API (canvas, fonts, localStorage, fetch) must be reachable without it: guard with feature checks and keep the logic in a method that a Node test can call.
- When test failures occur, use the fix-test-failures agent (`.claude/agents/fix-test-failures.md`). It treats all failures as real bugs and resolves them through instrumentation and root cause analysis, never by weakening tests.

## Project Context

- **Language:** JavaScript (ES modules), no build step, no dependencies. Runs directly in the browser and on GitHub Pages.
- **Runtime for tests:** Node >= 22, built-in `node:test` runner.
- **Dev server:** `bun dev` (Bun; `scripts/dev.js` serves the repo and live-reloads on change).
- **Test:** `npm test` or `node --test tests/*.test.js`
- **Shape database:** `node scripts/gen-shapes.js` regenerates `assets/shapes.json` from synthetic strokes through the real pipeline.

### Project Map

- `src/graphics/` - the course's `graphics` package: `G` (V, VS, LoHi, BBox, PL, HC, Transform), `WinApp` (canvas harness that mimics the Swing helper), `Graphics` (canvas shim for `java.awt.Graphics`), `Color`, `UC` (all magic numbers)
- `src/reaction/` - the Reaction Architecture: `Ink`, `Shape` (+Prototype, Database, Trainer), `Reaction`, `Layer`, `Mass`, `Gesture`, `World`
- `src/music/` - the music notation model: `Page`, `Sys`, `Staff`, `Bar`, `Time`, `Duration`, `Rest`, `Head`, `Stem`, `Beam`, `Clef`, `Key`, `Glyph`, and the `MusicEd` app
- `src/sandbox/` - the lesson-by-lesson demo apps (RedRect, Paint, Squares..., PaintInk, ShapeTrainer, ReactionTest, GlyphSheet, SplineDemo)
- `lessons/` - one page per course chapter; `site/` - shared css/js for the lesson pages; `app/` - the finished editor
- `assets/` - the Sinfonia music font, images, `shapes.json`
- `tests/` - all tests (`*.test.js`) and `tests/helpers/`
- `scripts/` - dev server and generators

### Where things go

- Generic 2D helpers with no notion of music or gestures: `src/graphics/G.js`
- Anything about ink, recognition, bidding, layers or undo: `src/reaction/`
- Anything that knows what a staff or a note is: `src/music/`
- Throwaway experiments and lesson demos: `src/sandbox/`
- Every magic number: `src/graphics/UC.js`

## Code Quality

**File size** - Every source file stays under **800 non-empty lines**, enforced by `tests/file-compliance.test.js`. When a file grows past that it has picked up too many responsibilities: split it by responsibility (see `.claude/skills/file-size-refactoring`), never by squeezing out blank lines or comments.

**Names** - Choose carefully. Good names make code self-documenting. Follow the course's names where one exists.

**Comments** - Explain *why*, not *what*. When investigating code, persist what you learn: add a comment where non-obvious logic required investigation. If behavior surprised you, it will surprise the next reader.

**Refactoring** - Improve code when it serves a purpose, not for aesthetics. Refactor to fix bugs, add features, or improve clarity when you're already working in that area.

**Java to JavaScript** - Integer math matters: use `idiv()` from `G.js` wherever the Java did an int division. Array subclasses must declare `static get [Symbol.species]() { return Array; }` so `map`/`filter` do not construct new lists. Static-field initialization order is real: create a Map before the constructor that writes to it.

**Copyright** - Source files are MIT licensed to Lars Brubaker (2026). The design and the original Java belong to Marlin Eller's course; keep the attribution in `README.md`.

## Orchestration pattern

The main session acts as planner and orchestrator. Implementation of a scoped step is delegated to the `implementer` subagent, and post-change review to the `reviewer` subagent, whenever a change is more than trivial. The main session owns planning, architecture decisions, acceptance criteria, and synthesizing subagent results. Trivial changes (a one-line fix with its test) may be done directly, but still get a reviewer pass before a commit that touches `src/reaction` or `src/music`.
