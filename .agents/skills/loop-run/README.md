# The loop pipeline

Takes a Linear ticket and drives it to a review-ready PR on its own: spec, build, review, ship, CI, announce. It runs unattended and asks for a human only when it has genuinely run out of options.

Six skills, one per phase:

| Skill | Phase | What it does |
|---|---|---|
| `loop-run` | orchestrator | runs the whole thing; owns the retry budgets, ship, CI gate, Slack |
| `loop-clean` | sweep | destroys worktrees whose PR is already merged (asks first) |
| `loop-spec` | 1 | reads Linear + Notion + the codebase, writes an operational spec |
| `loop-build` | 2 | implements in a dedicated worktree, gets lint/types/translations green |
| `loop-review` | 3 | reviews the diff against the spec in a clean context, PASS/FAIL |
| `loop-revise` | post-PR | applies feedback to an open loop PR, replies to PR comments |

Usual entry point:

```bash
/loop-run https://linear.app/getlago/issue/LAGO-1234/some-ticket
```

Optionally with Notion spec pages: `/loop-run <linear-url> <notion-url> <notion-url>`.

## Why it is built this way

The loop's quality comes from the harness, not from the prompt. Three properties are load-bearing:

- **Verification is external to the generator.** The exit condition is never "the agent thinks it is done": it is `pnpm lint`, `pnpm types`, `pnpm translations:*`, scoped jest, a PASS verdict from a reviewer that never saw the builder's reasoning, and green CI.
- **The reviewer runs in a fresh subagent.** A builder reviewing its own work grades itself. `loop-run` dispatches `loop-review` with clean context, and the reviewer re-runs the gates instead of trusting the build phase's claim.
- **The retry budget is mechanical.** `scripts/iter-budget.sh` keeps the counters on disk and refuses the fourth attempt. The cap does not depend on the agent remembering how many times it has tried.

## Setup, per developer

Nothing about any specific person is in these files. Each developer configures their own identity and the loop follows it.

**1. Required tooling**

- `gh` authenticated (`gh auth status`) — the PR self-assigns to whoever runs the loop.
- Docker stack up (`lago_front_dev` running) and the `lago-worktree` helper available (`front/scripts/lago-worktree.sh`).
- MCP connectors: Linear (read ticket, move to In Review), Notion (specs + Frontend coding styleguide), Slack (the `#frontend` announcement).
- `jq` and `curl` for the notification script.

**2. Slack bot, for the "I'm stuck" DM**

The loop DMs you when it gives up. It needs a bot token because a self-DM through the MCP connector does not raise a real notification. Create a small Slack app (or reuse a shared one), install it in the workspace, and give it these bot scopes:

- `chat:write` — send the DM
- `im:write` — open the DM channel
- `im:history` — read your reply, so the loop can resume from your instructions
- `users:read.email` — optional, only if you want the recipient resolved from your git email

**3. Environment**

Put these in your shell profile or your own `.claude/settings.local.json` (never in a tracked file):

| Variable | Required | Meaning |
|---|---|---|
| `SLACK_LOOP_BOT_TOKEN` | yes | bot token of the app above (`xoxb-…`) |
| `SLACK_LOOP_USER_ID` | recommended | your Slack member ID (profile → Copy member ID). Set it and resolution is instant. Unset → the script looks you up by `git config user.email`, which only works if that is your work email and the app has `users:read.email` |
| `LOOP_STATE_DIR` | no | where run state lives. Default `~/.claude/loop-state` |
| `ITER_MAX` | no | attempts allowed per retry budget. Default `3`. `LOOP_MAX_ITER` still works as a deprecated alias |
| `ITER_STATE_DIR` | no | where `iter-budget.sh` keeps its counters. Falls back to `LOOP_STATE_DIR`, then the default — so leaving it unset keeps counters inside the run directory. Only set it if you point it at the **same** root as `LOOP_STATE_DIR`; a different value splits the counters from the rest of the run state |

**4. Verify**

```bash
front/scripts/loop-notify.sh --check
```

Prints the resolved recipient and DM channel without sending anything.

## Team policies this pipeline assumes

Adopting the loop means accepting these. They are enforced in the skills as hard rules.

- **The pipeline commits, pushes and opens the PR.** It is the one place where an agent performs git write operations, and only ever on its own branch in its own worktree. It never force-pushes and never touches the main checkout.
- **Humans merge.** No self-approval, no merge, no auto-merge flag — ever.
- **No AI attribution** in commits, PR bodies or Slack messages.
- **`#frontend` is posted only when CI is green** — sole exception: a red `Run Codegen` caused by a verified unmerged companion lago-api PR (loop-run CI-gate step 5.3), which is announced anyway since only the API merge plus a rerun stand between it and green.
- **The full jest suite is never run.** Only scoped paths for the touched domain.
- **Every external PR comment gets a reply** — applied with the sha, or not applied with a one-line technical reason.
- **Destructive cleanup always asks.** `loop-clean` never destroys a dirty worktree or one with unpushed commits.

## Run state

Per-developer, outside the repo, in `$LOOP_STATE_DIR/<ISSUE-ID>/`:

| File | Written by | Purpose |
|---|---|---|
| `spec.md` | loop-spec | the operational spec the whole run is judged against |
| `state.md` | loop-build | worktree path, branch, dev port |
| `review.md` | loop-review | current PASS/FAIL verdict |
| `review-history.md` | loop-run | every previous FAIL verdict — fuel for the escalating retry |
| `ci-failure.md` / `ci-failure-history.md` | loop-run | current and past CI failure logs |
| `feedback.md` | loop-revise | every round of human feedback |
| `impediment.md` | loop-run / loop-revise | why the loop gave up: stage, cause, what it tried, what it needs |
| `counters/` | iter-budget.sh | the retry budgets |

Plus two files shared across runs: `_journal.md` (one row per run — iterations spent, gates that failed, outcome) and `_flywheel.md` (proposals to improve these skills).

## Improving the loop

Every run that struggles writes down why. `_flywheel.md` collects proposed edits to the skills, evidence attached; the loop never edits its own instructions. Read it when you have a moment, and turn a proposal that keeps recurring into a PR against `.agents/skills/loop-*`. `_journal.md` is how you tell whether such a change actually helped — average iterations per run should fall.

Scripts live in `front/scripts/`: `iter-budget.sh` (retry budget) and `loop-notify.sh` (exit DM). Both are standalone and documented in their headers.
