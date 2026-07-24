---
title: Use feature directories for specs and plans
date: 2026-05-24
status: active
tags:
  - workflow
  - specs
  - plans
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md
  - docs/decisions/2026-05-24-support-feature-spec-indexes.md
---

# Use Feature Directories for Specs and Plans

## Context

The preferred spec-driven layout is one directory per feature, such as `docs/features/<feature>/spec.md`. Some repos already use this convention, and it keeps feature intent, temporary implementation plans, and related feature-local artifacts together.

## Decision

Use `docs/features/<feature>/spec.md` as the primary living spec location. Generate and maintain `docs/features/index.yml` as the feature registry. Store temporary implementation plans under the relevant feature directory, preferably `docs/features/<feature>/plans/`, and remove those plans when they are no longer active execution scaffolding.

## Consequences

Agents should look for feature specs through `docs/features/index.yml` first. New specs should be created in feature directories. Plans stay close to their feature while active but do not become permanent source of truth.

## Alternatives Considered

- Flat `docs/specs/`: simpler, but less aligned with feature-scoped documentation.
- Root-level `docs/plans/`: easy to scan globally, but separates temporary plans from the feature context they implement.

## Links

- `docs/features/index.yml`
- `docs/features/augmented-workflow/spec.md`
