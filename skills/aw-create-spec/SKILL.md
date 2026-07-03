---
name: aw-create-spec
description: "Create or update living feature specs from clear requirements, PRDs, existing behavior, or implementation changes. Use when the user says spec:create, create a spec, write/update product intent, or needs a durable feature contract in docs/features/<feature>/spec.md. For exploratory ideation or ambiguous product direction, use aw-brainstorm."
argument-hint: "[PRD path, feature request, existing feature path, or scope]"
---

# Create Living Spec

Create durable feature intent that stays current with the code. A spec describes what the feature is now, not the implementation plan.

## Storage

- Specs live at `docs/features/<feature>/spec.md`.
- `docs/features/index.yml` is the entrypoint.
- Use one spec per feature or coherent capability.
- Plans may live at `docs/features/<feature>/plan.md` while active, but specs do not contain task progress.

## Workflow

1. Read `docs/features/index.yml` if present and find related specs.
2. Gather source context: clarified requirements, brainstorm/ideation docs, imported PRDs, existing code, tests, product docs, standards, and recent decisions.
3. Define the feature boundary, users, current behavior, non-goals, acceptance criteria, and open questions.
4. Create or update the smallest relevant feature spec file at `docs/features/<feature>/spec.md`.
5. Link source PRDs, brainstorm/ideation artifacts, and related decision records when they exist.
6. Update `docs/features/index.yml` without disrupting its existing schema.
7. If one or more source PRDs under `docs/product/prds/` informed the spec, update only their frontmatter and `docs/product/prds/index.yml` lifecycle metadata:
   - `status: promoted`
   - `promoted: YYYY-MM-DD`
   - `promoted_to: docs/features/<feature>/spec.md`
8. Offer product/human review for the spec only when `human_review.spec.reviewers` is configured in `docs/workflow/config.yml`, the change is high-risk, or the user asked for review; otherwise finish without asking. If review is wanted, invoke `aw-request-human-review spec <spec path>`.

## Rules

- Living intent stays alive; plans expire; decisions are logged separately.
- Raw PRDs may be used directly when the goal is to produce a spec now. Resolve lightweight ambiguity in place, preserve non-blocking uncertainty as `Open Questions / TODOs`, and use `aw-brainstorm` only when the work needs exploratory product discovery before durable intent can be written.
- PRDs are source artifacts. Once promoted, keep their body unchanged and put future intent changes in the living spec or decision records.
- Do not mark source PRDs `archived` automatically. Promotion and cleanup are separate lifecycle steps.
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
features:
  - key: <feature-folder>
    title: <Feature Name>
    spec: docs/features/<feature-folder>/spec.md
    status: active
    tags:
      - <tag>
```

## Final Output

Report the spec path, feature index update, source PRDs marked promoted, open questions, any decisions that should be logged, whether human review was requested, and next step: `aw-plan <spec path>` when implementation planning is needed.
