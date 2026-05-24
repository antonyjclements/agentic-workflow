#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Install agentic-workflow globally and into a repository.

Usage:
  scripts/install.sh [--repo PATH] [--skills-dir PATH] [--learnings-dir PATH] [--force] [--skip-skills] [--skip-repo]

Defaults:
  --repo          current directory
  --skills-dir    ~/.agents/skills
  --learnings-dir ~/.agents/learnings

What it does:
  1. Installs skills/* globally into the skills directory.
  2. Copies AGENTS.md into the target repo.
  3. Creates repo-local docs/standards/index.yml and docs/learnings/index.yml if missing.
  4. Creates global ~/.agents/learnings/index.yml if missing.

Existing files are preserved unless --force is passed.
USAGE
}

repo_dir="$(pwd)"
skills_dir="${AGENTIC_WORKFLOW_SKILLS_DIR:-$HOME/.agents/skills}"
learnings_dir="${AGENTIC_WORKFLOW_LEARNINGS_DIR:-$HOME/.agents/learnings}"
force=0
skip_skills=0
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
source_dir="$(cd "$script_dir/.." && pwd)"

copy_file() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [ -e "$dest" ] && [ "$force" -ne 1 ]; then
    echo "preserve: $dest"
    return 0
  fi
  cp "$src" "$dest"
  echo "write: $dest"
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
  mkdir -p "$skills_dir"
  for skill_path in "$source_dir"/skills/*; do
    [ -d "$skill_path" ] || continue
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

install_repo_files() {
  mkdir -p "$repo_dir"
  copy_file "$source_dir/AGENTS.md" "$repo_dir/AGENTS.md"

  write_file_if_missing "$repo_dir/docs/standards/index.yml" "standards: []"
  write_file_if_missing "$repo_dir/docs/learnings/index.yml" "learnings: []"
}

install_global_learnings() {
  write_file_if_missing "$learnings_dir/index.yml" "learnings: []"
}

if [ "$skip_skills" -ne 1 ]; then
  install_skills
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
EOF
