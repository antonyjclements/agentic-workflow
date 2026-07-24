---
title: Import PRDs as historical source artifacts
date: 2026-05-24
status: active
tags:
  - workflow
  - prd
  - product
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Import PRDs as Historical Source Artifacts

## Context

PRDs are often created outside the repo and imported as pasted content, markdown files, or shared documents. They should persist for traceability, but they should not become living product truth because they may contain ambiguity, stale assumptions, and discarded options.

## Decision

Add `ce-import-prd` to persist imported PRDs under `docs/product/prds/` and maintain `docs/product/prds/index.yml`. Imported PRDs are historical source artifacts. The next workflow step is `ce-brainstorm`, which resolves ambiguity and produces requirements input for `ce-spec-create`.

## Consequences

The workflow preserves original product input without confusing it with `docs/product/vision.md` or feature specs. Each step has an explicit artifact handoff into the next step.

## Alternatives Considered

- Put PRDs in `docs/product/vision.md`: rejected because product vision is living product thesis, while PRDs are historical inputs.
- Skip persisting PRDs and only write brainstorm output: faster, but loses source traceability.

## Links

- `docs/product/prds/index.yml`
- `docs/features/augmented-workflow/spec.md`
