---
name: ce-debug
description: 'Systematically find root causes and fix bugs. Use when debugging errors, investigating test failures, reproducing bugs from issue trackers (GitHub, Linear, Jira), or when stuck on a problem after failed fix attempts. Also use when the user says ''debug this'', ''why is this failing'', ''fix this bug'', ''trace this error'', or pastes stack traces, error messages, or issue references.'
argument-hint: "[issue reference, error message, test path, or description of broken behavior]"
---

# Debug and Fix

Find the root cause before fixing. Input: `$ARGUMENTS`.

## Principles

- Explain the full causal chain from trigger to symptom before proposing a fix.
- For uncertain links, make testable predictions in other code paths/scenarios.
- Change one thing at a time; avoid shotgun debugging.
- When stuck, diagnose why the investigation is stuck.

## Phase 0: Triage

If an issue tracker is referenced, fetch full title/body/comments/latest updates (`gh issue view ... --json title,body,comments,labels` for GitHub; use available tools for Linear/Jira/URLs). Extract symptoms, expected behavior, reproduction, environment, prior attempts.

If the cause is immediately obvious and the fix is one-line/simple, present cause and ask Fix now vs Diagnosis only before editing. If fixing, run workspace/branch safety checks, apply fix, verify, summarize.

Otherwise investigate first. Ask questions only when blocked. If user says prior attempts failed, ask what was tried before repeating work.

## Phase 1: Reproduce and Trace

1. Reproduce with the closest available path: failing test, command, browser flow, issue steps, or minimal script.
2. Verify environment sanity: branch, uncommitted changes, dependencies, runtime version, env vars, stale build artifacts, required services.
3. If `docs/standards/index.yml` exists, read it and load standards relevant to the failing area, test style, and likely fix surface.
4. If reproduction fails after 2-3 attempts, use intermittent-bug techniques from `references/investigation-techniques.md`; document missing conditions if unreproducible.
5. Trace the code path from input/trigger through state changes to symptom. Read surrounding code, tests, and applicable standards before editing.
6. Add or identify a failing regression test when feasible, following project test conventions and applicable standards.

## Phase 2: Root Cause Gate

Form hypotheses and test them. Before fixing, state:

- trigger
- faulty assumption or code path
- why symptom appears
- evidence
- prediction checked, if the link was uncertain

Do not proceed with a fix if the chain contains "somehow" gaps. Escalate to deeper instrumentation/logging/minimal reproduction when needed.

## Phase 3: Fix

After user chooses to fix or the request clearly asked for a fix:

- check workspace/branch safety; protect unrelated user changes
- implement the smallest fix that addresses the root cause
- follow applicable `docs/standards/` guidance for the touched files
- keep behavior changes scoped to the bug
- add/update regression tests
- run targeted verification, then broader checks as warranted
- if a proposed fix contradicts a prediction, stop and re-investigate

## Phase 4: Handoff

Summarize:

- root cause causal chain
- files changed
- tests/checks run and results
- remaining risk or missing environment
- related follow-ups

If no fix was applied, provide diagnosis and recommended next step. Do not commit unless asked.
