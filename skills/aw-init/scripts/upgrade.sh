#!/usr/bin/env bash
# upgrade.sh — upgrade an existing Augmented Workflow installation
#
# Usage:
#   ./upgrade.sh --repo /path/to/repo [--dry-run]
#   ./upgrade.sh --repo /path/to/repo [--apply] [--force]
#
# What it does:
#   1. Migrates docs/workflow/config.yml from older shapes to the current shape
#      (backs up the previous config before applying)
#   2. Optionally refreshes global skills, AGENTS.md, and CLAUDE.md via install.sh
#
# Options:
#   --repo PATH       Target repo to upgrade (default: current directory)
#   --dry-run         Preview config migration without writing (default)
#   --apply           Apply the config migration
#   --refresh-skills  Also refresh global skills and repo-local agent instructions
#   --force           Overwrite repo-local AGENTS.md and CLAUDE.md when --refresh-skills is set
#   --remote          Fetch latest source from GitHub when refreshing skills
#   --source-url URL  Pin skill refresh to a branch, tag, archive, or internal mirror

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO=""
DRY_RUN=true
REFRESH_SKILLS=false
FORCE=false
REMOTE=false
SOURCE_URL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)       REPO="$2"; shift 2 ;;
    --dry-run)    DRY_RUN=true; shift ;;
    --apply)      DRY_RUN=false; shift ;;
    --refresh-skills) REFRESH_SKILLS=true; shift ;;
    --force)      FORCE=true; shift ;;
    --remote)     REMOTE=true; shift ;;
    --source-url) SOURCE_URL="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

REPO="${REPO:-$PWD}"

if [ ! -d "$REPO" ]; then
  echo "Error: repo path does not exist: $REPO" >&2
  exit 1
fi

MIGRATOR="$SCRIPT_DIR/upgrade-config.rb"
if [ ! -f "$MIGRATOR" ]; then
  echo "Error: config migrator not found at $MIGRATOR" >&2
  exit 1
fi

# Step 1: Config migration
if $DRY_RUN; then
  echo "=== Config migration preview (--dry-run) ==="
  ruby "$MIGRATOR" --repo "$REPO" --dry-run
  echo ""
  echo "To apply: run upgrade.sh --repo '$REPO' --apply"
else
  echo "=== Applying config migration ==="
  ruby "$MIGRATOR" --repo "$REPO" --apply
  echo ""
fi

# Step 2: Skills and artifacts refresh (optional)
if $REFRESH_SKILLS; then
  echo "=== Refreshing global skills and repo-local agent instructions ==="
  INSTALL_ARGS=(--repo "$REPO")
  $FORCE && INSTALL_ARGS+=(--force)
  $REMOTE && INSTALL_ARGS+=(--remote)
  [ -n "$SOURCE_URL" ] && INSTALL_ARGS+=(--source-url "$SOURCE_URL")

  if $DRY_RUN; then
    echo "(Skipping skill refresh in dry-run mode — remove --dry-run to apply)"
  else
    bash "$SCRIPT_DIR/install.sh" "${INSTALL_ARGS[@]}"
  fi
fi

if $DRY_RUN; then
  echo "Dry run complete. Review the output above, then run with --apply to proceed."
fi
