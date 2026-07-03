---
name: aw-check-workflow-compliance
description: "Check whether completed work followed Agentic Workflow config, implementation test policy, acceptance coverage, README expectations, and review gates. Use after branch push and before PR creation for non-trivial changes."
argument-hint: "[optional: plan/spec/ticket path or branch ref]"
---

# Check Workflow Compliance

Review workflow-policy evidence after a branch has been pushed and before PR creation. This is an accountability check, not a security sandbox, and it does not replace CI or `aw-review`.

## Inputs

`$ARGUMENTS` may be:

- blank: review the current branch/diff
- plan/spec path
- ticket/story identifier or URL
- branch/ref

If no diff scope can be determined, report insufficient scope instead of inventing compliance.

## Configuration

Read `docs/workflow/config.yml` first.

- Use `workflow.steps.check_workflow_compliance.skill` only when a repo replaces this bundled compliance step.
- Read `workflow.implementation.test_policy`; blank or missing values default to `acceptance-first`.
- Read `workflow.steps.*.skill` to understand configured replacement steps. Do not use removed legacy skill-selector fields such as `ticket_creation.skill`, `git.commit.skill`, `post_pr.ci_monitor.skill`, and `research.slack.skill` for routing if they appear in older repos; report the migration path instead.
- Read `workflow.auxiliary.*.skill` to understand configured helper skill replacements such as Slack research.
- Treat non-skill configuration fields as authoritative, including `git.commit.*`, `pull_request.template.*`, `post_pr.ci_monitor.provider`, and `human_review.*.reviewers`.

## Evidence To Gather

1. `AGENTS.md` and `docs/workflow/config.yml`.
2. Current branch, push/upstream status, changed files, and diff.
3. Relevant plan/spec/ticket artifacts when supplied or discoverable.
4. `docs/features/index.yml` and affected `docs/features/*/spec.md` files.
5. Applicable `docs/standards/index.yml` entries when present.
6. Tests/checks run, based on terminal/session context when available and changed test files in the diff.
7. README changes when setup, commands, configuration, architecture, or workflow behavior changed.
8. Evidence that `aw-review` ran, or a justified exception.

## Checks

Report findings when:

- A configured `workflow.steps.<step>.skill` appears ignored without explanation.
- A configured `workflow.auxiliary.<key>.skill` appears ignored without explanation.
- A removed legacy skill-selector field is used as the active routing source.
- The effective implementation test policy is missing from the work summary, PR inputs, or handoff evidence.
- Acceptance criteria from the linked spec, plan, or ticket are not mapped to automated tests or explicit manual checks.
- Workflow/setup/configuration behavior changed but `README.md` was not updated or consciously skipped.
- Required spec/code review gates are missing for non-trivial behavior or workflow changes.
- The branch has not been pushed when this skill is invoked as part of the shipping flow.
- PR body inputs are not ready to include policy, tests/checks, acceptance coverage, decisions, and residual risks.

Severity guidance:

- `P1`: likely to ship work that violates repo workflow policy or lacks required acceptance/test evidence.
- `P2`: meaningful gap in traceability, documentation, review, or migration guidance.
- `P3`: advisory cleanup or clarity issue.

## Output

Findings first, ordered by severity:

```text
Workflow compliance findings:
- [P1] <title>
  location: <path/section>
  evidence: <what shows the gap>
  impact: <why it matters>
  suggested fix: <specific action>
```

If no findings:

```text
Workflow compliance: pass
Residual risk: <brief note>
```

Always include:

- effective test policy
- acceptance coverage summary
- README status
- review gate status
- pushed branch evidence or blocker

## Fixture-Style Dry Run

Use this scenario when validating the skill instructions:

- Config contains `workflow.implementation.test_policy: acceptance-first`.
- Config contains `workflow.steps.work.skill: ""` and no legacy skill-selector fields.
- Source spec has two acceptance criteria.
- Diff adds or updates tests that map to both acceptance criteria.
- Branch evidence shows an upstream branch or a simulated pushed branch ref.
- Diff changes `docs/workflow/config.yml`.
- README is missing the corresponding workflow config update.

Expected result:

- No missing-test finding.
- No missing-push finding.
- One README finding explaining that workflow configuration changed without user-facing docs.
- Effective test policy reported as `acceptance-first`.
- Acceptance coverage reported as covered by tests.

## Freshness Gate

After the compliance review completes (reporting, not fixing), if `.scripts/aw-gate.js` exists, stamp the freshness gate: `node .scripts/aw-gate.js record check_workflow_compliance`. This writes only the git-ignored gate state (and an optional telemetry event); it is not a file mutation of tracked work. A deterministic pre-push/CI `aw-gate.js check` then enforces that compliance ran recently. See `docs/workflow/README.md`.

## Rules

- Do not mutate files unless the user explicitly asks for fixes.
- Do not claim compliance if push, test, or review evidence is unavailable.
- Do not hide external blockers such as credentials, network, remote policy, or unavailable tools.
- Keep findings actionable and scoped to workflow compliance.
