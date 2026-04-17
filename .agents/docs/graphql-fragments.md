## GraphQL Fragments & Type Safety

### ⚠️ CRITICAL: Code Generation After GraphQL Changes

**ALWAYS run code generation after modifying ANY GraphQL-related files:**

```bash
pnpm code-gen
```

**When to run code-gen:**
- After creating or modifying GraphQL fragments
- After creating or modifying GraphQL queries
- After creating or modifying GraphQL mutations
- After changing any `.graphql` files
- After modifying inline `gql` template literals

**This is MANDATORY** - GraphQL code generation updates TypeScript types and ensures type safety across the application. Never skip this step or you will cause type errors and runtime issues.

### Fragment Architecture Principles

GraphQL fragments should be organized in a hierarchical manner where each component defines its own data requirements and spreads them into parent fragments or queries.

#### Fragment Placement

- **Queries**: Define top-level queries in the page or container component that fetches data
- **Component Fragments**: Each component should define its own fragment for the data it consumes
- **Fragment Spreading**: Parent fragments should spread child fragments to ensure all data is fetched
- **Avoid Duplication**: Don't duplicate field selections - use fragment spreading instead

#### ⚠️ CRITICAL: Fragment Definition vs Fragment Spreading

**Always follow this rule for fragment organization:**

- **Define fragments WHERE the data is USED** (in the component that consumes the data)
- **Spread fragments WHERE the data is FETCHED** (in parent fragments or queries)

```tsx
// ❌ BAD - Redefining fields from another fragment instead of spreading
gql`
  fragment InvoiceForDetailsTable on Invoice {
    id
    status
    # BAD: Manually copying fields from InvoiceForFormatInvoiceItemMap
    invoiceSubscriptions {
      subscription { id }
      invoice { id }
      acceptNewChargeFees
    }
  }
`

// ✅ GOOD - Spreading the existing fragment
gql`
  fragment InvoiceForDetailsTable on Invoice {
    id
    status
    # GOOD: Spreading the fragment that defines these fields
    ...InvoiceForFormatInvoiceItemMap
  }

  ${InvoiceForFormatInvoiceItemMapFragmentDoc}
`
```

**Why this matters:**
- Prevents duplication and inconsistency
- Single source of truth for each piece of data
- Changes to fragments automatically propagate to all spreads
- Easier to maintain and refactor
- TypeScript types stay in sync automatically

```tsx
// ❌ Bad - Child component data duplicated in parent
gql`
  fragment ParentFragment on Invoice {
    id
    status
    totalAmountCents
    # Duplicating what child needs
    fees {
      id
      amountCents
      itemName
    }
  }
`

// ✅ Good - Child fragment spread into parent
gql`
  fragment FeeForInvoiceItem on Fee {
    id
    amountCents
    itemName
  }

  fragment ParentFragment on Invoice {
    id
    status
    totalAmountCents
    fees {
      ...FeeForInvoiceItem
    }
  }

  ${FeeForInvoiceItemFragmentDoc}
`
```

### Type Safety with Fragments

#### Use Fragment Document Types

Always type component props using the generated fragment types. This ensures components only access fields that are actually fetched.

```tsx
// ❌ Bad - Using generic type
interface Props {
  fee: Fee
}

// ✅ Good - Using fragment-specific type
interface Props {
  fee: FeeForInvoiceItemFragment
}
```

#### Avoid Type Casting

Type casting (`as`, type assertions) should be avoided as much as possible. If you need to cast, it's a sign that your fragment definitions or type constraints need improvement.

```tsx
// ❌ Bad - Casting types
const fee = data.fee as TExtendedRemainingFee

// ✅ Good - Using proper fragment types
const fee: FeeForInvoiceItemFragment = data.fee
```

### Shared Utility Functions with Fragments

When creating utility functions that work with data from multiple fragments, use one of these approaches:

#### Approach 1: Generic with Type Constraints

For utilities that need many different fields, use TypeScript generics with constraints:

```tsx
type FeeWithMetrics<T extends { id: string; amountCents: number }> = T

function calculateFeeTotal<T extends { id: string; amountCents: number }>(
  fees: FeeWithMetrics<T>[]
): number {
  return fees.reduce((sum, fee) => sum + fee.amountCents, 0)
}

// Works with any fragment that has these fields
const total1 = calculateFeeTotal(feesFromFragmentA)
const total2 = calculateFeeTotal(feesFromFragmentB)
```

#### Approach 2: Pick Utility Type

For utilities that need only a few specific fields, use TypeScript's `Pick` utility:

```tsx
type FeeForCalculation = Pick<Fee, 'id' | 'amountCents' | 'currency'>

function calculateFeeTotal(fees: FeeForCalculation[]): number {
  return fees.reduce((sum, fee) => sum + fee.amountCents, 0)
}

// TypeScript ensures the fragments have required fields
const total = calculateFeeTotal(feesFromAnyFragment)
```

#### Approach 3: Intersection Types

For utilities that work with data from multiple sources:

```tsx
type FeeWithDetails = Pick<Fee, 'id' | 'amountCents'> & {
  metadata: {
    displayName: string
  }
}

function formatFee(fee: FeeWithDetails): string {
  return `${fee.metadata.displayName}: ${fee.amountCents}`
}
```

### Fragment Organization Example

Here's a complete example showing proper fragment organization:

```tsx
// Child component: InvoiceItem.tsx
import { gql } from '@apollo/client'
import { FeeForInvoiceItemFragment } from '~/generated/graphql'

gql`
  fragment FeeForInvoiceItem on Fee {
    id
    amountCents
    itemName
    currency
  }
`

interface InvoiceItemProps {
  fee: FeeForInvoiceItemFragment
}

export const InvoiceItem: FC<InvoiceItemProps> = ({ fee }) => {
  return <div>{fee.itemName}: {fee.amountCents}</div>
}

// Parent component: InvoiceList.tsx
import { gql } from '@apollo/client'
import { FeeForInvoiceItemFragmentDoc } from '~/generated/graphql'
import { InvoiceItem } from './InvoiceItem'

gql`
  fragment InvoiceForList on Invoice {
    id
    status
    totalAmountCents
    fees {
      ...FeeForInvoiceItem
    }
  }

  ${FeeForInvoiceItemFragmentDoc}
`

interface InvoiceListProps {
  invoice: InvoiceForListFragment
}

export const InvoiceList: FC<InvoiceListProps> = ({ invoice }) => {
  return (
    <div>
      {invoice.fees.map(fee => (
        <InvoiceItem key={fee.id} fee={fee} />
      ))}
    </div>
  )
}

// Top-level query: InvoicePage.tsx
import { gql, useQuery } from '@apollo/client'
import { InvoiceForListFragmentDoc } from '~/generated/graphql'
import { InvoiceList } from './InvoiceList'

const INVOICE_QUERY = gql`
  query GetInvoice($id: ID!) {
    invoice(id: $id) {
      ...InvoiceForList
    }
  }

  ${InvoiceForListFragmentDoc}
`

export const InvoicePage: FC = () => {
  const { data } = useQuery(INVOICE_QUERY)

  return <InvoiceList invoice={data.invoice} />
}
```

### Benefits of This Approach

1. **Type Safety**: Components can only access fields they've declared in their fragments
2. **Automatic Refactoring**: Changing a fragment automatically updates all TypeScript types
3. **Clear Dependencies**: Easy to see what data each component needs
4. **Optimized Queries**: Only fetch the data that's actually used
5. **Compile-Time Errors**: TypeScript catches missing fields before runtime
6. **Better IDE Support**: Autocomplete and type hints work correctly
7. **Easier Testing**: Mock data only needs to include fields from the fragment

### Common Pitfalls to Avoid

#### Pitfall 1: Querying Data Not Used by Components

```tsx
// ❌ Bad - Fetching unused data
gql`
  fragment InvoiceForDisplay on Invoice {
    id
    status
    allPossibleFieldsEvenIfNotUsed
    moreFieldsJustInCase
  }
`

// ✅ Good - Only fetch what's needed
gql`
  fragment InvoiceForDisplay on Invoice {
    id
    status
  }
`
```

#### Pitfall 2: Not Spreading Child Fragments

```tsx
// ❌ Bad - Manually listing child component's fields
gql`
  fragment ParentFragment on Invoice {
    fees {
      id
      itemName
      # What if child needs more fields?
    }
  }
`

// ✅ Good - Spreading child fragment
gql`
  fragment ParentFragment on Invoice {
    fees {
      ...FeeForInvoiceItem
    }
  }
  ${FeeForInvoiceItemFragmentDoc}
`
```

#### Pitfall 3: Using Wrong Fragment Type

```tsx
// ❌ Bad - Generic type doesn't match fragment
interface Props {
  fee: Fee  // Can access fields not in fragment!
}

// ✅ Good - Type matches fragment
interface Props {
  fee: FeeForInvoiceItemFragment
}
```
