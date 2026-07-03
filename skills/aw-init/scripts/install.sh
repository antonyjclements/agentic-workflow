#!/usr/bin/env bash
set -euo pipefail

DEFAULT_REMOTE_SOURCE_URL="https://github.com/antonyjclements/agentic-workflow/archive/refs/heads/main.tar.gz"

usage() {
  cat <<'USAGE'
Install agentic-workflow globally and into a target repository.

Usage:
  install.sh [--repo PATH] [--skills-dir PATH] [--learnings-dir PATH] [--force] [--skip-skills] [--skip-skill-links] [--skip-repo] [--with-gates] [--remote] [--source-url URL]

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
  4. Creates repo-local docs/product/prds, docs/brainstorms, docs/features, docs/standards, docs/decisions, docs/learnings, docs/sessions, and docs/workflow config if missing.
  5. Writes .agentic-workflow-version.
  6. Creates global ~/.agents/learnings/index.yml if missing.
  7. Installs .claude/hooks/log-session.sh and merges a Stop hook into .claude/settings.json for automatic session logging (Claude Code only).
  8. With --with-gates, installs the deterministic .scripts/aw-gate.js helper (freshness gates, telemetry, org-knowledge sync) and gitignores its per-checkout state.
  9. Prints recommended next steps.

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
with_gates=0
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
    --with-gates)
      with_gates=1
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

  # Remove all existing aw-* skills so stale or removed skills never linger
  # across upgrades. The current skill set is written fresh below.
  for existing in "$skills_dir"/aw-*; do
    [ -d "$existing" ] || continue
    rm -rf "$existing"
    echo "skill removed: $(basename "$existing")"
  done

  # Remove retired skills that carried a different prefix
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
    ce-worktree; do
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
  write_file_if_missing "$repo_dir/docs/features/index.yml" "features: []"
  write_file_if_missing "$repo_dir/docs/standards/index.yml" "standards:
  - path: docs/standards/coding-approach.md
    title: Coding Approach
    tags:
      - implementation
      - simplicity
      - code-quality"
  copy_prompted "$artifact_dir/coding-approach.md" "$repo_dir/docs/standards/coding-approach.md"
  write_file_if_missing "$repo_dir/docs/decisions/index.yml" "decisions: []"
  write_file_if_missing "$repo_dir/docs/learnings/index.yml" "learnings: []"
  copy_prompted "$artifact_dir/workflow-readme.md" "$repo_dir/docs/workflow/README.md"
  copy_prompted "$artifact_dir/field-guide.md" "$repo_dir/docs/workflow/field-guide.md"
  write_file_if_missing "$repo_dir/docs/workflow/config.yml" "workflow:
  implementation:
    test_policy: acceptance-first
  steps:
    prd:
      skill: \"\"
    brainstorm:
      skill: \"\"
    create_spec:
      skill: \"\"
    request_human_review:
      skill: \"\"
    plan:
      skill: \"\"
    review:
      skill: \"\"
    create_tickets:
      skill: \"\"
    work:
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
    refresh:
      skill: \"\"
    debug:
      skill: \"\"
    create_worktree:
      skill: \"\"
    capture:
      skill: \"\"
    discover_standards:
      skill: \"\"
    research_slack:
      skill: \"\"
    resolve_pr_feedback:
      skill: \"\"
    synthesize_memory:
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
    reviewers: []
gates:
  enabled: false
  state_file: .aw-gate-state.json
  checks:
    review:
      max_age_hours: 24
    capture:
      max_age_hours: 168
    check_workflow_compliance:
      max_age_hours: 24
telemetry:
  enabled: false
  path: docs/metrics/events.jsonl
  rotation: monthly
  retention_months: 12
org_knowledge:
  source: \"\"
  ref: main
  cache_dir: .aw-org-cache
  paths:
    learnings: learnings
    standards: standards"
}

install_gate_script() {
  local dest="$repo_dir/.scripts/aw-gate.js"
  local src="$artifact_dir/aw-gate.js"
  if [ ! -f "$src" ]; then
    echo "gates skip: aw-gate.js not found at $src"
    return 0
  fi
  mkdir -p "$repo_dir/.scripts"
  if prompt_overwrite "$dest"; then
    cp "$src" "$dest"
    chmod +x "$dest"
    echo "write: $dest"
  fi

  # The freshness state file and org cache are per-checkout, never committed.
  local gitignore="$repo_dir/.gitignore"
  for entry in ".aw-gate-state.json" ".aw-org-cache/"; do
    if [ ! -f "$gitignore" ] || ! grep -Fqx "$entry" "$gitignore"; then
      printf '%s\n' "$entry" >> "$gitignore"
      echo "gitignore: $entry"
    fi
  done

  # Telemetry logs are append-only and git-tracked; the union merge driver keeps
  # both sides' lines instead of conflicting when branches merge.
  local gitattributes="$repo_dir/.gitattributes"
  local attr_line="docs/metrics/events*.jsonl merge=union"
  if [ ! -f "$gitattributes" ] || ! grep -Fqx "$attr_line" "$gitattributes"; then
    printf '%s\n' "$attr_line" >> "$gitattributes"
    echo "gitattributes: $attr_line"
  fi
}

install_global_learnings() {
  write_file_if_missing "$learnings_dir/index.yml" "learnings: []"
}

install_claude_hooks() {
  if ! command -v python3 >/dev/null 2>&1; then
    echo "hooks skip: python3 not available for .claude/settings.json merge"
    return 0
  fi

  local hook_src="$source_dir/skills/aw-init/hooks/log-session.sh"
  if [ ! -f "$hook_src" ]; then
    echo "hooks skip: log-session.sh not found at $hook_src"
    return 0
  fi

  local hook_dest="$repo_dir/.claude/hooks/log-session.sh"
  mkdir -p "$(dirname "$hook_dest")"
  if prompt_overwrite "$hook_dest"; then
    cp "$hook_src" "$hook_dest"
    chmod +x "$hook_dest"
    echo "write: $hook_dest"
  fi

  local settings_file="$repo_dir/.claude/settings.json"
  mkdir -p "$(dirname "$settings_file")"

  local result
  result=$(python3 - "$settings_file" '$CLAUDE_PROJECT_DIR/.claude/hooks/log-session.sh' <<'PYEOF'
import json, sys

settings_path = sys.argv[1]
hook_cmd = sys.argv[2]

try:
    with open(settings_path) as f:
        settings = json.load(f)
except Exception:
    settings = {}

hooks = settings.setdefault("hooks", {})
stop_hooks = hooks.setdefault("Stop", [])

already_present = any(
    any(h.get("command") == hook_cmd for h in entry.get("hooks", []))
    for entry in stop_hooks
)

if not already_present:
    stop_hooks.append({"hooks": [{"type": "command", "command": hook_cmd}]})
    with open(settings_path, "w") as f:
        json.dump(settings, f, indent=2)
        f.write("\n")
    print("merged")
else:
    print("already-present")
PYEOF
  )

  case "$result" in
    merged)          echo "write: $settings_file (Stop hook added)" ;;
    already-present) echo "preserve: $settings_file (Stop hook already present)" ;;
    *)               echo "hooks warning: unexpected result merging $settings_file: $result" ;;
  esac
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
  install_claude_hooks
  if [ "$with_gates" -eq 1 ]; then
    install_gate_script
  fi
fi

install_global_learnings

cat <<EOF

Installed agentic-workflow.

Global skills: $skills_dir
Global learnings: $learnings_dir
Target repo:   $repo_dir

Next steps:
1. Read docs/workflow/field-guide.md — step-by-step guide on which skills to run for bug fixes, new features, refactors, and more, by team size.
2. Not sure which skill fits your situation? Use aw-help for an interactive recommendation.
3. Review AGENTS.md and CLAUDE.md for workflow routing details.
4. Configure docs/workflow/config.yml for workflow step overrides, implementation test policy, commit messages, PR templates, human reviewers, and CI monitoring.
   Set workflow.steps.monitor_pipeline.skill to enable post-PR CI monitoring for your provider (GitHub Actions, CircleCI, Jenkins, etc.).
5. If this is an existing install with an older docs/workflow/config.yml, run:
   skills/aw-init/scripts/upgrade.sh --repo $repo_dir --dry-run
6. Keep README.md updated when setup, commands, configuration, architecture, or workflow behavior changes.
7. Session logging is automatic for Claude Code: .claude/hooks/log-session.sh fires when each session ends.
   Run aw-synthesize-memory periodically to distill session logs into learnings and refresh docs/context/wiki.md.
   Other agents (Codex, Codeium, Windsurf) can invoke aw-capture session manually; the session log format is cross-agent.
8. Optional enforcement, telemetry, and org knowledge (see docs/workflow/README.md):
   Re-run install with --with-gates to add .scripts/aw-gate.js. Set gates.enabled/telemetry.enabled/org_knowledge.source
   in docs/workflow/config.yml, then wire \`node .scripts/aw-gate.js check\` into a pre-push hook or CI job.
EOF
