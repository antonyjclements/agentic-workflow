---
title: Spec-Driven Agentic Workflow
status: active
created: 2026-05-24
updated: 2026-06-07
tags:
  - workflow
  - specs
  - decisions
related_decisions:
  - docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md
  - docs/decisions/2026-05-24-proactively-prompt-for-knowledge-capture.md
  - docs/decisions/2026-05-24-configure-ticket-creation-skill.md
  - docs/decisions/2026-05-24-blank-ticket-skill-skips-ticket-creation.md
  - docs/decisions/2026-05-24-configure-post-pr-ci-monitoring.md
  - docs/decisions/2026-05-24-use-agents-skills-as-canonical-skill-directory.md
  - docs/decisions/2026-05-24-support-feature-spec-indexes.md
  - docs/decisions/2026-05-24-use-feature-directories-for-specs-and-plans.md
  - docs/decisions/2026-05-24-import-prds-as-historical-source-artifacts.md
  - docs/decisions/2026-05-24-add-human-review-gates-for-specs-and-plans.md
  - docs/decisions/2026-05-24-add-ce-init-installer-skill.md
  - docs/decisions/2026-05-24-add-circleci-pipeline-monitor-skill.md
  - docs/decisions/2026-05-24-curate-skills-and-enforce-readme-updates.md
  - docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md
  - docs/decisions/2026-05-24-use-single-feature-plan-file.md
  - docs/decisions/2026-05-25-add-decision-refresh-maintenance.md
  - docs/decisions/2026-05-25-configure-pr-creation-skill.md
  - docs/decisions/2026-05-25-configure-commit-message-format.md
  - docs/decisions/2026-05-25-use-pr-title-and-body-templates.md
  - docs/decisions/2026-05-25-simplify-slack-and-ticket-config.md
  - docs/decisions/2026-05-25-delegate-ci-monitor-retry-policy.md
  - docs/decisions/2026-05-28-combine-brainstorm-and-spec-creation.md
  - docs/decisions/2026-05-28-add-dedicated-prd-creation-skill.md
  - docs/decisions/2026-05-28-rename-skills-to-aw-prefix.md
  - docs/decisions/2026-05-28-use-prd-lifecycle-statuses-and-cleanup.md
---

# Spec-Driven Agentic Workflow

## Intent

Agentic Workflow should make spec-driven development portable across repositories without requiring teams to adopt a heavyweight external framework.

## Users

- Engineers installing the workflow into a repository.
- Coding agents using `AGENTS.md` and skills to plan, implement, review, and ship work.
- Future maintainers reconstructing why a feature behaves the way it does.

## Current Behavior

The workflow uses `AGENTS.md` as the portable orientation and routing file. The installer copies that file into a target repo, installs skills globally under `~/.agents/skills`, symlinks supported agent runtime skill directories to that canonical location when safe, writes `.agentic-workflow-version`, creates repo-local indexes for PRDs, brainstorms, features, standards, decisions, and learnings, and installs an editable PRD template at `docs/product/prds/template.md`.

The repository root `aw-version.txt` is the single source for installer-owned workflow version markers. Installed `AGENTS.md` carries the same version stamp, and installers or migrators use `aw-version.txt` when running from a full source tree.

The workflow routes:

- durable feature intent to `docs/features/<feature>/spec.md`
- historical PRD inputs to `docs/product/prds/`
- authored PRDs to `docs/product/prds/`, using repo-local PRD templates when present
- archived workflow artifacts out of the working tree through `aw-clean-artifacts`
- optional brainstorm or ideation artifacts to `docs/brainstorms/`
- enforceable project rules to `docs/standards/`
- immutable decisions to `docs/decisions/`
- correction-driven learnings to `docs/learnings/` or `~/.agents/learnings/`
- ticket creation routing to `docs/workflow/config.yml`
- workflow step skill override routing to `docs/workflow/config.yml`
- implementation test-policy routing to `docs/workflow/config.yml`
- PR title/body template routing to `docs/workflow/config.yml`
- commit message routing to `docs/workflow/config.yml`
- post-PR CI/CD monitor routing to `docs/workflow/config.yml`
- Slack research routing to `docs/workflow/config.yml`
- CircleCI PR pipeline monitoring through `aw-monitor-circleci`
- human review routing to `docs/workflow/config.yml`
- repo initialization only through `aw-init`
- canonical bundled skill names under the `aw-*` prefix
- multi-word bundled skill names in `aw-<verb>-<object>` form
- README maintenance as a required check when user-facing workflow behavior changes
- curated bundled skills that exclude deprecated or unrelated entrypoints
- plan document review through `aw-review-doc` before human review, ticket creation, or implementation
- workflow compliance review through `aw-check-workflow-compliance` after branch push and before PR creation when implementation, configured step routing, or test policy compliance needs verification
- compounding knowledge through `aw-capture-solution` and `aw-refresh-solutions`
- decision-log maintenance through `aw-refresh-decisions`
- ticket-first implementation handoff for agents that start from a ticket ID or URL after checkout

## Key Flows

- A pasted, linked, or file-based PRD is persisted with `aw-import-prd`, then passed to `aw-brainstorm` when ambiguity remains. `aw-brainstorm` clarifies the product behavior and creates or updates the living spec in the same run.
- Raw ideas can start with `aw-brainstorm`; the skill creates or updates a living spec when durable intent is ready.
- When the user wants a PRD as the output, `aw-create-prd` authors one from an idea, brainstorm, notes, or clarified product direction. The skill uses `docs/product/prds/template.md` when a repo defines it, otherwise it falls back to its bundled PRD template.
- PRDs use lifecycle statuses: `imported`, `draft`, `ready-for-spec`, `promoted`, `superseded`, and `archived`. Spec creation marks source PRDs `promoted` and records `promoted_to` without rewriting the PRD body.
- Artifacts marked `status: archived` may be removed from the working tree by `aw-clean-artifacts`; git history is the archive.
- Already-clear requirements, existing behavior, implementation-driven spec updates, or explicit spec drafts can use `aw-create-spec` directly.
- Each step returns the artifact path or ID that becomes the next step's input.
- After spec creation, the agent asks whether to create a product sign-off PR and requests configured spec reviewers.
- After plan creation, the agent asks whether to create an engineering sign-off PR and requests configured plan reviewers.
- Repos generate `docs/features/index.yml` from `docs/features/<feature>/spec.md` with `aw-index-features`.
- A plan may be created from the spec, but the plan remains temporary execution scaffolding.
- Plans live at `docs/features/<feature>/plan.md` until removed.
- Plans are reviewed with `aw-review-doc` before human review, ticket creation, or implementation.
- A plan may be turned into stories or tickets through `aw-create-tickets`. Repos can replace that step through `workflow.steps.create_tickets.skill`; when it is blank, the bundled step drafts the ticket split without creating external tickets.
- Repos can override skill-backed workflow steps through `workflow.steps.<step>.skill` in `docs/workflow/config.yml`. Blank step skill values use the bundled default skill. Configured custom skills must preserve the same workflow contract: read relevant workflow config, accept the same handoff artifact or identifier, return the expected artifact path or ID, and report any unsupported contract element.
- Repos can override auxiliary helper skills through `workflow.auxiliary.<key>.skill` in `docs/workflow/config.yml`. Auxiliary skills are helper capabilities invoked by one or more workflow steps rather than user-visible lifecycle stages.
- Replaced legacy skill selector fields such as `ticket_creation.skill`, `git.commit.skill`, `post_pr.ci_monitor.skill`, and `research.slack.skill` are removed from default config and documentation. Existing repos migrate those values to matching `workflow.steps.<step>.skill` or `workflow.auxiliary.<key>.skill` entries instead of preserving both shapes. Existing `workflow.steps.<auxiliary>.skill` values are migrated to `workflow.auxiliary.<key>.skill`.
- Existing installs can use `aw-upgrade` to dry-run and apply workflow config migration. Applying migration backs up the prior `docs/workflow/config.yml`, writes the migrated current config, and updates `.agentic-workflow-version`.
- Config migration preserves unknown fields and non-skill settings, adds missing current defaults, removes migrated legacy skill selector fields, and stops for manual review when old and new routing values conflict.
- Existing installs can refresh skills and repo-local agent artifacts without a local clone by running the installer with `--remote` or a pinned `--source-url`. The remote source must contain the same repo layout as a GitHub archive of `agentic-workflow`.
- Installed `AGENTS.md` starts with task triage that routes trivial changes, small fixes, feature or behavior changes, and high-risk or cross-cutting changes to the smallest safe workflow path.
- Task triage lives in `AGENTS.md`, not `docs/workflow/config.yml`; a repo can need every workflow capability over time, while each task should choose only the ceremony it needs.
- The default configurable workflow steps include PRD intake, PRD creation, brainstorming, spec creation, spec review, human review request, planning, plan review, ticket creation, work execution, code review, workflow compliance checking, commit, commit/push/PR, and post-PR pipeline monitoring.
- The default auxiliary skill keys include feature indexing, debugging, worktree creation, code simplification, decision logging, retrospective learning, solution capture/refresh, decision refresh, standards discovery, Slack research, artifact cleanup, and PR feedback resolution.
- Implementation agents can pick up one ticket at a time with traceability back to the source plan and spec.
- Agents may also start from only a ticket after checking out a repo; in that case they read repo guidance, fetch the ticket through the configured tool when available, load linked source artifacts, and verify the ticket does not conflict with living specs or decisions before editing.
- Repos can configure implementation discipline through `workflow.implementation.test_policy` in `docs/workflow/config.yml`. Blank or missing values use `acceptance-first`.
- Supported implementation test policies are `acceptance-first`, `tdd`, `bdd`, `characterization-first`, `test-after`, `manual-verification`, and `none`.
- For `acceptance-first`, agents map spec acceptance criteria or ticket acceptance criteria to automated tests or explicit manual checks before implementation where feasible.
- For `tdd`, agents write the narrowest failing automated test before feature code where feasible, then implement and refactor.
- For `bdd`, agents express behavior scenarios before implementation, using Given/When/Then form when helpful, then map those scenarios to tests or manual checks.
- For `characterization-first`, agents capture current behavior with tests before changing behavior in legacy or unclear areas.
- For `test-after`, agents may implement before adding or updating tests, but must still report the tests added or the reason tests were not added.
- For `manual-verification`, agents document manual checks instead of requiring automated tests.
- For `none`, agents do not require tests for the work but must treat the lack of test expectation as an explicit repo policy rather than an omission.
- `aw-work` and any configured replacement work skill read `workflow.implementation.test_policy` before implementation, apply the configured policy, and summarize coverage, tests, manual checks, and exceptions.
- `aw-create-worktree` remains responsible for isolated checkout creation, but its handoff directs agents to continue with the configured work skill and implementation test policy.
- `aw-check-workflow-compliance` checks whether the completed work followed configured workflow routing, implementation test policy, spec acceptance criteria coverage, README update expectations, review gates, pushed-branch evidence, and PR-body readiness after branch push and before PR creation.
- `aw-check-workflow-compliance` reports pass/fail findings with enough detail for the agent to fix local issues or surface justified exceptions. It does not replace CI, code review, or spec review.
- During implementation, resolved ambiguity is logged with `aw-log-decision`.
- When the decision log becomes large or hard to scan, `aw-refresh-decisions` rebuilds the decision index and generates derived summaries without rewriting immutable decision records.
- Before PR, `aw-review-spec` checks for drift between changed behavior and living specs.
- Before push/PR, non-trivial changes receive `aw-review-code`.
- After PR creation, `aw-monitor-pipeline` delegates to the configured CI monitor/fix skill when enabled.
- Repos can configure `pull_request.template.title` and `pull_request.template.body` with markdown template file refs from GitHub URLs, raw GitHub URLs, `file://` URLs, absolute paths, or repo-relative paths. Blank values use the default generated title/body.
- Repos can configure `workflow.steps.commit.skill` or `workflow.steps.commit_push_pr.skill` to use enterprise-specific commit or shipping steps. If blank, commit skills follow the configured template, scope requirements, allowed types, examples, repo instructions, or recent history.
- CircleCI repos can configure `post_pr.ci_monitor.provider: circleci`; `aw-monitor-pipeline` routes to `aw-monitor-circleci`. Retry limits, polling cadence, and CircleCI-specific settings are owned by the monitor skill or optional `docs/workflow/circleci.yml`, not the default workflow config.
- When a user correction reveals a reusable lesson, `aw-record-retrospective` stores the learning.
- At natural pauses, agents run a capture checkpoint so users do not need to remember to invoke decision logging, retrospective learning, or compounding manually.
- When a non-trivial problem is solved, `aw-capture-solution` captures reusable knowledge; `aw-refresh-solutions` keeps those solution docs current.
- Slack research can be routed through a custom enterprise helper skill using `workflow.auxiliary.research_slack.skill` in `docs/workflow/config.yml`.
- Before commit/PR, agents check whether `README.md` needs an update and make that update when setup, commands, configuration, architecture, repo structure, or workflow behavior changed.
- README documents the `docs/workflow/config.yml` schema, including top-level blocks, value types, defaults, supported workflow step keys, supported auxiliary keys, and valid implementation test policies.

## Acceptance Criteria

- New installs create `.agentic-workflow-version`, `docs/product/prds/index.yml`, `docs/product/prds/template.md`, `docs/brainstorms/index.yml`, `docs/features/index.yml`, `docs/standards/index.yml`, `docs/decisions/index.yml`, and `docs/learnings/index.yml`.
- The installed `AGENTS.md` version stamp, installer version marker, and config migration version marker are sourced from root `aw-version.txt` when a full source tree is available.
- New installs include `AGENTS.md` and `CLAUDE.md`; `CLAUDE.md` delegates to `AGENTS.md`.
- New installs place skills in `~/.agents/skills` and, when safe, symlink `~/.claude/skills`, `~/.codeium/skills`, and `~/.windsurf/skills` to that directory.
- The agentic-workflow repository itself does not require root-level `AGENTS.md`, `CLAUDE.md`, or `scripts/install.sh`; `aw-init` owns those artifacts.
- Agents can discover and use the spec, standard, decision, and learning registries from `AGENTS.md`.
- Installed `AGENTS.md` includes top-level task triage so trivial changes and small fixes can avoid the full spec/plan/review workflow when it is not warranted.
- Repos using `docs/features/<feature>/spec.md` can generate a feature index.
- Skills exist for spec creation, spec review, decision logging, standards discovery, and retrospective learning.
- A skill exists for authored PRD creation from ideas, brainstorms, and notes, with template-driven sections and format.
- PRD promotion updates source PRD lifecycle metadata without rewriting PRD content.
- Archived workflow artifacts can be removed from the working tree by a cleanup skill.
- `aw-brainstorm` can resolve ambiguous PRDs or raw ideas and create/update the living feature spec without requiring a separate `aw-create-spec` handoff.
- `aw-create-spec` remains available for direct spec creation from already-clear requirements, existing behavior, or implementation changes.
- A skill exists to refresh decision indexes and summaries without making historical decision records mutable.
- Ticket creation can be routed through a configured skill in `docs/workflow/config.yml`.
- Skill-backed workflow steps can be overridden through `workflow.steps.<step>.skill` in `docs/workflow/config.yml`, and blank values preserve bundled defaults.
- Auxiliary helper skills can be overridden through `workflow.auxiliary.<key>.skill` in `docs/workflow/config.yml`, and blank values preserve bundled defaults.
- Custom workflow-step skills preserve the default step contract for inputs, outputs, config reading, and unsupported behavior reporting.
- README defines the `docs/workflow/config.yml` schema, including valid value types, defaults, workflow step keys, auxiliary keys, and implementation test policy values.
- Implementation test policy can be configured through `workflow.implementation.test_policy` in `docs/workflow/config.yml`.
- Missing or blank implementation test policy defaults to `acceptance-first`.
- The implementation test policy supports `acceptance-first`, `tdd`, `bdd`, `characterization-first`, `test-after`, `manual-verification`, and `none`.
- `aw-plan` derives test scenarios from living spec or ticket acceptance criteria when available and records concrete test expectations for feature-bearing units.
- `aw-work` and configured replacement work skills apply the configured implementation test policy and report tests, manual checks, acceptance coverage, and exceptions.
- `aw-create-worktree` hands off to the configured work skill and implementation test policy after creating an isolated checkout.
- Replaced step-specific skill selector fields are absent from installed default config and have documented migration paths to `workflow.steps`.
- A bundled `aw-upgrade` skill exists for existing installs and runs workflow config migration in dry-run mode before applying changes.
- Applying workflow config migration creates a timestamped backup, writes the migrated config, updates `.agentic-workflow-version`, preserves unknown fields, and removes migrated legacy skill selector fields.
- Workflow config migration maps `ticket_creation.skill`, `git.commit.skill`, `research.slack.skill`, `post_pr.ci_monitor.skill`, and older `workflow.steps.<auxiliary>.skill` entries to their current `workflow.steps`, `workflow.auxiliary`, or provider equivalents, and reports conflicts instead of choosing between incompatible old and new values.
- The installer supports a remote source path through `--remote`, `--source-url`, or `AGENTIC_WORKFLOW_SOURCE_URL` so installed repos can fetch updated skills and agent artifacts without a local clone.
- A bundled `aw-check-workflow-compliance` skill exists and can be invoked after branch push and before PR creation to verify configured step routing, implementation test policy compliance, acceptance criteria coverage, README maintenance, review gate expectations, pushed-branch evidence, and PR-body readiness.
- Workflow compliance checking produces actionable findings and justified exceptions without replacing CI, `aw-review-code`, or `aw-review-spec`.
- PR title/body templates can be configured in `docs/workflow/config.yml`.
- Commit message conventions can be enforced through `docs/workflow/config.yml`.
- Slack research can be routed through a configured auxiliary skill in `docs/workflow/config.yml`. Workspace or channel defaults belong in the configured skill, not the base workflow config.
- Plan review runs before human review, ticket creation, or implementation.
- Tickets include enough traceability for future agents to implement from the ticket alone after checkout.
- Human review PR reviewer assignment can be configured in `docs/workflow/config.yml`.
- CircleCI pipeline monitoring can be routed through `aw-monitor-pipeline` with `post_pr.ci_monitor.provider: circleci`, without adding retry, polling, or CircleCI-specific defaults to the base config.
- Deprecated or unrelated skills are removed from the bundled skill set and installer-cleaned from global installs when practical.
- Bundled skills use the `aw-*` prefix, and old `ce-*` skills are removed from global installs during `aw-init`.
- PR-time shipping guidance includes a spec drift check for durable behavior changes.
- PR-time shipping guidance includes an automated README update check.
- PR-time shipping guidance includes code review before push/PR and optional post-PR CI monitoring until success or blocker.
- Non-trivial work includes a proactive capture checkpoint before final summary or commit/PR.

## Boundaries and Non-Goals

- The workflow does not require BMAD, SpecKit, LID, or another packaged framework.
- The workflow does not make plans a permanent source of truth.
- Decision records are not edited to rewrite history; later changes create superseding decisions.
- Decision refresh creates derived indexes and summaries; it does not archive or rewrite old decision records by default.
- Workflow compliance checking is not a security sandbox and cannot guarantee custom skill behavior. It provides reviewable evidence and findings against the configured workflow contract.

## Open Questions / TODOs

- Decide whether to add command aliases such as `/spec:create`, `/spec:review`, and `/decision:log` for tools that support slash commands.
- Decide whether root-level `specs/`, `standards/`, and `decisions/` should be supported as aliases for repos that do not use `docs/`.

## Decision Links

- `docs/decisions/2026-05-24-use-docs-for-spec-driven-workflow.md`
- `docs/decisions/2026-05-24-proactively-prompt-for-knowledge-capture.md`
- `docs/decisions/2026-05-24-configure-ticket-creation-skill.md`
- `docs/decisions/2026-05-24-blank-ticket-skill-skips-ticket-creation.md`
- `docs/decisions/2026-05-24-configure-post-pr-ci-monitoring.md`
- `docs/decisions/2026-05-24-use-agents-skills-as-canonical-skill-directory.md`
- `docs/decisions/2026-05-24-support-feature-spec-indexes.md`
- `docs/decisions/2026-05-24-use-feature-directories-for-specs-and-plans.md`
- `docs/decisions/2026-05-24-import-prds-as-historical-source-artifacts.md`
- `docs/decisions/2026-05-24-add-human-review-gates-for-specs-and-plans.md`
- `docs/decisions/2026-05-24-add-ce-init-installer-skill.md`
- `docs/decisions/2026-05-24-add-circleci-pipeline-monitor-skill.md`
- `docs/decisions/2026-05-24-curate-skills-and-enforce-readme-updates.md`
- `docs/decisions/2026-05-24-make-ce-init-the-install-source-of-truth.md`
- `docs/decisions/2026-05-24-use-single-feature-plan-file.md`
- `docs/decisions/2026-05-25-add-decision-refresh-maintenance.md`
- `docs/decisions/2026-05-25-configure-pr-creation-skill.md`
- `docs/decisions/2026-05-25-configure-commit-message-format.md`
- `docs/decisions/2026-05-25-use-pr-title-and-body-templates.md`
- `docs/decisions/2026-05-25-simplify-slack-and-ticket-config.md`
- `docs/decisions/2026-05-28-combine-brainstorm-and-spec-creation.md`
- `docs/decisions/2026-05-28-add-dedicated-prd-creation-skill.md`
- `docs/decisions/2026-05-28-rename-skills-to-aw-prefix.md`
- `docs/decisions/2026-05-28-use-prd-lifecycle-statuses-and-cleanup.md`
