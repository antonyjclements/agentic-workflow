---
name: ce-decision-log
description: "Log immutable repository decisions under docs/decisions/ when ambiguity is resolved, product or architecture behavior is chosen, trade-offs are made, or the user says decision:log. Maintains docs/decisions/index.yml and links decisions to specs."
argument-hint: "[decision, context, spec path, or issue]"
---

# Log Decision

Write durable, immutable decision records so resolved context does not stay in chat, plans, or memory.

## Trigger Signals

Use when:

- ambiguity is resolved during implementation
- product behavior, architecture, data model, API contract, testing strategy, or workflow policy is chosen
- a user correction changes durable repo behavior
- the user says `decision:log`, "log this decision", or "record why"

Agents should proactively suggest this skill at natural pauses when a decision has been made but not recorded. If the decision and repo scope are explicit, log it without waiting for the user to name the skill. Ask one concise question only when the decision, scope, privacy, or related spec is unclear.

Use `ce-retrospective` instead for reusable agent-process lessons. If both apply, write a decision for the repo fact and a learning for the future agent behavior.

## Storage

- Decisions live under `docs/decisions/`.
- `docs/decisions/index.yml` is the entrypoint.
- Decision files are immutable. To change direction later, create a new decision that supersedes the old one and update the index.

## Workflow

1. Read `docs/decisions/index.yml` and relevant `docs/features/` specs if present.
2. Identify the decision, context, alternatives, consequences, owner/source, and related specs.
3. If the actual decision is unclear, ask one blocking question.
4. Create `docs/decisions/YYYY-MM-DD-<slug>.md`.
5. Update the index, preserving its schema where possible.
6. Link the decision from any affected spec when that update is clearly in scope.

## Default Decision Format

Use the repo's existing format if present. Otherwise:

```markdown
---
title: <Decision Title>
date: YYYY-MM-DD
status: active
tags:
  - <tag>
related_specs: []
supersedes: []
---

# <Decision Title>

## Context

## Decision

## Consequences

## Alternatives Considered

## Links
```

## Default Index Format

```yaml
decisions:
  - path: docs/decisions/YYYY-MM-DD-<slug>.md
    title: <Decision Title>
    date: YYYY-MM-DD
    status: active
    tags:
      - <tag>
```

## Final Output

Report the decision file, index update, related specs touched, and any superseded decisions.
