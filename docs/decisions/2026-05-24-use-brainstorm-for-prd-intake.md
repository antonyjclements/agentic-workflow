---
title: Use brainstorm for PRD intake
date: 2026-05-24
status: active
tags:
  - workflow
  - prd
  - specs
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Use Brainstorm for PRD Intake

## Context

PRDs often contain implicit ambiguity, open questions, assumptions, and scope gaps. Turning a PRD directly into a living spec can prematurely freeze unresolved product behavior.

## Decision

Use `ce-brainstorm` as the default intake step for PRDs. Use `ce-spec-create` after ambiguity has been resolved, or when unresolved questions are intentionally preserved in the spec.

## Consequences

Feature specs should represent clarified durable intent rather than raw PRD text. Agents should not skip ambiguity resolution unless the user explicitly asks for a spec draft or the PRD is already actionable.

## Alternatives Considered

- Use `ce-spec-create` directly for all PRDs: faster, but risks converting hidden ambiguity into apparent decisions.

## Links

- `docs/features/agentic-workflow/spec.md`
