---
name: ce-spec-create
description: "Create or update living feature specs from PRDs, feature requests, existing behavior, or implementation changes. Use when the user says spec:create, create a spec, turn this PRD into a spec, write/update product intent, or needs a durable feature contract in docs/specs/."
argument-hint: "[PRD path, feature request, existing feature path, or scope]"
---

# Create Living Spec

Create durable feature intent that stays current with the code. A spec describes what the feature is now, not the implementation plan.

## Storage

- Specs live under `docs/specs/`.
- `docs/specs/index.yml` is the entrypoint.
- Use one spec per feature or coherent capability.
- Plans may reference specs, but specs do not contain task progress.

## Workflow

1. Read `docs/specs/index.yml` if present and find related specs.
2. Gather source context: PRD/request, existing code, tests, product docs, standards, and recent decisions.
3. Define the feature boundary, users, current behavior, non-goals, acceptance criteria, and open questions.
4. Create or update the smallest relevant spec file.
5. Link related decision records from `docs/decisions/` when they exist.
6. Update `docs/specs/index.yml` without disrupting its existing schema.

## Rules

- Living intent stays alive; plans expire; decisions are logged separately.
- Preserve unresolved ambiguity as `Open Questions / TODOs`; do not hide product assumptions.
- Do not add implementation task lists, story breakdowns, progress state, or transient plans.
- Keep paths repo-relative.
- If standards exist at `docs/standards/index.yml`, load applicable standards before writing.

## Default Spec Format

Use the repo's existing format if present. Otherwise:

```markdown
---
title: <Feature Name>
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags:
  - <tag>
related_decisions: []
---

# <Feature Name>

## Intent

## Users

## Current Behavior

## Key Flows

## Acceptance Criteria

## Boundaries and Non-Goals

## Open Questions / TODOs

## Decision Links
```

## Default Index Format

```yaml
specs:
  - path: docs/specs/<slug>.md
    title: <Feature Name>
    status: active
    tags:
      - <tag>
```

## Final Output

Report the spec path, index update, open questions, and any decisions that should be logged.
