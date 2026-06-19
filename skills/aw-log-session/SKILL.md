---
name: aw-log-session
description: "Capture a structured summary of the current session — what was attempted, what worked, corrections made, dead ends encountered, and useful sources. Stores a session log in docs/sessions/ and updates docs/sessions/index.yml. Session logs feed the aw-synthesize-memory loop."
argument-hint: "[optional session topic, task, or ticket ID]"
---

# Log Session

Record what happened in this session so the synthesis loop can extract durable memory.

## Trigger Signals

Use this skill when:

- A task or subtask completes and the user is satisfied with the result.
- The user says "log session", "save session", "remember what we did", or similar.
- A session ends after meaningful work (not trivial one-line edits).
- `aw-synthesize-memory` is about to run and needs fresh logs to process.

Do not trigger for trivial edits, read-only exploration sessions, or sessions that made no meaningful changes.

## Principles

- Capture facts, not feelings. No blame, apology, or verbose narrative.
- One log per meaningful session or self-contained work chunk.
- Corrections are worth logging even when small — patterns emerge across sessions.
- Dead ends are worth logging even when embarrassing — they prevent wasted future effort.
- Keep logs short. A good session log is under 400 words.
- Never include secrets, credentials, API keys, or private customer data.

## Storage

```text
docs/sessions/
docs/sessions/index.yml
```

## Workflow

1. Review what happened in this session from the conversation and files changed.
2. Identify: what was attempted, what worked, any user corrections, dead ends hit, and files/sources that were most useful.
3. Draft the session log using the format below.
4. Write the file to `docs/sessions/YYYY-MM-DD-<slug>.md`.
5. Update `docs/sessions/index.yml`, adding the new entry with `status: unprocessed`.
6. Report the file written and the index entry added.

## Session Log Format

```markdown
---
title: <Short description of the session task>
date: YYYY-MM-DD
status: unprocessed
tags:
  - <tag>
---

## What Was Attempted

- <action and outcome>

## What Worked

- <approach that succeeded and why>

## Corrections Made

- <what the user corrected and what the missed assumption was>

## Dead Ends

- <approach that failed, why it failed, and what to try instead>

## Key Files

- <repo-relative paths that were most useful or changed>

## Open Questions

- <unresolved questions or deferred decisions>
```

Leave any section that does not apply with a `_none_` placeholder. Do not omit sections — the synthesis loop expects consistent structure.

## Index Format

Preserve an existing index schema if present. Otherwise:

```yaml
sessions:
  - path: docs/sessions/YYYY-MM-DD-<slug>.md
    title: <Short session description>
    date: YYYY-MM-DD
    status: unprocessed
    tags:
      - <tag>
```

Status values: `unprocessed` (default after logging), `processed` (set by `aw-synthesize-memory` after extraction).

## File Naming

Use lowercase kebab-case:

```text
YYYY-MM-DD-<slug>.md
```

Append a short counter (`-2`, `-3`) if multiple sessions occur on the same date with similar topics.

Examples:

- `2026-06-19-add-session-memory.md`
- `2026-06-19-fix-auth-bug.md`

## Final Output

Report:

- session log file written
- index entry added
- any items flagged as candidates for `aw-synthesize-memory` to promote (e.g., repeated correction patterns, reusable dead-end knowledge)
