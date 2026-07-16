---
title: Add behavior pinning for characterization-first implementation
date: 2026-07-16
status: active
tags:
  - workflow
  - testing
  - characterization
  - gates
---

# Add behavior pinning for characterization-first implementation

## Context

`workflow.implementation.test_policy` supports `characterization-first`, but the
workflow had no deterministic mechanism that proved a new implementation still
matched the old one. Existing gates, trace checks, and workflow breadcrumbs prove
that process artifacts were recorded; they do not prove behavioral equivalence.

## Decision

Add behavior pins: committed manifests at `docs/features/*/behavior-pin.yml` that
declare an old `base`, a judged `subject`, oracle files, optional support files,
and a harness command. `node .scripts/aw-gate.js pin run` checks each manifest by
running the same current-tree oracle against both the old tree and current
checkout. The old run must pass first.

Failure classes stay distinct:

- `pin-not-characterizing`: the oracle failed on old behavior, so it is not a
  valid characterization.
- `equivalence-broken`: the oracle passed on old behavior and failed on new
  behavior, so the implementation changed behavior.

Add `node .scripts/aw-gate.js pin check` to enforce that one commit does not
change both a pin's subject and its oracle/support files. Intentional coupled
changes require a `Pin-Override:` trailer.

## Consequences

Behavior pinning is quality assurance, not just workflow accountability. It also
changes `.scripts/aw-gate.js` from a checker that only shells to git into a
runner that executes configured `setup` and `harness` strings with `shell: true`.
That is an execution surface, not a sandbox. The mitigation is opt-in config,
code review of manifests, git-ignored temporary worktrees under `.aw/pin/`, and
running slow or risky pins in CI rather than pre-push.

A green pin proves equivalence, not correctness. It can preserve bugs by design;
intentional behavior fixes should happen after equivalence is established.

## Dogfood

This repo enables `pin.enabled: true` and carries a real pin for disabled trace
JSON behavior in `.scripts/aw-gate.js`. The pin's base is `c338665`, and the
oracle lives at `test/pin/aw-gate-trace-disabled.pin.js`.
