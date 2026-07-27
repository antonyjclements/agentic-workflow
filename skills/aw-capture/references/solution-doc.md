# Solution Doc Reference

Schema, category mapping, and body template for `aw-capture solution`. Read this
only when writing or validating a solution doc.

## Storage

Solution docs live at `docs/solutions/<category>/YYYY-MM-DD-<slug>.md`.

`docs/solutions/` is index-free and self-describing, the same as `docs/brainstorms/`
and `docs/sessions/`: each doc carries its own frontmatter, and `aw-refresh solutions`
globs the tree rather than reading a registry. Do not create `docs/solutions/index.yml`.

`README.md` and `_archived/` are excluded from `aw-refresh solutions` scope.

## Category Mapping

Pick the narrowest category that fits. Create the directory if missing.

| Category | Directory | Use for |
| --- | --- | --- |
| `build` | `docs/solutions/build/` | Compilation, bundling, dependency resolution, toolchain, package manager |
| `runtime` | `docs/solutions/runtime/` | Crashes, exceptions, hangs, memory, unexpected behavior in running code |
| `data` | `docs/solutions/data/` | Migrations, schema, query correctness, data integrity, serialization |
| `integration` | `docs/solutions/integration/` | Third-party APIs, auth flows, webhooks, protocol and contract mismatches |
| `infra` | `docs/solutions/infra/` | CI/CD, deploys, containers, environment and configuration drift |
| `performance` | `docs/solutions/performance/` | Latency, throughput, resource exhaustion, N+1, caching |
| `tooling` | `docs/solutions/tooling/` | Editors, linters, formatters, local dev ergonomics, agent harness setup |
| `patterns` | `docs/solutions/patterns/` | Generalized approaches abstracted from several concrete solutions |

`patterns` is not a fallback. Write there only when the guidance is already
corroborated by more than one concrete solution — `aw-refresh solutions` holds
pattern docs to a higher evidence bar precisely because stale generalized
guidance misleads at scale.

When nothing fits, use `runtime` and say so in the doc rather than inventing a
category.

## Frontmatter Schema

```yaml
title: string              # required, short and searchable
status: enum               # required: active | stale | superseded
created: YYYY-MM-DD        # required
problem_type: enum         # required: bug | misconfiguration | performance |
                           #   integration-failure | data-issue | build-failure |
                           #   environment | knowledge-gap
category: enum             # required, matches the category table above
module: string             # optional, repo area or package
component: string          # optional, narrower unit within the module
tags: [string]             # optional
related: [path]            # optional, repo-relative paths to related docs
superseded_by: path        # required when status is superseded
stale_reason: string       # required when status is stale
stale_date: YYYY-MM-DD     # required when status is stale
```

`status`, `stale_reason`, `stale_date`, and `superseded_by` are written and
maintained by `aw-refresh solutions`. `aw-capture solution` writes `status: active`.

## Body Template

```markdown
---
title: <Short searchable title>
status: active
created: YYYY-MM-DD
problem_type: <enum>
category: <enum>
module: <module>
component: <component>
tags:
  - <tag>
related: []
---

# <Short searchable title>

## Problem

<What was broken or unclear, in one or two sentences.>

## Symptoms

- <Observable signal: error text, failing test, wrong output, timing>

## Root Cause

<The actual cause, not the first suspicion. Distinguish what was verified from
what was inferred.>

## Solution

<What fixed it. Include the concrete change, not just the strategy.>

## Files Changed

- <repo-relative path> — <what changed there>

## Verification

- <command actually run and its outcome>

Say explicitly when verification was not run.

## Prevention

<What would stop this recurring: a test, a standard, a lint rule, a decision, or
a learning. Name the artifact if one was created.>

## Related

- <repo-relative path to a related solution, decision, or standard>
```

## Validation

Before writing, confirm:

- frontmatter parses as YAML and every required field is present
- `category` matches the directory the file is being written to
- enums use the values listed above
- the doc is specific enough that a future agent could act on it without the
  original session
- claims are supported: evidence and inference are distinguishable
- no secrets, credentials, or private customer data appear anywhere
