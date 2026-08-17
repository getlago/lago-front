/* eslint-disable import/order -- prettier's sort-imports groups node builtins with externals, conflicting with import/order's builtin-first grouping */
import fs from 'fs'
import { FieldNode, Kind, parse, SelectionSetNode } from 'graphql'
import path from 'path'

const GENERATED_GRAPHQL_PATH = path.resolve(__dirname, '../../../generated/graphql.tsx')

/**
 * Apollo normalizes an object only when the selection set contains `id`. A
 * selection WITHOUT `id` is stored inline, and that write REPLACES whatever the
 * cache held at that location — including a `{ __ref }` written by another
 * query. Every other query reading that field then diffs as incomplete and
 * refetches, which in this app cascades: `useOrganizationInfos` has
 * `notifyOnNetworkStatusChange: true` and `MainNavLayout` swaps `<Outlet />` for
 * a spinner while it loads, so the whole routed page unmounts, remounts and
 * re-fires its own queries. That was BIL-550 (the customer invoices view
 * visibly loading twice after submitting a payment request).
 *
 * The failure needs TWO writers of the same field disagreeing about `id`, so
 * that is exactly what this guard detects: a field selected WITH `id` in one
 * document and WITHOUT `id` in another. A field nobody ever selects with `id`
 * is simply never normalized — consistent, and not a clobber.
 */

type FieldName = string
type TypeName = string

// `Type.field` -> operations that select it without `id`
type Conflicts = Record<string, string[]>

/**
 * Pre-existing violations, each a latent instance of the same defect. This list
 * must only ever shrink.
 *
 * - Adding an entry means a NEW clobber was introduced: add `id` to the
 *   selection instead.
 * - Fixing one means removing its entry here (add `id`, run `pnpm codegen`).
 */
const KNOWN_UNSAFE_SELECTIONS: Conflicts = {
  'BillableMetric.filters': ['GetSingleBillableMetric'],
  'BillingEntity.billingConfiguration': ['UpdateBillingEntityInvoiceIssuingDatePolicy'],
  'Charge.appliedPricingUnit': [
    'CreateCharge',
    'GetPlanForDetailsV2',
    'GetSinglePlan',
    'GetSubscriptionForDetailsV2Plan',
    'GetSubscriptionForQuotePricing',
    'UpdateCharge',
    'UpdatePlan',
    'UpdateSubscriptionCharge',
  ],
  'Charge.filters': ['GetSinglePlan', 'GetSubscriptionForQuotePricing'],
  'CreditNote.customer': ['GetCreditNoteForDetailsExternalSync'],
  'Customer.billingConfiguration': [
    'GetOrderForEdit',
    'GetOrderForExecute',
    'GetOrderFormDetails',
    'GetOrderFormForSign',
    'GetOrderFormForVoid',
    'GetOrderForms',
    'GetOrders',
    'GetQuote',
    'GetQuotePreview',
    'UpdateCustomerIssuingDatePolicy',
  ],
  'FeatureObject.privileges': ['GetSubscriptionDataForEntitlementForm'],
  'FeatureObjectCollection.collection': ['GetSubscriptionDataForEntitlementForm'],
  'Invoice.payments': [
    'GetCustomerInvoices',
    'GetInvoicesList',
    'RetryInvoicePayment',
    'UpdateInvoicePaymentStatus',
    'VoidInvoice',
  ],
  'InvoiceCollection.collection': ['GetCustomerOverdueInvoicesReadyForPaymentProcessing'],
  'Quote.currentVersion': ['GetOrderFormForVoid'],
  'Subscription.usageThresholds': ['ResetSubscriptionProgressiveBilling'],
}

/**
 * The generated file is the only complete description of the schema available
 * to the test suite (codegen fetches the schema over the network, nothing is
 * checked in). Its emitted types are flat and regular, so `Customer` ->
 * { id -> null, billingConfiguration -> 'CustomerBillingConfiguration', ... }
 * can be recovered by reading them line by line.
 */
const buildSchemaFieldTypes = (source: string): Map<TypeName, Map<FieldName, TypeName>> => {
  const types = new Map<TypeName, Map<FieldName, TypeName>>()
  const typeBlock = /export type (\w+) = \{\n([\s\S]*?)\n\};/g

  let block = typeBlock.exec(source)

  while (block) {
    const [, typeName, body] = block
    const fields = new Map<FieldName, TypeName>()

    for (const line of body.split('\n')) {
      const field = /^ {2}(\w+)\??: (.+);$/.exec(line)

      if (field) {
        const [, fieldName, rawType] = field
        // `Maybe<Array<Invoice>>` -> `Invoice`, `Scalars['ID']['output']` -> ''
        const namedType = rawType
          .replace(/Maybe<|Array<|Scalars\['[^']+'\]\['[^']+'\]|>/g, '')
          .trim()

        fields.set(fieldName, namedType)
      }
    }

    if (fields.size) types.set(typeName, fields)

    block = typeBlock.exec(source)
  }

  return types
}

const buildDocuments = (source: string): Map<string, string> => {
  const documents = new Map<string, string>()
  const documentBlock = /export const (\w+) = gql`([\s\S]*?)`;/g

  let block = documentBlock.exec(source)

  while (block) {
    documents.set(block[1], block[2])
    block = documentBlock.exec(source)
  }

  return documents
}

// Codegen emits `${SomeFragmentDoc}` interpolations rather than inlining them.
const inlineFragments = (
  documents: Map<string, string>,
  name: string,
  seen: Set<string> = new Set(),
): string => {
  if (seen.has(name)) return ''

  seen.add(name)

  return (documents.get(name) ?? '').replace(/\$\{(\w+)\}/g, (_, dependency: string) =>
    inlineFragments(documents, dependency, seen),
  )
}

type MergedField = { name: FieldName; children: FieldNode[] }

const collectConflicts = (source: string): Conflicts => {
  const schema = buildSchemaFieldTypes(source)
  const documents = buildDocuments(source)
  const hasIdField = (typeName: TypeName): boolean => !!schema.get(typeName)?.has('id')

  const usage = new Map<string, { withId: Set<string>; withoutId: Set<string> }>()

  for (const documentName of documents.keys()) {
    if (!documentName.endsWith('Document')) continue

    const operationName = documentName.replace(/Document$/, '')

    let ast

    try {
      ast = parse(inlineFragments(documents, documentName))
    } catch {
      // A document that does not parse standalone cannot be analysed; the
      // codegen build already fails on genuinely invalid documents.
      continue
    }

    const fragments = new Map(
      ast.definitions
        .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
        .map((definition) => [definition.name.value, definition]),
    )

    const flatten = (selectionSet: SelectionSetNode): FieldNode[] =>
      selectionSet.selections.flatMap((selection) => {
        if (selection.kind === Kind.FIELD) return [selection]
        if (selection.kind === Kind.INLINE_FRAGMENT) return flatten(selection.selectionSet)

        const fragment = fragments.get(selection.name.value)

        return fragment ? flatten(fragment.selectionSet) : []
      })

    // GraphQL merges fields sharing a response key, so two fragments each
    // selecting `billingConfiguration` on the same parent produce ONE selection
    // set at write time. Merge before judging, or every split fragment reads as
    // a false positive.
    const mergeByResponseKey = (selectionSet: SelectionSetNode): MergedField[] => {
      const merged = new Map<string, MergedField>()

      for (const field of flatten(selectionSet)) {
        const responseKey = field.alias?.value ?? field.name.value
        const entry = merged.get(responseKey) ?? { name: field.name.value, children: [] }

        if (field.selectionSet) entry.children.push(...flatten(field.selectionSet))

        merged.set(responseKey, entry)
      }

      return [...merged.values()]
    }

    const walk = (selectionSet: SelectionSetNode, parentType: TypeName): void => {
      for (const field of mergeByResponseKey(selectionSet)) {
        if (!field.children.length) continue

        const fieldType = schema.get(parentType)?.get(field.name)

        if (!fieldType) continue

        if (hasIdField(fieldType)) {
          const key = `${parentType}.${field.name}`
          const entry = usage.get(key) ?? { withId: new Set(), withoutId: new Set() }

          const selectsId = field.children.some((child) => child.name.value === 'id')

          ;(selectsId ? entry.withId : entry.withoutId).add(operationName)
          usage.set(key, entry)
        }

        walk({ kind: Kind.SELECTION_SET, selections: field.children }, fieldType)
      }
    }

    for (const definition of ast.definitions) {
      if (definition.kind !== Kind.OPERATION_DEFINITION) continue

      walk(definition.selectionSet, definition.operation === 'query' ? 'Query' : 'Mutation')
    }
  }

  const conflicts: Conflicts = {}

  for (const [key, entry] of [...usage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (entry.withId.size && entry.withoutId.size) {
      conflicts[key] = [...entry.withoutId].sort()
    }
  }

  return conflicts
}

describe('GraphQL selections on normalized types', () => {
  const source = fs.readFileSync(GENERATED_GRAPHQL_PATH, 'utf8')
  const conflicts = collectConflicts(source)

  it('sanity-checks that the generated file could be analysed', () => {
    expect(buildSchemaFieldTypes(source).get('Customer')?.has('id')).toBe(true)
    expect(buildDocuments(source).size).toBeGreaterThan(100)
  })

  it('does not introduce a field selected both with and without `id`', () => {
    // A mismatch here means some document selects a normalizable type without
    // `id`, so its write replaces the cached `{ __ref }` with an inline object
    // and every other reader of that field refetches. Add `id` to the offending
    // selection and run `pnpm codegen`.
    expect(conflicts).toEqual(KNOWN_UNSAFE_SELECTIONS)
  })

  it('keeps the root fields behind BIL-550 normalized everywhere', () => {
    expect(conflicts['Query.organization']).toBeUndefined()
    expect(conflicts['Query.customer']).toBeUndefined()
    expect(conflicts['Query.subscription']).toBeUndefined()
  })
})
