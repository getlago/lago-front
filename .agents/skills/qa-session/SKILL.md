---
name: qa-session
description: Use when the operator wants to verify in the browser that a change works — asks "come lo testo in locale?", "dammi gli step", "QA this", references a worktree/PR/ticket built in this session, or reports something not working during manual testing (button does nothing, section missing, block blank).
---

# QA Session — browser verification of a change

Turn a diff into UI steps, reproduce the old bug on main, then prove the fix removes it.
Every step is derived from the code (routes, labels, gates) — never guessed.

**What QA has to disprove is the reported symptom, not the diff.** A fix can be correct, its tests green,
its own control run red-then-green, and still leave the ticket's bug in place — the diff answers the
analysis, and the analysis can have found a real but different defect. Everything below is built so that
failure mode cannot end in a PASS.

## Step 0 — Args (both required)

1. **Mode**: `manual` (operator clicks, you give steps + triage) or `auto` (you drive the browser).
2. **Target**: ISSUE-ID, PR number, branch/worktree, or free-text description of the surface to test.

Either missing → AskUserQuestion, stop until answered.

**auto mode uses Chrome only** (`mcp__claude-in-chrome__*`, load via ToolSearch) — the operator is already
logged in there. Never the built-in Browser pane, never type credentials. Prefer `browser_batch`; re-read
refs after every navigation (stale refs click the backdrop and close drawers).

## Step 1 — Resolve the app under test

- ISSUE-ID → `$LOOP_STATE_DIR/<ISSUE-ID>/state.md` (default `~/.claude/loop-state`) for worktree, branch, port. Else `lago/.worktree-slots`
  (`name:front_port:base:api_port:api_base`) or `docker ps`.
- Front URL `http://localhost:<front_port>`; container `lago_front_wt_$(echo "<BRANCH>" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/_/g')`.
- Stale code / `504 Outdated Optimize Dep` / blank page → clear vite cache THEN restart (first load is slow):
  ```bash
  docker exec <container> sh -c 'rm -rf /app/node_modules/.vite' || true
  docker restart <container>
  ```

## Step 2 — Preconditions

Read **the ticket's own repro steps first**, then the diff + spec — in that order, so the report frames the
diff and not the other way round. Enumerate the ticket's attachments (`get_issue` → `attachments`, plus
`list_comments`): a video, screenshot or Slack thread often carries the only repro there is. You cannot watch
a video — say so explicitly, and ask the operator for the gesture and the surface rather than substituting a
plausible one.

Then check what gates the surface:

- **Feature flag** — `featureFlag: FeatureFlagEnum.X` on the route in `src/core/router/*`; enum value = DB string:
  ```bash
  docker exec -it <api_container> bin/rails runner 'o = Organization.first; o.update!(feature_flags: (o.feature_flags | ["<flag>"])); puts o.feature_flags.inspect'
  ```
- **Permissions / premium** — `permissions:` on the route, `premiumIntegrations` gates.
- **Data** — what must exist (customer, plan, wallet) and the org slug (URLs are `/<slug>/...`).

## Step 3 — Test plan (UI language only)

Numbered steps, each with: exact URL · exact visible label (button, menu item, drawer title, read from the
component and `translations/base.json`) · **expected result** · **old-bug behavior**. No internals in the steps.

- **Check 1 is always the reporter's own path** — their steps, their payload, their surface, described in
  their words. Diff-derived checks come after it, and are secondary.
- **If the spec's acceptance criteria don't cover the reporter's path, that is already a finding**: say so
  in the plan, and treat the report as the thing to satisfy. An AC set that only describes the diff means
  the analysis may have scoped a different defect.
- Target the exact code path the diff touched. Same feature ≠ same surface (in-editor preview toggle vs
  saved-version preview rebuild). Name which surface proves the fix.
- **Test on the product surface, not a dev harness.** `/design-system/*` pages differ structurally from the
  real one — they grow instead of scrolling, have no fixed-height/`overflow-auto` wrapper, no aside, no real
  data. Those differences are exactly what hides layout, scroll and clipping defects. Using a harness for
  speed is fine; list the structural deltas, then re-run check 1 on the real surface.
- **Input fixtures**: when the bug depends on content (paste, import, file), give the exact content, crafted
  against the diff — a generic fixture can silently fail to reproduce.
- **Declared deltas**: pull intentional visual changes and known follow-ups from the spec/PR in as
  "expected — not a bug" lines, so the operator doesn't file them.

## Step 4 — Control run on main (mandatory, do it FIRST)

Reproduce the bug on unfixed code before verifying the fix — otherwise a PASS proves nothing. **Two separate
controls, both on main:**

- **(a) AC control** — the spec's failing check. Proves the fix does what it claims.
- **(b) Report control** — the reporter's own steps, payload and surface. Proves the fix addresses what was
  actually filed.

They are not interchangeable, and (a) passing says nothing about (b). If (b) does not reproduce on main —
the reported gesture works fine on unfixed code — then the analysis found a real defect that is not the
reported one: stop, say it plainly, and hunt the reported symptom before signing anything off. Verdict is
capped at PARTIAL until (b) reproduces.

Same trick both times:

1. Preferred (same worktree, `git status --short` must be empty):
   `git checkout main -- <touched files>` → vite HMR reloads → run the failing check → confirm the old
   behavior → `git checkout HEAD -- <touched files>` and re-verify the tree is clean.
2. Alternative: another running worktree whose branch doesn't touch those files (`git diff main...HEAD --stat`)
   — they share the DB, so the same fixture URL works on both ports.

Record which route was used. If neither is possible, say so plainly and do not claim causality.

## Step 5 — Verify the fix

Same steps on the fixed app. Screenshot every expected-result checkpoint. Include a reload check when the
value also arrives from a second path (hydration, refetch), so the fix isn't masking a regression there.

- **Presence is not visibility.** `!!document.querySelector('[data-test=x]')` passes on an element rendered
  off-screen, clipped or collapsed. For anything floating (menu, toolbar, popper, tooltip, drawer) assert the
  **geometry**: rect inside the visible box of its scroll container, non-zero size, not covered.
- **Scroll is a test dimension**, not a detail: run the check at `scrollTop` 0 **and** with the container
  scrolled. An absolutely-positioned overlay inside a scrolled `position: relative` container is a standing
  trap — its offset must include `scrollTop`/`scrollLeft`, and at scroll 0 a broken one looks perfect.

## Step 6 — Triage anomalies live

Read the handler BEFORE calling anything a bug.

| Symptom | Check first |
|---|---|
| Button no-ops silently | early-return validation gate in the save handler |
| Menu entry / page missing | feature flag or permission on the route |
| Blank page, `504 Outdated Optimize Dep` | vite cache → Step 1 |
| Stale behavior after a rebuild | container running old code → restart |
| Click does nothing on part of a block | hitbox is the inner content, not the row |
| Menu / popper / tooltip "never opens" | it may be in the DOM but positioned out of view — compare its rect with the scroll container's, check `offsetParent`, `scrollTop` in the offset math, clipping and z-index |
| Looks off (spacing, alignment) | measure from the CSS source and fix the computed delta, never by eye |

`src/` edits (CSS included) hot-reload — the operator just reloads. Restart only for dependency/config changes.

## Step 7 — Record, then the verdict LAST

Append results to `$LOOP_STATE_DIR/<ISSUE-ID>/qa.md`: one row per check, mode, PASS/FAIL, the control
outcome, what was deliberately not covered, anomalies with root cause. Genuine side-findings → propose as a
separate ticket; never fix unasked.

Then close the reply with this block as the **very last thing** — nothing after it:

```
## Verdict: PASS | PARTIAL | FAIL
<one line why>
Control on main (AC): bug reproduced | not reproduced | not possible (<reason>)
Control on main (reported repro, reporter's own steps): reproduced | not reproduced | not possible (<reason>)
Surface: <product surface tested> (<dev harness only, if that is all that was covered>)
Next: <nothing to do | what needs another round | what is still broken>
```

- **PASS** — every check passed, both controls reproduced on main, and check 1 ran on the product surface.
- **PARTIAL** — fix works but a check was blocked, either control couldn't run, the reported repro didn't
  reproduce on main, only a dev harness was covered, or something new surfaced → another round needed.
- **FAIL** — the target behavior is still broken on the fixed app.

## Common mistakes

- Skipping the control run, so "it works" doesn't prove the fix did it.
- Building the control fixture from the spec's ACs instead of the reporter's steps — it then proves the fix
  matches the analysis, which is the one thing never in doubt.
- Signing off a fix for a defect nobody reported while the filed symptom is still there.
- Asserting an element exists instead of asserting it is visible where the user looks.
- Verifying only on `/design-system/*`, whose layout can't reproduce the product surface's scroll or clipping.
- auto mode on the built-in pane instead of Chrome, or typing credentials.
- Guessing URLs and labels instead of reading routes, components, and translations.
- Proving the fix on the wrong surface.
- Calling a silent validation gate a bug.
- Burying the verdict in the middle of the reply.
