---
title: Configure commit message format per repo
date: 2026-05-25
status: active
tags:
  - workflow
  - git
  - configuration
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Configure commit message format per repo

## Context

Some repositories require commit messages to follow a specific format, such as scoped conventional commits like `docs(readme): update usage guide`, while others need enterprise-specific commit tooling.

## Decision

Add `git.commit` to `docs/workflow/config.yml`. When `git.commit.skill` is set, commit workflows delegate commit creation or message generation to that configured skill. When blank, the built-in commit workflows follow `git.commit.template`, `scope_required`, `allowed_types`, and `examples` before falling back to repo instructions and recent commit history.

## Consequences

- Repos can enforce local commit conventions without rewriting the core commit skills.
- Enterprise environments can plug in a custom commit skill.
- Portable repos continue to work with the default commit-message behavior.
