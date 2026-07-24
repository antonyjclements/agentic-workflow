---
title: Make human review gates opt-in instead of ask-always
date: 2026-07-02
status: active
tags:
  - workflow
  - human-review
  - ceremony
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Make human review gates opt-in instead of ask-always

## Context

`AGENTS.md` and the producing skills (`aw-brainstorm`, `aw-create-spec`, `aw-plan`) told agents to ask whether the user wants human review after every spec or plan creation or update. The field guide simultaneously told solo/pair repos to avoid the human-review gate entirely. An operating-model review flagged the contradiction: an interrupt after every artifact cuts against the smallest-safe-workflow-path principle, and the two documents taught different ceremony levels.

## Decision

Human review is opt-in ceremony, not a default interrupt. Agents offer a spec or plan sign-off PR only when at least one of these holds:

- `human_review.spec.reviewers` / `human_review.plan.reviewers` is configured in `docs/workflow/config.yml`
- the change is high-risk per `AGENTS.md` task triage
- the user asked for review

Otherwise agents proceed without asking. This condition is stated consistently in `AGENTS.md`, the living spec, `aw-brainstorm`, `aw-create-spec`, `aw-plan`, and the README. The `aw-request-human-review` skill itself is unchanged.

## Consequences

- Solo and small-team repos get zero review-gate interruptions by default, matching the field guide's team-size guidance.
- Teams that want the gate opt in by configuring reviewers — configuration expresses intent once instead of every artifact re-asking.
- The condition depends on agents reading `human_review.*.reviewers` before deciding to offer; whether `aw-check-workflow-compliance` should verify that condition is an open follow-up.

## Alternatives Considered

- Keep ask-always and rely on users declining: repeated interrupts train users to dismiss prompts, which erodes the gate's value for the changes that actually warrant it.
- Team-size setting in config: reviewer lists already encode the same intent without a new field.

## Links

- docs/decisions/2026-05-24-add-human-review-gates-for-specs-and-plans.md (the gate this decision right-sizes; not superseded — reviewer-request mechanics are unchanged)
