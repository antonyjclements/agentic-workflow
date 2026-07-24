---
title: Session logs are self-describing, hook-independent, and committed as chore exhaust
date: 2026-07-02
status: active
tags:
  - workflow
  - sessions
  - memory-synthesis
  - git
related_specs: []
supersedes: []
---

# Session logs are self-describing, hook-independent, and committed as chore exhaust

## Context

Session logs (`docs/sessions/`) are transient synthesis input with a 14-day retention window. Three friction points emerged:

1. `docs/sessions/index.yml` was appended by every session on every branch, making it a guaranteed merge-conflict magnet during parallel work — the one index whose maintenance cost exceeded its lookup value for a small, transient directory.
2. Session logging leaned on the Claude Code Stop hook, but hooks are disabled or unsupported in many environments (enterprise policy, CI, sandboxed harnesses, other agents), so the loop silently broke there.
3. There was no stated convention for how session logs reach git, risking workflow exhaust polluting feature commits and PRs.

## Decision

1. **Drop `docs/sessions/index.yml`.** Session logs are self-describing: each file carries `status: unprocessed|processed` in its own frontmatter. `aw-synthesize-memory` globs `docs/sessions/*.md` instead of reading an index, marks processed status in the log's frontmatter, and deletes any legacy index it finds. The installer no longer creates the index.
2. **The Stop hook is a convenience, not the system of record.** Agents must offer or run `aw-capture session` at the end of meaningful sessions regardless of whether the hook exists or fired. The hook now detects installation via `.augmented-workflow-version` rather than the removed index.
3. **Session logs are committed as separate chore exhaust.** Never staged into feature/fix commits; `chore(session): log <slug>` per log, one batched `chore(memory): synthesize N sessions` for synthesis output. Logs ride along in PRs as labeled chore commits; squash-merge absorbs them.

## Consequences

- Parallel branches never conflict over a shared sessions index.
- The memory loop works identically in hook-less environments and for non-Claude agents.
- Existing installs keep a stale `docs/sessions/index.yml` until the next synthesis run deletes it.
- Feature diffs stay clean of workflow exhaust; session history remains greppable in git via the `chore(session)` scope.

## Alternatives Considered

- Keep the index with a `merge=union` gitattribute: fixes conflicts but retains derived state that duplicates frontmatter for a ≤14-day transient directory.
- Gitignore session logs locally until synthesis: loses logs across machines and contributors.
- Route session-log commits to a dedicated branch: more ceremony than artifacts that expire in 14 days justify.

## Links

- skills/aw-capture/SKILL.md (session mode, commit convention)
- skills/aw-synthesize-memory/SKILL.md (glob-based discovery, legacy index cleanup)
- skills/aw-init/hooks/log-session.sh (version-marker guard)
