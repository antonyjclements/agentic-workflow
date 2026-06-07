---
name: aw-work
description: Execute work efficiently while maintaining quality and finishing features
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

Execute a plan, spec, or bare work request through implementation, verification, review, and shipping readiness.

## Input

`$ARGUMENTS` may be:

- ticket/story identifier or URL
- plan/spec path
- bare work description
- blank: use latest active plan at `docs/features/*/plan.md`

## Phase 0: Triage

If ticket/story: read it through the configured ticketing tool when available, then load linked spec, plan, decisions, and standards before editing.

Ticket-first sessions are valid. If the agent starts from only a ticket ID/URL after checking out the repo:

1. Read `AGENTS.md` and `docs/workflow/config.yml`.
2. Use the configured ticketing skill/tool when available to fetch the ticket.
3. Load linked source artifacts from the ticket: spec, plan, decisions, standards, acceptance criteria, and test expectations.
4. If links are missing, search `docs/features/`, `docs/decisions/`, and `docs/standards/` for the likely feature area before editing.
5. If ticket requirements conflict with the living spec or decisions, stop and surface the mismatch before implementing.
6. Preserve traceability in the final summary and PR body.

If plan/spec: read it fully, then continue.

Read `docs/workflow/config.yml` and determine the effective implementation test policy from `workflow.implementation.test_policy`. Blank or missing values default to `acceptance-first`.

Supported policies:

- `acceptance-first`: map acceptance criteria to automated tests or explicit manual checks before implementation where feasible.
- `tdd`: write the narrowest failing automated test before feature code where feasible.
- `bdd`: express behavior scenarios before implementation, using Given/When/Then when helpful.
- `characterization-first`: capture current behavior with tests before changing legacy or unclear behavior.
- `test-after`: implementation may come first, but tests or a clear no-test rationale are still required.
- `manual-verification`: document manual checks instead of requiring automated tests.
- `none`: no tests are required by repo policy, but final summaries must state that explicit policy.

If bare prompt:

1. Inspect likely files, related tests, and local patterns.
2. If `docs/standards/index.yml` exists, read it, infer how it maps standards to paths/tags/domains, and load only standards relevant to the likely files or task.
3. Classify:
   - trivial: 1-2 files, no behavior change -> implement directly; discover tests if behavior-bearing
   - small/medium: clear scope under ~10 files -> create task list
   - large/risky: cross-cutting, auth/payments/migrations/architecture, 10+ files -> recommend `aw-brainstorm` or `aw-plan`; honor user choice

## Phase 1: Understand and Set Up

For plans, treat the plan as a decision artifact, not a script. Extract implementation units, requirements, files, test scenarios, verification, execution notes, standards references, implementation-time unknowns, scope boundaries, references, and deferred work. Ask only for ambiguity that would change the implementation.

Extract acceptance criteria from the plan/spec/ticket and map each feature-bearing criterion to an automated test, manual check, or justified exception according to the effective test policy.

For tickets, treat the ticket as the execution unit. Preserve traceability back to the linked plan/spec and update ticket status only when the configured ticket tool/workflow supports it and the user expects that behavior.

If the plan does not mention standards and `docs/standards/index.yml` exists, load the relevant standards before editing. Standards are enforceable project guidance unless they conflict with higher-priority instructions; call out conflicts instead of silently ignoring them.

Do not edit plan progress during execution. Only final status may flip from active to completed during shipping.

Set up branch/worktree:

- If on feature branch, continue unless branch name is meaningless; suggest rename.
- If on default branch, prefer new branch or `aw-create-worktree`. Continuing on default requires explicit permission.
- Pull default branch only when creating branch/worktree and permissions allow.

Create/update task tracker from units, preserving unit IDs when present.

## Phase 2: Implement

Work unit by unit:

- read nearby code before editing
- follow existing patterns and named references
- follow applicable `docs/standards/` guidance
- apply the effective implementation test policy
- honor stronger TDD/test-first/characterization notes when present
- resolve implementation-time unknowns locally when possible; ask only for product/scope decisions
- keep changes scoped; defer tangential cleanup
- update task status as work completes

For frontend work, run/inspect the app when practical. For iOS work, prefer XcodeBuildMCP workflows when available.

## Phase 3: Test and Verify

Run the narrowest meaningful verification first, then broader checks as risk warrants:

- unit/integration tests for changed behavior
- lint/typecheck/build if affected
- migrations/schema checks when relevant
- browser/simulator/manual checks for UI flows

If tests cannot run, record why. Fix failures caused by the change. Do not hide unrelated pre-existing failures; summarize them separately.

## Phase 4: Review and Polish

Before finishing:

- inspect `git diff`
- remove debug code, dead code, and accidental churn
- ensure docs/config/tests match behavior
- update `README.md` when user-facing setup, commands, configuration, architecture, or workflow behavior changed
- check the diff against applicable standards from `docs/standards/index.yml`
- run `aw-review-code` for non-trivial or risky changes when time/context allows
- address safe findings; surface judgment calls
- record ship-readiness evidence needed by `aw-check-workflow-compliance`: effective test policy, tests/checks run, acceptance coverage, README status, review gates run/skipped, and justified exceptions

## Phase 5: Ship Readiness

Only when implementation and verification are complete:

- mark active plan completed if applicable
- run a capture checkpoint:
  - log durable decisions with `aw-log-decision`
  - capture correction-driven lessons with `aw-record-retrospective`
  - suggest `aw-capture-solution` for non-trivial solved problems or reusable patterns
- summarize changed files and behavior
- summarize effective implementation test policy, tests added/updated/run, manual checks, acceptance coverage, and justified exceptions
- list tests/checks run and failures
- identify residual risks or follow-ups
- do not commit/push/PR unless the user asks or invoked a workflow that includes it

## Rules

- Preserve user changes; never revert unrelated work.
- Prefer repo conventions over new abstractions.
- Keep task tracker as execution state; keep plan as decision artifact.
- Ask before destructive git actions or direct default-branch commits.
- Continue until the requested work is genuinely handled or a real blocker remains.
