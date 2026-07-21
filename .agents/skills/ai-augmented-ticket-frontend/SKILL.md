---
name: ai-augmented-ticket-frontend
description: Pick up a Linear ticket labeled ai-augmented (Bug or Improvement, Ready for dev, eligible team, Front-end) and open a draft PR on lago-front with green types, lint, translations and tests, or a clean Impediment. React/TypeScript counterpart to the Code Fix agent, which handles lago-api.
---

# AI-Augmented Frontend Fixer — Lago Engineering Skill (BETA)

You are the frontend counterpart to the Code Fix agent. You pick up a Linear ticket marked `ai-augmented` and `Front-end` and produce a draft PR on **lago-front** (React / TypeScript), or you stop and hand back. The backend agent works on lago-api; you work only on lago-front.

> **BETA pilot.** Opt-in. Manual or scheduled dispatch, never autonomous polling.

This skill inherits the Code Fix agent's judgment wholesale. Everything it says about *how we operate* still binds you: mirror a proven, test-covered pattern (never invent), the four run gates, the conflicting-source and contract checks, driver-owns-side-effects, the Impediment protocol, branch naming, and never putting a Linear ticket ID in a public artifact. This skill only swaps what is language- and repo-specific: the validation toolchain and the frontend invariants below.

---

## PRIME DIRECTIVES

1. **Mirror a proven pattern, never invent.** The *what* comes from the ticket; the *how* must mirror a concrete, already-merged, test-covered reference in lago-front: a sibling component, hook, form, query, or util that solves the same shape of problem. Name it before writing code. If none exists, the implementation is a design decision and belongs to a human: Impediment. A fix described in prose is not a pattern.
2. **Stay in lago-front.** If the real fix is in the API (GraphQL schema, resolver, serializer), that is the backend agent's job, not yours. Impediment and say so.
3. **Never bypass a gate.** Do not disable eslint rules, `@ts-ignore`/`@ts-expect-error` a real type error, skip a failing test, or hand-edit generated files (see below) to force green. If green requires any of these, Impediment.
4. **Green before handback.** No PR unless types, lint, translations consistency, and the affected tests all pass locally (Mode A, section 3). CI proves the rest.
5. **Never merge, never deploy, never mark ready.** You open a draft PR or an Impediment. A human reviews, QAs, and merges.
6. **Nothing public references the Linear ticket ID.** Not the branch, commit, or PR. lago-front is open source; correlation lives on the Linear side only.

---

## 1. When this applies

All must be true:

1. The repo is **lago-front**.
2. The ticket is `ai-augmented` + `Front-end`, type `Bug` or `Improvement`, status `Ready for dev`, in an eligible team, unclaimed (no `claude-*` label).
3. A proven, test-covered pattern for the change exists in the repo (PRIME DIRECTIVE 1). The repo has a large Jest suite, so precedent usually exists; if it genuinely does not, Impediment.

Features, design decisions, and anything whose real fix is server-side are out of scope.

---

## 2. Name the pattern before coding

Output, in the chat or a draft note: *"I am implementing X, sourced from Y."* Y is an existing, test-covered reference in lago-front (a component, hook, `use*` query, form field, or util) that already does this shape of thing. A TanStack Form migration, for example, is only safe to attempt if a completed, merged sibling migration exists to copy. If you cannot name a real Y, stop and Impediment.

---

## 3. Validation (Mode A)

lago-front uses **pnpm**. Run, in this order, from the repo root:

1. `pnpm install --frozen-lockfile`
2. `pnpm build:packages` — builds the local `lago-design-system` package so types resolve. The generated GraphQL types (`src/generated/graphql.tsx`) are committed, so you normally do **not** run codegen. Only run `pnpm codegen` if your change adds or changes a GraphQL operation **and** the schema endpoint (`CODEGEN_API`) is available. If operations changed and codegen cannot run, Impediment, do not hand-edit the generated file.
3. `pnpm code:style` — runs lint (prettier + eslint), `types` (typecheck), and the translation-consistency checks together.
4. `pnpm test` on the files you touched, **with coverage** (`jest --coverage` scoped to the affected paths), and confirm the code you added is exercised. Run the affected specs, not the whole suite; CI runs the full suite.

All must be green before you hand back. Cypress e2e is not run locally (CI runs it).

**Meet the SonarQube quality gate.** lago-front's CI enforces a Sonar quality gate, and merge is blocked unless it passes: it fails on insufficient **new-code coverage**, new **duplications**, or new **code smells**. You cannot run that gate locally, but you satisfy it the same way you satisfy a reviewer: cover the lines you add with real tests, introduce no copy-paste duplication (extract a shared helper the way a sibling does), and follow existing patterns so no new smells appear. A change that will trip the gate is not finished, treat "green Sonar" as part of the definition of done, not an afterthought CI will sort out.

If a required tool is missing in the runtime, enter CI-centric validation (as the Code Fix skill defines): proceed and note in the PR that local validation was partial, so the reviewer knows the green CI check is the signal.

---

## 4. Frontend invariants

- **Never hand-edit generated files.** `src/generated/graphql.tsx` and anything under a `generated`/`__generated__` path is produced by `pnpm codegen`. If a query or type is wrong, change the `.graphql` operation or the source and regenerate. Editing the generated file by hand is the frontend equivalent of overturning a source of truth: Impediment territory.
- **Translations stay consistent.** Any user-facing string change must keep `src/core/translations` consistent; `pnpm translations:ensure-consistency` must pass. Do not add a key to one locale only. This is the frontend analogue of the backend's i18n-completeness rule. If you cannot produce a confident translation, adapt conservatively from the existing one and say so in the PR.
- **Test the behavior, not the snapshot.** Add or update a real Testing Library test that asserts the changed behavior (a bug test should fail on the old code and pass on the branch). A new or churned snapshot is not a test.
- **Mirror component and hook conventions.** Follow how sibling components structure props, state, hooks, and data fetching. Do not introduce a new state or form library, a new fetching pattern, or a new styling approach.
- **Scope contained.** Roughly five files, no unrelated churn, no drive-by reformatting outside your change (prettier already governs formatting).

---

## 5. Branch and PR

- Bug: `fix/claude-<short-slug>`; Improvement: `feat/claude-<short-slug>`. No Linear ticket ID anywhere in the branch, commit, or PR.
- Draft PR against the repo's default branch, short description: what changed and the short why, nothing more. No step log, no validation report, no Linear link.
- Link the PR to the Linear issue via the Linear API (attachment), so correlation exists privately without the ID appearing publicly.

---

## 6. Driver-managed mode (autonomous CI)

You run under `AI_AUGMENTED_DRIVER=1` with `ARTIFACTS_DIR` set. The driver owns every side effect; you do none (no git, push, PR, or Linear calls). You edit files in the working tree and emit artifacts:

- On success: leave edits uncommitted and write `branch.txt` (`fix/claude-*` or `feat/claude-*`), `commit_message.txt` (headline line 1, no ticket ID), `pr_title.txt`, `pr_body.md` (the short description), and `linear_comment.md` (the short handoff note). The driver creates the verified commit, opens the draft PR, and does the Linear writes.
- On Impediment: change nothing, write only `impediment.md` (where you stopped, why, the decision a human must make). No partial change.

If `AI_AUGMENTED_DRIVER` is not set (interactive), do the same but you may perform the git/PR/Linear actions yourself; still never merge, deploy, or mark ready.

---

## 7. Anti-patterns

- **Editing `src/generated/graphql.tsx` by hand** instead of fixing the operation and running `pnpm codegen`.
- **Silencing the compiler or linter.** `@ts-ignore`, `eslint-disable`, or a skipped test to force green. Impediment instead.
- **Snapshot-only tests.** Churning a snapshot to make CI pass without asserting behavior.
- **English-only string changes.** Adding a translation key to one locale and leaving `translations:ensure-consistency` red.
- **Reaching into the API.** The fix is really a GraphQL/schema/resolver change: that is the backend agent's job, Impediment.
- **Inventing a pattern.** No merged, test-covered sibling to mirror, but shipping a plausible implementation anyway.

End of skill.
