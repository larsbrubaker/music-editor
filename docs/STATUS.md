# Open work

Working document (see `docs/CLAUDE.md`): only what is still to do, in order. Delete
items as they land and delete the file when it is empty.

1. **Beam creation in the browser.** A scripted sequence creates a beam in Node (the
   Sys E-E reaction wins with bid 50) but an earlier browser run showed a flag on the
   first stem instead. Reproduce with real pointer events through `WinApp` (rounding
   in `toMouseEvent` is the suspect); if it is real, write the failing test first.
2. **Lesson pages.** `site/nav.js` links `lessons/01-warm-up.html` ...
   `08-refactoring-and-appendix.html`; none exist. Each page: the chapter's sections in
   our own words (link to the original text, do not copy it), the real source via
   `<div class="code" data-src="src/...">`, demos via
   `<div class="demo" data-app="Squares2" data-toggles="showSpline:Show spline">`
   (see `site/demo.js`, `site/code.js`, `site/lesson.js`). Demos per chapter:
   1 RedRect/PaintShapes/Paint; 2 Squares1/Squares2/SquaresGame/Squares; 3 none;
   4 PaintInk/ShapeTrainer; 5 ReactionTest; 6 MusicEd; 7 GlyphSheet/MusicEd; 8 SplineDemo.
3. **Publish.** `.github/workflows/deploy.yml` tests and deploys to GitHub Pages; confirm
   https://larsbrubaker.github.io/music-editor/ serves and the font loads there.
4. **Review pass** with the `reviewer` agent over `src/reaction` and `src/music`.
5. Nice to have: mobile/touch check, `Glyph.debugBoxes` toggle in the app, a use for the
   "O" gesture, a README screenshot.
