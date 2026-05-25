---
title: Add CircleCI pipeline monitor skill
date: 2026-05-24
status: active
tags:
  - workflow
  - ci
  - circleci
---

# Add CircleCI pipeline monitor skill

## Context

Some repositories use CircleCI rather than GitHub Actions or another CI/CD provider. The workflow already supports repo-configured post-PR CI monitoring through `docs/workflow/config.yml`, but it needs a CircleCI-specific skill that agents can invoke through the generic `ce-monitor-pipeline` router.

The installed CircleCI CLI supports authentication diagnostics, config validation/processing, and pipeline definition operations. It does not expose a complete PR pipeline watch and failing log inspection workflow, so live monitoring may need CircleCI API v2 when CLI commands are insufficient.

## Decision

Add `ce-monitor-circleci` as the CircleCI-specific CI monitor/fix skill.

Repos opt in through:

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

The skill uses the CircleCI CLI for local setup, auth diagnostics, and config validation. It uses CircleCI API v2 for live pipeline, workflow, and job status when the CLI does not expose enough detail.

## Consequences

- CircleCI monitoring remains optional and repo-configured.
- The generic `ce-monitor-pipeline` skill stays provider-neutral.
- CircleCI tokens remain environment-driven through `CIRCLECI_CLI_TOKEN` by default.
- Agents must stop with a clear blocker when CircleCI is unreachable, auth is missing, or provider config cannot identify the target project.
