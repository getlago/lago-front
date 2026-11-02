#!/usr/bin/env bash
# codegen-own-hunks.sh — keep only this diff's own hunks in the generated GraphQL file.
#
# `pnpm codegen` regenerates src/generated/graphql.tsx from whatever schema the
# API it points at serves. That schema is rarely the one the committed file was
# generated from: an API feature branch strips types main has, an API main ahead
# of the committed file adds types nothing asked for. CI regenerates from lago-api
# `main` and only runs `tsc`, so that drift is never checked, only shipped.
#
# Run it after `pnpm codegen`. It reverse-applies every hunk of the generated
# file's uncommitted diff that names none of the GraphQL operations/fragments the
# diff declares (plus an optional extra pattern, for schema types the change
# itself adds). Filtering forward corrupts the file; reversing only the drift
# hunks with zero context is what holds.
#
# Usage: codegen-own-hunks.sh <worktree> [<base-ref>] [<extra-regex>]
#   base-ref     where the diff's GraphQL documents are read from, default origin/main
#   extra-regex  ERE alternation of additional names to keep, e.g. 'RateCard|ContractStatusEnum'
# Exit 0 = done (stdout: kept / reverted hunk counts); 1 = nothing to match on; 2 = apply failed.
set -euo pipefail

WT="${1:?worktree path}"
BASE="${2:-origin/main}"
EXTRA="${3:-}"
GEN="src/generated/graphql.tsx"

# Every operation/fragment declared in a file the diff touches: an edit inside an
# existing query changes its generated types without touching the line naming it.
# Matched case-insensitively, since codegen capitalises `query getFoo` into `GetFooQuery`.
names="$(git -C "$WT" diff --name-only "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' ':!src/generated/**' \
  | while IFS= read -r f; do [ -f "$WT/$f" ] && cat "$WT/$f"; done \
  | sed -nE 's/^[[:space:]]*(query|mutation|subscription|fragment)[[:space:]]+([A-Za-z_][A-Za-z0-9_]*).*/\2/p' \
  | sort -u | paste -sd '|' -)"
pattern="$names"
[ -n "$EXTRA" ] && pattern="${pattern:+$pattern|}$EXTRA"
[ -n "$pattern" ] || { echo "codegen-own-hunks: no operation in the diff and no extra pattern — nothing to keep" >&2; exit 1; }

drift="$(mktemp)"
trap 'rm -f "$drift" "$drift".*' EXIT

git -C "$WT" diff -U0 -- "$GEN" >"$drift.all"
counts="$(awk -v pat="$pattern" -v out="$drift" '
  function flush() {
    if (hunk == "") return
    if (tolower(hunk) ~ tolower(pat)) kept++
    else { printf "%s", hunk >>out; reverted++ }
    hunk = ""
  }
  /^@@ / { flush(); in_hunk = 1; hunk = $0 "\n"; next }
  !in_hunk { printf "%s\n", $0 >(out ".header"); next }
  { hunk = hunk $0 "\n" }
  END { flush(); print kept + 0, reverted + 0 }
' "$drift.all")"
read -r kept reverted <<<"$counts"

if [ "$reverted" -gt 0 ]; then
  cat "$drift.header" "$drift" >"$drift.patch"
  git -C "$WT" apply -R --unidiff-zero "$drift.patch" \
    || { echo "codegen-own-hunks: reverse apply failed, $GEN left as codegen wrote it" >&2; exit 2; }
fi

echo "codegen-own-hunks: kept $kept hunk(s) matching /$pattern/, reverted $reverted drift hunk(s)"
