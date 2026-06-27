---
name: aw-capture
description: "Capture durable knowledge from the current session: log an immutable decision, save a reusable learning, document a solved problem, or write a session log. Routes by what is being captured. Invoked proactively by agents at natural pauses and automatically by the Claude Code Stop hook for session logging."
argument-hint: "[decision|learning|solution|session] [context, correction, or description]"
---

# Capture

Route to the right capture mode based on what happened.

## Mode Routing

Determine mode from arguments and context before starting:

- A product, architecture, API, or workflow choice was made → **Decision**
- Agent was corrected, interrupted, or redirected; user says "remember", "next time", "you should have" → **Learning**
- A non-trivial problem was just solved; root cause and fix are clear → **Solution**
- A meaningful session just ended or is wrapping up → **Session**

If both Decision and Learning apply, write a decision for the repo fact and a learning for the future agent behavior.

Agents should proactively suggest this skill at natural pauses — after resolving ambiguity, after a correction, after closing a hard bug, at the end of a meaningful session — rather than waiting for the user to invoke it.

---

## Decision

Log an immutable decision record so resolved context is not lost in chat or plans.

### Trigger Signals

- Ambiguity is resolved during implementation
- Product behavior, architecture, data model, API contract, testing strategy, or workflow policy is chosen
- A user correction changes durable repo behavior
- User says `decision:log`, "log this decision", or "record why"

### Storage

- `docs/decisions/YYYY-MM-DD-<slug>.md`
- `docs/decisions/index.yml` — entrypoint
- Decision files are **immutable**. To change direction, create a new decision that supersedes the old one.

### Workflow

1. Read `docs/decisions/index.yml` and relevant `docs/features/` specs if present.
2. Identify: decision, context, alternatives, consequences, owner/source, related specs.
3. If the actual decision is unclear, ask one blocking question.
4. Create `docs/decisions/YYYY-MM-DD-<slug>.md`.
5. Update the index, preserving its schema where possible.
6. Link the decision from any affected spec when clearly in scope.

### Decision Format

```markdown
---
title: <Decision Title>
date: YYYY-MM-DD
status: active
tags:
  - <tag>
related_specs: []
supersedes: []
---

# <Decision Title>

## Context

## Decision

## Consequences

## Alternatives Considered

## Links
```

### Index Format

```yaml
decisions:
  - path: docs/decisions/YYYY-MM-DD-<slug>.md
    title: <Decision Title>
    date: YYYY-MM-DD
    status: active
    tags:
      - <tag>
```

---

## Learning

Capture a reusable lesson from a correction without turning every mistake into noise.

### Trigger Signals

Use when the user:

- Stops or interrupts a task to correct approach, scope, behavior, UX, or process
- Says the completed work should have behaved differently
- Says "I wanted...", "actually...", "not like that", "you should have...", "next time...", "remember that...", or similar
- Rejects a plan or implementation because the agent missed a preference or repo convention

Do not trigger for ordinary clarifying answers, new unrelated requests, or one-off preferences the user explicitly says are temporary.

Apply the correction first when needed, then capture the lesson.

### Principles

- First honor the correction. Do not let learning capture block urgent repair work.
- One lesson per file.
- Skip blame, apology, and transcript logging. Write the lesson that prevents recurrence.
- Ask before promoting to global scope unless the user explicitly says it is global.
- Avoid secrets, private customer data, credentials, and sensitive incident details.

### Storage

```text
docs/learnings/           # repo-specific
docs/learnings/index.yml
~/.agents/learnings/      # global (with user confirmation)
~/.agents/learnings/index.yml
```

Use repo-specific storage for lessons tied to this codebase, product, architecture, standards, or team workflow. Use global storage for stable user preferences that should apply across repositories. If both apply, write two separate learnings only when each is independently useful.

### Workflow

1. Identify the correction and the missed assumption.
2. Decide whether there is a durable lesson. If not, state that no entry is warranted and continue.
3. Check existing `docs/learnings/index.yml` to avoid duplicates.
4. Classify scope: repo-specific or global. When ambiguous, ask one blocking question.
5. Draft one concise learning and write it.
6. Update the matching `index.yml`.
7. Resume the corrected task or summarize the captured learning.

### Learning Format

```markdown
---
title: <short title>
scope: repo|global
created: YYYY-MM-DD
trigger: correction|interruption|post-completion-feedback
status: tentative
evidence-count: 1
unconfirmed-runs: 0
derived-from:
  - docs/sessions/YYYY-MM-DD-<slug>.md
tags:
  - <tag>
---

# <Short Title>

## Lesson

<One clear rule or preference.>

## Applies When

- <condition>

## Do Instead

- <specific behavior to apply next time>

## Evidence

- <short paraphrase of correction; no sensitive transcript>
```

---

## Solution

Document a recently solved problem while context is fresh.

Agents should proactively suggest this after solving a non-trivial problem, especially when the root cause, debugging path, or prevention pattern would help a future agent. Do not wait for the user to ask.

### Modes

Strip `mode:headless` from arguments before using the remainder as context.

- **Interactive**: ask Full vs Lightweight. Full may ask whether to include session history. Ask for discoverability-edit consent. End with next-step menu.
- **Headless**: no questions; run Full without session history; silently apply discoverability edit if needed; skip specialized review; end with structured report.

### Support Files

Read only when needed:

- `references/schema.yaml` — frontmatter schema/enums
- `references/yaml-schema.md` — category/directory mapping
- `assets/resolution-template.md` — document body template

### Workflow

1. Resolve mode and context. Include current branch in session-history payload if known.
2. Interactive only: choose Full or Lightweight.
   - **Full**: context analysis, solution extraction, related-doc search, optional session history, duplicate/overlap checks.
   - **Lightweight**: single-pass doc from current context and code diff; skip duplicate/cross-reference work.
3. Research: identify changed files, commands run, errors, root cause, fix, verification, and prevention; find related `docs/solutions/` docs and possible duplicates; classify problem type/category/module/component using schema references.
4. Assemble doc from template with YAML frontmatter: title, status, created date, problem_type/category/module/component/tags, problem, symptoms, root cause, solution, files changed, verification, prevention, related docs.
5. Validate: YAML parses and matches schema; file path/category matches mapping; doc is specific enough to be useful; no unsupported claims; distinguish evidence from inference.
6. Write to `docs/solutions/<category>/YYYY-MM-DD-<slug>.md`.
7. Discoverability check: if future agents would not know to search this knowledge store, propose or apply a minimal instruction-file edit.

### Rules

- Do not create docs for trivial or unknown fixes with no durable lesson.
- Prefer concrete, searchable wording over narrative.
- Include commands/tests actually used; say when verification was not run.
- If a duplicate doc exists, update/cross-link instead of creating redundant guidance.
- Never fabricate session history or code evidence.
- Do not commit unless the user asks.

---

## Session

Record what happened in this session so the synthesis loop can extract durable memory.

### Trigger Signals

Use when:
- A task or subtask completes and the user is satisfied with the result
- The user says "log session", "save session", "remember what we did", or similar
- A session ends after meaningful work (not trivial one-line edits or read-only exploration)
- `aw-synthesize-memory` is about to run and needs fresh logs to process
- The Claude Code Stop hook fires at session end (automatic invocation)

### Principles

- Capture facts, not feelings. No blame, apology, or verbose narrative.
- One log per meaningful session or self-contained work chunk.
- Corrections are worth logging even when small — patterns emerge across sessions.
- Dead ends are worth logging even when embarrassing — they prevent wasted future effort.
- Keep logs short. A good session log is under 400 words.
- Never include secrets, credentials, API keys, or private customer data.

### Storage

```text
docs/sessions/
docs/sessions/index.yml
```

### Workflow

1. Review what happened in this session from the conversation and files changed.
2. Identify: what was attempted, what worked, any user corrections, dead ends hit, and files/sources that were most useful.
3. Draft the session log using the format below.
4. Write the file to `docs/sessions/YYYY-MM-DD-<slug>.md`.
5. Update `docs/sessions/index.yml`, adding the new entry with `status: unprocessed`.
6. Report the file written and the index entry added.

### Session Log Format

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

### Index Format

```yaml
sessions:
  - path: docs/sessions/YYYY-MM-DD-<slug>.md
    title: <Short session description>
    date: YYYY-MM-DD
    status: unprocessed
    tags:
      - <tag>
```

Status values: `unprocessed` (default), `processed` (set by `aw-synthesize-memory` after extraction).

### File Naming

Use lowercase kebab-case: `YYYY-MM-DD-<slug>.md`. Append `-2`, `-3` if multiple sessions occur on the same date with similar topics.

### Automation (Claude Code)

`aw-init` installs a Stop hook for Claude Code that invokes `aw-capture session` automatically when each session ends:

```text
.claude/hooks/log-session.sh    # hook script
.claude/settings.json           # Stop hook registration
```

The hook spawns a non-interactive `claude --print` subprocess. A lock file (`.claude/hooks/.aw-log-session-active`) prevents recursion when the subprocess itself ends.

Other agents (Codex, Codeium, Windsurf) do not have an equivalent lifecycle hook but can invoke `aw-capture session` manually. The session log format is cross-agent.

---

## Output

Report: mode used · file path created · index/registry updated · related artifacts touched · recommended next step.
