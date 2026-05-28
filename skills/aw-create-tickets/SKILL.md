---
name: aw-create-tickets
description: "Create implementation tickets or stories from a plan using the repo-configured ticket creation skill. Use when the user says create stories, create tickets, turn this plan into Linear/Jira tickets, or after aw-plan when work should be queued for agents."
argument-hint: "[plan path, spec path, or feature scope]"
---

# Create Tickets

Turn a plan into implementation tickets using the ticket system configured by the repo.

## Configuration

Read `docs/workflow/config.yml` first. Use:

```yaml
ticket_creation:
  skill: <skill-name>
```

If `ticket_creation.skill` is blank, skip ticket creation and report that ticketing is disabled for this repo. If the config file is missing, treat ticket creation as disabled and offer to create the config only when the user wants ticketing enabled.

## Workflow

1. Resolve the source plan. Prefer the user-provided plan; otherwise use the latest active `docs/features/*/plan.md`.
2. Read relevant specs, decisions, and standards referenced by the plan.
3. Split implementation units into independently assignable tickets.
4. Preserve traceability in every ticket:
   - source spec
   - source plan
   - acceptance criteria
   - key files or areas
   - dependencies/order
   - test expectations
   - relevant standards and decisions
   - implementation entrypoint: `aw-work <ticket ID or URL>`
   - note that a future agent may start from this ticket alone after checking out the repo
5. If `ticket_creation.skill` is blank, stop after reporting the proposed ticket split and explain that no tickets were created because ticketing is disabled.
6. Otherwise invoke the configured `ticket_creation.skill`.
7. Report created ticket IDs/URLs and the recommended first ticket ID/URL to pass to `aw-work`.

## Ticket Shape

Use the target tool's native fields when available. Each ticket should include:

- concise title
- outcome-focused description
- acceptance criteria
- implementation notes only where useful
- links to spec, plan, decisions, and standards
- labels/components/priority when the plan or target ticket tool implies them

## Rules

- Do not create tickets for unresolved product questions; surface blockers first.
- Keep tickets small enough for an agent to implement and verify independently.
- Do not duplicate the whole plan into every ticket.
- Blank `ticket_creation.skill` is an intentional opt-out; do not ask the user to choose a ticket tool unless they asked to enable ticketing.
- If Linear/Jira access is unavailable, draft the ticket set in markdown and explain what remains blocked.
