---
name: aw-index-features
description: "Generate or refresh docs/features/index.yml from living feature specs at docs/features/<feature>/spec.md. Use when the user says index features, generate feature index, discover feature specs, or after feature specs are added or moved."
argument-hint: "[optional docs/features path]"
---

# Index Feature Specs

Create `docs/features/index.yml` from feature specs stored as `docs/features/<feature>/spec.md`.

## Workflow

1. Locate feature specs under `docs/features/*/spec.md` unless the user provides another `docs/features` path.
2. Read each spec's YAML frontmatter when present.
3. Derive missing metadata from the folder name and markdown heading.
4. Preserve the existing `docs/features/index.yml` schema when practical; otherwise use the default schema below.
5. Write entries sorted by feature key or title.
6. Report discovered features, skipped files, and any specs missing useful metadata.

## Default Index Format

```yaml
features:
  - key: <feature-folder>
    title: <Feature Title>
    spec: docs/features/<feature-folder>/spec.md
    status: active
    tags: []
```

Optional fields may be included when present in spec frontmatter:

- `owner`
- `updated`
- `related_decisions`
- `related_standards`

## Rules

- Do not move or rewrite specs unless the user asks.
- Do not invent product behavior from filenames.
- If a spec has no title, use the first H1; if no H1 exists, titleize the feature folder name.
- If `docs/features/` does not exist or no specs are found, report that no index was generated.
- Keep paths repo-relative.
