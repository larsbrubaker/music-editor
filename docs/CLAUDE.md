# docs/ - Working Documents Only

Every document in this folder is a **working document**: it describes work still **to do**, not
work that was done. History lives in git, not here.

Rules:

- A doc exists only while the work it plans is incomplete. **When the work completes, delete the
  doc** in the same change that finishes it.
- Prune as you go: remove completed steps, stale findings, and superseded decisions instead of
  appending status updates. A reader should never have to skip "done" sections to find the open
  work.
- Do not add post-mortems, changelogs, or "how we got here" narrative. If a decision or caveat
  must outlive the doc, record it as a comment at the code it constrains (or in the root
  CLAUDE.md or README.md), then delete it from here.
- When checking whether a doc is still needed, verify against the code - a doc's own status line
  can be stale.
