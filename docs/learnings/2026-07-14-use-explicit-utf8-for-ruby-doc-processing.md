---
title: Use explicit UTF-8 for Ruby doc processing
scope: repo
created: 2026-07-14
trigger: dead-end
status: tentative
evidence-count: 2
unconfirmed-runs: 0
derived-from:
  - docs/sessions/2026-07-02-spec-drift-refresh.md
  - docs/sessions/2026-07-03-self-host-install-verification.md
tags:
  - tooling
  - ruby
  - documentation
---

# Use Explicit UTF-8 For Ruby Doc Processing

## Lesson

Ruby one-liners that read repo markdown can fail under the default US-ASCII encoding because this repository's docs contain typographic characters such as em-dashes. Treat encoding as part of the command when using Ruby for text checks or rewrites.

## Applies When

- Running `ruby -e` checks over markdown, specs, sessions, or workflow docs.
- Adding validation to `scripts/test-install.sh` that reads repository documentation.

## Do Instead

- Pass `-EUTF-8` to Ruby one-liners that read repo text.
- Prefer explicit UTF-8 file reads in longer Ruby scripts.

## Evidence

- A spec frontmatter check failed on the repo's em-dashes under Ruby's default US-ASCII encoding. (docs/sessions/2026-07-02-spec-drift-refresh.md)
- The wiki path validator hit the same Ruby US-ASCII em-dash failure and was fixed with an explicit UTF-8 read. (docs/sessions/2026-07-03-self-host-install-verification.md)
