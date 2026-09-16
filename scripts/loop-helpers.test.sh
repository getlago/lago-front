#!/usr/bin/env bash
# Exercises loop-journal.sh, loop-restart.sh and loop-ci-log.sh with a private
# state dir and stubbed `docker` / `gh`. Run: bash scripts/loop-helpers.test.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/bin" "$test_root/state"
export LOOP_STATE_DIR="$test_root/state"
export PATH="$test_root/bin:$PATH"
export CALLS="$test_root/calls"

fail=0
expect() {
  local name="$1" want="$2" out="$3"
  if [[ "$out" == *"$want"* ]]; then echo "ok   $name"; else echo "FAIL $name — wanted '$want' in:"; echo "$out"; fail=1; fi
}
refute() {
  local name="$1" unwanted="$2" out="$3"
  if [[ "$out" != *"$unwanted"* ]]; then echo "ok   $name"; else echo "FAIL $name — did not want '$unwanted' in:"; echo "$out"; fail=1; fi
}
run() { ("$@" 2>&1) && echo "rc=0" || echo "rc=$?"; }

# --- loop-journal.sh ----------------------------------------------------------
journal="$LOOP_STATE_DIR/_journal.md"
out="$(run bash "$repo_root/scripts/loop-journal.sh" TST-1 2/3 0/3 none shipped "review#5,adversarial" "first run")"
expect "journal row appended" "rc=0" "$out"
expect "journal header created" "| date | issue | build↔review iters | CI cycles | gates failed | outcome | notes |" "$(head -1 "$journal")"
expect "fail-check leads the notes cell" "| TST-1 | 2/3 | 0/3 | none | shipped | fail-check: review#5,adversarial; first run |" "$(tail -1 "$journal")"

run bash "$repo_root/scripts/loop-journal.sh" TST-1 "1 points" 0/3 none revised none >/dev/null
expect "no fail-check prefix when none" "| revised |  |" "$(tail -1 "$journal")"
expect "seven cells per row" "8" "$(tail -1 "$journal" | tr -cd '|' | wc -c | tr -d ' ')"

run bash "$repo_root/scripts/loop-journal.sh" TST-1 1/3 0/3 none shipped none "a | b" >/dev/null
expect "pipe in notes is escaped" "a / b" "$(tail -1 "$journal")"

expect "unknown outcome refused" "rc=64" "$(run bash "$repo_root/scripts/loop-journal.sh" TST-1 1/3 0/3 none merged none)"

# --- loop-restart.sh ------------------------------------------------------------
cat >"$test_root/bin/docker" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$CALLS"
case "$1" in
  ps) echo "lago_front_dev"; echo "lago_front_wt_tst_1_topic" ;;
  *) ;;
esac
STUB
chmod +x "$test_root/bin/docker"

expect "missing state.md skips" "skipping restart" "$(run bash "$repo_root/scripts/loop-restart.sh" "$test_root/nope.md")"

: >"$CALLS"
printf 'layout: worktree\nbranch: TST-1-topic\n' >"$test_root/state.md"
out="$(run bash "$repo_root/scripts/loop-restart.sh" "$test_root/state.md")"
expect "container derived from branch and restarted" "restarted lago_front_wt_tst_1_topic" "$out"
expect "vite cache cleared before restart" "exec lago_front_wt_tst_1_topic sh -c rm -rf /app/node_modules/.vite" "$(cat "$CALLS")"
expect "restart issued after the exec" "restart lago_front_wt_tst_1_topic" "$(tail -1 "$CALLS")"

: >"$CALLS"
printf 'layout: worktree\nbranch: other\ncontainer: lago_front_wt_tst_1_topic\n' >"$test_root/state.md"
expect "explicit container: wins over the derived name" "restarted lago_front_wt_tst_1_topic" "$(run bash "$repo_root/scripts/loop-restart.sh" "$test_root/state.md")"

: >"$CALLS"
printf 'layout: worktree\nbranch: not-running\n' >"$test_root/state.md"
out="$(run bash "$repo_root/scripts/loop-restart.sh" "$test_root/state.md")"
expect "absent container is a warning" "no container lago_front_wt_not_running" "$out"
expect "absent container never fails" "rc=0" "$out"
refute "absent container is not restarted" "restart" "$(cat "$CALLS")"

: >"$CALLS"
printf 'layout: in-place\n' >"$test_root/state.md"
out="$(CONDUCTOR_WORKSPACE_NAME="My Space" run bash "$repo_root/scripts/loop-restart.sh" "$test_root/state.md")"
expect "in-place derives the conductor container name" "no container lago_front_ct_my_space" "$out"

# --- loop-ci-log.sh -------------------------------------------------------------
cat >"$test_root/bin/gh" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$CALLS"
cat "$GH_LOG"
STUB
chmod +x "$test_root/bin/gh"
export GH_LOG="$test_root/gh.log"

{
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z ● Console\n'
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z   console.log noise\n'
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z FAIL src/foo.test.tsx\n'
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z   ● Foo › renders\n'
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z Tests:       1 failed, 3 passed\n'
  printf 'Tests (shard 1/4)\tUNKNOWN STEP\t2026-01-01T00:00:00.000Z Process completed with exit code 1.\n'
} >"$GH_LOG"

: >"$CALLS"
out="$(run bash "$repo_root/scripts/loop-ci-log.sh" TST-1 123 1)"
expect "raw log written to the state dir" "raw: $LOOP_STATE_DIR/TST-1/ci-raw-1.log (6 lines)" "$out"
expect "gh called with --log-failed" "run view 123 --repo getlago/lago-front --log-failed" "$(cat "$CALLS")"
expect "failure header kept" "● Foo › renders" "$out"
expect "FAIL line kept" "FAIL src/foo.test.tsx" "$out"
expect "summary kept" "Tests:       1 failed" "$out"
refute "console noise dropped" "● Console" "$out"
refute "step/timestamp prefix stripped" "UNKNOWN STEP" "$out"
expect "distilled lines exit 0" "rc=0" "$out"

printf 'distilled cycle 1\n' >"$LOOP_STATE_DIR/TST-1/ci-failure.md"
run bash "$repo_root/scripts/loop-ci-log.sh" TST-1 124 2 >/dev/null
expect "previous ci-failure.md archived under its cycle" "## CI cycle 1" "$(cat "$LOOP_STATE_DIR/TST-1/ci-failure-history.md")"
expect "archived content kept" "distilled cycle 1" "$(cat "$LOOP_STATE_DIR/TST-1/ci-failure-history.md")"

printf 'infra exploded, no marker here\nsecond line\n' >"$GH_LOG"
out="$(run bash "$repo_root/scripts/loop-ci-log.sh" TST-1 125 3)"
expect "no marker falls back to the tail" "no recognizable marker — log tail:" "$out"
expect "no marker exits 3" "rc=3" "$out"

exit "$fail"
