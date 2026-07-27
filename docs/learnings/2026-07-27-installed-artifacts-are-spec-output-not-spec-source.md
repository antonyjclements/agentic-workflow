---
title: Installed reference docs are spec output, not a source the spec defers to
scope: repo
created: 2026-07-27
trigger: correction
status: tentative
evidence-count: 1
unconfirmed-runs: 0
derived-from:
  - 2026-07-27-augmented-workflow-evaluation-fixes
tags:
  - specs
  - self-hosting
  - documentation
---

# Installed reference docs are spec output, not a source the spec defers to

## Lesson

In this self-hosting repo, `docs/workflow/gates.md`, `docs/workflow/README.md`, and
the other `skills/aw-init/artifacts/` outputs are **artifacts the product ships**.
They are not reference material the living spec can delegate to. CLI subcommand
names, flags, config keys, exit codes, and file paths are this product's observable
surface, which makes them durable intent — they belong in
`docs/features/augmented-workflow/spec.md`.

## Applies When

- Editing `docs/features/augmented-workflow/spec.md` and it looks like it
  "duplicates" `docs/workflow/gates.md` or `docs/workflow/README.md`
- Reasoning about what counts as implementation detail in a repo that dogfoods its
  own installer output
- Any repo whose product *is* documentation plus tooling, where the deliverable and
  the reference manual are the same file

## Do Instead

- Keep the CLI surface and config schema in the spec. Treat `gates.md` as output
  that must conform to it.
- Test the direction of the dependency before trimming: if removing a line from the
  spec means nothing constrains what the installed doc says, the line was load-bearing
  spec content and the trim is circular.
- Reserve "this is mechanism, cut it" for genuinely internal detail — algorithms,
  data structures, control flow — not for the names and flags users type.
- Distinguish the three artifact types explicitly: spec = durable intent and observable
  surface; plan = disposable sequencing; installed reference doc = shipped output.

## Evidence

An evaluation recommended trimming `spec.md` on the grounds that it had "drifted from
durable intent into a mechanism changelog," and moved receipt, trace, workflow-trace,
and pin detail out on the grounds that `gates.md` already documented it. The repo owner
corrected this: `gates.md` is what gets installed into consumer repos, so pointing the
spec at it makes the spec defer to its own output and leaves the shipped doc
unconstrained. The trim was reverted; only additive acceptance criteria were kept.
