---
title: Spec-Driven Agentic Workflow
status: active
created: 2026-05-24
updated: 2026-05-28
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
- A plan may be turned into stories or tickets through `aw-create-tickets`, which uses `docs/workflow/config.yml` to choose the ticket creation skill. If `ticket_creation.skill` is blank, ticket creation is skipped. Provider-specific ticket defaults belong in the configured skill or ticket system, not the base workflow config.
- Implementation agents can pick up one ticket at a time with traceability back to the source plan and spec.
- Agents may also start from only a ticket after checking out a repo; in that case they read repo guidance, fetch the ticket through the configured tool when available, load linked source artifacts, and verify the ticket does not conflict with living specs or decisions before editing.
- During implementation, resolved ambiguity is logged with `aw-log-decision`.
- When the decision log becomes large or hard to scan, `aw-refresh-decisions` rebuilds the decision index and generates derived summaries without rewriting immutable decision records.
- Before PR, `aw-review-spec` checks for drift between changed behavior and living specs.
- Before push/PR, non-trivial changes receive `aw-review-code`.
- After PR creation, `aw-monitor-pipeline` delegates to the configured CI monitor/fix skill when enabled.
- Repos can configure `pull_request.template.title` and `pull_request.template.body` with markdown template file refs from GitHub URLs, raw GitHub URLs, `file://` URLs, absolute paths, or repo-relative paths. Blank values use the default generated title/body.
- Repos can configure `git.commit.skill` to use an enterprise-specific commit skill. If blank, commit skills follow the configured template, scope requirements, allowed types, examples, repo instructions, or recent history.
- CircleCI repos can configure `post_pr.ci_monitor.skill: aw-monitor-circleci` to watch branch pipelines and fix branch-caused failures until green or blocked. Retry limits, polling cadence, and CircleCI-specific settings are owned by the linked skill or optional `docs/workflow/circleci.yml`, not the default workflow config.
- When a user correction reveals a reusable lesson, `aw-record-retrospective` stores the learning.
- At natural pauses, agents run a capture checkpoint so users do not need to remember to invoke decision logging, retrospective learning, or compounding manually.
- When a non-trivial problem is solved, `aw-capture-solution` captures reusable knowledge; `aw-refresh-solutions` keeps those solution docs current.
- Slack research can be routed through a custom enterprise skill using `research.slack.skill` in `docs/workflow/config.yml`.
- Before commit/PR, agents check whether `README.md` needs an update and make that update when setup, commands, configuration, architecture, repo structure, or workflow behavior changed.

## Acceptance Criteria

- New installs create `.agentic-workflow-version`, `docs/product/prds/index.yml`, `docs/product/prds/template.md`, `docs/brainstorms/index.yml`, `docs/features/index.yml`, `docs/standards/index.yml`, `docs/decisions/index.yml`, and `docs/learnings/index.yml`.
- New installs include `AGENTS.md` and `CLAUDE.md`; `CLAUDE.md` delegates to `AGENTS.md`.
- New installs place skills in `~/.agents/skills` and, when safe, symlink `~/.claude/skills`, `~/.codeium/skills`, and `~/.windsurf/skills` to that directory.
- The agentic-workflow repository itself does not require root-level `AGENTS.md`, `CLAUDE.md`, or `scripts/install.sh`; `aw-init` owns those artifacts.
- Agents can discover and use the spec, standard, decision, and learning registries from `AGENTS.md`.
- Repos using `docs/features/<feature>/spec.md` can generate a feature index.
- Skills exist for spec creation, spec review, decision logging, standards discovery, and retrospective learning.
- A skill exists for authored PRD creation from ideas, brainstorms, and notes, with template-driven sections and format.
- PRD promotion updates source PRD lifecycle metadata without rewriting PRD content.
- Archived workflow artifacts can be removed from the working tree by a cleanup skill.
- `aw-brainstorm` can resolve ambiguous PRDs or raw ideas and create/update the living feature spec without requiring a separate `aw-create-spec` handoff.
- `aw-create-spec` remains available for direct spec creation from already-clear requirements, existing behavior, or implementation changes.
- A skill exists to refresh decision indexes and summaries without making historical decision records mutable.
- Ticket creation can be routed through a configured skill in `docs/workflow/config.yml`.
- PR title/body templates can be configured in `docs/workflow/config.yml`.
- Commit message conventions can be enforced through `docs/workflow/config.yml`.
- Slack research can be routed through a configured skill in `docs/workflow/config.yml`. Workspace or channel defaults belong in the configured skill, not the base workflow config.
- Plan review runs before human review, ticket creation, or implementation.
- Tickets include enough traceability for future agents to implement from the ticket alone after checkout.
- Human review PR reviewer assignment can be configured in `docs/workflow/config.yml`.
- CircleCI pipeline monitoring can be routed through `aw-monitor-circleci` from `docs/workflow/config.yml` without adding retry, polling, or CircleCI-specific defaults to the base config.
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
