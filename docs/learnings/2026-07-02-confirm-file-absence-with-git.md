---
title: Confirm file absence with git, not filtered shell output
scope: repo
created: 2026-07-02
trigger: dead-end
status: tentative
evidence-count: 1
unconfirmed-runs: 1
derived-from:
  - docs/sessions/2026-07-02-spec-drift-refresh.md
tags:
  - tooling
  - shell
---

# Confirm File Absence With Git, Not Filtered Shell Output

## Lesson

A filtered listing (`ls | grep -v <word>`) can silently hide files whose *names* contain the filter word, making an existing file look missing. In a repo whose filenames routinely contain workflow vocabulary (`index`, `spec`, `review`), name-based filters are unreliable for existence checks.

## Applies When

- Checking whether an expected file (decision record, index entry, artifact) exists.
- Auditing registries or directories with grep-filtered listings.

## Do Instead

- Test existence directly: `ls <exact path>`, `git log --all -- <path>`, or `test -f`.
- If filtering a listing, remember the filter applies to filenames too.

## Evidence

- `ls docs/decisions/ | grep -v index` hid `2026-07-02-remove-brainstorm-index-and-validate-registries.md` because the filename contains "index", triggering a false missing-file investigation. (docs/sessions/2026-07-02-spec-drift-refresh.md)
