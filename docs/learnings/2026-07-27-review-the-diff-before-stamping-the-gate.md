---
title: Review the diff before stamping the gate, not after
scope: repo
created: 2026-07-27
trigger: correction
status: tentative
evidence-count: 2
unconfirmed-runs: 0
derived-from:
  - docs/sessions/2026-07-26-e2e-suggest-flag-2.md
  - docs/sessions/2026-07-27-augmented-workflow-evaluation-fixes.md
tags:
  - workflow
  - review
  - enforcement
---

# Review the diff before stamping the gate, not after

## Lesson

The freshness gate records that review happened; it cannot tell whether the review
was any good. A receipt is checked for recency and a non-empty summary, not for
truth — an inaccurate summary stamps just as cleanly as an accurate one. So the
protection comes entirely from actually reading the diff before writing the receipt.
In two consecutive sessions, that read caught a defect that every automated check had
passed.

## Applies When

- About to run `aw-gate.js receipt <gate>` followed by `record <gate>`
- Tests, lint, and build are green and the work feels finished
- Writing any receipt summary that asserts a fact about repo state

## Do Instead

- Read the actual diff — `git diff origin/main` — before writing the receipt, and
  write the summary from what the diff shows rather than from what was intended.
- Verify the claims in the summary itself. State counts and statuses you have just
  checked, not ones you remember.
- When a receipt turns out to be wrong, re-stamp with a corrected summary rather than
  leaving the inaccurate one; the audit trail is the point.
- Treat a green test suite as a precondition for review, not a substitute for it.

## Evidence

- `2026-07-26-e2e-suggest-flag-2.md`: review of `1831bf2` caught the `parseFlags`
  binding bug after the change was already committed and the suite was green.
- `2026-07-27-augmented-workflow-evaluation-fixes.md`: reviewing the diff before
  stamping caught a spec trim that had silently dropped the contract that
  `aw-synthesize-memory` stamps its gate on no-op runs. The same session wrote a
  `synthesize` receipt claiming zero unprocessed session logs when there were two,
  and had to re-stamp: "Receipts verify that a summary is recent and non-empty, not
  that it is true."
