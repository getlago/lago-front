import { GraphQLFormattedError } from 'graphql'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'

import { INVALID_ORIGIN_ERROR, REQUIRED_ERROR, TOO_MANY_ORIGINS_ERROR } from './validationSchema'

type X402FieldErrors = Record<string, { message: string; path: string[] }>

const SERVER_ERROR_MESSAGES: Record<string, string> = {
  value_already_exist: EXISTING_CODE_ERROR_MESSAGE,
  value_is_mandatory: REQUIRED_ERROR,
  mixed_environments: 'text_17931323948700tocwp025ch',
  value_is_invalid: 'text_17931323948708lpf06sycje',
  unsupported_network: 'text_17931323948708lpf06sycje',
  invalid_checksum: 'text_1793132394870wg65cygf7cw',
  not_in_cdp_project: 'text_1793132394870hge194n3901',
  rejected_by_cdp: 'text_1793132394870lonwnaqx0f7',
  invalid_credentials: 'text_17931323948709pxel9ln0pp',
  payment_method_required: 'text_1793132394870xsex5hshkgm',
  missing_account_read_permission: 'text_1793132394870fi9ve8fdayd',
  value_is_too_long: TOO_MANY_ORIGINS_ERROR,
}

const FIELD_INVALID_FORMAT_MESSAGES: Record<string, string> = {
  allowedOrigins: INVALID_ORIGIN_ERROR,
  evmPayoutAddress: 'text_179313239487010ooo8k2re1',
  svmPayoutAddress: 'text_179313239487010ooo8k2re1',
}

const SERVER_ERROR_FIELDS: Record<string, string> = {
  code: 'code',
  name: 'name',
  networks: 'networks',
  allowedOrigins: 'allowedOrigins',
  cdpApiKey: 'cdpApiKeySecret',
  cdpApiKeyId: 'cdpApiKeyId',
  cdpApiKeySecret: 'cdpApiKeySecret',
}

// Payout address errors come nested by address family, the others as a list of codes.
const PAYOUT_ADDRESS_FIELDS: Record<string, string> = {
  evm: 'evmPayoutAddress',
  svm: 'svmPayoutAddress',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toCodes = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((code): code is string => typeof code === 'string') : []

const messageFor = (field: string, codes: string[]): string | undefined => {
  const code = codes[0]

  if (code === 'invalid_format') return FIELD_INVALID_FORMAT_MESSAGES[field]

  return SERVER_ERROR_MESSAGES[code]
}

/** The field errors an x402 connection mutation returned, keyed by form field. */
export const getX402ServerFieldErrors = (
  errors?: readonly GraphQLFormattedError[],
): X402FieldErrors => {
  const details = errors?.[0]?.extensions?.details
  const fieldErrors: X402FieldErrors = {}
  const addError = (field: string, codes: string[]): void => {
    const message = messageFor(field, codes)

    if (message) fieldErrors[field] = { message, path: [field] }
  }

  if (!isRecord(details)) return fieldErrors

  Object.entries(details).forEach(([key, value]) => {
    if (key === 'payoutAddresses' && isRecord(value)) {
      Object.entries(PAYOUT_ADDRESS_FIELDS).forEach(([family, field]) => {
        addError(field, toCodes(value[family]))
      })
      return
    }

    const field = SERVER_ERROR_FIELDS[key]

    if (field) addError(field, toCodes(value))
  })

  return fieldErrors
}
