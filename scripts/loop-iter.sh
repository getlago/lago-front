#!/usr/bin/env bash
# loop-iter.sh — iteration budget for the loop pipeline.
#
# The cap lives here, in the filesystem, not in the agent's memory of how many
# times it has already tried. Every retry has to charge the budget through this
# script, and the script is what refuses the fourth attempt.
#
# Usage:
#   loop-iter.sh <ISSUE-ID> <counter>          charge one attempt; prints "N/MAX"
#                                              exit 0 = proceed
#                                              exit 1 = budget exhausted, stop and escalate
#   loop-iter.sh <ISSUE-ID> reset [<counter>]  reset one counter, or all of them
#   loop-iter.sh <ISSUE-ID> show               print every counter for this issue
#
# Counters the pipeline uses: review (build↔review cycles), ci (CI fix cycles in
# loop-run), ci-revise (CI fix cycles in loop-revise).
#
# Configuration:
#   LOOP_MAX_ITER    attempts allowed per counter (default 3)
#   LOOP_STATE_DIR   where run state lives (default ~/.claude/loop-state)
set -euo pipefail

ISSUE="${1:-}"
CMD="${2:-}"
if [ -z "$ISSUE" ] || [ -z "$CMD" ]; then
  echo "usage: loop-iter.sh <ISSUE-ID> <counter>|reset [<counter>]|show" >&2
  exit 64
fi

MAX="${LOOP_MAX_ITER:-3}"
DIR="${LOOP_STATE_DIR:-$HOME/.claude/loop-state}/$ISSUE/counters"
mkdir -p "$DIR"

case "$CMD" in
  reset)
    if [ -n "${3:-}" ]; then rm -f "$DIR/$3"; else rm -f "$DIR"/*; fi
    echo "reset"
    ;;
  show)
    found=0
    for f in "$DIR"/*; do
      [ -f "$f" ] || continue
      echo "$(basename "$f")=$(cat "$f")/$MAX"
      found=1
    done
    [ "$found" -eq 0 ] && echo "no counters yet"
    ;;
  *)
    FILE="$DIR/$CMD"
    N=$(( $(cat "$FILE" 2>/dev/null || echo 0) + 1 ))
    echo "$N" >"$FILE"
    echo "$N/$MAX"
    if [ "$N" -gt "$MAX" ]; then
      exit 1
    fi
    exit 0
    ;;
esac
