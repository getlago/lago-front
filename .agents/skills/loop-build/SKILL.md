---
name: loop-build
description: 'Phase 2 of the loop pipeline for lago-front. Takes an ISSUE-ID, reads spec.md from the run state dir, implements the change in a dedicated worktree — or in the current checkout with `--in-place` (automatic inside a Conductor workspace) — and gets lint + types + translations gates green. Use when user says "/loop-build <ISSUE-ID> [--in-place]" or the loop-run orchestrator invokes the build phase.'
---

# Loop Build — phase 2 of loop-run

**Input:** an ISSUE-ID (e.g. `LAGO-1745`). State dir: `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`). Requires `spec.md` there — if missing, stop and tell the operator to run loop-spec first.

**Repo:** a lago-front checkout. Two layouts, resolved by loop-run and defined in its `## Layout` section — `worktree` (the default: `front/` in the lago monorepo, worktrees in `front-worktrees/` beside it) and `in-place` (the current checkout is the worktree; automatic inside a Conductor workspace, forced with `--in-place`). Invoked directly without loop-run, resolve it the same way: `$CONDUCTOR_WORKSPACE_PATH` set or `--in-place` passed → `in-place`, else `worktree`.

## Modes

- **Fresh build**: no `review.md` in the state dir, or it says PASS.
- **Fix mode**: `review.md` has verdict FAIL, or `ci-failure.md` was just written by loop-run — fix ONLY the numbered issues / CI failures listed there, nothing else. Reuse the existing worktree from `state.md`.

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
   - **`git fetch origin main` is required**: the review phase diffs against `origin/main`, so a stale base produces a misleading diff. Fetch only — NEVER pull, rebase, merge, stash or reset (the checkout is the operator's, and it may hold work the loop did not create).
   - **State conflict**: if `state.md` already exists for this ISSUE-ID and its `worktree:` is a different path, STOP — that state belongs to another checkout; the operator must pick one.
   - **Docker stack** (`docker ps --format '{{.Names}}' | grep lago_front_dev`): missing → **warn only, never block**. Gates run on the host; Docker is only needed for the app restart and manual QA.

2. **Create the worktree** — **`worktree` layout ONLY**; in `in-place` skip this step entirely (nothing is created, `lago-worktree` is never called). Use the repo's own tool (handles branch, .env copy, pnpm install, port slot, dedicated docker containers, isolated API worktree):

   ```bash
   lago-worktree create <BRANCH> --from-front=main --from-api=main
   ```

   (`lago-worktree` = `front/scripts/lago-worktree.sh`; if the alias is unavailable, call the script directly.)

   **Branch naming** — `<BRANCH>` = `<ISSUE-ID>-<topic-slug>`: the Linear issue ID first, UPPERCASE, then a short kebab-case slug of the ticket's main topic (3-6 words). Examples: `ING-517-swap-customer-overview-connection`, `LAGO-5739-update-customer-information-view`. No Linear ticket (edge case, e.g. tooling change requested directly) → just the kebab-case topic slug of the changes: `clean-vite-cache-on-worktree-start`. Worktree dir name = branch name. The session stays in the lago root — no folder switch; operate on the worktree via `git -C` / `cd` in subshells.

   In `in-place` the branch is whatever the checkout already carried and is **never renamed** (`git branch -m` is forbidden: Conductor persists the branch name in its own database, so a git-side rename desyncs its diff view and its archive-time branch deletion).

3. **Record state**: write `state.md` in the state dir (the state dir stays keyed on the bare ISSUE-ID). Key names are load-bearing — `loop-review`, `loop-revise` and loop-run's restart step read them:

   ```markdown
   layout: <worktree | in-place>
   worktree: <absolute path — front-worktrees/<BRANCH> in worktree layout, the checkout itself in in-place>
   branch: <BRANCH>
   port: <front port printed by lago-worktree, or $CONDUCTOR_PORT in in-place>
   workspace: <$CONDUCTOR_WORKSPACE_NAME — in-place under Conductor only>
   container: <lago_front_wt_<SAN(branch)> | lago_front_ct_<SAN(workspace)> — omit when there is none>
   ```

   `SAN` = `tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g'` on the branch (worktree layout, the rule `lago-worktree` uses) or on the workspace name (`in-place`, the rule `scripts/conductor-front-container.sh` uses).

4. **Load the coding styleguide**: fetch the Frontend coding styleguide via the Notion MCP `notion-fetch` tool — page `https://app.notion.com/p/getlago/Frontend-coding-styleguide-29cef63110d28002b33afe26ddc59d88`. Apply its rules wherever applicable. If the fetch fails, warn in the report and continue with codebase conventions.

5. **Implement** per spec.md, inside the `worktree:` path from state.md only (in `in-place` that is the cwd):
   - Follow "Files to touch" — if reality diverges from the spec, update spec.md with a note and continue only if the divergence is minor; otherwise stop and report.
   - **Design system first**: before writing any new UI element, search the design system package (`lago-design-system`) and existing shared components for one that already does the job — reuse or extend, never duplicate. A new bespoke component is a last resort and must be justified in the report.
   - **Translations** (`translations/base.json`):
     - Before adding a key, search base.json for an existing label with the same meaning — reuse it.
     - New keys only when nothing fits; follow the existing key naming pattern.
     - Never leave dead keys: if the change removes the last usage of a key, remove the key.
   - Match surrounding code conventions and the styleguide. No dead code, no unused exports, no components built for a future consumer that does not exist yet.
   - **Comments**: `.agents/docs/typescript-conventions.md` → "Comments: Default to None" is binding, including its commit-body and iteration tests. Before handing off, list what the diff adds — `git diff -U0 | grep -nE '^\+\s*(//|/\*|\{/\*)'` — and delete every line you would also write in the commit body, or that answers a reviewer rather than warning the next editor. What survives names an external constraint (with its identifier), why NOT the obvious alternative, or a trap that bites on edit, in 1-2 lines, never copied into a second file. Expect zero on a typical diff; report the surviving count and why each one stayed.
   - **Never `as unknown as` your way past a type.** Two shapes cover nearly all of them. A shared component's prop type: check which fields the component actually reads and narrow the prop to `Pick<...>`, so structural typing keeps every existing caller compiling and the cast disappears. Two enums with identical members: write an exhaustive `Record<Source, Target>` plus a one-line lookup, the only form that breaks the build when the backend adds a member to one enum and not the other.
   - **Captured state goes stale.** This codebase captures rendered output in config snapshots (`MainHeader.Configure`) and in drawer `open({ children })`. When a closure or a captured element reads a mutable value, either encode every field it reads in the snapshot key, or pass a getter instead of the value. After writing one, list the fields it reads and diff that list against the key.
   - **A redirect in a `useEffect` does not stop its own render** — the body paints before the navigate commits. Pair every guard effect with an early `return null` on the same condition (after all hooks), and assert `container.firstChild` is null.
   - If GraphQL documents change: run `pnpm codegen` and include regenerated files.

6. **Tests — ALWAYS**: after the implementation is complete, invoke the `make-tests` skill on the changes. NEVER hand-write tests.

7. **Gates** (run in the worktree, all must pass):
   - `pnpm lint` (use `pnpm lint:fix` first if there are formatting issues)
   - `pnpm types`
   - `pnpm translations:inspect` (no dead/missing translation keys)
   - `pnpm translations:ensure-consistency`
   - Scoped jest on the paths make-tests produced/touched. NEVER run the full suite (`pnpm test` with no path is FORBIDDEN).
   - A jest failure that does not reproduce in isolation or under `--runInBand` — suites failing to boot with zero failed assertions, or one timing-sensitive test dying only in a wide parallel run — is load/cold-cache flake, not a regression: rerun before diagnosing or consuming a cycle.

8. **Report**: diff stat + gates output summary. Do NOT commit — shipping happens in loop-run after review PASS.

## Steps (fix mode)

1. Read the numbered issues from `review.md` (or the failure report in `ci-failure.md`). `ci-failure.md` is already distilled by loop-run — **never open the `ci-raw-<N>.log` it references**; if it looks insufficient, grep that raw file for the one specific symbol you need, never read it whole.
2. **Escalating retry — attempt N>1 must not be a blind rerun of attempt N-1:**
   - Read the full history too: `review-history.md` / `ci-failure-history.md` in the state dir (written by loop-run before each re-entry).
   - Before coding, state explicitly (in your working notes for the report): for each issue, what the previous attempt did and what THIS attempt does differently.
   - **Same issue failed twice** → the previous strategy is wrong, don't refine it a third time in the same direction: change strategy — re-read spec.md acceptance criteria from scratch, broaden the investigation (callers, related components, existing tests), question the diagnosis itself. Consume the retry, but on a different path.
   - **Oscillation check**: before applying a fix, verify against the history that it does not revert (fully or partially) a change made by a PREVIOUS iteration. Fix A breaks B, fix B re-breaks A is a loop-killer the gates won't surface. Detected → declare it in the report, do NOT apply either of the two oscillating fixes again: find the third option that satisfies both constraints (usually one level up from where both fixes were applied). Note the oscillation in the working notes so loop-run's flywheel picks it up.
   - Never STOP early for a repeated failure — the 3-attempt budget belongs to loop-run and is enforced by `<checkout>/scripts/iter-budget.sh`; exhausting it is the ONLY human touchpoint.
3. Fix only those issues, in the `worktree:` path from state.md — never a different one. **A fix does not earn a comment**: the merged PR reads as one change, so an explanation of why THIS round changed THAT line is invisible context to the next reader. If the reviewer misread the code, rename or split it; the reasoning goes in the report and the commit body.

   **Operator input that changes behaviour** (a design, a copy change, a new rule) is a spec amendment, not a patch: write the new acceptance criteria into spec.md FIRST and enumerate the state transitions they imply (mount / select / change / revert / user-edited / locked), then code. A behaviour taken from a mockup without its transition table is the most expensive thing this pipeline retries.
4. Re-run the gates (step 7 above). If the fix touched testable logic, re-invoke `make-tests` for the affected paths.
5. Report what changed per issue number, including the "what's different from the previous attempt" line for each.

## Hard rules

- All edits in the `worktree:` path from state.md. In the `worktree` layout that means never the main `front/` checkout; in `in-place` never `$CONDUCTOR_ROOT_PATH` and never another workspace.
- **`in-place` creates and destroys nothing**: no `lago-worktree`, no branch rename, no Conductor workspace created, archived or renamed — the operator does that in the app.
- NEVER `git stash` there: the review phase leaves `git add -N` entries and the pop conflicts. Compare against the base with `git show <base>:<path>`, or in a throwaway `git worktree`.
- No commit, no push, no PR in this phase.
- Never run the full jest suite.
- Tests only via the make-tests skill.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
