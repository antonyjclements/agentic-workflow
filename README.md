# Agentic Workflow

Portable agent workflow instructions and skills for spec-driven development.

This repo helps you install the same agent operating model into any codebase:

- living specs for product intent
- indexed standards for how the team works
- immutable decisions for why choices were made
- retrospective learnings so agent corrections compound over time

The goal is not to adopt a framework. The goal is to make your repo the source of truth that agents read from and write back to.

## Quick Start

Use the `aw-init` skill to install the workflow into a target repo:

```text
Use aw-init to install agentic-workflow into /path/to/target/repo.
```

From a clone of this repo, the same installer is available inside the skill:

```bash
skills/aw-init/scripts/install.sh --repo /path/to/target/repo
```

There is intentionally no root `AGENTS.md`, `CLAUDE.md`, or `scripts/install.sh` in this repository. `aw-init` is the source of truth for install artifacts and installer behavior.

The installer:

- copies `AGENTS.md` into the target repo
- copies `CLAUDE.md` into the target repo as a Claude Code shim containing `@AGENTS.md`
- writes `.agentic-workflow-version`
- creates repo-local indexes if missing:
  - `docs/product/prds/index.yml`
  - `docs/brainstorms/index.yml`
  - `docs/features/index.yml`
  - `docs/standards/index.yml`
  - `docs/decisions/index.yml`
  - `docs/learnings/index.yml`
- creates repo-local PRD template if missing:
  - `docs/product/prds/template.md`
- creates repo-local workflow config if missing:
  - `docs/workflow/config.yml`

Existing repo files are preserved unless you pass `--force`.

`aw-init` does not install, remove, or link skills. Skill installation is handled outside the repo initializer by the agent runtime or skill manager.

## Skill Availability

This repo carries the curated skill source under `skills/`. Install or expose those skills through the mechanism your agent runtime supports, then use `aw-init` only to scaffold the target repository's agent files and workflow directories.

## Mental Model

Use five kinds of durable context:

- **PRDs** preserve external product input or authored product requirements as source artifacts.
- **Specs** describe what a feature is now.
- **Standards** describe how work should be done here.
- **Decisions** record why a choice was made.
- **Learnings** capture corrections that should change future agent behavior.

The rule:

- If it describes intent, keep it alive.
- If it is an imported PRD, preserve it as historical input. If it is authored in-repo, treat it as product input for specs.
- If it describes a plan, let it expire.
- If it describes a decision, log it immutably.

## Repo Structure

After installation, a repo should have:

```text
AGENTS.md
CLAUDE.md
.agentic-workflow-version
docs/
  product/
    prds/
      index.yml
      template.md   # optional repo-defined template for authored PRDs
  brainstorms/
    index.yml
  features/
    index.yml
    <feature>/
      spec.md
      plan.md
  standards/
    index.yml
  decisions/
    index.yml
  learnings/
    index.yml
  workflow/
    config.yml
```

`AGENTS.md` is the routing file agents read first. If a repo also uses `CLAUDE.md`, keep it aligned with `AGENTS.md`.

## How To Use It

### 1. Start with PRD intake, discovery, or a spec

When you have a PRD from pasted content, a local file, markdown, or a document link, first preserve it with `aw-import-prd`.

Example prompts:

```text
Use aw-import-prd to create a PRD from this Google Doc.
```

```text
Use aw-import-prd to save this pasted PRD.
```

Imported PRDs are historical source artifacts:

```text
docs/product/prds/<date>-<slug>.md
```

Then pass the imported PRD path to `aw-brainstorm` unless the PRD is already clear and you explicitly want a spec draft. PRDs often contain implicit ambiguity, assumptions, and open questions. `aw-brainstorm` resolves that ambiguity and creates or updates the living feature spec in the same run.

```text
Use aw-brainstorm with docs/product/prds/2026-05-24-checkout-redesign.md.
```

For a raw idea that should become a living spec, start with `aw-brainstorm` directly:

```text
Use aw-brainstorm to explore account recovery and create the living spec.
```

For existing behavior or already-clear requirements, `aw-create-spec` can still be used directly:

```text
Analyze the checkout flow and create a spec for how it works today.
```

Specs are stored by feature:

```text
docs/features/<feature>/spec.md
```

They are indexed by `docs/features/index.yml`. To generate or refresh that index, ask the agent to use `aw-index-features`:

```text
Use aw-index-features to generate docs/features/index.yml.
```

Use `aw-create-prd` when you want an authored PRD instead of immediately committing intent to a living spec:

```text
Use aw-create-prd to turn this idea into a PRD draft.
```

`aw-create-prd` uses `docs/product/prds/template.md` when a repo provides one, otherwise it falls back to its bundled template.

PRD lifecycle statuses are:

- `imported`: external PRD preserved as source input
- `draft`: authored PRD still being shaped
- `ready-for-spec`: stable enough to promote into a living spec
- `promoted`: a living spec has been created from the PRD
- `superseded`: replaced before promotion by newer product input
- `archived`: safe to remove from the working tree with `aw-clean-artifacts`

When a spec is created from a PRD, the agent marks the PRD `promoted` and links `promoted_to` to the spec. The PRD body stays unchanged. To remove old artifacts, mark them `archived` and run `aw-clean-artifacts`; git history is the long-term archive.

### 2. Discover or enforce standards

If a repo has repeated conventions, ask the agent to use `aw-discover-standards`.

Example prompts:

```text
Use aw-discover-standards to document our API handler conventions.
```

```text
Before implementing this, read the relevant docs/standards entries and follow them.
```

Standards are stored as small markdown files in `docs/standards/` and indexed in `docs/standards/index.yml`.

### 3. Plan from the spec

For multi-step work, ask for a plan after the spec exists.

Example prompt:

```text
Use aw-plan to plan the implementation from docs/features/mfa/spec.md.
```

Plans are execution scaffolding. They live at `docs/features/<feature>/plan.md` and should be removed when they are no longer active.

After a plan is created, run `aw-review-doc` before human review, ticket creation, or implementation. It catches plan coherence, feasibility, scope, and role-specific issues while the plan is still cheap to change.

```text
Use aw-review-doc on docs/features/mfa/plan.md before we create tickets.
```

### 4. Implement the work

If the plan should become work items, ask the agent to use `aw-create-tickets` before implementation.

Example prompts:

```text
Use aw-create-tickets to turn docs/features/mfa/plan.md into stories.
```

```text
Create Jira tickets from this plan, using the configured ticket creation skill.
```

Ticket creation is configured in `docs/workflow/config.yml`:

```yaml
ticket_creation:
  skill: linear
research:
  slack:
    skill: ""
pull_request:
  template:
    title: ""
    body: ""
git:
  commit:
    skill: ""
    format: conventional
    scope_required: false
    template: "<type>(<scope>): <description>"
    allowed_types:
      - feat
      - fix
      - docs
      - chore
      - refactor
      - test
      - ci
      - build
      - perf
      - style
    examples:
      - "docs(readme): update usage guide"
post_pr:
  ci_monitor:
    provider: github-actions
    skill: github:gh-fix-ci
human_review:
  spec:
    reviewers:
      - product-github-user
  plan:
    reviewers:
      - engineering-github-user
```

Set `ticket_creation.skill` to the skill or MCP-backed workflow the agent should use, such as a Linear skill, Jira skill, or custom repo skill. Leave it blank to skip ticket creation for that repo. Put provider-specific defaults in that custom skill or the target ticket system, not in the base workflow config.

Set `research.slack.skill` when Slack access should route through an enterprise-specific Slack skill. Leave it blank to use the default `aw-research-slack` discovery path. Put workspace or channel defaults in that custom skill when a repo needs them.

Set `pull_request.template.title` and `pull_request.template.body` when PR title/body text should follow organization templates. Each value should point to a markdown file by GitHub URL, raw GitHub URL, `file://` URL, absolute path, or repo-relative path. Leave either blank to use the default generated title or body for that part.

Set `git.commit.skill` when commits should route through an enterprise-specific skill. Leave it blank to use the default commit flow. The default flow follows `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present, then falls back to repo instructions and recent commit history.

Set `post_pr.ci_monitor.skill` to the skill that should monitor and fix CI/CD after PR creation, such as a GitHub Actions, CircleCI, Jenkins, or custom pipeline skill. Leave it blank to skip post-PR monitoring. Retry limits and polling cadence belong to the linked monitor skill, not the base workflow config.

For CircleCI:

```yaml
post_pr:
  ci_monitor:
    provider: circleci
    skill: aw-monitor-circleci
```

CircleCI-specific settings are not part of the default `docs/workflow/config.yml`. `aw-monitor-circleci` will infer them from the git remote, PR URL, and `.circleci/config.yml` where possible. If a repo needs explicit settings, the skill can create `docs/workflow/circleci.yml`:

```yaml
vcs: github
org: your-github-org
project: your-repo
branch: ""
token_env: CIRCLECI_CLI_TOKEN
```

Set `human_review.spec.reviewers` and `human_review.plan.reviewers` to GitHub usernames that should be requested on spec and plan sign-off PRs. Leave the lists empty to create review PRs without automatic reviewer assignment.

### Human review gates

After `aw-brainstorm` or `aw-create-spec` creates or updates a spec, the agent should ask whether you want product/human review of the spec. If yes, it runs:

```text
aw-request-human-review spec docs/features/<feature>/spec.md
```

After `aw-plan`, the agent should ask whether you want engineering/human review of the plan. If yes, it runs:

```text
aw-request-human-review plan docs/features/<feature>/plan.md
```

That skill commits the artifact set, opens a GitHub PR, and requests configured reviewers from `docs/workflow/config.yml`.

### 5. Pick up a ticket

Ask the agent to execute with `aw-work`, or make a direct implementation request.

A ticket can also be the first thing a later agent sees after checking out the repo. That is expected. The agent should read `AGENTS.md`, load `docs/workflow/config.yml`, fetch the ticket through the configured ticket tool when available, then follow ticket links back to the source spec, plan, decisions, standards, acceptance criteria, and tests.

If the ticket does not link back to source artifacts, the agent should search `docs/features/`, `docs/decisions/`, and `docs/standards/` for the likely feature area before editing. If the ticket conflicts with the living spec or decisions, it should stop and surface the mismatch instead of guessing.

During implementation, the agent should:

- read relevant specs
- read relevant standards
- follow existing code patterns
- surface ambiguities instead of hiding assumptions
- update `README.md` when setup, commands, configuration, architecture, or workflow behavior changes
- log durable decisions when choices are made
- proactively prompt to capture decisions, learnings, or reusable solutions at natural pauses

### 6. Log decisions as they happen

When ambiguity is resolved, ask the agent to use `aw-log-decision`.

Example prompts:

```text
Use aw-log-decision to record that MFA recovery codes are single-use.
```

```text
Log the decision that mobile offline sync is eventually consistent.
```

Decision records live in `docs/decisions/` and are indexed in `docs/decisions/index.yml`.

Do not edit old decision records to change history. Create a new decision that supersedes the old one.

When the decision folder gets large or the index looks stale, use `aw-refresh-decisions`.

```text
Use aw-refresh-decisions to rebuild the decision index and create summaries for large areas.
```

That skill preserves immutable decision files, refreshes `docs/decisions/index.yml`, flags metadata gaps, follows supersession chains, and creates derived summaries under `docs/decisions/summaries/` when useful.

### 7. Review specs before shipping

Before opening a PR, ask the agent to use `aw-review-spec`.

Example prompts:

```text
Use aw-review-spec to check this branch for spec drift.
```

```text
Before PR, verify changed behavior is reflected in docs/features.
```

The review should catch:

- code that no longer matches the spec
- specs that need updating because behavior changed
- decisions that were made but not logged
- standards that were not followed

### 8. Capture corrections as learnings

When you correct an agent and the correction should matter in the future, the agent should use `aw-record-retrospective`.

Example prompts:

```text
Use aw-record-retrospective to save that learning for this repo.
```

```text
Remember globally that I prefer replacing existing AGENTS.md files during setup.
```

Repo-specific learnings live in `docs/learnings/`.

Global learnings live in `~/.agents/learnings/`.

The agent should ask before promoting an ambiguous learning to global scope.

### 9. Let agents prompt for capture

You should not have to remember every capture command. Agents are expected to run a lightweight checkpoint after non-trivial work and before PRs:

```text
Capture checkpoint:
- any decisions to log?
- any correction-driven learnings to save?
- any solved problem worth compounding?
```

If the answer is obvious and repo-local, the agent can write the record. If scope is ambiguous, it should ask one concise question.

### 10. Monitor CI after PR creation

When committing, `aw-commit` and `aw-commit-push-pr` first check `docs/workflow/config.yml`. If `git.commit.skill` is configured, they delegate commit message generation or commit creation to that enterprise skill. If it is blank, they use the configured template and examples when present.

For repos that require scoped conventional commits:

```yaml
git:
  commit:
    scope_required: true
    template: "<type>(<scope>): <description>"
    examples:
      - "docs(readme): update usage guide"
```

When creating a PR, `aw-commit-push-pr` checks `pull_request.template`. If configured, it loads the referenced markdown title/body templates and fills known placeholders before creating the PR with the built-in GitHub CLI flow. If blank, it uses the normal generated title and body.

Example:

```yaml
pull_request:
  template:
    title: "https://github.com/acme/engineering-standards/blob/main/pr-title.md"
    body: "file:///Users/me/templates/pr-body.md"
```

Useful template placeholders include `{default_title}`, `{default_body}`, `{summary}`, `{what_changed}`, `{validation}`, `{risks}`, `{ticket}`, `{spec}`, `{decisions}`, and `{badge}`.

If post-PR monitoring is configured, the PR creation flow should invoke `aw-monitor-pipeline` after creating or updating the PR.

The configured monitor should:

- watch the PR pipeline
- inspect failing jobs/logs
- fix branch-caused failures
- push fixes
- repeat until success, the monitor skill's retry limit, or a real external blocker

Example config:

```yaml
post_pr:
  ci_monitor:
    provider: circleci
    skill: aw-monitor-circleci
```

### 11. Keep README.md current

`README.md` is part of the workflow, not an afterthought. Agents should update it automatically whenever a change affects:

- setup or installation
- repo structure
- workflow commands or skill names
- configuration fields
- human review, ticketing, CI, or shipping behavior

Before commit or PR, the agent should explicitly check whether the diff changes anything a future user needs to know. If it does, `README.md` should be updated in the same change. If it does not, the final summary or PR body should say no README update was needed.

## Common Workflows

### New Feature

```text
Use aw-import-prd to persist the pasted/file/link PRD.
Use aw-brainstorm with the imported PRD path to clarify requirements and create/update the feature spec.
Use aw-plan with the feature spec path to plan implementation.
Use aw-create-tickets with the plan path to turn the plan into stories.
Have an agent pick up the first ticket ID/URL with aw-work.
Use aw-log-decision for any choices we make during build.
Use aw-review-spec before opening the PR.
Run the capture checkpoint.
Update README.md if setup, commands, config, or workflow behavior changed.
Use aw-commit-push-pr to commit, push, and create the PR.
If configured, aw-monitor-pipeline watches CI and fixes failures until green.
```

### Ticket-First Implementation

```text
Use aw-work with ENG-123.
Read AGENTS.md and docs/workflow/config.yml.
Fetch the ticket with the configured ticket skill/tool.
Load linked source artifacts: spec, plan, decisions, standards, and acceptance criteria.
Implement only the ticket scope.
Verify the ticket acceptance criteria and update README.md if user-facing workflow behavior changed.
Summarize the ticket, source spec, decisions, and checks run.
```

### Existing Feature Discovery

```text
Analyze the current billing flow and use aw-create-spec to document how it works today.
Use aw-discover-standards to capture any repeated billing conventions you find.
```

### Correction During a Session

```text
Actually, that behavior should be parent-controlled, not child-controlled.
Use aw-record-retrospective if this should affect future agent behavior, and use aw-log-decision if it changes the product contract.
```

### PR Readiness

```text
Run aw-review-spec and aw-review-code, then update any stale specs or missing decisions before creating the PR.
```

## Installer Options

```bash
skills/aw-init/scripts/install.sh --repo .                      # install into current repo
skills/aw-init/scripts/install.sh --repo ~/Code/app --force     # overwrite repo-local AGENTS.md and indexes
```

## Included Skills

- `aw-init`: install repo-local `AGENTS.md`, `CLAUDE.md`, docs indexes, workflow config, version marker, and PRD template
- `aw-import-prd`: persist pasted/file/link PRDs in `docs/product/prds/`
- `aw-create-prd`: author PRDs from ideas, brainstorms, or notes using a repo-defined template when available
- `aw-clean-artifacts`: remove workflow artifacts marked `status: archived`
- `aw-brainstorm`: clarify ambiguous PRDs or ideas and create the right artifact, usually a living feature spec
- `aw-create-spec`: directly create or update living feature specs in `docs/features/<feature>/spec.md`
- `aw-index-features`: generate `docs/features/index.yml` from `docs/features/<feature>/spec.md`
- `aw-plan`: create implementation plans from specs or requirements
- `aw-review-doc`: review requirements and plans before handoff
- `aw-review-spec`: catch drift between implementation and specs before shipping
- `aw-create-tickets`: turn plans into configured Linear/Jira/custom implementation tickets
- `aw-work`: implement plans, tickets, specs, or concrete requests
- `aw-debug`: investigate and fix bugs systematically
- `aw-simplify-code`: simplify recently changed code while preserving behavior
- `aw-review-code`: review code before PRs
- `aw-commit`: create focused commits
- `aw-commit-push-pr`: commit, push, create/update PRs with optional configured title/body templates, and invoke configured post-PR monitoring
- `aw-monitor-pipeline`: run the configured post-PR CI monitor/fix loop
- `aw-monitor-circleci`: monitor CircleCI pipelines and fix branch-caused failures
- `aw-request-human-review`: create spec/plan sign-off PRs and request configured GitHub reviewers
- `aw-log-decision`: record immutable decisions in `docs/decisions/`
- `aw-refresh-decisions`: refresh decision indexes and summaries without rewriting immutable decision records
- `aw-discover-standards`: extract repeated codebase conventions into `docs/standards/`
- `aw-record-retrospective`: capture correction-driven learnings in `docs/learnings/` or `~/.agents/learnings/`
- `aw-capture-solution`: capture reusable solved-problem knowledge
- `aw-refresh-solutions`: refresh stale solution docs
- `aw-resolve-pr-feedback`: resolve PR review comments
- `aw-create-worktree`: create isolated git worktrees
- `aw-research-slack`: research organizational context from Slack, optionally routed through a configured enterprise Slack skill

The repo carries a curated skill set under `skills/`. Deprecated or unrelated skills should be removed rather than kept for completeness.

## Maintenance

When changing this workflow:

- update `skills/aw-init/artifacts/AGENTS.md` if agent routing changes
- update or add skills under `skills/`
- update `skills/aw-init/scripts/install.sh` if repo-local structure changes
- update this README so humans know how to use the system
- keep install guidance sourced from `aw-init`
- run `bash -n skills/aw-init/scripts/install.sh`
- run `bash scripts/test-install.sh`
