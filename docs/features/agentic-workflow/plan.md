---
status: completed
created: 2026-06-07
origin: docs/features/agentic-workflow/spec.md
depth: standard
---

# Configurable Workflow Steps and Compliance Plan

## Problem and Scope

Agentic Workflow currently has several repo-configurable routing hooks, but the core skill-backed workflow steps are still described as fixed `aw-*` invocations. Implementation guidance also treats TDD/test-first behavior as optional unless a plan explicitly asks for it, and there is no dedicated pre-PR compliance check that verifies an implementation followed repo workflow policy.

This plan implements three related capabilities:

- configurable skill overrides for default workflow steps through `docs/workflow/config.yml`
- repo-configured implementation test policy for `aw-work` and replacement work skills
- a new `aw-check-workflow-compliance` skill that reviews workflow policy compliance after branch push and before PR creation

Scope includes the installed repo artifacts, bundled skill docs, installer default config, smoke tests, and README. It does not implement a runtime plugin system or a hard security sandbox for custom skills.

## Requirements Traceability

Source spec: `docs/features/agentic-workflow/spec.md`

- Configurable workflow steps: `workflow.steps.<step>.skill` values override bundled defaults while blank values preserve defaults.
- Custom workflow-step skills must preserve the step contract for inputs, outputs, config reading, and unsupported behavior reporting.
- Implementation test policy: `workflow.implementation.test_policy` supports `acceptance-first`, `tdd`, `bdd`, `characterization-first`, `test-after`, `manual-verification`, and `none`, defaulting to `acceptance-first` when blank or missing.
- `aw-plan` derives test scenarios from spec or ticket acceptance criteria and records concrete test expectations.
- `aw-work` and configured replacement work skills apply the configured implementation test policy and report coverage, tests, manual checks, and exceptions.
- `aw-create-worktree` hands off to the configured work skill and implementation test policy after checkout creation.
- `aw-check-workflow-compliance` verifies configured step routing, implementation test policy compliance, acceptance criteria coverage, README maintenance, and review gate expectations.
- Compliance checking produces actionable findings and justified exceptions without replacing CI, `aw-review-code`, or `aw-review-spec`.

## Relevant Existing Patterns

- `docs/workflow/config.yml` already owns repo-local routing for ticket creation, Slack research, commit messages, PR templates, CI monitoring, and human review.
- `skills/aw-init/scripts/install.sh` writes the default installed config and is the source of truth for repo-local install scaffolding.
- `skills/aw-init/artifacts/AGENTS.md` is the main installed routing contract that tells agents which workflow skills to use.
- `README.md` is the human-facing operating manual and must be updated for workflow/configuration changes.
- `scripts/test-install.sh` smoke-tests installed repo files, global skill installation, global learnings, and runtime skill symlinks.
- `skills/aw-work/SKILL.md` already reads `docs/workflow/config.yml` for ticket-first work and has phases for implementation, verification, review, and ship readiness.
- `skills/aw-commit-push-pr/SKILL.md` already performs pre-PR spec drift, README, capture, and code review checks for non-trivial changes.
- `docs/decisions/2026-05-25-simplify-slack-and-ticket-config.md` favors small routing hooks in default config rather than provider-specific bulk.

No applicable standards are indexed in `docs/standards/index.yml`.

## Decisions

- Keep the installed default config sparse: include the `workflow.implementation.test_policy` default and an empty/minimal `workflow.steps` section, then document the full supported hook list in `AGENTS.md` and `README.md`.
- Treat blank `workflow.steps.<step>.skill` values as "use bundled default" so repos can opt in one step at a time.
- Replace existing step-specific skill override fields with `workflow.steps.<step>.skill` as the canonical override path. Remove old skill-selector fields such as `ticket_creation.skill`, `git.commit.skill`, and `post_pr.ci_monitor.skill` rather than maintaining fallback aliases.
- Run or require `aw-check-workflow-compliance` after branch push and before PR creation for non-trivial or risky implementation changes. Trivial docs-only or mechanical changes can skip it with an explicit note.
- Keep compliance checking advisory/actionable rather than absolute enforcement. CI and review skills remain separate gates.
- Add `aw-upgrade` as the safe path for existing installs to migrate older `docs/workflow/config.yml` shapes, using dry-run first, timestamped backups on apply, and conflict reporting.

These decisions should be logged with `aw-log-decision` during implementation if they remain unchanged.

## Implementation Units

### Unit 1: Add Workflow Config Schema and Installed Defaults

Goal: Extend repo workflow config with step override hooks and implementation test policy while keeping the default file readable.

Files likely touched:

- `docs/workflow/config.yml`
- `skills/aw-init/scripts/install.sh`
- `scripts/test-install.sh`
- `README.md`
- `skills/aw-init/artifacts/AGENTS.md`

Behavior and contract changes:

- Add `workflow.implementation.test_policy: acceptance-first` to the default config.
- Add `workflow.steps` support with blank skill values for the primary extension points, or an intentionally sparse structure documented in `AGENTS.md` and `README.md`.
- Remove replaced skill-selector fields from the installed default config. Preserve non-skill configuration fields such as commit format rules, PR title/body templates, human reviewers, and provider metadata.
- Ensure installed repos receive the new config only when `docs/workflow/config.yml` is missing or `--force` is used, matching current installer behavior.

Tests to add/update:

- Update `scripts/test-install.sh` to assert installed `docs/workflow/config.yml` contains `workflow:`, `implementation:`, `test_policy: acceptance-first`, and `steps:`.
- Run `bash -n skills/aw-init/scripts/install.sh`.
- Run `bash scripts/test-install.sh`.

Edge cases:

- Existing repos without the new keys continue to work because missing test policy defaults to `acceptance-first`.
- Existing repos with custom config are preserved unless forced.
- Existing repos that still carry old skill-selector fields need a documented migration to `workflow.steps`; agents should not keep implementing both config shapes indefinitely.
- YAML should stay simple enough for agents to parse by inspection even without a parser.

Ticket/story hint:

- Title: Add workflow config defaults for step hooks and implementation test policy
- Acceptance: Fresh installs include the new config keys; old config remains compatible; install smoke tests cover the keys.

### Unit 2: Document Step Override Routing in AGENTS and Skill Contracts

Goal: Make configurable workflow steps a clear agent contract rather than just config syntax.

Files likely touched:

- `skills/aw-init/artifacts/AGENTS.md`
- `README.md`
- `skills/aw-plan/SKILL.md`
- `skills/aw-create-tickets/SKILL.md`
- `skills/aw-work/SKILL.md`
- `skills/aw-debug/SKILL.md`
- `skills/aw-review-doc/SKILL.md`
- `skills/aw-review-code/SKILL.md`
- `skills/aw-review-spec/SKILL.md`
- `skills/aw-commit/SKILL.md`
- `skills/aw-commit-push-pr/SKILL.md`
- `skills/aw-monitor-pipeline/SKILL.md`

Behavior and contract changes:

- Add a `Workflow Step Routing` section to installed `AGENTS.md`.
- Define supported step keys and bundled defaults:
  - `import_prd -> aw-import-prd`
  - `create_prd -> aw-create-prd`
  - `brainstorm -> aw-brainstorm`
  - `create_spec -> aw-create-spec`
  - `index_features -> aw-index-features`
  - `review_spec -> aw-review-spec`
  - `request_human_review -> aw-request-human-review`
  - `plan -> aw-plan`
  - `review_plan -> aw-review-doc`
  - `create_tickets -> aw-create-tickets`
  - `work -> aw-work`
  - `debug -> aw-debug`
  - `create_worktree -> aw-create-worktree`
  - `simplify_code -> aw-simplify-code`
  - `review_code -> aw-review-code`
  - `check_workflow_compliance -> aw-check-workflow-compliance`
  - `commit -> aw-commit`
  - `commit_push_pr -> aw-commit-push-pr`
  - `monitor_pipeline -> aw-monitor-pipeline`
  - `monitor_circleci -> aw-monitor-circleci`
  - `log_decision -> aw-log-decision`
  - `record_retrospective -> aw-record-retrospective`
  - `capture_solution -> aw-capture-solution`
  - `refresh_solutions -> aw-refresh-solutions`
  - `refresh_decisions -> aw-refresh-decisions`
  - `discover_standards -> aw-discover-standards`
  - `research_slack -> aw-research-slack`
  - `clean_artifacts -> aw-clean-artifacts`
  - `resolve_pr_feedback -> aw-resolve-pr-feedback`
- Define migration behavior: agents should read `workflow.steps.<step>.skill` for skill routing and ignore removed legacy skill-selector fields if they appear in older repos. Non-skill configuration fields remain authoritative for their domains.
- Require agents to read `docs/workflow/config.yml` before invoking a configurable downstream step.
- Require replacement skills to preserve the default handoff contract: same input type, expected output artifact/ID, config awareness, and clear unsupported-behavior reporting.
- Update skills that invoke or recommend another skill so they mention configured replacement skills where relevant.

Tests to add/update:

- Add grep-style assertions to `scripts/test-install.sh` for installed `AGENTS.md` text such as `Workflow Step Routing`, `workflow.steps`, and `workflow.implementation.test_policy`.
- Run `bash scripts/test-install.sh`.
- Manually inspect `README.md` and affected skill docs for consistent step names.

Edge cases:

- Some skills are direct user entrypoints; they should still run normally when invoked directly.
- A configured custom skill may be unavailable in the current runtime. The agent should report the missing skill and fall back only when the config or user permits it.

Ticket/story hint:

- Title: Add workflow step override contract to agent guidance and skills
- Acceptance: Agents can discover default step mappings, know when to use configured replacements, and understand the migration away from old skill-selector fields.

### Unit 3: Apply Configured Test Policy to Planning, Work, and Worktree Handoff

Goal: Make acceptance/TDD/BDD discipline a default implementation behavior, not a remembered preference.

Files likely touched:

- `skills/aw-plan/SKILL.md`
- `skills/aw-work/SKILL.md`
- `skills/aw-create-worktree/SKILL.md`
- `skills/aw-init/artifacts/AGENTS.md`
- `README.md`

Behavior and contract changes:

- `aw-plan` records acceptance-derived test scenarios for every feature-bearing implementation unit when spec or ticket acceptance criteria exist.
- `aw-work` reads `workflow.implementation.test_policy` during triage and applies the configured policy during implementation.
- `aw-work` final summaries include the effective test policy, automated tests added/updated/run, manual checks, acceptance coverage, and exceptions.
- `aw-create-worktree` remains a checkout tool, but its integration section tells agents to continue with the configured work skill and effective test policy.

Tests to add/update:

- Add documentation-level assertions in `scripts/test-install.sh` or a small shell validation block that installed `AGENTS.md` mentions `acceptance-first` and `test_policy`.
- During implementation verification, run `rg -n "acceptance-first|test_policy|workflow.implementation" skills/aw-plan/SKILL.md skills/aw-work/SKILL.md skills/aw-create-worktree/SKILL.md skills/aw-init/artifacts/AGENTS.md README.md`.

Test scenarios:

- `acceptance-first`: plan contains acceptance criteria and work guidance requires mapping them to tests/manual checks before implementation where feasible.
- `tdd`: work guidance requires a failing test before feature code where feasible.
- `bdd`: work guidance asks for behavior scenarios, using Given/When/Then when helpful.
- `characterization-first`: work guidance captures existing behavior before changing legacy/unclear behavior.
- `test-after`: work guidance permits implementation before tests but requires reporting tests added or why not.
- `manual-verification`: work guidance permits manual checks and requires documenting them.
- `none`: work guidance treats no-test expectation as explicit repo policy and still reports that policy.

Edge cases:

- Docs-only and mechanical-refactor changes may not need new tests; they should be reported as justified exceptions.
- A repo may have no automated test harness; agents should still map acceptance criteria to manual checks.

Ticket/story hint:

- Title: Enforce configured implementation test policy in plan/work handoff
- Acceptance: Plans derive test scenarios from acceptance criteria, work skills apply the configured policy, and summaries report coverage/exceptions.

### Unit 4: Add `aw-check-workflow-compliance`

Goal: Provide a dedicated review skill that checks whether completed work followed the configured workflow contract.

Files likely touched:

- `skills/aw-check-workflow-compliance/SKILL.md`
- `README.md`
- `skills/aw-init/artifacts/AGENTS.md`
- `scripts/test-install.sh`

Behavior and contract changes:

- Add a bundled `aw-check-workflow-compliance` skill.
- Inputs: blank for current branch/diff, or a plan/spec/ticket path/ref when supplied.
- The skill reads `AGENTS.md`, `docs/workflow/config.yml`, relevant spec/plan/ticket artifacts, `docs/features/index.yml`, and applicable `docs/standards/index.yml`.
- The skill checks:
  - configured step routing was respected or exceptions are justified
  - effective implementation test policy was applied
  - acceptance criteria are mapped to tests or manual checks
  - README updates were made or consciously skipped when workflow/setup behavior changed
  - expected review gates such as `aw-review-spec` and `aw-review-code` were run or exceptions are documented
  - pushed branch evidence is present when the check is run in the shipping flow
  - PR body inputs are ready to include policy, tests/checks, acceptance coverage, and residual risks
- Output findings first, ordered by severity, with actionable remediation. If there are no findings, report residual risk.

Tests to add/update:

- Update `scripts/test-install.sh` to assert global skill install includes `aw-check-workflow-compliance/SKILL.md`.
- Run `bash scripts/test-install.sh`.
- Run `rg -n "aw-check-workflow-compliance" skills README.md docs/features/agentic-workflow/spec.md`.
- Add a fixture-style dry-run scenario to the skill docs or test plan: a sample diff/config with `workflow.implementation.test_policy: acceptance-first`, a pushed-branch marker or simulated branch ref, acceptance criteria mapped to tests, and a README-required workflow config change. The expected result should include no missing-test finding, no missing-push finding, and a README finding only when the README update is absent.

Edge cases:

- The skill cannot prove a custom agent truly followed a process; it checks evidence in docs, diff, tests, and summaries.
- In headless or no-diff contexts, the skill should report insufficient scope rather than inventing compliance.

Ticket/story hint:

- Title: Add workflow compliance review skill
- Acceptance: The new skill is installed globally, documented, and checks routing, test policy, acceptance coverage, README, review gates, and final-summary accountability.

### Unit 5: Integrate Compliance into Shipping Flow

Goal: Make compliance checking part of normal shipping readiness without making small changes feel ceremonial.

Files likely touched:

- `skills/aw-work/SKILL.md`
- `skills/aw-commit-push-pr/SKILL.md`
- `skills/aw-commit/SKILL.md`
- `skills/aw-init/artifacts/AGENTS.md`
- `README.md`

Behavior and contract changes:

- `aw-work` records enough ship-readiness evidence for the configured compliance step to evaluate after push.
- `aw-commit-push-pr` pushes the branch, then runs or requires compliance checking before PR creation when behavior, workflow, config, setup, or acceptance criteria changed.
- `aw-commit` does not run the full shipping compliance gate because it does not push or create PRs; it should prepare the evidence that `aw-commit-push-pr` or a later shipping flow will check.
- Trivial docs-only/mechanical changes may skip compliance with an explicit note.
- Compliance findings should be fixed before PR creation when they are locally actionable.

Tests to add/update:

- Documentation validation via `rg -n "check_workflow_compliance|aw-check-workflow-compliance|workflow.steps" skills/aw-work/SKILL.md skills/aw-commit/SKILL.md skills/aw-commit-push-pr/SKILL.md skills/aw-init/artifacts/AGENTS.md README.md`.
- Run `bash scripts/test-install.sh` after installer/doc changes.

Edge cases:

- Configured custom compliance skill is missing: report the missing skill and fall back to bundled `aw-check-workflow-compliance` only if the config is blank or user approves.
- If push fails because of credentials, network, or remote policy, skip the post-push/pre-PR compliance gate and report the blocker instead of pretending compliance passed.
- Compliance check should not replace `aw-review-code`, `aw-review-spec`, or CI.

Ticket/story hint:

- Title: Wire workflow compliance into ship readiness
- Acceptance: Work and commit-push-PR flows invoke or require post-push/pre-PR compliance checks for non-trivial changes and document justified skips.

### Unit 6: Update User-Facing Documentation and Decision Records

Goal: Keep durable docs aligned with the new workflow behavior.

Files likely touched:

- `README.md`
- `docs/features/agentic-workflow/spec.md`
- `docs/decisions/<date>-configure-workflow-step-overrides.md`
- `docs/decisions/<date>-configure-implementation-test-policy.md`
- `docs/decisions/<date>-add-workflow-compliance-check.md`
- `docs/decisions/index.yml`
- `docs/decisions/summaries/workflow.md`

Behavior and contract changes:

- README documents the new config keys, default step map, test policy values, and compliance skill.
- Decisions record the selected config shape, default test policy, and compliance gate scope.
- Spec remains the source of product intent and is updated only if implementation resolves open questions.

Tests to add/update:

- Run `rg -n "workflow.steps|test_policy|aw-check-workflow-compliance" README.md docs/features/agentic-workflow/spec.md docs/decisions`.
- Run any decision refresh workflow if implementation changes decision indexes/summaries manually.

Edge cases:

- Do not rewrite older immutable decisions; add new decision records that relate to prior configuration decisions.

Ticket/story hint:

- Title: Document workflow step overrides, test policy, and compliance decisions
- Acceptance: README, spec, and decisions agree on behavior and defaults.

## Test Plan

Primary verification commands:

- `bash -n skills/aw-init/scripts/install.sh`
- `bash scripts/test-install.sh`
- `rg -n "workflow.steps|test_policy|aw-check-workflow-compliance" README.md skills docs/features/agentic-workflow/spec.md`

Acceptance coverage:

- Fresh install creates repo config with workflow step/test-policy defaults.
- Fresh install exposes the new compliance skill in the global skills directory.
- Installed `AGENTS.md` tells agents how to resolve configured workflow step overrides.
- Installed config no longer includes replaced step-specific skill selector fields.
- Existing repos with old skill selector fields have a documented migration path to `workflow.steps`.
- Planning guidance maps acceptance criteria to tests.
- Work guidance applies the configured implementation test policy and reports coverage/exceptions.
- Shipping guidance checks workflow compliance after push and before PR creation for non-trivial changes.
- A fixture-style compliance scenario documents expected pass/fail behavior for test policy, pushed branch evidence, acceptance coverage, and README-required changes.

Manual review:

- Inspect generated `docs/workflow/config.yml` from `scripts/test-install.sh` temp output if a failure occurs.
- Review README and `AGENTS.md` side by side for matching config keys and default step names.

## Risks and Open Questions

- The repo does not currently have a general config parser or unit test harness for skill docs. Installer smoke tests and grep checks are useful but shallow.
- The old specialized skill-selector hooks overlap with new `workflow.steps` routing. Implementation should remove those selector fields from default config and documentation while preserving non-skill configuration fields.
- The spec leaves two product questions open. This plan assumes sparse installed config and compliance required for non-trivial/risky work; implementation should log those as decisions or revise the spec if the choices change.
- Custom skills cannot be truly enforced by config alone. Compliance review should make behavior auditable rather than claiming hard enforcement.

## Deferred Work

- A future `aw-update` or migration skill could add missing `workflow.*` keys to already-installed repos without requiring `--force`.
- A machine-readable schema for `docs/workflow/config.yml` could support stronger validation later.
- A script-level compliance harness could eventually parse config and produce structured output, but the first version can be skill-instruction driven.

## Handoff

Recommended next step: resolve any document-review findings, then implement with `aw-work docs/features/agentic-workflow/plan.md` on the current feature branch `workflow-configurable-steps-compliance`.
