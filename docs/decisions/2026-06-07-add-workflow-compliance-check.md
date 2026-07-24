---
title: Add workflow compliance check
date: 2026-06-07
status: active
tags:
  - workflow
  - review
  - shipping
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add workflow compliance check

## Context

Configurable workflow steps and implementation test policy create new repo-level expectations, but config alone cannot guarantee that an agent or custom skill followed them. The workflow already has spec and code review gates, but neither focuses on the complete workflow contract.

## Decision

Add `aw-check-workflow-compliance` as a bundled skill.

Run or require it for non-trivial implementation changes after the branch has been pushed and before PR creation. It checks configured workflow routing, implementation test policy, acceptance coverage, README maintenance, review gates, pushed-branch evidence, and PR-body readiness.

Trivial docs-only or mechanical changes may skip the check with an explicit note. If push fails due to credentials, network, remote policy, or another external blocker, report the blocker instead of claiming compliance passed.

## Consequences

- Workflow compliance becomes auditable before PR creation.
- Custom skills are judged against the same repo contract as bundled skills.
- The check remains advisory/actionable and does not replace CI, code review, or spec review.
- Compliance evidence has a clear timing point: after push and before PR creation.
