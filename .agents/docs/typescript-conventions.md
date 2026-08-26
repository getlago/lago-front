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
