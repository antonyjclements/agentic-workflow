---
title: Behavior Pinning
tags:
  - testing
  - workflow
  - characterization
file-globs:
  - "docs/features/*/behavior-pin.yml"
  - "test/pin/**"
  - ".scripts/aw-gate.js"
---

# Behavior Pinning

Rules for opt-in equivalence checks between an old implementation and a new one.

## Equivalence, Not Correctness

A green behavior pin proves the new implementation behaves like the old one. It
does not prove either implementation is correct. Pinning bug-for-bug is intended:
fix behavior in a separate change after equivalence is proven.

## Two-Sided Runs

Every pin runs the same oracle against two trees:

- old tree: the manifest's `base`
- new tree: the current checkout

The old run must pass first. If it fails, the oracle does not characterize real
behavior and the verdict is `pin-not-characterizing`. If old passes and new
fails, the verdict is `equivalence-broken`.

## Manifests

Behavior pin manifests live at:

```text
docs/features/<feature>/behavior-pin.yml
```

Supported keys stay within the workflow YAML subset:

```yaml
base: c338665
harness: node test/pin/example.pin.js
setup: npm ci
subject:
  - .scripts/aw-gate.js
oracle:
  - test/pin/example.pin.js
support:
  - package.json
```

`support` is optional and is for current-tree files needed to run the oracle in
the old tree, such as package scripts, test config, helpers, or fixtures.
`subject` must not overlap `oracle` or `support`.

## Ordering Rule

Do not edit a manifest or oracle/support files and the subject they judge in the
same commit. `node .scripts/aw-gate.js pin check` enforces this by checking each
commit in the range. If a coupled change is intentional, add a commit trailer:

```text
Pin-Override: <reason>
```

Use overrides sparingly. A pin loses value when the implementation and its
oracle are adjusted together.

## Runtime Surface

`pin run` executes the manifest's `setup` and `harness` strings with
`shell: true`. This is not a security sandbox. Keep pinning opt-in, review
manifest command changes like code, and run slow pins in CI rather than pre-push.
