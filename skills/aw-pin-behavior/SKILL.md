---
name: aw-pin-behavior
description: Create a behavior pin: a characterization harness and manifest that prove current behavior on the old tree before implementation changes.
argument-hint: "[feature key, subject path, or plan/spec path]"
---

# Pin Behavior

Create an equivalence oracle before changing legacy or unclear behavior.

## Inputs

`$ARGUMENTS` may be a feature key, source path, plan/spec path, or short subject
description. Resolve the subject conservatively from local context. If the
subject cannot be identified, ask before writing tests.

## Phase 1: Resolve Subject and Base

1. Read `docs/workflow/config.yml` and the relevant spec/plan/code.
2. Identify the behavior boundary to pin: public command, module function, file
   transform, CLI output, or other observable surface.
3. Set `base` to the current `HEAD` before implementation work starts unless the
   user provided a more specific old ref.
4. Choose `docs/features/<feature>/behavior-pin.yml` for the manifest.

## Phase 2: Study Existing Behavior

Read the old code and recent git history for the subject. Bug-fix commits are
evidence of behavior someone cared about. Pin observable behavior only:
inputs/outputs, error paths, side effects, generated files, or CLI status.

Do not pin internals. Internals are what the next implementation may replace.

## Phase 3: Author the Oracle

Create a deterministic harness near existing tests when there is a convention;
otherwise use `test/pin/<feature>.pin.js` for dependency-free Node harnesses.

Rules:

- Pin behavior as it is, including bugs.
- Keep the oracle separate from the subject.
- Add manifest `support` entries for current-tree files needed to run the
  oracle in the old tree, such as package scripts, helpers, configs, or fixtures.
- Avoid network, time, random, or environment-sensitive assertions unless they
  are controlled by the harness.

## Phase 4: Prove Old Green

Before returning the manifest, run the harness against the old tree through:

```sh
node .scripts/aw-gate.js pin run
```

If `pin.enabled` is false while authoring, temporarily run an equivalent
worktree check manually or ask the user to enable pinning. A pin that has never
passed on old code is not a pin.

## Manifest Shape

Use only the workflow YAML subset:

```yaml
base: <old-ref>
harness: node test/pin/<feature>.pin.js
setup: ""
subject:
  - <path-being-judged>
oracle:
  - test/pin/<feature>.pin.js
support:
  - <optional-helper-or-config>
created: YYYY-MM-DD
```

## Handoff

Return the manifest path, the pinned subject, the old-green evidence, and any
known limits. Never edit oracle/support files and the subject they judge in the
same commit; `node .scripts/aw-gate.js pin check` enforces that ordering.
