# Agentic Workflow

Portable agent workflow instructions and Compound Engineering skills.

## Contents

- `AGENTS.md` - copy this into a repository root to guide coding agents and route work through the Compound Engineering workflow.
- `skills/` - Compound Engineering skill definitions and supporting reference files.
- `skills/ce-discover-standards/` - workflow for extracting repeated codebase conventions into `docs/standards/`.
- `skills/ce-retrospective/` - workflow for capturing correction-driven learnings in `docs/learnings/` or `~/.agents/learnings/`.

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
