#!/usr/bin/env bash
# Exercises loop-plan-check.sh and diff-hygiene.sh against a throwaway git repo.
# Run: bash scripts/loop-plan-check.test.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
[ -n "$test_root" ] && [ -d "$test_root" ] || { echo "mktemp -d gave no sandbox" >&2; exit 1; }
trap 'rm -rf "$test_root"' EXIT

wt="$test_root/wt"
mkdir -p "$wt/src/core" "$wt/src/generated"

# Everything below commits and rewrites refs with `git -C "$wt"`. Were $wt ever to land on a real
# checkout, `add -A` would record the whole repo as deleted, so prove the sandbox owns it first.
case "$wt" in
  "$test_root"/*) ;;
  *) echo "refusing: $wt escapes the sandbox $test_root" >&2; exit 1 ;;
esac
if git -C "$wt" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "refusing: $wt already sits inside a git repository" >&2
  exit 1
fi

git -C "$wt" init -q -b main
sandbox_top="$(cd "$wt" && git rev-parse --show-toplevel)"
[ "$sandbox_top" = "$(cd "$wt" && pwd -P)" ] || {
  echo "refusing: $wt is not its own repository root ($sandbox_top)" >&2
  exit 1
}
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
out="$(run_plan "$plan")"
expect "fully declared plan is the adversarial trigger" "adversarial pass applies" "$out"
expect "fully declared plan exits 3" "rc=3" "$out"
rm "$wt/src/core/newThing.ts"

src 'export const a = 1'
expect "no new export exits 0" "rc=0" "$(run_plan "$plan")"

src 'export const a = 1' "export { helper, other as renamed } from './b'" "export type { Shape } from './b'"
out="$(run_plan "$plan")"
expect "named re-export detected" "export: renamed" "$out"
expect "type re-export detected" "export: Shape" "$out"
refute "declared name in a re-export accepted" "export: helper" "$out"

src 'export const a = 1' "export * from './everything'"
expect "star re-export needs the module in the plan" "reexport: ./everything" "$(run_plan "$plan")"
printf '# plan\n## New exports\n- everything re-exported from ./everything\n' >"$plan"
expect "declared star re-export triggers adversarial" "rc=3" "$(run_plan "$plan")"
printf '# plan\n## Files to change\n- src/core/a.ts\n## New files\n- src/core/newThing.ts\n## New exports\n- helper (src/core/a.ts)\n- NEW_THING\n' >"$plan"

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
