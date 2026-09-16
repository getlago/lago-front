---
name: loop-run
description: 'Orchestrator of the loop pipeline for lago-front: sweep → spec → build ↔ review → ship (commit, PR, Linear, CI gate, Slack #frontend). Creates a dedicated worktree by default, or runs in the current checkout with `--in-place` (automatic inside a Conductor workspace). Takes a Linear ticket URL and optionally Notion spec URLs; `--confirm-spec` pauses once after the spec. Use when user says "/loop-run <linear-url> [notion-urls...] [--in-place] [--confirm-spec]" or asks to run the full loop on a ticket.'
---

# Loop Run — full pipeline orchestrator

**Input:** a Linear ticket URL (required) + optional Notion URLs + optional flags `--in-place`, `--confirm-spec`. No Linear URL → ask and stop.

**Repo guard:** lago-front ONLY. Any other repo: STOP. **Humans merge:** never merge, approve, bypass a gate or force-push.

**Autonomy contract:** between the input and the final Slack post the pipeline runs alone. It pauses for the operator ONLY on: `--confirm-spec` (once, after spec), an exhausted retry budget (3 review or 3 CI cycles), a `needs-operator-adjudication` STOP, or an unrecoverable external failure.

## Layout — resolved ONCE, before anything else

```bash
if [ -n "${CONDUCTOR_WORKSPACE_PATH:-}" ] || [ "<--in-place passed>" = yes ]; then
  LAYOUT=in-place; FRONT="$(git rev-parse --show-toplevel)"
else
  LAYOUT=worktree;  FRONT="$PWD/front"
fi
SCRIPTS="$FRONT/scripts"
[ -x "$SCRIPTS/iter-budget.sh" ] || { echo "not a lago-front checkout"; exit 1; }
```

`worktree` (default): `loop-build` creates `front-worktrees/<ISSUE-ID>-<slug>/` via `lago-worktree`; the session stays in the monorepo root and uses `git -C`. `in-place` (automatic under Conductor, forced with `--in-place`): the current checkout IS the worktree and the branch; nothing is created, destroyed or renamed, `lago-worktree` is never called. Pass the layout to every phase through `state.md`; never re-derive it.

## Conventions

- **Operator** = the developer who started this run; identity from their own tooling (`gh` auth, `git config user.email`, Slack config). Nothing about a person is hardcoded.
- **State dir** = `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`) — outside the repo, never committed.
- **Scripts** (`$SCRIPTS`, documented in their headers): `iter-budget.sh` (retry caps), `loop-plan-check.sh` (adversarial trigger), `loop-restart.sh` (container reload), `loop-ci-log.sh` (CI failure capture), `loop-journal.sh` (journal row), `loop-notify.sh` (exit DM). Setup: `.agents/skills/loop-run/README.md`.

## Pipeline

0. **Sweep** (`worktree` layout only): invoke `loop-clean`; the operator confirms or skips, the run continues either way.

1. **Check the gates this run depends on**: `pnpm agents:check` in `$FRONT`. It exercises
   `loop-plan-check.sh` and `diff-hygiene.sh`, the two gates the build phase is about to trust — a
   silent break there means undeclared files and comments ship unflagged. It is deliberately NOT in
   `code:style`, so nothing else runs it: a red here stops the run.

2. **Spec**: invoke `loop-spec` with the URL(s); extract `<ISSUE-ID>`; `"$SCRIPTS/iter-budget.sh" <ISSUE-ID> reset`. With `--confirm-spec`: show the operator spec.md's Summary, Premises (every `unverified` one first) and Files to touch, ask "why does this exist?" for each new file, and wait for a go — the single human checkpoint this flag buys. Amendments go into spec.md before build.

3. **Build ↔ review cycle** (max 3 — the cap is MECHANICAL, `iter-budget.sh`, never counted in your head):
   1. `"$SCRIPTS/iter-budget.sh" <ISSUE-ID> review` — exit 1 → the 3-FAIL STOP path, whatever you believe the count is.
   2. Invoke `loop-build` with `<ISSUE-ID>` and the layout. First iteration only: claim the ticket on Linear (`save_issue`: assignee = operator matched by `git config user.email`, status "Dev in Progress"); a Linear failure warns and continues.
   3. **Review in a FRESH subagent** (Agent tool, general-purpose: "Invoke the loop-review skill for <ISSUE-ID> and follow it exactly"). Never inline. Its prompt carries nothing but the ISSUE-ID — spec.md holds the ticket, so no reviewer fetches Linear or Notion.
   4. **Adversarial pass, on trigger only**: `"$SCRIPTS/loop-plan-check.sh" <worktree> <state dir>/plan.md`. Exit 3 (new files/exports, all declared — the build gate guarantees none is undeclared) or 1 → dispatch a second fresh subagent: "Read `.agents/skills/loop-review/adversarial.md` and apply it to <ISSUE-ID>". Exit 0 (nothing new) → no second agent. Two review agents is the maximum.
   5. Read `review.md` (and `adversarial.md` when dispatched). A file with no `Verdict:` line is not a verdict — resume that subagent ("continue until the file is written"). Any FAIL is a FAIL: archive each verdict under `## Iteration <N>` in `review-history.md`, record every `[review#N]` / `[gate:…]` / `[adversarial]` tag for the journal, then next iteration (build in fix mode). All PASS → Ship.
   6. Findings arriving AFTER a verdict is written are scored against a stale tree: re-verify each against the current diff, act only on regressions this diff introduced.
   7. 3 FAILs or iter-budget exit 1: STOP — `impediment.md`, exit DM, report. No git artifacts exist yet.

4. **Restart the app**: `"$SCRIPTS/loop-restart.sh" <state dir>/state.md` (clears the vite cache first; no container → one-line warning, never a blocker).

5. **Ship** (after PASS), inside the `worktree:` path from state.md (`in-place`: the cwd, drop `git -C`):
   1. **Commit** — stage everything, message EXACTLY:

      ```
      <type>(<context>): <Title>

      ## Context

      <motivation, from the ticket>

      ## Description

      <what changed, in detail>

      <!-- Linear link -->
      Fixes <ISSUE-ID>
      ```

      `<type>` = feat/fix/refactor/chore implied by the ticket; `<Title>` sentence-case, imperative.
   2. **Push**: `git push -u origin <branch>`. In `in-place` push the branch as is — **never** rename it.
   3. **PR** (ready, not draft): `gh pr create --assignee @me`, title = commit subject, body = commit body.
   4. **Linear**: move the issue to "In Review" (`save_issue`).

6. **CI gate** (max 3 fix cycles, `iter-budget.sh`): `gh pr checks <PR> --watch`. All green → Announce. Any red → triage the special cases FIRST, they consume no budget:
   - **`Run Codegen` red with an unmerged companion lago-api PR**: CI builds the schema from lago-api `main`. Qualifies only with BOTH a concrete companion PR (from the ticket/spec, or named by the codegen errors) AND a one-time `gh pr view <N> --repo getlago/lago-api --json state,title` showing it open, recorded in the state dir. Then skip fix mode, Announce with the plain template, note the pending merge in the journal and the final report. Any other red alongside → real failure.
   - **Code-scanning (CodeQL) red**: `gh api --paginate 'repos/getlago/lago-front/code-scanning/alerts?per_page=100'`, filter `state == "dismissed"` yourself (single-value `state` param). A dismissed alert with the same `rule.id`, file AND overlapping region is a re-fingerprint no code change clears: fix other reds first; when it is the only red, STOP with outcome `needs-operator-adjudication` asking the operator to dismiss it referencing the prior one. Same rule elsewhere in the file is a real finding.
   - **Red inherited from a non-`main` base**: `gh pr checks <base PR>` shows the same signature → not this diff's; no cycle charged, both PR URLs in the journal, run ends `needs-operator-adjudication` unless the operator says otherwise in chat. No Slack post.
   - **Neither** → `"$SCRIPTS/iter-budget.sh" <ISSUE-ID> ci` (exit 1 → STOP path), then `"$SCRIPTS/loop-ci-log.sh" <ISSUE-ID> <run-id> <N>` — raw log to disk, ≤40 decisive lines back. Write `ci-failure.md` from those lines (job, matched lines, file:line, `raw: <path>`, ≤60 lines; the script already archived the previous one), re-enter build in fix mode, commit `fix(<context>): address CI failures`, push, watch again. **Never `cat` the raw log, never `gh run view` without the script.**
   - 3 red cycles: STOP — `impediment.md`, exit DM, report with the PR URL and the distilled failure. **No Slack channel post while CI is red.**

7. **Announce** (CI fully green — sole carve-out: the verified codegen case). Post to `#frontend` via the Slack MCP, EXACTLY this, a BLANK line between the three lines (the connector collapses single newlines):

   ```
   **<type>(<context>): <Title>**

   :pr: <PR URL>

   :admission_tickets: <Linear issue URL>
   ```

8. **External comments**: `gh api repos/getlago/lago-front/pulls/<PR>/comments` + `gh pr view <PR> --json comments`. Any comment by someone other than the operator (`gh api user --jq .login`), human or bot → the loop-revise protocol: evaluate critically, apply if sound, ALWAYS reply (thanks + applied with sha, or not applied with a one-line technical reason).

9. **Final report**: PR URL, Linear state, CI status, Slack link, replies posted, cycle counts, and the cleanup line — `worktree`: `loop-clean` after merge; `in-place`: nothing here, the operator archives the Conductor workspace.

## Journal & flywheel — SILENT, on EVERY terminal outcome

Happy path and every STOP alike; never ping the operator, never mention in Slack.

1. **Journal**: `"$SCRIPTS/loop-journal.sh" <ISSUE-ID> <iters N/3> <ci N/3> "<gates red at least once, or none>" <outcome> "<fail-checks, or none>" "<one short phrase>"`. `fail-checks` = every tag collected in step 3.5 across iterations (`review#5,gate:types,adversarial`) — the pruning in `loop-flywheel` runs on this column. Outcomes: `shipped` / `stopped-review` / `stopped-ci` / `needs-operator-adjudication` / `stopped-error`.

2. **Flywheel**: for each recurring or avoidable failure (review-history, ci-failure-history, external comments) apply the admission test — *would a better instruction have prevented it, AND can I name a second, different plausible occurrence?* Both yes → append to `$LOOP_STATE_DIR/_flywheel.md`:

   ```markdown
   ## <date> — <ISSUE-ID>
   - target: <skill or doc>
   - evidence: <what happened, no ticket ID in the rule itself>
   - proposed edit: <the instruction — as a script or lint rule if it can be one; a check only if it replaces one>
   ```

   Proposals ONLY: never edit skill files, never notify. One yes → append nothing.

## Failure handling & exit notification

- External call (Linear, GitHub, Slack) fails → retry once, then STOP and report exactly what completed. Never delete branches, worktrees or PRs to "retry clean".
- On every STOP needing the operator: write `impediment.md` first (`stage / cause / attempted / needed / links / layout / where`), then `"$SCRIPTS/loop-notify.sh" "<MESSAGE>"` — bot DM, mrkdwn, `:rotating_light: *loop-run stopped — <ISSUE-ID>*` + Reason / Stage / Where / PR / Linear / Next lines. `needs-operator-adjudication` reads as "complete and green, one decision needed", never as a failure.
- The script prints `CH= TS= USER=`. For fixable stops (review/CI), poll `conversations.history?channel=$CH&oldest=$TS` with `$SLACK_LOOP_BOT_TOKEN` every ~2 min for up to 60 min (background-safe waits only); only messages from `$USER` count. A reply → `:eyes: got it — resuming`, route it into the fix cycle like loop-revise feedback. No reply → `:hourglass: no reply — stopping here; resume with /loop-revise <ISSUE-ID>`.
- Script non-zero → `PushNotification` + Slack MCP self-DM (blank line between lines), no feedback-wait, note the degradation.

## Communication & hard rules

- **Two registers**: humans (chat, DMs, Slack, PR replies) = short, plain, no jargon. Internal files (spec, plan, review, impediment, histories, journal, flywheel) = dense, precise, full paths and symbols, for the AI of the next iteration.
- **No AI attribution anywhere**: commits, PR, Slack carry EXACTLY the templates above.
- Git only on this pipeline's branch in this pipeline's worktree (`in-place`: this checkout only). `in-place` never manages its container or checkout. Never the full jest suite. Review always in a fresh subagent; at most two review agents; no reviewer fetches Linear or Notion.
