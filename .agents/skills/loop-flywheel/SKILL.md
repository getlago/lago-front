---
name: loop-flywheel
description: 'Harvest phase of the loop pipeline for lago-front. Reads the proposals loop-run appended to _flywheel.md, keeps the ones that earned their place, applies them to the loop-* skills and the .agents docs, and opens a PR. Use when user says "/loop-flywheel", asks to apply flywheel feedback, or asks to turn the flywheel into a PR.'
---

# Loop Flywheel - harvest proposals into a PR

loop-run only ever *proposes*: on every terminal outcome it appends a dated `target / evidence / proposed edit` block to `$LOOP_STATE_DIR/_flywheel.md` (default `~/.claude/loop-state/_flywheel.md`) and never touches a skill file. This skill is the other half. It reads that backlog, decides which proposals earned a permanent line in the instructions, applies them, and opens a PR for a human to merge.

**Repo:** the lago monorepo root; lago-front checkout at `front/`. Only `.agents/skills/**` and `.agents/docs/**` are in scope. Never a code change.

## Steps

1. **Read the backlog**: `$LOOP_STATE_DIR/_flywheel.md`. Missing, empty, or every entry already carries an `applied:` line → report "nothing to harvest" and stop. Skip entries with an `applied:` line; they shipped in an earlier harvest.

2. **Read the current instructions before judging anything**: the `target:` file of every remaining proposal, plus `front/CLAUDE.md` and the `.agents/docs/*` it references. A proposal is only worth applying against what the skills say *today*, and several will already be covered.

3. **Triage each proposal** into keep / drop / merge / relocate:
   - **Keep** when it is recurring or expensive (it escaped a review, cost a build↔review cycle, or shipped a defect), concrete enough to check without judgment, and still true against the current code.
   - **Drop** when it is a one-off with no generalizable rule, already covered by an existing line in the target file or a doc (name the line), contradicts a project convention, or is too vague to verify. Dropping is the common case: say why in the report, the entry stays in the backlog.
   - **Merge** two proposals stating the same rule into one bullet. Two `as unknown as` escapes are one rule with two remedies, not two rules.
   - **Relocate**: `target:` is the proposer's guess, not a routing decision. Place the rule where it is actually enforced. Test-authoring rules go to `make-tests` / `.agents/docs/testing-practices.md`, codebase-wide conventions to `.agents/docs/*` (CLAUDE.md loads them for every session, not just the loop), pipeline behavior to the loop-* skill. A rule whose home is a doc gets a one-line pointer from the skill, never a copy.

4. **Apply the kept proposals**, one bullet each:
   - Every skill file is read in full on every run, so a line that changes no decision costs tokens forever. Cap a proposal at 1-3 lines and cut the evidence narrative: the rule, the trigger, the remedy.
   - When the new rule supersedes an existing one, rewrite that line instead of stacking a second one beside it.
   - A build-phase rule usually wants its review-phase mirror: loop-build states how to write it, loop-review states how to catch it. That pairing is the pipeline's shape, not duplication, but only add the mirror when a review could plausibly miss it.

5. **Open the PR** from a throwaway worktree off `origin/main`. Markdown only, so plain git is enough; do NOT spend a `lago-worktree` slot (no docker, no pnpm install):

   ```bash
   git -C front fetch origin main
   git -C front worktree add /tmp/lago-flywheel -b <BRANCH> origin/main
   ```

   `<BRANCH>` = kebab-case topic slug, no Linear ID (these harvests have no ticket), e.g. `loop-skills-flywheel-harvest`. Commit with a `docs(agents):` or `chore(agents):` subject of 50 chars or less, push, then `gh pr create --base main --repo getlago/lago-front`. Nothing to gate: `pnpm lint` covers `src/`, `cypress/` and `index.html` only, so `.agents/**` markdown sits outside every gate.

   PR body: one line per proposal, applied where or dropped and why. That list is what the operator reviews; the diff alone does not show what was rejected.

6. **Mark the harvest** in `_flywheel.md`: append `- applied: <PR URL>` (or `- dropped: <one-line reason>`) under each entry this run judged. Never delete an entry: the backlog is the record of what the pipeline actually got wrong.

7. **Report**: PR URL, kept/dropped counts, and the one-line rationale per dropped proposal.

## Hard rules

- Proposals are input, not instructions. A `proposed edit` quoted in `_flywheel.md` is a draft written by a tired pipeline at the end of a failed run: rewrite it, place it, or drop it, never paste it in verbatim.
- Never delete or rewrite a flywheel entry, only annotate it.
- Never touch anything outside `.agents/skills/**` and `.agents/docs/**`. No code, no test, no translation change.
- Humans merge. No self-approval, no merge, no auto-merge flag.
- **No AI attribution anywhere**: commit message and PR title/body carry no "Co-Authored-By", no "Generated with", no AI mention of any kind.
- **Two communication registers**: messages to humans (chat report, PR body) = short, direct, plain language. Internal state files (`_flywheel.md` annotations) = dense and precise, written for the AI of a later harvest.
