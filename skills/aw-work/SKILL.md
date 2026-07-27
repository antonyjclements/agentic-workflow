---
name: aw-work
description: "Implement a plan, spec, ticket, or bare work request through to verified, ship-ready code, applying the repo's configured test policy and standards. Use when the user says 'implement this', 'build it', 'work on this', 'pick up this ticket', 'start on the plan', or hands over a plan/spec/ticket path or ID. For diagnosing a bug first, use aw-debug; for deciding what to build, use aw-brainstorm or aw-plan."
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

Execute a plan, spec, or bare work request through implementation, verification, review, and shipping readiness.

First action, if `.scripts/aw-gate.js` exists: `node .scripts/aw-gate.js track aw-work` (silent no-op otherwise).

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
4. Record the selected tier through the deterministic helper:
   `node .scripts/aw-gate.js workflow-record tier --tier <trivial|small_fix|feature|high_risk> --reason "<short reason>"`.
   The helper owns whether workflow trace is enabled and will no-op when disabled.

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

Keep optional verification capabilities lazy:

- If the effective policy is `characterization-first`, read
  `references/characterization-in-work.md` before Phase 2 edits and follow it.
- If `docs/workflow/config.yml` has `e2e.enabled: true`, read
  `references/e2e-in-work.md` after acceptance criteria are mapped. When
  `e2e.enabled` is false or missing, do not inspect e2e triggers, markers, or
  coverage details in the default path.

## Phase 2: Implement

Work unit by unit, applying ordinary implementation craft. What this repo adds on
top of it:

- follow applicable `docs/standards/` guidance
- apply the effective implementation test policy, honoring stronger
  TDD/test-first/characterization notes in the plan when present
- update task status as work completes
- Preserve spec traceability through the deterministic helper. Subagents return
  annotation intents to the parent; they do not call `trace-annotate` directly.
  The parent writes one `.aw/tmp/trace-intents.<token>.json` batch and runs
  `node .scripts/aw-gate.js trace-annotate --batch <path> --delete-batch-on-success`.
  For simple non-parallel work, direct `trace-annotate <spec|test|code>` is
  acceptable. Do not read `trace.enabled` in the skill to decide whether to
  annotate; the helper owns that policy and no-ops when disabled.
  Before modifying already annotated code, read the referenced spec section.

For frontend work, run/inspect the app when practical. For iOS work, prefer XcodeBuildMCP workflows when available.

## Phase 3: Test and Verify

Run the narrowest meaningful verification first, then broaden with risk: tests
for changed behavior, then lint/typecheck/build, migrations, and manual or
browser checks as the change warrants. If optional e2e or characterization
references were loaded in Phase 1, follow their Phase 3 verification notes.

If tests cannot run, record why. Fix failures caused by the change. Do not hide unrelated pre-existing failures; summarize them separately.

## Phase 4: Review and Polish

Inspect `git diff` and clean up debug code, dead code, and accidental churn before
running the workflow-specific checks below:

- ensure docs/config/tests match behavior
- update `README.md` when user-facing setup, commands, configuration, architecture, or workflow behavior changed
- check the diff against applicable standards from `docs/standards/index.yml`
- if the work affects UI or UX and `workflow.design.enabled` is true with `workflow.design.hooks.implementation_review.skill` non-empty, invoke that design hook with the changed artifact, plan/spec path, or current diff
- run `aw-review` for non-trivial or risky changes when time/context allows; address safe findings and surface judgment calls
- record ship-readiness evidence needed by `aw-check-workflow-compliance`: effective test policy, tests/checks run, acceptance coverage, e2e coverage or exception when `e2e` is enabled and in scope, README status, review gates run/skipped, and justified exceptions

## Phase 5: Ship Readiness

Only when implementation and verification are complete:

- mark active plan completed if applicable
- run a capture checkpoint:
  - log durable decisions with `aw-capture decision`
  - capture correction-driven lessons with `aw-capture learning`
  - suggest `aw-capture solution` for non-trivial solved problems or reusable patterns
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
