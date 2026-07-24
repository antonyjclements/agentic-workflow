---
title: Maintain a version-anchored CHANGELOG enforced by test-install
date: 2026-07-03
status: active
tags:
  - workflow
  - versioning
  - documentation
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Maintain a version-anchored CHANGELOG enforced by test-install

## Context

Augmented Workflow is a distributed, installable tool: consumers install a version
(`aw-version.txt` / `.augmented-workflow-version`) and later upgrade via
`upgrade.sh`, which runs config migrations. But the version marker had stopped
tracking releases — enforcement gates, telemetry, org knowledge, and governance
(a wave of config-changing, migration-affecting work) all shipped under `0.5.0`.
Two installs of "0.5.0" could behave very differently, and there was no curated,
consumer-facing answer to "I'm on version X, current is Y — what changed and do I
need to migrate?" The decision log captures *why* changes were made, but not a
release-anchored *what changed for consumers*.

## Decision

Maintain a `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com/)
format, anchored to `aw-version.txt`, and restore version discipline:

- **Bump the version on user-visible releases** and add a matching changelog
  entry in the same change. Additive/opt-in changes are minor bumps; breaking
  config or installer changes are major and flagged in the entry.
- **Scope the changelog to user-visible changes** — new/changed config keys,
  installer flags, skills, behavior, and migrations (with an explicit
  "run `upgrade.sh`" note). It links to `docs/decisions/` for rationale rather
  than duplicating it, and does not mirror granular git history.
- **Enforce it like every other invariant in this repo.** `scripts/test-install.sh`
  fails when the version in `aw-version.txt` has no `CHANGELOG.md` entry, so a bump
  without a changelog entry cannot land — the same drift-guard discipline already
  applied to installed copies and version markers.

The backlog since `0.5.0` was released as `0.6.0`.

## Consequences

- Consumers get a curated upgrade signal; the version marker is meaningful again.
- A version bump now requires a changelog entry, a small standing cost paid at
  release time (curated from PR titles and decisions, not hand-logged per commit).
- The changelog complements, not replaces, the decision log (why), the living
  spec (current behavior), and the migration table in `docs/workflow/README.md`.

## Alternatives Considered

- **No changelog; rely on decisions + wiki + git history.** Rejected: none of
  those is a version-anchored, consumer-facing "what changed between releases,"
  which a tool with an install/upgrade/migration path needs.
- **A running, hand-maintained log.** Rejected: it duplicates git and drifts —
  exactly the stale artifact the repo's Artifact Discipline warns against. Curated
  at release time and enforced by a check instead.
- **Changelog without version discipline.** Rejected: entries need version
  anchors to be useful; the real gap was that releases stopped bumping the marker.

## Links

- CHANGELOG.md
- docs/features/augmented-workflow/spec.md
- docs/workflow/README.md (Legacy Fields / migration table)
