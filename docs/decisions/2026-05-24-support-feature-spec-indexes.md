---
title: Support feature spec indexes
date: 2026-05-24
status: active
tags:
  - workflow
  - specs
  - features
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Support Feature Spec Indexes

## Context

Living specs are stored per feature at `docs/features/<feature>/spec.md`. Those repos need a discoverable index so agents can find the right feature spec without scanning every file manually.

## Decision

Add `ce-index-features` to generate or refresh `docs/features/index.yml` from `docs/features/*/spec.md`.

## Consequences

Agents can work with feature-scoped spec directories and refresh the index after specs are added or moved.

## Alternatives Considered

- Use a flat specs directory: simpler for the workflow, but less aligned with feature-scoped specs.
- Scan `docs/features/` every time: avoids an index, but wastes context and makes feature discovery inconsistent.

## Links

- `docs/features/augmented-workflow/spec.md`
