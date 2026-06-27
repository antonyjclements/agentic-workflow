# AGENTS.md
<!-- AGENTIC_WORKFLOW_VERSION=0.5.0 -->

This file guides coding agents working in this repository. Follow it in addition to system, developer, and user instructions.

## Operating Principles

- Read the codebase before changing it. Prefer existing patterns, helpers, tests, and architecture over new conventions.
- Read `docs/workflow/field-guide.md` when starting a session with an unfamiliar task type or an unclear workflow position. It maps task types and team sizes to the right skill sequence.
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
- Use `aw-commit` or `aw-commit-push-pr` only when the user asks to publish.
- Skip spec updates, plans, workflow compliance, and review gates unless the user explicitly asks for them.

### Small Fix

Use for contained bugs, small config changes, local docs updates, or narrow test fixes.

- Use `aw-debug` when the root cause is unclear; otherwise edit directly.
- Run targeted tests or checks for the touched area.
- Update README, specs, or decisions only when behavior, workflow, setup, or durable intent changes.
- Use `aw-commit-push-pr` when the user asks to publish.

### Feature or Behavior Change

Use when product behavior, workflow behavior, APIs, UX, data contracts, acceptance criteria, or durable user-facing intent changes.

- Ensure the relevant living spec exists and is updated.
- Use `aw-plan` when implementation has multiple steps or meaningful sequencing.
- Implement with `aw-work` or the configured replacement step.
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
- PRD statuses are `imported`, `draft`, `ready-for-spec`, `promoted`, `superseded`, and `archived`. `archived` means the artifact may be removed from the working tree by `aw-refresh cleanup`; git is the historical archive.
- Brainstorm or ideation artifacts live under `docs/brainstorms/` and are indexed by `docs/brainstorms/index.yml`.
- Temporary plans live at `docs/features/<feature>/plan.md` until removed.
- Use one spec per feature or coherent capability. Specs describe current behavior and durable intent, not task progress.
- Standards live under `docs/standards/` and are indexed by `docs/standards/index.yml`.
- Decisions live under `docs/decisions/` and are indexed by `docs/decisions/index.yml`.
- Learnings live under `docs/learnings/` for repo-specific lessons or `~/.agents/learnings/` for global lessons.
- Session logs live under `docs/sessions/` and are indexed by `docs/sessions/index.yml`. They are written by `aw-capture session` and consumed by `aw-synthesize-memory`.
- The synthesized project wiki lives at `docs/context/wiki.md` and is regenerated by `aw-synthesize-memory`. If it exists, read it at the start of each session for a compact summary of active features, recent decisions, top learnings, and known dead ends.
- Workflow configuration lives at `docs/workflow/config.yml`.
- If it describes intent, keep it alive. If it describes a plan, let it expire. If it describes a decision, log it immutably. If it is explicitly archived, remove it from the working tree through cleanup.
- If it is an imported PRD, preserve it as historical input; do not treat it as living truth. If it is authored in-repo, treat it as product input for specs.

### Spec and Decision Routing

- Use `aw-prd` when the user asks to create, import, draft, or save a PRD. It routes internally: importing external content vs. authoring from ideas/notes.
- Run `skills/aw-init/scripts/upgrade.sh` when an existing Agentic Workflow install needs to move to the current version or migrate `docs/workflow/config.yml`.
- Use `aw-refresh cleanup` when the user asks to remove archived workflow artifacts. Only artifacts marked `status: archived` should be deleted.
- Use `aw-brainstorm` as the default PRD or idea intake path because PRDs and raw ideas often contain implicit ambiguity and open questions. It should usually clarify and create/update the living spec in the same run.
- Use `aw-create-spec` when clear requirements, existing behavior, or implementation changes need to become a living feature spec without exploratory discovery.
- Use `aw-refresh features` when `docs/features/index.yml` needs to be generated or refreshed from `docs/features/<feature>/spec.md`.
- Use `aw-review` before PRs and after non-trivial implementation changes to catch code issues, spec drift, or document quality problems. It routes by target: code diff → code review; spec → spec drift; doc/plan → document review; "simplify" → simplification pass.
- Use `aw-capture decision` when ambiguity is resolved, a trade-off is chosen, or product/architecture behavior is decided.
- Use `aw-refresh decisions` when `docs/decisions/` grows large, the decision index may be stale, or decision discoverability needs summaries/supersession cleanup.
- Use `aw-capture learning` when user correction should change future agent behavior; log a decision as well if the correction establishes a durable repo fact.
- Use `aw-create-tickets` after a plan when work should be broken into Linear, Jira, or another configured ticket system for implementation agents.
- Use configured workflow step routing before delegating to another workflow skill.
- Use configured commit-message formatting before committing.
- Use configured PR templates when opening pull requests. If `pull_request.template.title` or `pull_request.template.body` is blank, use the normal generated title/body for that part.
- After PR creation, if `workflow.steps.monitor_pipeline.skill` is configured, invoke it directly to handle post-PR CI monitoring.
- A normal feature flow is: pasted/file/link PRD -> imported PRD artifact -> brainstorm/discovery creates or updates the living feature spec -> temporary feature plan -> tickets/stories -> implementation agent picks up a ticket -> decisions logged as they happen -> spec review before PR.

### Workflow Step Routing

Read `docs/workflow/config.yml` before invoking a configurable workflow step. Use `workflow.steps.<step>.skill` when it is set; blank or missing values mean use the bundled default skill.

Auxiliary skills are helper capabilities that can be invoked by multiple workflow steps. Use `workflow.auxiliary.<key>.skill` when it is set; blank or missing values mean use the bundled default helper skill.

Supported default step keys:

- `prd`: `aw-prd`
- `brainstorm`: `aw-brainstorm`
- `create_spec`: `aw-create-spec`
- `request_human_review`: `aw-request-human-review`
- `plan`: `aw-plan` — not a substitute for `work` on direct implementation requests
- `review`: `aw-review`
- `create_tickets`: `aw-create-tickets`
- `work`: `aw-work`
- `check_workflow_compliance`: `aw-check-workflow-compliance`
- `commit`: `aw-commit`
- `commit_push_pr`: `aw-commit-push-pr`
- `monitor_pipeline`: no bundled skill — set `workflow.steps.monitor_pipeline.skill` to a custom CI skill; if blank or absent, skip post-PR monitoring cleanly

Supported auxiliary skill keys:

- `refresh`: `aw-refresh`
- `debug`: `aw-debug`
- `create_worktree`: `aw-create-worktree` — offered by `work` and `review` for isolation
- `capture`: `aw-capture`
- `discover_standards`: `aw-discover-standards`
- `resolve_pr_feedback`: `aw-resolve-pr-feedback`
- `synthesize_memory`: `aw-synthesize-memory`

The `research_slack`, `log_session`, `monitor_pipeline`, and `clean_artifacts` keys are no longer bundled as separate skills. For Slack research, agents use available tools (MCP servers, browser, etc.) directly; set `workflow.auxiliary.research_slack.skill` for enterprise routing. Session logging is now part of `aw-capture session`. Post-PR CI monitoring is config-only via `workflow.steps.monitor_pipeline.skill`. Archived artifact cleanup is now `aw-refresh cleanup`.

Old step-specific skill selector fields such as `ticket_creation.skill`, `git.commit.skill`, and `post_pr.ci_monitor.skill` have been replaced by `workflow.steps`. Old helper selector fields such as `research.slack.skill`, and older helper keys misplaced under `workflow.steps`, have been replaced by `workflow.auxiliary`. Old step keys `import_prd`, `create_prd`, `review_spec`, `review_plan`, and `review_code` have been replaced by `prd` and `review`. Old auxiliary keys `index_features`, `simplify_code`, `log_decision`, `record_retrospective`, `capture_solution`, `refresh_solutions`, `refresh_decisions`, `clean_artifacts`, and `log_session` have been replaced by `refresh`, `capture`, and (for cleanup) `aw-refresh cleanup` mode. If they appear in older repos, migrate them. Non-skill configuration fields remain authoritative, including `git.commit.format`, `pull_request.template`, `post_pr.ci_monitor.provider`, and `human_review.*.reviewers`.

Custom replacement skills must preserve the default step contract: accept the same handoff artifact or identifier, read relevant workflow config, return the expected artifact path/ID/result, and report unsupported behavior clearly.

### Upgrade Existing Installs

Upgrade via the bundled script rather than asking users to hand-edit workflow config:

```bash
skills/aw-init/scripts/upgrade.sh --repo /path/to/repo --dry-run
skills/aw-init/scripts/upgrade.sh --repo /path/to/repo --apply
```

- Dry-run first so the user can inspect migrated `docs/workflow/config.yml`.
- Apply only after the user approves, unless they already explicitly requested applying the upgrade.
- The script backs up the old config, writes the migrated config, and updates `.agentic-workflow-version`.
- Pass `--refresh-skills --remote` to also refresh global skills and repo-local agent instructions.
- Use `--source-url URL` to pin a refresh to a branch, tag, archive, or internal mirror.
- Preserves unknown fields and non-skill configuration.
- Stops for manual review when old and new routing fields conflict.

### Artifact Handoff Contract

Each workflow step should return the artifact path or ID that becomes input to the next step:

- `aw-prd` outputs `docs/product/prds/<prd>.md` -> pass to `aw-brainstorm` when ambiguity remains or `aw-create-spec` when ready for a direct spec draft.
- `aw-brainstorm` usually outputs `docs/features/<feature>/spec.md` -> pass to `aw-plan`; when the user asks for PRD output, route to `aw-prd`.
- `aw-create-spec` outputs `docs/features/<feature>/spec.md` -> pass to `aw-plan`.
- When a PRD becomes a spec, mark the PRD `status: promoted`, set `promoted_to` to the spec path, and leave the PRD body unchanged.
- When a source artifact is no longer needed in the working tree, mark it `status: archived`; `aw-refresh cleanup` removes it from the working tree and index while git preserves history.
- `aw-plan` outputs `docs/features/<feature>/plan.md` -> pass to `aw-create-tickets` or `aw-work`.
- `aw-create-tickets` outputs ticket IDs/URLs -> pass one ticket at a time to `aw-work`.
- `aw-commit-push-pr` outputs PR URL -> invoke `workflow.steps.monitor_pipeline.skill` with it when configured.

### Human Review Gates

- After `aw-brainstorm` or `aw-create-spec` creates or updates a spec, ask whether the user wants product/human review. If yes, run `aw-request-human-review spec <spec path>`.
- After `aw-plan`, ask whether the user wants engineering/human review. If yes, run `aw-request-human-review plan <plan path>`.
- Read `docs/workflow/config.yml` for `human_review.spec.reviewers` and `human_review.plan.reviewers`.
- If reviewers are configured, request them on the corresponding GitHub PR.
- Keep review PRs scoped to the spec or plan artifact and required supporting docs.

### Ticket Creation Routing

- Read `docs/workflow/config.yml` before creating tickets.
- Use `workflow.steps.create_tickets.skill` when a repo replaces the bundled ticket creation step with a Linear, Jira, or custom ticketing skill.
- If `workflow.steps.create_tickets.skill` is blank or missing, use `aw-create-tickets` as the default step. The default step drafts the ticket split and reports that no external ticketing system is configured.
- If the configured custom ticket creation skill is unavailable, report the missing skill and ask whether to draft tickets in markdown or update the config.
- Tickets should trace back to the source spec, plan, relevant decisions, applicable standards, acceptance criteria, dependencies, and test expectations.

### Ticket Implementation Handoff

- A later agent may start from only a ticket ID/URL after checking out the repo. Treat that as a valid entrypoint, not a broken workflow.
- When starting from a ticket, read `AGENTS.md`, `docs/workflow/config.yml`, and the ticket through the configured ticket tool when available.
- Extract and follow links from the ticket to the source spec, plan, decisions, standards, and acceptance criteria.
- If the ticket lacks links back to the source artifacts, search `docs/features/`, `docs/decisions/`, and `docs/standards/` for the likely feature area before editing.
- Use `aw-work <ticket ID or URL>` as the implementation path for ticket-first sessions.
- If the ticket is ambiguous or appears stale against the living spec, stop and surface the gap before implementing.
- Preserve traceability in the final summary and PR body by naming the ticket, source spec, relevant decisions, and verification run.

### Commit Message Routing

- Read `docs/workflow/config.yml` before committing.
- Use `workflow.steps.commit.skill` or `workflow.steps.commit_push_pr.skill` when a repo replaces the bundled commit or commit/push/PR step.
- Follow `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present.
- If the `git.commit` block is absent, fall back to repo instructions, recent commit history, then conventional commits.
- A custom commit step must return either the commit hash or the exact commit message to use.

### PR Template Routing

- Read `docs/workflow/config.yml` before creating PRs.
- Use `pull_request.template.title` and `pull_request.template.body` when a repo configures enterprise PR title/body templates.
- Template values may be `https://github.com/...` URLs, raw GitHub URLs, `file://...` URLs, absolute paths, or repo-relative paths to markdown files.
- If a template value is blank, use the default generated title or body for that part.
- A template customizes PR text only. PR creation still uses the normal `aw-commit-push-pr` flow and must return the PR URL; invoke `workflow.steps.monitor_pipeline.skill` with it when configured.

### CI/CD Routing

- Read `docs/workflow/config.yml` before post-PR pipeline monitoring.
- There is no bundled pipeline monitor skill. Set `workflow.steps.monitor_pipeline.skill` to a custom skill that handles the repo's CI provider (GitHub Actions, CircleCI, Jenkins, etc.). That skill owns retry limits, polling cadence, and fix logic.
- If `workflow.steps.monitor_pipeline.skill` is blank or absent, or if `post_pr.ci_monitor.provider` is `manual` or missing, skip post-PR monitoring without error.
- Fix only failures caused by the current branch. Do not hide external, flaky, credential, quota, or default-branch failures.

### Slack Research

- When organizational Slack context would help, use whatever Slack tools are available (MCP servers, browser, etc.) directly.
- Set `workflow.auxiliary.research_slack.skill` to route through an enterprise-specific Slack skill when one is configured.
- Preserve source channels, dates, and workspace identifiers in Slack research summaries.

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

`aw-work` and replacement work skills must report the effective test policy, tests added/updated/run, manual checks, acceptance coverage, and justified exceptions.

### README Maintenance Gate

- Treat `README.md` as the user-facing operating manual.
- Update `README.md` in the same change when setup, installation, commands, configuration, repo structure, architecture, or workflow behavior changes.
- Before commit/PR, check whether the diff changes anything a future user needs to know. If yes, update `README.md`; if no, state why no README update was needed.
- Do not let README instructions drift from `AGENTS.md`, `docs/workflow/config.yml`, installer behavior, or skill names.

### Workflow Maturity

Not all artifact types pay back at every project stage. Activate them progressively rather than all at once.

**New project (fewer than four sessions)**
Log decisions and session logs. The overhead of learnings, synthesis, and a wiki exceeds the payback when there is no accumulated history to synthesize.

**Early project (four or more sessions, roughly one month)**
Run `aw-synthesize-memory` for the first time. If patterns are emerging across sessions, promote them to learnings. Skip wiki generation until there is enough signal to make it useful.

**Growing project (two or more months or two or more active contributors)**
The context wiki earns its place when onboarding or cross-session continuity becomes a pain point. Standards become worth maintaining when the same conventions need enforcing repeatedly.

**Mature project (multi-quarter, multi-contributor)**
The full workflow compounds: specs, plans, tickets, decisions, learnings, standards, wiki, and synthesis all reinforce each other. This is when the ROI curve turns strongly positive.

When unsure whether to create a durable artifact at the current project stage, prefer a session log.

### Artifact Discipline

Before creating a durable artifact, ask: is this knowledge worth rediscovering months from now? If not, prefer a session log and let `aw-synthesize-memory` decide whether it earns a permanent record through repetition.

Durable artifacts — decisions, learnings, standards, spec updates — represent knowledge that compounds across many future sessions. Session logs represent knowledge that informed this session. Default to the session log when uncertain.

Do not create durable artifacts from facts that only matter for the current implementation, corrections unlikely to recur, or decisions that will be self-evident from the code.

### Capture Checkpoints

Do not rely on the user to remember capture skills. At natural pauses, proactively check whether knowledge should be written back.

- After resolving ambiguity or choosing between viable approaches, ask or run `aw-capture decision`.
- After a user correction, interruption, or post-completion redirect, apply the correction and then ask or run `aw-capture learning`.
- After solving a non-trivial bug, integration issue, architecture problem, or repeatable workflow problem, ask whether to run `aw-capture solution`.
- After solving a problem that creates reusable team knowledge, run or offer `aw-capture solution`; this is part of the feedback loop, not an optional flourish.
- At the end of a meaningful session (task complete, user satisfied, or user asks to wrap up), run or offer `aw-capture session` to capture what was attempted, what worked, corrections, and dead ends.
- Run `aw-synthesize-memory` periodically — after a sprint, milestone, or when several unprocessed session logs have accumulated — to distill logs into learnings and refresh `docs/context/wiki.md`.
- When the decision log becomes hard to scan or the index may be stale, run or offer `aw-refresh decisions`.
- Periodically run `aw-refresh solutions` to keep accumulated solution docs current and remove stale guidance.
- Before finalizing non-trivial work, run a quick capture check: decisions made, corrections learned, reusable solution found, spec drift reviewed.
- Auto-run capture when the user explicitly asks to remember, record, log, document, or make it durable. Ask one concise question when scope, privacy, or global-vs-repo placement is unclear.
- Skip capture for trivial edits, unsupported conclusions, secrets, sensitive incident details, or one-off preferences the user says are temporary.

## Skill Quick Reference

### Idea and Requirements

- Use `aw-init` when installing this workflow into a repository.
- Use `aw-prd` when a PRD arrives as pasted content, a file/link, or when the user wants to author a PRD from ideas or notes. It routes internally between import and create modes.
- Use `aw-brainstorm` when scope, product behavior, requirements, success criteria, trade-offs, or PRD ambiguity are unclear; for product work, it should normally produce/update the living spec before finishing.
- Use `aw-create-spec` when product intent needs a durable home in `docs/features/<feature>/spec.md` and exploratory discovery is unnecessary.
- Use `aw-plan` when the user asks for a plan, when a spec is ready, or when a multi-step implementation needs structure.
- After `aw-plan`, run `aw-review plan` before human review, ticket creation, or implementation.
- Use `aw-request-human-review` when the user wants product sign-off on a spec or engineering sign-off on a plan.
- Use `aw-create-tickets` when a plan should become Linear/Jira stories or implementation tickets.

### Implementation

- Use `aw-work` for executing a plan, specification, or concrete implementation request.
- Use `aw-debug` for bugs, failing tests, stack traces, issue reports, regressions, or unclear broken behavior.
- Use `aw-review simplify` after meaningful changes when the code would benefit from clarity, deduplication, or reduced complexity.

### Review, Test, and Ship

- Use `aw-review` before creating a PR or after non-trivial changes. Routes by target: code diff → code review; spec → spec drift; doc/plan → document review; "simplify" → simplification pass.
- Use `aw-check-workflow-compliance` after pushing and before PR creation for non-trivial changes when workflow routing, implementation test policy, acceptance coverage, README updates, or review gates need verification.
- Use `aw-commit` when the user asks to commit.
- Use `aw-commit-push-pr` when the user asks to push, ship, or open a PR. Apply configured `pull_request.template` title/body templates when present.
- After PR creation, if `workflow.steps.monitor_pipeline.skill` is configured, invoke it with the PR URL for post-PR CI monitoring. There is no bundled pipeline monitor.

### Knowledge Capture

- Use `aw-capture learning` for correction-driven learnings that should prevent repeated agent mistakes.
- Use `aw-capture decision` for resolved ambiguity, product behavior choices, architecture trade-offs, and workflow policy decisions.
- Use `aw-capture solution` after solving a non-trivial problem that should become reusable team knowledge.
- Use `aw-refresh decisions` to rebuild `docs/decisions/index.yml`, surface stale metadata, and generate summaries without rewriting immutable records.
- Use `aw-refresh solutions` when auditing or refreshing `docs/solutions/`.
- Use `aw-refresh features` when discovering or refreshing feature specs under `docs/features/`.
- Use `aw-discover-standards` when the user wants to extract repeated project conventions into `docs/standards/`.
- For Slack context, use available MCP tools directly; if `workflow.auxiliary.research_slack.skill` is configured, invoke that skill.
- Use `aw-capture session` at the end of a meaningful session to record what was attempted, corrections made, dead ends hit, and useful sources.
- Use `aw-synthesize-memory` to batch-process accumulated session logs into learnings, refresh `docs/context/wiki.md`, and surface pattern candidates for promotion to standards.
- Use `aw-refresh cleanup` when artifacts marked `status: archived` should be removed from the working tree.
- Do not create learning docs for trivial fixes or unsupported conclusions.

## Default Execution Flow

For a normal feature request:

1. If the PRD came from pasted content, a local file, or a link, or if the user wants to author a PRD from ideas or notes, use `aw-prd`.
2. If the request is a PRD, vague, or product-shaped, pass the PRD path or user request to `aw-brainstorm` unless the user explicitly asks to skip ambiguity resolution. `aw-brainstorm` should create or update the living spec in the same run when durable product intent is affected.
3. Use `aw-create-spec` directly only when the requirements are already clear, existing behavior needs documentation, or the user explicitly wants a spec draft.
4. If the work is multi-step or risky, run `aw-plan`.
5. Run `aw-review plan` on the plan before human review, ticket creation, or implementation.
6. If work should be queued, create tickets with the configured `create_tickets` step.
7. Execute with `aw-work`, normally by picking up one ticket at a time.
8. Capture decisions with `aw-capture decision` as ambiguity is resolved.
9. Verify with relevant tests, browser checks, simulator checks, or builds.
10. Update `README.md` when user-facing setup, commands, configuration, architecture, or workflow behavior changes.
11. Run `aw-review` before push/PR for non-trivial changes — spec drift and code review in the same step.
12. Run the capture checkpoint: `aw-capture decision/learning/solution/session` when appropriate. Offer `aw-capture session` at natural session ends to feed the synthesis loop.
13. Commit/push/PR only when the user asks.
14. After push and before PR creation, run the configured `check_workflow_compliance` step for non-trivial changes.
15. After PR creation, if `workflow.steps.monitor_pipeline.skill` is configured, invoke it with the PR URL.

For a bug:

1. Run `aw-debug`.
2. Reproduce or characterize the failure.
3. Explain the root cause before fixing.
4. Add or update regression coverage when feasible.
5. Verify the fix and summarize residual risk.

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
