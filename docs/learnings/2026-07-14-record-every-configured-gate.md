---
title: Record every configured gate before checking freshness
scope: repo
created: 2026-07-14
trigger: dead-end
status: tentative
evidence-count: 1
unconfirmed-runs: 0
derived-from:
  - docs/sessions/2026-07-03-enforcement-gates-telemetry-org-knowledge.md
tags:
  - workflow
  - enforcement
  - testing
---

# Record Every Configured Gate Before Checking Freshness

## Lesson

`aw-gate.js check` fails when any enabled gate is missing or stale, even if the gate under direct test was just recorded. Tests and setup flows must record the full configured gate set before expecting a freshness check to pass.

## Applies When

- Writing or updating gate functional tests.
- Enabling a new gate in `docs/workflow/config.yml`.
- Debugging a pre-push or CI failure from `.scripts/aw-gate.js check`.

## Do Instead

- Inspect `gates.checks` and record each configured event needed for the scenario.
- When adding a new default gate, update tests that assert the whole gate set is fresh.

## Evidence

- The first gate functional test recorded only `review`, but the default config enforced three gates, so `check` still failed until every configured gate was recorded. (docs/sessions/2026-07-03-enforcement-gates-telemetry-org-knowledge.md)
