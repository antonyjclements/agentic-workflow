---
name: aw-create-prd
description: "Create or update an authored PRD from an idea, brainstorm, notes, or clarified product direction, using a repo-defined PRD template when available. Use when the user asks to write, draft, create, or update a PRD as a product artifact. Do not use for importing external PRDs unchanged; use aw-import-prd for that."
argument-hint: "[idea, brainstorm notes/path, feature description, or existing PRD path]"
---

# Create PRD

Create an authored product requirements document. A PRD is an input artifact for product thinking and spec creation, not the living source of shipped behavior.

## Storage

- Authored PRDs live under `docs/product/prds/`.
- `docs/product/prds/index.yml` is the entrypoint.
- Use `docs/product/prds/YYYY-MM-DD-<slug>.md` for new PRDs.
- Use PRD lifecycle statuses:
  - `draft`: authored PRD still being shaped
  - `ready-for-spec`: stable enough to promote into a living spec
  - `promoted`: a living spec has been created from this PRD
  - `superseded`: replaced before promotion by a newer PRD, spec, or decision
  - `archived`: safe for `aw-clean-artifacts` to remove from the working tree

## Template Selection

Use the first available template:

1. Repo-local `docs/product/prds/template.md`.
2. Bundled `references/prd-template.md`.
3. A compact fallback with title, problem, users, goals, flows, requirements, acceptance examples, boundaries, success criteria, open questions, and spec handoff.

When using a template:

- Preserve section order and headings unless the user asks to change them.
- Omit sections only when the template explicitly marks them optional or they are clearly irrelevant.
- Keep template guidance comments out of the final PRD unless the template says to retain them.
- Do not invent answers for required sections; ask concise questions or mark known gaps as open questions.

## Workflow

1. Resolve the input:
   - idea or notes in prompt: use directly
   - brainstorm/spec/PRD path: read it
   - blank input: ask what PRD to create
2. Read the selected PRD template.
3. Gather relevant repo context only as needed: imported PRDs, brainstorm artifacts, existing specs, product docs, decisions, and standards.
4. Clarify blocking product gaps one question at a time. Prefer preserving non-blocking uncertainty as open questions over extending the interview.
5. Create or update the PRD in `docs/product/prds/`.
6. Update `docs/product/prds/index.yml` without disrupting its existing schema.
7. Recommend the next step:
   - `aw-brainstorm <prd path>` when product behavior, scope, or trade-offs still need discovery
   - `aw-create-spec <prd path>` when the PRD is ready to become durable feature intent

## Rules

- Distinguish authored PRDs from imported PRDs. Imported PRDs preserve external source material; authored PRDs synthesize product direction.
- A PRD may propose future behavior. A spec describes current durable intent.
- PRDs are editable while `draft`. Once `ready-for-spec` or `promoted`, avoid body edits; record changed direction in the spec, a new PRD, or a decision.
- Do not remove PRDs just because they were promoted. Mark `status: archived` only when the user wants cleanup; `aw-clean-artifacts` handles deletion.
- Keep implementation plans, task lists, progress state, and ticket breakdowns out of the PRD.
- Link source artifacts and decisions when they informed the PRD.
- Keep paths repo-relative.
- Avoid storing secrets, customer-private data, or credentials.

## Default Index Format

```yaml
prds:
  - path: docs/product/prds/YYYY-MM-DD-<slug>.md
    title: <PRD Title>
    status: draft
    created: YYYY-MM-DD
    source: authored
    tags: []
```

## Final Output

Report:

- PRD path
- template used
- index update
- blocking or deferred open questions
- recommended next step
