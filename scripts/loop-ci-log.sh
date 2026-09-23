#!/usr/bin/env bash
# loop-ci-log.sh — capture a failed CI run without letting the raw log into context.
#
# A failed log is tens of thousands of tokens and would be read twice (live and
# again from history). It goes to disk; only the decisive lines come back.
#
# Usage: loop-ci-log.sh <ISSUE-ID> <run-id> <cycle-N> [<repo>]
#   Writes  $LOOP_STATE_DIR/<ISSUE-ID>/ci-raw-<N>.log   (the raw --log-failed output)
#   Prints  the distilled lines (≤ 40) — failing job, FAIL <file>, `● suite › test`,
#           root-cause line, `Tests: N failed` — for the agent to turn into ci-failure.md.
#   Before writing, moves the previous ci-failure.md under `## CI cycle <N-1>` in
#   ci-failure-history.md, so every cycle keeps its distilled predecessor.
# Exit 0 = lines printed; 3 = no recognizable marker (prints the log tail instead).
set -euo pipefail

ISSUE="${1:?ISSUE-ID}"
RUN="${2:?run id}"
N="${3:?cycle number}"
REPO="${4:-getlago/lago-front}"

STATE="${LOOP_STATE_DIR:-$HOME/.claude/loop-state}/$ISSUE"
mkdir -p "$STATE"
RAW="$STATE/ci-raw-$N.log"

gh run view "$RUN" --repo "$REPO" --log-failed >"$RAW" 2>&1 || true
echo "raw: $RAW ($(wc -l <"$RAW" | tr -d ' ') lines)"

if [ -f "$STATE/ci-failure.md" ] && [ "$N" -gt 1 ]; then
  {
    printf '\n## CI cycle %d\n\n' "$((N - 1))"
    cat "$STATE/ci-failure.md"
  } >>"$STATE/ci-failure-history.md"
fi

# jest prints no ✕ in CI (non-TTY): ● is the failure header. `● Console` prefixes
# every captured console line and is noise.
lines="$(grep -nE '●|FAIL |Error:|error TS[0-9]+|AssertionError|ELIFECYCLE|[0-9]+:[0-9]+ +error|Tests: +[0-9]+ failed|Test Suites: +[0-9]+ failed|Process completed with exit code' "$RAW" \
  | grep -v '● Console' \
  | sed -E 's/\t[A-Z ]*STEP\t[0-9-]+T[0-9:.]+Z / | /' \
  | head -40 || true)"

if [ -z "$lines" ]; then
  echo "no recognizable marker — log tail:"
  tail -60 "$RAW"
  exit 3
fi

printf '%s\n' "$lines"
