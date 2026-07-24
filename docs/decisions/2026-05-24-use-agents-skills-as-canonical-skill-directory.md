---
title: Use ~/.agents/skills as canonical skill directory
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

# Use ~/.agents/skills as canonical skill directory

## Context

The workflow should work across Codex, Claude Code, Codeium, and Windsurf without requiring separate copies of the same skills. The config files store skill names rather than filesystem paths, so each runtime needs a predictable place to discover installed skills.

## Decision

Install skills into `~/.agents/skills` as the canonical global directory. During install, create symlinks from `~/.claude/skills`, `~/.codeium/skills`, and `~/.windsurf/skills` to `~/.agents/skills` when those paths do not already exist. Preserve existing non-symlink runtime skill directories.

## Consequences

Skills can be updated once and exposed to multiple agents. Existing runtime-specific skill directories are not overwritten, so users with custom setups can opt into symlinks manually or use `--force` only for existing symlinks.

## Alternatives Considered

- Copy skills separately into every runtime directory: simpler lookup, but duplicates state and can drift.
- Require users to provide full skill paths in config: explicit, but less portable and harder to share across repos.
- Replace existing runtime skill directories: convenient, but risks deleting or hiding user-managed skills.

## Links

- `scripts/install.sh`
- `docs/features/augmented-workflow/spec.md`
