#!/usr/bin/env bash
# Exercises skill-budget.sh against a throwaway .agents tree: caps, line cap,
# ticket-ID scan and its allowlist. Run: bash scripts/skill-budget.test.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf "$test_root"' EXIT

mkdir -p "$test_root/scripts" "$test_root/.agents/skills"
cp "$repo_root/scripts/skill-budget.sh" "$test_root/scripts/"
printf '# root\n' >"$test_root/CLAUDE.md"

checks_file() {
  local n="$1" body="" i
  for ((i = 1; i <= n; i++)); do body+="   $i. check $i"$'\n'"      - detail"$'\n'; done
  printf '# skill\n\n<!-- checks:start -->\n%s<!-- checks:end -->\n' "$body"
}

write_skill() { mkdir -p "$test_root/.agents/skills/$1"; cat >"$test_root/.agents/skills/$1/SKILL.md"; }
write_lines() { local i; for ((i = 1; i <= $2; i++)); do echo "line $i"; done >"$test_root/.agents/skills/$1/SKILL.md"; }

reset_tree() {
  checks_file 7 | write_skill loop-review
  checks_file 7 | write_skill loop-build
  checks_file 5 | write_skill loop-spec
  mkdir -p "$test_root/.agents/skills/loop-run"; write_lines loop-run 150
}

run() { (cd "$test_root" && bash scripts/skill-budget.sh 2>&1) && echo "rc=0" || echo "rc=$?"; }

fail=0
expect() {
  local name="$1" want="$2" out="$3"
  if [[ "$out" == *"$want"* ]]; then echo "ok   $name"; else echo "FAIL $name — wanted '$want' in:"; echo "$out"; fail=1; fi
}

reset_tree
expect "within budget passes" "rc=0" "$(run)"

reset_tree; checks_file 8 | write_skill loop-review
expect "8 checks in loop-review fails" "loop-review holds 8 checks, cap is 7" "$(run)"

reset_tree; printf '# skill\n1. no markers\n' | write_skill loop-build
expect "missing markers fails" "no <!-- checks:start --> marker" "$(run)"

reset_tree; write_lines loop-run 151
expect "151 lines in loop-run fails" "loop-run/SKILL.md is 151 lines, cap is 150" "$(run)"

reset_tree; printf '# skill\nsee <TEAM>-<N> and <ISSUE-ID>\n' | write_skill other
expect "placeholders pass" "rc=0" "$(run)"

reset_tree; printf '# skill\nthis was ING-1234\n' | write_skill other
expect "ticket ID fails" "ticket ID in agent instructions: .agents/skills/other/SKILL.md:2:ING-1234" "$(run)"

reset_tree; printf '# skill\nCVE-2024-1234 GHSA-abcd UTF-8 ISO-8601 UTC-3\n' | write_skill other
expect "allowlisted shapes pass" "rc=0" "$(run)"

reset_tree; printf '# root\nfixes LAGO-1\n' >"$test_root/CLAUDE.md"
expect "CLAUDE.md is scanned" "CLAUDE.md:2:LAGO-1" "$(run)"

exit "$fail"
