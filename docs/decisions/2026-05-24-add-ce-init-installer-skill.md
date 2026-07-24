---
title: Add ce-init installer skill
date: 2026-05-24
status: active
tags:
  - workflow
  - installer
  - skills
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add ce-init Installer Skill

## Context

Users need a portable way to initialize augmented-workflow inside any repo after the global skills are available. The initialization should work across agent runtimes and avoid silently overwriting existing repo guidance files.

## Decision

Add `ce-init` with bundled `scripts/install.sh`, `artifacts/AGENTS.md`, and `artifacts/CLAUDE.md`. The installer writes repo-local workflow files, prompts before replacing existing `AGENTS.md` or `CLAUDE.md`, and prints next steps.

`CLAUDE.md` contains `@AGENTS.md` so Claude Code can delegate to the canonical agent instructions.

## Consequences

Repo setup becomes an invokable skill. Existing agent guidance files are protected by confirmation prompts. The workflow can be bootstrapped from any repo without requiring users to remember the directory structure.

## Alternatives Considered

- Use only the root `scripts/install.sh`: works from a clone, but is less convenient once skills are globally installed.
- Always overwrite guidance files: simpler, but risks destroying existing repo-specific instructions.

## Links

- `skills/ce-init/SKILL.md`
- `skills/ce-init/scripts/install.sh`
