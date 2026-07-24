---
title: Blank ticket skill skips ticket creation
date: 2026-05-24
status: active
tags:
  - workflow
  - tickets
  - configuration
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Blank ticket skill skips ticket creation

## Context

The ticket creation config supports repos that use Linear, Jira, custom ticket workflows, or no ticketing workflow. A blank skill value could either mean "ask me which ticket tool to use" or "do not create tickets."

## Decision

A blank `ticket_creation.skill` means ticket creation is disabled for the repo. Agents should skip ticket creation and report that no tickets were created. They should only ask which ticket skill to use when the user explicitly wants ticketing enabled or a configured skill is unavailable.

## Consequences

Repos can opt out of ticket creation without repeated prompts. Ticketing becomes additive automation rather than a required workflow step.

## Alternatives Considered

- Ask which ticket tool to use whenever the skill is blank: flexible, but noisy and contrary to using blank config as an opt-out.

## Links

- `docs/workflow/config.yml`
- `docs/features/augmented-workflow/spec.md`
