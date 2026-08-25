---
name: loop-build
description: 'Phase 2 of the loop pipeline for lago-front. Takes an ISSUE-ID, reads spec.md from the run state dir, implements the change in a dedicated worktree, and gets lint + types + translations gates green. Use when user says "/loop-build <ISSUE-ID>" or the loop-run orchestrator invokes the build phase.'
---

# Loop Build — phase 2 of loop-run

**Input:** an ISSUE-ID (e.g. `LAGO-1745`). State dir: `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`). Requires `spec.md` there — if missing, stop and tell the operator to run loop-spec first.

**Repo:** lago-front checkout at `front/` in the lago monorepo; worktrees in `front-worktrees/` beside it.

## Modes

- **Fresh build**: no `review.md` in the state dir, or it says PASS.
- **Fix mode**: `review.md` has verdict FAIL, or `ci-failure.md` was just written by loop-run — fix ONLY the numbered issues / CI failures listed there, nothing else. Reuse the existing worktree from `state.md`.

## Steps (fresh build)

1. **Preflight** (both must hold, else STOP and ask the operator):
   - Main docker stack running: `docker ps --format '{{.Names}}' | grep lago_front_dev`.
   - Local `main` in `front/` up to date: `git -C front pull --ff-only origin main`. If it fails (dirty checkout, diverged), STOP — never stash, reset, or force.
   - If a `front-worktrees/<ISSUE-ID>-*` dir already exists from an aborted run, STOP and ask — never delete or force.

2. **Create the worktree** with the repo's own tool (handles branch, .env copy, pnpm install, port slot, dedicated docker containers, isolated API worktree):

   ```bash
   lago-worktree create <BRANCH> --from-front=main --from-api=main
   ```

   (`lago-worktree` = `front/scripts/lago-worktree.sh`; if the alias is unavailable, call the script directly.)

   **Branch naming** — `<BRANCH>` = `<ISSUE-ID>-<topic-slug>`: the Linear issue ID first, UPPERCASE, then a short kebab-case slug of the ticket's main topic (3-6 words). Examples: `ING-517-swap-customer-overview-connection`, `LAGO-5739-update-customer-information-view`. No Linear ticket (edge case, e.g. tooling change requested directly) → just the kebab-case topic slug of the changes: `clean-vite-cache-on-worktree-start`. Worktree dir name = branch name. The session stays in the lago root — no folder switch; operate on the worktree via `git -C` / `cd` in subshells.

3. **Record state**: write `state.md` in the state dir (the state dir stays keyed on the bare ISSUE-ID):

   ```markdown
   worktree: <absolute path to front-worktrees/<BRANCH>>
   branch: <BRANCH>
   port: <front port printed by lago-worktree>
   ```

4. **Load the coding styleguide**: fetch the Frontend coding styleguide via the Notion MCP `notion-fetch` tool — page `https://app.notion.com/p/getlago/Frontend-coding-styleguide-29cef63110d28002b33afe26ddc59d88`. Apply its rules wherever applicable. If the fetch fails, warn in the report and continue with codebase conventions.

5. **Implement** per spec.md, inside the worktree only:
   - Follow "Files to touch" — if reality diverges from the spec, update spec.md with a note and continue only if the divergence is minor; otherwise stop and report.
   - **Design system first**: before writing any new UI element, search the design system package (`lago-design-system`) and existing shared components for one that already does the job — reuse or extend, never duplicate. A new bespoke component is a last resort and must be justified in the report.
   - **Translations** (`translations/base.json`):
     - Before adding a key, search base.json for an existing label with the same meaning — reuse it.
     - New keys only when nothing fits; follow the existing key naming pattern.
     - Never leave dead keys: if the change removes the last usage of a key, remove the key.
   - Match surrounding code conventions and the styleguide. No dead code, no unused exports, no components built for a future consumer that does not exist yet.
   - **Comments must earn their place.** A comment is welcome only when it carries context the code cannot show: a constraint, a non-obvious why, a cross-file invariant. Never narrate self-evident code — a self-speaking prop, what a well-named variable holds, what the next line does. When a change removes the workaround a comment explained, delete the comment instead of rewording it. Before adding one, check the enclosing block for a comment already stating the same rule.
   - **A redirect in a `useEffect` does not stop its own render** — the body paints before the navigate commits. Pair every guard effect with an early `return null` on the same condition (after all hooks), and assert `container.firstChild` is null.
   - If GraphQL documents change: run `pnpm codegen` and include regenerated files.

6. **Tests — ALWAYS**: after the implementation is complete, invoke the `make-tests` skill on the worktree changes. NEVER hand-write tests.

7. **Gates** (run in the worktree, all must pass):
   - `pnpm lint` (use `pnpm lint:fix` first if there are formatting issues)
   - `pnpm types`
   - `pnpm translations:inspect` (no dead/missing translation keys)
   - `pnpm translations:ensure-consistency`
   - Scoped jest on the paths make-tests produced/touched. NEVER run the full suite (`pnpm test` with no path is FORBIDDEN).

8. **Report**: diff stat + gates output summary. Do NOT commit — shipping happens in loop-run after review PASS.

## Steps (fix mode)

1. Read the numbered issues from `review.md` (or the failure report in `ci-failure.md`).
2. **Escalating retry — attempt N>1 must not be a blind rerun of attempt N-1:**
   - Read the full history too: `review-history.md` / `ci-failure-history.md` in the state dir (written by loop-run before each re-entry).
   - Before coding, state explicitly (in your working notes for the report): for each issue, what the previous attempt did and what THIS attempt does differently.
   - **Same issue failed twice** → the previous strategy is wrong, don't refine it a third time in the same direction: change strategy — re-read spec.md acceptance criteria from scratch, broaden the investigation (callers, related components, existing tests), question the diagnosis itself. Consume the retry, but on a different path.
   - **Oscillation check**: before applying a fix, verify against the history that it does not revert (fully or partially) a change made by a PREVIOUS iteration. Fix A breaks B, fix B re-breaks A is a loop-killer the gates won't surface. Detected → declare it in the report, do NOT apply either of the two oscillating fixes again: find the third option that satisfies both constraints (usually one level up from where both fixes were applied). Note the oscillation in the working notes so loop-run's flywheel picks it up.
   - Never STOP early for a repeated failure — the 3-attempt budget belongs to loop-run and is enforced by `front/scripts/loop-iter.sh`; exhausting it is the ONLY human touchpoint.
3. Fix only those issues in the existing worktree.
4. Re-run the gates (step 7 above). If the fix touched testable logic, re-invoke `make-tests` for the affected paths.
5. Report what changed per issue number, including the "what's different from the previous attempt" line for each.

## Hard rules

- All edits in the worktree, never in the main checkout.
- No commit, no push, no PR in this phase.
- Never run the full jest suite.
- Tests only via the make-tests skill.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
