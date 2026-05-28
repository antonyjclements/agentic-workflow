---
title: Keep aw-init repo-local
date: 2026-05-28
status: active
tags:
  - workflow
  - installer
  - skills
---

# Keep aw-init Repo-Local

## Context

`aw-init` had accumulated two responsibilities: scaffolding a target repository and managing global skill installation/removal for agent runtimes. That made a repo initializer responsible for user-level skill state outside the target repo.

## Decision

Limit `aw-init` to target-repo setup:

- `AGENTS.md`
- `CLAUDE.md`
- `.agentic-workflow-version`
- `docs/product/prds/index.yml`
- `docs/product/prds/template.md`
- `docs/brainstorms/index.yml`
- `docs/features/index.yml`
- `docs/standards/index.yml`
- `docs/decisions/index.yml`
- `docs/learnings/index.yml`
- `docs/workflow/config.yml`

Remove global skill installation, deprecated skill removal, runtime skill symlink creation, global learnings directory creation, and related installer flags from `aw-init`.

## Consequences

- Skill installation is owned by the user's agent runtime or skill manager, not by repo initialization.
- `aw-init` is safer to run because it only writes inside the target repository.
- Existing global `ce-*` or obsolete `aw-*` skills are not cleaned up by `aw-init`.
