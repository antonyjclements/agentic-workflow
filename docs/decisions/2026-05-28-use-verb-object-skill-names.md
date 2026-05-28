---
title: Use verb-object skill names
date: 2026-05-28
status: active
tags:
  - workflow
  - skills
  - naming
---

# Use Verb-Object Skill Names

## Context

After renaming the workflow namespace to `aw-*`, bundled skill names still mixed action-first and noun-first forms such as `aw-import-prd` and `aw-spec-create`. That made command discovery less predictable.

## Decision

Use `aw-<verb>-<object>` as the default naming convention for multi-word Agentic Workflow skills.

Single-word command verbs remain acceptable when the action is clear, such as `aw-plan`, `aw-work`, `aw-debug`, `aw-commit`, and `aw-brainstorm`.

Rename noun-first or legacy-brand names to action-first equivalents:

- `aw-code-review` -> `aw-review-code`
- `aw-doc-review` -> `aw-review-doc`
- `aw-spec-create` -> `aw-create-spec`
- `aw-spec-review` -> `aw-review-spec`
- `aw-decision-log` -> `aw-log-decision`
- `aw-decisions-refresh` -> `aw-refresh-decisions`
- `aw-slack-research` -> `aw-research-slack`
- `aw-compound` -> `aw-capture-solution`
- `aw-compound-refresh` -> `aw-refresh-solutions`
- `aw-retrospective` -> `aw-record-retrospective`
- `aw-worktree` -> `aw-create-worktree`

## Consequences

- Users and agents can scan skill names as commands.
- Installer cleanup must remove old `ce-*` names and obsolete `aw-*` names from existing skill directories.
- Historical decision records may still mention the names that existed when those decisions were made.
