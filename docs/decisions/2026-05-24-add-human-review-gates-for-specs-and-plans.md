---
title: Add human review gates for specs and plans
date: 2026-05-24
status: active
tags:
  - workflow
  - review
  - github
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Add Human Review Gates for Specs and Plans

## Context

Some teams need explicit human sign-off before proceeding from spec to plan or from plan to implementation. Product review is useful for specs; engineering review is useful for implementation plans.

## Decision

After `ce-spec-create`, agents ask whether to create a product/human review PR for the spec. After `ce-plan`, agents ask whether to create an engineering/human review PR for the plan.

Add `human_review.spec.reviewers` and `human_review.plan.reviewers` to `docs/workflow/config.yml`. When configured, those GitHub usernames are requested as reviewers on the corresponding PR.

Add `ce-request-human-review` as the workflow skill that commits the relevant artifact set, opens the PR, and requests reviewers.

## Consequences

Teams can insert human approval without making it mandatory for every repo or every change. Review PRs stay small and scoped to the artifact that needs sign-off.

## Alternatives Considered

- Always require spec/plan PRs: too much ceremony for small changes.
- Put reviewer usernames in `AGENTS.md`: less structured and harder for agents to parse reliably.

## Links

- `docs/workflow/config.yml`
- `docs/features/agentic-workflow/spec.md`
