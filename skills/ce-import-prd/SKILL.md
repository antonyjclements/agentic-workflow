---
name: ce-import-prd
description: "Import a PRD from pasted content, a local markdown/document file, or a linked document such as Google Docs, then store it as a historical source artifact under docs/product/prds/. Use when the user says create/import/save a PRD from this file/link/content before starting the spec-driven workflow."
argument-hint: "[pasted PRD content, file path, URL, or document link]"
---

# Import PRD

Persist external product input as a historical source artifact, then hand it to `ce-brainstorm` for ambiguity resolution.

## Storage

- Imported PRDs live under `docs/product/prds/`.
- `docs/product/prds/index.yml` is the entrypoint.
- PRDs are source artifacts, not living truth. Do not rewrite old PRDs to match shipped behavior.
- Durable product thesis belongs in `docs/product/vision.md`; durable feature behavior belongs in `docs/features/<feature>/spec.md`.

## Workflow

1. Resolve the source:
   - pasted content: use it directly
   - local file: read it
   - URL or Google Doc: use available browser/document tools or ask for accessible export/content if blocked
2. Preserve source provenance: URL/path, import date, author/source when known.
3. Convert to clean markdown without changing meaning.
4. Create `docs/product/prds/YYYY-MM-DD-<slug>.md`.
5. Update `docs/product/prds/index.yml`, preserving its schema where practical.
6. Hand off by recommending or invoking `ce-brainstorm` with the imported PRD path.

## Default PRD Format

```markdown
---
title: <PRD Title>
status: imported
imported: YYYY-MM-DD
source: <url-or-path-or-pasted>
tags: []
---

# <PRD Title>

<Imported PRD content>
```

## Default Index Format

```yaml
prds:
  - path: docs/product/prds/YYYY-MM-DD-<slug>.md
    title: <PRD Title>
    status: imported
    imported: YYYY-MM-DD
    source: <url-or-path-or-pasted>
    tags: []
```

## Rules

- Preserve the PRD as input, including ambiguity and open questions.
- Do not turn the PRD directly into a feature spec.
- Do not put imported PRDs in `docs/product/vision.md`.
- Avoid storing secrets, customer-private data, or credentials; redact only when necessary and note the redaction.
- Keep the final output focused on the PRD path and next handoff path.

## Final Output

Report:

- imported PRD path
- index updated
- source provenance
- next step: `ce-brainstorm <prd path>`
