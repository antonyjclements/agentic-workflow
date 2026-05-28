#!/usr/bin/env bash
set -euo pipefail

AGENTIC_WORKFLOW_VERSION="0.2.0"

usage() {
  cat <<'USAGE'
Install agentic-workflow files into a target repository.

Usage:
  install.sh [--repo PATH] [--force]

Defaults:
  --repo current directory

What it does:
  1. Installs AGENTS.md and CLAUDE.md into the repo root.
  2. Creates repo-local docs/product/prds, docs/brainstorms, docs/features, docs/standards, docs/decisions, docs/learnings, and docs/workflow config if missing.
  3. Writes .agentic-workflow-version.
  4. Prints recommended next steps.

Existing files are preserved unless --force is passed.
USAGE
}

repo_dir="$(pwd)"
force=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || { echo "Missing value for --repo" >&2; exit 2; }
      repo_dir="$2"
      shift 2
      ;;
    --force)
      force=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
artifact_dir="$skill_dir/artifacts"

prompt_overwrite() {
  local dest="$1"

  if [ "$force" -eq 1 ] || [ ! -e "$dest" ]; then
    return 0
  fi

  if [ ! -t 0 ]; then
    echo "preserve: $dest (use --force to overwrite)"
    return 1
  fi

  printf 'Overwrite existing %s? [y/N] ' "$dest" >&2
  local answer
  read -r answer
  case "$answer" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      echo "preserve: $dest"
      return 1
      ;;
  esac
}

copy_prompted() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  if prompt_overwrite "$dest"; then
    cp "$src" "$dest"
    echo "write: $dest"
  fi
}

write_file_if_missing() {
  local dest="$1"
  local content="$2"
  mkdir -p "$(dirname "$dest")"
  if [ -e "$dest" ] && [ "$force" -ne 1 ]; then
    echo "preserve: $dest"
    return 0
  fi
  printf '%s\n' "$content" > "$dest"
  echo "write: $dest"
}

install_repo_files() {
  mkdir -p "$repo_dir"

  copy_prompted "$artifact_dir/AGENTS.md" "$repo_dir/AGENTS.md"
  copy_prompted "$artifact_dir/CLAUDE.md" "$repo_dir/CLAUDE.md"

  write_file_if_missing "$repo_dir/.agentic-workflow-version" "$AGENTIC_WORKFLOW_VERSION"
  write_file_if_missing "$repo_dir/docs/product/prds/index.yml" "prds: []"
  copy_prompted "$artifact_dir/prd-template.md" "$repo_dir/docs/product/prds/template.md"
  write_file_if_missing "$repo_dir/docs/brainstorms/index.yml" "brainstorms: []"
  write_file_if_missing "$repo_dir/docs/features/index.yml" "features: []"
  write_file_if_missing "$repo_dir/docs/standards/index.yml" "standards: []"
  write_file_if_missing "$repo_dir/docs/decisions/index.yml" "decisions: []"
  write_file_if_missing "$repo_dir/docs/learnings/index.yml" "learnings: []"
  write_file_if_missing "$repo_dir/docs/workflow/config.yml" "ticket_creation:
  skill: \"\"
research:
  slack:
    skill: \"\"
pull_request:
  template:
    title: \"\"
    body: \"\"
git:
  commit:
    skill: \"\"
    format: conventional
    scope_required: false
    template: \"<type>(<scope>): <description>\"
    allowed_types:
      - feat
      - fix
      - docs
      - chore
      - refactor
      - test
      - ci
      - build
      - perf
      - style
    examples:
      - \"docs(readme): update usage guide\"
post_pr:
  ci_monitor:
    provider: manual
    skill: \"\"
human_review:
  spec:
    reviewers: []
  plan:
    reviewers: []"
}

install_repo_files

cat <<EOF

Installed agentic-workflow.

Target repo:   $repo_dir

Next steps:
1. Review AGENTS.md and CLAUDE.md.
2. Configure docs/workflow/config.yml for commit messages, ticket creation, PR templates, human reviewers, and CI monitoring.
   For CircleCI, set post_pr.ci_monitor.provider=circleci and skill=aw-monitor-circleci; aw-monitor-circleci will set up any CircleCI-specific config when needed.
3. If this repo already has docs/features/*/spec.md, run: aw-index-features
4. If importing an external PRD, run: aw-import-prd. If authoring a PRD from an idea, run: aw-create-prd.
5. Continue the handoff chain: aw-brainstorm -> aw-plan -> aw-create-tickets or aw-work. Use aw-create-spec directly only when requirements are already clear.
6. Keep README.md updated when setup, commands, configuration, architecture, or workflow behavior changes.
EOF
