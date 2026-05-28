---
name: aw-plan
description: "Create structured plans for multi-step tasks -- software features, research workflows, events, study plans, or any goal that benefits from breakdown. Also deepens existing plans with interactive sub-agent review. Use when the user says 'plan this', 'create a plan', 'how should we build', 'break this down', or when a living spec is ready for planning. Use 'deepen the plan' or 'deepening pass' for the deepening flow. For exploratory requests, prefer aw-brainstorm first."
argument-hint: "[optional: feature description, spec path, plan path to deepen, or any task to plan]"
---

# Create Technical Plan

Current year: 2026. `aw-brainstorm` defines what; `aw-plan` defines how; `aw-work` executes. Direct invocation always produces or updates a plan. Do not implement code here.

## Interaction

Ask one blocking question at a time using the platform question tool. Fall back to numbered chat options only when no blocking tool exists or it fails. If input is empty, ask what to plan. If unclear, ask only what is needed to proceed.

## Quality Bar

A ready plan has:

- problem frame, scope boundary, assumptions, dependencies
- requirements traceability to request, living spec, or origin artifact
- living spec traceability to `docs/features/<feature>/spec.md` when product intent already exists or is being created
- canonical save path `docs/features/<feature>/plan.md`
- repo-relative paths only; never absolute paths
- concrete implementation units with decisions and rationale
- explicit test file paths and enumerated test scenarios for each feature-bearing unit
- implementation units that can become tickets/stories when `aw-create-tickets` is used
- existing patterns/code references to follow
- applicable `docs/standards/` references when a standards registry exists
- clear sequencing and deferred work

## Phase 0: Source, Scope, Route

1. Resume if the user names an existing plan or a recent obvious match exists at `docs/features/*/plan.md`; update in place unless the user chooses a new file.
2. If the user says deepen/deepening for a plan, verify the target plan and jump to Deepening.
3. Classify domain:
   - software/code/API/db/repo/deploy work -> continue here
   - non-software -> follow `references/universal-planning.md`
   - ambiguous -> ask
4. Search `docs/features/*/spec.md` for relevant living specs. If multiple match, ask which. If one matches, treat it as primary source and carry forward users, flows, acceptance criteria, boundaries, decisions, dependencies, and open questions. If no spec matches, search recent `docs/brainstorms/` and `docs/product/prds/` artifacts only as secondary origins.
5. If no origin doc or input is thin, bootstrap briefly: problem, intended behavior, non-goals, success criteria, blockers. Suggest `aw-brainstorm` for product ambiguity, `aw-debug` for reachable bugs, and `aw-work` for obvious ready-to-execute fixes; the user decides.
6. Resolve true blockers before planning. Technical blockers can become plan research; product/scope blockers need user decision or explicit assumptions.
7. Choose depth: lightweight, standard, or deep.
8. For solo standard/deep plans, emit a concise scope confirmation before research. Lightweight with no material forks may auto-proceed with a one-line scope statement. Do not mention implementation units or file paths in this pre-research scope claim.

## Phase 1: Research

Always inspect local code, tests, docs, conventions, `docs/features/index.yml` for living product intent, `docs/decisions/index.yml` for prior decisions, `docs/solutions/` for prior learnings, and `docs/standards/index.yml` when present. Treat the standards index as the standards registry: infer its schema, select relevant referenced markdown standards by path/tag/glob/domain, and read only applicable standards. Discover user-named tools/resources before substituting alternatives. Decide on external research when APIs, libraries, standards, laws, pricing, or current behavior may have changed; use primary sources. Capture:

- relevant files and patterns
- applicable specs and decisions
- applicable standards and best-practice constraints
- constraints and contracts
- likely implementation boundaries
- test strategy signals
- risks, edge cases, and unknowns

If research reveals broader external contracts or cross-cutting risk, increase plan depth.

## Phase 2: Resolve Planning Questions

Separate:

- planning-time questions that affect architecture, scope, or sequencing: answer now via research or user choice
- implementation-time unknowns: record as checkpoints in the relevant unit

Do not continue with hidden assumptions when a product decision would change the plan materially.

## Phase 3: Structure

Create software plans at `docs/features/<feature>/plan.md`. Keep paths repo-relative. If no feature exists yet, create or identify the feature spec first.

Implementation units should be independently reviewable and ordered by dependency. Each unit includes:

- goal and rationale
- files likely touched
- standards to follow, when applicable
- behavior/contract changes
- tests to add/update with exact paths
- edge cases
- implementation notes that guide, not prescribe code
- dependencies and verification
- ticket/story hints when useful: title, acceptance criteria, dependencies, labels/components

Use optional diagrams or high-level pseudocode only when they clarify architecture. Put tangential cleanup in Deferred Work.

## Phase 4: Write

Use right-sized depth:

- Lightweight: summary, units, tests, risks, handoff.
- Standard: add context, decisions, data/API notes, rollout if relevant.
- Deep: add alternatives, migration/compatibility, observability, phased rollout, failure modes.

Template:

```markdown
---
status: active
created: YYYY-MM-DD
origin: <request-or-doc>
depth: lightweight|standard|deep
---

# <Plan Title>

## Problem and Scope
## Requirements Traceability
## Relevant Existing Patterns
## Decisions
## Implementation Units
## Test Plan
## Risks and Open Questions
## Deferred Work
## Handoff
```

Non-software plans use the universal planning reference instead of this template.

## Phase 5: Review and Handoff

Before writing, check:

- every origin requirement is addressed or explicitly deferred
- each feature-bearing unit has tests
- applicable standards from `docs/standards/index.yml` are referenced or deliberately marked not applicable
- paths are repo-relative
- decisions include rationale
- plan does not contain implementation progress state
- plan does not duplicate living spec content except as traceability
- plan can be converted into tickets by `aw-create-tickets` without inventing missing acceptance criteria

After writing, ask whether the user wants engineering/human review for the plan. If yes, invoke `aw-request-human-review plan <plan path>`.

Then summarize the plan file path, depth, major decisions, unresolved assumptions, whether human review was requested, and recommended next step (`aw-create-tickets <plan path>`, `aw-work <plan path>`, `aw-brainstorm`, or manual review).

## Deepening

For a complete active software plan, run a confidence check:

- missing requirements or traceability
- weak unit boundaries
- missing tests or edge cases
- risky migrations/API contracts/rollout gaps
- unstated assumptions
- mismatch with repo patterns
- mismatch with applicable standards

Present findings with recommendations. In interactive mode, ask which to integrate; in headless/programmatic contexts, apply only unambiguous clarifications and report the rest.
