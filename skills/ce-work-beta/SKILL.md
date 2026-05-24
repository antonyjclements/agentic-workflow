---
name: ce-work-beta
description: "[BETA] Execute work with external delegate support. Same as ce-work but includes experimental Codex delegation mode for token-conserving code implementation."
disable-model-invocation: true
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc] [delegate:codex]"
---

# Work Execution Command

Beta variant of `ce-work` with optional Codex delegation. During beta, handoffs should still default to stable `ce-work` unless the user explicitly invokes this skill or config enables delegation.

## Argument Parsing

Strip delegation tokens before resolving the work input:

- `delegate:codex`, `use codex`, `delegate to codex`, `codex mode`, `delegate mode` -> delegation on
- `delegate:local`, `no codex`, `local mode`, `standard mode` -> delegation off

A bare mention of "codex" as the work subject does not activate delegation.

## Delegation Config

Resolve settings in order:

1. current invocation flag
2. repo `.compound-engineering/config.local.yaml`
3. defaults

Config keys:

- `work_delegate`: `codex` or `false` (default false)
- `work_delegate_consent`: boolean, default false
- `work_delegate_sandbox`: `yolo` default or `full-auto`
- `work_delegate_decision`: `auto` default or `ask`
- `work_delegate_model`: optional passthrough string; unset defers to Codex config
- `work_delegate_effort`: optional `minimal|low|medium|high|xhigh`; unset defers to Codex config

Ignore invalid values by falling back to defaults/unset. Track `delegation_active`, source, sandbox, consent, model, effort floor, and per-batch effective effort.

## Local Workflow

When delegation is off, follow `ce-work`:

1. Resolve plan/spec/prompt/latest active plan.
2. Read plan fully or triage bare prompt.
3. Load applicable standards from `docs/standards/index.yml` when present.
4. Set up branch/worktree safely.
5. Create tasks from implementation units.
6. Implement by following repo patterns, applicable standards, and execution notes.
7. Run targeted then broader verification.
8. Inspect diff, address standards/review findings, and summarize.
9. Do not commit/push/PR unless asked.

## Delegated Workflow

Use `references/codex-delegation-workflow.md` for detailed mechanics. Compact contract:

1. Verify environment and consent. If config requires ask, request approval before running delegate commands.
2. Partition work into coherent batches with clear inputs, expected files, tests, and acceptance criteria.
3. Include relevant `docs/standards/` markdown in each batch prompt when `docs/standards/index.yml` maps standards to the touched files/domain.
4. For each batch, compute effective effort, then invoke `codex exec` with sandbox/model/effort settings.
5. Delegate must return changed files, standards followed, tests run, failures, and unresolved questions.
6. Main orchestrator reviews every delegate diff before accepting:
   - confirm scope
   - confirm applicable standards were followed
   - run/inspect tests as needed
   - fix integration issues locally or send another batch
7. Keep final responsibility in this session. Delegation is implementation assistance, not approval to skip review.

## Safety

- Never let delegation switch branches, commit, push, or open PRs.
- Never delegate ambiguous product decisions.
- Do not pass secrets unless already present in normal repo/test context and required.
- Preserve user changes and unrelated work.
- If delegation fails, fall back to local `ce-work` behavior and report the failure.

## Final Output

Summarize:

- whether delegation was used and source of activation
- batches delegated and accepted/reworked
- files changed and behavior delivered
- tests/checks run
- residual risks/follow-ups
