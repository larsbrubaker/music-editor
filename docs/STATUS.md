# Open work

Working document (see `docs/CLAUDE.md`): only what is still to do, in order. Delete
items as they land and delete the file when it is empty.

1. **Review fixes.** The reviewer pass over `src/reaction` and `src/music` found: Rest
   E-E/W-W bids with no y bound; `Key.gapForGlyph` inverted in H; `Bar.barType` mixing
   the 0..2 shape with the LEFT/RIGHT dot bits; Head DOT bidding with no stem (a no-op
   on the undo list); plus small ones (PaintInk leaving `Ink.Buffer.arcLength` set,
   Head stem bid going negative, `Trainer.removePrototype` box index, dead code,
   missing `barContinues` test). Fix test-first, then a second reviewer pass, then commit.
2. Nice to have: a use for the "O" gesture, a README screenshot.
