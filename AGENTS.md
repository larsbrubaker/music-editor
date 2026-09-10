# Agent project instructions

## Engineering guidance

Read `CLAUDE.md` for engineering philosophy, test-first bug fixing, test commands,
the project map, and code quality rules (including the 800 non-empty line file
limit enforced by `tests/file-compliance.test.js`). Apply the applicable guidance
in the area being changed. Tool names and `.claude/agents/` references are Claude
Code configuration; other agent runtimes should read the role files under
`.claude/agents/` and apply their instructions to the equivalent role.

## Supervisor, implementer, and reviewer

The main session is the supervisor. It owns user intent, planning, architecture
decisions, acceptance criteria, and the final report. It may inspect files and run
verification. Non-trivial implementation is delegated to an implementer and
post-change review to a separate, read-only reviewer.

1. Inspect the working tree and relevant guidance. Preserve existing user changes.
   Define a bounded implementation step with explicit file boundaries.
2. Give the implementer an acceptance brief: original user intent, scoped change,
   allowed files, relevant existing changes, constraints, and the evidence needed
   to show the requested behavior works (a failing test first, for a bug).
3. Have the implementer complete that step and report actual verification results
   (`node --test tests/`).
4. Give a separate reviewer the brief, the diff, and the verification results.
   Require an independent trace through the affected behavior, not just "tests pass".
5. Send actionable findings back to the implementer. Then advance to the next step.
6. Report completed behavior, actual checks, and material remaining limitations.
   Never claim independent review or passing tests that did not occur.

Keep trivial changes lightweight. Implementers and reviewers do not delegate
recursively; they return scope questions and findings to the supervisor.
