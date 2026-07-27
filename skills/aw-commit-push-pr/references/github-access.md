# GitHub Access

This skill's steps are written against the `gh` CLI. `gh` is not present in every
harness — Claude Code on the web, sandboxed CI runners, and enterprise environments
frequently expose GitHub through MCP tools instead, or not at all.

## Resolution order

1. **`gh`** — use it when a probe succeeds. Probe once, cheaply:
   `gh auth status` or the `gh pr view` call already in the Context block.
2. **GitHub MCP tools** (`mcp__github__*`) — use when `gh` is missing or
   unauthenticated. In Claude Code the schemas may be deferred; load them with
   `ToolSearch` (for example `select:mcp__github__create_pull_request`) before
   calling.
3. **Neither** — complete the local work (commit, push), then state plainly which
   remote step could not run and why.

Decide once per run and stay on that path. Do not fall back mid-flow and leave half
the work on each side.

## Command mapping

| `gh` command | GitHub MCP equivalent |
| --- | --- |
| `gh pr create --title T --body-file F` | `create_pull_request` (owner, repo, head, base, title, body) |
| `gh pr edit --title T --body-file F` | `update_pull_request` (owner, repo, pullNumber, title, body) |
| `gh pr view --json url,title,state` | `pull_request_read` / `list_pull_requests` filtered by head branch |
| `gh repo view --json defaultBranchRef` | `list_branches`, or read `origin/HEAD` from git |

MCP tools take `owner` and `repo` explicitly where `gh` infers them from the remote.
Derive them from `git remote get-url origin` rather than guessing.

The body is passed as a string parameter, not a file. The `--body-file` indirection
in the `gh` path exists to protect against shell quoting; that risk does not apply to
an MCP call, so pass the body directly and skip the temp file.

## What does not change

- Everything git: `status`, `diff`, `log`, `branch`, `commit`, `push`. These are the
  git binary, not `gh`, and work on every path.
- The content of the PR title and body. How the description is composed is decided
  before this reference matters; only the delivery mechanism differs.
- The confirmation and preview rules. An MCP path is not a reason to skip asking.

## Reporting

Say which path was used when it affects what the user should check — for example
"opened via the GitHub MCP tools" when a `gh`-based follow-up command would not work
for them. Otherwise keep it quiet; the PR URL is the outcome that matters.
