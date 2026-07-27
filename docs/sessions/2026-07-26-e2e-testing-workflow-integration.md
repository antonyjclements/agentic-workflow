---
title: Integrate e2e test authoring capability into the workflow
date: 2026-07-26
status: processed
tags:
  - e2e-testing
  - workflow-config
  - aw-gate
---

## What Was Attempted

- Designed where a colleague's Playwright/TypeScript e2e-authoring skill (author-only) should plug into the workflow and what config it needs.
- Modeled it as `workflow.auxiliary.e2e_tests.skill` (mirroring `pin_behavior`), added a `docs/workflow/config.yml` `e2e:` block, README docs, installer defaults/migration, and `aw-work`/`aw-check-workflow-compliance` hooks. Committed, pushed, released as 0.10.0.
- Opened PR #58 (`claude/e2e-testing-workflow-i687fl` → `main`).
- Extended `.scripts/aw-gate.js` with `[e2e]` marker detection (`missing-e2e-coverage`, `suspect-e2e-marker`, `e2e-paths-unset`) plus a new `docs/standards/e2e-coverage.md`.

## What Worked

- Verifying claims against actual repo code/config before asserting them, which caught several overstatements early.
- Scratch-repo empirical testing of `aw-gate.js` changes (marked/unmarked/near-miss/excluded cases) before each commit, catching real bugs pre-ship.

## Corrections Made

- `applies_to` collided with existing org-knowledge frontmatter and did not follow the `<noun>_paths` convention — renamed to `trigger_paths`.
- Overclaimed that e2e specs make every acceptance criterion deterministically e2e-covered; trace anchors carry no test-layer field. Corrected in README and the decision doc.
- Pushed back on "has to match" framing for the rename; only the type change (string → pathspec list) was load-bearing.
- "Test paths can be anything — not tied to trace paths" exposed a real bug: e2e anchors were only discovered inside `trace.test_paths`. Fixed with independent scan-and-merge.

## Dead Ends

- Pushing tag `v0.10.0` failed repeatedly (`send-pack: unexpected disconnect`); proxy blocks `refs/tags/*`. Deferred to manual tagging post-merge.
- First test-path fix unioned the pathspec lists, breaking `:(exclude)` semantics; required a second, independent-scan fix.
- Nine automated Stop-hook `aw-capture session` attempts failed on sandbox approval prompts for Bash.

## Key Files

- `docs/workflow/config.yml`, `docs/workflow/README.md`, `.scripts/aw-gate.js`, `skills/aw-work/SKILL.md`, `skills/aw-check-workflow-compliance/SKILL.md`, `skills/aw-init/scripts/install.sh`, `skills/aw-init/scripts/upgrade-config.rb`, `docs/standards/e2e-coverage.md`, `docs/decisions/2026-07-26-add-e2e-test-authoring-capability.md`

## Open Questions

- Whether to build a migration script or an `aw-gate.js trace --suggest-e2e` flag for retrospectively adding `[e2e]` markers (asked, unanswered).
- Stale `AUGMENTED_WORKFLOW_VERSION=0.7.1` stamp in `AGENTS.md`, flagged but untouched.
- Whether to monitor PR #58's pipeline.
