---
title: Use version file and remote installer source
date: 2026-06-07
status: active
tags:
  - workflow
  - installer
  - updates
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Use version file and remote installer source

## Context

Augmented Workflow needs to be updateable in repos that have already installed the skills and `AGENTS.md`. Users should not need a local clone of `augmented-workflow` just to refresh global skills or repo-local agent instructions. Version markers also need one source of truth so installer output, migration output, and installed `AGENTS.md` do not drift.

## Decision

Add root `aw-version.txt` as the single version source for installer-owned version markers. Installed `AGENTS.md` carries the same version stamp, and installer/migration scripts read `aw-version.txt` when running from a full source tree.

Make the installer remote-aware:

- `--remote` fetches the default GitHub archive source.
- `--source-url URL` fetches a pinned branch, tag, release archive, local archive, or internal mirror.
- `AUGMENTED_WORKFLOW_SOURCE_URL` can provide the remote source without a command-line URL.

After fetching, the installer uses the remote source's `skills/`, `skills/aw-init/artifacts/`, and `aw-version.txt` as if it were running from a local clone.

## Consequences

- Existing installs can refresh skills and agent instructions without cloning the repo.
- Teams can pin updates to tags or internal mirrors.
- Version stamps are less likely to drift across installer-owned files.
