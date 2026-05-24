# Agentic Workflow

Portable agent workflow instructions and skills for spec-driven development.

This repo helps you install the same agent operating model into any codebase:

- living specs for product intent
- indexed standards for how the team works
- immutable decisions for why choices were made
- retrospective learnings so agent corrections compound over time

The goal is not to adopt a framework. The goal is to make your repo the source of truth that agents read from and write back to.

## Quick Start

Clone this repo, then install it into a target repo:

```bash
scripts/install.sh --repo /path/to/target/repo
```

To install into the current directory:

```bash
scripts/install.sh --repo .
```

The installer:

- installs all skills globally to `~/.agents/skills`
- copies `AGENTS.md` into the target repo
- creates repo-local indexes if missing:
  - `docs/specs/index.yml`
  - `docs/standards/index.yml`
  - `docs/decisions/index.yml`
  - `docs/learnings/index.yml`
- creates global learning storage at `~/.agents/learnings/index.yml`

Existing repo files are preserved unless you pass `--force`.

## Mental Model

Use four kinds of durable context:

- **Specs** describe what a feature is now.
- **Standards** describe how work should be done here.
- **Decisions** record why a choice was made.
- **Learnings** capture corrections that should change future agent behavior.

The rule:

- If it describes intent, keep it alive.
- If it describes a plan, let it expire.
- If it describes a decision, log it immutably.

## Repo Structure

After installation, a repo should have:

```text
AGENTS.md
docs/
  specs/
    index.yml
  standards/
    index.yml
  decisions/
    index.yml
  learnings/
    index.yml
```

`AGENTS.md` is the routing file agents read first. If a repo also uses `CLAUDE.md`, keep it aligned with `AGENTS.md`.

## How To Use It

### 1. Start with a spec

When you have a PRD, feature request, or existing behavior that needs a durable contract, ask the agent to use `ce-spec-create`.

Example prompts:

```text
Use ce-spec-create to turn this PRD into a living spec.
```

```text
Analyze the checkout flow and create a spec for how it works today.
```

Specs are stored in `docs/specs/` and indexed in `docs/specs/index.yml`.

### 2. Discover or enforce standards

If a repo has repeated conventions, ask the agent to use `ce-discover-standards`.

Example prompts:

```text
Use ce-discover-standards to document our API handler conventions.
```

```text
Before implementing this, read the relevant docs/standards entries and follow them.
```

Standards are stored as small markdown files in `docs/standards/` and indexed in `docs/standards/index.yml`.

### 3. Plan from the spec

For multi-step work, ask for a plan after the spec exists.

Example prompt:

```text
Use ce-plan to plan the implementation from docs/specs/mfa.md.
```

Plans are execution scaffolding. They can live in `docs/plans/`, but they are not the long-term source of truth.

### 4. Implement the work

Ask the agent to execute with `ce-work`, or make a direct implementation request.

During implementation, the agent should:

- read relevant specs
- read relevant standards
- follow existing code patterns
- surface ambiguities instead of hiding assumptions
- log durable decisions when choices are made

### 5. Log decisions as they happen

When ambiguity is resolved, ask the agent to use `ce-decision-log`.

Example prompts:

```text
Use ce-decision-log to record that MFA recovery codes are single-use.
```

```text
Log the decision that mobile offline sync is eventually consistent.
```

Decision records live in `docs/decisions/` and are indexed in `docs/decisions/index.yml`.

Do not edit old decision records to change history. Create a new decision that supersedes the old one.

### 6. Review specs before shipping

Before opening a PR, ask the agent to use `ce-spec-review`.

Example prompts:

```text
Use ce-spec-review to check this branch for spec drift.
```

```text
Before PR, verify changed behavior is reflected in docs/specs.
```

The review should catch:

- code that no longer matches the spec
- specs that need updating because behavior changed
- decisions that were made but not logged
- standards that were not followed

### 7. Capture corrections as learnings

When you correct an agent and the correction should matter in the future, the agent should use `ce-retrospective`.

Example prompts:

```text
Use ce-retrospective to save that learning for this repo.
```

```text
Remember globally that I prefer replacing existing AGENTS.md files during setup.
```

Repo-specific learnings live in `docs/learnings/`.

Global learnings live in `~/.agents/learnings/`.

The agent should ask before promoting an ambiguous learning to global scope.

## Common Workflows

### New Feature

```text
Use ce-spec-create to turn this feature request into a spec.
Use ce-plan to plan the implementation from that spec.
Use ce-work to implement it.
Use ce-decision-log for any choices we make during build.
Use ce-spec-review before opening the PR.
Use ce-commit-push-pr to commit, push, and create the PR.
```

### Existing Feature Discovery

```text
Analyze the current billing flow and use ce-spec-create to document how it works today.
Use ce-discover-standards to capture any repeated billing conventions you find.
```

### Correction During a Session

```text
Actually, that behavior should be parent-controlled, not child-controlled.
Use ce-retrospective if this should affect future agent behavior, and use ce-decision-log if it changes the product contract.
```

### PR Readiness

```text
Run ce-spec-review and ce-code-review, then update any stale specs or missing decisions before creating the PR.
```

## Installer Options

```bash
scripts/install.sh --repo .                      # install into current repo
scripts/install.sh --repo ~/Code/app --force     # overwrite repo-local AGENTS.md and indexes
scripts/install.sh --skip-repo                   # install global skills only
scripts/install.sh --skip-skills --repo ~/Code/app
scripts/install.sh --skills-dir ~/.codex/skills  # alternate global skill dir
scripts/install.sh --learnings-dir ~/.agents/learnings
```

Environment overrides:

```bash
AGENTIC_WORKFLOW_SKILLS_DIR=~/.codex/skills scripts/install.sh --repo .
AGENTIC_WORKFLOW_LEARNINGS_DIR=~/.agents/learnings scripts/install.sh --repo .
```

## Included Skills

- `ce-spec-create`: create or update living feature specs in `docs/specs/`
- `ce-spec-review`: catch drift between implementation and specs before shipping
- `ce-decision-log`: record immutable decisions in `docs/decisions/`
- `ce-discover-standards`: extract repeated codebase conventions into `docs/standards/`
- `ce-retrospective`: capture correction-driven learnings in `docs/learnings/` or `~/.agents/learnings/`

The repo also carries the broader Compound Engineering skill set copied into `skills/`.

## Maintenance

When changing this workflow:

- update `AGENTS.md` if agent routing changes
- update or add skills under `skills/`
- update `scripts/install.sh` if repo-local structure changes
- update this README so humans know how to use the system
- run `bash -n scripts/install.sh`
- run an installer smoke test against a temporary repo
