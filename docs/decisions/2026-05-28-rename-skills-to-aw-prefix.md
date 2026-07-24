---
title: Rename skills to aw prefix
date: 2026-05-28
status: active
tags:
  - workflow
  - skills
  - naming
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Rename Skills to aw Prefix

## Context

The workflow skill set started from Compound Engineering `ce-*` naming, but Augmented Workflow has diverged into its own portable workflow with repo-local templates, PRD authoring/import separation, brainstorm-to-spec behavior, installer ownership, and docs-as-source-of-truth conventions.

The sole current consumer can tolerate a hard rename without a compatibility period.

## Decision

Rename retained skills from `ce-*` to `aw-*`, where `aw` stands for Augmented Workflow.

Remove `ce-dogfood-beta` and `ce-test-browser` from the bundled skill set instead of renaming them.

Update installer cleanup so old `ce-*` skills and removed `aw-*` skills are deleted from the global skills directory during install.

## Consequences

`aw-*` is the canonical skill namespace. Docs, examples, installer output, and agent routing should use `aw-*` names.

Existing local installs using `ce-*` will be cleaned up on the next `aw-init` install.

Because there is no compatibility period, users must invoke the renamed skills directly.

## Alternatives Considered

- Keep `ce-*`: avoids churn, but preserves confusing Compound Engineering naming for an independent workflow.
- Add aliases for both prefixes: safer for multiple consumers, but unnecessary while there is only one known consumer.

## Links

- `docs/features/augmented-workflow/spec.md`
