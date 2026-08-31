#!/usr/bin/env bash
# analysis-depth.sh — one-way depth latch for a ticket analysis.
#
# How deep an analysis goes is a judgement the agent makes; how deep it has ALREADY
# committed to going is a fact, and facts belong on disk. This script holds that fact and
# refuses to walk it back.
#
# Depth only ever increases: skip → shallow → full. Escalating mid-analysis is expected —
# the cause turns out not to be where it looked. Quietly de-escalating after discovering the
# work is bigger than hoped is the failure this prevents, because the cheap tier is also the
# tier that skips the independent review.
#
# Usage:
#   analysis-depth.sh <ISSUE-ID> set <skip|shallow|full>   record the tier
#                                                          exit 0 = recorded (or already there)
#                                                          exit 1 = refused, would de-escalate
#   analysis-depth.sh <ISSUE-ID> get                       print the current tier, or "unset"
#   analysis-depth.sh <ISSUE-ID> reset                     clear it (start of a run)
#
# Configuration:
#   ITER_STATE_DIR   where state lives; falls back to LOOP_STATE_DIR, then
#                    ~/.claude/loop-state. Shares the per-issue directory with
#                    iter-budget.sh.
set -euo pipefail

ISSUE="${1:-}"
CMD="${2:-}"
if [ -z "$ISSUE" ] || [ -z "$CMD" ]; then
  echo "usage: analysis-depth.sh <ISSUE-ID> set <skip|shallow|full>|get|reset" >&2
  exit 64
fi

STATE_ROOT="${ITER_STATE_DIR:-${LOOP_STATE_DIR:-$HOME/.claude/loop-state}}"
DIR="$STATE_ROOT/$ISSUE"
FILE="$DIR/analysis-depth"

mkdir -p "$DIR"

rank() {
  case "$1" in
    skip) echo 1 ;;
    shallow) echo 2 ;;
    full) echo 3 ;;
    *) echo 0 ;;
  esac
}

case "$CMD" in
  get)
    if [ -f "$FILE" ]; then cat "$FILE"; else echo "unset"; fi
    ;;
  reset)
    rm -f "$FILE"
    echo "reset"
    ;;
  set)
    WANT="${3:-}"
    if [ "$(rank "$WANT")" -eq 0 ]; then
      echo "unknown tier: '${WANT}' (expected skip|shallow|full)" >&2
      exit 64
    fi

    CURRENT="$(cat "$FILE" 2>/dev/null || echo '')"

    if [ -n "$CURRENT" ] && [ "$(rank "$WANT")" -lt "$(rank "$CURRENT")" ]; then
      echo "refused: $CURRENT -> $WANT would de-escalate" >&2
      exit 1
    fi

    echo "$WANT" >"$FILE"
    echo "$WANT"
    ;;
  *)
    echo "usage: analysis-depth.sh <ISSUE-ID> set <skip|shallow|full>|get|reset" >&2
    exit 64
    ;;
esac
