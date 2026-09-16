#!/usr/bin/env bash
# loop-plan-check.sh — what does the diff introduce, and did the plan say so?
#
# loop-build writes plan.md before coding: the files it will touch, the files it
# will create, the symbols it will export. This script compares that declaration
# with the actual diff. Two different consumers read the result:
#   - the build gate needs to know that nothing is UNDECLARED (exit 1 fails it)
#   - loop-run needs to know that something NEW exists at all, declared or not,
#     because a new file or export is the signal that an abstraction appeared and
#     the adversarial reviewer must judge whether it earns its place (exit 3)
#
# Detected additions: new files (minus src/generated), `export <declaration>`,
# `export { a, b as c }` re-exports (each name), `export * from '<module>'`
# (the module path must appear in the plan).
#
# Usage: loop-plan-check.sh <worktree> <plan.md> [<base-ref>]
# Exit 0 = the diff adds no new file and no new export
#      3 = new files/exports exist and every one is declared in plan.md (adversarial trigger)
#      1 = at least one is undeclared; stdout lists them, prefixed `file:` / `export:` / `reexport:`
#      2 = plan.md missing (treat as "everything undeclared")
set -euo pipefail

WT="${1:?worktree path}"
PLAN="${2:?plan.md path}"
BASE="${3:-origin/main}"

[ -f "$PLAN" ] || { echo "plan: $PLAN missing"; exit 2; }

git -C "$WT" add -N . 2>/dev/null || true

undeclared=0
new=0

declared() { grep -qwF -- "$1" "$PLAN"; }

# New files: `git diff --diff-filter=A`, minus generated output.
while IFS= read -r f; do
  [ -n "$f" ] || continue
  case "$f" in src/generated/*) continue ;; esac
  new=1
  grep -qF -- "$f" "$PLAN" || { echo "file: $f"; undeclared=1; }
done < <(git -C "$WT" diff --diff-filter=A --name-only "$BASE")

added_exports="$(git -C "$WT" diff -U0 "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' ':!src/generated/**' \
  | grep -E '^\+export ' | grep -v '^+++ ' | sed 's/^+//' || true)"

# `export const|function|type|… Name`
while IFS= read -r sym; do
  [ -n "$sym" ] || continue
  new=1
  declared "$sym" || { echo "export: $sym"; undeclared=1; }
done < <(printf '%s\n' "$added_exports" \
  | sed -nE 's/^export (default )?(async )?(const|let|var|function|class|type|interface|enum|abstract class) ([A-Za-z_$][A-Za-z0-9_$]*).*/\4/p' \
  | sort -u)

# `export { a, b as c } from '…'` — every exported name, the alias when there is one
while IFS= read -r sym; do
  [ -n "$sym" ] || continue
  new=1
  declared "$sym" || { echo "export: $sym"; undeclared=1; }
done < <(printf '%s\n' "$added_exports" \
  | grep -E '^export (type )?\{' \
  | sed -E 's/^export (type )?\{([^}]*)\}.*/\2/' \
  | tr ',' '\n' \
  | sed -E 's/^[[:space:]]*(type[[:space:]]+)?//; s/[[:space:]]+$//; s/^.*[[:space:]]as[[:space:]]+//' \
  | grep -E '^[A-Za-z_$][A-Za-z0-9_$]*$' \
  | sort -u)

# `export * from '<module>'` — the module path stands for every name it carries
while IFS= read -r mod; do
  [ -n "$mod" ] || continue
  new=1
  grep -qF -- "$mod" "$PLAN" || { echo "reexport: $mod"; undeclared=1; }
done < <(printf '%s\n' "$added_exports" \
  | sed -nE "s/^export \* (as [A-Za-z_$][A-Za-z0-9_$]* )?from ['\"]([^'\"]+)['\"].*/\2/p" \
  | sort -u)

if [ "$undeclared" -eq 1 ]; then
  exit 1
fi
if [ "$new" -eq 1 ]; then
  echo "plan: new files/exports present, all declared — adversarial pass applies"
  exit 3
fi
echo "plan: diff adds no new file or export"
exit 0
