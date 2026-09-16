# The loop pipeline

Takes a Linear ticket and drives it to a review-ready PR on its own: spec, build, review, ship, CI, announce. It runs unattended and asks for a human only when it has genuinely run out of options — or once, after the spec, when you ask it to.

Seven skills, one per phase:

| Skill | Phase | What it does |
|---|---|---|
| `loop-run` | orchestrator | runs the whole thing; owns the retry budgets, ship, CI gate, Slack |
| `loop-clean` | sweep | destroys worktrees whose PR is already merged (asks first) — `worktree` layout only |
| `loop-spec` | 1 | reads Linear + Notion + the codebase, verifies every premise the ticket states, writes an operational spec |
| `loop-build` | 2 | declares the minimal diff in `plan.md`, implements it in the run's worktree, gets the gates green |
| `loop-review` | 3 | reviews the diff against spec and plan in a clean context, PASS/FAIL; an adversarial pass joins only when the diff grew past the plan |
| `loop-revise` | post-PR | applies feedback to an open loop PR, replies to PR comments |
| `loop-flywheel` | harvest | turns the proposals runs leave behind into a PR against these skills, under a fixed cap |

Usual entry point:

```bash
/loop-run https://linear.app/getlago/issue/<ISSUE-ID>/some-ticket
```

Optionally with Notion spec pages: `/loop-run <linear-url> <notion-url> <notion-url>`. Add `--confirm-spec` to pause once after the spec and answer "why does this exist?" on every new file before any code is written — the cheapest quality lever the pipeline has, and off by default.

## Two layouts: a fresh worktree, or the current one

The pipeline is identical either way — the layout only decides who owns the workspace it builds in.
`loop-run` resolves it once and records it in `state.md`; every phase reads it from there.

|  | `worktree` (default) | `in-place` (`--in-place`) |
|---|---|---|
| Workspace | `lago-worktree create` builds `front-worktrees/<BRANCH>/` | the checkout the session already sits in — nothing is created |
| Branch | forced to `<ISSUE-ID>-<topic-slug>` | whatever the checkout carries, **never renamed** |
| Working dir | lago monorepo root, `git -C <worktree>` everywhere | the checkout itself, plain cwd |
| Scripts | `front/scripts/` | `<checkout>/scripts/` |
| Container | `lago_front_wt_<branch>` | `lago_front_ct_<workspace>` under Conductor, none otherwise |
| Sweep / cleanup | `loop-clean` + `lago-worktree destroy` | the checkout's owner — under Conductor, archiving the workspace |
| Docker preflight | hard STOP without the stack | warning only; the restart step skips itself when there is no container |

`in-place` turns on automatically when `$CONDUCTOR_WORKSPACE_PATH` is set, so inside a
[Conductor](https://www.conductor.build) workspace the plain entry point already does the right
thing — the workspace **is** the worktree, the branch, the port and the container, and archiving it
is the cleanup. Anywhere else, pass the flag explicitly:

```bash
/loop-run https://linear.app/getlago/issue/<ISSUE-ID>/some-ticket --in-place
```

Use it when you are already on the branch you want the PR to carry: a Conductor workspace, a plain
`git worktree`, a second clone. **One checkout, one ticket** — start a fresh workspace per ticket.

Why the branch is never renamed in `in-place`: Conductor persists `workspaces.branch` in its own
SQLite database. A `git branch -m` inside the workspace changes git but not that record, which
desyncs Conductor's diff view and its archive-time branch deletion.

## Why it is built this way

The loop's quality comes from the harness, not from the prompt. Four properties are load-bearing:

- **Verification is external to the generator.** The exit condition is never "the agent thinks it is done": it is `pnpm lint`, `pnpm types`, `pnpm translations:*`, `diff-hygiene.sh`, scoped jest, a PASS verdict from a reviewer that never saw the builder's reasoning, and green CI.
- **The reviewer runs in a fresh subagent.** A builder reviewing its own work grades itself. `loop-run` dispatches `loop-review` with clean context, and the reviewer re-runs the gates instead of trusting the build phase's claim. A second, adversarial reviewer is dispatched only when `loop-plan-check.sh` finds a file or export the plan did not declare — it derives the smallest diff for the criteria before it is allowed to see the real one.
- **The retry budget is mechanical.** `scripts/iter-budget.sh` keeps the counters on disk and refuses the fourth attempt.
- **The instruction set is capped.** `scripts/skill-budget.sh` runs on every push: 7 checks in `loop-review`, 7 in `loop-build`, 5 in `loop-spec`, 150 lines in `loop-run`, and no Linear ticket ID anywhere under `.agents/`. A check enters only by deleting one; `loop-flywheel` deletes the ones the journal shows never fire.

## Setup, per developer

Nothing about any specific person is in these files. Each developer configures their own identity and the loop follows it.

**1. Required tooling**

- `gh` authenticated (`gh auth status`) — the PR self-assigns to whoever runs the loop.
- Docker stack up (`lago_front_dev` running). The `worktree` layout also needs the `lago-worktree` helper (`front/scripts/lago-worktree.sh`) and hard-stops without the stack; `in-place` only warns, since its gates run on the host.
- MCP connectors: Linear (read ticket, move to In Review), Notion (specs; the coding styleguide is mirrored in `.agents/docs/frontend-coding-styleguide.md` and refreshed by the flywheel), Slack (the `#frontend` announcement).
- `jq` and `curl` for the notification script.

**2. Slack bot, for the "I'm stuck" DM**

The loop DMs you when it gives up. It needs a bot token because a self-DM through the MCP connector does not raise a real notification. Create a small Slack app (or reuse a shared one), install it in the workspace, and give it these bot scopes:

- `chat:write` — send the DM
- `im:write` — open the DM channel
- `im:history` — read your reply, so the loop can resume from your instructions
- `users:read.email` — optional, only if you want the recipient resolved from your git email

**3. Environment**

Put these in your shell profile or your own `.claude/settings.local.json` (never in a tracked file).
Under Conductor the script environment captures your login shell, so the same profile works; per
repository you can also use `.conductor/settings.local.toml` (gitignored).

| Variable | Required | Meaning |
|---|---|---|
| `SLACK_LOOP_BOT_TOKEN` | yes | bot token of the app above (`xoxb-…`) |
| `SLACK_LOOP_USER_ID` | recommended | your Slack member ID (profile → Copy member ID). Set it and resolution is instant. Unset → the script looks you up by `git config user.email`, which only works if that is your work email and the app has `users:read.email` |
| `LOOP_STATE_DIR` | no | where run state lives. Default `~/.claude/loop-state` |
| `ITER_MAX` | no | attempts allowed per retry budget. Default `3`. `LOOP_MAX_ITER` still works as a deprecated alias |
| `ITER_STATE_DIR` | no | where `iter-budget.sh` keeps its counters. Falls back to `LOOP_STATE_DIR`, then the default. Only set it if you point it at the **same** root as `LOOP_STATE_DIR` |

**4. Verify**

```bash
front/scripts/loop-notify.sh --check          # worktree layout
"$(git rev-parse --show-toplevel)/scripts/loop-notify.sh" --check   # in-place
```

Prints the resolved recipient and DM channel without sending anything.

## Team policies this pipeline assumes

Adopting the loop means accepting these. They are enforced in the skills as hard rules.

- **The pipeline commits, pushes and opens the PR.** It is the one place where an agent performs git write operations, and only ever on its own branch in the worktree recorded in `state.md`. It never force-pushes and never touches the main checkout (`$CONDUCTOR_ROOT_PATH` included).
- **Humans merge.** No self-approval, no merge, no auto-merge flag — ever.
- **No AI attribution** in commits, PR bodies or Slack messages.
- **`#frontend` is posted only when CI is green** — sole exception: a red `Run Codegen` caused by a verified unmerged companion lago-api PR (loop-run CI gate), which is announced anyway since only the API merge plus a rerun stand between it and green.
- **The full jest suite is never run.** Only scoped paths for the touched domain.
- **Every external PR comment gets a reply** — applied with the sha, or not applied with a one-line technical reason.
- **Destructive cleanup always asks.** `loop-clean` never destroys a dirty worktree or one with unpushed commits — and in `in-place` the pipeline manages no workspace at all.
- **Only the spec phase fetches.** `spec.md` carries the ticket verbatim; the builder and both reviewers read it from there and never call Linear or Notion.

## Run state

Per-developer, outside the repo, in `$LOOP_STATE_DIR/<ISSUE-ID>/`:

| File | Written by | Purpose |
|---|---|---|
| `spec.md` | loop-spec | the operational spec the whole run is judged against, ticket included verbatim, every premise verified or marked |
| `plan.md` | loop-build | the declared minimal diff: files, new files, new exports, deviations |
| `state.md` | loop-build | layout, worktree path, branch, dev port, workspace + container when there is one |
| `review.md` | loop-review | current PASS/FAIL verdict, every issue tagged with the check that produced it |
| `adversarial.md` | adversarial pass | verdict of the smallest-diff comparison, when the pass was triggered |
| `review-history.md` | loop-run | every previous FAIL verdict — fuel for the escalating retry |
| `ci-failure.md` / `ci-failure-history.md` | loop-run / loop-ci-log.sh | current and past CI failures, **distilled** |
| `ci-raw-<N>.log` | loop-ci-log.sh | the raw `--log-failed` output, on disk for you — never read into an agent's context |
| `feedback.md` | loop-revise | every round of human feedback |
| `impediment.md` | loop-run / loop-revise | why the loop gave up: stage, cause, what it tried, what it needs |
| `counters/` | iter-budget.sh | the retry budgets |

Plus two files shared across runs: `_journal.md` (one row per run, written by `loop-journal.sh` — iterations spent, gates that failed, outcome, and `fail-check:` naming every check that produced a FAIL) and `_flywheel.md` (proposals to improve these skills).

## Improving the loop

Every run that struggles writes down why. `_flywheel.md` collects proposed edits to the skills, evidence attached; the loop never edits its own instructions. `/loop-flywheel` is the harvest: it admits a proposal only if it would have prevented the failure **and** a second, different occurrence is plausible, writes it as a script or lint rule when it can be one, and takes a check slot only by freeing one. It also prunes: a check with no `fail-check:` entry across the last 15 journal rows is deleted or converted. `_journal.md` is how you tell whether any of it helped — average iterations per run should fall, and `fail-check:` should name the checks that actually earn their place.

Scripts live in the front checkout's `scripts/` (`front/scripts/` from the monorepo root), each documented in its header: `iter-budget.sh` (retry budget), `skill-budget.sh` (instruction caps, pre-push), `diff-hygiene.sh` (comment length gate), `loop-plan-check.sh` (adversarial trigger), `loop-restart.sh` (container reload), `loop-ci-log.sh` (CI failure capture), `loop-journal.sh` (journal row), `loop-notify.sh` (exit DM).
