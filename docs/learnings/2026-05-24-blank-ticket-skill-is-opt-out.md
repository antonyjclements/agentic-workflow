---
title: Blank ticket skill is an opt-out
scope: repo
created: 2026-05-24
trigger: correction
status: active
evidence-count: 1
unconfirmed-runs: 0
derived-from: []
tags:
  - workflow
  - tickets
  - configuration
---

# Blank Ticket Skill Is an Opt-Out

## Lesson

When `workflow.steps.create_tickets.skill` is blank in `docs/workflow/config.yml`, treat external ticket creation as disabled instead of asking the user to choose a ticketing skill.

## Applies When

- Creating stories or tickets from a plan.
- Installing or documenting the default workflow config.

## Do Instead

- Skip ticket creation and report that ticketing is disabled.
- Ask for a ticket skill only when the user explicitly wants ticketing enabled or a configured skill is unavailable.

## Evidence

- User clarified that if the ticket creation skill is left blank, ticket creation can be skipped.
