#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_root="$(mktemp -d "${TMPDIR:-/tmp}/agentic-workflow-install.XXXXXX")"

cleanup() {
  rm -rf "$tmp_root"
}
trap cleanup EXIT

assert_file() {
  local path="$1"
  if [ ! -f "$path" ]; then
    echo "missing expected file: $path" >&2
    exit 1
  fi
}

assert_symlink() {
  local path="$1"
  if [ ! -L "$path" ]; then
    echo "missing expected symlink: $path" >&2
    exit 1
  fi
}

assert_repo_install() {
  local target_repo="$1"

  assert_file "$target_repo/AGENTS.md"
  assert_file "$target_repo/CLAUDE.md"
  assert_file "$target_repo/.agentic-workflow-version"
  assert_file "$target_repo/docs/product/prds/index.yml"
  assert_file "$target_repo/docs/brainstorms/index.yml"
  assert_file "$target_repo/docs/features/index.yml"
  assert_file "$target_repo/docs/standards/index.yml"
  assert_file "$target_repo/docs/decisions/index.yml"
  assert_file "$target_repo/docs/learnings/index.yml"
  assert_file "$target_repo/docs/workflow/config.yml"
}

export HOME="$tmp_root/home"
mkdir -p "$HOME"

ce_init_target="$tmp_root/ce-init-target"
ce_init_skills="$tmp_root/ce-init-skills"
ce_init_learnings="$tmp_root/ce-init-learnings"

"$repo_root/skills/ce-init/scripts/install.sh" \
  --repo "$ce_init_target" \
  --skills-dir "$ce_init_skills" \
  --learnings-dir "$ce_init_learnings" \
  --force

assert_repo_install "$ce_init_target"
assert_file "$ce_init_skills/ce-init/SKILL.md"
assert_file "$ce_init_learnings/index.yml"
assert_symlink "$HOME/.claude/skills"
assert_symlink "$HOME/.codeium/skills"
assert_symlink "$HOME/.windsurf/skills"

bundled_skills="$tmp_root/bundled-skills"
bundled_target="$tmp_root/bundled-target"
bundled_learnings="$tmp_root/bundled-learnings"
mkdir -p "$bundled_skills"
cp -R "$repo_root/skills/ce-init" "$bundled_skills/ce-init"

"$bundled_skills/ce-init/scripts/install.sh" \
  --repo "$bundled_target" \
  --skills-dir "$bundled_skills" \
  --learnings-dir "$bundled_learnings" \
  --force

assert_repo_install "$bundled_target"
assert_file "$bundled_learnings/index.yml"
assert_symlink "$HOME/.claude/skills"
assert_symlink "$HOME/.codeium/skills"
assert_symlink "$HOME/.windsurf/skills"

echo "installer smoke test passed"
