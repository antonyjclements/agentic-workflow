---
title: Use docs/ for spec-driven workflow registries
date: 2026-05-24
status: active
tags:
  - workflow
  - documentation
  - installer
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Use docs/ for spec-driven workflow registries

## Context

The spec-driven development model needs living specs, encoded standards, immutable decisions, and feedback-loop learnings. The existing Augmented Workflow already used `docs/standards/` and `docs/learnings/`, so adding more root-level folders would split related workflow documentation.

## Decision

Use `docs/features/`, `docs/standards/`, `docs/decisions/`, and `docs/learnings/` as the default repo-local registries. Keep `AGENTS.md` as the portable agent orientation file.

## Consequences

The installer can create a consistent `docs/` structure in any target repo. Repos that prefer root-level folders can still add repo-specific guidance, but the portable default remains under `docs/`.

## Alternatives Considered

- Root-level `specs/`, `standards/`, and `decisions/`: closer to the talk shorthand, but inconsistent with the existing standards and learnings convention.
- Only `AGENTS.md` plus skills: simpler, but misses the durable repo-local source of truth.

## Links

- `docs/features/augmented-workflow/spec.md`
