#!/usr/bin/env bash
# pattern-preflight.sh: which documented patterns does this diff touch?
#
# The rules a reviewer cites live in `.agents/skills/lago-frontend-patterns`
# and `.agents/docs/`. A PR that misses one has usually not skipped the rule,
# it never retrieved it: the skill is read once at the start, the pattern is
# written an hour later. This script does the retrieval from the diff itself.
# It greps the changed source files for the symbols each rule is about and
# prints the rule and where it is written, so every line is a question the
# author answers before opening the PR.
#
# Advisory, not a gate: a hit is not a violation. Exit 0 = nothing to check;
# 3 = at least one item listed. Added comments are listed by diff-hygiene.sh.
#
# Usage: pattern-preflight.sh [<base-ref>] [<worktree>]
#   base-ref default origin/main;  worktree default cwd
set -euo pipefail

BASE="${1:-origin/main}"
WT="${2:-$(pwd)}"
PATTERNS=".agents/skills/lago-frontend-patterns/references"
STYLE=".agents/docs/frontend-coding-styleguide.md"
hits=0

flag() {
  echo "$1: $2"
  echo "    -> $3"
  hits=$((hits + 1))
}

files="$(git -C "$WT" diff --name-only --diff-filter=AM "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' \
  ':!src/generated/**' ':!**/__tests__/**' ':!**/*.test.ts' ':!**/*.test.tsx')"

added_lines() {
  git -C "$WT" diff -U0 "$BASE" -- "$1" | grep -E '^\+[^+]' | cut -c2- || true
}

for f in $files; do
  path="$WT/$f"
  [ -f "$path" ] || continue
  added="$(added_lines "$f")"

  if grep -q 'MainHeader.Configure' "$path" && echo "$added" | grep -qE 'onClick|actions=' \
    && ! grep -q 'snapshotKey' "$path"; then
    flag "$f" "MainHeader.Configure callbacks with no snapshotKey: they keep stale data" \
      "$PATTERNS/main-header.md"
  fi

  if grep -qE 'use(Centralized|Form|FormDialogOpening|DialogOpening)Dialog\(\)' "$path" \
    && grep -qE 'use[A-Za-z0-9]+Mutation\(' "$path" && ! grep -q 'closeOnError' "$path"; then
    flag "$f" "dialog action calls the API with closeOnError left at true: a failure closes it silently" \
      "$PATTERNS/dialogs.md (Implementation notes)"
  fi

  if grep -q 'useAppForm(' "$path"; then
    if grep -qE 'useFormDialog(OpeningDialog)?\(\)' "$path" && ! grep -q 'dialogFormProps' "$path"; then
      flag "$f" "form dialog not wired with dialogFormProps, and onSubmit must throw on failure" \
        "$PATTERNS/forms.md (Splitting a form, Implementation notes)"
    fi
    if ! grep -q 'onSubmitInvalid' "$path"; then
      flag "$f" "useAppForm with no onSubmitInvalid: scroll to the first error if the form can outgrow the viewport" \
        "$PATTERNS/forms.md (scrollToFirstInputError)"
    fi
  fi

  if echo "$added" | grep -qE '(\b[a-zA-Z]*[lL]oading\b) *(\?|&&|\|\|)|if \(!?[a-zA-Z]*[lL]oading\)' \
    && ! echo "$added" | grep -qE '[lL]oading *&& *!(data|[a-zA-Z]+Data)\b'; then
    flag "$f" "renders from loading alone: cache-and-network sets it with data on screen, gate on loading && !data" \
      "$PATTERNS/loading-states.md"
  fi

  for op in $(echo "$added" | grep -oE '\buse[A-Z][A-Za-z0-9]*(Lazy)?Query\(' \
    | sed -E 's/^use//; s/(Lazy)?Query\($//' | sort -u); do
    grep -qiE "query ${op}\b" "$path" && continue
    owner="$(grep -rliE "query ${op}\b" "$WT/src" --include='*.ts' --include='*.tsx' \
      | grep -v '/generated/' | head -1 || true)"
    [ -n "$owner" ] || continue
    flag "$f" "reuses query ${op} declared in ${owner#"$WT"/}: declare a minimal one here" \
      "$STYLE (GraphQL operations are colocated with their consumer)"
  done

  casts="$(echo "$added" | grep -vE '^\s*import ' | grep -oE '\bas (unknown|[A-Z][A-Za-z0-9_.<>]*)' \
    | sort -u | tr '\n' ' ' || true)"
  if [ -n "$casts" ]; then
    flag "$f" "type assertions added: ${casts% }" "$STYLE (No any, no type casting)"
  fi
done

[ "$hits" -eq 0 ] && exit 0
echo
echo "pattern-preflight: $hits item(s). Read each reference, fix the code or say in the PR why it does not apply."
exit 3
