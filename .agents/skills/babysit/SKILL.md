---
name: babysit
description: Use when asked to babysit, monitor, shepherd, or keep working on a GitHub pull request until it is green, review-ready, approved, mergeable, or ready to merge. Reviews the PR first and reports findings, loops on CI and review feedback, announces the PR in #frontend, then keeps watching.
---

# Babysit

Take a pull request from wherever it is to ready-to-merge, and keep it there.

Opens the PR if the branch has none, reviews it, gets CI green, answers reviewer and
bot comments, announces it in `#frontend`, then keeps watching until it is ready.

Never merge unless the user explicitly asks.

## Setup

The Slack tools are deferred. Load them in one call before starting:

```
ToolSearch(query: "select:mcp__claude_ai_Slack__slack_search_public,mcp__claude_ai_Slack__slack_read_thread,mcp__claude_ai_Slack__slack_send_message")
```

References, read on demand rather than up front:

- `references/gh-cookbook.md` - every `gh` and GraphQL call used below
- `references/ci-playbook.md` - CI check to local `pnpm` command
- `references/review-focus.md` - Lago focus areas passed to `/review`
- `references/slack-format.md` - `#frontend` announcement format

## The two durable-state rules

Babysit keeps no local state file. Both pieces of memory live in the systems of record,
so any session on any machine resolves the same behaviour and teammates can see it.

1. **The decline ledger lives in the PR.** Declined bot comments carry a hidden marker
   in the reply body.
2. **The announcement in `#frontend` is the mode switch.** Its presence means the
   review and the announce already happened.

Never replace either with a file in the repo or in a scratch directory.

---

## Phase 0 - Identify or open the PR

1. Argument given (`/babysit 4020`) -> use it. Otherwise find the current branch's PR:
   `gh pr view --json number,url,title,body,headRefName,...`.
2. Closed or merged -> report and stop.
3. **No PR for the branch -> open one, ready for review.**
   - Refuse only in the degenerate cases: the branch is `main`, or there are no commits
     ahead of the base.
   - Push first if the branch has no upstream: `git push -u origin HEAD`.
   - Title: conventional-commit form, derived from the commits.
   - Body: `.github/pull_request_template.md`, with `Fixes LAGO-XXX` filled in from the
     branch name or commit trailers. Leave the placeholder alone when no ticket can be
     found.
   - Base: `main`, unless the branch is visibly stacked on another open PR's head, in
     which case base on that.
   - Not a draft. Do not prompt. Print the created PR and continue into Phase 1.
4. **Branch and head-ref mismatch.** Compare the local branch name to `headRefName`.
   In a Conductor worktree they often differ. Every push in this run must then use
   `git push origin HEAD:<headRefName>`. Pushing the local branch name creates a stray
   branch and leaves the PR stale.

## Phase 0.5 - Resolve the mode

Before reviewing anything, look for a prior announcement in `#frontend`. See
`references/slack-format.md` for the query and the boundary check that stops
`pull/402` from matching `pull/4020`.

| Announcement            | Mode          | Behaviour                                                                       |
| ----------------------- | ------------- | --------------------------------------------------------------------------------- |
| Not found               | **First run** | Phase 1 review, triage, loop, announce, then watch                              |
| Found (keep its `ts`)   | **Follow-up** | **Skip Phase 1. Skip the announce.** Straight into the loop and the watch       |

Follow-up mode is the resume path: the earlier session was closed, ran out of context,
or `/loop` started a fresh one. Skipping the review is deliberate. It already ran and
the user already triaged it; re-running would re-litigate settled decisions.
`/babysit <n> --review` forces Phase 1 again when the PR has changed substantially.

## Phase 1 - Review, report, triage

First run only. Do not write a review from scratch here. Delegate to the built-in
`/review`, which takes a PR number:

```
Skill(skill: "review", args: "<n>\n\nFocus areas:\n<contents of references/review-focus.md>")
```

Then turn its findings into a triage list:

1. Drop anything CI already covers (formatting, type errors, failing tests, lint). Those
   are the loop's job, not a decision for the user.
2. Drop findings on lines the PR did not touch.
3. Renumber the survivors and present them.

```
### Review - PR #4020 (title)

| # | Sev  | File:line            | Finding                                  |
|---|------|----------------------|------------------------------------------|
| 1 | high | usePlanDrawer.tsx:42 | ref-based drawer, CLAUDE.md forbids      |
| 2 | med  | cache.ts             | new list field not in queryFieldPolicies |

CI: 2 failing (Run linters, Tests shard 3/4) | Reviews: none | Mergeable: clean

Fix which before the loop starts? (all / 1 / none)
```

Nothing is posted to GitHub in this phase. No findings -> say so and go straight to the
loop. This is the one point in the run that waits for the user.

## Phase 2 - The loop

Each round:

1. **Refresh.** `git fetch origin`, `gh pr view --json ...`, and the `reviewThreads`
   GraphQL query.
2. **Rebuild the decline ledger.** Scan every review thread, including resolved and
   outdated ones, for `<!-- babysit:declined ... -->` markers. Rebuilt from the PR each
   round, so it survives restarts.
3. **Work the highest-priority blocker**: draft, then conflicts, then failing checks,
   then comments, then pending checks, then pending review.

### Approval never blocks

The loop runs for hours. Halting on every decision would stall it on round one and
leave the CI failure behind it undiscovered. So **nothing in the loop is a blocking
prompt.** Each round sorts work into two piles.

**Act now, no approval:**

- CI failures. Map the check to a local command via `references/ci-playbook.md`,
  reproduce locally, fix, validate, commit, push. Never push a speculative fix.
- Bot comments judged DECLINE, and duplicate auto-resolves.
- **Mechanical** bot fixes: provably no behaviour change. Typo, missing type
  annotation, extracted constant, unused import, renamed local, null check on a value
  already proven non-null on that path.

**Queue and keep going:**

- **Behavioural** bot fixes: anything touching control flow, an API surface, a public
  prop, error-handling semantics, or falsy handling. `||` to `??` is behavioural, not a
  style nit.
- All human feedback, however mechanical it looks. A human comment can carry intent the
  diff does not show.
- Everything classified ESCALATE.

Queued items surface in every round summary and drain the moment the user answers,
whether that is immediately or hours later. They never expire and are never silently
dropped.

```
Round 4 | 14:22
  CI      : Run linters failed -> pnpm lint:fix, pushed 8f21ac
  Bots    : 1 declined (duplicate of a3f1c9), 1 mechanical applied (typo)
  Pending : 2 awaiting you
            [1] Copilot: || -> ?? in usePlanDrawer.tsx:42 (behavioural)
            [2] Allan (Slack): reuse useFeatureDrawer instead
  Next    : re-checking in 20 min. Answer any time: "apply 1", "skip 2".
```

### Fixing rules

- Read the code before changing it.
- Keep fixes scoped to the blocker. Preserve unrelated worktree changes.
- Run `pnpm code:style` once before the final push of a round, not after every edit.
- Do not start a second copy of a validation command that is already running.
- Same check failing twice for different reasons: keep going. Twice for the same
  unclear reason: summarise the evidence and queue it for the user.
- Wait for a pending check rather than re-triggering it. Run Test E2E takes ~11 min.
- **Before every push**, confirm the remote head sha still matches what the round
  started from. If it moved, abandon this round's push and start a fresh round. Never
  force.

## Phase 3 - Comment triage

For each unresolved thread whose first comment is from a bot
(`copilot-pull-request-reviewer[bot]`, or any `*[bot]`):

### A. Dedup against the ledger

This is what stops Copilot re-posting a comment already settled.

Fingerprint: first 6 hex of `sha1(path + "|" + normalised_body)`, where the body is
lowercased, code fences and `suggestion` blocks stripped, **all digits removed** so
line-number drift does not change it, whitespace collapsed.

- **Exact fingerprint in the ledger** -> resolve the thread immediately with a one-line
  reply linking the original decline. No re-analysis. One line in the round summary,
  nothing more.
- **No exact hit** -> compare against the ledger's `topic=` slugs, of which there are
  only ever a handful. Same file and same topic, just reworded -> duplicate. Resolve it
  and record the new fingerprint as an alias so the next variant matches exactly.

### B. Decide, for genuinely new comments

| Verdict      | When                                                                                                     | Action                                        |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **APPLY**    | Real bug, or a concrete CLAUDE.md violation                                                              | Mechanical: apply and push. Otherwise queue   |
| **DECLINE**  | Contradicts CLAUDE.md, pre-existing, a linter or typechecker concern, a nitpick, or wrong about the code | Reply with reasoning and marker, resolve      |
| **ESCALATE** | Product-sensitive, ambiguous, or a judgment call about intent                                            | Queue for the user, leave the thread open     |

DECLINE needs evidence, not an opinion: cite the CLAUDE.md rule, the `file:line`, or the
git history that makes the comment wrong. A comment that is merely tedious to handle is
an ESCALATE, not a DECLINE.

### C. Post the decline

```markdown
Not applying: <one or two sentences of concrete reasoning, citing a rule or file:line>.

<!-- babysit:declined v1 fp=a3f1c9 path=src/foo/useBar.tsx topic="ref-drawer-pattern" -->
```

Then resolve the thread. The marker does not render in GitHub's UI but is present in
the API body, which is what makes the ledger work.

**Human reviewers are never auto-declined.** Disagreeing with a human "changes
requested" is always an ESCALATE. Report the disagreement with reasoning and let the
user answer the reviewer.

## Phase 4 - Announce in #frontend

Reaching this point means the babysitting worked. That is when the PR should reach the
team.

Gate, all of which must hold:

- PR open and not a draft.
- All required checks passing, no merge conflicts.
- No unresolved threads classified APPLY or ESCALATE. Threads that were DECLINEd and
  resolved do not block. That is the point of the ledger.
- Not already announced.

Compose per `references/slack-format.md` and post to `C04DJLU0KHD` with
`slack_send_message`. No confirmation prompt. Print the message and its permalink so
the run's output shows exactly what went out. Keep the returned `ts` as the thread
anchor.

Gate not met -> skip the announce, say which condition failed, and carry on watching.

## Phase 5 - Keep watching

Announcing is not the end. Keep looping until the PR is ready to merge, now on a
**20 minute** interval, because it is waiting on humans rather than CI.

Wait with the `Monitor` tool in an until-loop. Foreground `sleep` is blocked by the
harness. `gh pr checks --watch --interval 30` still covers the short CI waits inside a
round.

Each round is a delta check, not a full re-read. Compare head sha, check conclusions,
review-thread count, and the Slack thread's latest reply `ts` against the previous
round. Nothing changed and nothing pending -> one line, back to waiting. This is what
makes a multi-hour watch affordable.

### Slack thread as a second feedback source

Read the announcement thread with `slack_read_thread(C04DJLU0KHD, ts)`. Replies are
humans, so they follow the human rules exactly: always queued, never auto-applied, and
disagreement escalates. Anything newer than babysit's own last reply is new.

After fixes land, post one batched reply in the thread with the commit sha. One per
round, not one per comment.

```
Feedback this round:
  GitHub threads : 1 new (copilot, duplicate of a3f1c9, resolved)
  Slack thread   : 2 new (Allan, Mimmo)
```

### Exit the watch

Always print the resume command on the way out.

- **Ready to merge.** Report and stop. Never merge unless explicitly asked.
- **6 consecutive quiet rounds** (~2 hours) with an empty queue. Reviewers are not
  looking today. Exit with `/loop 20m /babysit <n>`, which does the same watch
  unattended without holding a session open.
- **Context running low.** Exit deliberately with a written handoff and the same
  `/loop` command, rather than degrading mid-round.
- Protected action needed, CI unavailable long enough that waiting is pointless, or the
  user stops it.

## Final report

- PR URL and state.
- What was fixed, and what was verified.
- Declined comments, one line each.
- Slack permalink, if announced.
- Unanswered pending items.
- Remaining human action.
