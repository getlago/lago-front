#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"

cleanup() {
  rm -rf "$test_root"
}
trap cleanup EXIT

mkdir -p "$test_root/bin" "$test_root/lago/front" "$test_root/workspace"
docker_calls="$test_root/docker.calls"

cat > "$test_root/bin/docker" <<'FAKE_DOCKER'
#!/usr/bin/env bash
set -euo pipefail

printf '%s\n' "$*" >> "$DOCKER_CALLS"

case "${1:-} ${2:-}" in
  "ps --format")
    echo "lago_front_dev"
    ;;
  "image inspect")
    if [[ "$*" == *"--format"* ]]; then
      echo "NODE_VERSION=24.20.0"
    fi
    ;;
  "volume create")
    echo "${3:-}"
    ;;
  "run --rm")
    if [[ "$*" == *"lago_front_pnpm_store"* ]]; then
      cat <<'DF'
Filesystem 1024-blocks Used Available Capacity Mounted on
/dev/vdb1 10485760 10383360 102400 100% /app/.pnpm-store
DF
    else
      cat <<'DF'
Filesystem 1024-blocks Used Available Capacity Mounted on
overlay 20971520 10485760 10485760 50% /
DF
    fi
    ;;
esac
FAKE_DOCKER
chmod +x "$test_root/bin/docker"

set +e
output="$({
  PATH="$test_root/bin:$PATH" \
    DOCKER_CALLS="$docker_calls" \
    CONDUCTOR_WORKSPACE_NAME="disk-probe-test" \
    CONDUCTOR_WORKSPACE_PATH="$test_root/workspace" \
    CONDUCTOR_ROOT_PATH="$test_root/lago/front" \
    CONDUCTOR_PORT="55030" \
    "$repo_root/scripts/conductor-front-container.sh" up
} 2>&1)"
exit_code=$?
set -e

if [[ $exit_code -eq 0 ]]; then
  echo "FAIL: container startup continued despite a nearly full pnpm volume" >&2
  exit 1
fi

if [[ "$output" != *"100MB free on the Docker disk"* ]]; then
  echo "FAIL: expected the error to report the pnpm volume's 100MB free" >&2
  echo "$output" >&2
  exit 1
fi

if grep -q '^compose .* up ' "$docker_calls"; then
  echo "FAIL: Docker Compose started after the disk check failed" >&2
  exit 1
fi

echo "PASS: startup checks free space on the pnpm volume"
