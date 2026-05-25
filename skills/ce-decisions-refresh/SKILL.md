---
name: ce-decisions-refresh
description: Refresh and maintain large docs/decisions/ registries without rewriting immutable decision records. Use when the user asks to refresh decisions, rebuild docs/decisions/index.yml, audit decision logs, handle a large decision folder, find superseded decisions, or improve decision discoverability.
argument-hint: "[optional: scope, tag, feature, or mode:headless]"
---

# Decisions Refresh

Keep `docs/decisions/` navigable as it grows while preserving decisions as immutable records.

## Trigger Signals

Use when:

- `docs/decisions/index.yml` may be missing, stale, duplicated, or incomplete
- the decision folder is large enough that discovery is becoming noisy
- the user asks what to do about too many decisions
- decisions need grouping by tag, feature, status, year, or supersession chain
- before major planning or architecture work where old decisions may affect the path

Do not use this to rewrite history. If a decision changed, create a new decision with `ce-decision-log` and mark the relationship in the index or new decision metadata.

## Immutable Rule

Decision markdown files are source records. Do not edit old decision files except to repair obviously broken frontmatter formatting when the user approves.

Prefer derived maintenance artifacts:

- `docs/decisions/index.yml`
- `docs/decisions/summaries/index.md`
- `docs/decisions/summaries/<tag-or-area>.md`

Derived summaries can be regenerated because they describe the current decision map, not the original historical record.

## Workflow

1. Read `docs/decisions/index.yml` if present.
2. Scan `docs/decisions/*.md`, excluding `README.md` and `summaries/`.
3. Extract frontmatter fields when available: `title`, `date`, `status`, `tags`, `related_specs`, `supersedes`, `superseded_by`.
4. Rebuild or patch `docs/decisions/index.yml` to include every decision file and remove missing-file entries.
5. Preserve the repo's existing index schema where practical. Otherwise use:

```yaml
decisions:
  - path: docs/decisions/YYYY-MM-DD-slug.md
    title: Decision title
    date: YYYY-MM-DD
    status: active
    tags:
      - workflow
```

6. Detect and report:
   - indexed files that no longer exist
   - decision files missing from the index
   - missing or inconsistent metadata
   - duplicate titles or near-duplicate topics
   - superseded decisions still shown as active
   - active decisions that conflict with newer superseding records
7. If there are more than about 25 decisions, create or refresh `docs/decisions/summaries/index.md`.
8. If one tag or area has more than about 10 decisions, create or refresh `docs/decisions/summaries/<tag>.md`.

## Summary Format

Use concise derived summaries:

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

## Large Log Guidance

When the folder is too large, do not archive old decisions by default. Git history is not a good search interface, and old decisions remain useful for archaeology.

Prefer:

- a complete machine-readable index
- tag/area summaries
- supersession chains
- status fields such as `active`, `superseded`, `deprecated`, or `accepted`
- links from feature specs to relevant decisions

Only recommend moving files if the repo already has a dated directory convention or the user explicitly asks for a physical reorganization.

## Modes

Strip `mode:headless` if present.

- Interactive: apply safe index and summary updates; ask before changing decision record files or making destructive moves.
- Headless: update only derived artifacts and report decision-record fixes as recommendations.

## Output

Report:

- index entries added, removed, or changed
- summaries created or refreshed
- metadata gaps or conflicts found
- supersession chains discovered
- any recommended `ce-decision-log` follow-up for unresolved conflicts
