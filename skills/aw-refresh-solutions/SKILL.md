---
name: aw-refresh-solutions
description: Refresh stale learning and pattern docs under docs/solutions/ by reviewing them against the current codebase, then updating, consolidating, or deleting drifted ones. Use when the user asks to "refresh my learnings", "audit docs/solutions/", "clean up stale learnings", or "consolidate overlapping docs", or when aw-capture-solution flags an older doc as superseded. Do not trigger for general refactor, debugging, or code-review work unless the user has explicitly pointed at docs/solutions/.
argument-hint: "[optional: scope hint — directory, filename, module, or keyword] [mode:headless] "
---

# Solution Refresh

Maintain `docs/solutions/` by comparing learning and pattern docs to the current codebase, then keeping, updating, consolidating, replacing, stale-marking, or deleting them.

## Modes

Strip `mode:headless` if present.

- Interactive: investigate first; ask only for genuinely ambiguous decisions using the blocking question tool; lead with a recommendation.
- Headless: no questions; process all matched docs; apply unambiguous actions; mark uncertain docs stale; produce Applied and Recommended report sections.

If a scope hint matches nothing, report that and stop. In headless mode do not widen to all docs unless no hint was provided.

## Scope

Find markdown files under `docs/solutions/`, excluding `README.md` and `_archived/`. If `_archived/` exists, flag it for cleanup. Match `$ARGUMENTS` by directory, frontmatter (`module`, `component`, `tags`), filename, then content.

Route by scope:

- Focused: 1-2 likely files or named doc; investigate directly.
- Batch: up to ~8 independent docs; investigate then group recommendations.
- Broad: 9+ docs or ambiguous; inventory by module/component, cluster by impact, spot-check missing references, then process high-impact clusters first. Interactive mode asks for starting area; headless processes all in impact order.

## Outcomes

- Keep: still accurate/useful; no write.
- Update: references/metadata/snippets drifted but core solution still matches current code; edit in place.
- Consolidate: overlapping docs both correct; merge unique value into canonical doc and delete subsumed docs.
- Replace: old guidance is misleading and a better current successor exists; create successor using `aw-capture-solution` format, then delete old doc.
- Delete: code/workflow gone, no successor, and inbound links are absent or decorative.
- Stale: uncertainty remains in headless mode; add `status: stale`, `stale_reason`, `stale_date`.

## Investigation

For each candidate, verify:

- referenced paths/classes/modules still exist
- recommended solution matches current implementation
- code snippets are current
- related docs and pattern docs agree
- newer docs/PRs/issues/memories suggest successors
- overlapping docs repeat problem, root cause, files, prevention, or solution
- inbound links before delete/replace

Age alone is not drift. Missing or renamed references usually mean Update; contradiction with current architecture means Replace. Memory-only evidence can prompt deeper checks but does not justify destructive action.

Evaluate document-set design too: duplicated guidance should be consolidated or cross-scoped so search results point to one current truth.

## Pattern Docs

After individual learnings, inspect relevant `docs/solutions/patterns/` docs. Pattern docs need stronger evidence because stale generalized guidance is high leverage. A pattern with no clear supporting learnings is suspect.

## Execution Rules

- Prefer no-write Keep.
- Avoid cosmetic churn.
- Match docs to current code; this workflow is not code review.
- Delete instead of archiving; git history is the archive.
- Before deleting, check whether the problem domain is still active and whether inbound links need replacement.
- Use subagents for replacement docs or broad consolidation when context isolation helps.

## Output

Interactive: list each recommendation with evidence and ask only for ambiguous or destructive choices. Then apply approved changes and offer a commit if in a git repo.

Headless report:

```text
Compound refresh complete.

Applied:
- <path>: <action> - <reason>

Recommended:
- <path>: <action or stale> - <reason and evidence>
```

Commit message, when committing:

```text
Refresh compound learnings
```

Mention changed, deleted, replaced, consolidated, and stale-marked docs in the final summary.
