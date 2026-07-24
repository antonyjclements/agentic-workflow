---
title: Add dedicated PRD creation skill
date: 2026-05-28
status: active
tags:
  - workflow
  - prd
  - skills
  - templates
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add Dedicated PRD Creation Skill

## Context

After combining brainstorm and spec creation, PRD authoring still needed a clear home. `aw-import-prd` preserves external PRDs unchanged, while `aw-brainstorm` explores ambiguity and normally creates or updates a living spec. Neither should also own the formatting and section policy for authored PRDs.

Teams also need to customize PRD section order and format without editing the skill itself.

## Decision

Add `aw-create-prd` as the dedicated skill for authoring PRDs from ideas, brainstorms, notes, or clarified product direction.

`aw-create-prd` uses `docs/product/prds/template.md` when a repo defines one, and otherwise falls back to its bundled `references/prd-template.md`.

Keep `aw-import-prd` focused on preserving external PRDs, and keep `aw-brainstorm` focused on product discovery and living spec creation.

## Consequences

The workflow can distinguish three PRD-related actions:

- Import external PRD source with `aw-import-prd`.
- Author a new PRD with `aw-create-prd`.
- Clarify ambiguity and create/update durable feature intent with `aw-brainstorm` or `aw-create-spec`.

Repos can define their preferred authored PRD sections by adding `docs/product/prds/template.md`.

## Alternatives Considered

- Keep PRD authoring inside `aw-brainstorm`: fewer skills, but mixes ideation, PRD formatting, and spec creation.
- Keep PRD authoring inside `aw-import-prd`: reuses storage/indexing, but conflates external source preservation with authored synthesis.

## Links

- `docs/features/augmented-workflow/spec.md`
