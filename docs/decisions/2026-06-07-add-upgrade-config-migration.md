---
title: Add upgrade config migration
date: 2026-06-07
status: active
tags:
  - workflow
  - configuration
  - migration
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Add upgrade config migration

## Context

Existing Agentic Workflow users can replace global skills and repo-local agent instructions, but `docs/workflow/config.yml` is user-owned state. The workflow step routing change removes older skill selector fields, so users need a safe migration path that preserves local intent without requiring hand edits.

## Decision

Add `aw-upgrade` as the user-facing upgrade skill and bundle a structural config migrator under `skills/aw-init/scripts/upgrade-config.rb`.

The migrator dry-runs by default, applies only when requested, creates a timestamped backup before writing, preserves unknown fields and non-skill config, adds missing current defaults, removes migrated legacy skill selector fields, and updates `.agentic-workflow-version`.

Known legacy mappings:

- `ticket_creation.skill` -> `workflow.steps.create_tickets.skill`
- `git.commit.skill` -> `workflow.steps.commit.skill`
- `research.slack.skill` -> `workflow.steps.research_slack.skill`
- custom `post_pr.ci_monitor.skill` -> `workflow.steps.monitor_pipeline.skill` and `post_pr.ci_monitor.provider: github-actions` when no provider was set
- `post_pr.ci_monitor.skill: aw-monitor-circleci` -> `post_pr.ci_monitor.provider: circleci`

Conflicting old and new values stop the migration for manual review.

## Consequences

- Existing users get an auditable upgrade path instead of a risky overwrite.
- Future config shape changes can extend the same upgrade surface.
- Installer behavior can remain conservative: preserve existing config unless the user explicitly runs the upgrade.
