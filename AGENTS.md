# AGENTS.md

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

- Use `ce-ideate` when the user asks for ideas, options, improvements, surprising directions, or what to build.
- Use `ce-brainstorm` when scope, product behavior, requirements, success criteria, or trade-offs are unclear.
- Use `ce-plan` when the user asks for a plan, when a brainstorm/requirements doc is ready, or when a multi-step implementation needs structure.
- Use `ce-doc-review` to improve requirements or plan documents before implementation.
- Use `ce-proof` when the user wants human review of a markdown draft in Proof.

### Implementation

- Use `ce-work` for executing a plan, specification, or concrete implementation request.
- Use `ce-debug` for bugs, failing tests, stack traces, issue reports, regressions, or unclear broken behavior.
- Use `ce-optimize` when the task has a measurable metric and needs experiment-driven iteration.
- Use `ce-simplify-code` after meaningful changes when the code would benefit from clarity, deduplication, or reduced complexity.

### Review, Test, and Ship

- Use `ce-code-review` before creating a PR or after non-trivial changes.
- Use `ce-test-browser` for web UI changes that need browser verification.
- Use `ce-test-xcode` for iOS changes that need simulator build/test verification.
- Use `ce-demo-reel` when a visual change or user-facing workflow needs screenshots/GIF/video evidence.
- Use `ce-commit` when the user asks to commit.
- Use `ce-commit-push-pr` when the user asks to push, ship, or open a PR.
- Use `lfg` only when the user explicitly asks for the full autonomous pipeline through PR/CI.

### Knowledge Capture

- Use `ce-retrospective` for correction-driven learnings that should prevent repeated agent mistakes.
- Use `ce-discover-standards` when the user wants to extract repeated project conventions into `docs/standards/` and update `docs/standards/index.yml`.
- Use `ce-compound` after solving a non-trivial problem that should become reusable team knowledge.
- Use `ce-compound-refresh` when auditing or refreshing `docs/solutions/`.
- Do not create learning docs for trivial fixes or unsupported conclusions.

## Default Execution Flow

For a normal feature request:

1. If the request is vague or product-shaped, run `ce-brainstorm`.
2. If the work is multi-step or risky, run `ce-plan`.
3. Execute with `ce-work`.
4. Verify with relevant tests, browser checks, simulator checks, or builds.
5. Review with `ce-code-review` for non-trivial changes.
6. Capture durable learning with `ce-compound` when appropriate.
7. Commit/PR only when the user asks.

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
