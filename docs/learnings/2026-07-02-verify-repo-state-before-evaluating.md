---
title: Verify current repo state before evaluating or reviewing
scope: repo
created: 2026-07-02
trigger: correction
status: tentative
evidence-count: 1
unconfirmed-runs: 1
derived-from:
  - docs/sessions/2026-07-02-lightweight-agents-md-and-index-free-registries.md
tags:
  - process
  - evaluation
---

# Verify Current Repo State Before Evaluating or Reviewing

## Lesson

An assessment grounded in a stale checkout or remembered structure produces confidently wrong findings. This repo evolves fast (skills consolidate, files move, registries appear and disappear), so re-verify the working tree before any evaluation, review, or audit.

## Applies When

- Evaluating the operating model, a skill set, or repo structure.
- Reviewing specs or docs for drift.
- Resuming work after any gap in which the branch may have moved.

## Do Instead

- Run `git log --oneline -3` and list the directories under review before forming conclusions.
- Re-read files at their current state rather than relying on earlier reads from the same conversation.

## Evidence

- A full evaluation was delivered against a pre-consolidation skill set (~33 skills); the repo had already consolidated to 20 and added the field guide. The user had to correct: "I think you're looking at an older version?" (docs/sessions/2026-07-02-lightweight-agents-md-and-index-free-registries.md)
