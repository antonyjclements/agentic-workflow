---
name: ce-brainstorm
description: 'Explore requirements and approaches through collaborative dialogue, then write a right-sized requirements document. Use when the user says "let''s brainstorm", "what should we build", or "help me think through X", presents a vague or ambitious feature request, or seems unsure about scope or direction -- even without explicitly asking to brainstorm.'
argument-hint: "[feature idea or problem to explore]"
---

# Brainstorm a Feature or Improvement

Current year: 2026. Brainstorming defines what to build; `ce-plan` defines how. Output is a requirements document, not code. Use repo-relative paths only.

## Interaction

Ask one question at a time. Prefer concise single-select choices; use multi-select only for compatible sets. Use the platform blocking question tool; fall back to numbered chat only if unavailable/failing. Open-ended questions are fine when the answer is genuinely narrative and options would bias it.

## Principles

- Match ceremony to ambiguity and scope.
- Be a thinking partner: suggest alternatives, challenge assumptions, explore trade-offs.
- Resolve product/user behavior, scope, success criteria, and non-goals here.
- Keep implementation details out unless the brainstorm is inherently technical.
- Prefer low carrying cost; avoid speculative future-proofing.

## Flow

1. If no feature description, ask what to explore.
2. Resume a recent matching `docs/brainstorms/*-requirements.md` only after user confirmation.
3. Classify domain:
   - software/product work -> continue
   - non-software exploration -> follow `references/universal-brainstorming.md`
   - quick factual/single-step request -> answer directly
4. Decide whether brainstorming is needed. If requirements are already clear and actionable, offer to proceed to `ce-plan`/`ce-work`; honor the user.
5. Assess depth:
   - brief alignment for simple low-risk work
   - standard requirements for normal feature/problem work
   - deep exploration for ambiguous, strategic, cross-cutting, or high-risk work
6. Gather context from user, repo, docs, learnings, and named resources. Use web/current research when outside facts may have changed.
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
9. Write or update requirements doc.

## Requirements Doc

Create `docs/brainstorms/YYYY-MM-DD-###-slug-requirements.md` unless updating an existing doc.

Use a right-sized structure:

```markdown
# <Title> Requirements

Created: YYYY-MM-DD
Status: draft|ready-for-planning

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
## Planning Handoff
```

For tiny work, collapse sections but keep the core facts. For larger work, add IDs (`A1`, `F1`, `AE1`) where they improve traceability.

## Quality Gate

Before finishing, verify:

- product behavior is explicit enough that planning will not invent it
- acceptance examples cover normal and edge flows
- scope boundaries are clear
- unresolved questions are labeled blocking vs deferred
- implementation details are absent unless needed
- paths are repo-relative

Final response: doc path, major decisions, open questions, and recommended next step.
