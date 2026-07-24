---
title: Use workflow steps for skill routing
date: 2026-06-07
status: active
tags:
  - workflow
  - configuration
  - skills
related_specs:
  - docs/features/augmented-workflow/spec.md
related_decisions:
  - docs/decisions/2026-05-24-configure-ticket-creation-skill.md
  - docs/decisions/2026-05-24-configure-post-pr-ci-monitoring.md
  - docs/decisions/2026-05-25-configure-commit-message-format.md
  - docs/decisions/2026-05-25-simplify-slack-and-ticket-config.md
supersedes: []
---

# Use workflow steps for skill routing

## Context

Augmented Workflow had several separate skill selector fields in `docs/workflow/config.yml`, including ticket creation, commit, CI monitoring, and Slack research hooks. Adding configurable skills for every workflow step would make those older selector fields overlap with a broader routing mechanism.

## Decision

Use `workflow.steps.<step>.skill` as the canonical skill routing path for all configurable workflow steps.

Remove old step-specific skill selector fields from the default installed config and documentation:

- `ticket_creation.skill`
- `git.commit.skill`
- `post_pr.ci_monitor.skill`
- `research.slack.skill`

Do not maintain fallback aliases for those selector fields. Existing repos that still contain them should migrate the value to the matching `workflow.steps.<step>.skill` key.

Keep non-skill configuration fields in their existing domains, including commit format rules, PR templates, human reviewers, and provider metadata such as `post_pr.ci_monitor.provider`.

## Consequences

- Agents have one skill routing model to read and enforce.
- Config conflicts between old and new selector fields are avoided.
- Existing repos with old selector fields need an explicit migration instead of silent compatibility.
- Provider-specific and behavior-specific config remains separate from workflow step routing.
