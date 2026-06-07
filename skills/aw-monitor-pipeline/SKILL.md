---
name: aw-monitor-pipeline
description: "Monitor post-PR CI/CD pipelines and fix build failures through the repo-configured monitor workflow step. Use after PR creation, when the user asks to watch CI, fix checks, monitor builds, or run the configured post-PR pipeline loop."
argument-hint: "[PR URL/number, branch, or check run]"
---

# Monitor Pipeline

Run the post-PR CI/CD loop using the repo-configured monitor/fix skill.

## Configuration

Read `docs/workflow/config.yml` first:

```yaml
workflow:
  steps:
    monitor_pipeline:
      skill: ""
    monitor_circleci:
      skill: ""
post_pr:
  ci_monitor:
    provider: github-actions|circleci|jenkins|custom|manual
```

If `workflow.steps.monitor_pipeline.skill` is set, invoke that replacement monitor step.

If `post_pr.ci_monitor.provider` is `manual` or missing, skip monitoring and report that post-PR CI monitoring is disabled for this repo. Provider metadata stays in `post_pr.ci_monitor.provider`; skill routing belongs in `workflow.steps`.

Retry counts, polling cadence, timeouts, and provider-specific settings belong to the delegated monitor skill. Do not read `max_attempts` or `poll_interval_seconds` from `docs/workflow/config.yml`.

For CircleCI, configure:

```yaml
workflow:
  steps:
    monitor_circleci:
      skill: ""
post_pr:
  ci_monitor:
    provider: circleci
```

CircleCI-specific settings do not live in `docs/workflow/config.yml` by default. `aw-monitor-circleci` discovers them from git remotes and `.circleci/config.yml`, or sets up optional `docs/workflow/circleci.yml` when needed.

Removed legacy field: `post_pr.ci_monitor.skill`. If it appears in an older repo, tell the user to migrate it to `workflow.steps.monitor_pipeline.skill` or `workflow.steps.monitor_circleci.skill`; do not keep supporting both config shapes.

## Workflow

1. Resolve the PR, branch, and current commit SHA.
2. Read `docs/workflow/config.yml`.
3. If `post_pr.ci_monitor.provider` is `manual` or missing, stop cleanly.
4. Invoke the configured replacement monitor step when present; otherwise use the bundled provider behavior for the configured provider.
5. If the pipeline succeeds, report success and stop.
6. If failures are found:
   - identify the failing job/check and likely root cause
   - fix only issues caused by this branch
   - run relevant local verification where practical
   - commit and push the fix when the surrounding workflow permits it
7. Let the delegated skill repeat until success, its own retry limit is reached, or the failure is blocked by external credentials, infrastructure, flakes, quota, or unrelated default-branch issues.

## Rules

- Do not loop indefinitely. The delegated monitor skill owns retry limits and polling cadence.
- Preserve user changes; do not sweep unrelated files into fix commits.
- Do not mask flaky or external failures as fixed.
- If the configured replacement skill is unavailable, report the missing skill and stop instead of guessing a provider.
- Keep PR comments or updates concise when the delegated skill supports them.
