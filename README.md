# Agentic Workflow

Agentic Workflow is a lightweight repo-native operating model for teams using coding agents on real, long-lived codebases. It keeps product intent, standards, decisions, corrections, and session memory versioned with the code, so agents and humans can pick up work without losing context.

This repo installs the same operating model into any codebase:

- living specs for product intent
- indexed standards for how the team works
- immutable decisions for why choices were made
- retrospective learnings so agent corrections compound over time

The goal is not to adopt a framework. The goal is to make your repo the source of truth that agents read from and write back to.

## When to use this

The workflow pays back most on mature, multi-quarter, multi-contributor codebases. The discipline cost is front-loaded; the value is back-loaded. On a brand-new project there is nothing to synthesize yet.

That said, some parts of the system pay back from the start:

- **Decisions and session logs** are worth capturing immediately — even on a new project, the cost of reconstructing "why did we choose X?" is real and arrives sooner than expected.
- **Learnings and synthesis** start paying back after 4–8 sessions, once patterns emerge across sessions and `aw-synthesize-memory` has material to work with.
- **Context wiki and standards** earn their keep around the two-month mark or when a second contributor joins and shared context becomes a bottleneck.

Install the workflow on any project. Start with decisions and session logs. Let the rest earn its place as the project matures.

## Presentations

- [Overview deck](https://antonyjclements.github.io/agentic-workflow/) — the adoption story: the collaboration problems product teams already have, shared living memory, and the workflow that fixes both human↔agent and human↔human.
- [Technical deep dive](https://antonyjclements.github.io/agentic-workflow/technical.html) — how it works: artifacts as state machines, decisions as an event log, routing as dependency injection, and the determinism boundary.

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
  - `docs/sessions/index.yml`
- installs a Claude Code Stop hook for automatic session logging:
  - `.claude/hooks/log-session.sh`
  - `.claude/settings.json` (Stop hook entry merged in)
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

Upgrade via the bundled script rather than an agent skill:

```bash
skills/aw-init/scripts/upgrade.sh --repo /path/to/target/repo --dry-run
skills/aw-init/scripts/upgrade.sh --repo /path/to/target/repo --apply
```

Pass `--refresh-skills --remote` to also refresh global skills and repo-local agent instructions:

```bash
skills/aw-init/scripts/upgrade.sh --repo /path/to/target/repo --apply --refresh-skills --remote
```

Applying the migration creates a timestamped backup beside the original config and writes the current `.agentic-workflow-version`.

The config migrator preserves unknown fields, adds missing current defaults, and moves old skill selector fields into `workflow.steps` or `workflow.auxiliary`:

- `ticket_creation.skill` → `workflow.steps.create_tickets.skill`
- `git.commit.skill` → `workflow.steps.commit.skill`
- `research.slack.skill` → `workflow.auxiliary.research_slack.skill`
- custom `post_pr.ci_monitor.skill` → `workflow.steps.monitor_pipeline.skill` and `post_pr.ci_monitor.provider: github-actions` when no provider was set
- `post_pr.ci_monitor.skill: aw-monitor-circleci` → `post_pr.ci_monitor.provider: circleci`

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

### Durable context

Five artifact types compound over time and live permanently in the repo:

- **PRDs** preserve external product input or authored product requirements as source artifacts.
- **Specs** describe what a feature is now.
- **Standards** describe how work should be done here.
- **Decisions** record why a choice was made.
- **Learnings** capture corrections that should change future agent behavior.

### Transient and synthesized context

Two additional artifact types form the memory synthesis loop:

- **Session logs** (`docs/sessions/`) are transient synthesis input — raw material written by
  `aw-capture session` and consumed by `aw-synthesize-memory`. They are not durable project
  knowledge; they decay once their signal has been promoted to learnings.
- **The context wiki** (`docs/context/wiki.md`) is a generated artifact, never a source artifact.
  Regenerated in full on each synthesis run, it gives agents a compact project briefing at
  session start. Never edit it manually.

### The rule

When in doubt, prefer a session log over a durable artifact. Durable artifacts represent
knowledge worth rediscovering months from now, not facts learned during implementation. The
synthesis loop exists so transient knowledge can earn durability through repetition, not
assumption.

- If it describes intent, keep it alive.
- If it is an imported PRD, preserve it as historical input. If authored in-repo, treat it as product input for specs.
- If it describes a plan, let it expire.
- If it describes a decision, log it immutably.
- If it is a processed session log, let it decay once its signal has been promoted to learnings.
- If it is the context wiki, regenerate it; never treat it as a source artifact.

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
  sessions/
    index.yml
  context/
    wiki.md          # generated by aw-synthesize-memory; do not edit manually
  workflow/
    README.md
    config.yml
```

`AGENTS.md` is the routing file agents read first. If a repo also uses `CLAUDE.md`, keep it aligned with `AGENTS.md`.

## How To Use It

For a quick reference on which skills to run and when — by task type and team size — see [operating_model.md](operating_model.md).

### 1. Start with PRD intake, discovery, or a spec

When you have a PRD from pasted content, a local file, markdown, or a document link, or when you want to author a PRD from ideas or notes, use `aw-prd`. It routes internally between import and create modes.

Example prompts:

```text
Use aw-prd to import this PRD from this Google Doc.
```

```text
Use aw-prd to draft a PRD from these notes.
```

Imported and authored PRDs are stored as source artifacts:

```text
docs/product/prds/<date>-<slug>.md
```

Then pass the PRD path to `aw-brainstorm` unless the PRD is already clear and you explicitly want a spec draft. PRDs often contain implicit ambiguity, assumptions, and open questions. `aw-brainstorm` resolves that ambiguity and creates or updates the living feature spec in the same run.

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

They are indexed by `docs/features/index.yml`. To generate or refresh that index:

```text
Use aw-refresh features to generate docs/features/index.yml.
```

`aw-prd create` uses `docs/product/prds/template.md` when a repo provides one, otherwise it falls back to its bundled template.

PRD lifecycle statuses are:

- `imported`: external PRD preserved as source input
- `draft`: authored PRD still being shaped
- `ready-for-spec`: stable enough to promote into a living spec
- `promoted`: a living spec has been created from the PRD
- `superseded`: replaced before promotion by newer product input
- `archived`: safe to remove from the working tree with `aw-refresh cleanup`

When a spec is created from a PRD, the agent marks the PRD `promoted` and links `promoted_to` to the spec. The PRD body stays unchanged. To remove old artifacts, mark them `archived` and run `aw-refresh cleanup`; git history is the long-term archive.

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

After a plan is created, run `aw-review plan` before human review, ticket creation, or implementation. It catches plan coherence, feasibility, scope, and role-specific issues while the plan is still cheap to change.

```text
Use aw-review on docs/features/mfa/plan.md before we create tickets.
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
prd -> aw-prd
brainstorm -> aw-brainstorm
create_spec -> aw-create-spec
request_human_review -> aw-request-human-review
plan -> aw-plan
review -> aw-review
create_tickets -> aw-create-tickets
work -> aw-work
check_workflow_compliance -> aw-check-workflow-compliance
commit -> aw-commit
commit_push_pr -> aw-commit-push-pr
monitor_pipeline -> (no bundled skill; set workflow.steps.monitor_pipeline.skill)
```

Auxiliary skill keys:

```text
refresh -> aw-refresh
debug -> aw-debug
create_worktree -> aw-create-worktree
capture -> aw-capture
discover_standards -> aw-discover-standards
resolve_pr_feedback -> aw-resolve-pr-feedback
synthesize_memory -> aw-synthesize-memory
```

`research_slack`, `log_session`, `monitor_pipeline`, and `clean_artifacts` are no longer bundled keys. For Slack research, agents use available tools directly; set `workflow.auxiliary.research_slack.skill` for enterprise routing. Session logging is now `aw-capture session`. Post-PR CI monitoring requires a custom skill via `workflow.steps.monitor_pipeline.skill`. Archived artifact cleanup is now `aw-refresh cleanup`.

Old step-specific skill selector fields such as `ticket_creation.skill`, `git.commit.skill`, and `post_pr.ci_monitor.skill` are replaced by `workflow.steps`. Old step keys `import_prd`, `create_prd`, `review_spec`, `review_plan`, `review_code` are now `prd` and `review`; old auxiliary keys `index_features`, `simplify_code`, `log_decision`, `record_retrospective`, `capture_solution`, `refresh_solutions`, `refresh_decisions`, `clean_artifacts`, and `log_session` are now `refresh` and `capture`. Migrate old values to the matching current keys.

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

Set `workflow.auxiliary.research_slack.skill` when Slack access should route through an enterprise-specific Slack skill. When not set, agents use whatever Slack tools are available in the environment (MCP servers, etc.) directly.

Set `pull_request.template.title` and `pull_request.template.body` when PR title/body text should follow organization templates. Each value should point to a markdown file by GitHub URL, raw GitHub URL, `file://` URL, absolute path, or repo-relative path. Leave either blank to use the default generated title or body for that part.

Set `workflow.steps.commit.skill` or `workflow.steps.commit_push_pr.skill` when commits or commit/push/PR should route through an enterprise-specific step. The bundled commit flow follows `git.commit.template`, `scope_required`, `allowed_types`, and `examples` when present, then falls back to repo instructions and recent commit history.

Set `workflow.steps.monitor_pipeline.skill` to a custom skill that handles post-PR CI monitoring for your provider (GitHub Actions, CircleCI, Jenkins, etc.). There is no bundled pipeline monitor — agents invoke the configured skill directly after PR creation, or skip cleanly when `post_pr.ci_monitor.provider` is `manual` or missing. Retry limits and polling cadence belong to the provider skill, not the base workflow config.

To enable monitoring, set `workflow.steps.monitor_pipeline.skill` to a skill that handles your CI provider. Set `post_pr.ci_monitor.provider` to a non-`manual` value to signal that monitoring is expected. Leave `post_pr.ci_monitor.provider: manual` (or omit it) to skip post-PR monitoring entirely.

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

When ambiguity is resolved, ask the agent to use `aw-capture decision`.

Example prompts:

```text
Use aw-capture decision to record that MFA recovery codes are single-use.
```

```text
Log the decision that mobile offline sync is eventually consistent.
```

Decision records live in `docs/decisions/` and are indexed in `docs/decisions/index.yml`.

Do not edit old decision records to change history. Create a new decision that supersedes the old one.

When the decision folder gets large or the index looks stale, use `aw-refresh decisions`.

```text
Use aw-refresh decisions to rebuild the decision index and create summaries for large areas.
```

That skill preserves immutable decision files, refreshes `docs/decisions/index.yml`, flags metadata gaps, follows supersession chains, and creates derived summaries under `docs/decisions/summaries/` when useful.

### 7. Review before shipping

Before opening a PR, ask the agent to use `aw-review`. It routes by target: code diff → code review; spec → spec drift check; doc/plan → document review; "simplify" → simplification pass.

Example prompts:

```text
Use aw-review to check this branch for spec drift and code issues.
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

When you correct an agent and the correction should matter in the future, the agent should use `aw-capture learning`.

Example prompts:

```text
Use aw-capture learning to save that for this repo.
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
Use aw-prd to persist the pasted/file/link PRD.
Use aw-brainstorm with the imported PRD path to clarify requirements and create/update the feature spec.
Use aw-plan with the feature spec path to plan implementation.
Use aw-create-tickets with the plan path to turn the plan into stories.
Have an agent pick up the first ticket ID/URL with aw-work.
Use aw-capture decision for any choices we make during build.
Use aw-review before opening the PR (spec drift + code review in one step).
Run the capture checkpoint.
Update README.md if setup, commands, config, or workflow behavior changed.
Use aw-commit-push-pr to commit, push, run workflow compliance, and create the PR.
If `workflow.steps.monitor_pipeline.skill` is configured, invoke it with the PR URL to watch CI and fix failures until green.
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
Use aw-capture learning if this should affect future agent behavior, and aw-capture decision if it changes the product contract.
```

### Session Memory

For Claude Code, session logging is automatic. The Stop hook installed by `aw-init` fires when each session ends and writes a log to `docs/sessions/` without any manual step.

For other agents (Codex, Codeium, Windsurf), invoke `aw-capture session` manually at session end. The session log format is cross-agent — all logs land in `docs/sessions/` and are processed identically.

```text
# manual invocation (any agent)
Use aw-capture session to record what was attempted, what worked, any corrections, and dead ends.

# synthesis (any agent, run periodically)
After a sprint or when several unprocessed session logs have accumulated, use aw-synthesize-memory to distill logs into learnings and regenerate docs/context/wiki.md.
```

### PR Readiness

```text
Run aw-review to check for spec drift and code issues, then update any stale specs or missing decisions before creating the PR.
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
AGENTIC_WORKFLOW_SOURCE_URL=https://github.com/antonyjclements/agentic-workflow/archive/refs/tags/v0.5.0.tar.gz skills/aw-init/scripts/install.sh --remote --repo .
```

## Included Skills

- `aw-init`: install repo-local `AGENTS.md`, `CLAUDE.md`, docs indexes, workflow config, version marker, skill links, global learnings index, and bundled `docs/standards/coding-approach.md`; upgrade via `skills/aw-init/scripts/upgrade.sh`
- `aw-help`: get a guided recommendation for which skill to run next based on what you're trying to do and where you are in the workflow; reads `docs/workflow/field-guide.md` when available
- `aw-prd`: create or import PRDs under `docs/product/prds/`; routes by source between import mode (pasted content/file/URL) and create mode (ideas/notes)
- `aw-brainstorm`: clarify ambiguous PRDs or ideas and create the right artifact, usually a living feature spec
- `aw-create-spec`: directly create or update living feature specs in `docs/features/<feature>/spec.md`
- `aw-plan`: create implementation plans from specs or requirements
- `aw-review`: review code, docs, plans, and specs — routes by target: code diff → code review with P0-P3 findings; simplify/refactor → 3-agent simplification pass; doc/plan → document review; spec → spec drift check
- `aw-create-tickets`: turn plans into configured Linear/Jira/custom implementation tickets
- `aw-work`: implement plans, tickets, specs, or concrete requests
- `aw-debug`: investigate and fix bugs systematically
- `aw-check-workflow-compliance`: check workflow routing, test policy, acceptance coverage, README expectations, and review gates after push and before PR creation
- `aw-commit`: create focused commits
- `aw-commit-push-pr`: commit, push, create/update PRs with optional configured title/body templates, and invoke configured post-PR monitoring
- `aw-request-human-review`: create spec/plan sign-off PRs and request configured GitHub reviewers
- `aw-capture`: capture durable knowledge — routes by type: `decision` → immutable record in `docs/decisions/`; `learning` → correction-driven learning in `docs/learnings/`; `solution` → reusable solved-problem doc in `docs/solutions/`; `session` → structured session log in `docs/sessions/` feeding the memory synthesis loop
- `aw-refresh`: refresh and maintain docs registries — routes by scope: `decisions` → rebuild index and summaries without rewriting records; `solutions` → audit and update stale solution docs; `features` → regenerate `docs/features/index.yml`; `cleanup` → remove workflow artifacts marked `status: archived`
- `aw-discover-standards`: extract repeated codebase conventions into `docs/standards/`
- `aw-synthesize-memory`: process session logs into learnings, regenerate `docs/context/wiki.md`, surface pattern candidates for standards promotion, and expire old processed logs
- `aw-resolve-pr-feedback`: resolve PR review comments
- `aw-create-worktree`: create isolated git worktrees

The repo carries a curated skill set under `skills/`. Deprecated or unrelated skills should be removed rather than kept for completeness.

## Maintenance

When changing this workflow:

- update `skills/aw-init/artifacts/AGENTS.md` if agent routing changes
- update or add skills under `skills/`
- update `skills/aw-init/scripts/install.sh` if repo-local structure changes
- update this README so humans know how to use the system
- keep install guidance sourced from `aw-init`
- run `bash -n skills/aw-init/scripts/install.sh && bash -n skills/aw-init/scripts/upgrade.sh`
- run `bash scripts/test-install.sh`
