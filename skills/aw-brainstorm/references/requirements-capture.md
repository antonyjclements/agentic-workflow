# Artifact Capture

This content is loaded after collaborative dialogue has produced decisions worth preserving.

`aw-brainstorm` writes the right artifact for the user's intent:

- living feature spec by default for software/product work
- ideation artifact when the user explicitly wants exploratory output without committing to a PRD or spec
- no document for quick requests with no durable product value

Do not include implementation details such as libraries, schemas, endpoints, file layouts, or code structure unless those details are themselves product constraints.

---

## Living Spec Shape

Use the repo's existing spec format when present. Otherwise:

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

Update `docs/features/index.yml` after creating a new spec.

## Ideation Shape

Use this shape when the user asks for options exploration or concept framing instead of a PRD or living spec. Route authored PRD requests to `aw-prd`.

```markdown
# <Title>

Created: YYYY-MM-DD
Status: draft|ready-for-spec

## Problem

## Users / Actors

## Goals

## Key Flows

## Acceptance Examples

## Scope Boundaries

## Success Criteria

## Constraints and Dependencies

## Open Questions

## Deferred for Later

## PRD / Spec Handoff
```

Use `docs/brainstorms/YYYY-MM-DD-###-slug-idea.md` for exploratory artifacts. Use `aw-prd` for authored PRDs.

## Section Guidance

- **Intent / Summary:** 1-3 lines in plain language. Say what the product or capability is becoming.
- **Problem:** who is affected, what is painful, and why this matters.
- **Users / Actors:** include when more than one human, agent, or system is meaningfully involved.
- **Key Flows:** include when behavior spans multiple steps or actors.
- **Acceptance Examples:** include when prose alone leaves state-dependent behavior ambiguous.
- **Boundaries and Non-Goals:** state deliberate exclusions and deferred adjacent work.
- **Open Questions / TODOs:** preserve unresolved ambiguity explicitly; label blocking questions separately from deferred questions when useful.
- **Decision Links:** link relevant decisions and imported PRDs when they exist.
- **PRD lifecycle:** when a PRD is promoted into a spec, update only PRD frontmatter/index metadata to `status: promoted`, `promoted: YYYY-MM-DD`, and `promoted_to: <spec path>`.

## Quality Checklist

Before finalizing:

- Would `aw-plan` still have to invent product behavior?
- Are users, flows, success criteria, and non-goals clear enough for implementation planning?
- Are unresolved product questions visible rather than hidden as assumptions?
- Did implementation detail leak into product intent?
- Are imported PRDs or prior brainstorm artifacts linked when relevant?
- Were source PRDs marked promoted when a spec was created from them?
- Did `docs/features/index.yml` get updated if a spec was created?

If planning would need to invent product behavior, scope boundaries, or success criteria, the brainstorm is not complete yet.
