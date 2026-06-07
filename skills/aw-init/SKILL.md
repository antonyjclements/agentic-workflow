---
name: aw-init
description: "Install the agentic-workflow repo-local files into any target repository. Use when the user says initialize agentic workflow, install AGENTS.md/CLAUDE.md, setup this repo for agentic workflow, or wants the workflow directory structure created."
argument-hint: "[optional target repo path]"
---

# Initialize Agentic Workflow

Install repo-local agentic-workflow files into a target repository.

## Bundled Files

- `scripts/install.sh` installs the workflow.
- `artifacts/AGENTS.md` is the portable agent routing file.
- `artifacts/CLAUDE.md` contains `@AGENTS.md` for Claude Code compatibility.

## Workflow

1. Resolve the target repo. Use the user-provided path or the current working directory.
2. Run the bundled installer:

```bash
<skill-dir>/scripts/install.sh --repo <target-repo>
```

3. The bundled installer is the source of truth. It installs skills globally when a skills source is available, links supported runtimes, and installs repo-local artifacts.
   - When running from an installed `aw-init` skill without a local `agentic-workflow` clone, use `--remote`.
   - Use `--source-url` to pin a GitHub branch/tag archive or internal mirror.
4. If `AGENTS.md` or `CLAUDE.md` already exists, the script prompts before overriding unless `--force` is passed.
5. After install, summarize changed/preserved files and next steps.

## Rules

- Do not overwrite existing `AGENTS.md` or `CLAUDE.md` without user confirmation.
- Keep `AGENTS.md` and `CLAUDE.md` at the repo root.
- Preserve existing docs indexes and workflow config unless explicitly forced.
- If the repo already has feature specs, recommend `aw-index-features`.
- If the repo has an external PRD to import, recommend `aw-import-prd` as the first workflow step.
- If the user wants to author a PRD from an idea or notes, recommend `aw-create-prd`.
