# System review

Passes B and C of Phase 1. Pass A checks the diff against the documented rules. These two
check what no rule can: whether the change fits the application it lands in, and whether
the approach itself holds up.

Both read the diff as a change to a whole application, not as a set of edited lines. A
PR that draws a chart with raw SVG passes every convention check, because no rule says
"use recharts". It still fails here, because the app already draws charts with recharts.

Read `.agents/docs/review-evidence.md`. Pass B supplies the pattern/consumer evidence;
Pass C supplies the state-transition evidence when it runs. The coordinating reviewer
closes material gaps even when Pass C is skipped. Return evidence as well as findings.

## Ground rules for both passes

- **Evidence or drop it.** Every finding names either the `file:line` of what already
  exists, or the concrete scenario that breaks. "This could be cleaner" is not a finding.
- **The question is the fit, not the taste.** Prefer the approach the codebase already
  documents and uses in current implementations; legacy siblings do not override the
  documented pattern. Consistency is the default; breaking it
  needs a reason the PR states.
- **Nothing CI catches, nothing pass A already reported.** No formatting, typing, lint,
  test failures, or documented-rule violations.
- **In scope vs follow-up.** A problem the PR introduces is a finding. A problem the PR
  only reveals (pre-existing duplication, a shared component missing a prop, an
  undocumented convention) is a follow-up candidate, never a change to this PR.
- **Plain language.** Write each finding so a product manager can follow it: what is
  wrong, why it matters to the app, what to do instead. Technical detail goes after that,
  not instead of it.
- **One recommendation per finding.** The author should be able to answer "all" and get
  a sound result, without having to judge between options.

## Pass B - System fit

For every new thing the diff introduces (component, hook, util, dependency, query,
rendering technique, styling approach, state mechanism), ask whether the app already
solves it. Search before judging:

| Introduced                         | Look in                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------- |
| UI piece (button, chip, table, chart, empty state, skeleton) | `packages/design-system`, `src/components/designSystem`, sibling features |
| Rendering technique (raw SVG, canvas, custom layout) | `package.json` dependencies, then their current usages in `src/`          |
| Hook or util                       | `src/hooks`, `src/core`, `src/components/**/utils`                        |
| Formatting (dates, money, numbers) | `src/core/formats`, `src/core/timezone`, existing callers                 |
| Data fetching, cache, refetch      | `src/core/apolloClient` (links, `queryFieldPolicies`), sibling queries    |
| Error, toast, navigation, permissions | the Apollo error link, the toast layer, `~/core/router`, permission hooks |
| New dependency                     | `package.json`: is there already one that covers the need?               |

**Shared files.** For every existing file the diff modifies outside the feature's own folder
(the design system, `src/components/Filters`, `src/hooks`, `src/core`, layouts), list its
callers on main (`git grep -lwF -e '<export>' origin/main -- src`), name what each one relies on, and
say whether the diff changes it: a new required prop, a changed default or value format, a
component swapped for another, an effect that now runs at different times. A caller whose
behaviour changes without the PR saying so is a finding. Report a shared file checked with no
change for its callers in one line, so the reader sees it was looked at.

Then look at the two or three features closest to this one (same section of the app,
same kind of screen). If the PR solves the same problem a different way, that is a
finding, unless the PR explains why.

A finding from this pass reads:

```
UsageGraph.tsx:12 draws the chart with raw SVG. The app already draws charts with
recharts, through the shared graphs in src/components/designSystem/graphs/, so this
one will not match the others in tooltips, theming or responsiveness. Build it on one
of those graphs (AreaChart, StackedBarChart, ...) instead.
```

When the miss came from a convention nobody wrote down, add a **Note**: the convention
belongs in `.agents/docs/` so that future coding sessions load it too. Do not write the
doc during the review.

## Pass C - Design challenge

Review the approach as a senior engineer would challenge a candidate in a system design
interview: with firm technical opinions, but only ones the code can back up.

Run this pass only when the diff carries a design decision: a new feature, new data
flow, new shared piece, or more than roughly 150 changed lines of non-test code. On a
small or mechanical diff, skip it and say so in the run output.

Questions, in order. Answer each from the code, and report only those that turn into a
concrete problem:

1. **Layer.** Is the logic in the right place: component, hook, cache policy, shared
   module, or the backend? Is a computation done in the browser that the API already
   returns, or should return?
2. **Alternatives.** Name the two most plausible other designs. Does the chosen one win,
   and does the PR say why? A design that loses to an obvious alternative is a finding.
3. **Data flow and cache.** What is fetched, when, and how often? Does a mutation update
   or evict the right cache entries? Does a selection without `id` on a normalised type
   clobber a cached reference? Does anything refetch on every render or every keystroke?
4. **States.** Loading, error, empty, no permission, feature flag off, organisation
   switch. Which ones does the UI handle, and which render something wrong as fact?
5. **Volume.** What happens with real data sizes: hundreds of rows, long names, many
   currencies, a slow network?
6. **Change cost.** If the product asks for the obvious next iteration, does this design
   absorb it, or does it need a rewrite? Do not invent requirements; use the ticket and
   the surrounding features to judge what "obvious" is.

A finding from this pass reads:

```
The plan list filters invoices in the browser after loading all of them
(usePlanInvoices.ts:31). With a few hundred invoices this loads every page before
showing anything. Pass the filter to the invoices query, which already accepts it
(src/generated/graphql.tsx: InvoicesQueryVariables.status).
```

## Output contract

Both passes return a list. Each item carries:

- `priority`: P0 (breaks behaviour or clearly contradicts how the app works), P1–P2
  (works, but diverges from the app or will hurt soon), or P3 (bounded optional
  improvement, or a note). babysit's triage maps it to a bucket; a problem outside this
  PR becomes a follow-up whatever its priority.
- `where`: `file:line` in the diff.
- `evidence`: the `file:line` of the existing solution, or the failure scenario.
- `finding`: the plain-language text, as in the examples above.
- `recommendation`: the single thing to do.

Also return the flows/consumers inspected and material verification gaps, so an empty
finding list cannot be mistaken for untested flows having passed.

Empty is a valid answer. A pass that finds nothing says so in one line.
