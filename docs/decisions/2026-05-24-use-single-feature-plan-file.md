---
title: Use single feature plan file
date: 2026-05-24
status: active
tags:
  - workflow
  - plans
  - features
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-24-use-feature-directories-for-specs-and-plans.md
---

# Use Single Feature Plan File

## Context

Feature-scoped plans belong beside their living feature spec, but a nested `plans/` directory creates multiple possible filenames and makes the canonical handoff path harder for agents to infer.

## Decision

Save the active implementation plan for a feature at `docs/features/<feature>/plan.md`.

## Consequences

Agents should create, resume, review, ticket from, and implement against `docs/features/<feature>/plan.md`. The plan remains temporary execution scaffolding and should be removed when it is no longer active.

## Links

- `docs/features/augmented-workflow/spec.md`
