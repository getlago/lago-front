#!/usr/bin/env bash
# loop-plan-check.sh — does the diff introduce anything the build plan did not declare?
#
# loop-build writes plan.md before coding: the files it will touch, the files it
# will create, the symbols it will export. This script compares that declaration
# with the actual diff. New files and new exports absent from the plan are the
# signal that an abstraction appeared during implementation — exactly what the
# adversarial reviewer exists to judge, and exactly what diff size does not show.
#
# Usage: loop-plan-check.sh <worktree> <plan.md> [<base-ref>]
# Exit 0 = every new file and new export is in the plan (no adversarial pass)
#      1 = at least one is not; stdout lists them, one per line, prefixed
#          `file:` or `export:`
#      2 = plan.md missing (treat as "everything undeclared")
set -euo pipefail

WT="${1:?worktree path}"
PLAN="${2:?plan.md path}"
BASE="${3:-origin/main}"

[ -f "$PLAN" ] || { echo "plan: $PLAN missing"; exit 2; }

git -C "$WT" add -N . 2>/dev/null || true

undeclared=0

# New files: `git diff --diff-filter=A`, minus generated output.
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in src/generated/*) continue ;; esac
  grep -qF -- "$f" "$PLAN" || { echo "file: $f"; undeclared=1; }
done < <(git -C "$WT" diff --diff-filter=A --name-only "$BASE")

# New exported symbols: added `export` lines in source files, symbol name only.
while IFS= read -r sym; do
  [ -n "$sym" ] || continue
  grep -qwF -- "$sym" "$PLAN" || { echo "export: $sym"; undeclared=1; }
done < <(git -C "$WT" diff -U0 "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' ':!src/generated/**' \
  | grep -E '^\+export ' \
  | grep -v '^+++ ' \
  | sed -E 's/^\+export (default )?(async )?(const|let|var|function|class|type|interface|enum) ([A-Za-z0-9_$]+).*/\4/' \
  | grep -E '^[A-Za-z_$][A-Za-z0-9_$]*$' \
  | sort -u)

if [ "$undeclared" -eq 0 ]; then
  echo "plan: diff matches plan.md"
fi
exit "$undeclared"
