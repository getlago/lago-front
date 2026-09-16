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
refute() {
  local name="$1" unwanted="$2" out="$3"
  if [[ "$out" != *"$unwanted"* ]]; then echo "ok   $name"; else echo "FAIL $name — did not want '$unwanted' in:"; echo "$out"; fail=1; fi
}
run_plan() { (bash "$repo_root/scripts/loop-plan-check.sh" "$wt" "$1" 2>&1) && echo "rc=0" || echo "rc=$?"; }
run_hyg()  { (bash "$repo_root/scripts/diff-hygiene.sh" origin/main "$wt" "$@" 2>&1) && echo "rc=0" || echo "rc=$?"; }
src() { printf '%s\n' "$@" >"$wt/src/core/a.ts"; }

# --- plan check -------------------------------------------------------------
plan="$test_root/plan.md"
expect "missing plan exits 2" "rc=2" "$(run_plan "$test_root/nope.md")"

src 'export const a = 1' 'export function helper(): number { return 2 }'
printf 'export const NEW_THING = 3\n' >"$wt/src/core/newThing.ts"
printf 'export const gen = 2\nexport type Generated = string\n' >"$wt/src/generated/graphql.tsx"

printf '# plan\n## Files to change\n- src/core/a.ts\n## New files\nnone\n## New exports\nnone\n' >"$plan"
out="$(run_plan "$plan")"
expect "undeclared new file listed" "file: src/core/newThing.ts" "$out"
expect "undeclared export listed" "export: helper" "$out"
expect "undeclared export in new file listed" "export: NEW_THING" "$out"
refute "generated export ignored" "Generated" "$out"

printf '# plan\n## Files to change\n- src/core/a.ts\n## New files\n- src/core/newThing.ts — no sibling hosts it\n## New exports\n- helper (src/core/a.ts)\n- NEW_THING (src/core/newThing.ts)\n' >"$plan"
expect "declared plan passes" "rc=0" "$(run_plan "$plan")"
rm "$wt/src/core/newThing.ts"

# --- diff hygiene: positions ------------------------------------------------
src 'export const a = 1' 'export const b = 2'
expect "no comments passes" "0 added comment lines" "$(run_hyg)"

src 'export const a = 1' '// line one' '// line two' '// line three' 'export const b = 2'
out="$(run_hyg)"
expect "three-line run flagged" "src/core/a.ts:2: run-over-2" "$out"
expect "three-line run fails" "rc=1" "$out"

src 'export const a = 1' '/**' ' * block' ' */' 'export const b = 2'
expect "three-line block flagged" "run-over-2" "$(run_hyg)"

src 'type Props = {' '  // the customer id' '  customerId: string' '}' 'export const a = 1'
expect "comment inside a type body is prop-doc" "src/core/a.ts:2: prop-doc" "$(run_hyg)"

src 'interface Props {' '  /** whether the row is selected */' '  selected: boolean' '}' 'export const a = 1'
expect "jsdoc inside an interface is prop-doc" "prop-doc" "$(run_hyg)"

src 'export const a = (): void => {' '  // inside a function body, not a type' '  return' '}'
refute "comment in a function body is not prop-doc" "prop-doc" "$(run_hyg)"

src '// design system button' "import Button from '@mui/material/Button'" 'export const a = Button'
expect "comment above an import" "above-import" "$(run_hyg)"

src 'export const a = 1' '// Payment method cell' 'export const PaymentMethodCell = 2'
expect "comment repeating the export name restates" "restates" "$(run_hyg)"

src 'export const a = 1' '// `Rates::UpdateService` freezes terminated rates' 'export const PaymentMethodCell = 2'
out="$(run_hyg)"
refute "comment with real content does not restate" "restates" "$out"
expect "without a plan a legitimate comment is unchecked" "unchecked (no plan.md)" "$out"
expect "without a plan nothing else is flagged" "rc=0" "$out"

# --- diff hygiene: declaration ----------------------------------------------
src 'export const a = 1' '// `Rates::UpdateService` freezes terminated rates' 'export const PaymentMethodCell = 2'
printf '# plan\n## Comments kept\nnone\n' >"$plan"
out="$(run_hyg "$plan")"
expect "undeclared comment flagged" "src/core/a.ts:2: undeclared" "$out"
expect "undeclared comment fails" "rc=1" "$out"

printf '# plan\n## Comments kept\n- src/core/a.ts — constraint — "`Rates::UpdateService` freezes terminated rates"\n## Deviations\nnone\n' >"$plan"
out="$(run_hyg "$plan")"
expect "declared comment accepted" "src/core/a.ts:2: declared" "$out"
expect "declared comment passes" "rc=0" "$out"

printf '# plan\n## Comments kept\n- src/core/a.ts — "`Rates::UpdateService` freezes terminated rates"\n' >"$plan"
expect "declaration without a category is undeclared" "undeclared" "$(run_hyg "$plan")"

src 'type Props = {' '  // the customer id' '  customerId: string' '}' 'export const a = 1'
printf '# plan\n## Comments kept\n- src/core/a.ts — constraint — "the customer id"\n' >"$plan"
expect "a declared prop-doc is still refused" "prop-doc" "$(run_hyg "$plan")"

exit "$fail"
