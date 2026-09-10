---
name: file-size-refactoring
description: Guidance for fixing file size violations reported by tests/file-compliance.test.js. Use when a source file exceeds 800 non-empty lines. Explains how to reduce file size by splitting responsibilities, never by compressing code.
---

# File Size Refactoring

## Why the limit exists

A smaller file is easier for a human to understand, navigate, and maintain. When a file grows beyond ~800 meaningful lines it has almost always accumulated too many responsibilities. Hitting the limit is a healthy signal that the file deserves structural attention.

The correct response is always to **decompose the file into smaller, cohesive pieces**, never to compress the existing code to squeeze under the limit.

## What the test measures

`tests/file-compliance.test.js` counts **non-empty lines** (blank and whitespace-only lines excluded) in every `.js`, `.html` and `.css` file outside `assets/`. A file fails above **800**, or above its entry in `EXPLICIT_LIMITS` for a frozen legacy file (there are none today; limits may only ever go down).

## The only valid approaches

1. **Remove dead code** - unused methods, commented-out blocks, debug leftovers.
2. **Extract by responsibility** - e.g. the reactions a `Staff` adds are already grouped into `addBarReactions()`, `addNoteReactions()`, `addClefReactions()`; the next step would be a `StaffReactions.js` module that installs them.
3. **Extract by feature** - all the key-signature drawing into `Key.js`, all sloped-line math into `Beam.js` statics (as the course did).
4. **Extract via composition** - a collaborator the original object owns and delegates to (`Stem.List`, `Time.List`).
5. **Split a lesson page** - a chapter page that grows too large becomes two pages, split at a course section boundary.

## How to evaluate an extraction
- Can you give the new file a clear, purposeful name?
- Does it represent a cohesive concept a reader would expect to find on its own?
- Why did the file grow? Answer that before choosing the split.

## What NOT to do
- Don't remove blank lines, comments or whitespace to shrink a file.
- Don't join statements onto one line or shorten names.
- Don't add to `EXPLICIT_LIMITS`; it exists only to freeze legacy files and shrink.
- Don't create artificial splits ("Staff part 2"). If you can't name it well, don't split it there.

## After refactoring
Run `node --test tests/file-compliance.test.js`, then the whole suite.
