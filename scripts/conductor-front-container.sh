#!/usr/bin/env bash
set -euo pipefail

# conductor-front-container.sh — run each Conductor front workspace in its own
# Docker container (image front_dev), on its Conductor-assigned port, joined to
# the shared main-stack network (shared API/DB/Redis/PDF).
#
# Companion to lago-worktree.sh, but the worktree path comes from Conductor env
# vars instead of a self-managed worktree layout, so Conductor stays the single
# owner of worktree create/destroy. Wired from the committed team config
# .conductor/settings.toml:
#   [scripts.run.container] command = "$LAGO_PATH/front/scripts/conductor-front-container.sh up"
#   scripts.archive        = "$LAGO_PATH/front/scripts/conductor-front-container.sh down"
#
# Prerequisites:
#   - the main Lago Docker stack is running (`lago up -d`)
#   - $LAGO_PATH points at the lago superproject (front/ + api/ + docker-compose)

CMD="${1:-}"

NAME="${CONDUCTOR_WORKSPACE_NAME:?CONDUCTOR_WORKSPACE_NAME is required (run via Conductor)}"
WS="${CONDUCTOR_WORKSPACE_PATH:?CONDUCTOR_WORKSPACE_PATH is required (run via Conductor)}"
ROOT="${CONDUCTOR_ROOT_PATH:?CONDUCTOR_ROOT_PATH is required (run via Conductor)}"
PORT="${CONDUCTOR_PORT:-8080}"

LAGO_PATH="$(cd "$ROOT/.." && pwd)"
COMPOSE_DIR="$LAGO_PATH/.conductor-front-containers"
SAN="$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g')"
COMPOSE_FILE="$COMPOSE_DIR/${SAN}.yml"

gen_compose() {
  mkdir -p "$COMPOSE_DIR"
  cat > "$COMPOSE_FILE" <<YAML
name: lago_front_ct_${SAN}

services:
  front:
    image: front_dev
    pull_policy: never
    container_name: lago_front_ct_${SAN}
    stdin_open: true
    restart: unless-stopped
    volumes:
      - ${WS}:/app:cached
      - front_nm_ct_${SAN}:/app/node_modules
      - front_dist_ct_${SAN}:/app/dist
    environment:
      - NODE_ENV=development
      - API_URL=http://localhost:${PORT}/api
      - LAGO_API_PROXY_TARGET=http://api:3000
      - CODEGEN_API=http://api:3000/graphql
      - APP_DOMAIN=https://app.lago.dev
      - PORT=8080
    ports:
      - "${PORT}:8080"
    networks:
      - lago_net

volumes:
  front_nm_ct_${SAN}:
  front_dist_ct_${SAN}:

networks:
  lago_net:
    external: true
    name: lago_dev_default
YAML
}

patch_env() {
  # Rewrite the API-target keys in the workspace .env. Vite reads these from the
  # .env FILE (loadEnv), not process.env. The target differs by run mode:
  #   container (up):  api:3000        (reachable on the lago_dev_default network)
  #   host (host):     api.lago.dev    (Traefik route, reachable from the host)
  # Idempotent: drop the managed keys then re-append. .env is gitignored.
  local proxy_target="$1"
  local codegen_api="$2"
  local env_file="$WS/.env"
  touch "$env_file"
  sed -i.bak '/^API_URL=/d; /^LAGO_API_PROXY_TARGET=/d; /^CODEGEN_API=/d' "$env_file"
  rm -f "$env_file.bak"
  {
    echo "API_URL=http://localhost:${PORT}/api"
    echo "LAGO_API_PROXY_TARGET=${proxy_target}"
    echo "CODEGEN_API=${codegen_api}"
  } >> "$env_file"
}

cmd_up() {
  if ! docker ps --format '{{.Names}}' | grep -q '^lago_front_dev$'; then
    echo "Error: main Lago stack is not running. Start it first: lago up -d" >&2
    exit 1
  fi

  patch_env "http://api:3000" "http://api:3000/graphql"
  gen_compose

  # A hard-killed prior run (SIGKILL) can orphan the container or leave a stale
  # network endpoint that blocks re-attach ("endpoint ... already exists"); clear
  # the compose project, the container, and the dangling endpoint before starting.
  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
  docker rm -f "lago_front_ct_${SAN}" >/dev/null 2>&1 || true
  docker network disconnect -f lago_dev_default "lago_front_ct_${SAN}" >/dev/null 2>&1 || true

  cleanup() { docker compose -f "$COMPOSE_FILE" stop >/dev/null 2>&1 || true; }
  trap cleanup EXIT INT TERM HUP

  docker compose -f "$COMPOSE_FILE" up -d

  echo ""
  echo "  Front [$NAME] -> http://localhost:${PORT}"
  echo "  (first boot runs pnpm install in the container; give it a minute)"
  echo ""

  # Stay in the foreground streaming logs so Conductor shows the script as
  # running; its stop signal reaches us and the trap stops the container.
  docker compose -f "$COMPOSE_FILE" logs -f
}

cmd_down() {
  [[ -f "$COMPOSE_FILE" ]] || { echo "No front container registered for '$NAME'."; exit 0; }
  docker compose -f "$COMPOSE_FILE" down -v
  rm -f "$COMPOSE_FILE"
  echo "Removed front container for '$NAME'."
}

cmd_shell() {
  # Open an interactive shell INSIDE this workspace's front container, so
  # pnpm/node/codegen run with the container's node_modules and network
  # (api:3000 resolves, unlike on the host). Wired as [scripts.run.shell].
  local container="lago_front_ct_${SAN}"
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}\$"; then
    echo "Container ${container} is not running." >&2
    echo "Start it first with the 'container' run script (or: conductor-front-container.sh up)." >&2
    exit 1
  fi
  # -w /app lands in the mounted workspace; bash exists in the front_dev image.
  exec docker exec -it -w /app "$container" bash
}

cmd_host() {
  # Run Vite on the HOST instead of in a container. macOS native fsevents give
  # instant, reliable HMR with no in-container polling (the in-container watcher
  # relies on `usePolling` and drops events under multi-container CPU load, which
  # is what breaks hot reload and forces a manual container restart).
  #
  # The API is reached over Traefik at api.lago.dev (routable from the host);
  # Vite proxies /api there via LAGO_API_PROXY_TARGET. Requires the main Lago
  # stack running and host deps installed (Conductor `setup` runs pnpm install).
  # Use host OR container for a workspace, not both: they bind the same port and
  # strictPort will error loudly on collision.
  if ! curl -sfo /dev/null --max-time 3 https://api.lago.dev/health 2>/dev/null \
    && ! docker ps --format '{{.Names}}' | grep -q '^lago_api_dev$'; then
    echo "Warning: main Lago stack / api.lago.dev not reachable. Start it: lago up -d" >&2
  fi

  patch_env "http://api.lago.dev" "http://api.lago.dev/graphql"

  echo ""
  echo "  Front [$NAME] (host vite, native HMR) -> http://localhost:${PORT}"
  echo ""

  cd "$WS"
  # --port overrides the config default (8080) without writing PORT into .env,
  # which would break the container path (Vite reads PORT from the .env FILE).
  exec pnpm exec vite --port "$PORT"
}

case "$CMD" in
  up) cmd_up ;;
  down) cmd_down ;;
  shell) cmd_shell ;;
  host) cmd_host ;;
  *)
    echo "Usage: conductor-front-container.sh {up|down|shell|host}" >&2
    exit 1
    ;;
esac
