---
name: ce-retrospective
description: "Capture durable learnings when an agent is corrected, interrupted, redirected, or told after completion that the work should have behaved differently. Store discrete markdown learnings in docs/learnings/ for repo-specific lessons or ~/.agents/learnings/ for global lessons, maintaining an index.yml in each location."
argument-hint: "[optional correction, lesson, or context]"
---

# Retrospective Learning

Capture reusable lessons from corrections without turning every mistake into noise.

## Trigger Signals

Use this skill when the user:

- stops or interrupts an in-progress task to correct approach, scope, behavior, UX, or process
- says the completed work should have behaved differently
- says "I wanted...", "actually...", "not like that", "you should have...", "next time...", "remember that...", or similar correction language
- rejects a plan, implementation, review, or final answer because the agent missed a preference or repo convention

Do not trigger for ordinary clarifying answers, new unrelated requests, or one-off preferences the user explicitly says are temporary.

## Principles

- First honor the correction. Do not let retrospective capture block urgent repair work.
- Capture one lesson per file.
- Store durable preferences, repo conventions, workflow expectations, and product-behavior lessons.
- If the correction establishes a durable product, architecture, API, or workflow decision, also use `ce-decision-log` so the repo decision is recorded immutably.
- Skip blame, apology, and transcript logging. Write the lesson that prevents recurrence.
- Ask before promoting a lesson to global scope unless the user explicitly says it is global.
- Avoid secrets, private customer data, credentials, and sensitive incident details.

## Storage

Repo-specific learnings:

```text
docs/learnings/
docs/learnings/index.yml
```

Global learnings:

```text
~/.agents/learnings/
~/.agents/learnings/index.yml
```

Use repo-specific storage for lessons tied to this codebase, product, architecture, standards, tests, deployment, or team workflow.

Use global storage for stable user preferences or agent-process lessons that should apply across repositories.

If both apply, write two separate learnings only when each is independently useful. Otherwise choose the narrower repo-specific scope.

## Workflow

1. Identify the correction and the missed assumption.
2. Decide whether there is a durable lesson. If not, state that no retrospective entry is warranted and continue.
3. Check existing `docs/learnings/index.yml` and `~/.agents/learnings/index.yml` when present to avoid duplicates.
4. Classify scope:
   - clearly repo-specific -> write repo learning
   - clearly global because the user says "always", "in every repo", "remember generally", or similar -> write global learning
   - ambiguous but potentially global -> ask whether to store repo-only or promote to global
5. Draft one concise learning and write it.
6. Update the matching `index.yml`.
7. Resume the corrected task or summarize the captured learning.

## Question

When scope is ambiguous, ask one blocking question:

```text
Should I save this learning for this repo only, or promote it globally?

1. Repo only - store under docs/learnings/
2. Global - store under ~/.agents/learnings/
3. Both - write separate repo and global lessons
4. Don't save - apply the correction only this time
```

Use the platform question tool when available. If unavailable, present numbered options and wait.

## Learning File Format

Use the repo's existing format if present. Otherwise:

```markdown
---
title: <short title>
scope: repo|global
created: YYYY-MM-DD
trigger: correction|interruption|post-completion-feedback
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

Keep files short. A good learning is usually under 250 words.

## Index Format

Preserve an existing index schema if present. Otherwise use:

```yaml
learnings:
  - path: docs/learnings/<slug>.md
    title: <short title>
    scope: repo
    tags:
      - <tag>
```

For global learnings, use `path: ~/.agents/learnings/<slug>.md` and `scope: global`.

Keep index entries alphabetized by title where practical.

## File Naming

Use lowercase kebab-case:

```text
YYYY-MM-DD-<slug>.md
```

Examples:

- `2026-05-24-confirm-global-preferences.md`
- `2026-05-24-preserve-plan-scope.md`

## Final Output

Report:

- learning saved or skipped
- file path
- index updated
- how the current task should proceed differently
