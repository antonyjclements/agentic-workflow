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

- installs all skills globally to `~/.agents/skills`
- can fetch the latest workflow source from GitHub when run with `--remote` or `--source-url`
- removes deprecated bundled skills such as `lfg`
- symlinks runtime skill directories to `~/.agents/skills` when safe:
  - `~/.claude/skills`
  - `~/.codeium/skills`
  - `~/.windsurf/skills`
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
- creates repo-local workflow config documentation if missing:
  - `docs/workflow/README.md`
- creates global learning storage at `~/.agents/learnings/index.yml`

Existing repo files are preserved unless you pass `--force`.

Existing non-symlink skill directories are preserved. If a runtime already has its own real `skills` directory, the installer will not replace it.

The repository root `aw-version.txt` is the single version source for installer-owned version markers. Installed `AGENTS.md` carries the same version stamp.

## Upgrade Existing Installs

Use `aw-upgrade` when an existing repo already has Agentic Workflow files and you need to adopt a newer workflow version:

```text
Use aw-upgrade to upgrade /path/to/target/repo.
```

The upgrade path dry-runs first, then can apply a safe migration for `docs/workflow/config.yml`:

```bash
ruby skills/aw-init/scripts/upgrade-config.rb --repo /path/to/target/repo --dry-run
ruby skills/aw-init/scripts/upgrade-config.rb --repo /path/to/target/repo --apply
```

Applying the migration creates a timestamped backup beside the original config and writes the current `.agentic-workflow-version`.

The config migrator preserves unknown fields, adds missing current defaults, and moves old skill selector fields into `workflow.steps` or `workflow.auxiliary`:

- `ticket_creation.skill` -> `workflow.steps.create_tickets.skill`
- `git.commit.skill` -> `workflow.steps.commit.skill`
- `research.slack.skill` -> `workflow.auxiliary.research_slack.skill`
- custom `post_pr.ci_monitor.skill` -> `workflow.steps.monitor_pipeline.skill` and `post_pr.ci_monitor.provider: github-actions` when no provider was set
- `post_pr.ci_monitor.skill: aw-monitor-circleci` -> `post_pr.ci_monitor.provider: circleci`

## Cross-Agent Skill Install

The canonical skill install location is:

```text
~/.agents/skills
```

The installer then exposes that same directory to other agents by creating symlinks:

```text
~/.claude/skills -> ~/.agents/skills
~/.codeium/skills -> ~/.agents/skills
~/.windsurf/skills -> ~/.agents/skills
```

This means `docs/workflow/config.yml` should use skill names, not filesystem paths. Each runtime still has to support loading skills from its configured skills directory.

To skip symlink creation:

```bash
skills/aw-init/scripts/install.sh --skip-skill-links --repo /path/to/repo
```

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
    README.md
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

Workflow step overrides, implementation test policy, and related behavior are configured in `docs/workflow/config.yml`. Most repos should leave skill overrides blank; blank values use the bundled defaults.

Minimal example:

```yaml
workflow:
  implementation:
    test_policy: acceptance-first
  steps:
    create_tickets:
      skill: ""
    work:
      skill: ""
    check_workflow_compliance:
      skill: ""
    monitor_pipeline:
      skill: ""
  auxiliary:
    research_slack:
      skill: ""
pull_request:
  template:
    title: ""
    body: ""
git:
  commit:
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
    provider: manual
human_review:
  spec:
    reviewers:
      - product-github-user
  plan:
    reviewers:
      - engineering-github-user
```

Schema:

| Path | Type | Default | Description |
| --- | --- | --- | --- |
| `workflow.implementation.test_policy` | string | `acceptance-first` | How implementation work should map acceptance criteria to tests or checks. |
| `workflow.steps.<step>.skill` | string | `""` | Optional replacement skill for a named workflow lifecycle step. Blank means use the bundled default. |
| `workflow.auxiliary.<key>.skill` | string | `""` | Optional replacement skill for a helper capability used by one or more workflow steps. Blank means use the bundled default. |
| `pull_request.template.title` | string | `""` | Optional path or URL for a PR title template. Blank means generate the title normally. |
| `pull_request.template.body` | string | `""` | Optional path or URL for a PR body template. Blank means generate the body normally. |
| `git.commit.format` | string | `conventional` | Commit message convention used by bundled commit skills. |
| `git.commit.scope_required` | boolean | `false` | Whether configured commit messages must include a non-empty scope. |
| `git.commit.template` | string | `"<type>(<scope>): <description>"` | Commit subject template used by bundled commit skills. |
| `git.commit.allowed_types` | string list | conventional types | Allowed commit types for bundled commit skills. |
| `git.commit.examples` | string list | example docs commit | Example commit messages used as style guidance. |
| `post_pr.ci_monitor.provider` | string | `manual` | Post-PR monitor provider. `manual` disables automated monitoring. |
| `human_review.spec.reviewers` | string list | `[]` | GitHub usernames requested on spec review PRs. |
| `human_review.plan.reviewers` | string list | `[]` | GitHub usernames requested on plan review PRs. |

The config customizes how named workflow routes execute. It does not decide whether a trivial fix, small bug, feature, or high-risk change should use the full workflow; that task-size routing belongs in `AGENTS.md`.

Set `workflow.steps.<step>.skill` to replace a bundled workflow step with a custom skill. Blank values use the bundled default. The full default step map is documented in installed `AGENTS.md`.

Set `workflow.auxiliary.<key>.skill` to replace helper skills that can be invoked by multiple workflow steps.

Default workflow step keys:

```text
import_prd -> aw-import-prd
create_prd -> aw-create-prd
brainstorm -> aw-brainstorm
create_spec -> aw-create-spec
review_spec -> aw-review-spec
request_human_review -> aw-request-human-review
plan -> aw-plan
review_plan -> aw-review-doc
create_tickets -> aw-create-tickets
work -> aw-work
review_code -> aw-review-code
check_workflow_compliance -> aw-check-workflow-compliance
commit -> aw-commit
commit_push_pr -> aw-commit-push-pr
monitor_pipeline -> aw-monitor-pipeline
```

Auxiliary skill keys:

```text
index_features -> aw-index-features
debug -> aw-debug
create_worktree -> aw-create-worktree
simplify_code -> aw-simplify-code
log_decision -> aw-log-decision
record_retrospective -> aw-record-retrospective
capture_solution -> aw-capture-solution
refresh_solutions -> aw-refresh-solutions
refresh_decisions -> aw-refresh-decisions
discover_standards -> aw-discover-standards
research_slack -> aw-research-slack
clean_artifacts -> aw-clean-artifacts
resolve_pr_feedback -> aw-resolve-pr-feedback
```

Old step-specific skill selector fields such as `ticket_creation.skill`, `git.commit.skill`, and `post_pr.ci_monitor.skill` are replaced by `workflow.steps`. Old helper selector fields such as `research.slack.skill`, and older helper keys misplaced under `workflow.steps`, are replaced by `workflow.auxiliary`. Migrate old values to the matching `workflow.steps.<step>.skill` or `workflow.auxiliary.<key>.skill` entry instead of maintaining both shapes.

Valid `workflow.implementation.test_policy` values:

| Value | Meaning |
| --- | --- |
| `acceptance-first` | Start from acceptance criteria, then choose the lightest automated or manual verification that proves them. |
| `tdd` | Write failing tests before implementation, then make them pass. |
| `bdd` | Express expected behavior in scenario-style tests or checks before implementation where practical. |
| `characterization-first` | Capture current behavior with tests before changing legacy or poorly understood code. |
| `test-after` | Implement first, then add targeted tests/checks before shipping. |
| `manual-verification` | Use explicit manual checks when automation is unavailable or disproportionate. |
| `none` | No test policy is enforced by workflow config. Use only for intentionally unverified work. |

Blank or missing policy values default to `acceptance-first`.

Set `workflow.steps.create_tickets.skill` to a Linear, Jira, or custom ticketing step when external tickets should be created. Leave it blank to use the bundled `aw-create-tickets` drafting step, which reports the proposed ticket split without creating external tickets.

Set `workflow.auxiliary.research_slack.skill` when Slack access should route through an enterprise-specific Slack skill. Leave it blank to use the default `aw-research-slack` discovery path. Put workspace or channel defaults in that custom skill when a repo needs them.

Set `pull_request.template.title` and `pull_request.template.body` when PR title/body text should follow organization templates. Each value should point to a markdown file by GitHub URL, raw GitHub URL, `file://` URL, absolute path, or repo-relative path. Leave either blank to use the default generated title or body for that part.

Set `workflow.steps.commit.skill` or `workflow.steps.commit_push_pr.skill` when commits or commit/push/PR should route through an enterprise-specific step. The bundled commit flow follows `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present, then falls back to repo instructions and recent commit history.

Set `post_pr.ci_monitor.provider` to choose whether post-PR monitoring runs. `manual` disables monitoring. Use `workflow.steps.monitor_pipeline.skill` only when replacing the bundled provider-neutral monitoring step. Retry limits and polling cadence belong to the monitor skill, not the base workflow config.

For CircleCI:

```yaml
post_pr:
  ci_monitor:
    provider: circleci
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

When committing, `aw-commit` and `aw-commit-push-pr` first check `docs/workflow/config.yml`. If `workflow.steps.commit.skill` is configured, they delegate commit message generation or commit creation to that enterprise step. Otherwise, they use the configured template and examples when present.

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

For non-trivial changes, `aw-commit-push-pr` runs the configured compliance check after pushing the branch and before creating the PR. If `workflow.steps.check_workflow_compliance.skill` is blank, it uses `aw-check-workflow-compliance`.

If post-PR monitoring is configured, the PR creation flow should invoke the configured monitor step after creating or updating the PR.

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
Use aw-commit-push-pr to commit, push, run workflow compliance, and create the PR.
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
skills/aw-init/scripts/install.sh --skip-repo                   # install global skills only
skills/aw-init/scripts/install.sh --skip-skill-links --repo .   # do not link Claude/Codeium/Windsurf skill dirs
skills/aw-init/scripts/install.sh --skip-skills --repo ~/Code/app
skills/aw-init/scripts/install.sh --skills-dir ~/.codex/skills  # alternate global skill dir
skills/aw-init/scripts/install.sh --learnings-dir ~/.agents/learnings
skills/aw-init/scripts/install.sh --remote --repo .             # fetch latest source from GitHub
skills/aw-init/scripts/install.sh --source-url URL --repo .     # fetch source from a pinned archive or mirror
```

Environment overrides:

```bash
AGENTIC_WORKFLOW_SKILLS_DIR=~/.codex/skills skills/aw-init/scripts/install.sh --repo .
AGENTIC_WORKFLOW_LEARNINGS_DIR=~/.agents/learnings skills/aw-init/scripts/install.sh --repo .
AGENTIC_WORKFLOW_SOURCE_URL=https://github.com/antonyjclements/agentic-workflow/archive/refs/tags/v0.3.0.tar.gz skills/aw-init/scripts/install.sh --remote --repo .
```

## Included Skills

- `aw-init`: install repo-local `AGENTS.md`, `CLAUDE.md`, docs indexes, workflow config, version marker, skill links, and global learnings index
- `aw-upgrade`: upgrade existing installs and safely migrate older `docs/workflow/config.yml` shapes
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
- `aw-check-workflow-compliance`: check workflow routing, test policy, acceptance coverage, README expectations, and review gates after push and before PR creation
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
