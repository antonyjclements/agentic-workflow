---
title: Spec-Driven Agentic Workflow
status: active
created: 2026-05-24
updated: 2026-05-24
tags:
  - workflow
  - specs
  - decisions
related_decisions:
  - docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md
---

# Spec-Driven Agentic Workflow

## Intent

Agentic Workflow should make spec-driven development portable across repositories without requiring teams to adopt a heavyweight external framework.

## Users

- Engineers installing the workflow into a repository.
- Coding agents using `AGENTS.md` and skills to plan, implement, review, and ship work.
- Future maintainers reconstructing why a feature behaves the way it does.

## Current Behavior

The workflow uses `AGENTS.md` as the portable orientation and routing file. The installer copies that file into a target repo, installs skills globally, and creates repo-local indexes for specs, standards, decisions, and learnings.

The workflow routes:

- durable feature intent to `docs/specs/`
- enforceable project rules to `docs/standards/`
- immutable decisions to `docs/decisions/`
- correction-driven learnings to `docs/learnings/` or `~/.agents/learnings/`

## Key Flows

- A PRD or feature request becomes a living spec through `ce-spec-create`.
- A plan may be created from the spec, but the plan remains temporary execution scaffolding.
- During implementation, resolved ambiguity is logged with `ce-decision-log`.
- Before PR, `ce-spec-review` checks for drift between changed behavior and living specs.
- When a user correction reveals a reusable lesson, `ce-retrospective` stores the learning.

## Acceptance Criteria

- New installs create `docs/specs/index.yml`, `docs/standards/index.yml`, `docs/decisions/index.yml`, and `docs/learnings/index.yml`.
- Agents can discover and use the spec, standard, decision, and learning registries from `AGENTS.md`.
- Skills exist for spec creation, spec review, decision logging, standards discovery, and retrospective learning.
- PR-time shipping guidance includes a spec drift check for durable behavior changes.

## Boundaries and Non-Goals

- The workflow does not require BMAD, SpecKit, LID, or another packaged framework.
- The workflow does not make plans a permanent source of truth.
- Decision records are not edited to rewrite history; later changes create superseding decisions.

## Open Questions / TODOs

- Decide whether to add command aliases such as `/spec:create`, `/spec:review`, and `/decision:log` for tools that support slash commands.
- Decide whether root-level `specs/`, `standards/`, and `decisions/` should be supported as aliases for repos that do not use `docs/`.

## Decision Links

- `docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md`
