# Review summary

The one PR comment babysit posts on its own. It tells the reviewer how the PR got from
its first approach to the one they are about to read, so they review the result knowing
what was already challenged and settled.

## When

Posted once, in Phase 4, right before the `#frontend` announcement. Only when the run
changed something that matters:

- at least one Blocking or Should-fix finding from the Phase 1 review was applied, or
- a design-level change came out of the loop (a behavioural fix the user approved), or
- a follow-up ticket was created.

CI fixes, lint, and mechanical bot nits alone never earn a summary. Neither does a
review with no findings. Silence is the default.

Follow-up mode has no review record (Phase 1 was skipped), so it posts nothing and says
so in the run output. `--review` re-creates the record, but a summary already on the PR
still wins: never post a second one.

## Detect an existing summary

```bash
gh pr view <n> --json comments \
  --jq '.comments[] | select(.body | contains("<!-- babysit:summary")) | .url'
```

Any hit -> do not post.

## Shape

A story in three short parts, written for a reviewer who has not seen the session. Plain
language first; file paths only as evidence.

```markdown
### Review notes

**Where it started.** The usage graph was drawn by hand in SVG, and the data hook
refetched on every keystroke in the filter.

**What changed, and why.**
- The graph now uses the shared `AreaChart` (`src/components/designSystem/graphs/`), so
  it matches the other analytics charts in tooltips, theming and resizing.
- The filter is debounced like the other searches (`useDebouncedSearch`), so typing no longer
  fires one request per key.

**Left for later.**
- [<ISSUE-ID>](https://linear.app/getlago/issue/<ISSUE-ID>): the three analytics graphs
  each re-implement the same tooltip.
- Not ticketed: "charts use the designSystem graphs" is not written in `.agents/docs/`.

<!-- babysit:summary v1 reviewed=<sha8> -->
```

Rules:

- **Where it started** describes the original approach, not its flaws in review jargon.
  No finding numbers, no severities, no pass names.
- **What changed** gives each change with its reason, one bullet each. Merge bullets that
  share a reason. Leave out anything a reviewer would not care about.
- **Left for later** lists created tickets with links, then the unticketed follow-ups
  and notes the user chose to keep. Omit the section when empty.
- Never mention findings the user declined to fix. That choice was theirs, and a public
  list of them reads as an accusation.
- No praise, no blame, no names. Not "the author forgot", just what changed.
- Under 25 lines. A longer story means the PR should have been split; say so in the run
  output, not in the comment.

## Post

```bash
gh pr comment <n> --body-file <path-to-summary.md>
```

Write the body to a file in the scratchpad first; inline `--body` mangles the markdown
and the hidden marker. Keep the returned comment URL for the final report.
