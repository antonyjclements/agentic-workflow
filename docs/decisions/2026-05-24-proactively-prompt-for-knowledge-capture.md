---
title: Proactively prompt for knowledge capture
date: 2026-05-24
status: active
tags:
  - workflow
  - automation
  - knowledge-capture
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Proactively prompt for knowledge capture

## Context

The workflow depends on decisions, corrections, and solved problems being written back into the repo. If the user must remember to invoke `ce-decision-log`, `ce-retrospective`, or `ce-compound` every time, the feedback loop will be inconsistent.

## Decision

Agents should run a lightweight capture checkpoint at natural pauses, especially before final summaries and commit/PR workflows. The checkpoint asks whether any decisions, correction-driven learnings, or reusable solutions should be captured.

Agents may write records immediately when the capture target is explicit and repo-local. They should ask one concise question when the scope, durability, privacy, or global-vs-repo placement is unclear.

## Consequences

Knowledge capture becomes part of the workflow instead of a separate user habit. The system can start with prompts and later automate more aggressively as patterns become stable.

## Alternatives Considered

- Rely on users to invoke capture skills manually: simpler, but easy to forget during real work.
- Always auto-write every possible capture: maximizes recall, but risks noisy docs and unwanted global learnings.

## Links

- `docs/features/agentic-workflow/spec.md`
