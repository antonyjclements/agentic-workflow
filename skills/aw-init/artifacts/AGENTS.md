# AGENTS.md
<!-- AGENTIC_WORKFLOW_VERSION=0.5.0 -->

This file guides coding agents working in this repository. Follow it in addition to system, developer, and user instructions.

## Operating Principles

- Read the codebase before changing it. Prefer existing patterns, helpers, tests, and architecture over new conventions.
- Keep changes scoped to the user request. Do not perform unrelated refactors or cleanup unless required to finish safely.
- Preserve user work. Never revert or overwrite changes you did not make unless explicitly asked.
- Prefer small, verifiable steps: inspect, plan when useful, implement, test, review, summarize.
- Use repo-relative paths in docs, plans, and summaries.
- Ask only when a decision is genuinely blocked and cannot be inferred from local context.

## Task Triage

Match the workflow to the smallest path that safely handles the request. A repo may need every workflow capability over time, but most individual tasks do not need the full ceremony.

### Trivial Change

Use for typos, broken links, comments, formatting, obvious one-line fixes, or tiny docs edits.

- Edit directly.
- Run the narrowest relevant check when one exists.
- Run the configured `commit` or `commit_push_pr` step only when the user asks to publish.
- Skip spec updates, plans, workflow compliance, and review gates unless the user explicitly asks for them.

### Small Fix

Use for contained bugs, small config changes, local docs updates, or narrow test fixes.

- Use the configured `debug` auxiliary when the root cause is unclear; otherwise edit directly.
- Run targeted tests or checks for the touched area.
- Update README, specs, or decisions only when behavior, workflow, setup, or durable intent changes.
- Run the configured `commit_push_pr` step when the user asks to publish.

### Feature or Behavior Change

Use when product behavior, workflow behavior, APIs, UX, data contracts, acceptance criteria, or durable user-facing intent changes.

- Ensure the relevant living spec exists and is updated.
- Run the configured `plan` step when implementation has multiple steps or meaningful sequencing.
- Run the configured `work` step.
- Map acceptance criteria to tests or explicit verification.
- Run relevant review gates and workflow compliance before PR creation.

### High-Risk or Cross-Cutting Change

Use for auth, payments, security, data loss risk, migrations, CI/CD, architecture, multi-module changes, or work that is hard to reverse.

- Use the full spec, plan, work, review, compliance, commit, PR, and pipeline path.
- Prefer explicit acceptance criteria and durable decision logs.
- Treat missing spec, test, or review evidence as a blocker unless the user explicitly accepts the risk.

## Standards Registry

Many repos include a standards registry at `docs/standards/index.yml`. If it exists, treat it as the entrypoint for repository best practices.

- Read `docs/standards/index.yml` before planning, implementing, reviewing, or documenting non-trivial work.
- Use the index to find the relevant markdown standards for the files or domain being touched. Read only the applicable standards, not the whole folder by default.
- If the index format is unfamiliar, inspect it and infer the mapping between standards, descriptions, paths, tags, and file globs.
- Apply relevant standards as enforceable project guidance. If a standard conflicts with explicit user instructions or higher-priority system/developer instructions, follow the higher-priority instruction and call out the conflict.
- When planning work, cite applicable standards in the plan or implementation notes.
- When implementing, follow the standards before local preference.
- When reviewing, flag standards violations as findings with file/line references and concrete fixes.
- When standards are missing, stale, or ambiguous, mention the gap rather than inventing a rule.

## Spec-Driven Development

Use the repo as the source of truth for product intent, standards, and decisions.

- `AGENTS.md` is the orientation and routing file for coding agents. If a repo also has `CLAUDE.md`, keep it aligned with this file.
- Living specs live under `docs/features/<feature>/spec.md` and are indexed by `docs/features/index.yml`.
- Imported and authored PRDs live under `docs/product/prds/` and are indexed by `docs/product/prds/index.yml`.
- Authored PRDs should use `docs/product/prds/template.md` when the repo defines one.
- PRD statuses are `imported`, `draft`, `ready-for-spec`, `promoted`, `superseded`, and `archived`. `archived` means the artifact may be removed from the working tree by the configured `clean_artifacts` auxiliary; git is the historical archive.
- Brainstorm or ideation artifacts live under `docs/brainstorms/` and are indexed by `docs/brainstorms/index.yml`.
- Temporary plans live at `docs/features/<feature>/plan.md` until removed.
- Use one spec per feature or coherent capability. Specs describe current behavior and durable intent, not task progress.
- Standards live under `docs/standards/` and are indexed by `docs/standards/index.yml`.
- Decisions live under `docs/decisions/` and are indexed by `docs/decisions/index.yml`.
- Learnings live under `docs/learnings/` for repo-specific lessons or `~/.agents/learnings/` for global lessons.
- Session logs live under `docs/sessions/` and are indexed by `docs/sessions/index.yml`. They are written by the configured `log_session` auxiliary and consumed by the configured `synthesize_memory` auxiliary.
- The synthesized project wiki lives at `docs/context/wiki.md` and is regenerated by the configured `synthesize_memory` auxiliary. If it exists, read it at the start of each session for a compact summary of active features, recent decisions, top learnings, and known dead ends.
- Workflow configuration lives at `docs/workflow/config.yml`.
- If it describes intent, keep it alive. If it describes a plan, let it expire. If it describes a decision, log it immutably. If it is explicitly archived, remove it from the working tree through cleanup.
- If it is an imported PRD, preserve it as historical input; do not treat it as living truth. If it is authored in-repo, treat it as product input for specs.
- When a PRD becomes a spec, mark the PRD `status: promoted`, set `promoted_to` to the spec path, and leave the PRD body unchanged.
- When a source artifact is no longer needed in the working tree, mark it `status: archived`; the configured `clean_artifacts` auxiliary removes it from the working tree and index while git preserves history.

### Workflow Step Routing

The routing table below is the single source for default skills per step. Before invoking any configurable step, read `docs/workflow/config.yml` and use `workflow.steps.<step>.skill` when set; blank or missing means use the default listed below. For auxiliary skills, use `workflow.auxiliary.<key>.skill` when set; blank or missing means use the default. If a configured skill is unavailable, report it and ask whether to use the default or update the config.

Custom replacement skills must preserve the default step contract: accept the same handoff artifact or identifier, read relevant workflow config, return the expected artifact path/ID/result, and report unsupported behavior clearly.

**Workflow steps** — user-visible lifecycle stages:

| Key | Default skill | Handoff out | Notes |
|---|---|---|---|
| `import_prd` | `aw-import-prd` | `docs/product/prds/<prd>.md` | Pass to `brainstorm` when ambiguity remains, or `create_spec` when ready. |
| `create_prd` | `aw-create-prd` | `docs/product/prds/<prd>.md` | Pass to `brainstorm` when ambiguity remains, or `create_spec` when ready. |
| `brainstorm` | `aw-brainstorm` | `docs/features/<feature>/spec.md` | Should normally produce or update the living spec before finishing. When the user asks for PRD output, route to `create_prd` instead. |
| `create_spec` | `aw-create-spec` | `docs/features/<feature>/spec.md` | Use directly only when requirements are already clear, existing behavior needs documentation, or the user asks to skip exploratory discovery. |
| `review_spec` | `aw-review-spec` | — | |
| `request_human_review` | `aw-request-human-review` | — | |
| `plan` | `aw-plan` | `docs/features/<feature>/plan.md` | Use when work is multi-step or risky; not a substitute for `work` on direct implementation requests. Pass to `create_tickets` or `work`. |
| `review_plan` | `aw-review-doc` | — | Run after `plan` and before human review, ticket creation, or implementation. |
| `create_tickets` | `aw-create-tickets` | Ticket IDs/URLs | Tickets should trace back to spec, plan, decisions, standards, acceptance criteria, and test expectations. A later agent starting from only a ticket ID is a valid entrypoint. |
| `work` | `aw-work` | — | |
| `review_code` | `aw-review-code` | — | |
| `check_workflow_compliance` | `aw-check-workflow-compliance` | — | |
| `commit` | `aw-commit` | — | Follow `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present. Fall back to repo instructions, recent commit history, then conventional commits. |
| `commit_push_pr` | `aw-commit-push-pr` | PR URL | Apply configured `pull_request.template` title/body templates when present. Template values may be GitHub URLs, `file://` URLs, absolute paths, or repo-relative paths. |
| `monitor_pipeline` | `aw-monitor-pipeline` | — | For CircleCI set `post_pr.ci_monitor.provider: circleci`; routes to `aw-monitor-circleci`, which infers settings or creates `docs/workflow/circleci.yml` when needed. Fix only failures caused by the current branch. |

**Auxiliary skills** — helper capabilities invoked by multiple steps:

| Key | Default skill | Notes |
|---|---|---|
| `index_features` | `aw-index-features` | |
| `debug` | `aw-debug` | |
| `create_worktree` | `aw-create-worktree` | Offered by `work` and `review_code` for isolation. |
| `simplify_code` | `aw-simplify-code` | |
| `log_decision` | `aw-log-decision` | |
| `record_retrospective` | `aw-record-retrospective` | |
| `capture_solution` | `aw-capture-solution` | |
| `refresh_solutions` | `aw-refresh-solutions` | |
| `refresh_decisions` | `aw-refresh-decisions` | |
| `discover_standards` | `aw-discover-standards` | |
| `research_slack` | `aw-research-slack` | Preserve source channels, dates, and workspace identifiers in summaries. |
| `clean_artifacts` | `aw-clean-artifacts` | |
| `resolve_pr_feedback` | `aw-resolve-pr-feedback` | |
| `log_session` | `aw-log-session` | |
| `synthesize_memory` | `aw-synthesize-memory` | |

Old step-specific skill selector fields such as `ticket_creation.skill`, `git.commit.skill`, and `post_pr.ci_monitor.skill` have been replaced by `workflow.steps`. Old helper selector fields such as `research.slack.skill`, and older helper keys misplaced under `workflow.steps`, have been replaced by `workflow.auxiliary`. If they appear in older repos, migrate them to the matching `workflow.steps.<step>.skill` or `workflow.auxiliary.<key>.skill` entry instead of supporting both shapes. Non-skill configuration fields remain authoritative, including `git.commit.format`, `pull_request.template`, `post_pr.ci_monitor.provider`, and `human_review.*.reviewers`.

### Upgrade Existing Installs

Use `aw-upgrade` before hand-editing config or refreshing skills. It dry-runs by default, backs up the old config, writes the migrated config, and updates `.agentic-workflow-version`. Use `--remote` when no local clone is available; use `--source-url` to pin to a branch, tag, release archive, or internal mirror. Preserve unknown fields and non-skill configuration. Stop for manual review when old and new routing fields conflict.

### Human Review Gates

- After the configured `brainstorm` or `create_spec` step creates or updates a spec, ask whether the user wants product/human review. If yes, run `aw-request-human-review spec <spec path>`.
- After the configured `plan` step, ask whether the user wants engineering/human review. If yes, run `aw-request-human-review plan <plan path>`.
- Read `docs/workflow/config.yml` for `human_review.spec.reviewers` and `human_review.plan.reviewers`.
- If reviewers are configured, request them on the corresponding GitHub PR.
- Keep review PRs scoped to the spec or plan artifact and required supporting docs.

### Implementation Test Policy

Read `workflow.implementation.test_policy` before implementation. Blank or missing values default to `acceptance-first`.

Supported values:

- `acceptance-first`: map spec or ticket acceptance criteria to automated tests or explicit manual checks before implementation where feasible.
- `tdd`: write the narrowest failing automated test before feature code where feasible, then implement and refactor.
- `bdd`: express behavior scenarios before implementation, using Given/When/Then form when helpful, then map them to tests or manual checks.
- `characterization-first`: capture current behavior with tests before changing legacy or unclear behavior.
- `test-after`: implementation may come first, but tests or a clear no-test rationale are still required.
- `manual-verification`: document manual checks instead of requiring automated tests.
- `none`: no tests are required by repo policy, but final summaries must state that explicit policy.

### README Maintenance Gate

- Treat `README.md` as the user-facing operating manual.
- Update `README.md` in the same change when setup, installation, commands, configuration, repo structure, architecture, or workflow behavior changes.
- Before commit/PR, check whether the diff changes anything a future user needs to know. If yes, update `README.md`; if no, state why no README update was needed.
- Do not let README instructions drift from `AGENTS.md`, `docs/workflow/config.yml`, installer behavior, or skill names.

### Artifact Discipline

Before creating a durable artifact, ask: is this knowledge worth rediscovering months from now? If not, prefer a session log and let the configured `synthesize_memory` auxiliary decide whether it earns a permanent record through repetition.

Durable artifacts — decisions, learnings, standards, spec updates — represent knowledge that compounds across many future sessions. Session logs represent knowledge that informed this session. Default to the session log when uncertain.

Do not create durable artifacts from facts that only matter for the current implementation, corrections unlikely to recur, or decisions that will be self-evident from the code.

### Capture Checkpoints

Do not rely on the user to remember capture skills. At natural pauses, proactively check whether knowledge should be written back:

- After resolving ambiguity or choosing between viable approaches, run or offer the configured `log_decision` auxiliary.
- After a user correction, interruption, or post-completion redirect, apply the correction then run or offer the configured `record_retrospective` auxiliary.
- After solving a non-trivial problem that creates reusable team knowledge, run or offer the configured `capture_solution` auxiliary.
- At the end of a meaningful session, run or offer the configured `log_session` auxiliary to feed the synthesis loop.
- Run the configured `synthesize_memory` auxiliary periodically — after a sprint or when several unprocessed session logs have accumulated.
- Skip capture for trivial edits, unsupported conclusions, secrets, or one-off preferences the user says are temporary.

## Default Execution Flow

For a normal feature request:

1. If the PRD arrived as pasted content, a local file, or a link, run the configured `import_prd` step.
2. If the user wants to author a PRD from an idea or notes, run the configured `create_prd` step.
3. If the request is a PRD, vague, or product-shaped, run the configured `brainstorm` step unless the user explicitly asks to skip ambiguity resolution. The `brainstorm` step should create or update the living spec in the same run when durable product intent is affected.
4. Run the configured `create_spec` step directly only when the requirements are already clear, existing behavior needs documentation, or the user explicitly wants a spec draft.
5. If the work is multi-step or risky, run the configured `plan` step.
6. Run the configured `review_plan` step on the plan before human review, ticket creation, or implementation.
7. If work should be queued, create tickets with the configured `create_tickets` step.
8. Run the configured `work` step, normally one ticket at a time.
9. Log decisions with the configured `log_decision` auxiliary as ambiguity is resolved.
10. Verify with relevant tests, browser checks, simulator checks, or builds.
11. Update `README.md` when user-facing setup, commands, configuration, architecture, or workflow behavior changes.
12. Run the configured `review_spec` and `review_code` steps before push/PR for non-trivial changes.
13. Run the capture checkpoint per **Capture Checkpoints** above.
14. Commit/push/PR only when the user asks.
15. After push and before PR creation, run the configured `check_workflow_compliance` step for non-trivial changes.
16. After PR creation, run the configured `monitor_pipeline` step if `post_pr.ci_monitor.provider` is set.

For a bug: run the configured `debug` auxiliary; reproduce and explain the root cause before fixing; add or update regression coverage when feasible; verify the fix and summarize residual risk.

## Git and Workspace Safety

- Check current branch and worktree state before substantial edits.
- Avoid committing directly to the default branch unless the user explicitly confirms.
- Never run destructive git commands such as `git reset --hard`, `git checkout -- <path>`, or branch deletion without explicit approval.
- Do not stage or commit unrelated user changes.
- If the worktree is dirty, distinguish your changes from pre-existing changes in the final summary.

## Testing Expectations

- Run the narrowest meaningful tests first, then broader checks when risk warrants.
- If tests cannot run, explain why and what should be run next.
- For behavior changes, prefer adding tests near existing related coverage.
- For implementation work, follow `workflow.implementation.test_policy` and report tests, manual checks, coverage, and exceptions.
- For UI changes, verify rendered behavior when practical, not just compilation.
- Follow any testing standards referenced by `docs/standards/index.yml`.

## Documentation Expectations

- Keep docs concise and useful to future implementers.
- Use repo-relative paths.
- Record decisions and rationale, not just task lists.
- Separate resolved decisions from open questions and deferred work.
- Follow documentation standards referenced by `docs/standards/index.yml`.

## Final Response Expectations

Summarize:

- what changed
- files touched
- tests/checks run
- anything not run and why
- remaining risks or follow-ups

Do not over-explain routine implementation details. Keep the final answer focused on what the user needs to know next.