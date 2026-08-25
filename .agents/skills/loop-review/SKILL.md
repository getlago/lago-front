---
name: loop-review
description: 'Phase 3 of the loop pipeline for lago-front. Takes an ISSUE-ID, reviews the worktree diff against the ticket spec with clean context, and writes a PASS/FAIL verdict to review.md in the run state dir. Use when user says "/loop-review <ISSUE-ID>" or the loop-run orchestrator dispatches the review phase in a fresh subagent.'
---

# Loop Review — phase 3 of loop-run

**Input:** an ISSUE-ID. State dir: `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`). Requires `spec.md` and `state.md` (worktree path). If missing, stop and say which phase to run first.

**Clean context:** this skill is designed to run with NO knowledge of how the code was written (loop-run dispatches it in a fresh subagent). Judge only what spec.md, the sources it links, and the diff say. Never assume good intent from the build phase.

## Steps

1. **Get the diff.** In the worktree from state.md:

   ```bash
   git -C <worktree> add -N . && git -C <worktree> diff origin/main --stat
   git -C <worktree> diff origin/main
   ```

   (`add -N` only marks new files so they appear in the diff — it is part of this pipeline's git exception.)

2. **Re-read the objective**: fetch the Linear ticket (and the Notion pages listed in spec.md Sources) and answer first: does this diff, as a whole, make sense for the ticket's objective? A diff can pass every mechanical check and still miss the point — that is a FAIL issue.

3. **Review the diff against spec.md and sources**, checking in order:
   1. Every acceptance criterion is met by the diff (map each criterion to the code that satisfies it).
   2. No scope creep: nothing outside "Files to touch" without a justifying note in spec.md.
   3. **No useless duplication**: no new component/hook/util that replicates something in `lago-design-system` or the shared codebase; no copy-pasted logic that should be extracted or reused.
   4. **Translations**: new keys in `translations/base.json` only where no existing label fit; no dead keys left; run `pnpm translations:inspect` to verify.
   5. Conventions: neighboring code style + the Frontend coding styleguide (Notion page linked in spec.md context); GraphQL codegen output consistent.
   6. Tests exist for the change (make-tests output present in the diff).
   7. No dead code, no unused exports, no console.log/debug leftovers.
   8. **Redundant comments**: a comment added or modified by the diff that restates a convention, repeats one already in the same block, or narrates self-evident code (a self-speaking prop, what a well-named variable holds, what the next line does) is a FAIL item (`redundant comment`). A comment stating a constraint, a non-obvious why, or a cross-file invariant the code cannot show is fine — the same three categories loop-build's comment rule allows.
   9. **Navigation assertions pin the destination**: effects run in declaration order and the last navigate wins, so a bare `expect(navigate).toHaveBeenCalled()` stays green even when a later guard overwrites a correct redirect. With more than one navigating path, require `toHaveBeenCalledWith(...)` and assertions on the routes NOT taken.
   10. **Hook-mock callbacks all exercised**: the spec must capture and invoke every callback the component passes in (`onCompleted`, `onError`, ...) — one the mock drops is an untested path that still ships.
   11. **Redirect targets**: when a redirect uses a route constant, confirm it is the view intended — tab-less constants are often aliased to a default tab through a `match:` array.
   12. Gates actually green: re-run `pnpm lint` and `pnpm types` in the worktree — do not trust the build phase's claim.

4. **Second pass with the code-review skill**: run the `/code-review` skill (working-diff reviewer) on the worktree diff and fold any confirmed findings into the issues list.

5. **Write `review.md`** in the state dir:

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
   1. <file:line — problem — what to change>
   2. ...
   ```

   Issues must be concrete and actionable — file, line, problem, fix direction. No style nitpicks that don't change meaning.

6. **Report** the verdict and (if FAIL) the issue list to the operator.

## Hard rules

- Review is read-only on the code: never fix issues yourself, only report them.
- Uncertain whether something is a real problem → it is not an issue; note it as a remark below the Issues list instead.
- Never run the full jest suite.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
