---
name: ce-monitor-pipeline
description: "Monitor post-PR CI/CD pipelines and fix build failures by delegating to the repo-configured CI monitor/fix skill. Use after PR creation, when the user asks to watch CI, fix checks, monitor builds, or run the configured post-PR pipeline loop."
argument-hint: "[PR URL/number, branch, or check run]"
---

# Monitor Pipeline

Run the post-PR CI/CD loop using the repo-configured monitor/fix skill.

## Configuration

Read `docs/workflow/config.yml` first:

```yaml
post_pr:
  ci_monitor:
    provider: github-actions|circleci|jenkins|custom|manual
    skill: <skill-name>
    max_attempts: 3
    poll_interval_seconds: 30
```

If `post_pr.ci_monitor.skill` is blank, skip monitoring and report that post-PR CI monitoring is disabled for this repo.

For CircleCI, configure:

```yaml
post_pr:
  ci_monitor:
    provider: circleci
    skill: ce-monitor-circleci
    max_attempts: 3
    poll_interval_seconds: 30
    circleci:
      vcs: github
      org: ""
      project: ""
      branch: ""
      token_env: CIRCLECI_CLI_TOKEN
```

## Workflow

1. Resolve the PR, branch, and current commit SHA.
2. Read `docs/workflow/config.yml`.
3. If no CI monitor skill is configured, stop cleanly.
4. Invoke the configured skill to inspect pipeline status and logs.
5. If the pipeline succeeds, report success and stop.
6. If failures are found:
   - identify the failing job/check and likely root cause
   - fix only issues caused by this branch
   - run relevant local verification where practical
   - commit and push the fix when the surrounding workflow permits it
7. Repeat until success, `max_attempts` is reached, or the failure is blocked by external credentials, infrastructure, flakes, quota, or unrelated default-branch issues.

## Rules

- Do not loop indefinitely. Default `max_attempts` is 3 when config is absent or invalid.
- Preserve user changes; do not sweep unrelated files into fix commits.
- Do not mask flaky or external failures as fixed.
- If the configured skill is unavailable, report the missing skill and stop instead of guessing a provider.
- Keep PR comments or updates concise when the delegated skill supports them.
