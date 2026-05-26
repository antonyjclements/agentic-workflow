---
title: Simplify Slack and ticket configuration
date: 2026-05-25
status: active
tags:
  - workflow
  - configuration
  - tickets
  - slack
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Simplify Slack and ticket configuration

## Context

The base workflow config included provider-specific ticket fields and Slack workspace/channel hints. Those fields are not universally meaningful across Linear, Jira, custom ticket skills, or enterprise Slack connectors.

## Decision

Keep only the routing hooks in the base config:

```yaml
ticket_creation:
  skill: ""
research:
  slack:
    skill: ""
```

Provider-specific defaults, workspace choices, channel lists, labels, priorities, and templates should live in the configured skill, target system, or repo-specific standards when needed.

## Consequences

- The default config is smaller and easier to copy across repos.
- Custom ticket and Slack skills own their provider-specific settings.
- Repos can still extend `docs/workflow/config.yml` locally if they need additional fields.
