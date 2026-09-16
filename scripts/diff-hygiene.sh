#!/usr/bin/env bash
# diff-hygiene.sh — the comment rule as a gate, not a prose check.
#
# `.agents/docs/typescript-conventions.md` → "Comments: Default to None". The
# rule was written three times as prose and the loop kept adding comments
# anyway, because a comment is written with the line and a rule is read
# minutes earlier. So the default is enforced here: every comment the diff adds
# is flagged unless it is DECLARED in plan.md with one of the three categories
# the doc admits (constraint / why-not / trap), and some positions are refused
# outright because the doc names them as never legitimate.
#
# Flags, per run of consecutive comment lines:
#   prop-doc       inside a `type … = {` / `interface … {` body (documents a prop)
#   above-import   directly above an import
#   restates       one line above an export whose name it merely repeats
#   run-over-2     longer than 2 lines
#   undeclared     not listed under `## Comments kept` in plan.md (only when a plan is given)
# Tool directives (`eslint-disable`, `@ts-expect-error`, …) are never flagged.
#
# plan.md declaration format, one line per kept comment:
#   - <path> — constraint|why-not|trap — "<first words of the comment>"
#
# Usage: diff-hygiene.sh [<base-ref>] [<worktree>] [<plan.md>]
#   base-ref  default origin/main;  worktree default cwd;  plan.md optional
# Exit 0 = nothing flagged; 1 = at least one flag. Stdout lists every added
# comment run with its flag or `declared`, for the reviewer.
set -euo pipefail

BASE="${1:-origin/main}"
WT="${2:-$(pwd)}"
PLAN="${3:-}"

# Added lines with their line number in the new file, source files only.
added="$(git -C "$WT" diff -U0 "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' 'cypress/**/*.ts' ':!src/generated/**' \
  | awk '
      /^\+\+\+ / { file = substr($2, 3); next }
      /^@@ /     { split($3, p, /[+,]/); ln = p[2]; next }
      /^\+/      { print file "\t" ln "\t" substr($0, 2); ln++ }
    ')"

[ -n "$added" ] || { echo "diff-hygiene: no added source lines"; exit 0; }

# Comment lines only: `//`, block-comment lines, JSX `{/*`.
comments="$(printf '%s\n' "$added" | awk -F'\t' '$3 ~ /^[[:space:]]*(\/\/|\/\*|\*[[:space:]]|\*\/|\{\/\*)/')"
[ -n "$comments" ] || { echo "diff-hygiene: 0 added comment lines"; exit 0; }

declared_section=""
if [ -n "$PLAN" ] && [ -f "$PLAN" ]; then
  declared_section="$(awk '/^## Comments kept/ { on = 1; next } /^## / { on = 0 } on' "$PLAN" | tr '[:upper:]' '[:lower:]')"
fi

flagged=0
runs=0
report=""

# One awk pass per file: groups the added comment lines into runs and inspects
# each run's position in the worktree file.
while IFS= read -r file; do
  lines="$(printf '%s\n' "$comments" | awk -F'\t' -v f="$file" '$1 == f { print $2 }' | sort -n | tr '\n' ',')"
  out="$(awk -v targets="$lines" '
    function trim(s) { sub(/^[[:space:]]+/, "", s); sub(/[[:space:]]+$/, "", s); return s }
    function text(s) { gsub(/^[[:space:]]*(\/\/|\/\*\*?|\*\/|\*|\{\/\*)[[:space:]]?/, "", s); gsub(/\*\/\}?[[:space:]]*$/, "", s); return trim(s) }
    function alnum(s) { s = tolower(s); gsub(/[^a-z0-9 ]/, "", s); return s }
    function is_comment(s) { return s ~ /^[[:space:]]*(\/\/|\/\*|\*[[:space:]]|\*\/|\{\/\*)/ }
    function opens(s)  { return gsub(/\{/, "{", s) }
    function closes(s) { return gsub(/\}/, "}", s) }
    function inside_type(f,   j, d, line) {
      d = 0
      for (j = f - 1; j >= 1; j--) {
        line = L[j]
        d += closes(line) - opens(line)
        if (d < 0) {
          if (line ~ /(^|[[:space:]])(type|interface)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*.*\{/) return 1
          if (line ~ /(=>|\)|function[^{]*|class[^{]*|else|try|do)[[:space:]]*\{/) return 0
          d = 0
        }
      }
      return 0
    }
    function restates(f, l, next_line,   name, t, w, n, i, all) {
      if (l != f) return 0
      if (match(next_line, /export[[:space:]]+(default[[:space:]]+)?(async[[:space:]]+)?(const|let|function|class|type|interface|enum)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*/) == 0) return 0
      name = substr(next_line, RSTART, RLENGTH); sub(/.*[[:space:]]/, "", name); name = tolower(name)
      t = alnum(text(L[f]))
      if (t == "") return 0
      if (index(t, name) > 0) return 1
      n = split(t, w, " "); all = 0
      for (i = 1; i <= n; i++) { if (length(w[i]) <= 2) continue; all++; if (index(name, w[i]) == 0) return 0 }
      return all > 0
    }
    { L[NR] = $0 }
    END {
      n = split(targets, T, ",")
      for (i = 1; i <= n; i++) if (T[i] != "") { m++; S[m] = T[i] + 0 }
      f = 0
      for (i = 1; i <= m; i++) {
        if (f == 0) { f = S[i]; l = S[i] }
        else if (S[i] == l + 1) { l = S[i] }
        if (i == m || S[i + 1] != l + 1) {
          k = l + 1
          while (k <= NR && (trim(L[k]) == "" || is_comment(L[k]))) k++
          nxt = (k <= NR) ? L[k] : ""
          kind = "-"
          first = ""
          for (j = f; j <= l && first == ""; j++) first = text(L[j])
          if (first ~ /^(eslint-|@ts-|prettier-|biome-)/)  kind = "directive"
          else if (l - f + 1 > 2)                          kind = "run-over-2"
          else if (inside_type(f))                    kind = "prop-doc"
          else if (nxt ~ /^[[:space:]]*import[[:space:]]/) kind = "above-import"
          else if (restates(f, l, nxt))               kind = "restates"
          printf "%d\t%s\t%s\n", f, kind, first
          f = 0
        }
      }
    }' "$WT/$file")"

  while IFS=$'\t' read -r ln kind first; do
    [ -n "$ln" ] || continue
    runs=$((runs + 1))
    [ "$kind" = "-" ] && kind=""
    if [ -z "$kind" ] && [ -n "$declared_section" ]; then
      key="$(printf '%s' "$first" | tr '[:upper:]' '[:lower:]' | cut -c1-30)"
      base="$(basename "$file" | tr '[:upper:]' '[:lower:]')"
      if printf '%s\n' "$declared_section" | grep -F -- "$key" | grep -F -- "$base" | grep -qE 'constraint|why-not|trap'; then
        kind="declared"
      else
        kind="undeclared"
      fi
    elif [ -z "$kind" ]; then
      kind="unchecked (no plan.md)"
    fi
    case "$kind" in declared|directive|"unchecked (no plan.md)") ;; *) flagged=$((flagged + 1)) ;; esac
    report+="  $file:$ln: $kind — $first"$'\n'
  done <<<"$out"
done < <(printf '%s\n' "$comments" | cut -f1 | sort -u)

printf '%s' "$report"
echo "diff-hygiene: $runs added comment run(s), $flagged flagged"
[ "$flagged" -eq 0 ]
