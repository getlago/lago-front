#!/usr/bin/env bash
# loop-restart.sh — reload the run's front container on the just-built code.
#
# Neither start script cleans the vite cache, and a restart that interrupts a
# running dep-optimization leaves `node_modules/.vite` corrupted (the browser
# gets `504 Outdated Optimize Dep`), so the cache is always cleared first.
#
# Usage: loop-restart.sh <state.md>
#   Reads `container:` from state.md; falls back to deriving it from `layout:`
#   plus `branch:` (worktree layout, the rule lago-worktree uses) or
#   `$CONDUCTOR_WORKSPACE_NAME` (in-place under Conductor).
# Exit 0 always: no container is a one-line warning, never a blocker.
set -euo pipefail

STATE="${1:?state.md path}"
[ -f "$STATE" ] || { echo "loop-restart: $STATE missing — skipping restart"; exit 0; }

field() { sed -nE "s/^$1:[[:space:]]*//p" "$STATE" | head -1; }
san() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g'; }

CT="$(field container)"
if [ -z "$CT" ]; then
  case "$(field layout)" in
    in-place)
      [ -n "${CONDUCTOR_WORKSPACE_NAME:-}" ] && CT="lago_front_ct_$(san "$CONDUCTOR_WORKSPACE_NAME")"
      ;;
    *)
      branch="$(field branch)"
      [ -n "$branch" ] && CT="lago_front_wt_$(san "$branch")"
      ;;
  esac
fi

if [ -z "$CT" ]; then
  echo "loop-restart: no container recorded or derivable — skipping restart"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1 || ! docker ps --format '{{.Names}}' | grep -qx "$CT"; then
  echo "loop-restart: no container $CT (host run mode, --in-place outside Conductor, or app not running) — skipping restart"
  exit 0
fi

docker exec "$CT" sh -c 'rm -rf /app/node_modules/.vite' 2>/dev/null || true
docker restart "$CT" >/dev/null
echo "loop-restart: restarted $CT"
