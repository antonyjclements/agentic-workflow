---
title: Combine brainstorm and spec creation
date: 2026-05-28
status: active
tags:
  - workflow
  - prd
  - specs
  - brainstorming
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-24-use-brainstorm-for-prd-intake.md
---

# Combine Brainstorm and Spec Creation

## Context

The previous intake flow required users to move from imported PRD or raw idea to `aw-brainstorm`, then from the brainstorm requirements artifact to `aw-create-spec`. In regular use, that made product discovery feel like an extra workflow step before the durable spec could exist.

The workflow still needs to preserve imported PRDs as historical source artifacts and avoid freezing unresolved ambiguity as settled product intent.

## Decision

Use `aw-brainstorm` as the combined discovery-to-spec path for PRDs, raw ideas, and ambiguous product requests. After resolving enough ambiguity, `aw-brainstorm` should create or update the living feature spec in `docs/features/<feature>/spec.md` in the same run.

Keep `aw-create-spec` as the direct spec-writing path for already-clear requirements, existing behavior documentation, implementation-driven spec updates, and explicit spec-draft requests.

Allow `aw-brainstorm` to produce an ideation artifact instead of a spec when the user asks for exploratory output or is not ready to commit intent to the living spec. Route authored PRD output to `aw-create-prd`.

## Consequences

The normal PRD path becomes `aw-import-prd` -> `aw-brainstorm` -> `aw-plan`, with `aw-brainstorm` returning the spec path when product intent is ready.

Raw ideas can go directly to `aw-brainstorm`, which may either create a living spec or produce an ideation artifact depending on user intent. If the desired artifact is a PRD, use `aw-create-prd`.

Agents should no longer force a separate requirements document and `aw-create-spec` handoff after every brainstorm.

## Alternatives Considered

- Keep `aw-brainstorm` and `aw-create-spec` fully separate: clearer separation of artifacts, but too much ceremony for common PRD and idea intake.
- Route all PRDs directly to `aw-create-spec`: faster, but weakens the discovery behavior needed for ambiguous product inputs.

## Links

- `docs/features/augmented-workflow/spec.md`
