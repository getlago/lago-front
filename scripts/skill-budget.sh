#!/usr/bin/env bash
# skill-budget.sh — mechanical caps on the agent instructions under .agents/.
#
# Every skill file is read in full on every run, and attention is a fixed budget:
# a check added past the cap subtracts from the ones already there. The cap
# lives here, in a script the pre-push hook runs, not in a rule an agent has to
# remember while it is busy adding the next rule.
#
# Three checks, all on the tracked markdown only:
#   1. checks per skill  — numbered items between `<!-- checks:start -->` and
#                          `<!-- checks:end -->` in each capped skill ≤ its cap
#   2. lines per skill   — the orchestrator skill stays a flow, not a manual
#   3. no ticket IDs     — no Linear-shaped identifier anywhere under .agents/**
#                          or in CLAUDE.md; examples use <ISSUE-ID> or <TEAM>-<N>
#
# Usage: skill-budget.sh            exit 0 = within budget, 1 = over, with one line per breach
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS="$ROOT/.agents/skills"
status=0

fail() {
  echo "skill-budget: $*" >&2
  status=1
}

# --- 1. checks per skill --------------------------------------------------
# A check is an ordered-list item (`N.`) inside the markers. Sub-detail uses
# `-` bullets and does not count, so a check can carry its remedy without
# spending a slot.
count_checks() {
  awk '
    /<!-- checks:start -->/ { inside = 1; next }
    /<!-- checks:end -->/   { inside = 0; next }
    inside && /^[[:space:]]*[0-9]+\.[[:space:]]/ { n++ }
    END { print n + 0 }
  ' "$1"
}

while IFS=: read -r skill cap; do
  file="$SKILLS/$skill/SKILL.md"
  [ -f "$file" ] || { fail "$skill/SKILL.md missing"; continue; }
  grep -q '<!-- checks:start -->' "$file" || { fail "$skill/SKILL.md has no <!-- checks:start --> marker"; continue; }
  n="$(count_checks "$file")"
  if [ "$n" -gt "$cap" ]; then
    fail "$skill holds $n checks, cap is $cap — a new check enters only by deleting one"
  fi
done <<'CAPS'
loop-review:7
loop-build:7
loop-spec:5
CAPS

# --- 2. lines per skill -----------------------------------------------------
while IFS=: read -r skill cap; do
  file="$SKILLS/$skill/SKILL.md"
  [ -f "$file" ] || continue
  n="$(wc -l <"$file" | tr -d ' ')"
  if [ "$n" -gt "$cap" ]; then
    fail "$skill/SKILL.md is $n lines, cap is $cap — move mechanics into scripts/"
  fi
done <<'LINES'
loop-run:150
LINES

# --- 3. no ticket IDs --------------------------------------------------------
# Real IDs date a rule instead of stating it, and are dangling pointers for the
# AI reading the file. The allowlist is for identifiers that share the shape
# but are not tickets.
ALLOW='(CVE|GHSA|UTF|ISO|RFC|SHA|UTC|GMT)-'
hits="$(grep -rnoE '\b[A-Z]{2,6}-[0-9]+\b' "$ROOT/.agents" "$ROOT/CLAUDE.md" 2>/dev/null \
  | grep -vE ":${ALLOW}" || true)"
if [ -n "$hits" ]; then
  while IFS= read -r line; do
    fail "ticket ID in agent instructions: ${line#"$ROOT"/}"
  done <<<"$hits"
fi

if [ "$status" -eq 0 ]; then
  echo "skill-budget: within budget"
fi
exit "$status"
