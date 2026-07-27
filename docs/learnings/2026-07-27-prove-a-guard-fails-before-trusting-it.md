---
title: Prove a guard fails before trusting it
scope: repo
created: 2026-07-27
trigger: pattern
status: active
evidence-count: 3
unconfirmed-runs: 0
derived-from:
  - docs/sessions/2026-07-26-e2e-testing-workflow-integration.md
  - docs/sessions/2026-07-26-e2e-suggest-flag-2.md
  - docs/sessions/2026-07-27-augmented-workflow-evaluation-fixes.md
tags:
  - testing
  - enforcement
  - aw-gate
---

# Prove a guard fails before trusting it

## Lesson

A check that has only ever passed is not known to work. Every guard added to
`scripts/test-install.sh` or `.scripts/aw-gate.js` must be shown to fail on a
deliberately broken input before it is trusted, because the common failure mode is
silent: the guard runs, reports success, and enforces nothing. Three separate
sessions shipped or nearly shipped a check that was green for the wrong reason.

## Applies When

- Adding a check to `scripts/test-install.sh` or a subcommand to `.scripts/aw-gate.js`
- Adding a gate, marker detector, drift guard, or budget assertion
- Changing flag parsing, pathspec handling, or scoping on an existing check
- Any time a check's passing output would look identical whether it worked or not

## Do Instead

- Inject the exact violation the guard exists to catch, confirm a non-zero exit and
  the expected message, then restore. Do this in the same session, not later.
- Test the excluded and near-miss cases too, not just the positive one — a pathspec
  union broke `:(exclude)` semantics while still passing the happy path.
- Prefer a scratch repo or a temporary edit over reasoning about whether it would
  fire.
- Treat a guard that cannot be made to fail as evidence the guard is wrong, not as
  evidence the code is clean.

## Evidence

- `2026-07-26-e2e-testing-workflow-integration.md`: "Scratch-repo empirical testing of
  `aw-gate.js` changes (marked/unmarked/near-miss/excluded cases) before each commit,
  catching real bugs pre-ship." The same session's first test-path fix "unioned the
  pathspec lists, breaking `:(exclude)` semantics."
- `2026-07-26-e2e-suggest-flag-2.md`: `parseFlags` bound the following token as a
  flag's value, so `--suggest-e2e` failed its `=== true` check silently, printed
  "trace clean" for an advisory request, and exited 1 on repos with real gaps.
- `2026-07-27-augmented-workflow-evaluation-fixes.md`: both new `test-install.sh`
  guards were negative-tested by injecting a dangling reference and an oversized
  skill; both fired. "A guard that has never failed is not known to work."
