import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { LagoGQLError } from '~/core/apolloClient/errorUtils'

export interface BillingItemErrorConfig {
  /** Backend category segment(s), tolerant of snake/camel variants. */
  category: string[]
  /** Maps a backend snake_case field to the drawer form's camelCase field. */
  fieldMap: Record<string, string>
  /** When set, a field path becomes `${arrayField}[${index}].${camelField}`. */
  arrayField?: string
}

export interface MappedFieldError {
  path: string
  code: string
}

export interface MappedBillingItemErrors {
  fieldErrors: MappedFieldError[]
  unmapped: string[]
}

const extractGraphQLErrors = (
  errorObject?: ApolloError | readonly GraphQLFormattedError[],
): LagoGQLError[] => {
  if (!errorObject) return []

  return ((errorObject as ApolloError)?.graphQLErrors || errorObject || []) as LagoGQLError[]
}

// Resolve a single backend detail key (e.g.
// `billingItems.addOns.0.overrides.unitAmountCents`) to a drawer form field
// path, or `null` when it doesn't target a mappable field. The mappable field
// is always the last path segment; intermediate segments (the array index and
// the `overrides` wrapper the backend nests overridable fields under) are
// structural and skipped.
const resolveFieldPath = (rawKey: string, config: BillingItemErrorConfig): string | null => {
  const stripped = rawKey.replace(/^billing_?items\./i, '')
  const [categorySeg, ...rest] = stripped.split('.')

  const isCategory = config.category.some(
    (c) => c.toLowerCase() === (categorySeg ?? '').toLowerCase(),
  )

  if (!isCategory) return null

  const snakeField = rest.at(-1)

  // coarse key (category only, or category + bare index) — cannot target a field
  if (!snakeField || /^\d+$/.test(snakeField)) return null

  const camel = config.fieldMap[snakeField]

  if (!camel) return null

  // The index, when present, is the first segment after the category.
  const index = /^\d+$/.test(rest[0]) ? Number(rest[0]) : null

  return config.arrayField && index !== null ? `${config.arrayField}[${index}].${camel}` : camel
}

export const mapBillingItemErrors = (
  errorObject: ApolloError | readonly GraphQLFormattedError[] | undefined,
  config: BillingItemErrorConfig,
): MappedBillingItemErrors => {
  const result: MappedBillingItemErrors = { fieldErrors: [], unmapped: [] }
  const errors = extractGraphQLErrors(errorObject)
  const details = errors[0]?.extensions?.details

  if (!details) return result

  for (const [rawKey, codes] of Object.entries(details)) {
    const code = Array.isArray(codes) ? codes[0] : String(codes)
    const path = resolveFieldPath(rawKey, config)

    if (path) {
      result.fieldErrors.push({ path, code })
    } else {
      result.unmapped.push(rawKey)
    }
  }

  return result
}

export const ADDONS_ERROR_CONFIG: BillingItemErrorConfig = {
  category: ['addons', 'add_ons'],
  arrayField: 'addOnItems',
  // `totalAmountCents` has no dedicated input (it's derived from units ×
  // unitAmountCents), so its error is surfaced on the unit-amount field.
  fieldMap: {
    units: 'units',
    unitAmountCents: 'unitAmountCents',
    totalAmountCents: 'unitAmountCents',
  },
}

export const COUPONS_ERROR_CONFIG: BillingItemErrorConfig = {
  category: ['coupons'],
  fieldMap: {
    amountCents: 'amount',
    percentageRate: 'percentageRate',
    frequencyDuration: 'frequencyDuration',
  },
}

export const PLANS_ERROR_CONFIG: BillingItemErrorConfig = {
  category: ['plans'],
  fieldMap: {},
}
