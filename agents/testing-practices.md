## Testing Best Practices

### Using `data-test` Attributes with Constants

**WHEN POSSIBILE** use constants for `data-test` attributes instead of hardcoded strings or, even worse, using translation label keys from `translations/base.json`. This ensures consistency, maintainability, prevents typos in tests, and prevents test failures when labels change but the software logic remains unchanged.

**Pattern to Follow**:

1. **Export test ID constants from the component file**:
   - Define constants with the naming pattern: `{COMPONENT_NAME}_TEST_ID` or `{ELEMENT_DESCRIPTION}_TEST_ID`
   - Use kebab-case for the constant value (e.g., `'default-badge'`, `'overdue-invoices-alert'`)

2. **Use the constant in the component**:
   - Apply the constant to the `data-test` attribute: `data-test={CONSTANT_NAME}`

3. **Import and use the constant in tests**:
   - Import the constant from the component file
   - Use it with `getByTestId()` or `queryByTestId()` from Testing Library

4. **Never rely on translation copy, use exported const instead**

**Example**:

```tsx
// ❌ Bad - Hardcoded string in component
export const PaymentMethodDetailsCell = ({ item }: Props): JSX.Element => {
  return (
    <Chip data-test="default-badge" label="Default" />
  )
}

// ❌ Bad - Hardcoded string in test
import { PaymentMethodDetailsCell } from '../PaymentMethodDetailsCell'

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  const badge = screen.getByTestId('default-badge') // Hardcoded string
  expect(badge).toBeInTheDocument()
})

// ⚠️ Avoid - Using translation keys as test IDs (only if strictly necessary)
import { PaymentMethodDetailsCell } from '../PaymentMethodDetailsCell'

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  // Avoid using translation keys as test IDs - prefer constants instead
  // Only use this approach if strictly necessary and no better alternative exists
  const badge = screen.getByTestId('text_17440321235444hcxi31f8j6')
  expect(badge).toBeInTheDocument()
})

// ✅ Good - Constant exported from component
export const DEFAULT_BADGE_TEST_ID = 'default-badge'

export const PaymentMethodDetailsCell = ({ item }: Props): JSX.Element => {
  return (
    <Chip data-test={DEFAULT_BADGE_TEST_ID} label="Default" />
  )
}

// ✅ Good - Constant imported and used in test
import {
  DEFAULT_BADGE_TEST_ID,
  PaymentMethodDetailsCell,
} from '../PaymentMethodDetailsCell'

it('displays default badge', () => {
  render(<PaymentMethodDetailsCell item={paymentMethod} />)
  const badge = screen.getByTestId(DEFAULT_BADGE_TEST_ID)
  expect(badge).toBeInTheDocument()
})
```

**Why prefer constants**:

- **Hardcoded strings**: Prone to typos, difficult to refactor, no type safety
- **Translation keys**: Can change during refactoring, create coupling with i18n implementation, and cause test failures when labels change even if logic is unchanged
- **Note**: Translation keys can be used if strictly necessary (e.g., legacy code), but constants are preferred

**Benefits**:

- Type safety, easier refactoring, consistency, and semantic clarity

**Note**: The project is configured to use `data-test` as the test ID attribute (configured in `src/test-utils.tsx`), so always use `data-test` instead of `data-testid`.
