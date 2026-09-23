---
name: loop-revise
description: 'Post-PR revision phase of the loop pipeline for lago-front. Takes an ISSUE-ID (or nothing, when run inside the checkout that owns the PR) and feedback, applies ONLY the requested changes in the worktree recorded in state.md — a lago-worktree worktree or, in the `in-place` layout, the current checkout — re-runs gates, commits, pushes, and watches CI. Use when user says "/loop-revise <ISSUE-ID> <feedback>", or asks to change something in a PR the loop opened.'
---

# Loop Revise — apply feedback to an open loop PR

**Input:** a task reference + feedback. The reference can be ANY of:
- an ISSUE-ID (`<TEAM>-<N>`) — direct key of the state dir;
- a PR number (`4065` / `#4065`) or PR URL — resolve it: `gh pr view <n> --json headRefName` → branch → the `$LOOP_STATE_DIR/*/state.md` whose `branch:` matches → that dir's ISSUE-ID;
- **nothing at all**, when the session already sits in the checkout that owns the PR (the `in-place` layout): resolve from `git rev-parse --abbrev-ref HEAD` → the state dir whose `branch:` matches.

**Layout:** read `layout:` from `state.md` (`worktree` | `in-place`, written by loop-build; missing key = `worktree`). Scripts live in `<worktree>/scripts` in `in-place` and in `front/scripts` in the `worktree` layout; `$SCRIPTS` below means whichever applies.

**State dir:** `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`).

Resolution fails (no matching state dir) → STOP: this PR was not produced by the loop; say so. Feedback comes in two forms, both handled:
- **The operator's free text** (chat, Slack reply) — the operator is the developer running the loop, i.e. the PR author.
- **GitHub PR comments from others** — colleagues or bots. Fetch them:
  ```bash
  gh api repos/getlago/lago-front/pulls/<PR>/comments   # review comments (inline)
  gh pr view <PR> --json comments,reviews                # issue comments and review verdicts
  ```
  Skip feedback authored by the operator (`gh api user --jq .login`) and unchanged, already-answered feedback. Every comment raising a finding, technical question or requested change from a human or bot requires evaluation and a reply, including SonarQube findings and false positives. Never comment merely to announce or acknowledge green CI or SonarQube results; success/status reports without findings require no reply. Praise, approvals and courtesy-only messages without findings or change requests receive no written reply, at most an optional thumbs-up reaction. Evaluate concrete findings even when the overall gate is green.

No free-text feedback given → default to unanswered substantive feedback, including HOLD verdicts and SonarQube findings. None present → report "nothing to revise" to the operator and stop without a PR comment.

**Preconditions:** `state.md` exists in the state dir and the PR for `<ISSUE-ID>` is OPEN (`gh pr view <branch> --json state`). PR MERGED or CLOSED → STOP: nothing to revise, suggest a new ticket instead.

## Steps

1. **Record the feedback**: append it to `feedback.md` in the state dir with a timestamp header (keep prior rounds).

2. **Evaluate the feedback CRITICALLY — before touching any code.** You are a senior peer, not an executor. Check each point against: the spec's acceptance criteria and `## Ticket`, plan.md, the design system, `.agents/docs/frontend-coding-styleguide.md`, and the actual code. Then classify it:
   - **Sound** → say why in one line, proceed.
   - **Sound but better done differently** → propose the alternative with reasoning; let the operator pick.
   - **Breaks an acceptance criterion, duplicates the design system, contradicts the styleguide, or degrades the code** → PUSH BACK with what it breaks and what you'd do instead. Do NOT apply it unless the operator confirms after hearing the objection — then note the override in feedback.md.
   - Verify claims before agreeing ("this rerenders twice" → check). Never implement performatively to please.
   - **Any HOLD, regardless of author**: compare its claim and referenced commit with the current code. Classify it as a real issue, a false positive or already fixed. Apply valid fixes within scope and ALWAYS give the brief reply in step 8, including when no code change is needed. Only an updated verdict from the author lifts their HOLD; a fix or green CI alone does not.
   - **SonarQube findings**: investigate and attempt a focused code fix within the PR's scope. A large refactor or unrelated change belongs in separate work: explain that to the operator instead of expanding the PR. Do not dismiss or suppress a finding merely to make the gate green; existing CI failure handling still applies.
   - External comments (colleagues/bots) get identical scrutiny; for them "push back" is the polite not-applied reply of step 8 — escalate to the operator only when the comment is sound but conflicts with the spec.

3. **Apply — ONLY the agreed points**, in the `worktree:` path from state.md (the cwd itself in `in-place`):
   - No opportunistic refactors, no scope creep beyond the agreed feedback.
   - Same build rules as loop-build: existing mechanism first, reuse `translations/base.json` labels, no dead keys, no dead code, no comment that answers the reviewer. A new file or export goes into plan.md `## Deviations` with its reason.
   - Feedback ambiguous → STOP and ask before coding.

4. **Gates** (in that same path, all must pass): `pnpm lint`, `pnpm types`, `pnpm translations:inspect`, `pnpm translations:ensure-consistency`, `"$SCRIPTS/diff-hygiene.sh" origin/main <worktree> <state dir>/plan.md` (a comment the revision keeps goes into plan.md `## Comments kept` with its category, or goes). If the change touched testable logic: re-invoke the `make-tests` skill on the affected paths, then scoped jest on those paths only. NEVER the full suite.

5. **Restart the app**: `"$SCRIPTS/loop-restart.sh" <state dir>/state.md` (no container → warning, never a blocker).

6. **Commit and push** on the existing branch:

   ```
   fix(<context>): address review feedback

   ## Description

   <bullet list: each feedback point → what changed>

   <!-- Linear link -->
   Refs <ISSUE-ID>
   ```

   Then `git push` — the open PR updates itself.

7. **CI gate**: `gh pr checks <PR> --watch`. Red → same recovery as loop-run, INCLUDING its pre-budget triage of special cases (codegen companion PR, code-scanning re-fingerprint, inherited base red); neither applies → `"$SCRIPTS/iter-budget.sh" <ISSUE-ID> ci-revise` (exit 1 = exhausted → STOP path), then `"$SCRIPTS/loop-ci-log.sh" <ISSUE-ID> <run-id> <N>`, write the distilled `ci-failure.md`, fix, recommit. On STOP: `impediment.md` + `"$SCRIPTS/loop-notify.sh"` exactly as loop-run's exit notification.

8. **ALWAYS reply to every finding, technical question, requested change or HOLD**, applied or not, regardless of whether a human or bot (including SonarQube) authored it. One or two concise sentences in English, no AI attribution. No written replies to success/status reports, praise, approvals or courtesy-only messages without findings or change requests; at most an optional thumbs-up reaction. Never post a green-CI/SonarQube acknowledgement or a duplicate answer to unchanged feedback:
   - Applied / already fixed → `Fixed in <short-sha>: <brief change>.`
   - False positive / not applied → `No change: <one-line technical reason based on the current code>.`
   - Valid but out of scope → `Requires separate work: <brief scope reason>.` Report the follow-up to the operator; do not present the HOLD or failing gate as resolved.
   - Inline review comments: `gh api repos/getlago/lago-front/pulls/<PR>/comments/<comment-id>/replies -f body='...'`. Issue-level: `gh pr comment <PR> --body '...'`.

9. **Journal & flywheel — SILENT bookkeeping, before the report:**
   - `"$SCRIPTS/loop-journal.sh" <ISSUE-ID> "<N> points" <ci-revise N/3> "<gates red, or none>" <outcome> "<fail-checks or none>" "<one short phrase>"`. `<N> points` = feedback points applied. `<outcome>` is the way this revision actually ended: `revised` (pushed, CI green), `stopped-ci` (budget exhausted), or `needs-operator-adjudication`. `fail-checks`: for each external comment that was a real defect, the loop-review check that should have caught it (`review#1` … `review#7`, or `none-covers` when no check addresses that defect class) — this is how the flywheel learns which checks miss what colleagues catch.
   - **Flywheel**: the operator's and colleagues' feedback is the highest-value signal, and it enters `_flywheel.md` under the SAME governance as loop-run: a proposal only when a better instruction would have prevented the defect **and** you can name a second, different plausible occurrence; written as a script or lint rule if it can be one; a new check only naming the check it replaces; no ticket ID in the rule. Both conditions met → append the dated `target / evidence / proposed edit` block. Proposals ONLY: never edit skill files, never ping the operator. One condition → append nothing.

10. **Report**: what changed per feedback point, replies posted, commit SHA, CI status. **NO new #frontend post** — the PR was already announced.

## Hard rules

- **No AI attribution**: commit message contains exactly the template above.
- Only the existing worktree and branch from state.md — never a new branch, never the main checkout, and in `in-place` never `$CONDUCTOR_ROOT_PATH`, another workspace, or a branch rename.
- Only the changes the feedback asks for.
- Humans merge. Never merge, never approve. Never run the full jest suite. No #frontend repost.
- **Two communication registers**: messages to humans (chat report, notifications, GitHub PR comment replies) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, plan.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
