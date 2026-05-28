---
title: Use PRD lifecycle statuses and cleanup archived artifacts
date: 2026-05-28
status: active
tags:
  - workflow
  - prd
  - cleanup
  - artifacts
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Use PRD Lifecycle Statuses and Cleanup Archived Artifacts

## Context

PRDs are source input for specs, but they are not living truth like feature specs and they should not expire like implementation plans. At the same time, keeping every obsolete artifact in the working tree creates noise. Git already preserves historical file contents.

## Decision

Use explicit PRD lifecycle statuses:

- `imported`: external PRD preserved as source input
- `draft`: authored PRD still being shaped
- `ready-for-spec`: stable enough to promote into a living spec
- `promoted`: a living spec has been created from the PRD
- `superseded`: replaced before promotion by newer product input
- `archived`: safe to remove from the working tree

When a PRD is promoted into a spec, update only PRD lifecycle metadata and the PRD index: `status: promoted`, `promoted: YYYY-MM-DD`, and `promoted_to: docs/features/<feature>/spec.md`. Do not rewrite the PRD body.

Add `aw-clean-artifacts` to remove workflow artifacts explicitly marked `status: archived`. Git history is the long-term archive.

## Consequences

Promoted PRDs remain visible as provenance until explicitly archived.

Cleanup is deliberate and status-driven. The agent must not delete artifacts based on age, promotion, or supersession alone.

Archived artifacts can leave the working tree without losing historical context because git retains prior versions.

## Alternatives Considered

- Keep all promoted PRDs forever in the working tree: maximizes local visibility but grows noise over time.
- Delete promoted PRDs automatically: keeps the tree clean but loses convenient provenance too early.

## Links

- `docs/features/agentic-workflow/spec.md`
