#!/usr/bin/env bash
set -euo pipefail

AGENTIC_WORKFLOW_VERSION="0.1.0"

usage() {
  cat <<'USAGE'
Install agentic-workflow globally and into a target repository.

Usage:
  install.sh [--repo PATH] [--skills-dir PATH] [--learnings-dir PATH] [--force] [--skip-skills] [--skip-skill-links] [--skip-repo]

Defaults:
  --repo          current directory
  --skills-dir    ~/.agents/skills
  --learnings-dir ~/.agents/learnings
  skill links     ~/.claude/skills, ~/.codeium/skills, ~/.windsurf/skills

What it does:
  1. Installs skills globally when a skills source is available.
  2. Installs AGENTS.md and CLAUDE.md into the repo root.
  3. Symlinks Claude Code, Codeium, and Windsurf skill dirs to the global skills directory when safe.
  4. Creates repo-local docs/product/prds, docs/brainstorms, docs/features, docs/standards, docs/decisions, docs/learnings, and docs/workflow config if missing.
  5. Writes .agentic-workflow-version.
  6. Creates global ~/.agents/learnings/index.yml if missing.
  7. Prints recommended next steps.

Existing files are preserved unless --force is passed.
Existing non-symlink skill directories are always preserved.
USAGE
}

repo_dir="$(pwd)"
skills_dir="${AGENTIC_WORKFLOW_SKILLS_DIR:-$HOME/.agents/skills}"
learnings_dir="${AGENTIC_WORKFLOW_LEARNINGS_DIR:-$HOME/.agents/learnings}"
force=0
skip_skills=0
skip_skill_links=0
skip_repo=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --repo)
      [ "$#" -ge 2 ] || { echo "Missing value for --repo" >&2; exit 2; }
      repo_dir="$2"
      shift 2
      ;;
    --skills-dir)
      [ "$#" -ge 2 ] || { echo "Missing value for --skills-dir" >&2; exit 2; }
      skills_dir="$2"
      shift 2
      ;;
    --learnings-dir)
      [ "$#" -ge 2 ] || { echo "Missing value for --learnings-dir" >&2; exit 2; }
      learnings_dir="$2"
      shift 2
      ;;
    --force)
      force=1
      shift
      ;;
    --skip-skills)
      skip_skills=1
      shift
      ;;
    --skip-skill-links)
      skip_skill_links=1
      shift
      ;;
    --skip-repo)
      skip_repo=1
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
source_dir="$(cd "$script_dir/../../.." && pwd)"

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

install_skills() {
  local source_skills_dir=""

  if [ -d "$source_dir/skills" ]; then
    source_skills_dir="$source_dir/skills"
  elif [ -d "$(dirname "$skill_dir")" ]; then
    source_skills_dir="$(dirname "$skill_dir")"
  fi

  mkdir -p "$skills_dir"

  for deprecated_skill in \
    lfg \
    ce-agent-native-architecture \
    ce-agent-native-audit \
    ce-clean-gone-branches \
    ce-demo-reel \
    ce-dhh-rails-style \
    ce-frontend-design \
    ce-gemini-imagegen \
    ce-ideate \
    ce-optimize \
    ce-polish-beta \
    ce-product-pulse \
    ce-proof \
    ce-release-notes \
    ce-report-bug \
    ce-riffrec-feedback-analysis \
    ce-sessions \
    ce-setup \
    ce-strategy \
    ce-test-xcode \
    ce-update \
    ce-work-beta; do
    if [ -e "$skills_dir/$deprecated_skill" ]; then
      rm -rf "$skills_dir/$deprecated_skill"
      echo "skill removed: $deprecated_skill"
    fi
  done

  if [ -z "$source_skills_dir" ]; then
    echo "skills preserve: no source skills directory found"
    return 0
  fi

  if [ "$(cd "$source_skills_dir" && pwd)" = "$(cd "$skills_dir" && pwd)" ]; then
    echo "skills preserve: $skills_dir"
    return 0
  fi

  for skill_path in "$source_skills_dir"/*; do
    [ -d "$skill_path" ] || continue
    [ -f "$skill_path/SKILL.md" ] || continue
    local skill_name
    local dest
    skill_name="$(basename "$skill_path")"
    dest="$skills_dir/$skill_name"
    rm -rf "$dest"
    mkdir -p "$(dirname "$dest")"
    cp -R "$skill_path" "$dest"
    echo "skill: $skill_name -> $dest"
  done
}

link_skill_dir() {
  local link_path="$1"
  mkdir -p "$(dirname "$link_path")"

  if [ -L "$link_path" ]; then
    local current_target
    current_target="$(readlink "$link_path")"
    if [ "$current_target" = "$skills_dir" ]; then
      echo "skill-link preserve: $link_path -> $skills_dir"
      return 0
    fi
    if [ "$force" -eq 1 ]; then
      rm "$link_path"
      ln -s "$skills_dir" "$link_path"
      echo "skill-link: $link_path -> $skills_dir"
      return 0
    fi
    echo "skill-link preserve: $link_path -> $current_target"
    return 0
  fi

  if [ -e "$link_path" ]; then
    echo "skill-link preserve existing non-symlink: $link_path"
    return 0
  fi

  ln -s "$skills_dir" "$link_path"
  echo "skill-link: $link_path -> $skills_dir"
}

install_skill_links() {
  mkdir -p "$skills_dir"
  link_skill_dir "$HOME/.claude/skills"
  link_skill_dir "$HOME/.codeium/skills"
  link_skill_dir "$HOME/.windsurf/skills"
}

install_repo_files() {
  mkdir -p "$repo_dir"

  copy_prompted "$artifact_dir/AGENTS.md" "$repo_dir/AGENTS.md"
  copy_prompted "$artifact_dir/CLAUDE.md" "$repo_dir/CLAUDE.md"

  write_file_if_missing "$repo_dir/.agentic-workflow-version" "$AGENTIC_WORKFLOW_VERSION"
  write_file_if_missing "$repo_dir/docs/product/prds/index.yml" "prds: []"
  write_file_if_missing "$repo_dir/docs/brainstorms/index.yml" "brainstorms: []"
  write_file_if_missing "$repo_dir/docs/features/index.yml" "features: []"
  write_file_if_missing "$repo_dir/docs/standards/index.yml" "standards: []"
  write_file_if_missing "$repo_dir/docs/decisions/index.yml" "decisions: []"
  write_file_if_missing "$repo_dir/docs/learnings/index.yml" "learnings: []"
  write_file_if_missing "$repo_dir/docs/workflow/config.yml" "ticket_creation:
  provider: manual
  skill: \"\"
  project_key: \"\"
  team: \"\"
  default_labels: []
  default_priority: \"\"
  story_template: default
research:
  slack:
    provider: manual
    skill: \"\"
    workspace: \"\"
    default_channels: []
pull_request:
  creation:
    provider: default
    skill: \"\"
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
    max_attempts: 3
    poll_interval_seconds: 30
    circleci:
      vcs: github
      org: \"\"
      project: \"\"
      branch: \"\"
      token_env: CIRCLECI_CLI_TOKEN
human_review:
  spec:
    reviewers: []
  plan:
    reviewers: []"
}

install_global_learnings() {
  write_file_if_missing "$learnings_dir/index.yml" "learnings: []"
}

if [ "$skip_skills" -ne 1 ]; then
  install_skills
  if [ "$skip_skill_links" -ne 1 ]; then
    install_skill_links
  fi
fi

if [ "$skip_repo" -ne 1 ]; then
  install_repo_files
fi

install_global_learnings

cat <<EOF

Installed agentic-workflow.

Global skills: $skills_dir
Global learnings: $learnings_dir
Target repo:   $repo_dir

Next steps:
1. Review AGENTS.md and CLAUDE.md.
2. Configure docs/workflow/config.yml for commit messages, ticket creation, PR creation, human reviewers, and CI monitoring.
   For CircleCI, set post_pr.ci_monitor.provider=circleci and skill=ce-monitor-circleci.
3. If this repo already has docs/features/*/spec.md, run: ce-index-features
4. If starting from a PRD, run: ce-import-prd
5. Continue the handoff chain: ce-brainstorm -> ce-spec-create -> ce-plan -> ce-create-tickets or ce-work.
6. Keep README.md updated when setup, commands, configuration, architecture, or workflow behavior changes.
EOF
