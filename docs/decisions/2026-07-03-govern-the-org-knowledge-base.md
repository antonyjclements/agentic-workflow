---
title: Govern the org knowledge base with a single accountable owner
date: 2026-07-03
status: active
tags:
  - workflow
  - knowledge
  - governance
related_specs:
  - docs/features/agentic-workflow/spec.md
supersedes: []
---

# Govern the org knowledge base with a single accountable owner

## Context

The org-shared knowledge tier ([[add-enforcement-gates-telemetry-org-knowledge]])
is a git repo of learnings and standards that every subscribing repo reads and
every agent is steered by. Unlike a repo-local doc, one edit fans out across many
repos at once. The original design shipped only the plumbing — sync, read,
repo-local precedence, `ref` pinning — with no answer for authority, freshness, or
ownership. A review flagged the risk: a stale or one-team-opinion standard silently
steering agents org-wide, with nobody accountable, is the highest-blast-radius,
lowest-visibility failure mode in the system.

## Decision

Treat the org base as **governed content, not just a synced folder**, enforced by
process around the repo rather than by the tool:

- **One accountable owner** — a senior lead or distinguished engineer, named in the
  org repo's `CODEOWNERS`, owns what earns org-wide status, the review cadence, and
  retirement of stale entries. Changes are PR-reviewed, not pushed.
- **Self-describing entries** — every learning/standard carries `authority`
  (advisory | required), `applies_to` (scope), `owner`, `reviewed`/`review_by`
  (freshness), `status`, and a `source` link (provenance).
- **Advisory by default, repo-local always wins** — agents treat org entries as
  advisory unless marked `authority: required`, honor `applies_to`, and surface a
  `required`-vs-local conflict or a stale/ungoverned entry to a human instead of
  applying it silently.
- **Human-gated promotion** — a repo-local learning earns org-wide status only via
  a PR to the org base; skills read the org tier read-only and never write to it.
- **Change control for consumers** — pin `org_knowledge.ref` to a reviewed tag.

The full model and copyable templates (`CODEOWNERS`, `GOVERNANCE.md`, entry
frontmatter) live in `docs/workflow/org-knowledge.md`; a summary ships in the
installed `docs/workflow/README.md`, and the behavior rules are stated inline in
`AGENTS.md` and the consuming skills.

## Consequences

- The org tier gains an authority and freshness model without adding enforcement
  code — governance is ownership, review, and metadata, which the tool cannot and
  should not enforce.
- Agents that read the org tier (`aw-capture`, `aw-synthesize-memory`,
  `aw-discover-standards`) now apply precedence, authority, applicability, and
  staleness rules rather than trusting org content blindly.
- Standing up an org base now has a defined setup (owner, CODEOWNERS,
  GOVERNANCE.md, entry metadata) rather than "point at any git repo."

## Alternatives Considered

- **Leave it as plumbing.** Rejected: an ungoverned org base is a silent,
  high-blast-radius failure mode.
- **Enforce governance in the tool** (e.g. reject entries without metadata).
  Rejected: governance is a human/ownership concern; baking policy into
  `aw-gate.js` would overreach and still not supply accountability.
- **Auto-promote recurring patterns to the org base.** Rejected: promotion must be
  human-reviewed; automatic writes to org-wide content are exactly the risk.

## Links

- docs/workflow/org-knowledge.md
- docs/workflow/README.md (Org-shared knowledge)
- docs/decisions/2026-07-03-add-enforcement-gates-telemetry-org-knowledge.md
