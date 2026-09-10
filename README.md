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

See `CLAUDE.md` for the engineering guidelines (test-first bug fixing, the 800
line file limit, project map).
