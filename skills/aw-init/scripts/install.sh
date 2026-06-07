#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REMOTE_SOURCE_URL="https://github.com/antonyjclements/agentic-workflow/archive/refs/heads/main.tar.gz"

usage() {
  cat <<'USAGE'
Install agentic-workflow globally and into a target repository.

Usage:
  install.sh [--repo PATH] [--skills-dir PATH] [--learnings-dir PATH] [--force] [--skip-skills] [--skip-skill-links] [--skip-repo] [--remote] [--source-url URL]

Defaults:
  --repo          current directory
  --skills-dir    ~/.agents/skills
  --learnings-dir ~/.agents/learnings
  --source-url    https://github.com/antonyjclements/agentic-workflow/archive/refs/heads/main.tar.gz
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
Use --remote or --source-url when running from an installed aw-init skill without a local agentic-workflow clone.
USAGE
}

repo_dir="$(pwd)"
skills_dir="${AGENTIC_WORKFLOW_SKILLS_DIR:-$HOME/.agents/skills}"
learnings_dir="${AGENTIC_WORKFLOW_LEARNINGS_DIR:-$HOME/.agents/learnings}"
force=0
skip_skills=0
skip_skill_links=0
skip_repo=0
use_remote=0
source_url="${AGENTIC_WORKFLOW_SOURCE_URL:-}"
remote_tmp_dir=""

cleanup() {
  if [ -n "$remote_tmp_dir" ] && [ -d "$remote_tmp_dir" ]; then
    rm -rf "$remote_tmp_dir"
  fi
}
trap cleanup EXIT

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
    --remote)
      use_remote=1
      if [ -z "$source_url" ]; then
        source_url="$DEFAULT_REMOTE_SOURCE_URL"
      fi
      shift
      ;;
    --source-url)
      [ "$#" -ge 2 ] || { echo "Missing value for --source-url" >&2; exit 2; }
      source_url="$2"
      use_remote=1
      shift 2
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

fetch_remote_source() {
  local url="$1"
  remote_tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-source.XXXXXX")"
  local archive="$remote_tmp_dir/source.tar.gz"
  local extract_dir="$remote_tmp_dir/extract"
  mkdir -p "$extract_dir"

  case "$url" in
    file://*)
      cp "${url#file://}" "$archive"
      ;;
    /*|.*)
      cp "$url" "$archive"
      ;;
    *)
      command -v curl >/dev/null 2>&1 || {
        echo "remote source requires curl for URL: $url" >&2
        exit 1
      }
      curl -fsSL "$url" -o "$archive"
      ;;
  esac

  tar -xzf "$archive" -C "$extract_dir"

  local candidate
  candidate="$(find "$extract_dir" -maxdepth 3 -type d -name skills -print -quit)"
  if [ -z "$candidate" ]; then
    echo "remote source did not contain a skills directory: $url" >&2
    exit 1
  fi

  source_dir="$(cd "$(dirname "$candidate")" && pwd)"
  skill_dir="$source_dir/skills/aw-init"
  artifact_dir="$skill_dir/artifacts"
  echo "remote source: $url -> $source_dir"
}

resolve_source() {
  if [ "$use_remote" -eq 1 ]; then
    fetch_remote_source "$source_url"
  fi

  local version_file="$source_dir/aw-version.txt"
  if [ ! -f "$version_file" ]; then
    echo "missing workflow version source: $version_file" >&2
    echo "Run from a current agentic-workflow source tree or use --remote/--source-url." >&2
    exit 1
  fi
  AGENTIC_WORKFLOW_VERSION="$(sed -n '1p' "$version_file" | tr -d '[:space:]')"
  if [ -z "$AGENTIC_WORKFLOW_VERSION" ]; then
    echo "empty workflow version source: $version_file" >&2
    exit 1
  fi

  if [ ! -d "$artifact_dir" ]; then
    echo "missing installer artifacts: $artifact_dir" >&2
    echo "Run from a local agentic-workflow clone or use --remote/--source-url." >&2
    exit 1
  fi
}

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

copy_agents_prompted() {
  local src="$1"
  local dest="$2"
  local temp_file
  temp_file="$(mktemp "${TMPDIR:-/tmp}/agentic-workflow-agents.XXXXXX")"
  sed "s/AGENTIC_WORKFLOW_VERSION=[^ ]*/AGENTIC_WORKFLOW_VERSION=$AGENTIC_WORKFLOW_VERSION/" "$src" > "$temp_file"
  copy_prompted "$temp_file" "$dest"
  rm -f "$temp_file"
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
  cp "$source_dir/aw-version.txt" "$skills_dir/aw-version.txt"
  echo "version: $AGENTIC_WORKFLOW_VERSION -> $skills_dir/aw-version.txt"

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
    ce-work-beta \
    ce-brainstorm \
    ce-code-review \
    ce-commit \
    ce-commit-push-pr \
    ce-compound \
    ce-compound-refresh \
    ce-create-prd \
    ce-create-tickets \
    ce-debug \
    ce-decision-log \
    ce-decisions-refresh \
    ce-discover-standards \
    ce-doc-review \
    ce-dogfood-beta \
    ce-import-prd \
    ce-index-features \
    ce-init \
    ce-monitor-circleci \
    ce-monitor-pipeline \
    ce-plan \
    ce-request-human-review \
    ce-resolve-pr-feedback \
    ce-retrospective \
    ce-simplify-code \
    ce-slack-research \
    ce-spec-create \
    ce-spec-review \
    ce-test-browser \
    ce-work \
    ce-worktree \
    aw-dogfood-beta \
    aw-test-browser \
    aw-code-review \
    aw-compound \
    aw-compound-refresh \
    aw-decision-log \
    aw-decisions-refresh \
    aw-doc-review \
    aw-slack-research \
    aw-spec-create \
    aw-spec-review \
    aw-worktree \
    aw-agent-native-architecture \
    aw-agent-native-audit \
    aw-clean-gone-branches \
    aw-demo-reel \
    aw-dhh-rails-style \
    aw-frontend-design \
    aw-gemini-imagegen \
    aw-ideate \
    aw-optimize \
    aw-polish-beta \
    aw-product-pulse \
    aw-proof \
    aw-release-notes \
    aw-report-bug \
    aw-riffrec-feedback-analysis \
    aw-sessions \
    aw-setup \
    aw-strategy \
    aw-test-xcode \
    aw-update \
    aw-work-beta; do
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

  copy_agents_prompted "$artifact_dir/AGENTS.md" "$repo_dir/AGENTS.md"
  copy_prompted "$artifact_dir/CLAUDE.md" "$repo_dir/CLAUDE.md"

  write_file_if_missing "$repo_dir/.agentic-workflow-version" "$AGENTIC_WORKFLOW_VERSION"
  write_file_if_missing "$repo_dir/docs/product/prds/index.yml" "prds: []"
  copy_prompted "$artifact_dir/prd-template.md" "$repo_dir/docs/product/prds/template.md"
  write_file_if_missing "$repo_dir/docs/brainstorms/index.yml" "brainstorms: []"
  write_file_if_missing "$repo_dir/docs/features/index.yml" "features: []"
  write_file_if_missing "$repo_dir/docs/standards/index.yml" "standards: []"
  write_file_if_missing "$repo_dir/docs/decisions/index.yml" "decisions: []"
  write_file_if_missing "$repo_dir/docs/learnings/index.yml" "learnings: []"
  copy_prompted "$artifact_dir/workflow-readme.md" "$repo_dir/docs/workflow/README.md"
  write_file_if_missing "$repo_dir/docs/workflow/config.yml" "workflow:
  implementation:
    test_policy: acceptance-first
  steps:
    import_prd:
      skill: \"\"
    create_prd:
      skill: \"\"
    brainstorm:
      skill: \"\"
    create_spec:
      skill: \"\"
    review_spec:
      skill: \"\"
    request_human_review:
      skill: \"\"
    plan:
      skill: \"\"
    review_plan:
      skill: \"\"
    create_tickets:
      skill: \"\"
    work:
      skill: \"\"
    review_code:
      skill: \"\"
    check_workflow_compliance:
      skill: \"\"
    commit:
      skill: \"\"
    commit_push_pr:
      skill: \"\"
    monitor_pipeline:
      skill: \"\"
  auxiliary:
    index_features:
      skill: \"\"
    debug:
      skill: \"\"
    create_worktree:
      skill: \"\"
    simplify_code:
      skill: \"\"
    log_decision:
      skill: \"\"
    record_retrospective:
      skill: \"\"
    capture_solution:
      skill: \"\"
    refresh_solutions:
      skill: \"\"
    refresh_decisions:
      skill: \"\"
    discover_standards:
      skill: \"\"
    research_slack:
      skill: \"\"
    clean_artifacts:
      skill: \"\"
    resolve_pr_feedback:
      skill: \"\"
pull_request:
  template:
    title: \"\"
    body: \"\"
git:
  commit:
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
human_review:
  spec:
    reviewers: []
  plan:
    reviewers: []"
}

install_global_learnings() {
  write_file_if_missing "$learnings_dir/index.yml" "learnings: []"
}

resolve_source

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
2. Configure docs/workflow/config.yml for workflow step overrides, implementation test policy, commit messages, PR templates, human reviewers, and CI monitoring.
   For CircleCI, set post_pr.ci_monitor.provider=circleci; aw-monitor-circleci will set up any CircleCI-specific config when needed.
3. If this is an existing install with an older docs/workflow/config.yml, run: aw-upgrade
4. If this repo already has docs/features/*/spec.md, run: aw-index-features
5. If importing an external PRD, run: aw-import-prd. If authoring a PRD from an idea, run: aw-create-prd.
6. Continue the handoff chain: aw-brainstorm -> aw-plan -> aw-create-tickets or aw-work. Use aw-create-spec directly only when requirements are already clear.
7. Keep README.md updated when setup, commands, configuration, architecture, or workflow behavior changes.
EOF
