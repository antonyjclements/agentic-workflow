---
title: Add enforcement gates, telemetry, and org-shared knowledge to the operating model
date: 2026-07-03
status: processed
tags:
  - workflow
  - enforcement
  - telemetry
  - knowledge
  - installer
---

## What Was Attempted

- Assessed the operating model for enterprise fit, then implemented the three
  enterprise gaps it surfaced: deterministic enforcement, effectiveness
  telemetry, and a cross-repo knowledge tier.
- Removed the byte-identical duplicate `operating_model.md` (root copy of the
  field guide) and its drift guard.
- Built one dependency-free Node helper, `.scripts/aw-gate.js` (installed via
  `aw-init --with-gates`), with `record`, `check`, and `org-sync` subcommands.
- Added a hybrid gate `mode`: `age` (wall-clock) and `commit` (path-scoped
  change since the recorded commit), plus `commit-and-age`.

## What Worked

- Reusing one CLI for all three capabilities kept the surface small: the same
  `record` call stamps the git-ignored freshness marker and appends the opt-in
  telemetry event, and `org-sync` shares the same git plumbing.
- Editing the drift-guarded artifacts (`skills/aw-init/artifacts/*`) and then
  `cp`-ing to the committed root copies guaranteed byte-identical pairs and kept
  `scripts/test-install.sh` green.
- A `node`+`git`-gated functional test in the smoke suite exercised real gate
  behavior (disabled no-op, unrecorded fail, fresh pass, path-scoped staleness,
  worktree vs HEAD, unreachable commit).

## Corrections Made

- The user redirected the CI-blocking design away from committed CI-provider
  templates toward a provider-agnostic script the consumer wires themselves, and
  specified the freshness-marker mechanism (git-ignored state file + deterministic
  JS check returning exit 1). Missed assumption: that "required PR check" implied
  a bundled GitHub Actions workflow.
- The user then asked for commit-hash-based gating; implemented it as an opt-in
  per-gate `mode` rather than replacing the wall-clock model, since the two are
  complementary (time-triggered vs change-triggered).
- The user did not want a pre-push hook bundled — added an example to the README
  instead.

## Dead Ends

- The first gate functional test recorded only the `review` gate but the default
  config enables three gates, so the passing check still failed. Fix: record every
  configured gate. Lesson: a freshness `check` fails on any unrecorded gate, so
  tests must record all configured gates, not just one.
- The initial YAML mini-parser skipped block-list items, so commit-mode `paths`
  read as empty. Fix: the parser now converts an indented `- item` block into an
  array on its parent key.

## Key Files

- `.scripts/aw-gate.js` + `skills/aw-init/artifacts/aw-gate.js` — the helper (source of truth is the artifact).
- `skills/aw-init/scripts/install.sh` — `--with-gates` flag and config sections.
- `skills/aw-init/scripts/upgrade-config.rb` — migrates the three default sections into older configs.
- `docs/workflow/README.md` / `skills/aw-init/artifacts/workflow-readme.md` — schema and mode docs.
- `scripts/test-install.sh` — drift pair, config assertions, age- and commit-mode gate tests.
- `docs/decisions/2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md` — the decision record.

## Open Questions

- Should a future gate mode compare against the PR merge-base (not just HEAD)
  for CI, to scope "what this PR changed" more precisely than "changed since the
  recorded commit"?
- Contributing learnings upstream to the org knowledge repo is currently a
  human-owned step; is an assisted "promote to org" flow worth adding later?
