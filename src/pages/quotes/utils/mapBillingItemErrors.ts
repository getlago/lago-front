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

// Resolve a single backend detail key (e.g. `billingItems.add_ons.0.unit_amount_cents`)
// to a drawer form field path, or `null` when it doesn't target a mappable field.
const resolveFieldPath = (rawKey: string, config: BillingItemErrorConfig): string | null => {
  const stripped = rawKey.replace(/^billing_?items\./i, '')
  const [categorySeg, ...rest] = stripped.split('.')

  const isCategory = config.category.some(
    (c) => c.toLowerCase() === (categorySeg ?? '').toLowerCase(),
  )

  if (!isCategory) return null

  const hasIndexedField = rest.length >= 2
  const hasFlatField = rest.length === 1 && !/^\d+$/.test(rest[0])

  // coarse key (category only, or category + bare index) — cannot target a field
  if (!hasIndexedField && !hasFlatField) return null

  const index = hasIndexedField ? Number(rest[0]) : null
  const snakeField = hasIndexedField ? rest[1] : rest[0]
  const camel = config.fieldMap[snakeField]

  if (!camel) return null

  return config.arrayField && index !== null && !Number.isNaN(index)
    ? `${config.arrayField}[${index}].${camel}`
    : camel
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
  fieldMap: { units: 'units', unit_amount_cents: 'unitAmountCents' },
}

export const COUPONS_ERROR_CONFIG: BillingItemErrorConfig = {
  category: ['coupons'],
  fieldMap: {
    amount_cents: 'amount',
    percentage_rate: 'percentageRate',
    frequency_duration: 'frequencyDuration',
  },
}

export const PLANS_ERROR_CONFIG: BillingItemErrorConfig = {
  category: ['plans'],
  fieldMap: {},
}
