---
name: aw-refresh
description: "Refresh and maintain docs registries: rebuild docs/decisions/index.yml and audit decision logs; refresh stale docs/solutions/ learning docs; regenerate docs/features/index.yml from living specs; remove workflow artifacts marked status: archived. Use when a registry is stale or missing, when the user says refresh decisions/solutions/features, when archived artifacts should be pruned, or after a sprint milestone."
argument-hint: "[decisions|solutions|features|cleanup|all] [scope, tag, or mode:headless|mode:dry-run]"
---

# Refresh

Maintain navigable, accurate registries under `docs/` without rewriting source records.

## Mode Routing

Determine scope from arguments and context:

- "refresh decisions" or `docs/decisions/` mentioned → **Decisions**
- "refresh solutions", "audit learnings", or `docs/solutions/` mentioned → **Solutions**
- "index features", "rebuild feature index", or `docs/features/` mentioned → **Features**
- "clean", "cleanup", "prune archived", or "remove archived" → **Cleanup**
- No target given or "refresh all" → run Decisions, Solutions, and Features in sequence (not Cleanup — cleanup is always explicit)

If `mode:headless` is present, strip it and apply headless behavior across all modes run.
If `mode:dry-run` is present, strip it and apply dry-run behavior (Cleanup mode only — report what would be removed without deleting).

---

## Decisions

Keep `docs/decisions/` navigable as it grows while preserving decisions as immutable records.

### Trigger Signals

Use when:
- `docs/decisions/index.yml` is missing, stale, duplicated, or incomplete
- The decision folder is large enough that discovery is becoming noisy
- Decisions need grouping by tag, feature, status, or supersession chain
- Before major planning or architecture work where old decisions may affect the path

Do not use this to rewrite history. If a decision changed, create a new decision with `aw-capture decision` and mark the relationship in the index.

### Immutable Rule

Decision markdown files are source records. Do not edit old decision files except to repair obviously broken frontmatter formatting when the user approves.

Prefer derived maintenance artifacts: `docs/decisions/index.yml`, `docs/decisions/summaries/index.md`, `docs/decisions/summaries/<tag-or-area>.md`. Derived summaries can be regenerated.

### Workflow

1. Read `docs/decisions/index.yml` if present.
2. Scan `docs/decisions/*.md`, excluding `README.md` and `summaries/`.
3. Extract frontmatter: `title`, `date`, `status`, `tags`, `related_specs`, `supersedes`, `superseded_by`.
4. Rebuild or patch `docs/decisions/index.yml` to include every decision file and remove missing-file entries.
5. Preserve the repo's existing index schema where practical:

```yaml
decisions:
  - path: docs/decisions/YYYY-MM-DD-slug.md
    title: Decision title
    date: YYYY-MM-DD
    status: active
    tags:
      - workflow
```

6. Detect and report: indexed files that no longer exist · decision files missing from the index · missing or inconsistent metadata · duplicate titles · superseded decisions still shown as active · active decisions that conflict with newer superseding records.
7. If there are more than ~25 decisions, create or refresh `docs/decisions/summaries/index.md`.
8. If one tag or area has more than ~10 decisions, create or refresh `docs/decisions/summaries/<tag>.md`.

### Summary Format

```markdown
# Decision Summary: <Scope>

Last refreshed: YYYY-MM-DD

## Active Decisions

- [Title](../YYYY-MM-DD-slug.md) - one-line consequence or current rule.

## Superseded Decisions

- [Old Title](../YYYY-MM-DD-old.md) -> [New Title](../YYYY-MM-DD-new.md)

## Open Follow-ups

- <metadata gap, conflict, or needed decision>
```

Keep summaries navigational. Do not restate full decision records.

### Large Log Guidance

When the folder is too large, prefer: a complete machine-readable index · tag/area summaries · supersession chains · status fields (`active`, `superseded`, `deprecated`, `accepted`) · links from feature specs to relevant decisions. Only recommend moving files when the user explicitly asks for a physical reorganization.

### Modes

Interactive: apply safe index and summary updates; ask before changing decision record files or making destructive moves. Headless: update only derived artifacts and report decision-record fixes as recommendations.

---

## Solutions

Maintain `docs/solutions/` by comparing learning and pattern docs to the current codebase, then keeping, updating, consolidating, replacing, or deleting them.

### Modes

Interactive: investigate first; ask only for genuinely ambiguous decisions; lead with a recommendation. Headless: no questions; process all matched docs; apply unambiguous actions; mark uncertain docs stale; produce Applied and Recommended report sections.

### Scope

Find markdown files under `docs/solutions/`, excluding `README.md` and `_archived/`. Match arguments by directory, frontmatter fields (`module`, `component`, `tags`), filename, then content.

Route by scope: **Focused** (1-2 files — investigate directly) · **Batch** (~8 docs — investigate then group) · **Broad** (9+ docs — inventory by module, cluster by impact, process high-impact clusters first).

### Outcomes

- **Keep**: still accurate; no write.
- **Update**: references/metadata drifted but core solution still matches; edit in place.
- **Consolidate**: overlapping docs both correct; merge into canonical and delete subsumed.
- **Replace**: old guidance is misleading; create successor using `aw-capture solution` format, then delete old doc.
- **Delete**: code/workflow gone, no successor, no meaningful inbound links.
- **Stale**: uncertainty remains (headless only); add `status: stale`, `stale_reason`, `stale_date`.

### Investigation

For each candidate, verify: referenced paths/classes/modules still exist · recommended solution matches current implementation · code snippets are current · related docs agree · newer docs/PRs suggest successors · overlapping docs repeat the same problem or root cause · inbound links before delete/replace.

Age alone is not drift. Missing or renamed references usually mean Update; contradiction with current architecture means Replace.

### Pattern Docs

After individual learnings, inspect `docs/solutions/patterns/` docs. Pattern docs need stronger evidence — stale generalized guidance is high leverage.

### Execution Rules

- Prefer no-write Keep.
- Avoid cosmetic churn.
- Delete instead of archiving; git history is the archive.
- Before deleting, check whether the problem domain is still active.
- Use subagents for replacement docs or broad consolidation when context isolation helps.

---

## Features

Regenerate `docs/features/index.yml` from living feature specs.

### Trigger Signals

Use when: `docs/features/index.yml` is missing or stale · feature specs have been added or moved · `aw-review` flags spec drift and the index is out of date.

### Workflow

1. Locate feature specs under `docs/features/*/spec.md` unless the user provides another path.
2. Read each spec's YAML frontmatter when present.
3. Derive missing metadata from the folder name and markdown heading.
4. Preserve the existing `docs/features/index.yml` schema when practical; otherwise use:

```yaml
features:
  - key: <feature-folder>
    title: <Feature Title>
    spec: docs/features/<feature-folder>/spec.md
    status: active
    tags: []
```

Optional fields when present in spec frontmatter: `owner`, `updated`, `related_decisions`, `related_standards`.

5. Write entries sorted by feature key or title.
6. Report: discovered features · skipped files · specs missing useful metadata.

### Rules

- Do not move or rewrite specs.
- Do not invent product behavior from filenames.
- If a spec has no title, use the first H1; if no H1, titleize the feature folder name.
- If `docs/features/` does not exist or no specs are found, report that and stop.
- Keep paths repo-relative.

---

## Cleanup

Remove workflow artifacts whose frontmatter or index entry has `status: archived`. Git is the archive; the working tree keeps only current source-of-truth artifacts.

### Scope

Clean only files under workflow artifact directories:

- `docs/product/prds/`
- `docs/brainstorms/`
- `docs/features/*/plan.md`
- other repo-local workflow artifact paths only when the user explicitly names them

Never delete:

- living specs at `docs/features/<feature>/spec.md`
- decision records under `docs/decisions/`
- standards under `docs/standards/`
- learnings or solution docs
- `AGENTS.md`, `CLAUDE.md`, workflow config, or indexes themselves

### Workflow

1. Parse arguments:
   - `mode:dry-run`: report what would be removed without deleting
   - artifact type or path: limit cleanup to that scope
   - blank (with `cleanup` mode selected): scan supported artifact directories
2. Inspect relevant indexes and artifact frontmatter.
3. Select only artifacts with `status: archived`.
4. For each candidate:
   - verify the file exists
   - check whether git tracks it with `git ls-files --error-unmatch <path>`
   - if untracked, ask before deletion because git has no historical copy
5. In interactive mode, show the deletion list and ask before removing files unless the user explicitly requested deletion of a named archived path.
6. Delete approved archived files.
7. Remove deleted file entries from indexes, preserving existing schema.
8. Report removed files and skipped candidates.

### Rules

- Do not infer archive status from age, completion, promotion, or supersession. Only `status: archived` permits deletion.
- Do not mark artifacts archived in this skill unless the user explicitly asks for that too.
- Do not remove a promoted PRD automatically. Promotion preserves provenance; archive status is the separate cleanup signal.
- If git is unavailable, do not delete files unless the user explicitly confirms that external history is acceptable.
- Keep paths repo-relative.

---

## Output

Report per mode run: index entries added/removed/changed · summaries created or refreshed · metadata gaps or conflicts · any recommended `aw-capture decision` follow-up for unresolved conflicts · files kept/updated/consolidated/replaced/deleted/stale-marked · features discovered and indexed · files removed and indexes updated (Cleanup mode).
