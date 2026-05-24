# Agentic Workflow

Portable agent workflow instructions and Compound Engineering skills.

## Contents

- `AGENTS.md` - copy this into a repository root to guide coding agents and route work through the Compound Engineering workflow.
- `skills/` - Compound Engineering skill definitions and supporting reference files.
- `skills/ce-spec-create/` - workflow for creating or updating living feature specs in `docs/specs/`.
- `skills/ce-spec-review/` - workflow for catching drift between shipped behavior and living specs.
- `skills/ce-decision-log/` - workflow for immutable decision records in `docs/decisions/`.
- `skills/ce-discover-standards/` - workflow for extracting repeated codebase conventions into `docs/standards/`.
- `skills/ce-retrospective/` - workflow for capturing correction-driven learnings in `docs/learnings/` or `~/.agents/learnings/`.
- `scripts/install.sh` - installer for global skills plus repo-local workflow files.

## Install

From a clone of this repo:

```bash
scripts/install.sh --repo /path/to/target/repo
```

Defaults:

- Installs all skills globally to `~/.agents/skills`.
- Copies `AGENTS.md` into the target repo.
- Creates `docs/specs/index.yml`, `docs/standards/index.yml`, `docs/decisions/index.yml`, and `docs/learnings/index.yml` in the target repo if missing.
- Creates `~/.agents/learnings/index.yml` if missing.

Options:

```bash
scripts/install.sh --repo .                      # install into current repo
scripts/install.sh --repo ~/Code/app --force     # overwrite repo-local files
scripts/install.sh --skip-repo                   # install global skills only
scripts/install.sh --skip-skills --repo ~/Code/app
scripts/install.sh --skills-dir ~/.codex/skills  # alternate global skill dir
scripts/install.sh --learnings-dir ~/.agents/learnings
```

Existing repo-local files are preserved unless `--force` is passed.

## Spec-Driven Workflow Convention

The included `AGENTS.md` encodes three principles from spec-driven development:

- Living specs: feature intent and current behavior live in `docs/specs/`, indexed by `docs/specs/index.yml`.
- Encoded standards: project rules live in `docs/standards/`, indexed by `docs/standards/index.yml`.
- Feedback loop: decisions live in `docs/decisions/`; correction-driven learnings live in `docs/learnings/` or `~/.agents/learnings/`.

The short rule is: intent stays alive, plans expire, decisions are immutable.

## Standards Registry Convention

The included `AGENTS.md` and skills understand a repository standards registry at:

```text
docs/standards/index.yml
```

When present, agents should use that index to locate the relevant small markdown standards for the files or domain being changed, then enforce those standards during planning, implementation, review, testing, and documentation.

## Retrospective Learning Convention

The included `AGENTS.md` and `ce-retrospective` skill support correction-driven learnings:

- Repo-specific learnings live in `docs/learnings/` with `docs/learnings/index.yml`.
- Global learnings live in `~/.agents/learnings/` with `~/.agents/learnings/index.yml`.

Use this when a user correction should change future agent behavior rather than only the current task.
