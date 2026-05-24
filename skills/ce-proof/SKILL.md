---
name: ce-proof
description: Run human-in-the-loop review loops over markdown via Proof (proofeditor.ai) — share, view, comment on, edit, and sync collaborative docs. Use when the user says "view this in proof", "share to proof", "HITL this doc", or wants a shared markdown review surface for a spec, plan, or draft, including handoffs from ce-brainstorm, ce-ideate, or ce-plan. Do not trigger on "proof" meaning evidence, math proofs, proof-of-concept, or "proofread this".
allowed-tools:
  - Bash
  - Read
  - Write
  - WebFetch
---

# Proof - Collaborative Markdown Editor

Use Proof for shared markdown review via Web API or local macOS bridge.

## Identity

Default agent identity:

- machine ID / `by` / `X-Agent-Id`: `ai:compound-engineering`
- display name: `Compound Engineering`

Set presence once per document session. Use alternate identity only if an upstream HITL caller explicitly provides one.

## HITL Review

For "share/view/iterate/HITL this markdown in Proof" or handoff from `ce-brainstorm`, `ce-ideate`, or `ce-plan`, load `references/hitl-review.md` and follow it for:

- invocation contract
- mark/comment classification
- idempotent ingest passes
- agreed edits
- terminal reporting
- atomic sync back to disk

Ask which file only when ambiguous.

## Web API

Create share:

```bash
curl -X POST https://www.proofeditor.ai/share/markdown \
  -H "Content-Type: application/json" \
  -d '{"title":"Title","markdown":"# Markdown"}'
```

Use returned `tokenUrl` as the share link. Preserve `slug`, `accessToken`, `ownerSecret`, and `_links`.

Read:

```bash
curl -s -H "Accept: application/json" "https://www.proofeditor.ai/d/{slug}?token=<token>"
curl -s -H "Accept: text/markdown" "https://www.proofeditor.ai/d/{slug}?token=<token>"
curl -s "https://www.proofeditor.ai/api/agent/{slug}/state" -H "x-share-token: <token>"
```

Mutate through `/ops` with proper auth, agent ID, and operation attribution. Prefer server-side filters for comment ingest when available.

## Local Bridge

If using the Proof app bridge, talk to `localhost:9847`. Prefer Web API for sharing unless the user specifically needs local app control.

## Rules

- Do not use browser automation when direct API fetch/mutation is enough.
- Attribute every write.
- Never overwrite local markdown without syncing/validating current Proof state.
- Keep ingest idempotent; do not duplicate comments or edits across passes.
- Preserve frontmatter and markdown structure unless review decisions require changes.
- Report share URL, synced file path, unresolved comments, and any sync failure.
