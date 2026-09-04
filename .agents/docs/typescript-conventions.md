## TypeScript Conventions

### Discriminated Unions Rather Than Conditional Props

We prefer to have our props described with "discrimination" and prevent optional props overuse. Do it as much as possible as it helps understanding the logic of how props are used.

```tsx
// ❌ Bad - Optional props create ambiguity
type Props = {
  authenticated: boolean
  level?: 'basic' | 'admin'
}

// ✅ Good - Discriminated union makes the relationship clear
type Props =
  | { authenticated: true; level: 'basic' | 'admin' }
  | { authenticated: false };
```

### Explicit Function Return Types

Always write the return type of a function explicitly. This improves code readability, helps catch errors early, and makes the codebase more maintainable.

```tsx
// ❌ Bad - Implicit return type
const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Good - Explicit return type
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### No Nested Ternary

Prevent anything deeper than 2 levels.

```tsx
// ❌ Bad
const role = isAdmin ? (isManager ? "Manager" : "Admin") : "User";

// ✅ Good
function getRole(): string {
  if (!isAdmin) return "User"
  if (isManager) return "Manager"

  return "Admin"
}

const role = getRole()
```

### Prefer Early Returns

Makes the code way more readable.

```tsx
// ❌ Bad
function getStatus(user) {
  let status;
  if (user.isActive) {
    if (user.isAdmin) {
      status = "Admin";
    } else {
      status = "Active";
    }
  } else {
    status = "Inactive";
  }
  return status;
}

// ✅ Good
function getStatus(user) {
  if (!user.isActive) return "Inactive";
  if (user.isAdmin) return "Admin";
  return "Active";
}
```

### Prefer Logic Out of JSX

Extract non-trivial conditional rendering out of the JSX into a `renderX()`
helper declared above the `return`, using early returns. Apply this when a
ternary is nested (deeper than 1 level) or when a branch spans multiple JSX
lines. Leave a trivial single-line `cond ? a : b` inline, do not over-extract.

```tsx
// ❌ Bad - nested ternary inlined in JSX
return (
  <div>
    {score > 80 ? "High" : score > 50 ? "Medium" : "Low"}
  </div>
);

// ✅ Good - helper with early returns
const getLabel = () => {
  if (score > 80) return "High"
  if (score > 50) return "Medium"

  return "Low"
}

return <div>{getLabel()}</div>
```

The same applies when the branches return JSX, not just a value. A render
helper with an early return reads far better than a ternary nested inside a
prop:

```tsx
// ❌ Bad - multi-line JSX branches inlined in the render
return (
  <Line
    value={
      isEditable ? (
        <Editor value={value} onChange={onChange}>
          {value ? <Display /> : <AddButton />}
        </Editor>
      ) : (
        value || "-"
      )
    }
  />
)

// ✅ Good - render helper above the return, early return first
const renderValue = () => {
  if (!isEditable) return value || "-"

  return (
    <Editor value={value} onChange={onChange}>
      {value ? <Display /> : <AddButton />}
    </Editor>
  )
}

return <Line value={renderValue()} />
```

**When to extract.** When the render holds non-trivial logic (multi-branch
conditionals, `map` + `filter` chains, formatting, derived values), compute it
in a named variable or helper above the `return`, then use the result in the
JSX. This keeps the render shallow and readable instead of nesting logic deep
inside the markup.

Memoize the extracted value with `useMemo` (or a callback with `useCallback`)
**only when it makes sense**: the computation is genuinely expensive, or the
value feeds another hook's dependency array / a memoized child where a stable
reference matters. Do not wrap cheap derivations in `useMemo` by default.

**When NOT to extract.** Leave it inline when the logic is a single one-line
ternary or a cheap expression, or when pulling it out would not meaningfully
improve readability (a new variable/function for near-zero gain adds noise, not
clarity).

### Comments: Default to None

**The default is no comment.** Names, types and control flow carry the intent.
A comment is a last resort for the one thing the code genuinely cannot say, and
it costs review attention every time someone reads the file. Agents in
particular over-explain: err on the side of deleting.

**Cap every comment at 1-2 lines.** Needing more means the code needs a better
name or a smaller function, or that the knowledge belongs in the ticket, the
PR description or a doc, not next to the code.

Write one **only** for:

- **An external constraint the reader cannot see** - a backend validator, an API
  that rejects a field, a library quirk. Always name the identifier so it stays
  greppable.
- **Why not the obvious alternative** - the reader's first instinct is wrong and
  they would "fix" it back.
- **A trap that bites on edit** - renaming this breaks a string reference
  elsewhere, narrowing this fragment clobbers the cache.

Those three categories are rationalisable, so two tests decide the borderline
cases. **The commit-body test**: would you also write this sentence in the
commit or PR body? Then it belongs there - read once by a reviewer - not next
to code, re-read forever. **The iteration test**: a comment written while
addressing review feedback is an artifact of how the change was reached, not
knowledge about the code. The merged PR reads as one coherent change; the
objection that produced the line is invisible to whoever reads it next. Answer
the reviewer in the reply, and if the code needed the explanation, rename
something instead.

```tsx
// ❌ Bad - restates the code
// uppercase first letter
return label.charAt(0).toUpperCase() + label.slice(1)

// ❌ Bad - changelog; git already has it
// Previously `z.string().min(1)` on the object; kept here so it survives
// an `undefined` on any other field.

// ❌ Bad - justifies the diff; belongs in the commit body
// Explicit null, never omitted nor blank: the backend backfills the default on
// nil, and an empty string would defeat it.

// ❌ Bad - answers a reviewer, not a reader
// Same reason as the payment branch: on a provider switch the replacement
// inherits nothing from the connection it replaces.

// ❌ Bad - an essay where one line does
/**
 * A rate is editable at all only while the backend accepts a change: terminated
 * rates are frozen for audit, and on a card billed by subscriptions the live
 * pricing may only be appended to, so anything past `pending` is read-only there
 * (`RateCardRates::UpdateService`).
 */

// ✅ Good - the constraint, named, in one line
// `RateCardRates::UpdateService`: terminated is frozen, and on a card attached to
// subscriptions only a pending rate may still change.

// ✅ Good - why not the obvious alternative
// Not `form.reset`: that clears `isDirty` too, and the drawer would stop prompting.

// ✅ Good - a trap that bites on edit
// Renaming this operation breaks the drawer's `refetchQueries` and the delete
// dialog's eviction, which both reference it by name.
```

Never:

- **Restate the code.** If the comment paraphrases the line below, delete it.
- **Write changelog or history.** No "previously X", "used to be Y", "was moved
  from Z". That is what `git log` and the PR are for.
- **Document every prop or field** in a type. Comment the one or two whose name
  cannot carry the constraint, not the whole block.
- **Repeat the same comment in more than one file.** If a convention needs
  explaining in N places, it belongs in `CLAUDE.md` or `.agents/docs/`, and the
  code just follows it.
- **Justify a convention the surrounding code already demonstrates.** A banner
  explaining why the file does something the four sibling files also do is noise.
- **Reference a ticket id in code** (`// Wired up in BIL-594`). Ticket ids go
  stale; the PR description carries them.

**In tests**, the same rules apply, and the `GIVEN` / `WHEN` / `THEN` names
already carry the intent. Add a comment only to record the regression an
assertion guards - the bug it would catch - never to describe what it asserts.
