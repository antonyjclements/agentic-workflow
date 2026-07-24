---
title: Configure implementation test policy
date: 2026-06-07
status: active
tags:
  - workflow
  - testing
  - configuration
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Configure implementation test policy

## Context

Implementation skills previously honored TDD, test-first, or characterization guidance when a plan explicitly included it. Specs often contain acceptance criteria, but the workflow did not consistently require agents to map those criteria to tests or manual checks.

## Decision

Add `workflow.implementation.test_policy` to `docs/workflow/config.yml`.

The default policy is `acceptance-first`. Supported values are:

- `acceptance-first`
- `tdd`
- `bdd`
- `characterization-first`
- `test-after`
- `manual-verification`
- `none`

`aw-plan` should derive test scenarios from spec or ticket acceptance criteria when available. `aw-work` and replacement work skills should apply the effective policy and report tests, manual checks, acceptance coverage, and justified exceptions.

## Consequences

- Testing discipline becomes repo policy rather than agent preference.
- Repos can choose a policy appropriate to their codebase and risk profile.
- Acceptance criteria become stronger handoff material for implementation and compliance checks.
- Policies such as `manual-verification` and `none` remain explicit instead of being accidental omissions.
