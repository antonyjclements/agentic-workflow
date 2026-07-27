---
title: Add trace --suggest-e2e for retrospective marker adoption
date: 2026-07-26
status: unprocessed
tags:
  - e2e-testing
  - aw-gate
  - session-capture
---

## What Was Attempted

- Continuation of the session logged in `docs/sessions/2026-07-26-e2e-testing-workflow-integration.md`, which covered work through commit `4985fc1`. This log covers what followed.
- Implemented `aw-gate.js trace --suggest-e2e` (`1831bf2`) for retrospectively adopting `[e2e]` markers in repos that already have an e2e suite. Detects two evidence-backed candidate classes: covered-unmarked (unmarked requirement already anchored in `e2e.test_paths`) and near-miss-marker (unhonored variant like `[E2E]`), each reported with current/proposed heading and a `gate_effect` note.
- Kept the mode advisory: writes nothing, exits 0 even when `trace` is red, requires `trace.enabled` but deliberately not `e2e.enabled` so the adoption order works. Requirement prose is never inspected — which requirements deserve e2e proof stays a human call per `docs/standards/e2e-coverage.md`.

## What Worked

- Delegating transcript summarization to a background agent rather than reading the 2,282-line JSONL inline.
- Cross-checking that summary against `git log`/`git show`, which gave more precise commit and file detail than the summary alone.

## Corrections Made

- Review of `1831bf2` caught a real bug: `parseFlags` binds the following token as a flag's value, so `trace --suggest-e2e <anything>` set the flag to a string. The `=== true` check then failed silently and fell through to the enforcing run — printing "trace clean" for an advisory request and exiting 1 on repos with real gaps. Fixed presence-based in `8320c89`.

## Dead Ends

- Stop-hook `aw-capture session` invocations kept failing on sandbox permission prompts, as in the earlier log; this capture required a manual follow-up session.
- The Stop hook then re-fired *after* this log was already written and the capture gate stamped (`.aw-gate-state.json` capture receipt at `2026-07-27T00:07:56Z`, commit `8320c89`), asking for a session log a second time. Distinct from the permission-prompt failures above: the hook has no completed-capture check, so a re-fire invites a duplicate log for one session. The re-fire was answered by appending this bullet instead of writing a third file.

## Key Files

- `.scripts/aw-gate.js` and synced `skills/aw-init/artifacts/aw-gate.js`
- `test/gate/suggest-e2e.test.js`
- `docs/workflow/README.md`, `docs/standards/e2e-coverage.md`, `docs/features/augmented-workflow/spec.md` (all synced to `skills/aw-init/artifacts/`)
- `CHANGELOG.md`, `README.md`, `package.json`

## Open Questions

- `v0.10.0` tag still needs manual push post-merge (proxy blocks `refs/tags/*`).
- Whether the Stop-hook capture failure warrants a durable fix so future sessions don't need a manual follow-up, and whether the hook should skip when a fresh capture receipt already exists for the current commit.
- Stale `AUGMENTED_WORKFLOW_VERSION=0.7.1` in `AGENTS.md`, still untouched.
