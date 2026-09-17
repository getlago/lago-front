# Adversarial pass — the smallest diff that meets the criteria

Dispatched by loop-run in a fresh subagent ONLY when `scripts/loop-plan-check.sh` lists a new file or a new exported symbol that `plan.md` did not declare. It is the one reviewer that catches over-engineering, and it works by not looking at the answer first.

**Input:** an ISSUE-ID. Read `spec.md` (`## Ticket`, `## Acceptance criteria`, `## Files to touch`) and `state.md` (`worktree:`, `branch:`). Do NOT read `plan.md`, `review.md` or the diff until step 3.

## Steps

1. **Derive the minimal diff.** On the base the branch started from (`git -C <worktree> show origin/main:<path>` — never the working tree), locate the code the criteria touch and write, in your working notes: the files you would change, whether any new file or new export is unavoidable and why, and an estimated line count. Search first for what already exists: a global handler, a shared component, a hook one directory up. The default answer to "does this need a new module?" is no.

2. **Name the premise.** If a criterion only makes sense under a claim spec.md marks `premise: unverified`, say which criterion and what the code shows instead.

3. **Now read the actual diff** (`git -C <worktree> add -N . && git -C <worktree> diff origin/main`) and `plan.md`. Compare against step 1:
   - For every new file or new export the diff adds: write the diff without it (inline it at its call sites). If the inline version is smaller or equal in lines, the abstraction is not earning its place → finding.
   - For every mechanism the diff adds that your minimal version did not need (a per-call-site silence + re-raise where a global handler already fires, a fallback mirroring a backend default, a flag with one consumer): → finding, naming the existing thing that already does the job.
   - A diff smaller than yours is not a finding. Say so and stop.

4. **Write the verdict** to `<state dir>/adversarial.md`, same format as review.md (`Verdict: PASS|FAIL`, `## Issues` with `[adversarial]` prefix, file:line, what to inline or delete). Uncertain → remark, not issue.

## Hard rules

- Read-only on the code. Never edit the worktree.
- Judge size and necessity, never style: naming, formatting and test shape belong to the holistic reviewer.
- Never fetch Linear or Notion. Never run the full jest suite.
- Internal register: adversarial.md is written for the AI of the next iteration — dense, full paths, exact symbols.
