---
title: Add additive design-team hooks
date: 2026-07-21
status: active
tags:
  - workflow
  - design
  - configuration
related_specs:
  - docs/features/agentic-workflow/spec.md
---

# Add Additive Design-Team Hooks

## Context

Agentic Workflow already lets repos replace named lifecycle steps through
`workflow.steps.<step>.skill` and helper capabilities through
`workflow.auxiliary.<key>.skill`. A design team needs to participate at several
points in the workflow, but replacing core engineering steps would force design
automation to own unrelated implementation, ticketing, review, or shipping
contracts.

Design teams also have repo-specific reference material such as design
principles, accessibility rules, content style, and interaction patterns. Agents
need a stable place to find those references without introducing another
parallel knowledge system.

## Decision

Add a disabled-by-default `workflow.design` section to
`docs/workflow/config.yml`:

- `enabled` controls whether design hooks are considered at all.
- `reference_paths` points to repo-local design reference material, defaulting
  to `docs/standards`.
- `hooks` defines blank skill slots for `discovery`, `spec_review`,
  `plan_review`, `implementation_review`, and `pre_pr`.

Design hooks are additive checkpoints. They do not replace bundled workflow
steps; teams should still use `workflow.steps.<step>.skill` only when a custom
skill owns the entire lifecycle step contract.

## Consequences

Repos can integrate design participation gradually by enabling only the hook
skills they need. Repo-specific design guidance stays in the existing standards,
specs, decisions, and learnings model instead of creating a separate design
artifact hierarchy.

Hook skills must preserve a small contract: read configured design reference
paths, accept the current artifact path, diff, or PR URL for the hook, report
pass/fail evidence or findings, and state unsupported cases explicitly.
