---
title: Delegate CI monitor retry policy
date: 2026-05-25
status: active
tags:
  - workflow
  - ci
  - configuration
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Delegate CI Monitor Retry Policy

## Context

`post_pr.ci_monitor` exists to route post-PR monitoring to a provider-specific skill. Retry counts, polling cadence, and timeouts are implementation details that vary by CI provider and by the linked monitor skill.

## Decision

Remove retry and polling fields such as `max_attempts` and `poll_interval_seconds` from the base `post_pr.ci_monitor` workflow config. The linked monitor skill owns its retry policy, polling cadence, timeout behavior, and provider-specific config.

## Consequences

The base workflow config remains a routing contract. CI monitor skills can evolve their own operational policy without requiring changes to every installed repo's `docs/workflow/config.yml`.

## Links

- `docs/features/agentic-workflow/spec.md`
