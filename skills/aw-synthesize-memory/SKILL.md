---
name: aw-synthesize-memory
description: "Process unprocessed session logs from docs/sessions/, extract durable learnings and dead ends, promote repeated patterns to docs/learnings/ or docs/standards/, and regenerate docs/context/wiki.md — the synthesized project wiki loaded at the start of future sessions."
argument-hint: "[optional focus area, tag filter, or date range]"
---

# Synthesize Memory

Convert raw session logs into structured memory and refresh the project context wiki.

## Trigger Signals

Use this skill when:

- Multiple unprocessed session logs exist in `docs/sessions/`.
- The user says "synthesize memory", "update the wiki", "process sessions", or "run memory synthesis".
- A repeated pattern has appeared across recent sessions that should become a learning or standard.
- `docs/context/wiki.md` is stale or missing and upcoming sessions would benefit from it.
- Periodically at the end of a work sprint or feature milestone.

## Principles

- Extract the signal, discard the noise. Not every session produces a durable learning.
- New learnings start as `tentative`. They graduate to `active` only through corroboration across multiple sessions. This prevents a single hallucinated or misread session from polluting the wiki.
- Dead ends are low-cost to record and high-value for future agents. Err toward preserving them.
- `docs/context/wiki.md` is a synthesis artifact, not a source artifact. Regenerate it in full on each run; never manually edit it.
- Prefer updating existing learnings to creating near-duplicate entries.
- Do not promote a pattern to `docs/standards/` without user confirmation.

## Storage

```text
docs/sessions/index.yml       # source: unprocessed session logs
docs/learnings/               # destination: extracted learnings
docs/learnings/index.yml
docs/standards/               # destination: promoted patterns (with user confirmation)
docs/standards/index.yml
docs/context/wiki.md          # destination: regenerated project wiki
```

## Workflow

1. Read `docs/sessions/index.yml` and collect entries with `status: unprocessed`.
2. Read each unprocessed session log in full.
3. Read all existing learnings with `status: tentative` from `docs/learnings/` — these need corroboration checking in step 5.
4. Extract across all new session logs:
   - **Corrections** — missed assumptions that could become learnings.
   - **Dead ends** — failed approaches worth recording so future agents avoid them.
   - **What worked** — non-obvious effective approaches.
   - **Patterns** — items appearing in two or more sessions.
5. For each existing `tentative` learning:
   - Check whether any new session log corroborates it (same lesson, same pattern).
   - If corroborated: increment `evidence-count`, add the corroborating session to `derived-from`, reset `unconfirmed-runs` to 0. If `evidence-count` reaches 3, promote to `status: active`.
   - If not corroborated: increment `unconfirmed-runs` by 1. If `unconfirmed-runs` reaches 3, remove the learning file and drop it from `docs/learnings/index.yml`. Do not promote it.
6. For each new durable pattern extracted in step 4:
   - Check `docs/learnings/index.yml` for an existing learning to update rather than duplicate.
   - If the pattern appears in 3 or more of this batch's session logs, write it directly as `status: active`.
   - Otherwise write it as `status: tentative` with `evidence-count: 1`.
   - Always include `derived-from` listing the specific session log paths that support it.
   - Update `docs/learnings/index.yml`.
7. If a pattern appears across three or more sessions (cumulative, including past runs) and looks like an enforceable convention, surface it to the user as a candidate for `docs/standards/`. Do not write the standard without confirmation.
8. Regenerate `docs/context/wiki.md` in full from the current state of specs, decisions, learnings, and session summaries (see format below). Only `active` learnings appear in the main **Top Learnings** section. `Tentative` learnings appear in a separate **Tentative Learnings** section with minimal detail.
9. Mark each processed session `status: processed` in `docs/sessions/index.yml`.
10. Remove processed session logs older than 14 days (or two sprints, whichever is longer) from `docs/sessions/` and drop their entries from `docs/sessions/index.yml`. Git history is the long-term archive for raw session data.

## Retention

Processed session logs do not need to live in the repo indefinitely. Once synthesis has run, their signal exists in `docs/learnings/` and `docs/context/wiki.md`. Keeping stale processed logs creates noise without adding value.

Default retention window: **14 days** after the session date, or the end of the current sprint if the team works in sprints — whichever is longer. Remove logs that fall outside the window during step 10 of each synthesis run.

If no synthesis has run yet, do not remove any logs regardless of age — unprocessed logs are still raw material.

## Learning File Format

```markdown
---
title: <Short description>
scope: repo
created: YYYY-MM-DD
trigger: correction | pattern | dead-end
status: tentative | active
evidence-count: <N>
unconfirmed-runs: <N>
derived-from:
  - docs/sessions/YYYY-MM-DD-<slug>.md
tags:
  - <tag>
---

# <Title>

## Lesson

<One paragraph: what to do or avoid, and why.>

## Applies When

<Bullet list of conditions under which this learning triggers.>

## Do Instead

<What to do in place of the wrong approach, or how to apply the insight.>

## Evidence

<Direct quotes or summaries from the source session logs that support this learning.
Reference each source by path.>
```

- `status: tentative` — promoted from one or two sessions, not yet confirmed. Excluded from the main wiki context.
- `status: active` — confirmed across three or more sessions. Included in wiki.
- `evidence-count` — total number of sessions that have corroborated this learning.
- `unconfirmed-runs` — number of consecutive synthesis runs since creation without corroboration. Reset to 0 on any corroboration. Remove the learning when this reaches 3.
- `derived-from` — append each corroborating session path. This is the audit trail.

## Context Wiki Format

Regenerate `docs/context/wiki.md` entirely on each run:

```markdown
---
generated: YYYY-MM-DD
sessions_synthesized: <N>
---

# Project Context Wiki

> Auto-generated by aw-synthesize-memory. Do not edit manually.

## Active Features

<One line per active spec: title, path, one-line status summary.>

## Recent Decisions

<Top 5–10 decisions by recency: title, date, one-line rationale, path.>

## Top Learnings

<Active learnings only (status: active). Top 5–10 by recency or frequency of trigger:
title, one-line lesson, path.>

## Tentative Learnings

<Tentative learnings pending corroboration. Title and path only — no detail in wiki context.
Agents should not rely on these; they are surfaced for visibility, not authority.>

## Known Dead Ends

<Approaches to avoid, extracted from session dead ends and learnings. One line each with reason.>

## Useful Sources

<Files, docs, or external references that appeared frequently as useful across sessions.>
```

Keep the wiki under 500 words. It is loaded into agent context at session start, so brevity is critical.

## Learning Extraction Rules

- A **correction** becomes a learning when it reflects a missed assumption that would recur.
- A **dead end** becomes a learning when the failed approach is plausible enough that a future agent would try it.
- A **working approach** does not need a learning unless it is non-obvious and an agent would not naturally try it.
- Consolidate related items into one learning rather than writing several near-duplicates.
- Every learning must cite at least one `derived-from` session log. Do not write a learning without traceable evidence.

## Relation to Other Skills

- `aw-record-retrospective` handles immediate single-session corrections. `aw-synthesize-memory` batch-processes across sessions.
- `aw-discover-standards` is for code-style and project-wide coding conventions. `aw-synthesize-memory` handles workflow-level and process patterns.
- `aw-refresh-decisions` manages the decision index. `aw-synthesize-memory` reads decisions to populate the wiki but does not rewrite or index decisions.

## Final Output

Report:

- sessions processed (count and paths)
- learnings written or updated (titles, paths, and status)
- tentative learnings promoted to active (if any)
- tentative learnings aged out and removed (if any)
- patterns surfaced as standard candidates (with confirmation prompt if any)
- `docs/context/wiki.md` regenerated (section summary)
- sessions marked `processed` in the index
