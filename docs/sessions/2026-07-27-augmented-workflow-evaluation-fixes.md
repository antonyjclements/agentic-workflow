---
title: Evaluate the augmented workflow and fix the findings
date: 2026-07-27
status: unprocessed
tags:
  - workflow
  - evaluation
  - skills
  - specs
---

## What Was Attempted

- Evaluated the workflow for overall quality and fit with more capable models,
  focusing on progressive disclosure and over-narrow instruction.
- Fixed the findings on `claude/augmented-workflow-eval-mwmb1u`, branched fresh from
  `main` after the skill-tracking and e2e work merged.

## What Worked

- Reading decision records before "fixing" anything. Two of six recommendations
  turned out to conflict with, or be explicitly rejected by, active decisions. The
  hook recommendation had already been considered and rejected in
  `2026-07-27-add-opt-in-skill-tracking.md` for a constraint the evaluation had not
  accounted for.
- Negative-testing both new guards in `scripts/test-install.sh` by injecting a
  dangling reference and an oversized skill. A guard that has never failed is not
  known to work.
- Reviewing the diff before stamping the review gate. That pass caught a real
  regression: the spec trim had silently dropped the contract that
  `aw-synthesize-memory` stamps its gate on no-op runs.

## Corrections Made

- **Installed reference docs are not a source the spec can defer to.** The evaluation
  proposed trimming `spec.md` because `docs/workflow/gates.md` already documented the
  CLI surface and config keys. `gates.md` is shipped output; pointing the spec at it
  makes the spec defer to its own product and leaves the installed doc unconstrained.
  The missed assumption was treating a self-hosting repo's install output as if it
  were third-party reference material. Trim reverted, additive criteria kept, captured
  as `docs/learnings/2026-07-27-installed-artifacts-are-spec-output-not-spec-source.md`.
- **Hooks are unavailable in the target environment.** Confirmed by the repo owner,
  not just inferred from the prior decision. Recorded in
  `docs/decisions/2026-07-27-keep-tracking-emit-in-skills.md` so the recommendation is
  not raised a third time.

## Dead Ends

- Considered folding `aw-capture solution` into learnings rather than installing
  `docs/solutions/`. Rejected: `aw-refresh` has a whole mode dedicated to that tree
  and the consolidate decision kept the mode deliberately. Installing the directory
  was the smaller, non-contradicting fix.
- Considered restoring all three of `aw-capture`'s missing reference files
  (`schema.yaml`, `yaml-schema.md`, `resolution-template.md`). Collapsed to one
  `references/solution-doc.md`, since the schema and the category map were the same
  concern split across two files.
- Wrote a `synthesize` gate receipt claiming zero unprocessed session logs. There
  were two, carried in from `main`. Re-stamped with an accurate summary. Receipts
  verify that a summary is recent and non-empty, not that it is true.

## Key Files

- `scripts/test-install.sh` — drift guards, word budgets, registry validation; the
  enforcement point for most of this repo's invariants
- `docs/decisions/2026-07-27-add-opt-in-skill-tracking.md` — the alternatives section
  is where the hook constraint was already recorded
- `skills/aw-review/SKILL.md`, `skills/aw-work/SKILL.md` — where prescription of
  mechanism had accumulated
- `docs/features/augmented-workflow/spec.md` — living intent, including product surface

## Open Questions

- Two session logs from the e2e work remain `status: unprocessed`, and
  `docs/context/wiki.md` (generated 2026-07-14) is behind them. Synthesis is
  outstanding and needs its own `chore(memory)` commit.
- `aw-commit-push-pr`, `aw-resolve-pr-feedback`, and `aw-debug` still assume the `gh`
  CLI. In MCP-first harnesses (Claude Code on the web, this session) `gh` is absent.
  `aw-commit-push-pr` already abstracts the blocking-question tool across harnesses;
  GitHub access has no equivalent abstraction yet. Not addressed in this change.
