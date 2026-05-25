---
name: ce-compound
description: Document a recently solved problem to compound your team's knowledge
argument-hint: "[optional: brief context] [mode:headless] "
---

# /ce-compound

Document a recently solved problem in `docs/solutions/` while context is fresh.

Agents should proactively suggest this skill after solving a non-trivial problem, especially when the root cause, debugging path, integration detail, or prevention pattern would help a future agent or engineer. Do not wait for the user to remember to ask.

## Modes

Strip `mode:headless` from `$ARGUMENTS` before using the remainder as context.

- Interactive: ask Full vs Lightweight. Full may ask whether to include session history. Ask for discoverability-edit consent. End with next-step menu.
- Headless: no questions; run Full without session history; silently apply discoverability edit if needed; skip specialized review; end with structured report.

Use the platform blocking question tool when asking. Fall back to numbered chat only if no tool exists or it fails.

## Support Files

Read only when needed:

- `references/schema.yaml` - frontmatter schema/enums
- `references/yaml-schema.md` - category/directory mapping
- `assets/resolution-template.md` - document body template

## Output Contract

Primary output is one solution doc. Research agents return text only; only the orchestrator writes files. The only allowed secondary edit is a small discoverability update to `AGENTS.md`/`CLAUDE.md` when approved or headless.

## Workflow

1. Resolve mode and context. Include current branch in session-history payload if known.
2. Interactive only: choose Full or Lightweight.
   - Full: context analysis, solution extraction, related-doc search, optional session history, duplicate/overlap checks.
   - Lightweight: single-pass doc from current context and code diff; skip duplicate/cross-reference work.
3. Scan auto-memory if available; pass relevant notes as supplementary evidence, tagged `(auto memory [claude])`.
4. Research:
   - identify changed files, commands run, errors, root cause, fix, verification, and prevention
   - find related `docs/solutions/` docs and possible duplicates
   - classify problem type/category/module/component using schema references
5. Assemble doc from template with YAML frontmatter:
   - title, status, created date, problem_type/category/module/component/tags
   - problem, symptoms, root cause, solution, files changed, verification, prevention, related docs
6. Validate:
   - YAML parses and matches schema
   - file path/category matches mapping
   - doc is specific enough to be useful later
   - no unsupported claims; distinguish evidence from inference
7. Write to `docs/solutions/<category>/YYYY-MM-DD-<slug>.md`.
8. Discoverability check: if future agents would not know to search this knowledge store, propose or apply a minimal instruction-file edit.
9. Final report:
   - file created
   - category/module/tags
   - related docs/duplicates handled
   - discoverability edit applied/recommended

## Rules

- Do not create docs for trivial/unknown fixes with no durable lesson.
- Prefer concrete, searchable wording over narrative.
- Include commands/tests actually used; say when verification was not run.
- If a duplicate doc exists, update/cross-link instead of creating redundant guidance.
- Never fabricate session history or code evidence.
- Do not commit unless the user asks.
