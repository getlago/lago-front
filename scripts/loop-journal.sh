#!/usr/bin/env bash
# loop-journal.sh — append one row to the pipeline journal.
#
# The journal is the only record that tells whether a check earns its place:
# the flywheel prunes a check that has produced no FAIL in 15 runs, so every
# FAIL must name the check that produced it. This script owns the row format;
# the skills call it instead of hand-writing table cells.
#
# Usage: loop-journal.sh <ISSUE-ID> <iters> <ci> <gates> <outcome> <fail-checks> [<notes>]
#   iters        build↔review iterations as N/3, or "<N> points" from loop-revise
#   ci           CI fix cycles as N/3
#   gates        gates that went red at least once, comma-separated, or "none"
#   outcome      shipped | revised | stopped-review | stopped-ci | needs-operator-adjudication | stopped-error
#   fail-checks  checks that produced a FAIL verdict, e.g. "review#5,review#2,adversarial", or "none"
#   notes        one short phrase, optional
# The table stays at 7 cells; fail-checks lands at the head of the notes cell as
# `fail-check: …;` so older rows keep aligning.
set -euo pipefail

ISSUE="${1:?ISSUE-ID}"
ITERS="${2:?iterations}"
CI="${3:?ci cycles}"
GATES="${4:?gates}"
OUTCOME="${5:?outcome}"
FAILS="${6:?fail-checks or none}"
NOTES="${7:-}"

case "$OUTCOME" in
  shipped|revised|stopped-review|stopped-ci|needs-operator-adjudication|stopped-error) ;;
  *) echo "loop-journal: unknown outcome '$OUTCOME'" >&2; exit 64 ;;
esac

JOURNAL="${LOOP_STATE_DIR:-$HOME/.claude/loop-state}/_journal.md"
mkdir -p "$(dirname "$JOURNAL")"

if [ ! -f "$JOURNAL" ]; then
  {
    echo '| date | issue | build↔review iters | CI cycles | gates failed | outcome | notes |'
    echo '|------|-------|--------------------|-----------|--------------|---------|-------|'
  } >"$JOURNAL"
fi

cell="$NOTES"
if [ "$FAILS" != "none" ]; then
  cell="fail-check: $FAILS;${NOTES:+ $NOTES}"
fi
cell="$(printf '%s' "$cell" | tr '|' '/' | tr '\n' ' ')"

printf '| %s | %s | %s | %s | %s | %s | %s |\n' \
  "$(date +%Y-%m-%d)" "$ISSUE" "$ITERS" "$CI" "$GATES" "$OUTCOME" "$cell" >>"$JOURNAL"
echo "loop-journal: row appended to $JOURNAL"
