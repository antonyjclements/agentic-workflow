---
title: Configure ticket creation skill per repo
date: 2026-05-24
status: active
tags:
  - workflow
  - tickets
  - automation
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Configure ticket creation skill per repo

## Context

Plans often need to become implementation stories before agents pick them up. Different repos may use Linear, Jira, or another ticketing system, and the user may have skills or MCP tools for more than one provider.

## Decision

Add `docs/workflow/config.yml` as the repo-local workflow configuration file. The `ticket_creation.skill` value defines which skill an agent should use when turning plans into tickets. A blank `ticket_creation.skill` means ticket creation is disabled and should be skipped. Add `ce-create-tickets` as the stable workflow entrypoint that reads this config and delegates to the configured ticket skill when one is configured.

## Consequences

Agents can turn plans into stories without the user repeating which ticket system to use. Repos can choose Linear, Jira, a custom story-creation skill, or no ticket creation independently.

## Alternatives Considered

- Hard-code Linear or Jira: simpler, but not portable across repos.
- Ask every time when blank: flexible, but repeats setup work and makes blank config ambiguous instead of an intentional opt-out.
- Infer from installed MCP tools only: convenient, but ambiguous when multiple tools are installed.

## Links

- `docs/features/augmented-workflow/spec.md`
