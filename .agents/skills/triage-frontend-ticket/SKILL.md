---
name: triage-frontend-ticket
description: 'Use when given a Linear ticket (URL or ID) for lago-front and the technical groundwork is missing — a defect report whose validity is unknown, or a change request nobody has costed against the code. Typically a Front-end ticket in Triage/Backlog/Scoping. Triggers on "/triage-frontend-ticket <ticket>", "triage this ticket", "fai analisi tecnica di questo ticket", "is this actually a bug?", "is this feasible?".'
---

# Triage frontend ticket

**Input:** one Linear ticket URL or identifier (e.g. `BIL-598`). If none was given, ask with AskUserQuestion and stop until given.

**Repo:** the lago-front checkout (`front/` in the lago monorepo). If the session is not in lago-front, STOP — this skill reasons about this codebase only.

**Output:** one comment posted on the ticket. Nothing else on Linear is touched.

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

Create a todo per numbered step below before starting.

## 1. Fetch, gate, classify

Extract the issue id (`[A-Z]+-\d+`), then reset the review budget so a re-triage starts clean:

```bash
front/scripts/iter-budget.sh <ISSUE-ID> reset triage-review
```

Fetch via Linear MCP `get_issue` (with `includeRelations`) **and** `list_comments` — repro steps, scope changes and decisions often live only in comments, and a Slack attachment subtitle often holds the original report.

Check the three gates in order. Each failure means STOP and report to the operator — do not post.

| Gate | Check | On failure |
| --- | --- | --- |
| **Already triaged** | Any comment body contains `<!-- triage-frontend-ticket:` **or** opens with a `## Technical analysis` heading (a hand-written or pre-footer analysis counts) | Footer present → compute the current description fingerprint (step 7); same fingerprint means STOP and report "already triaged, description unchanged", different means re-triage and say in the comment what changed. Footer absent → STOP and report that a human analysis already exists. |
| **Frontend** | Labels include `Front-end`, or the work is unambiguously UI/client-side | Not frontend → STOP and say so. Ambiguous → ask the operator. |
| **Analyzable** | Enough to locate the code: a named surface plus either a symptom (defect) or a desired outcome (change request) | Too vague → post the *Needs info* variant (step 6), then stop. Never guess a repro or invent requirements. |

Then **classify the ticket**, because it decides what the analysis has to prove:

| Type | Signals | The question to answer |
| --- | --- | --- |
| **Defect** | `Bug` label; "wrong", "broken", "shows X instead of Y"; a repro | Is the reported behavior real, and why does it happen? |
| **Change request** | `Improvement` / `Feature` label; "should also", "add", "allow", "rename", "instead of" | What exists today, what has to change, and what stands in the way? |

Mixed ticket ("it's wrong, and while we're there make it configurable") → treat the defect as primary, and cover the request under *Scope beyond the defect*. When the label and the wording disagree, the wording wins; say which you picked.

## 2. Find the real code path

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

This is where triage earns its keep — the reporter sees one surface, the code usually has more. Report affected siblings even when out of the ticket's scope. For a change request the same sweep answers "where else does this have to change to stay consistent", which is usually the real cost of the ticket.

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
4. **Acceptance criteria are assertions, not intentions.** "The chip shows `8/20/2026` for a `+02:00` bound" — not "the chip shows the right date".
5. **Name the conventions.** `CLAUDE.md` is there for whoever implements this, but stating which rules bind *this* change prevents the classic misses (hand-written translation keys, missing cache field policy, barrel MUI imports) — an agent skips them, a developer new to the area does not know them.
6. **Unresolved decisions go to *Open questions*, marked (blocking).** Never leave a decision implicit inside the handoff for the implementer to guess.

Before moving on, verify every listed path resolves — a handoff citing a file that does
not exist sends the implementing agent hunting:

```bash
# every path in "Files to touch"; a missing one is a defect in the analysis, not a typo to ignore
ls front/src/path/to/file.ts
```

A path that must be *created* by the change is fine — mark it `(new)` in the list so the
check is not mistaken for a miss.

Omit the whole block for *cannot determine* and *blocked* verdicts — there is nothing to hand off yet, and a speculative handoff is worse than none. For *not a bug*, omit it too unless a small clarifying change (a tooltip, a label) is genuinely warranted.

For **cannot determine** / **blocked**, replace the middle sections with *Needs info*: the exact missing facts as a checklist (org timezone, browser, exact steps, expected vs actual, the product decision owner), plus what was already ruled out.

Never propose closing the ticket, changing its state, assigning it, or editing code. Analysis only; the decision stays human.

## 7. Independent review — always

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

A `FAIL` on the handoff counts exactly like a `FAIL` on the analysis. An analysis that is
correct but hands off badly still produces a wrong implementation.

- **PASS** → proceed to step 8.
- **FAIL, budget left** → fix the specific defects, then charge and review again.
- **FAIL, budget exhausted** → post the analysis with this leading line, and do not attempt another review:

  `⚠️ Automated analysis — independent review could not confirm: <what>. Needs human verification.`

Never post a silently-failed review as clean, and never re-run a review the script refused.

## 8. Post

Post with Linear MCP `save_comment` (`issueId` = the identifier), no confirmation needed — the operator invoked this deliberately.

Append this footer as the last line, so the step-1 gate can recognise it:

```
<!-- triage-frontend-ticket: v1 · type=<defect|change-request> · desc-sha=<fingerprint> -->
```

Fingerprint = first 12 chars of the description's sha256:

```bash
printf '%s' "$DESCRIPTION" | shasum -a 256 | cut -c1-12
```

Then report to the operator in chat: type, verdict, one-line reason, review outcome, comment URL. Short and plain — the analysis already lives on the ticket.

## Hard rules

- **Read-only on Linear except the one comment.** No state change, no assignee, no labels, no closing.
- **No code edits.** This skill analyses; implementing is a separate task — by hand or through whatever pipeline the team uses.
- **Never post twice on the same ticket state.** The footer gate is the mechanism; respect it.
- **Never dress a guess as a finding.** No evidence → *cannot determine* or *blocked*, not a confident story.
- **Someone will edit code straight from the handoff block.** Exact paths, one approach, assertions not intentions. A vague handoff produces a wrong implementation, which is worse than no analysis.
- **Never accept the ticket's description of current behavior.** Verify it in the code — for change requests this is the most common error in the report.
- **The review budget lives on disk, not in your memory.** Every review charges `iter-budget.sh`; a non-zero exit is final.
- Comment in English regardless of the language the operator is using.
