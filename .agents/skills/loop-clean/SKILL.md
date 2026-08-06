---
name: loop-clean
description: 'Cleanup phase of the loop pipeline for lago-front. Finds local worktrees whose PR is merged and destroys them via lago-worktree destroy, after user confirmation. Use when user says "/loop-clean", asks to clean up merged worktrees, or the loop-run orchestrator runs its sweep step.'
---

# Loop Clean — sweep worktrees of merged PRs

**Repo:** the lago monorepo root; worktrees in `front-worktrees/`, slot registry in `.worktree-slots`.

## Steps

1. **List candidates**: worktree names from `front-worktrees/` starting with a Linear issue ID — pattern `^[A-Z]+-\d+(-.*)?$` (any team prefix: LAGO, ING, ...; with or without the topic slug suffix, e.g. `ING-517-swap-customer-overview-connection`). Cross-check `.worktree-slots`.

2. **Check merge state** for each candidate:

   ```bash
   gh pr view <name> --repo getlago/lago-front --json state,mergedAt
   ```

   - `"state": "MERGED"` → cleanup candidate.
   - `"state": "CLOSED"` (closed WITHOUT merge — abandoned PR) → candidate too, but flagged separately in the confirmation list as "closed without merge — work was never shipped, destroy anyway?".
   - `"state": "OPEN"` or no PR found → NEVER a candidate, skip silently. Pending work is untouchable.

3. **Safety check** on each merged candidate — skip WITH a warning if:
   - Worktree dirty: `git -C front-worktrees/<name> status --porcelain` non-empty (uncommitted work — never destroy it).
   - Unpushed commits: `git -C front-worktrees/<name> log origin/<name>..HEAD --oneline` non-empty.

4. **Confirm with the operator** (ALWAYS — destroy is irreversible: deletes containers, volumes, local branches front+API, all files): show the list of names about to be destroyed plus the skipped ones with reasons. Proceed only on explicit yes.

5. **Destroy** each confirmed name, answering the script's own y/N prompt:

   ```bash
   printf 'y\n' | lago-worktree destroy <name>
   ```

   (`lago-worktree` = `front/scripts/lago-worktree.sh` if the alias is unavailable.)

6. **Report**: destroyed / skipped-with-reason / nothing-to-do.

## Hard rules

- NEVER destroy without the operator's explicit confirmation in this session.
- NEVER destroy a dirty worktree or one with unpushed commits — skip and warn instead.
- Only names starting with a Linear issue ID (`^[A-Z]+-\d+`): never touch other worktrees (base-app, admin-ui, ...).
- Nothing on the remote is ever touched.
- **Two communication registers**: messages to humans (chat report, notifications) = short, direct, plain language, no deep-tech jargon. Internal state files (spec.md, review.md, histories, working notes) = written for the AI of a later iteration: dense, precise, full paths/symbols/error strings — optimize for machine effectiveness, not human readability.
