---
name: loop-review
description: 'Phase 3 of the loop pipeline for lago-front. Takes an ISSUE-ID, reviews the worktree diff against spec.md and plan.md with clean context, and writes a PASS/FAIL verdict to review.md in the run state dir. Use when user says "/loop-review <ISSUE-ID>" or the loop-run orchestrator dispatches the review phase in a fresh subagent.'
---

# Loop Review — phase 3 of loop-run

**Input:** an ISSUE-ID. State dir: `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`). Requires `spec.md`, `plan.md` and `state.md` (worktree path). If missing, stop and say which phase to run first. The `worktree:` path is all this skill needs — every command below is the same in both layouts.

**Clean context:** this skill runs with NO knowledge of how the code was written (loop-run dispatches it in a fresh subagent). Judge only what spec.md, plan.md and the diff say. Never assume good intent from the build phase.

**Nothing is fetched.** spec.md carries the ticket verbatim (`## Ticket`), its sources' decisive content, and each premise's verification. Do not call Linear or Notion: the orchestrator already paid for that, and a reviewer that re-reads the ticket from the source drifts from the spec the builder was judged against.

## Steps

1. **Get the diff.** In the worktree from state.md:

   ```bash
   git -C <worktree> add -N . && git -C <worktree> diff origin/main --stat
   git -C <worktree> diff origin/main
   ```

   (`add -N` only marks new files so they appear in the diff — it is part of this pipeline's git exception.)

2. **Gates** — scripts, not judgment. Run them in the worktree before reading a line of code; a red gate is a FAIL issue on its own and the build phase's claim is never trusted:

   ```bash
   pnpm lint && pnpm types && pnpm translations:inspect && pnpm translations:ensure-consistency
   <front>/scripts/diff-hygiene.sh origin/main <worktree> <state dir>/plan.md   # every added comment declared, none in a refused position
   <front>/scripts/loop-plan-check.sh <worktree> <state dir>/plan.md   # new files / exports outside plan.md
   ```

   `loop-plan-check.sh` exit 3 means new files/exports exist and plan.md declares them: each declared item is a question for check 2 below, and loop-run runs the adversarial pass on the same signal. Exit 1 (undeclared) should not survive the build gate; if it does, it is a FAIL issue tagged `[gate:plan]`.

3. **The whole diff first**: read spec.md `## Ticket` and `## Acceptance criteria`, then the diff end to end, and answer before any check: does this diff, as a whole, make sense for the ticket's objective, and is it the smallest change that meets the criteria? A diff can pass every check below and still miss the point, or solve around a premise spec.md marked `unverified` — both are FAIL issues.

4. **Checks.** Seven, capped by `scripts/skill-budget.sh`: a new one enters only by deleting one.

   <!-- checks:start -->
   1. **Every acceptance criterion is met**: map each criterion to the code that satisfies it. A criterion with no code behind it, or code that renders the state the criterion describes as fact before the data answers (a badge claiming "none" while `loading`), is a FAIL.
   2. **Scope is the plan**: nothing outside spec.md "Files to touch" and plan.md without a note in plan.md `## Deviations`. For each new file or export `loop-plan-check.sh` listed, apply the inline test — write the diff without the abstraction; if that version is smaller or equal, the abstraction is a FAIL issue. A feature flag, prop, or callback left half-wired (rendered nowhere, or read but never distinguished from its absence) is scope that was started, not finished.
   3. **Nothing is reimplemented**: no new component/hook/util that replicates `lago-design-system`, a shared module, or a global handler (the Apollo error link, the toast layer, the router wrappers). Open the candidate sibling and say why it did not fit before accepting the new one.
   4. **Conventions and translations**: neighboring code style, `.agents/docs/frontend-coding-styleguide.md`, codegen output consistent; new keys in `translations/base.json` only where no existing label fit (search for one), no dead keys.
   5. **Tests exist and test the branch**: make-tests output is in the diff; no fixture default switches off the branch a test claims to cover (`.agents/docs/testing-practices.md` → "Fixture Defaults"); with more than one navigating path, assertions pin the destination with `toHaveBeenCalledWith` and assert the routes NOT taken; every callback the component passes to a mocked hook (`onCompleted`, `onError`, ...) is captured and invoked.
   6. **Follow the calls out of the diff**: when the diff passes an existing hook/util an argument that used to be constant, open that implementation and verify it honours it; when it reuses a form component on a new surface, walk every optional callback prop the new caller omits and name the user action that omission disables; when it redirects to a route constant, confirm the tab it resolves to; for each persisted field, state what the read path puts back and what the next save sends.
   7. **Declared comments earn their category, and nothing is left behind**: `diff-hygiene.sh` already refused undeclared and mis-positioned comments; read only plan.md `## Comments kept` and FAIL any line whose comment does not do what its category claims — a `constraint` with no identifier a reader could grep, a `why-not` where the alternative was never viable, a `trap` nothing actually trips — or that justifies the diff or answers a review round. No dead code, no unused exports.
   <!-- checks:end -->

5. **Second pass with the code-review skill — inline.** Run `/code-review` in THIS session on the worktree diff, never through the Agent tool: a subagent copy has stalled past its bound on every recorded run and returned later against a stale tree. Fold confirmed findings into the issues list and state in review.md which pass produced each.

6. **Write `review.md`** in the state dir. Every issue names the check that produced it so loop-run can journal it:

   PASS format:

   ```markdown
   Verdict: PASS

   ## Criteria mapping
   <one line per acceptance criterion: criterion → file/code that satisfies it>
   ```

   FAIL format:

   ```markdown
   Verdict: FAIL

   ## Issues
   1. [review#<check> | gate:<name> | code-review] <file:line — problem — what to change>
   2. ...
   ```

   Issues must be concrete and actionable — file, line, problem, fix direction. No style nitpicks that don't change meaning.

7. **Report** the verdict and (if FAIL) the issue list to the operator.

## Hard rules

- Review is read-only on the code: never fix issues yourself, only report them.
- Uncertain whether something is a real problem → it is not an issue; note it as a remark below the Issues list instead.
- Never fetch Linear or Notion. Never run the full jest suite.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
