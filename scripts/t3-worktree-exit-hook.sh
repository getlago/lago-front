#!/usr/bin/env bash
set -euo pipefail

# PreToolUse(ExitWorktree) hook: tears down the T3 worktree's front container
# if one was started with `lago-worktree.sh t3-up` (opt-in — most worktrees
# never have one, and t3-down is a no-op when there's nothing to tear down).
#
# Must run BEFORE removal, not after: a running container holds the worktree
# directory as a bind mount, and ExitWorktree's own `git worktree remove` fails
# ("could not remove it — kept") while that mount is live. A PostToolUse hook
# fires too late to prevent that failure — confirmed by testing.
#
# Only on a real removal: "keep" leaves the worktree (and any container) alive
# for a later session. The worktree path is `cwd` (this hook's payload, not the
# tool's own tool_input) — the session is still inside the worktree being
# exited when PreToolUse fires.

payload="$(cat)"
action="$(printf '%s' "$payload" | jq -r '.tool_input.action // empty')"
[[ "$action" == "remove" ]] || exit 0

worktree_path="$(printf '%s' "$payload" | jq -r '.cwd // empty')"
[[ -n "$worktree_path" ]] || exit 0

name="$(basename "$worktree_path")"
"$(dirname "$0")/lago-worktree.sh" t3-down "$name" 2>/dev/null || true
