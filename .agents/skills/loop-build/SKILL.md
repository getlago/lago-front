---
name: loop-build
description: 'Phase 2 of the loop pipeline for lago-front. Takes an ISSUE-ID, reads spec.md from the run state dir, declares the minimal diff in plan.md, implements it in a dedicated worktree — or in the current checkout with `--in-place` (automatic inside a Conductor workspace) — and gets lint + types + translations gates green. Use when user says "/loop-build <ISSUE-ID> [--in-place]" or the loop-run orchestrator invokes the build phase.'
---

# Loop Build — phase 2 of loop-run

**Input:** an ISSUE-ID (e.g. `<TEAM>-<N>`). State dir: `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`). Requires `spec.md` there — if missing, stop and tell the operator to run loop-spec first.

**Repo:** a lago-front checkout. Two layouts, resolved by loop-run and defined in its `## Layout` section — `worktree` (the default: `front/` in the lago monorepo, worktrees in `front-worktrees/` beside it) and `in-place` (the current checkout is the worktree; automatic inside a Conductor workspace, forced with `--in-place`). Invoked directly without loop-run, resolve it the same way: `$CONDUCTOR_WORKSPACE_PATH` set or `--in-place` passed → `in-place`, else `worktree`.

**Nothing is fetched.** spec.md carries the ticket and its sources; the coding styleguide is `.agents/docs/frontend-coding-styleguide.md`. No Linear, no Notion in this phase.

## Modes

- **Fresh build**: no `review.md` in the state dir, or it says PASS.
- **Fix mode**: `review.md` (or `adversarial.md`) has verdict FAIL, or `ci-failure.md` was just written by loop-run — fix ONLY the numbered issues / CI failures listed there, nothing else. Reuse the existing worktree from `state.md`.

## Steps (fresh build)

1. **Preflight** — the `worktree` layout creates its workspace, `in-place` validates the one it was handed:

   **`worktree` layout** (all must hold, else STOP and ask the operator):
   - Main docker stack running: `docker ps --format '{{.Names}}' | grep lago_front_dev`.
   - Local `main` in `front/` up to date: `git -C front pull --ff-only origin main`. If it fails (dirty checkout, diverged), STOP — never stash, reset, or force.
   - If a `front-worktrees/<ISSUE-ID>-*` dir already exists from an aborted run, STOP and ask — never delete or force.

   **`in-place` layout**:

   ```bash
   FRONT="$(git rev-parse --show-toplevel)"
   [ -x "$FRONT/scripts/iter-budget.sh" ] || { echo "not a lago-front checkout"; exit 1; }
   BRANCH="$(git rev-parse --abbrev-ref HEAD)"
   git fetch origin main
   ```

   - **Branch guard**: STOP if `BRANCH` is `main` (or `$CONDUCTOR_DEFAULT_BRANCH`), or is `HEAD` (detached). The loop only ever works on a feature branch.
   - **`git fetch origin main` is required**: the review phase diffs against `origin/main`. Fetch only — NEVER pull, rebase, merge, stash or reset (the checkout is the operator's).
   - **State conflict**: if `state.md` already exists for this ISSUE-ID and its `worktree:` is a different path, STOP — that state belongs to another checkout.
   - **Docker stack** (`docker ps --format '{{.Names}}' | grep lago_front_dev`): missing → **warn only, never block**. Gates run on the host.

2. **Create the worktree** — **`worktree` layout ONLY**; in `in-place` skip this step entirely (nothing is created, `lago-worktree` is never called). Use the repo's own tool (handles branch, .env copy, pnpm install, port slot, dedicated docker containers, isolated API worktree):

   ```bash
   lago-worktree create <BRANCH> --from-front=main --from-api=main
   ```

   (`lago-worktree` = `front/scripts/lago-worktree.sh`; if the alias is unavailable, call the script directly.)

   **Branch naming** — `<BRANCH>` = `<ISSUE-ID>-<topic-slug>`: the Linear issue ID first, UPPERCASE, then a short kebab-case slug of the ticket's main topic (3-6 words), e.g. `<TEAM>-<N>-swap-customer-overview-connection`. No Linear ticket (edge case, e.g. tooling change requested directly) → just the kebab-case topic slug: `clean-vite-cache-on-worktree-start`. Worktree dir name = branch name. The session stays in the lago root — operate on the worktree via `git -C` / `cd` in subshells.

   In `in-place` the branch is whatever the checkout already carried and is **never renamed** (`git branch -m` is forbidden: Conductor persists the branch name in its own database, so a git-side rename desyncs its diff view and its archive-time branch deletion).

3. **Record state**: write `state.md` in the state dir (keyed on the bare ISSUE-ID). Key names are load-bearing — `loop-review`, `loop-revise` and `scripts/loop-restart.sh` read them:

   ```markdown
   layout: <worktree | in-place>
   worktree: <absolute path — front-worktrees/<BRANCH> in worktree layout, the checkout itself in in-place>
   branch: <BRANCH>
   port: <front port printed by lago-worktree, or $CONDUCTOR_PORT in in-place>
   workspace: <$CONDUCTOR_WORKSPACE_NAME — in-place under Conductor only>
   container: <lago_front_wt_<SAN(branch)> | lago_front_ct_<SAN(workspace)> — omit when there is none>
   ```

   `SAN` = `tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g'` on the branch (worktree layout) or on the workspace name (`in-place`).

4. **Plan before code — write `plan.md`** in the state dir. It is the declaration `scripts/loop-plan-check.sh` and the reviewers compare the diff against; a new file or export that appears in the diff without appearing here triggers the adversarial pass:

   ```markdown
   # <ISSUE-ID> plan

   ## Files to change
   <path — one line: what changes>

   ## New files
   <path — why no existing file could host it, naming the sibling checked; or "none">

   ## New exports
   <symbol (path) — who consumes it, why inlining at the call sites is worse; or "none">

   ## Estimated size
   <N lines>

   ## Deviations
   <appended during implementation: what changed from the plan above and the one-line reason>
   ```

   Start from spec.md `## Files to touch` and `## Premises`. The default for `## New files` and `## New exports` is "none": write the diff in your head without the abstraction first, and add it only when the inline version is larger. Read `.agents/docs/frontend-coding-styleguide.md` now, before the first edit.

5. **Implement** per spec.md and plan.md, inside the `worktree:` path from state.md only (in `in-place` that is the cwd). The checks below are capped by `scripts/skill-budget.sh`.

   <!-- checks:start -->
   1. **The plan is the scope.** Reality diverges from spec.md or plan.md → append the divergence and its reason to plan.md `## Deviations` and continue only if minor; otherwise stop and report. A premise spec.md marks `unverified` is not built around: build what the code shows, and say so in the report.
   2. **Existing mechanism first.** Before writing a component, hook, util or handler, search `lago-design-system`, the shared modules and the global layers (Apollo error link, toast, router wrappers) for one that already does the job — reuse or extend, never duplicate. When the spec says to mirror a sibling, diff YOUR dependency list against ITS: a dependency the sibling deliberately avoided (an aggregate hook, a wider query) needs a reason in the report.
   3. **Translations** (`translations/base.json`): search for an existing label with the same meaning before adding a key; new keys only when nothing fits, following the naming pattern; remove a key when the change removes its last usage.
   4. **Comments**: `.agents/docs/typescript-conventions.md` → "Comments: Default to None" is binding. `scripts/diff-hygiene.sh` fails the gate on any run over 2 lines; content is yours: delete every comment you would also write in the commit body, or that answers a reviewer. What survives names an external constraint, why NOT the obvious alternative, or a trap that bites on edit. Expect zero on a typical diff.
   5. **Never `as unknown as` your way past a type.** A shared component's prop type: narrow to `Pick<...>` of the fields it reads. Two enums with identical members: an exhaustive `Record<Source, Target>` lookup, the only form that breaks the build when one enum grows.
   6. **Copied state goes stale.** A config snapshot (`MainHeader.Configure`), a drawer `open({ children })`, a child seeding `useState` from a prop: each copies a mutable value once. Either encode every field it reads in a key (remount / snapshot key) or pass a getter / read the prop. A parent that resets a value the child also stores is a silent wrong-save.
   7. **A redirect in a `useEffect` does not stop its own render**: pair every guard effect with an early `return null` on the same condition (after all hooks), and assert `container.firstChild` is null.
   <!-- checks:end -->

   GraphQL documents changed → `pnpm codegen`, and when the worktree's API runs a feature branch, keep only the hunks in `src/generated/graphql.tsx` that belong to your own operations (CI regenerates from lago-api `main`).

6. **Tests — ALWAYS**: after the implementation is complete, invoke the `make-tests` skill on the changes. NEVER hand-write tests.

7. **Gates** (run in the worktree, all must pass):
   - `pnpm lint` (use `pnpm lint:fix` first if there are formatting issues), `pnpm types`, `pnpm translations:inspect`, `pnpm translations:ensure-consistency`.
   - `<front>/scripts/diff-hygiene.sh origin/main <worktree>` — comment runs over 2 lines.
   - `<front>/scripts/loop-plan-check.sh <worktree> <state dir>/plan.md` — every new file / export is declared. Exit 1 → either delete the abstraction or declare it in plan.md with its reason; never leave it undeclared.
   - Scoped jest on the paths make-tests produced/touched. NEVER run the full suite (`pnpm test` with no path is FORBIDDEN).
   - A jest failure that does not reproduce in isolation or under `--runInBand` is load/cold-cache flake, not a regression: rerun before diagnosing or consuming a cycle.

8. **Report**: diff stat, plan.md deviations, gates output summary. Do NOT commit — shipping happens in loop-run after review PASS.

## Steps (fix mode)

1. Read the numbered issues from `review.md` / `adversarial.md` (or the failure report in `ci-failure.md`). `ci-failure.md` is already distilled by loop-run — **never open the `ci-raw-<N>.log` it references**; if it looks insufficient, grep that raw file for the one specific symbol you need, never read it whole.
2. **Escalating retry — attempt N>1 must not be a blind rerun of attempt N-1:**
   - Read the full history too: `review-history.md` / `ci-failure-history.md` in the state dir.
   - Before coding, state in your working notes, per issue: what the previous attempt did and what THIS attempt does differently.
   - **Same issue failed twice** → the previous strategy is wrong: re-read spec.md acceptance criteria from scratch, broaden the investigation (callers, related components, existing tests), question the diagnosis itself. Consume the retry, but on a different path.
   - **Oscillation check**: a fix must not revert a change made by a PREVIOUS iteration. Detected → declare it, do NOT apply either oscillating fix again: find the third option one level up from where both were applied, and note it for loop-run's flywheel.
   - Never STOP early for a repeated failure — the 3-attempt budget belongs to loop-run and is enforced by `<checkout>/scripts/iter-budget.sh`.
3. Fix only those issues, in the `worktree:` path from state.md. **A fix does not earn a comment**: if the reviewer misread the code, rename or split it; the reasoning goes in the report and the commit body. An `[adversarial]` issue is fixed by inlining or deleting, never by justifying the abstraction in plan.md after the fact.

   **Operator input that changes behaviour** (a design, a copy change, a new rule) is a spec amendment, not a patch: write the new acceptance criteria into spec.md FIRST and enumerate the state transitions they imply (mount / select / change / revert / user-edited / locked), then code.
4. Re-run the gates (step 7 above). If the fix touched testable logic, re-invoke `make-tests` for the affected paths.
5. Report what changed per issue number, including the "what's different from the previous attempt" line for each.

## Hard rules

- All edits in the `worktree:` path from state.md. In the `worktree` layout that means never the main `front/` checkout; in `in-place` never `$CONDUCTOR_ROOT_PATH` and never another workspace.
- **`in-place` creates and destroys nothing**: no `lago-worktree`, no branch rename, no Conductor workspace created, archived or renamed.
- NEVER `git stash` there: the review phase leaves `git add -N` entries and the pop conflicts. Compare against the base with `git show <base>:<path>`, or in a throwaway `git worktree`.
- No commit, no push, no PR in this phase. Never fetch Linear or Notion.
- Never run the full jest suite. Tests only via the make-tests skill.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, plan.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
