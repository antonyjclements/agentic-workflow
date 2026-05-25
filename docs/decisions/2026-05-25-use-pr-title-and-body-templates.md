---
title: Use PR title and body templates
date: 2026-05-25
status: active
tags:
  - workflow
  - pull-requests
  - configuration
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes:
  - docs/decisions/2026-05-25-configure-pr-creation-skill.md
---

# Use PR title and body templates

## Context

Some repositories need pull request text to follow an enterprise standard, but replacing the PR creation skill is heavier than necessary when only the title and body need to be shaped.

## Decision

Use `pull_request.template.title` and `pull_request.template.body` in `docs/workflow/config.yml` instead of a custom PR creation skill hook. Each value points to a markdown template file by GitHub URL, raw GitHub URL, `file://` URL, absolute path, or repo-relative path.

Blank template values keep the default generated title or body for that part. PR creation still uses the normal `ce-commit-push-pr` flow.

## Consequences

- Repos can apply enterprise PR text standards without replacing PR creation behavior.
- PR creation remains predictable and still returns a PR URL for post-PR CI monitoring.
- Template loading failures can fall back to generated PR text instead of blocking PR creation.
