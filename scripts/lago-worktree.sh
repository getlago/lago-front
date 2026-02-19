#!/usr/bin/env bash
set -euo pipefail

# lago-worktree — Run isolated frontend instances per git worktree
#
# Creates worktrees of the front repo and runs each on a different port.
# Access via http://localhost:<port>. API is always the shared main stack.
#
# Usage:
#   lago-worktree create <branch> [--from <base>]
#   lago-worktree up <name>
#   lago-worktree down <name>
#   lago-worktree destroy <name>
#   lago-worktree ps

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONT_PATH="$(cd "$SCRIPT_DIR/.." && pwd)"
LAGO_PATH="$(cd "$FRONT_PATH/.." && pwd)"
WORKTREE_DIR="$LAGO_PATH/front-worktrees"

# Ports: 3001, 3002, 3003, ...
PORT_START=3001

# --- Helpers ---

slot_file() { echo "$LAGO_PATH/.worktree-slots"; }

find_free_port() {
  local sf
  sf="$(slot_file)"
  touch "$sf"
  for i in $(seq 0 99); do
    local p=$((PORT_START + i))
    if ! grep -q ":${p}:" "$sf" 2>/dev/null && ! lsof -i ":${p}" &>/dev/null; then
      echo "$p"
      return
    fi
  done
  echo "Error: no free port" >&2; exit 1
}

register()   { local sf; sf="$(slot_file)"; touch "$sf"; grep -v "^${1}:" "$sf" > "$sf.tmp" 2>/dev/null || true; mv "$sf.tmp" "$sf"; echo "${1}:${2}:${3}" >> "$sf"; }
unregister() { local sf; sf="$(slot_file)"; if [[ -f "$sf" ]]; then grep -v "^${1}:" "$sf" > "$sf.tmp" 2>/dev/null || true; mv "$sf.tmp" "$sf"; fi; }
get_port()   { local sf; sf="$(slot_file)"; if [[ -f "$sf" ]]; then grep "^${1}:" "$sf" 2>/dev/null | head -1 | cut -d: -f2; fi; true; }
get_base()   { local sf; sf="$(slot_file)"; if [[ -f "$sf" ]]; then local b; b="$(grep "^${1}:" "$sf" 2>/dev/null | head -1 | cut -d: -f3)"; echo "${b:-main}"; else echo "main"; fi; }
sanitize()   { echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g'; }

# --- Commands ---

cmd_create() {
  local branch="" base="main"

  # Parse arguments: <branch> [--from <base>]
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --from=*)
        base="${1#--from=}"
        [[ -z "$base" ]] && { echo "Error: --from requires a branch name." >&2; exit 1; }
        shift ;;
      --from)
        [[ -z "${2:-}" ]] && { echo "Error: --from requires a branch name." >&2; exit 1; }
        base="$2"; shift 2 ;;
      *)
        [[ -z "$branch" ]] && branch="$1" || { echo "Error: unexpected argument '$1'." >&2; exit 1; }
        shift ;;
    esac
  done

  [[ -z "$branch" ]] && { echo "Usage: lago-worktree create <branch> [--from <base>]" >&2; exit 1; }

  local name
  name="$(echo "$branch" | sed 's|/|-|g')"

  # Validate base branch exists locally
  cd "$FRONT_PATH"
  if ! git rev-parse --verify "$base" &>/dev/null; then
    echo "Error: base branch '$base' does not exist locally." >&2; exit 1
  fi

  local wt_path="$WORKTREE_DIR/$name"
  mkdir -p "$WORKTREE_DIR"

  echo "Creating worktree '$name' (branch: $branch, from $base)..."

  # Clean up stale worktree/branch if leftover from a previous run
  git worktree prune 2>/dev/null || true
  git branch -D "$branch" 2>/dev/null || true

  # Create a fresh branch from the base
  git worktree add -b "$branch" "$wt_path" "$base"

  # Copy .env from main front
  if [[ -f "$FRONT_PATH/.env" ]]; then
    cp "$FRONT_PATH/.env" "$wt_path/.env"
  fi

  echo ""
  cmd_up "$name" "$base"
}

cmd_up() {
  local name="${1:-}" base="${2:-}"
  [[ -z "$name" ]] && { echo "Usage: lago-worktree up <name>" >&2; exit 1; }

  local wt_path="$WORKTREE_DIR/$name"
  [[ ! -d "$wt_path" ]] && { echo "Error: $wt_path not found. Run: lago-worktree create <branch> $name" >&2; exit 1; }

  if ! docker ps --format '{{.Names}}' | grep -q 'lago_front_dev'; then
    echo "Error: Main stack not running. Run: lago up -d" >&2; exit 1
  fi

  # Preserve existing base branch when called standalone (not from cmd_create)
  [[ -z "$base" ]] && base="$(get_base "$name")"

  local port san compose_file
  port="$(get_port "$name")"
  [[ -z "$port" ]] && port="$(find_free_port)"
  register "$name" "$port" "$base"
  san="$(sanitize "$name")"
  compose_file="$wt_path/docker-compose.worktree.yml"

  # Patch .env: API calls go through Vite proxy to avoid CORS
  if [[ -f "$wt_path/.env" ]]; then
    sed -i.bak '/^API_URL=/d; /^LAGO_API_PROXY_TARGET=/d' "$wt_path/.env"
    rm -f "$wt_path/.env.bak"
  fi
  {
    echo "API_URL=http://localhost:${port}/api"
    echo "LAGO_API_PROXY_TARGET=http://api:3000"
  } >> "$wt_path/.env"

  # Copy vite.config.ts and .gitignore from main front (has proxy + ignore rules)
  cp "$FRONT_PATH/vite.config.ts" "$wt_path/vite.config.ts"
  cp "$FRONT_PATH/.gitignore" "$wt_path/.gitignore"

  cat > "$compose_file" << YAML
name: lago_fwt_${san}

services:
  front:
    image: front_dev
    pull_policy: never
    container_name: lago_front_wt_${san}
    stdin_open: true
    restart: unless-stopped
    volumes:
      - ${wt_path}:/app:cached
      - front_nm_wt_${san}:/app/node_modules
      - front_dist_wt_${san}:/app/dist
    environment:
      - NODE_ENV=development
      - API_URL=http://localhost:${port}/api
      - LAGO_API_PROXY_TARGET=http://api:3000
      - LAGO_WORKTREE_NAME=${name}
      - APP_DOMAIN=https://app.lago.dev
      - CODEGEN_API=http://api:3000/graphql
      - LAGO_DISABLE_SIGNUP=\${LAGO_DISABLE_SIGNUP:-}
      - LAGO_DISABLE_PDF_GENERATION=\${LAGO_DISABLE_PDF_GENERATION:-false}
      - NANGO_SECRET_KEY=\${NANGO_SECRET_KEY:-}
      - PORT=8080
    ports:
      - "${port}:8080"
    networks:
      - lago_net

volumes:
  front_nm_wt_${san}:
  front_dist_wt_${san}:

networks:
  lago_net:
    external: true
    name: lago_dev_default
YAML

  echo "Starting '$name' on port ${port}..."
  docker compose -f "$compose_file" up -d

  echo ""
  echo "  ✓ http://localhost:${port}  [$name]"
  echo ""
}

cmd_down() {
  local name="${1:-}"
  [[ -z "$name" ]] && { echo "Usage: lago-worktree down <name>" >&2; exit 1; }

  local wt_path="$WORKTREE_DIR/$name"
  local compose_file="$wt_path/docker-compose.worktree.yml"

  [[ -f "$compose_file" ]] && docker compose -f "$compose_file" down -v
  rm -f "$compose_file"
  unregister "$name"
  echo "Done."
}

cmd_destroy() {
  local name="${1:-}"
  [[ -z "$name" ]] && { echo "Usage: lago-worktree destroy <name>" >&2; exit 1; }

  local wt_path="$WORKTREE_DIR/$name"

  echo ""
  echo "  ⚠  WARNING: This action is irreversible!"
  echo ""
  echo "     The following will be permanently deleted from your machine:"
  echo "     • Docker container and volumes for '$name'"
  echo "     • Local worktree branch '$name'"
  echo "     • All files, changes and uncommitted work in:"
  echo "       $wt_path"
  echo ""
  echo "     This does NOT affect the remote repository."
  echo ""
  read -rp "  Are you sure? [y/N] " confirm
  [[ "$confirm" != [yY] ]] && { echo "  Aborted."; return; }
  echo ""

  # 1. Stop container + remove volumes
  cmd_down "$name"

  # 2. Remove git worktree and branch
  cd "$FRONT_PATH"
  if [[ -d "$wt_path" ]]; then
    git worktree remove "$wt_path" --force 2>/dev/null || rm -rf "$wt_path"
  fi
  git worktree prune 2>/dev/null || true
  git branch -D "$name" 2>/dev/null || true
  echo "Worktree '$name' destroyed."
}

cmd_ps() {
  local sf
  sf="$(slot_file)"
  echo ""
  if [[ ! -f "$sf" ]] || [[ ! -s "$sf" ]]; then
    echo "  No worktree instances."
    echo ""; return
  fi

  printf "  %-38s %-28s %-14s %-8s\n" "NAME" "URL" "BASE" "STATUS"
  printf "  %-38s %-28s %-14s %-8s\n" "----" "---" "----" "------"

  while IFS=: read -r n p b; do
    [[ -z "$n" ]] && continue
    [[ -z "$p" ]] && continue
    local san st="stopped"
    san="$(sanitize "$n")"
    [[ -z "$b" ]] && b="main"
    docker ps --format '{{.Names}}' | grep -q "lago_front_wt_${san}" && st="running"
    printf "  %-38s %-28s %-14s %-8s\n" "$n" "http://localhost:${p}" "$b" "$st"
  done < "$sf"
  echo ""
}

# --- Main ---
cmd="${1:-help}"; shift || true
case "$cmd" in
  create)  cmd_create "$@" ;;
  up)      cmd_up "$@" ;;
  down)    cmd_down "$@" ;;
  destroy) cmd_destroy "$@" ;;
  ps)      cmd_ps ;;
  *)
    cat << 'EOF'
lago-worktree — Isolated frontend per git worktree

  Main:      https://app.lago.dev       (via Traefik)
  Worktree:  http://localhost:<port>     (direct)

Commands:
  create <branch> [--from <base>]   Create worktree + start (default: from main)
  up <name>                         Start existing worktree
  down <name>                       Stop container
  destroy <name>                    Stop container + delete worktree
  ps                                List instances

API is always shared from the main stack.
Ports auto-assigned: 3001, 3002, 3003, ...
Browser tab title shows the worktree name.

Examples:
  lago-worktree create LAGO-0001
  lago-worktree create LAGO-0001 --from feature/payments
  lago-worktree ps
  lago-worktree down LAGO-0001
  lago-worktree destroy LAGO-0001
EOF
    ;;
esac
