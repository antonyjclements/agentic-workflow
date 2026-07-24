---
title: Curate bundled skills and enforce README updates
date: 2026-05-24
status: active
tags:
  - workflow
  - skills
  - documentation
---

# Curate bundled skills and enforce README updates

## Context

The augmented-workflow repository started from a broader Compound Engineering skill set. Some inherited skills and references are not appropriate for this portable workflow, and stale documentation creates the same drift the workflow is meant to prevent.

## Decision

Keep the bundled skill set curated for augmented-workflow. Remove skills that are not part of the intended workflow, starting with `lfg` and broader specialty/plugin-maintenance skills, and update inherited repository references to point at `antonyjclements/augmented-workflow`.

Keep `ce-doc-review` in the bare-bones set because plan review is part of the core flow. After `ce-plan` creates a plan, run `ce-doc-review` before human review, ticket creation, or implementation.

Keep `ce-compound` and `ce-compound-refresh` because compounding knowledge is part of the feedback loop. `ce-compound` captures reusable solved-problem knowledge, while `ce-compound-refresh` keeps accumulated solution docs current.

Keep `ce-slack-research`, with optional `docs/workflow/config.yml` routing for enterprise-specific Slack skills.

Make README maintenance an explicit shipping gate. Agents must update `README.md` when setup, commands, configuration, repo structure, architecture, or workflow behavior changes.

## Consequences

- The installer removes deprecated global skills during skill install.
- README drift is treated as a workflow issue before commit or PR.
- The repo remains portable without stale upstream branding or unrelated automation entrypoints.
