---
title: Remove the brainstorm index and validate remaining docs registries in CI
date: 2026-07-02
status: active
tags:
  - workflow
  - indexes
  - testing
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Remove the brainstorm index and validate remaining docs registries in CI

## Context

Indexes are derived state: they add a lookup surface but carry maintenance and drift cost. The sessions index was removed on this basis (see docs/decisions/2026-07-02-session-logs-self-describing-and-hook-independent.md). Brainstorm artifacts have the same shape — transient ideation files that are expected to graduate into living specs, in a small directory that agents can glob directly. A durable index of pre-spec exploration was near-dead weight. The remaining indexes (PRDs, features, standards, decisions, learnings) do earn their keep as retrieval layers, but nothing verified they stayed truthful.

## Decision

1. **Remove `docs/brainstorms/index.yml`.** The installer no longer creates it; brainstorm files are self-describing via their own frontmatter. Existing installs may keep a stale one harmlessly — nothing reads it.
2. **Indexes that remain must be mechanically validated.** `scripts/test-install.sh` now validates every `docs/**/index.yml` in this repo and in each test-installed target: the YAML parses, every indexed `path`/`spec` reference exists, and every `docs/features/*/spec.md` has a features index entry.

The policy this establishes: a derived index must either be validated in CI or removed.

## Consequences

- One less registry for agents and installs to maintain; `docs/brainstorms/` behaves like `docs/sessions/`.
- Index drift in this repo now fails the test suite instead of silently misleading agents. On its first run the validator flagged the features index — a false positive caused by the features schema using `spec:` rather than `path:`, which the validator now accepts — demonstrating both the check and the need for it.
- Target-repo installs are validated post-install, guarding installer regressions.

## Alternatives Considered

- Keep the brainstorm index for symmetry with other registries: symmetry is not a use case; nothing consumed it.
- Validate indexes with a standalone script rather than inside `test-install.sh`: a separate entry point would not run by default; the test suite is the repo's single prescribed check.

## Links

- scripts/test-install.sh (`validate_docs_indexes`)
- docs/decisions/2026-07-02-session-logs-self-describing-and-hook-independent.md
