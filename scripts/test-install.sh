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

assert_repo_install() {
  local target_repo="$1"

  assert_file "$target_repo/AGENTS.md"
  assert_file "$target_repo/CLAUDE.md"
  assert_file "$target_repo/.agentic-workflow-version"
  assert_file "$target_repo/docs/product/prds/index.yml"
  assert_file "$target_repo/docs/product/prds/template.md"
  assert_file "$target_repo/docs/brainstorms/index.yml"
  assert_file "$target_repo/docs/features/index.yml"
  assert_file "$target_repo/docs/standards/index.yml"
  assert_file "$target_repo/docs/decisions/index.yml"
  assert_file "$target_repo/docs/learnings/index.yml"
  assert_file "$target_repo/docs/workflow/config.yml"
}

aw_init_target="$tmp_root/aw-init-target"

"$repo_root/skills/aw-init/scripts/install.sh" \
  --repo "$aw_init_target" \
  --force

assert_repo_install "$aw_init_target"

bundled_skill="$tmp_root/bundled-skill"
bundled_target="$tmp_root/bundled-target"
mkdir -p "$bundled_skill"
cp -R "$repo_root/skills/aw-init/." "$bundled_skill"

"$bundled_skill/scripts/install.sh" \
  --repo "$bundled_target" \
  --force

assert_repo_install "$bundled_target"

echo "installer smoke test passed"
