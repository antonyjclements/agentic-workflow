---
title: Add decision refresh maintenance
date: 2026-05-25
status: active
tags:
  - workflow
  - decisions
  - maintenance
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add decision refresh maintenance

## Context

The workflow records decisions as immutable markdown files under `docs/decisions/`. Over time, a large decision folder can become hard to scan even when every individual decision is useful.

## Decision

Add `ce-decisions-refresh` as a maintenance skill for decision registries. The skill refreshes `docs/decisions/index.yml`, detects missing or stale metadata, follows supersession chains, and creates derived summaries under `docs/decisions/summaries/` when decision volume makes navigation difficult.

The skill must not rewrite historical decision records by default. If an old decision is wrong or superseded, the normal path is to create a new decision with `ce-decision-log` and relate it to the older record.

## Consequences

- Decision logs can grow without relying on physical archiving as the main discovery mechanism.
- Agents have a workflow for large decision folders that preserves historical context.
- Derived summaries can be regenerated as the active decision map changes.

## Alternatives Considered

- Archive old decision files by date: reduces folder size but makes historical search and links less predictable.
- Edit older decisions in place: easier to keep a single current truth, but violates the immutable decision model.
