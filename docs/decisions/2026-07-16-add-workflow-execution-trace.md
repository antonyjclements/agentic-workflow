---
title: Add deterministic workflow execution trace
date: 2026-07-16
status: active
tags:
  - workflow
  - enforcement
  - traceability
---

# Add Deterministic Workflow Execution Trace

## Context

Freshness gates prove that configured review, compliance, capture, or synthesis
steps ran recently or against current code. Spec traceability proves claimed
links between requirements, tests, and code. Neither proves which workflow tier
an agent chose, which process steps were intentionally skipped, or which gate
events were part of the execution path.

## Decision

Add an opt-in `workflow_trace` capability to `.scripts/aw-gate.js`.

- `workflow-record` appends structured JSONL breadcrumbs such as selected tier,
  step execution, skipped steps, reasons, and artifact paths.
- `record <gate>` automatically appends a workflow-trace gate event when
  workflow trace is enabled.
- `workflow-check` deterministically validates configured process requirements
  such as a tier event and required gate events.
- The feature is disabled by default and writes to a git-ignored local trace
  file unless a repo explicitly opts in.

## Rationale

Workflow trace makes "was the process followed?" checkable without asking an
LLM to reconstruct the process from memory at the end. Keeping it separate from
freshness gates and spec traceability preserves each tool's boundary: gates say
what ran, spec trace says what code/tests claim to cover, and workflow trace says
which process path was recorded.

## Consequences

Repos can adopt process tracing gradually. The initial checker is deliberately
small: tier selection and required gate events. The trace proves accountability,
not quality; a recorded tier or gate still needs review and human judgment.
