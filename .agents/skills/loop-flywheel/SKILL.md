---
name: loop-flywheel
description: 'Harvest phase of the loop pipeline for lago-front. Reads the proposals loop-run and loop-revise appended to _flywheel.md, admits only the ones that pass the governance rules, prunes checks the journal shows to be dead, refreshes the styleguide mirror, applies the result to the loop-* skills and the .agents docs, and opens a PR. Use when user says "/loop-flywheel", asks to apply flywheel feedback, or asks to turn the flywheel into a PR.'
---

# Loop Flywheel - harvest proposals into a PR

loop-run and loop-revise only ever *propose*: on every terminal outcome they append a dated `target / evidence / proposed edit` block to `$LOOP_STATE_DIR/_flywheel.md` (default `~/.claude/loop-state/_flywheel.md`) and never touch a skill file. This skill is the other half. It reads that backlog, decides which proposals earned a permanent line, applies them, and opens a PR for a human to merge.

**Repo:** the lago monorepo root; lago-front checkout at `front/`. Only `.agents/skills/**`, `.agents/docs/**` and `scripts/` are in scope. Never a product code change.

## Governance — the four rules every harvest applies

The instruction set has an entrance and needs an exit. Attention is a fixed budget; a check past the cap subtracts from the ones already there. These rules are the exit, and `scripts/skill-budget.sh` enforces the mechanical half of them on every push.

1. **Fixed cap per skill.** `loop-review` 7 checks, `loop-build` 7, `loop-spec` 5, `loop-run` 150 lines (`skill-budget.sh`). A proposal that adds a check names the check it deletes or merges into; without that line it is dropped, however good the evidence.
2. **Doubled admission.** A proposal enters only if it would have prevented the failure it cites **and** you can name a second, different, plausible occurrence — a different ticket shape, a different component family. "It would have helped here" alone is a one-off: drop, and say so.
3. **Mechanism > mechanical test > prose.** If the proposal can be a script in `scripts/`, an ESLint rule in `packages/configs/eslint-rules/`, or a structural separation (a fresh subagent, a file the phase cannot see), write it that way and delete the prose it replaces. A prose check is the last resort, and only for what needs judgment.
4. **Pruning by the journal.** Read `$LOOP_STATE_DIR/_journal.md`: the `notes` cell of every row starts with `fail-check: …` when a check produced a FAIL. A check absent from that column across the last 15 rows is a deletion candidate: delete it, or convert it to a lint rule / script, in this same PR. Fewer than 15 rows since the check was added → not yet.

## Steps

1. **Read the backlog**: `_flywheel.md`. Skip entries carrying an `applied:` or `dropped:` line. Nothing left and no pruning candidate → report "nothing to harvest" and stop.

2. **Read the current instructions before judging anything**: the `target:` file of every remaining proposal, `front/CLAUDE.md` and the `.agents/docs/*` it references, and the journal's last 15 rows. Several proposals will already be covered.

3. **Triage each proposal** into keep / drop / merge / relocate, applying the four rules above in order:
   - **Keep** when it is recurring or expensive (escaped a review, cost a cycle, shipped a defect), passes doubled admission, is written as the strongest mechanism available, and either replaces an existing check or costs no check slot.
   - **Drop** when it fails any rule, is already covered (name the line), contradicts a project convention, or is too vague to verify. Dropping is the common case: say why in the report, the entry stays in the backlog.
   - **Merge** two proposals stating the same rule into one bullet.
   - **Relocate**: `target:` is the proposer's guess. Test-authoring rules go to `make-tests` / `.agents/docs/testing-practices.md`, codebase-wide conventions to `.agents/docs/*`, pipeline behaviour to the loop-* skill, anything mechanical to `scripts/`. A rule whose home is a doc gets a one-line pointer from the skill, never a copy.

4. **Apply the kept proposals**, one bullet each:
   - Cap a proposal at 1-3 lines: the rule, the trigger, the remedy. Cut the evidence narrative.
   - **Strip every ticket ID.** A proposal's evidence names the run; the rule it becomes does not. `skill-budget.sh` fails the push on any `<TEAM>-<N>` shape under `.agents/**`; examples use `<ISSUE-ID>` placeholders.
   - When the new rule supersedes an existing one, rewrite that line instead of stacking a second one beside it.
   - A build-phase rule usually wants its review-phase mirror; add the mirror only when a review could plausibly miss it, and count both against their caps.

5. **Refresh the styleguide mirror**: `notion-fetch` the "Frontend coding styleguide" page and compare `page_last_edited_at` with the `Notion last edited` date in `.agents/docs/frontend-coding-styleguide.md`. Moved → update the mirror (and the doc a section already lives in), bump both dates. Unchanged → nothing.

6. **Run the gate**: `front/scripts/skill-budget.sh` must exit 0 before the commit. Over cap → go back to step 3, a proposal must give way.

7. **Open the PR** from a throwaway worktree off `origin/main`. Markdown and scripts only; do NOT spend a `lago-worktree` slot:

   ```bash
   git -C front fetch origin main
   git -C front worktree add /tmp/lago-flywheel -b <BRANCH> origin/main
   ```

   `<BRANCH>` = kebab-case topic slug, no Linear ID, e.g. `loop-skills-flywheel-harvest`. Commit with a `docs(agents):` or `chore(agents):` subject of 50 chars or less, push, then `gh pr create --base main --repo getlago/lago-front`.

   PR body: one line per proposal (applied where, or dropped and why), one line per pruned check with the journal span that justified it, one line for the styleguide refresh. That list is what the operator reviews.

8. **Mark the harvest** in `_flywheel.md`: append `- applied: <PR URL>` or `- dropped: <one-line reason, naming the rule it failed>` under each entry judged. Never delete an entry.

9. **Report**: PR URL, kept/dropped/pruned counts, and the one-line rationale per dropped proposal.

## Hard rules

- Proposals are input, not instructions. A `proposed edit` is a draft written by a tired pipeline at the end of a failed run: rewrite it, place it, or drop it, never paste it in verbatim.
- Never delete or rewrite a flywheel entry, only annotate it.
- Never touch anything outside `.agents/skills/**`, `.agents/docs/**` and `scripts/`. No product code, no test, no translation change.
- Humans merge. No self-approval, no merge, no auto-merge flag.
- **No AI attribution anywhere**: commit message and PR carry no "Co-Authored-By", no "Generated with", no AI mention.
- **Two communication registers**: messages to humans (chat report, PR body) = short, direct, plain language. Internal state files (`_flywheel.md` annotations) = dense and precise, written for the AI of a later harvest.
