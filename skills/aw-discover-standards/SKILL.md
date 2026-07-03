---
name: aw-discover-standards
description: "Discover repeated codebase conventions and tribal best practices, then document them as concise standards under docs/standards/ and update docs/standards/index.yml. Use when the user wants to create, extract, discover, audit, or expand project standards or best-practice docs."
argument-hint: "[optional focus area, path, domain, or standard idea]"
---

# Discover Standards

Extract durable project standards from real code. Write concise markdown standards under `docs/standards/` and keep `docs/standards/index.yml` as the registry.

## Principles

- Standards must be short, scannable, and useful to future agents.
- Document opinionated, repeated, non-obvious patterns; skip generic framework behavior.
- Ask one question at a time using the platform blocking question tool. If unavailable, use numbered chat options and wait.
- Complete one standard at a time: evidence -> why/exceptions -> draft -> confirm -> write -> index.
- Prefer updating an existing related standard over creating duplicates.

## Step 1: Load Existing Registry

If `docs/standards/index.yml` exists:

1. Read it.
2. Infer its schema. Common shapes include nested folders, file entries, descriptions, tags, globs, or arrays.
3. Scan referenced markdown files enough to avoid duplicate standards.

If it does not exist, plan to create it after the first approved standard.

When `org_knowledge.source` is configured in `docs/workflow/config.yml`, also run `node .scripts/aw-gate.js org-sync` and scan the org-shared standards tier in `<org_knowledge.cache_dir>/<paths.standards>`. Do not re-document an org-wide standard locally — reference the org entry instead, and only write a repo-local standard when the convention is genuinely specific to this repo.

## Step 2: Determine Focus

Use `$ARGUMENTS` if it names a path, domain, or standard idea.

If no focus is provided:

1. Inspect the repo structure, file types, and major directories.
2. Identify 3-5 promising areas, such as frontend components, styling, API routes, database, authentication, testing, errors, file structure, naming, background jobs, or documentation.
3. Ask the user which area to inspect.

## Step 3: Inspect Evidence

For the selected area:

- Read 5-10 representative files, plus nearby tests/docs.
- Search for repeated patterns across the area.
- Compare against existing standards and local conventions.

Look for patterns that are:

- repeated in multiple files
- project-specific or opinionated
- easy for a new agent/developer to miss
- important for correctness, maintainability, design consistency, security, testing, or UX
- supported by concrete file references

Avoid standards that are just "write clean code", framework defaults, or one-off accidents.

## Step 4: Present Candidate Standards

Summarize candidates with evidence:

```text
I found these standards worth documenting:

1. <Name> - <one-line rule> (<evidence paths>)
2. <Name> - <one-line rule> (<evidence paths>)
3. <Name> - <one-line rule> (<evidence paths>)
```

Ask which to document, whether to add another candidate, or whether to skip the area. Wait for the response.

## Step 5: Draft One Standard at a Time

For each selected candidate:

1. Ask 1-2 targeted questions about why the pattern exists, common mistakes, and exceptions.
2. Draft a concise standard.
3. Ask for confirmation before writing.
4. Write or update the markdown file.
5. Update `docs/standards/index.yml`.
6. Then move to the next candidate.

Do not batch all "why" questions up front.

## Standard File Format

Use the repo's existing standard format if one exists. Otherwise use:

````markdown
# <Standard Name>

<Rule first. One or two sentences max.>

## Use This When

- <condition>

## Do

- <specific rule>
- <specific rule>

## Avoid

- <common mistake>

## Example

```<language>
<small example only if it clarifies the rule>
```
````

Keep examples short. Prefer bullets over paragraphs. Include repo-relative evidence paths in a final `## Evidence` section only when it improves trust without bloating the standard.

## Index Update

Keep `docs/standards/index.yml` alphabetized by folder/domain and file slug where practical.

If an existing schema is present, preserve it. If creating the index, use this compact default:

```yaml
standards:
  - path: docs/standards/<folder>/<slug>.md
    description: <short description>
    applies_to:
      - <glob or domain>
    tags:
      - <tag>
```

Descriptions should be one short phrase. `applies_to` can contain globs, directories, or domain labels.

## Final Output

Summarize:

- standards created or updated
- index changes
- evidence inspected
- candidates skipped or deferred
- suggested next area to inspect
