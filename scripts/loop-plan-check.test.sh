#!/usr/bin/env bash
# Exercises loop-plan-check.sh and diff-hygiene.sh against a throwaway git repo.
# Run: bash scripts/loop-plan-check.test.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

wt="$test_root/wt"
mkdir -p "$wt/src/core" "$wt/src/generated"
git -C "$wt" init -q -b main
git -C "$wt" config user.email t@example.com
git -C "$wt" config user.name t
printf 'export const a = 1\n' >"$wt/src/core/a.ts"
printf 'export const gen = 1\n' >"$wt/src/generated/graphql.tsx"
git -C "$wt" add -A && git -C "$wt" commit -qm base
git -C "$wt" update-ref refs/remotes/origin/main HEAD

fail=0
expect() {
  local name="$1" want="$2" out="$3"
  if [[ "$out" == *"$want"* ]]; then echo "ok   $name"; else echo "FAIL $name — wanted '$want' in:"; echo "$out"; fail=1; fi
}
run_plan() { (bash "$repo_root/scripts/loop-plan-check.sh" "$wt" "$1" 2>&1) && echo "rc=0" || echo "rc=$?"; }
run_hyg()  { (bash "$repo_root/scripts/diff-hygiene.sh" origin/main "$wt" 2>&1) && echo "rc=0" || echo "rc=$?"; }

# --- plan check -------------------------------------------------------------
plan="$test_root/plan.md"
expect "missing plan exits 2" "rc=2" "$(run_plan "$test_root/nope.md")"

printf 'export const a = 1\nexport function helper(): number { return 2 }\n' >"$wt/src/core/a.ts"
printf 'export const NEW_THING = 3\n' >"$wt/src/core/newThing.ts"
printf 'export const gen = 2\nexport type Generated = string\n' >"$wt/src/generated/graphql.tsx"

printf '# plan\n## Files to change\n- src/core/a.ts\n## New files\nnone\n## New exports\nnone\n' >"$plan"
out="$(run_plan "$plan")"
expect "undeclared new file listed" "file: src/core/newThing.ts" "$out"
expect "undeclared export listed" "export: helper" "$out"
expect "undeclared export in new file listed" "export: NEW_THING" "$out"
expect "generated file ignored" "rc=1" "$out"
[[ "$out" == *"Generated"* ]] && { echo "FAIL generated export should be ignored"; fail=1; }

printf '# plan\n## Files to change\n- src/core/a.ts\n## New files\n- src/core/newThing.ts — no sibling hosts it\n## New exports\n- helper (src/core/a.ts)\n- NEW_THING (src/core/newThing.ts)\n' >"$plan"
expect "declared plan passes" "rc=0" "$(run_plan "$plan")"

# --- diff hygiene -----------------------------------------------------------
printf 'export const a = 1\n// one line is fine\nexport const b = 2\n' >"$wt/src/core/a.ts"
rm "$wt/src/core/newThing.ts"
expect "one-line comment passes" "rc=0" "$(run_hyg)"

printf 'export const a = 1\n// line one\n// line two\n// line three\nexport const b = 2\n' >"$wt/src/core/a.ts"
out="$(run_hyg)"
expect "three-line run fails" "rc=1" "$out"
expect "run is reported with its file" "src/core/a.ts: comment run of 3 lines" "$out"

printf 'export const a = 1\n/**\n * block\n */\nexport const b = 2\n' >"$wt/src/core/a.ts"
expect "three-line block comment fails" "comment run of 3 lines" "$(run_hyg)"

exit "$fail"
