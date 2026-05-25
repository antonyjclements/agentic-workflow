# AGENTS.md
<!-- AGENTIC_WORKFLOW_VERSION=0.1.0 -->

This file guides coding agents working in this repository. Follow it in addition to system, developer, and user instructions.

## Operating Principles

- Read the codebase before changing it. Prefer existing patterns, helpers, tests, and architecture over new conventions.
- Keep changes scoped to the user request. Do not perform unrelated refactors or cleanup unless required to finish safely.
- Preserve user work. Never revert or overwrite changes you did not make unless explicitly asked.
- Prefer small, verifiable steps: inspect, plan when useful, implement, test, review, summarize.
- Use repo-relative paths in docs, plans, and summaries.
- Ask only when a decision is genuinely blocked and cannot be inferred from local context.

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
- Imported PRDs live under `docs/product/prds/` and are indexed by `docs/product/prds/index.yml`.
- Brainstorm requirements live under `docs/brainstorms/` and are indexed by `docs/brainstorms/index.yml`.
- Temporary plans live at `docs/features/<feature>/plan.md` until removed.
- Use one spec per feature or coherent capability. Specs describe current behavior and durable intent, not task progress.
- Standards live under `docs/standards/` and are indexed by `docs/standards/index.yml`.
- Decisions live under `docs/decisions/` and are indexed by `docs/decisions/index.yml`.
- Learnings live under `docs/learnings/` for repo-specific lessons or `~/.agents/learnings/` for global lessons.
- Workflow configuration lives at `docs/workflow/config.yml`.
- If it describes intent, keep it alive. If it describes a plan, let it expire. If it describes a decision, log it immutably.
- If it is a PRD, preserve it as historical input; do not treat it as living truth.

### Spec and Decision Routing

- Use `ce-import-prd` when the user asks to create/import a PRD from pasted content, a local file, or a document link.
- Use `ce-brainstorm` as the default PRD intake path because PRDs often contain implicit ambiguity and open questions.
- Use `ce-spec-create` when clarified requirements, existing behavior, or implementation changes need to become a living feature spec.
- Use `ce-index-features` when `docs/features/index.yml` needs to be generated or refreshed from `docs/features/<feature>/spec.md`.
- Use `ce-spec-review` before PRs and after non-trivial implementation changes to catch drift between code and specs.
- Use `ce-decision-log` when ambiguity is resolved, a trade-off is chosen, or product/architecture behavior is decided.
- Use `ce-decisions-refresh` when `docs/decisions/` grows large, the decision index may be stale, or decision discoverability needs summaries/supersession cleanup.
- Use `ce-retrospective` when user correction should change future agent behavior; log a decision as well if the correction establishes a durable repo fact.
- Use `ce-create-tickets` after a plan when work should be broken into Linear, Jira, or another configured ticket system for implementation agents.
- Use configured commit-message routing before committing. If `git.commit.skill` is blank, use the configured template/examples or the default commit behavior.
- Use configured PR templates when opening pull requests. If `pull_request.template.title` or `pull_request.template.body` is blank, use the normal generated title/body for that part.
- Use `ce-monitor-pipeline` after PR creation when `docs/workflow/config.yml` configures a post-PR CI monitor/fix skill.
- A normal feature flow is: pasted/file/link PRD -> imported PRD artifact -> brainstorm requirements -> living feature spec -> temporary feature plan -> tickets/stories -> implementation agent picks up a ticket -> decisions logged as they happen -> spec review before PR.

### Artifact Handoff Contract

Each workflow step should return the artifact path or ID that becomes input to the next step:

- `ce-import-prd` outputs `docs/product/prds/<prd>.md` -> pass to `ce-brainstorm`.
- `ce-brainstorm` outputs `docs/brainstorms/<requirements>.md` -> pass to `ce-spec-create`.
- `ce-spec-create` outputs `docs/features/<feature>/spec.md` -> pass to `ce-plan`.
- `ce-plan` outputs `docs/features/<feature>/plan.md` -> pass to `ce-create-tickets` or `ce-work`.
- `ce-create-tickets` outputs ticket IDs/URLs -> pass one ticket at a time to `ce-work`.
- `ce-commit-push-pr` outputs PR URL -> pass to `ce-monitor-pipeline` when configured.

### Human Review Gates

- After `ce-spec-create`, ask whether the user wants product/human review. If yes, run `ce-request-human-review spec <spec path>`.
- After `ce-plan`, ask whether the user wants engineering/human review. If yes, run `ce-request-human-review plan <plan path>`.
- Read `docs/workflow/config.yml` for `human_review.spec.reviewers` and `human_review.plan.reviewers`.
- If reviewers are configured, request them on the corresponding GitHub PR.
- Keep review PRs scoped to the spec or plan artifact and required supporting docs.

### Ticket Creation Routing

- Read `docs/workflow/config.yml` before creating tickets.
- Use `ticket_creation.skill` as the configured ticket creation skill. Typical values are a Linear skill, a Jira skill, or a custom repo skill.
- If `ticket_creation.skill` is empty, skip ticket creation; blank means ticketing is disabled for the repo.
- If `ticket_creation.skill` is set but unavailable, report the missing skill and ask whether to draft tickets in markdown or update the config.
- Tickets should trace back to the source spec, plan, relevant decisions, applicable standards, acceptance criteria, dependencies, and test expectations.

### Ticket Implementation Handoff

- A later agent may start from only a ticket ID/URL after checking out the repo. Treat that as a valid entrypoint, not a broken workflow.
- When starting from a ticket, read `AGENTS.md`, `docs/workflow/config.yml`, and the ticket through the configured ticket tool when available.
- Extract and follow links from the ticket to the source spec, plan, decisions, standards, and acceptance criteria.
- If the ticket lacks links back to the source artifacts, search `docs/features/`, `docs/decisions/`, and `docs/standards/` for the likely feature area before editing.
- Use `ce-work <ticket ID or URL>` as the implementation path for ticket-first sessions.
- If the ticket is ambiguous or appears stale against the living spec, stop and surface the gap before implementing.
- Preserve traceability in the final summary and PR body by naming the ticket, source spec, relevant decisions, and verification run.

### Commit Message Routing

- Read `docs/workflow/config.yml` before committing.
- Use `git.commit.skill` as the configured enterprise commit skill when it is set.
- If `git.commit.skill` is empty, follow `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present.
- If the `git.commit` block is absent, fall back to repo instructions, recent commit history, then conventional commits.
- A custom commit skill must return either the commit hash or the exact commit message to use.

### PR Template Routing

- Read `docs/workflow/config.yml` before creating PRs.
- Use `pull_request.template.title` and `pull_request.template.body` when a repo configures enterprise PR title/body templates.
- Template values may be `https://github.com/...` URLs, raw GitHub URLs, `file://...` URLs, absolute paths, or repo-relative paths to markdown files.
- If a template value is blank, use the default generated title or body for that part.
- A template customizes PR text only. PR creation still uses the normal `ce-commit-push-pr` flow and must return the PR URL so `ce-monitor-pipeline` can run afterward when configured.

### CI/CD Routing

- Read `docs/workflow/config.yml` before post-PR pipeline monitoring.
- Use `post_pr.ci_monitor.skill` as the configured CI monitor/fix skill. Typical values are a GitHub Actions, CircleCI, Jenkins, or custom repo skill.
- For CircleCI repos, use `ce-monitor-circleci` when `post_pr.ci_monitor.provider` is `circleci` and `post_pr.ci_monitor.skill` is `ce-monitor-circleci`.
- If `post_pr.ci_monitor.skill` is empty, skip post-PR monitoring; blank means CI monitoring is disabled for the repo.
- If configured, invoke `ce-monitor-pipeline` after PR creation and loop until the pipeline succeeds, the configured max attempts is reached, or the failure is genuinely blocked.
- Fix only failures caused by the current branch. Do not hide external, flaky, credential, quota, or default-branch failures.

### Slack Research Routing

- Read `docs/workflow/config.yml` before Slack research.
- Use `research.slack.skill` when an enterprise environment configures a custom Slack skill.
- If `research.slack.skill` is blank, use `ce-slack-research` with the default Slack discovery path.
- Preserve source channels, dates, and any available workspace identifiers in Slack research summaries.

### README Maintenance Gate

- Treat `README.md` as the user-facing operating manual.
- Update `README.md` in the same change when setup, installation, commands, configuration, repo structure, architecture, or workflow behavior changes.
- Before commit/PR, check whether the diff changes anything a future user needs to know. If yes, update `README.md`; if no, state why no README update was needed.
- Do not let README instructions drift from `AGENTS.md`, `docs/workflow/config.yml`, installer behavior, or skill names.

### Capture Checkpoints

Do not rely on the user to remember capture skills. At natural pauses, proactively check whether knowledge should be written back.

- After resolving ambiguity or choosing between viable approaches, ask or run `ce-decision-log`.
- After a user correction, interruption, or post-completion redirect, apply the correction and then ask or run `ce-retrospective`.
- After solving a non-trivial bug, integration issue, architecture problem, or repeatable workflow problem, ask whether to run `ce-compound`.
- After solving a problem that creates reusable team knowledge, run or offer `ce-compound`; this is part of the feedback loop, not an optional flourish.
- When the decision log becomes hard to scan or the index may be stale, run or offer `ce-decisions-refresh`.
- Periodically run `ce-compound-refresh` to keep accumulated solution docs current and remove stale guidance.
- Before finalizing non-trivial work or before commit/PR, run a quick capture check: decisions made, corrections learned, reusable solution found, spec drift reviewed.
- Auto-run capture when the user explicitly asks to remember, record, log, document, or make it durable. Ask one concise question when scope, privacy, or global-vs-repo placement is unclear.
- Skip capture for trivial edits, unsupported conclusions, secrets, sensitive incident details, or one-off preferences the user says are temporary.

## Compound Engineering Workflow

Use the Compound Engineering skills as the default workflow router when available.

### Retrospective Learning

- Use `ce-retrospective` when the user corrects, interrupts, redirects, or later says completed work should have behaved differently.
- Capture durable lessons as discrete markdown files indexed by `index.yml`.
- Store repo-specific lessons under `docs/learnings/`.
- Store global lessons under `~/.agents/learnings/`.
- Ask before promoting an ambiguous lesson to global scope.
- Apply the correction first when the current task is blocked; capture the retrospective at the next natural pause.

### Idea and Requirements

- Use `ce-init` when installing this workflow into a repository.
- Use `ce-import-prd` when a PRD arrives as pasted content, a local file, markdown, or a document link.
- Use `ce-brainstorm` when scope, product behavior, requirements, success criteria, trade-offs, or PRD ambiguity are unclear.
- Use `ce-spec-create` when product intent needs a durable home in `docs/features/<feature>/spec.md`.
- Use `ce-index-features` when discovering or refreshing feature specs under `docs/features/`.
- Use `ce-plan` when the user asks for a plan, when a brainstorm/requirements doc is ready, or when a multi-step implementation needs structure.
- After `ce-plan` creates a plan, run `ce-doc-review` before human review, ticket creation, or implementation.
- Use `ce-request-human-review` when the user wants product sign-off on a spec or engineering sign-off on a plan.
- Use `ce-create-tickets` when a plan should become Linear/Jira stories or implementation tickets.
- Use `ce-doc-review` to improve requirements or plan documents before implementation.

### Implementation

- Use `ce-work` for executing a plan, specification, or concrete implementation request.
- Use `ce-debug` for bugs, failing tests, stack traces, issue reports, regressions, or unclear broken behavior.
- Use `ce-simplify-code` after meaningful changes when the code would benefit from clarity, deduplication, or reduced complexity.

### Review, Test, and Ship

- Use `ce-code-review` before creating a PR or after non-trivial changes.
- Use `ce-spec-review` before creating a PR when behavior, workflow, API contracts, UX, or product intent changed.
- Use `ce-test-browser` for web UI changes that need browser verification.
- Use `ce-commit` when the user asks to commit.
- Use `ce-commit-push-pr` when the user asks to push, ship, or open a PR. Apply configured `pull_request.template` title/body templates when present.
- Use `ce-monitor-pipeline` after PR creation when post-PR CI monitoring is configured.
- Use `ce-monitor-circleci` through `ce-monitor-pipeline` for CircleCI PR pipeline monitoring and branch-caused CI fixes.

### Knowledge Capture

- Use `ce-retrospective` for correction-driven learnings that should prevent repeated agent mistakes.
- Use `ce-decision-log` for resolved ambiguity, product behavior choices, architecture trade-offs, and workflow policy decisions.
- Use `ce-decisions-refresh` to rebuild `docs/decisions/index.yml`, surface stale metadata, and generate derived decision summaries without rewriting immutable decision records.
- Use `ce-discover-standards` when the user wants to extract repeated project conventions into `docs/standards/` and update `docs/standards/index.yml`.
- Use `ce-compound` after solving a non-trivial problem that should become reusable team knowledge.
- Use `ce-compound-refresh` when auditing or refreshing `docs/solutions/`.
- Use `ce-slack-research` when organizational context from Slack could clarify decisions, constraints, or prior discussion.
- Do not create learning docs for trivial fixes or unsupported conclusions.

## Default Execution Flow

For a normal feature request:

1. If the PRD came from pasted content, a local file, or a link, first persist it with `ce-import-prd`.
2. If the request is a PRD, vague, or product-shaped, pass the imported PRD path or user request to `ce-brainstorm` unless the user explicitly asks to skip ambiguity resolution.
3. Create or update a living spec with `ce-spec-create` when durable product intent is affected.
4. If the work is multi-step or risky, run `ce-plan`.
5. Run `ce-doc-review` on the plan before human review, ticket creation, or implementation.
6. If work should be queued, create tickets with `ce-create-tickets` using `docs/workflow/config.yml`.
7. Execute with `ce-work`, normally by picking up one ticket at a time.
8. Log decisions with `ce-decision-log` as ambiguity is resolved.
9. Verify with relevant tests, browser checks, simulator checks, or builds.
10. Update `README.md` when user-facing setup, commands, configuration, architecture, or workflow behavior changes.
11. Review with `ce-spec-review` and `ce-code-review` before push/PR for non-trivial changes.
12. Run the capture checkpoint: `ce-decision-log`, `ce-retrospective`, or `ce-compound` when appropriate.
13. Commit/PR only when the user asks.
14. After PR creation, run `ce-monitor-pipeline` if configured.

For a bug:

1. Run `ce-debug`.
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
