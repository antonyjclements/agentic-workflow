---
title: Configure post-PR CI monitoring skill per repo
date: 2026-05-24
status: active
tags:
  - workflow
  - ci
  - automation
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Configure post-PR CI monitoring skill per repo

## Context

Repos may use GitHub Actions, CircleCI, Jenkins, or another CI/CD system. The workflow needs a portable post-PR automation point without hard-coding one provider.

## Decision

Add `post_pr.ci_monitor` to `docs/workflow/config.yml`. The `post_pr.ci_monitor.skill` value defines which skill monitors and fixes pipeline failures after PR creation. A blank skill means post-PR monitoring is disabled.

Add `ce-monitor-pipeline` as the stable workflow entrypoint. It reads the config, delegates to the configured monitor/fix skill, and loops until the pipeline succeeds, the configured max attempts is reached, or the failure is genuinely blocked.

## Consequences

Repos can opt into CI automation for their provider while keeping the default install quiet. The PR workflow can run code review before push/PR and then optionally continue through a CI repair loop after the PR exists.

## Alternatives Considered

- Hard-code GitHub Actions: useful for some repos, but not portable.
- Always monitor CI: noisy for repos without configured credentials or CI systems.
- Run only once: simpler, but misses the intended repair loop.

## Links

- `docs/workflow/config.yml`
- `docs/features/agentic-workflow/spec.md`
