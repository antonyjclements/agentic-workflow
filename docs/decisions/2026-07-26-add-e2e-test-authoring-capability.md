---
title: Add a configurable end-to-end test authoring capability
date: 2026-07-26
status: active
tags:
  - workflow
  - testing
  - configuration
related_specs:
  - docs/features/augmented-workflow/spec.md
---

# Add a Configurable End-to-End Test Authoring Capability

## Context

Teams want agents to author end-to-end tests as part of implementation, but every
e2e framework is stack-specific: Playwright and TypeScript for one repo, Cypress,
XCUITest, or an in-house harness for another. Bundling any one of them would
break the workflow's portability promise, and the tests themselves are often
onboarded into an external test-management platform such as Jira Xray, which is
enterprise-specific and carries its own credentials.

Three existing extension points were considered:

- `workflow.steps.<step>.skill` replaces a whole lifecycle step and carries an
  artifact handoff contract. E2E authoring produces no artifact the next step
  consumes, and it does not apply to most changes, so a step slot would wrongly
  imply every task passes through it.
- `workflow.design.hooks.<hook>.skill` is an additive hook family for one team
  participating at five lifecycle checkpoints. E2E authoring is one capability
  invoked at essentially one place, so a hook family would be four empty slots.
- `workflow.auxiliary.<key>.skill` plus a top-level capability block is the shape
  already used by `pin_behavior`/`pin`: a stack-specific capability, routed
  through an auxiliary key, enabled and scoped by its own block, invoked by
  `aw-work` at a documented checkpoint conditioned on config.

## Decision

Follow the `pin_behavior` precedent. Add `workflow.auxiliary.e2e_tests.skill`
(blank by default, no bundled skill) and a disabled-by-default top-level `e2e`
block with `enabled`, `trigger_paths`, `test_paths`, and `run_scope`.

E2E authoring hangs off the implementation test policy rather than sitting beside
it, because e2e specs are the automation of user-facing acceptance criteria. It
is invoked at four points: `aw-work` Phase 1 after acceptance criteria are
mapped and before implementation edits, `aw-work` Phase 3 for a `run_scope`-bound
local run, `aw-check-workflow-compliance` as a coverage finding, and `trace` as a
deterministic check over requirements that opted in.

A requirement opts in with an exact `[e2e]` suffix on its heading, applied at
spec time by a human. The marker is the mechanism that makes the stronger
property checkable: `trace` resolves e2e membership by matching an anchor's file
against `e2e.test_paths`, so a marked requirement must carry a `@spec` anchor
inside the e2e suite, not merely somewhere in the test tree. The rule for what
earns a marker lives in `docs/standards/e2e-coverage.md`, deliberately outside
this workflow contract.

`e2e.trigger_paths` uses git pathspec semantics, matching `gates.checks.<name>.paths`
and `trace.*_paths`. The `<noun>_paths` name follows the config's existing naming
convention for pathspec lists; `applies_to` was rejected because it already means
a logical domain scope in org-knowledge entry frontmatter.

Two things are deliberately excluded:

- **No freshness gate.** `gates.checks` exists for LLM-judgment steps that cannot
  run in CI. An e2e suite is a deterministic test run, so CI owns enforcement —
  the same reasoning that keeps `trace` out of `gates.checks`.
- **No command field.** No shell-command string exists anywhere in `config.yml`,
  and `pin` deliberately restricts execution to `node <repo-relative .js path>`.
  The runner is a property of the toolchain, so the configured skill reads it
  from the project's own manifest. Config declares policy, not commands.

The contract names the capability, not the tool: skills accept acceptance
criteria, changed paths, and `e2e.*` config, and return the spec files written,
the run command, and which acceptance criterion each spec covers.

## Consequences

Swapping e2e frameworks is a config change rather than a workflow change, and
repos that do not run e2e tests carry four inert config keys and no behavior.

Tool-specific conventions — selector strategy, fixtures, wait policy, auth-state
reuse, external test-management identifiers — live in `docs/standards/` where
`aw-work` and `aw-review` already load them, keeping framework detail out of the
workflow core. Skills that onboard tests into Xray, TestRail, or Zephyr own that
integration and its credentials; the workflow does not model external test
management.

E2E specs are picked up by the default `trace.test_paths` and their `@spec`
anchors satisfy a requirement's test-anchor obligation. Anchors record no test
layer, so requirement-to-e2e linkage is proved through pathspec membership
instead: `trace` scans `e2e.test_paths` separately from `trace.test_paths` and
fails a marked requirement with `missing-e2e-coverage` when none of its anchors
land in an e2e file. Unmarked requirements are unaffected, and a repo that leaves
`e2e.enabled: false` sees no change at all.

Making `trace` the enforcement point has two costs, both accepted. Enabling the
capability puts the existing e2e suite under the rest of the trace contract, so
retired IDs in that suite become `dangling-test-ref` errors — `trace --suggest-e2e`
reports them as `would-become-dangling` before the flip. And anchors found only
through `e2e.test_paths` had to be exempted from `uncoupled-test-change`:
marking a requirement is a spec-only commit and adding its test is a test-only
commit, so coupling both would make the prescribed sequence unsatisfiable.
`aw-check-workflow-compliance` keeps the process-evidence half — whether an
in-scope change shipped with coverage or a stated exception — which is judgment
rather than a deterministic check.

External test-management keys must stay out of `@spec` anchors, because the
anchor pattern would parse a Jira or Xray key as a requirement ID.
