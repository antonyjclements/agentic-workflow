---
name: aw-brainstorm
description: 'Explore product ideas, PRDs, and ambiguous feature requests through collaborative dialogue, then create or update durable feature intent when ready. Use when the user says "let''s brainstorm", "what should we build", or "help me think through X", presents a PRD, vague or ambitious feature request, or seems unsure about scope or direction -- even without explicitly asking to brainstorm. Use aw-prd when the requested output is a PRD.'
argument-hint: "[feature idea or problem to explore]"
---

# Brainstorm a Feature or Improvement

Current year: 2026. Brainstorming defines what to build; `aw-plan` defines how. Output is not code. Use repo-relative paths only.

PRDs and raw ideas usually contain implicit ambiguity and open questions. Treat PRD and idea intake as a discovery step that resolves enough product behavior to write durable intent. If the PRD is pasted or linked, use `aw-prd` first so the historical source artifact is preserved, then continue from the imported PRD path. Once product behavior is explicit enough, create or update the living feature spec in the same run. If the user wants a PRD as the output, route to `aw-prd`.

## Interaction

Ask one question at a time. Prefer concise single-select choices; use multi-select only for compatible sets. Use the platform blocking question tool; fall back to numbered chat only if unavailable/failing. Open-ended questions are fine when the answer is genuinely narrative and options would bias it.

## Principles

- Match ceremony to ambiguity and scope.
- Be a thinking partner: suggest alternatives, challenge assumptions, explore trade-offs.
- Resolve product/user behavior, scope, success criteria, and non-goals here.
- Prefer producing or updating the living spec for software/product work.
- Use `aw-prd` when the user wants a PRD artifact. Use lightweight ideation notes only when the concept is not ready for a PRD or living spec.
- Keep implementation details out unless the brainstorm is inherently technical.
- Prefer low carrying cost; avoid speculative future-proofing.

## Flow

1. If no feature description, ask what to explore.
2. Resume a recent matching `docs/brainstorms/*-requirements.md` only after user confirmation.
3. Classify domain:
   - software/product work -> continue
   - non-software exploration -> follow `references/universal-brainstorming.md`
   - quick factual/single-step request -> answer directly
4. Decide whether brainstorming is needed. If requirements are already clear and actionable, create/update the living spec directly or offer to proceed to `aw-plan`/`aw-work`; honor the user.
5. Assess depth:
   - brief alignment for simple low-risk work
   - standard requirements for normal feature/problem work
   - deep exploration for ambiguous, strategic, cross-cutting, or high-risk work
6. Gather context from user, repo, imported PRDs under `docs/product/prds/`, docs, learnings, and named resources. If `workflow.design.enabled` is true and `workflow.design.hooks.discovery.skill` is non-empty, invoke that design hook with the PRD path, brainstorm context, or feature idea before durable UX intent is settled. Use web/current research when outside facts may have changed.
7. Explore:
   - actors/users
   - problem and evidence
   - desired behavior and key flows
   - acceptance examples
   - scope boundaries/non-goals
   - success criteria
   - constraints/dependencies
   - risks and unresolved questions
8. Push on weak assumptions with targeted prompts. Do not ask checklist questions just to fill a template.
9. Choose the output artifact:
   - living spec: default for software/product work that affects durable feature intent
   - PRD: route to `aw-prd` when the user asks to create or update a PRD
   - ideation doc: when the user wants to compare options or keep the concept exploratory without writing a PRD
   - no artifact: only for quick factual/single-step requests
10. Write or update the chosen artifact.

## Living Spec Output

For normal software/product work, create or update `docs/features/<feature>/spec.md` and update `docs/features/index.yml` without disrupting its existing schema.

Use the repo's existing spec format if present. Otherwise:

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

Rules for spec output:

- Preserve unresolved ambiguity as `Open Questions / TODOs`; do not hide product assumptions.
- Keep specs focused on durable behavior and intent, not implementation tasks or progress.
- Link imported PRDs, idea docs, brainstorm notes, and related decisions when they exist.
- When a source PRD under `docs/product/prds/` informs the spec, mark that PRD `status: promoted` in frontmatter and `docs/product/prds/index.yml`, and add `promoted: YYYY-MM-DD` plus `promoted_to: <spec path>`. Do not rewrite the PRD body.
- If `workflow.design.enabled` is true and `workflow.design.hooks.spec_review.skill` is non-empty, invoke that design hook with the spec path before human review or planning.
- Offer product/human review for the spec only when `human_review.spec.reviewers` is configured in `docs/workflow/config.yml`, the change is high-risk, or the user asked for review; otherwise finish without asking. If review is wanted, invoke `aw-request-human-review spec <spec path>`.

## Ideation Output

Create `docs/brainstorms/YYYY-MM-DD-###-slug-idea.md` (creating `docs/brainstorms/` if missing — installs do not create it) when the user wants exploratory notes but not a PRD or living spec. Use `aw-prd` for authored PRDs.

Use a right-sized structure:

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
## Spec Handoff
```

For tiny work, collapse sections but keep the core facts. For larger work, add IDs (`A1`, `F1`, `AE1`) where they improve traceability.

## Quality Gate

Before finishing, verify:

- product behavior is explicit enough that spec or planning will not invent it
- acceptance examples cover normal and edge flows
- scope boundaries are clear
- unresolved questions are labeled blocking vs deferred
- implementation details are absent unless needed to define product behavior
- paths are repo-relative

Final response: artifact path, major decisions, open questions, human-review status when a spec was written, and recommended next step. For a living spec, the usual next step is `aw-plan <spec path>` when implementation planning is needed. For ideation output, the usual next step is `aw-prd <artifact path>` when the user wants a PRD or `aw-create-spec <artifact path>` when ready to promote the idea into durable feature intent.
