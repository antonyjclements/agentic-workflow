---
title: Offer session capture manually; the Stop hook may not have run
scope: repo
created: 2026-07-27
trigger: dead-end
status: tentative
evidence-count: 2
unconfirmed-runs: 0
derived-from:
  - docs/sessions/2026-07-26-e2e-testing-workflow-integration.md
  - docs/sessions/2026-07-26-e2e-suggest-flag-2.md
tags:
  - workflow
  - session-capture
  - hooks
---

# Offer session capture manually; the Stop hook may not have run

## Lesson

The Claude Code Stop hook that invokes `aw-capture session` fails in ordinary
conditions — it needs Bash approval, and sandboxed or permission-prompting
environments deny it. It also has no completed-capture check, so it can re-fire after
a log was already written and invite a duplicate. Treat the hook as a convenience
that probably did not work, exactly as the spec says, and offer capture explicitly at
the end of meaningful sessions.

## Applies When

- A meaningful session is wrapping up in any environment with permission prompts,
  sandboxing, or non-interactive execution
- The hook appears to have fired a second time for a session already logged
- Working in any agent other than Claude Code, where the hook does not exist at all

## Do Instead

- Offer or run `aw-capture session` at the end of meaningful sessions without waiting
  for the hook, and without assuming it ran.
- Before writing a log, check whether `docs/sessions/` already has one for this
  session. If it does, append to it rather than creating a near-duplicate file.
- Do not treat a missing session log as evidence that nothing happened worth logging.

## Evidence

- `2026-07-26-e2e-testing-workflow-integration.md`: "Nine automated Stop-hook
  `aw-capture session` attempts failed on sandbox approval prompts for Bash."
- `2026-07-26-e2e-suggest-flag-2.md`: the hook re-fired after the log was written and
  the capture gate stamped, "asking for a session log a second time... the hook has no
  completed-capture check, so a re-fire invites a duplicate log for one session." The
  re-fire was answered by appending a bullet rather than writing a third file.
