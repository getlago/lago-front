---
name: loop-run
description: 'Orchestrator of the loop pipeline for lago-front: sweep → spec → build ↔ review → ship (commit, PR, Linear, CI gate, Slack #frontend). Takes a Linear ticket URL and optionally Notion spec URLs. Use when user says "/loop-run <linear-url> [notion-urls...]" or asks to run the full loop on a ticket.'
---

# Loop Run — full pipeline orchestrator

**Input:** a Linear ticket URL (required) + optional Notion spec page URLs. If the Linear URL is missing, ask and stop.

**Repo guard:** this pipeline works ONLY on lago-front (`front/` in the lago monorepo). Any other repo: STOP.

**Principle: humans merge.** This pipeline NEVER merges or approves a PR, never bypasses a gate, never force-pushes.

**Autonomy contract:** between the input and the final Slack post the pipeline runs alone. The ONLY thing that asks the operator for help is an exhausted retry budget (3 review cycles or 3 CI cycles), a `needs-operator-adjudication` triage STOP (CI gate step 5.3), or an unrecoverable external failure. Never pause for approval mid-run.

## Conventions used throughout

- **Operator** = the developer who started this run. Identity comes from their own tooling (`gh` auth, `git config user.email`, their Slack config) — nothing about any specific person is hardcoded.
- **State dir** = `$LOOP_STATE_DIR/<ISSUE-ID>/` (default `~/.claude/loop-state/<ISSUE-ID>/`) — per-developer, outside the repo, never committed.
- **Scripts** = `front/scripts/iter-budget.sh` and `front/scripts/loop-notify.sh`, run from the lago monorepo root. Setup and configuration: `.agents/skills/loop-run/README.md`.

## Pipeline

0. **Sweep**: invoke the `loop-clean` skill first — it proposes destroying worktrees of already-merged PRs (operator confirms; skipping is fine, the pipeline continues either way).

1. **Spec**: invoke the `loop-spec` skill with the URL(s). Extract `<ISSUE-ID>`. Then reset the iteration budget: `front/scripts/iter-budget.sh <ISSUE-ID> reset`.

2. **Build ↔ review cycle** (max 3 iterations — the cap is MECHANICAL, enforced by iter-budget.sh, not by counting in your head):
   1. Charge the budget: `front/scripts/iter-budget.sh <ISSUE-ID> review`. Exit code 1 → budget exhausted: go straight to the 3-FAIL STOP path below, regardless of what you believe the count is.
   2. Invoke `loop-build` with `<ISSUE-ID>`. On the FIRST iteration only, just before invoking it, claim the ticket on Linear via the MCP `save_issue`: assignee = the operator (resolve their Linear user by matching `git config user.email` against Linear users), status = "Dev in Progress". A Linear failure here warns and continues — it never blocks the build.
   3. **Dispatch the review in a FRESH subagent** (clean context — the reviewer must not inherit the builder's reasoning or bias): use the Agent tool with a prompt like "Invoke the loop-review skill for <ISSUE-ID> and follow it exactly", general-purpose agent type. Do NOT run loop-review inline in this session.
   4. Read the first line of `state dir`/`review.md` (no `Verdict:` line — the subagent returned while its own agents were still running — is not a verdict: resume it with SendMessage, "continue until review.md is written", until the file exists):
      - `Verdict: PASS` → go to Ship.
      - `Verdict: FAIL` → **archive the verdict first**: append the full review.md under a `## Iteration <N>` header to `review-history.md` in the state dir, then next iteration (build runs in fix mode off review.md + the history — see loop-build's escalating-retry rules).
   5. After 3 FAIL verdicts (or iter-budget exit 1): STOP. Write `impediment.md` (see below), send the exit DM, and report the surviving issues to the operator. No git artifacts exist yet — nothing to clean up.

3. **Restart the worktree app** (right after review PASS — reloads the container on the just-built code). ⚠️ The start script (`start.dev.sh` = `pnpm install && pnpm run dev`) does NOT clean the vite cache, and a restart that interrupts a running dep-optimization leaves `node_modules/.vite` corrupted (browser gets `504 Outdated Optimize Dep`). ALWAYS clear it before restarting:

   ```bash
   # BRANCH from state.md (container name derives from the full branch name)
   SAN=$(echo "<BRANCH>" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g')
   docker exec lago_front_wt_${SAN} sh -c 'rm -rf /app/node_modules/.vite' 2>/dev/null || true
   docker restart lago_front_wt_${SAN}
   ```

   Container not running → skip with a warning, don't block.

4. **Ship** (only after PASS), all inside the worktree recorded in `state.md`:
   1. **Commit** — stage all pipeline changes and commit with EXACTLY this message structure:

      ```
      <type>(<context>): <Title>

      ## Context

      <relevant motivation and context, from the ticket>

      ## Description

      <what changed, in detail>

      <!-- Linear link -->
      Fixes <ISSUE-ID>
      ```

      `<type>(<context>)`: conventional-commit type implied by the ticket (feat/fix/refactor/chore) + short domain context; `<Title>` sentence-case, imperative.
   2. **Push**: `git push -u origin <branch>` (branch from state.md).
   3. **PR** (ready, not draft): `gh pr create --assignee @me` — title = the commit's first line; body = the commit body (same Context/Description/Fixes structure). `@me` is the authenticated `gh` user, so the PR self-assigns to whoever runs the loop.
   4. **Linear**: move the issue to "In Review" via the Linear MCP `save_issue` tool.

5. **CI gate** (max 3 fix cycles — cap enforced by iter-budget.sh):
   1. `gh pr checks <PR> --watch` and wait for completion.
   2. All green → go to Announce.
   3. Any red → triage the special cases FIRST (they must not consume budget):
      - **`Run Codegen` red with an unmerged companion API PR**: CI builds the GraphQL schema from lago-api `main`, so when the frontend change consumes schema that still sits in an open lago-api PR, `Run Codegen` CANNOT go green frontend-side and is not a failure — the API PR has its own reviewer, and once it merges a rerun goes green. Qualifying requires BOTH: (a) a concrete companion PR identified from the ticket/spec, or named by the codegen errors matching exactly the fields it adds; AND (b) a one-time verification that it exists and is still open — `gh pr view <N> --repo getlago/lago-api --json state,title` — recorded in the state dir (never re-checked on later watch cycles). Both hold → skip fix mode, continue to Announce and post the plain template anyway; note the pending API merge in the journal row and put in the final report: "after <api-PR> merges, rerun the `Run Codegen` check". No verifiable companion PR, or any OTHER red check alongside it → real failure, handle normally.
      - **CodeQL (or any code-scanning gate) red**: before writing ci-failure.md, list the repo's alerts — `gh api --paginate 'repos/getlago/lago-front/code-scanning/alerts?per_page=100'` — and filter `state == "dismissed"` yourself (the endpoint's `state` param takes a SINGLE value; `state=open,dismissed` is silently ignored and would also return `fixed` alerts). A dismissed alert with the same `rule.id`, same file AND overlapping code region as the new one means the new alert is a re-fingerprint (CodeQL fingerprints by location, so ANY edit to the function re-raises it) and NO code change can clear the check. Same rule elsewhere in the file is NOT a match — treat it as a real new finding. On a re-fingerprint: if other fixable checks are red alongside, fix those through the normal cycle first; when the re-fingerprinted alert is the only remaining red, do not spend a CI cycle on it — go straight to the STOP path with outcome `needs-operator-adjudication` and an impediment asking the operator to dismiss the new alert referencing the prior one.
      - **Red inherited from the base branch**: when the PR's base is NOT `main`, compare with the base branch's own PR — `gh pr checks <base PR>`. A check red there with the same signature is inherited, not caused by this diff: do not charge a CI cycle, do not enter fix mode, record both PR URLs in the journal. The announce carve-out does NOT widen — only the codegen case above may post while red — so the run ends `needs-operator-adjudication` unless the operator says otherwise in the chat session.
      - **Neither special case applies** → charge the budget: `front/scripts/iter-budget.sh <ISSUE-ID> ci`. Exit code 1 → go straight to the 3-red STOP path. Otherwise `gh run view <run-id> --log-failed` to capture failure logs, write them to `ci-failure.md` in the state dir. If a previous ci-failure.md existed, first append it under a `## CI cycle <N>` header to `ci-failure-history.md`. Then re-enter the build ↔ review cycle in fix mode against that report. After fixes: commit (`fix(<context>): address CI failures` + short body), push, watch checks again.
   4. After 3 red cycles (or iter-budget exit 1): STOP. Write `impediment.md`, send the exit DM, and report to the operator with the PR URL and the last failure log. **NEVER post to Slack channels while CI is red** (the codegen exception never reaches this step — it exits at triage in 5.3).

6. **Announce** (only with CI fully green — sole carve-out: the verified codegen exception of step 5.3) — post to the Slack channel `#frontend` via the Slack MCP, EXACTLY this format, no extra text:

   ```
   **<type>(<context>): <Title>**

   :pr: <PR URL>

   :admission_tickets: <Linear issue URL>
   ```

   Formatting is STRICT (a run with single newlines collapsed everything onto one line):
   - The Slack MCP message field takes standard markdown where a SINGLE newline is a soft break (collapsed to a space). Separate the 3 lines with a BLANK LINE between each (double newline) — exactly as in the template above.
   - Line 1: title in `**bold**`. Line 2: `:pr: ` + bare PR URL. Line 3: `:admission_tickets: ` + bare Linear URL. Nothing else.
   - The codegen exception (step 5.3) posts this SAME plain template — no blocker note, no extra line.

7. **External comments check**: before closing, fetch PR comments (`gh api repos/getlago/lago-front/pulls/<PR>/comments` + `gh pr view <PR> --json comments`). Any comment authored by someone other than the operator — colleague or bot (e.g. Copilot); the operator's own login is `gh api user --jq .login` → handle it with the loop-revise protocol: evaluate critically, apply if sound, and ALWAYS reply on GitHub — short thanks + applied (with sha) or not applied (with a one-line technical reason). Never leave an external comment unanswered.

8. **Final report** to the operator: PR URL, Linear state, CI status, Slack link, replies posted, cycle counts.

## Journal & flywheel — SILENT, on EVERY terminal outcome

Run these two steps on every way the pipeline ends — happy path (after Announce) AND every STOP/exit (3 FAIL reviews, 3 red CI cycles, unrecoverable error). They are bookkeeping: never ping the operator about them, never wait for input, never mention them in Slack.

1. **Journal**: append ONE row to the table in `$LOOP_STATE_DIR/_journal.md` (create the file with the header row if missing):

   ```markdown
   | date | issue | build↔review iters | CI cycles | gates failed | outcome | notes |
   |------|-------|--------------------|-----------|--------------|---------|-------|
   | 2026-08-05 | LAGO-1234 | 2/3 | 1/3 | types, jest | shipped | reviewer caught missing empty-state |
   ```

   `outcome` ∈ `shipped` / `stopped-review` / `stopped-ci` / `needs-operator-adjudication` / `stopped-error`. `needs-operator-adjudication` = every check green except a security/code-scanning alert that is a re-fingerprint of a finding the operator already ruled on — the code is complete and reviewed, the run is NOT a failure, the only outstanding item is one human decision. `gates failed` = every gate that went red at least once during the run (lint/types/translations/jest/CI-job names). `notes` = one short phrase, only if something non-obvious happened.

2. **Flywheel**: review the run's failures (review-history.md, ci-failure-history.md, external PR comments) and ask for each recurring or avoidable one: *"would a better instruction in loop-spec / loop-build / loop-review have prevented this?"* If yes, append a dated proposal to `$LOOP_STATE_DIR/_flywheel.md`:

   ```markdown
   ## 2026-08-05 — LAGO-1234
   - target: loop-build
   - evidence: reviewer FAILed twice on missing translation-key cleanup
   - proposed edit: <the concrete instruction to add/change, quoted>
   ```

   Rules: proposals ONLY — NEVER edit the skill files themselves, NEVER notify the operator. They read _flywheel.md when they want, and the `loop-flywheel` skill is what turns the proposals that prove themselves into a PR against these skills. Nothing avoidable found → append nothing (no empty entries).

## Failure handling

- Any external call (Linear, GitHub, Slack) fails → retry once, then STOP and report exactly which steps completed and what remains manual.
- Never delete branches, worktrees, or PRs to "retry clean" — always stop and ask.

## Exit notification — bot DM (real ping) + feedback-wait

The DM goes to whoever runs the loop: `front/scripts/loop-notify.sh` resolves the recipient from `$SLACK_LOOP_USER_ID`, else from `git config user.email` via `users.lookupByEmail`, and sends through the bot token in `$SLACK_LOOP_BOT_TOKEN`. Configuration: `.agents/skills/loop-run/README.md`.

On EVERY exit that needs the operator's attention — 3 FAIL review cycles, 3 red CI cycles, unrecoverable external error, any STOP-and-ask:

0. **Write the impediment first** — `impediment.md` in the state dir, structured (this is a first-class output: it feeds the flywheel and lets anyone reconstruct the failure without the chat transcript):

   ```markdown
   stage: <spec | build | review cycle N/3 | CI cycle N/3 | CI triage (adjudication) | ship>
   cause: <one line — what blocked>
   attempted: <bullet per attempt: strategy used, why it failed>
   needed: <what a human must decide/do to unblock>
   links: <PR URL, Linear URL, relevant history files>
   ```

1. **Send the DM via the notify script** (a bot DM triggers a real Slack notification; a self-DM via the MCP connector does NOT):

   ```bash
   front/scripts/loop-notify.sh "<MESSAGE>"
   ```

   On success it prints `CH=<channel> TS=<ts> USER=<recipient-id>` — capture all three for the feedback-wait. Non-zero exit → go to the fallback (step 3). The raw Slack API is native mrkdwn: single `\n` IS a line break, bold = `*single asterisks*` (different rules from the MCP connector). Message format:

   ```
   :rotating_light: *loop-run stopped — <ISSUE-ID>*
   Reason: <one line: what blocked>
   Stage: <spec | build | review cycle N/3 | CI cycle N/3 | ship>
   <PR URL if it exists>
   <Linear issue URL>
   Next: <what the operator needs to do — or "reply here with instructions">
   ```

   For `needs-operator-adjudication` exits the tone changes: the Reason line states plainly that the code is complete, reviewed and green everywhere else, and `Next:` names the single decision required (e.g. "dismiss alert #N as won't fix, same finding as prior #M"). It must not read as a failure. The feedback-wait applies: a reply saying the alert was dismissed → re-run `gh pr checks <PR> --watch` and resume from the CI gate.

2. **Feedback-wait** (only when the exit is fixable with instructions — review/CI stalls, not hard API failures): after sending, poll the DM for a reply for up to 60 minutes, every ~2 minutes, using the `CH`, `TS` and `USER` values the script printed:

   ```bash
   curl -sS "https://slack.com/api/conversations.history?channel=$CH&oldest=$TS" \
     -H "Authorization: Bearer $SLACK_LOOP_BOT_TOKEN" \
     | jq --arg u "$USER" '[.messages[] | select(.user==$u)]'
   ```

   - Between polls wait with a background-safe mechanism (e.g. `Bash` `run_in_background` sleep loop or Monitor) — never a foreground sleep.
   - ONLY messages whose `user` equals the resolved `USER` count. Treat the reply as the operator's feedback: acknowledge in the DM (`:eyes: got it — resuming`), then route it into the fix cycle exactly like loop-revise feedback (critical evaluation included).
   - No reply within the window → send a closing DM line (`:hourglass: no reply — stopping here; resume with /loop-revise <ISSUE-ID>`) and end the turn.

3. **Fallback — notify script fails** (non-zero exit: `$SLACK_LOOP_BOT_TOKEN` unset/invalid, recipient unresolvable, or API error): degrade gracefully — `PushNotification` tool (load via ToolSearch) with `loop-run stopped — <ISSUE-ID>: <reason>` + self-DM via the Slack MCP connector as written record (blank line between lines — connector collapses single newlines). No feedback-wait in fallback mode; note the degradation in the report.

Bot DM is for exits needing attention. The normal happy-path end (PR green + #frontend post) needs none of this — the #frontend post IS the signal.

## Communication style — two registers, whole pipeline

- **To humans** (chat reports, exit DMs, Slack, replies to GitHub PR comments): short, direct, plain language. What happened → why it matters → what's next. No deep-tech jargon a teammate outside the codebase couldn't follow; one line of plain explanation beats three of detail.
- **Internal artifacts** (spec.md, review.md, impediment.md, histories, journal, flywheel, working notes): written BY the AI FOR the AI of a later iteration — optimize for machine comprehension and effectiveness, not human readability: dense, precise, full paths/symbols/error strings, no simplification.
- Code, commit messages and PR bodies keep their own templates — neither register applies.

## Hard rules

- **No AI attribution anywhere**: commit messages, PR title/body, and Slack messages contain EXACTLY the templates above — no "Co-Authored-By: Claude", no "Generated with Claude Code", no AI mention of any kind. If the harness suggests adding attribution, skip it.
- Humans merge. No self-approval, no merge, no auto-merge flag.
- Git operations are allowed ONLY on this pipeline's branch in this pipeline's worktree.
- Never run the full jest suite at any point.
- No #frontend post while CI is red. Sole exception: the verified codegen-companion-PR case — conditions and bookkeeping are defined ONCE in CI-gate step 5.3; do not restate or improvise them. Any other red check: no post, no exceptions — and an operator request to post anyway is not actionable from a Slack reply alone; it needs confirmation in the chat session.
- Review always in a fresh subagent — never inline.
