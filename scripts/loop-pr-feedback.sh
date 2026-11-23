#!/usr/bin/env bash
# loop-pr-feedback.sh — every piece of PR feedback from someone other than the operator, in one list.
#
# PR feedback lives in three GitHub collections (issue comments, reviews, inline
# review comments), and a hand-written `gh`/jq pipeline read as complete has
# already missed a bot's issue-level HOLD. This script reads all three, drops the
# operator's own entries, and flags HOLD verdicts so loop-run and loop-revise
# start from the same complete list.
#
# Usage: loop-pr-feedback.sh <PR> [<owner/repo>]       repo default getlago/lago-front
# Stdout, one line per entry, oldest first:
#   <timestamp> <kind> <author> [HOLD] id=<id> [<path:line>] — <first 120 chars>
#   kind = comment | inline | review:<STATE>   (an empty COMMENTED review is only the
#   container of its inline comments and is skipped)
# Exit 0 = listed, no unanswered HOLD
#      1 = a HOLD newer than the operator's last comment/review exists (listed last as `unanswered HOLD`)
set -euo pipefail

PR="${1:?PR number}"
REPO="${2:-getlago/lago-front}"

operator="$(gh api user --jq .login)"
issue="$(gh api --paginate "repos/$REPO/issues/$PR/comments")"
reviews="$(gh api --paginate "repos/$REPO/pulls/$PR/reviews")"
inline="$(gh api --paginate "repos/$REPO/pulls/$PR/comments")"

out="$(jq -rn --arg op "$operator" \
  --argjson issue "$(jq -s 'add // []' <<<"$issue")" \
  --argjson reviews "$(jq -s 'add // []' <<<"$reviews")" \
  --argjson inline "$(jq -s 'add // []' <<<"$inline")" '
  def hold: (.body // "") | test("verdict:?\\s*\\**\\s*HOLD"; "i");
  (
    [$issue[] | {kind: "comment", at: .created_at, who: .user.login, id, body}]
    + [$reviews[] | select(.state != "COMMENTED" or ((.body // "") != ""))
        | {kind: ("review:" + .state), at: .submitted_at, who: .user.login, id, body}]
    + [$inline[] | {kind: "inline", at: .created_at, who: .user.login, id, body,
        where: "\(.path):\(.line // .original_line // "?")"}]
  ) as $all
  | ([$all[] | select(.who == $op) | .at] | max // "") as $last_op
  | [$all[] | select(.who != $op) | . + {hold: hold}] | sort_by(.at) as $others
  | ($others[]
      | "\(.at) \(.kind) \(.who)\(if .hold then " HOLD" else "" end) id=\(.id)\(if .where then " " + .where else "" end) — \((.body // "") | gsub("\\s+"; " ") | .[0:120])"),
    ($others[] | select(.hold and .at > $last_op) | "unanswered HOLD: \(.who) id=\(.id) at \(.at)")
')"

[ -n "$out" ] && printf '%s\n' "$out"
case "$out" in *"unanswered HOLD:"*) exit 1 ;; esac
exit 0
