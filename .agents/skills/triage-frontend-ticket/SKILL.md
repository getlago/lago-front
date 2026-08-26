---
name: triage-frontend-ticket
description: 'Use when given a Linear ticket (URL or ID) for lago-front and the technical groundwork is missing — a defect report whose validity is unknown, or a change request nobody has costed against the code. Typically a Front-end ticket in Triage/Backlog/Scoping. Triggers on "/triage-frontend-ticket <ticket>", "triage this ticket", "fai analisi tecnica di questo ticket", "is this actually a bug?", "is this feasible?".'
---

# Triage frontend ticket

**Input:** one Linear ticket URL or identifier (e.g. `ABC-123`). If none was given, ask with AskUserQuestion and stop until given.

**Repo:** the lago-front checkout (`front/` in the lago monorepo). If the session is not in lago-front, STOP — this skill reasons about this codebase only.

**Output:** one comment posted on the ticket, and — only for a ticket sitting in `Triage`
that the analysis actually resolved — a move to `Backlog`. Nothing else on Linear is touched.

**Who reads that comment:** whoever picks the ticket up next — a human deciding whether to
schedule it, a developer opening the editor, or an agent implementing it. Assume none of
them will redo the analysis. So the comment is a **handoff document**: everything needed to
start work is in it, in a form that reads as well to a person as it parses to an agent.
That is what step 6's **Implementation handoff** block is for.

This skill is deliberately pipeline-agnostic. It ends at the posted comment and makes no
assumption about how the work gets done afterwards — by hand, by an agent, or by an
automated pipeline. If your team uses one that reads ticket comments (`/loop-run` does,
through `loop-spec`), the handoff block is already in the shape it needs; if not, it is
simply a well-specified ticket.

**Read `LEARNINGS.md`** (alongside this file) before you judge anything. It holds rules learned
from real outcomes and overrides the defaults here where they conflict — within the limits stated
in that file: a learning may tune judgement, never soften a guardrail.

Create a todo per numbered step below before starting.

## 1. Fetch, gate, classify

Extract the issue id (`[A-Z]+-\d+`), then reset the review budget so a re-triage starts clean:

```bash
front/scripts/iter-budget.sh <ISSUE-ID> reset triage-review
front/scripts/analysis-depth.sh <ISSUE-ID> reset
```

Fetch via Linear MCP `get_issue` (with `includeRelations`) **and** `list_comments` — repro steps, scope changes and decisions often live only in comments, and a Slack attachment subtitle often holds the original report.

Check every gate in order. Exactly one of them posts anything; the rest stop silently. Do not
improvise a third outcome.

- **Not analyzable** → post the *Needs info* comment (step 6) **with the footer** (step 8), then
  stop: no independent review (there is no finding to re-derive) and no status move (the ticket
  is still waiting on the reporter).
- **Every other failure** → STOP, report to the operator, post nothing.

| Gate | Check | On failure |
| --- | --- | --- |
| **Already triaged** | Any comment body contains `<!-- triage-frontend-ticket:` **or** opens with a `## Technical analysis` heading (a hand-written or pre-footer analysis counts) | Footer present → recompute **both** fingerprints (step 8). Both unchanged → STOP, report "already triaged, nothing new". Either changed → re-triage, and open the comment by saying which one moved. Footer absent → STOP and report that a human analysis already exists. |
| **Not already in flight** | The status is a pre-dev state (`Triage`, `Backlog`, `Next to scope`, `Ready for dev`) and the ticket carries no `claude-*` label and no linked PR | Started, completed or cancelled (`Dev in progress`, `In Review`, `Under QA`, `Done`, …) → STOP: somebody or something is already on it, and an analysis arriving now is noise on work in progress. `Scoping` → STOP, a human is actively scoping it. A `claude-*` label or an attached PR → STOP, the org pipeline already picked it up. |
| **Frontend** | The responsible logic actually lives in `lago-front`. **Do not decide this from the `Front-end` label** — whoever files a ticket often cannot tell which layer owns the behaviour, and a UI symptom is regularly an API bug. Check the described behaviour against the code before accepting it | Logic lives in the API → STOP, say so, and name what you found so the ticket can be re-routed. Genuinely split across both → STOP and ask the operator which half to scope. |
| **Analyzable** | Enough to locate the code: a named surface plus either a symptom (defect) or a desired outcome (change request) | Too vague → post the *Needs info* variant (step 6), then stop. Never guess a repro or invent requirements. |
| **Not a duplicate** | Search open tickets for the same problem — same Sentry issue, same error, same surface plus same symptom, or shared distinctive identifiers. Use Linear `list_issues` with a `query`, restricted to open states | Clearly the same problem → STOP, report `possible duplicate of <ID>`, post nothing. Two analyses of one bug is worse than none, and merging them is a human call. Superficial keyword overlap is not a duplicate — confirm it is genuinely the same problem before stopping. |

Then **classify the ticket**, because it decides what the analysis has to prove:

| Type | Signals | The question to answer |
| --- | --- | --- |
| **Defect** | `Bug` label; "wrong", "broken", "shows X instead of Y"; a repro | Is the reported behavior real, and why does it happen? |
| **Change request** | `Improvement` / `Feature` label; "should also", "add", "allow", "rename", "instead of" | What exists today, what has to change, and what stands in the way? |

Mixed ticket ("it's wrong, and while we're there make it configurable") → treat the defect as primary, and cover the request under *Scope beyond the defect*. When the label and the wording disagree, the wording wins; say which you picked.

### Is there anything to analyse at all?

Some tickets already name what to change and where — "change this wording to that". An analysis
would only restate them. Record that and stop:

```bash
front/scripts/analysis-depth.sh <ISSUE-ID> set skip
```

Post a one-line comment saying it is already actionable, or nothing at all, and finish.

Everything else gets the analysis. **How deep it goes is not decided here** — you cannot know
what a change touches before reading the code. That call comes at step 5, once you do.

## 2. Ground it in the project's own rules, then read the code

The repo documents itself, and skipping that is how an analysis ends up correct about the
symptom and wrong about the fix.

### 2a. Check the symptom against known regression classes

`CLAUDE.md` is not only style — it records defect classes together with the symptom they
produce. The table below turns a reported symptom into **the first place to look**. Nothing
in it is a conclusion: a row that matches is a hypothesis, and the analysis stands or falls
on confirming it at the actual call site.

| Reported symptom | Documented cause |
| --- | --- |
| A list loads page 1 then stops; page 2 is empty | Field not registered in `queryFieldPolicies` with `createSinglePageFieldPolicy()` |
| Another org's data, logo flashing the wrong org, a webhook URL baking the wrong UUID, a value from another tab | A feature component reading `currentOrganizationVar` instead of `useParams` + memberships — `CLAUDE.md` names this a known bug pattern |
| Route matching never fires | `useMatch` from `react-router-dom` — the raw pathname includes the slug. Use `matchPath` + `strippedPathname` |
| The "X-Y of N" label disagrees with the rows | `PaginatedContent` `pageSize` ≠ the query `limit` |
| A previously-viewed page flashes when re-entering a customer tab | List query missing `fetchPolicy: 'network-only'` |
| The pager is missing entirely | `metadata` not passed to `PaginatedContent`, so `totalCount` is 0 |

How to use a match: **open the call site and check whether the documented cause is actually
present there.** Confirmed → cite the rule and take the prescribed fix rather than inventing
one. Not present → the row was a wrong guess; drop it and keep reading the code. The symptom
in a report is a description of what someone saw, and several causes produce the same
description.

A row that matches never enters the comment as the cause on its own. It has to survive step
3 like any other claim: the evidence is what makes it a finding, and "the symptom matches a
documented pattern" is not evidence.

No match means nothing at all — most defects are not in this table.

### 2b. Read what binds this area

- **`CLAUDE.md` at the root** — always. It is prescriptive, not advisory.
- **The on-demand docs** in `.agents/docs/` for the area involved: `folder-architecture`,
  `graphql-fragments`, `testing-practices`, `documentation`. (`typescript-conventions` is
  already loaded in every session.)
- **The nearest-neighbour code.** The closest existing feature doing the same thing is the
  pattern of record. Read it before proposing a shape.

Two things this changes about the *fix*, not just the analysis:

- **The fix must be the sanctioned pattern, not merely a working one.** A new drawer is the
  `use<Feature>Drawer` hook, never a `forwardRef` + `DrawerRef`; a dialog is one of the three
  hooks; a new translation key comes from `pnpm translations:add`, never hand-written.
- **A legacy pattern next door is not permission to copy it.** `CLAUDE.md` says this outright
  about drawers, and it holds generally: three generations coexist and only one is allowed in
  new code. Cite the reference site the docs name, so whoever implements it copies from the
  right place.

For a **change request**, conventions are part of the answer, not a footnote: a request that
fights a documented convention is a *caveat* at minimum, and sometimes the reason the honest
verdict is *feasible with caveats* rather than *feasible as asked*.

### 2c. Then follow the chain

**Generated files are read with a scalpel.** `src/generated/graphql.tsx` holds single lines
tens of thousands of characters long — one permissions blob repeated per operation. A bare grep
for a common word there returns those whole lines and burns a large share of the run's budget
for nothing. Match the shape you want and print only that:

```bash
# the argument list of one query, not every line mentioning it
grep -n "QueryMembershipsArgs" -A 6 src/generated/graphql.tsx

# a field's declared type, without the surrounding blob
grep -o "issuingDate[A-Za-z]*?*: [A-Za-z'\[\]]*" src/generated/graphql.tsx | sort -u
```

The same applies to lockfiles, snapshots and translation bundles.

Read the actual code. Grep for the feature, the filter key, the component, the translation key — whatever the ticket names — and follow the chain end to end. Name real symbols and `file.ts:line` paths.

**For a defect,** the two ends are usually in different files and the bug is the disagreement between them:

- where the value is **produced or stored** (form handler, URL param writer, serializer, GraphQL variable builder)
- where it is **displayed** (formatter, label builder, cell renderer)

A default argument on the display side (fallback timezone, locale, currency, empty state) is the single most common root cause: producer and consumer each look correct in isolation.

**For a change request,** map instead:

- the **current** behavior, precisely — this is the baseline the request is measured against, and reporters are often wrong about it
- every **call site** that would have to change, not just the one the ticket names
- what **constrains** the change: GraphQL schema (does the API already return this field?), design-system components available, `CLAUDE.md` conventions that dictate the shape, translations, migrations
- whether it is **already possible** by another route — some requests are answered by pointing at an existing feature

An analysis that describes behavior without citing code is not done.

## 3. Ground it in something re-runnable

**A conclusion with no evidence beyond prose is not a conclusion.** Produce at least one artifact a reader can re-run or point at:

- a `node -e` one-liner through the real library (luxon, intl, currency helpers) showing input → actual vs expected
- an existing test whose expectations reveal the assumption (quote path + line)
- a scoped `pnpm test <path>` run — never the full suite
- for a change request: the GraphQL schema field (or its absence) in `src/generated/graphql.tsx`, the existing component that already does the thing, the full grep of call sites to be touched
- for visual/layout claims, the concrete DOM/class/style that produces it

Build the input from what the code *actually stores*, not from the ticket's screenshot. Reconstruct that value from step 2 first.

## 4. Verdict

**A ticket reporting several symptoms gets a verdict per symptom.** They routinely have
different causes and different answers — one fixable today, another blocked on an API change.
Collapsing them blocks work that could ship, or promises work that cannot. Decompose the report
into its separate claims and judge each on its own; a combined "partly X, partly Y" headline is
fine, the body has to keep them apart.

**Defect** — pick one:

- **confirmed** — real, with the mechanism
- **not a bug** — plus the reason the reporter saw what they saw (a stale cache, a different org setting, correct-but-confusing UX)
- **cannot determine** — plus what is missing

**Change request** — pick one:

- **feasible as asked** — the change is contained; say what it touches
- **feasible with caveats** — name each caveat: a schema change needed API-side, a convention that forces a different shape, a migration, a design decision left open
- **blocked** — name the specific blocker and who unblocks it (API field missing, product decision, dependency)

## 5. Blast radius / scope

Whatever mechanism is involved, grep for every other call site sharing it. Split into affected and unaffected, and say why each unaffected one is safe.

**When the mechanism is a shared key or identifier** — a URL param, a localStorage key, a constant, a cache key, an enum value — enumerate **both directions**: every **consumer** that reads it, and every **producer** that writes it, deep links built in unrelated pages included. Grep the exported constant, then the bare literal too in case somewhere hardcodes it.

Changing the shape of a shared value while missing one producer is a silent break: the writer keeps emitting the old shape, the reader matches nothing, and no test fails because the two live in different files. A fix list that changes a key's format without naming every writer is incomplete.

This is where triage earns its keep — the reporter sees one surface, the code usually has more. Report affected siblings even when out of the ticket's scope. For a change request the same sweep answers "where else does this have to change to stay consistent", which is usually the real cost of the ticket.

### Now price the review

You know what the change touches, so this is the moment to decide whether it needs an
independent review. That review is the expensive part of this skill: spend it where being wrong
would go unnoticed, not on everything.

```bash
front/scripts/analysis-depth.sh <ISSUE-ID> set <shallow|full>
```

**`full` — the review runs.** Any one of:

- the fix reaches more than one **area** of the code
- a **shared key or identifier**, or a **derived value**
- pagination, cache, timezone or currency **semantics**
- the failure mode is **silent** — a wrong number, a filter matching nothing, a link that quietly
  stops working

**`shallow` — the review is skipped.** The change is contained to one area, nobody else reads or
writes the value, and being wrong is obvious to whoever opens the page. `CLAUDE.md` and the
conventions are check enough at this size.

**Do not count files.** A source file and its test are one unit of work, not two — counting them
would put everything in `full` and make `shallow` unreachable, which is not the intent. Count
areas: a component plus its own test is one; a component, a hook and a cache policy is three.

**The test is the failure mode, not the size of the diff.** One line changing how an amount is
formatted is `full` — trivial diff, invisible when wrong, and the review is what catches it. A
twenty-line layout rewrite can be `shallow` — wrong is obvious at a glance.

Uncertain between the two → `full`.

**Escalation is one-way and enforced.** `analysis-depth.sh` refuses to move back down: `shallow`
is the tier that skips the review, and the moment to be tempted into skipping it is exactly when
the work turns out bigger than hoped. If anything surfaces while drafting — a second area to
touch, a value read somewhere else, a way to be wrong unnoticed — escalate and take the review.

## 6. Draft the comment

Markdown, **English**, these sections in order. Omit a section only when it would be empty.

**Defect:**

```markdown
## Technical analysis — <confirmed bug | not a bug | cannot determine>

### Root cause
<the disagreement, stated once. Files, symbols, line refs.>

### Evidence
<the step-3 artifact. Table of input → current output → expected, or the quoted test/code.>

### Blast radius
- ❌ <affected surface> — <why>
- ✅ <unaffected surface> — <why it is safe>

### Proposed fix
<numbered, per file, with the actual snippet. Explain why the edge cases hold.>

### Rejected alternatives
<the approach a reader would reach for first, and the specific way it fails.>

### Implementation handoff
<the block specified below.>

### Open questions
<only genuine blockers for a human, each marked (blocking) or (non-blocking). Omit if none.>
```

**Change request:**

```markdown
## Technical analysis — <feasible as asked | feasible with caveats | blocked>

### Current behavior
<what the code does today, with file:line. Correct the ticket if it assumes otherwise.>

### What has to change
<numbered, per file, what changes there and why. Include the actual snippet where it clarifies.>

### Constraints
<schema gaps, conventions that force a shape, translations, migrations. "None" is a valid answer — say it.>

### Scope
- <every call site that must change to stay consistent>
- <what is deliberately left out>

### Rejected alternatives
<the approach a reader would reach for first, and the specific way it fails.>

### Implementation handoff
<the block specified below.>

### Open questions
<product/design decisions this cannot settle, each marked (blocking) or (non-blocking). Omit if none.>
```

### The Implementation handoff block

Both templates end with this block. It is the part someone acts on, so it states one
chosen approach in directly actionable form — exact paths, exact symbols, runnable
commands. It is written to serve either reader: a developer can work straight through it,
and an agent can parse it without inference.

(It also happens to map 1:1 onto the `spec.md` that `/loop-run`'s spec phase writes, so
that pipeline consumes it as-is. Nothing here depends on using it.)

```markdown
### Implementation handoff

**Approach:** <one sentence: the single chosen approach. Not a menu.>

**Precedent:** <one of — `<path>` plus the spec covering it, when the fix transplants an
existing, test-covered pattern · `no precedent — designed`, when the shape is new here. State
which; a reader cannot tell a copied pattern from an invented one by looking at the snippet, and
it is the difference between low-risk and needs-a-second-opinion.>

**Files to touch** (paths relative to `front/`):
- `src/path/to/file.ts` — <what changes here, naming the exact symbol>
- `src/path/to/other.test.ts` — <the cases to add>

**Acceptance criteria:**
1. <testable statement: given <input>, <surface> shows <exact expected value>>
2. <...>

**Non-goals:**
- <what a reasonable implementer might touch and must not>

**Verification:**
- `pnpm lint`
- `pnpm types`
- `pnpm translations:inspect` · `pnpm translations:ensure-consistency`
- `pnpm test src/<scoped path>` <only the touched domain, never the full suite>
- `pnpm codegen` <only if a GraphQL document changed — then the diff must be clean>

**Conventions that apply:** <the `CLAUDE.md` rules this change is subject to — new
translation keys via `pnpm translations:add <n>` and never hand-written, pagination
field policy registration, slug-aware router imports, direct MUI imports, and so on.
Cite only the ones that actually bind here; "none beyond the defaults" is valid.>
```

Rules for the block, in order of how often they are what goes wrong:

1. **One approach, no menu.** Alternatives belong in *Rejected alternatives*. An agent handed two options picks arbitrarily.
2. **Every path exact and complete** — relative to `front/`, no globs, no "and related files", no "etc.". If the sweep in step 5 found six call sites, all six are listed.
3. **Snippets apply as written.** No `...` inside lines that change. The surrounding context must be enough to locate the edit unambiguously.
4. **Acceptance criteria are assertions, not intentions,** and assertable *in this repo's test setup*. "The chip shows `8/20/2026` for a `+02:00` bound" — not "the chip shows the right date". Two traps: `translate` is mocked in jest, so a criterion phrased against user-facing copy ("the label reads Admin") cannot be asserted — phrase it against the translation key or an exported `data-test` constant. And every criterion needs a concrete expected value, so "restores the full list" has to name the rows or the count.
5. **Name the conventions.** `CLAUDE.md` is there for whoever implements this, but stating which rules bind *this* change prevents the classic misses (hand-written translation keys, missing cache field policy, barrel MUI imports) — an agent skips them, a developer new to the area does not know them.
6. **Unresolved decisions go to *Open questions*, marked (blocking).** Never leave a decision implicit inside the handoff for the implementer to guess. The one that hides most easily: a **derived value that can fail to resolve**. If the fix compares against something looked up at runtime — a code mapped to a name, an id mapped to a record — say what happens while the lookup is still loading and when it never resolves (a stale link, a deleted record). `list.includes(undefined)` is false for every row, which renders as a confidently empty screen rather than an error. Decide it in the handoff, or raise it as blocking.

### Verify the references mechanically, before posting

Two checks, both cheap, both over the **whole comment** and not just this block. Reference rot
is the failure that sends an implementer hunting, and it discredits the analysis around it.

**Every path resolves:**

```bash
# every path in "Files to touch"; a missing one is a defect in the analysis, not a typo to ignore
ls front/src/path/to/file.ts
```

A path that must be *created* by the change is fine — mark it `(new)` in the list so the check
is not mistaken for a miss.

**Every `file:line` still points at what you say it does.** Line references drift the moment
you read around a file, and a citation off by two lands on a closing brace or an `if`. Print
each one and confirm the symbol is there:

```bash
# for every file:line the comment cites, in every section
sed -n '41p' front/src/path/to/file.ts
```

Cite the line where the **value originates**, not where the enclosing block starts — that is
the line the implementer has to edit. If a claim spans a range, cite the range (`:66-76`). A
citation you did not print is a citation you did not verify.

Omit the whole block for *cannot determine* and *blocked* verdicts — there is nothing to hand off yet, and a speculative handoff is worse than none. For *not a bug*, omit it too unless a small clarifying change (a tooltip, a label) is genuinely warranted.

For **cannot determine** / **blocked**, replace the middle sections with *Needs info*: the exact missing facts as a checklist (org timezone, browser, exact steps, expected vs actual, the product decision owner), plus what was already ruled out.

Never propose closing the ticket, changing its state, assigning it, or editing code. Analysis only; the decision stays human.

## 7. Independent review — always at `full` depth

Read the latch first, and do what it says rather than what you remember choosing:

```bash
front/scripts/analysis-depth.sh <ISSUE-ID> get
```

`full` → review, no exceptions. `shallow` → skip this step and go to step 8; there is no
finding here whose cost of being wrong justifies the review. Anything else means the tier was
never recorded: go back to step 5 and record it.

**The cap is MECHANICAL, not a number you keep in your head.** `front/scripts/iter-budget.sh`
is a standalone repo utility — an attempt counter on disk, no pipeline attached — and it is
what refuses the round past the cap.

Before **every** review, the first one included, charge the budget:

```bash
front/scripts/iter-budget.sh <ISSUE-ID> triage-review
```

Exit 0 → run the review. **Exit 1 → the budget is spent: go straight to the exhausted path
below. Do not review again.** The `triage-review` counter is capped at 2, so the sequence is
at most: review → fix → review.

If the script is missing (a checkout that predates it), cap at 2 by hand and say so in the
report to the operator — never silently drop the cap.

Each review dispatches a **fresh subagent with codebase access** (Agent tool, `general-purpose`). Give it: the ticket text, the draft comment, the repo path. Do **not** give it your reasoning — it must re-derive. On the second review, also give it the previous review's defects and what you changed.

Instruct it to return, per claim: `CONFIRMED` / `REFUTED` / `UNVERIFIABLE`, with the file:line it checked, plus an overall `PASS` / `FAIL`, plus any missed call site. Tell it explicitly that agreeing without opening the cited files is the failure it must avoid.

It must also review the **Implementation handoff** block as its own deliverable, answering:

- Does every listed path exist (or is it marked `(new)`)?
- Is the sweep complete — any call site it found that the list misses?
- Is each acceptance criterion an assertion with a concrete expected value, testable as written?
- Could the block be read as offering more than one approach?
- Is any decision left implicit that the implementer would have to guess?
- Does the proposed fix follow the pattern `CLAUDE.md` and `.agents/docs/` prescribe for this
  area — rather than whatever the neighbouring code happens to do?

A `FAIL` on the handoff counts exactly like a `FAIL` on the analysis. An analysis that is
correct but hands off badly still produces a wrong implementation.

- **PASS** → proceed to step 8.
- **FAIL, budget left** → fix the specific defects, then charge and review again.
- **FAIL, budget exhausted** → post the analysis with this leading line, and do not attempt another review:

  `⚠️ Automated analysis — independent review could not confirm: <what>. Needs human verification.`

Never post a silently-failed review as clean, and never re-run a review the script refused.

## 8. Post

Post with Linear MCP `save_comment` (`issueId` = the identifier), no confirmation needed — the operator invoked this deliberately.

Close the comment with a provenance line, above the footer:

```markdown
---
Generated by `/triage-frontend-ticket` · independently reviewed
```

At `shallow` depth, drop `· independently reviewed` — it did not happen. State what the output
**is**; never tell a reader or another system what weight to give it. That is their rule to
write, not this skill's to impose.

Then append this footer as the last line, so the step-1 gate can recognise it:

```
<!-- triage-frontend-ticket: v1 · type=<defect|change-request> · desc-sha=<hash> · cmt-sha=<hash> -->
```

**Two fingerprints, because a ticket changes in two places.** Step 1 fetches the comments
precisely because scope changes, repro details and decisions land there and never make it back
into the description — so a description-only key reports "nothing new" on a ticket whose
comments have since redefined the work.

```bash
# what the ticket says
printf '%s' "$DESCRIPTION" | shasum -a 256 | cut -c1-12

# which comments exist, in order — ids only, so editing prose in a comment is not a re-triage
# trigger while a NEW comment is. Exclude comments carrying this skill's footer, otherwise
# posting immediately invalidates the fingerprint it just wrote.
printf '%s' "$COMMENT_IDS" | shasum -a 256 | cut -c1-12
```

With no qualifying comments, use `cmt-sha=none`.

Then report to the operator in chat: type, verdict, one-line reason, review outcome, comment URL, and whether the status moved (step 9). Short and plain — the analysis already lives on the ticket.

## 9. Promote out of Triage — only when earned

A ticket in `Triage` is waiting for someone to establish whether there is work here. A
resolved analysis answers that, so the ticket can move on to `Backlog` — where the team
prioritises it. Anything further (`Ready for dev`, an assignee, a cycle) is a scheduling
decision this skill does not make.

**Re-fetch the ticket immediately before moving it.** The analysis takes minutes, and a human
may have triaged it in the meantime; acting on the status captured at step 1 would overwrite
their decision. If the re-fetch no longer says `Triage`, leave it alone and report that
somebody moved it first.

Move it **only** when every one of these holds:

- the status **at re-fetch time** is exactly `Triage` — a ticket already in `Backlog`,
  `Scoping` or beyond is left alone
- the verdict is **confirmed bug**, **feasible as asked**, or **feasible with caveats**
- the independent review returned `PASS`
- the comment posted successfully

```
save_issue: { id: <ISSUE-ID>, status: "Backlog" }
```

Leave the ticket in `Triage` for every other outcome, and say why in the report:

| Outcome | Why it stays in Triage |
| --- | --- |
| **not a bug** | Someone has to decide whether to close it, and that is not a technical call |
| **cannot determine** / **blocked** | Still waiting on the missing facts the comment asked for |
| review exhausted its budget without `PASS` | The analysis is unconfirmed; promoting it would launder that |

A failed status update is a warning, never a failure of the run: the comment is the
deliverable and it is already posted. Report that the move did not go through and move on.

## Hard rules

- **On Linear, only the comment and the one `Triage` → `Backlog` move.** No assignee, no labels, no cycle, no closing, and never a status change from anywhere other than `Triage`.
  **Why the label ban is not arbitrary:** an `ai-augmented` or `claude-*` label, and the
  `Scoping` state, are entry gates for the org's existing automated pipeline — it skips any
  ticket carrying them. Applying one here would make the ticket permanently invisible to that
  pipeline, silently. `Backlog` is safe because it is a pre-dev state that pipeline accepts.
  Do not add a convenience label to mark analysed tickets; the footer already does that.
- **No code edits.** This skill analyses; implementing is a separate task — by hand or through whatever pipeline the team uses.
- **Never post twice on the same ticket state.** The footer gate is the mechanism; respect it.
- **Print every `file:line` you cite before posting.** An unverified citation is reference rot waiting to happen.
- **A matching symptom is where to look, never what to conclude.** The regression table in
  step 2a produces hypotheses; only the call site produces findings.
- **Never dress a guess as a finding.** No evidence → *cannot determine* or *blocked*, not a confident story.
- **Someone will edit code straight from the handoff block.** Exact paths, one approach, assertions not intentions. A vague handoff produces a wrong implementation, which is worse than no analysis.
- **Never accept the ticket's description of current behavior.** Verify it in the code — for change requests this is the most common error in the report.
- **The project's documented patterns outrank both the neighbouring code and your own instinct.** A fix that works but violates `CLAUDE.md` is a finding to reject, not to propose.
- **The review budget lives on disk, not in your memory.** Every review charges `iter-budget.sh`; a non-zero exit is final.
- Comment in English regardless of the language the operator is using.
