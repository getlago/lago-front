#!/usr/bin/env bash
# diff-hygiene.sh — the mechanical half of the comment budget, as a gate.
#
# `.agents/docs/typescript-conventions.md` → "Comments: Default to None" caps
# every comment at 1-2 lines. Length needs no judgment, so it is checked here
# and leaves the reviewer's list; whether a surviving comment earns its place
# stays with the reviewer, who gets the list this script prints.
#
# Usage: diff-hygiene.sh [<base-ref>] [<worktree>]
#   base-ref  default origin/main
#   worktree  default the current checkout
# Exit 0 = no comment run over 2 lines in the added code; 1 = at least one.
# Stdout: every added comment line with its file, for the reviewer.
set -euo pipefail

BASE="${1:-origin/main}"
WT="${2:-$(pwd)}"

# Added lines only, source files only, with the file they land in.
added="$(git -C "$WT" diff -U0 "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' 'cypress/**/*.ts' ':!src/generated/**' \
  | awk '
      /^\+\+\+ / { file = substr($2, 3); next }
      /^@@ /     { next }
      /^\+/      { print file "\t" substr($0, 2) }
    ')"

[ -n "$added" ] || { echo "diff-hygiene: no added source lines"; exit 0; }

# A comment line: `//`, a `/*` block line, or a JSX `{/*` line. Consecutive
# comment lines in the same file form a run; a run over 2 lines is the breach.
result="$(printf '%s\n' "$added" | awk -F'\t' '
  function flush() {
    if (run > 2) { printf "%s: comment run of %d lines\n", file, run; over++ }
    run = 0
  }
  {
    line = $2
    is_comment = (line ~ /^[[:space:]]*(\/\/|\/\*|\*[[:space:]]|\*\/|\{\/\*)/)
    if ($1 != file) { flush(); file = $1 }
    if (is_comment) { run++; comments[++c] = $1 ": " line }
    else flush()
  }
  END {
    flush()
    for (i = 1; i <= c; i++) print "  " comments[i]
    printf "diff-hygiene: %d added comment line(s), %d run(s) over 2 lines\n", c, over
    exit (over > 0 ? 1 : 0)
  }
')" && rc=0 || rc=$?

printf '%s\n' "$result"
exit "$rc"
