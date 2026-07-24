---
title: Add deterministic spec traceability checks
date: 2026-07-16
status: active
tags:
  - workflow
  - enforcement
  - specs
related_specs:
  - docs/features/augmented-workflow/spec.md
supersedes: []
---

# Add deterministic spec traceability checks

## Context

Augmented Workflow uses living specs as durable product intent, but there was no
deterministic way to verify that requirements, tests, and behavior entry points
remained linked. Agents could mention traceability in summaries, but those claims
were not machine-checkable and could not run in a hook or CI.

The existing `.scripts/aw-gate.js` helper is dependency-free CommonJS, installed
as a mirrored artifact, and already owns deterministic workflow enforcement.

## Decision

Add spec traceability to `aw-gate.js` as opt-in subcommands:

- `trace` resolves `@spec` anchors, fails dangling anchors and untested
  requirements, warns on missing code anchors by default, and can check test/spec
  coupling with `--base`.
- `trace-annotate` is the deterministic policy boundary for skills. Skills always
  call the helper when they would add requirement IDs or anchors; the helper
  no-ops when `trace.enabled` is false and performs explicit line-targeted edits
  when enabled.
- `aw-work` batches subagent annotation intents under `.aw/tmp/` so labels are
  merged and applied once. Safe batch files are cleaned when tracing is disabled
  and can be deleted on enabled success.
- `trace` is not a freshness gate and does not use `record`; it runs directly at
  the enforcement point alongside `check`.

Use git pathspecs and `git ls-files` instead of a glob library, matching existing
gate configuration. Keep the implementation in dependency-free CommonJS rather
than creating a package or TypeScript build step.

Traceability stays disabled by default through `trace.enabled: false`.

## Consequences

- Repos that opt in get a cheap deterministic check for missing or stale
  requirement/test links.
- Non-adopters keep existing behavior: `trace` exits 0 and `trace-annotate`
  skips writes.
- Skills avoid probabilistic config-policy decisions; they pass through the
  deterministic helper instead.
- Traceability remains accountability, not quality assurance. Anchors prove a
  link was claimed, and coupling proves a change was coordinated, but semantic
  correctness still requires review.

## Alternatives Considered

- **Standalone TypeScript package.** Rejected: it would add dependencies and a
  build/test stack to a helper that is intentionally portable and dependency-free.
- **Let skills decide whether to annotate.** Rejected: LLMs are probabilistic;
  config policy belongs in deterministic code.
- **Model trace as a freshness gate.** Rejected: `trace` is already deterministic
  and can run directly in CI or hooks without a recorded stamp.
- **AST parsing for code anchors.** Rejected until false positives prove regex and
  explicit line-targeted annotation are insufficient.

## Links

- docs/features/augmented-workflow/spec.md
- docs/workflow/gates.md
- docs/workflow/README.md
- docs/standards/traceability.md
