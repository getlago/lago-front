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
#   [scripts.run.container] command = "$CONDUCTOR_WORKSPACE_PATH/scripts/conductor-front-container.sh up"
#   scripts.archive        = "$CONDUCTOR_ROOT_PATH/scripts/conductor-front-container.sh down"
#
# The run scripts are located via $CONDUCTOR_WORKSPACE_PATH so a branch-local edit
# to this file is what actually runs. The archive hook instead resolves it from
# $CONDUCTOR_ROOT_PATH (the main clone): a workspace whose branch predates the
# commit that added this file has no copy in its checkout, and by archive time the
# workspace directory may already be gone. Either way $CONDUCTOR_ROOT_PATH is a
# Conductor-provided var, not a user shell var like $LAGO_PATH, which is not
# present in Conductor's non-interactive script env.
#
# Prerequisites:
#   - the main Lago Docker stack is running (`lago up -d`)
#   - the workspace lives under the lago superproject (front/ + api/ + docker-compose);
#     the superproject path is derived here from $CONDUCTOR_ROOT_PATH, not $LAGO_PATH.

CMD="${1:-}"

NAME="${CONDUCTOR_WORKSPACE_NAME:?CONDUCTOR_WORKSPACE_NAME is required (run via Conductor)}"
# Optional: `down` works purely off the generated compose file (kept outside the
# workspace), so archiving still tears the container down after the workspace
# directory is gone. `shell` only needs the running container. Only up/host read
# it, see require_ws.
WS="${CONDUCTOR_WORKSPACE_PATH:-}"
ROOT="${CONDUCTOR_ROOT_PATH:?CONDUCTOR_ROOT_PATH is required (run via Conductor)}"
PORT="${CONDUCTOR_PORT:-8080}"

LAGO_PATH="$(cd "$ROOT/.." && pwd)"
COMPOSE_DIR="$LAGO_PATH/.conductor-front-containers"
SAN="$(echo "$NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g')"
COMPOSE_FILE="$COMPOSE_DIR/${SAN}.yml"

require_ws() {
  [[ -d "$WS" ]] || {
    echo "CONDUCTOR_WORKSPACE_PATH must point at an existing directory (got: ${WS:-<unset>})" >&2
    exit 1
  }
}

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
      # Quoted so a workspace path containing spaces / YAML-special chars can't
      # break the volume string parsing.
      - "${WS}:/app:cached"
      - front_nm_ct_${SAN}:/app/node_modules
      - front_dist_ct_${SAN}:/app/dist
    environment:
      - NODE_ENV=development
      - API_URL=http://localhost:${PORT}/api
      - LAGO_API_PROXY_TARGET=http://api:3000
      - CODEGEN_API=http://api:3000/graphql
      - APP_DOMAIN=https://app.lago.dev
      # Vite's tab-title helper (vite.config.ts) shows "WT - <name>" in dev when
      # this is set, so parallel workspaces are distinguishable in the browser.
      # Quoted so a name with spaces / YAML-special chars can't break parsing.
      - "LAGO_WORKTREE_NAME=${NAME}"
      # Bind vite to the SAME port host-side and container-side so vite's own
      # "Local: http://localhost:${PORT}/" log line advertises the host-reachable
      # port. Conductor's browser button scrapes the LAST port seen in run-script
      # stdout; a mismatched internal port (was 8080) made it flip to the wrong port.
      - PORT=${PORT}
    ports:
      - "${PORT}:${PORT}"
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
  # The workspace .env is only ever consulted by HOST-side tooling: `host` mode's
  # Vite, and `pnpm codegen` / tests run from the host terminal. Inside the
  # container these same keys are overridden by the compose `environment` block
  # (api:3000, on the lago_dev_default network) — container Vite via loadEnv
  # process.env overlay, in-container codegen via the preset process.env. So .env
  # ALWAYS carries the HOST-reachable targets: the shared API is reached over
  # Traefik at api.lago.dev (the worktree runs no API of its own). This is what
  # makes host `pnpm codegen` resolve; `api:3000` in .env would ENOTFOUND on the
  # host. Idempotent; .env is gitignored.
  local env_file="$WS/.env"
  touch "$env_file"
  sed -i.bak '/^API_URL=/d; /^LAGO_API_PROXY_TARGET=/d; /^CODEGEN_API=/d' "$env_file"
  rm -f "$env_file.bak"
  {
    echo "API_URL=http://localhost:${PORT}/api"
    # https to match the api.lago.dev health check and stay robust if Traefik
    # ever forces http->https (cert is valid; Vite proxy sets secure:false).
    echo "LAGO_API_PROXY_TARGET=https://api.lago.dev"
    echo "CODEGEN_API=https://api.lago.dev/graphql"
  } >> "$env_file"
}

cmd_up() {
  # Substring match (not anchored) for parity with lago-worktree.sh and to
  # tolerate any Compose-added prefix/suffix on the main front container name.
  if ! docker ps --format '{{.Names}}' | grep -q 'lago_front_dev'; then
    echo "Error: main Lago stack is not running. Start it first: lago up -d" >&2
    exit 1
  fi

  patch_env
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

# Tear down one compose project by its sanitised name, compose file or not.
teardown_san() {
  # Two statements: bash expands the whole `local` line before assigning, so
  # referencing $san in the same statement trips `set -u`.
  local san="$1"
  local file="$COMPOSE_DIR/${san}.yml"
  local project="lago_front_ct_${san}"

  if [[ -f "$file" ]] && docker compose -f "$file" down -v; then
    rm -f "$file"
    return
  fi

  # Docker itself unreachable (daemon down, CLI missing): there is nothing to
  # remove right now and dropping the compose file would lose the only record of
  # what to clean up, so warn and leave it. Never fail: this runs from the archive
  # hook, where a teardown error would surface as a failed archive.
  if ! docker info >/dev/null 2>&1; then
    echo "warn: docker unreachable, leaving '${san}' teardown for later." >&2
    return
  fi

  # No compose file (deleted manually), or it no longer parses (stale format from
  # an older revision of this script): remove the container and its volumes
  # directly so nothing is left orphaned.
  docker rm -f "$project" >/dev/null 2>&1 || true

  # Compose prefixes every declared volume with the project name, so the real
  # volumes are lago_front_ct_<san>_front_nm_ct_<san>, not front_nm_ct_<san>.
  # Match on the compose project label, which survives the compose file, and fall
  # back to the prefixed literals in case the label is missing.
  local -a vols=()
  local vol
  while IFS= read -r vol; do
    [[ -n "$vol" ]] && vols+=("$vol")
  done < <(docker volume ls -q --filter "label=com.docker.compose.project=${project}" 2>/dev/null || true)
  if [[ ${#vols[@]} -gt 0 ]]; then
    docker volume rm "${vols[@]}" >/dev/null 2>&1 || true
  fi
  docker volume rm "${project}_front_nm_ct_${san}" "${project}_front_dist_ct_${san}" >/dev/null 2>&1 || true

  # Only drop the compose file once the container is really gone. Deleting it on a
  # failed removal would destroy the sole record of the project name and volume
  # set, leaving both unreclaimable.
  if docker ps -a --format '{{.Names}}' | grep -qx "$project"; then
    echo "warn: container ${project} still present, keeping ${file}." >&2
    return
  fi
  rm -f "$file"
}

cmd_down() {
  teardown_san "$SAN"

  # The compose project is named after CONDUCTOR_WORKSPACE_NAME at `up` time, so
  # renaming the workspace afterwards makes $SAN miss the project that is actually
  # running and orphans its node_modules volume (~600MB each). Also tear down any
  # other compose project whose /app mount is this workspace, so a rename between
  # `up` and archive still cleans up.
  if [[ -n "$WS" && -d "$COMPOSE_DIR" ]]; then
    local file other
    for file in "$COMPOSE_DIR"/*.yml; do
      [[ -f "$file" ]] || continue
      grep -qF -- "${WS}:/app:cached" "$file" || continue
      other="$(basename "$file" .yml)"
      if [[ "$other" == "$SAN" ]]; then continue; fi
      echo "Also tearing down stale project '$other' for this workspace (renamed since 'up')."
      teardown_san "$other"
    done
  fi

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
  # Run Vite on the HOST instead of in a container. vite.config.ts enables watch
  # polling by default (required for the Docker bind-mount case); host mode sets
  # LAGO_DISABLE_VITE_POLLING=true (below) to turn it off, so the host watcher
  # uses native macOS fsevents — instant, reliable HMR with none of the
  # in-container polling that drops events under multi-container CPU load and
  # forces manual container restarts.
  #
  # The API is reached over Traefik at api.lago.dev (routable from the host);
  # Vite proxies /api there via LAGO_API_PROXY_TARGET. Requires the main Lago
  # stack running and host deps installed (Conductor `setup` runs pnpm install).
  # Use host OR container for a workspace, not both: they bind the same port and
  # strictPort will error loudly on collision.
  if ! curl -sfo /dev/null --max-time 3 https://api.lago.dev/health 2>/dev/null \
    && ! docker ps --format '{{.Names}}' | grep -q 'lago_api_dev'; then
    echo "Warning: main Lago stack / api.lago.dev not reachable. Start it: lago up -d" >&2
  fi

  patch_env

  echo ""
  echo "  Front [$NAME] (host vite, native HMR) -> http://localhost:${PORT}"
  echo ""

  cd "$WS"
  # Label the browser tab "WT - <name>" (vite.config.ts tab-title helper), same
  # as the container path, so parallel workspaces are distinguishable.
  export LAGO_WORKTREE_NAME="$NAME"
  # Turn off Vite's default watch polling → native macOS fsevents for host HMR.
  export LAGO_DISABLE_VITE_POLLING=true
  # --port sets the port explicitly instead of writing PORT into the workspace
  # .env (.env is host-only tooling config, see patch_env). The container path
  # gets its port from the compose `environment` overlay, never from .env.
  exec pnpm exec vite --port "$PORT"
}

case "$CMD" in
  up) require_ws; cmd_up ;;
  down) cmd_down ;;
  # No require_ws: cmd_shell only needs the running container, not the directory,
  # so it stays usable when the workspace has already been removed.
  shell) cmd_shell ;;
  host) require_ws; cmd_host ;;
  *)
    echo "Usage: conductor-front-container.sh {up|down|shell|host}" >&2
    exit 1
    ;;
esac
