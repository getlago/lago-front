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

Extract any logic above, when it starts to be complex.

```tsx
// ❌ Bad
return (
  <div>
    {score > 80 ? "High" : score > 50 ? "Medium" : "Low"}
  </div>
);

// ✅ Good
let label;
if (score > 80) {
  label = "High";
} else if (score > 50) {
  label = "Medium";
} else {
  label = "Low";
}

return (
  <div>
    {label}
  </div>
);
```
