---
name: aw-monitor-pipeline
description: "Route post-PR CI monitoring to a configured provider skill, or skip cleanly when none is configured. Use after PR creation when post_pr.ci_monitor.provider is set in docs/workflow/config.yml."
argument-hint: "[PR URL/number or branch]"
---

# Monitor Pipeline

Route post-PR CI monitoring to the configured skill, or skip cleanly.

## Configuration

Read `docs/workflow/config.yml`:

```yaml
workflow:
  steps:
    monitor_pipeline:
      skill: ""        # set to a skill name to enable CI monitoring
post_pr:
  ci_monitor:
    provider: manual   # manual or missing = skip; any other value = custom skill required
```

## Routing

1. Read `docs/workflow/config.yml`.
2. If `workflow.steps.monitor_pipeline.skill` is set, invoke that skill with the PR/branch argument. Done.
3. If `post_pr.ci_monitor.provider` is `manual`, missing, or blank — stop cleanly and report that CI monitoring is not configured for this repo.
4. If `post_pr.ci_monitor.provider` is set to any other value but `workflow.steps.monitor_pipeline.skill` is blank — report that a provider is named but no skill is configured. Advise the user to set `workflow.steps.monitor_pipeline.skill` to a skill that handles that provider.

## Rules

- This skill does not poll, read CI logs, fix failures, or push commits. Those belong to the configured provider skill.
- Do not guess what CI provider is in use or attempt to connect to CI services directly.
- If the configured skill is unavailable or cannot be loaded, report the missing skill name and stop.

## Provider Skill Contract

A provider skill configured via `workflow.steps.monitor_pipeline.skill` must:
- Accept a PR URL, PR number, or branch as its argument
- Own its own retry limit, polling cadence, and timeouts
- Fix only failures caused by the current branch
- Report success, a remaining blocker, or its retry limit reached
- Never expose tokens, secrets, or private log content in summaries
