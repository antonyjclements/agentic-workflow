---
name: aw-clean-artifacts
description: "Remove workflow artifacts that are explicitly marked archived, relying on git history as the long-term archive. Use when the user asks to clean archived PRDs, plans, brainstorms, or workflow artifacts, prune archived docs, or remove old archived artifacts."
argument-hint: "[optional artifact type, path, or mode:dry-run]"
---

# Clean Archived Artifacts

Remove workflow artifacts whose current frontmatter or index entry has `status: archived`.

Git is the archive. The working tree should keep current source-of-truth artifacts, not every old artifact forever.

## Scope

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

## Workflow

1. Parse arguments:
   - `mode:dry-run`: report what would be removed without deleting
   - artifact type or path: limit cleanup to that scope
   - blank: scan supported artifact directories
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

## Rules

- Do not infer archive status from age, completion, promotion, or supersession. Only `status: archived` permits deletion.
- Do not mark artifacts archived in this skill unless the user explicitly asks for that too.
- Do not remove a promoted PRD automatically. Promotion preserves provenance; archive status is the separate cleanup signal.
- If git is unavailable, do not delete files unless the user explicitly confirms that external history is acceptable.
- Keep paths repo-relative.

## Output

Report:

- files removed
- indexes updated
- archived candidates skipped and why
- dry-run status when applicable
