# Open work

Working document (see `docs/CLAUDE.md`): only what is still to do, in order. Delete
items as they land and delete the file when it is empty.

1. **Lesson pages.** `site/nav.js` links `lessons/01-warm-up.html` ...
   `08-refactoring-and-appendix.html`; none exist. Each page: the chapter's sections in
   our own words (link to the original text, do not copy it), the real source via
   `<div class="code" data-src="src/...">`, demos via
   `<div class="demo" data-app="Squares2" data-toggles="showSpline:Show spline">`
   (see `site/demo.js`, `site/code.js`, `site/lesson.js`). Demos per chapter:
   1 RedRect/PaintShapes/Paint; 2 Squares1/Squares2/SquaresGame/Squares; 3 none;
   4 PaintInk/ShapeTrainer; 5 ReactionTest; 6 MusicEd; 7 GlyphSheet/MusicEd; 8 SplineDemo.
2. **Review pass** with the `reviewer` agent over `src/reaction` and `src/music`.
3. Nice to have: mobile/touch check, `Glyph.debugBoxes` toggle in the app, a use for the
   "O" gesture, a README screenshot.
