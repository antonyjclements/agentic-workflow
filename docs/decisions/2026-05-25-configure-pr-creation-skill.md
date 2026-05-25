---
title: Configure PR creation skill per repo
date: 2026-05-25
status: active
tags:
  - workflow
  - pull-requests
  - configuration
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Configure PR creation skill per repo

## Context

Some repositories need pull requests created through organization-specific workflows that enforce enterprise templates, metadata, reviewers, checks, or internal conventions.

## Decision

Add `pull_request.creation.skill` to `docs/workflow/config.yml`. When set, `ce-commit-push-pr` delegates PR creation to that configured skill. When blank, `ce-commit-push-pr` uses its built-in GitHub CLI PR creation flow.

The delegated skill must preserve the workflow contract by returning the PR URL and allowing configured post-PR CI monitoring to run afterward.

## Consequences

- Repos with enterprise PR standards can plug in their own skill without replacing the rest of the workflow.
- Portable repos continue to work with the default PR creation behavior.
- CI monitoring remains a post-PR step regardless of which skill created the PR.
