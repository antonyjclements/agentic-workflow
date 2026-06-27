---
name: aw-prd
description: "Create or import a PRD under docs/product/prds/. Routes by source: authored PRD from idea/notes/brainstorm → create mode; external PRD from pasted content/file/URL → import mode. Use when the user says create, draft, write, import, or save a PRD."
argument-hint: "[create|import] [idea, notes, file path, URL, or pasted content]"
---

# PRD

Create or import a product requirements document and store it under `docs/product/prds/`.

## Mode Routing

- User says "create", "draft", "write", or "author" a PRD → **Create**
- User provides pasted content, a local file path, or a URL → **Import**
- Ambiguous: ask one question — "Are you writing a new PRD from your own notes, or importing an existing document?"

## Storage

- PRDs live under `docs/product/prds/`.
- `docs/product/prds/index.yml` is the entrypoint.
- PRDs are **source artifacts**, not living truth. Do not rewrite old PRDs to match shipped behavior.
- Durable product thesis belongs in `docs/product/vision.md`; durable feature behavior belongs in `docs/features/<feature>/spec.md`.

## Lifecycle Statuses

- `draft`: authored PRD still being shaped
- `imported`: external PRD preserved as-is
- `ready-for-spec`: stable enough to promote into a living spec
- `promoted`: a living spec has been created from this PRD
- `superseded`: replaced before promotion
- `archived`: safe for `aw-refresh cleanup` to remove from the working tree

---

## Create

Create an authored PRD from an idea, brainstorm, notes, or clarified product direction.

### Template Selection

Use the first available template:

1. Repo-local `docs/product/prds/template.md`
2. Bundled `references/prd-template.md`
3. Compact fallback: title, problem, users, goals, flows, requirements, acceptance examples, boundaries, success criteria, open questions, spec handoff

When using a template: preserve section order; omit sections only when explicitly marked optional; remove template guidance comments from the final PRD; do not invent answers for required sections — ask or mark as open questions.

### Workflow

1. Resolve the input: idea or notes in prompt (use directly); brainstorm/spec/PRD path (read it); blank input (ask what PRD to create).
2. Read the selected PRD template.
3. Gather relevant repo context as needed: existing specs, product docs, decisions, and standards.
4. Clarify blocking product gaps one question at a time. Preserve non-blocking uncertainty as open questions.
5. Create or update the PRD in `docs/product/prds/YYYY-MM-DD-<slug>.md` with `status: draft`.
6. Update `docs/product/prds/index.yml` without disrupting its existing schema.
7. Recommend the next step.

### Rules

- A PRD may propose future behavior. A spec describes current durable intent.
- PRDs are editable while `draft`. Once `ready-for-spec` or `promoted`, avoid body edits; record changed direction in the spec, a new PRD, or a decision.
- Keep implementation plans, task lists, and ticket breakdowns out of the PRD.
- Link source artifacts and decisions when they informed the PRD.

---

## Import

Persist external product input as a historical source artifact.

### Workflow

1. Resolve the source:
   - Pasted content: use it directly
   - Local file: read it
   - URL or Google Doc: use available browser/document tools; ask for accessible export if blocked
2. Preserve source provenance: URL/path, import date, author/source when known.
3. Convert to clean markdown without changing meaning.
4. Create `docs/product/prds/YYYY-MM-DD-<slug>.md` with `status: imported`.
5. Update `docs/product/prds/index.yml`, preserving its schema where practical.

### Rules

- Preserve the PRD as input, including ambiguity and open questions.
- Do not rewrite the imported PRD into living truth — that belongs in the spec.
- After a spec is created from the PRD, only update frontmatter lifecycle metadata (`status: promoted`, `promoted_to`). Do not rewrite the PRD body.
- Do not remove imported PRDs just because they were promoted. Removal requires `status: archived` and cleanup through `aw-refresh cleanup`.
- Avoid storing secrets, customer-private data, or credentials; redact only when necessary.

---

## Default Formats

**PRD file:**

```markdown
---
title: <PRD Title>
status: draft|imported
created: YYYY-MM-DD
source: authored|<url-or-path-or-pasted>
tags: []
---

# <PRD Title>

<Content>
```

**Index:**

```yaml
prds:
  - path: docs/product/prds/YYYY-MM-DD-<slug>.md
    title: <PRD Title>
    status: draft
    created: YYYY-MM-DD
    source: authored
    tags: []
```

---

## Output

Report: PRD path · template used (create mode) · source provenance (import mode) · index updated · recommended next step: `aw-brainstorm <prd path>` when scope/trade-offs need clarification, or `aw-create-spec <prd path>` when ready to draft a living spec.
