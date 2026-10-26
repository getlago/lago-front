import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'
import { TranslateFunc } from '~/hooks/core/useInternationalization'

export const FREE_TEXT_MAX_LENGTH = 255
export const ADDRESS_LINE_MAX_LENGTH = 500

// The API returns the errors keyed by the customer attribute, camelized
// (`shipping_address_line1` becomes `shippingAddressLine1`).
const MAX_LENGTH_BY_ERROR_KEY = {
  name: FREE_TEXT_MAX_LENGTH,
  firstname: FREE_TEXT_MAX_LENGTH,
  lastname: FREE_TEXT_MAX_LENGTH,
  legalName: FREE_TEXT_MAX_LENGTH,
  taxIdentificationNumber: FREE_TEXT_MAX_LENGTH,
  addressLine1: ADDRESS_LINE_MAX_LENGTH,
  addressLine2: ADDRESS_LINE_MAX_LENGTH,
  zipcode: FREE_TEXT_MAX_LENGTH,
  city: FREE_TEXT_MAX_LENGTH,
  state: FREE_TEXT_MAX_LENGTH,
  shippingAddressLine1: ADDRESS_LINE_MAX_LENGTH,
  shippingAddressLine2: ADDRESS_LINE_MAX_LENGTH,
  shippingZipcode: FREE_TEXT_MAX_LENGTH,
  shippingCity: FREE_TEXT_MAX_LENGTH,
  shippingState: FREE_TEXT_MAX_LENGTH,
}

export type CustomerFieldErrorKey = keyof typeof MAX_LENGTH_BY_ERROR_KEY

type CustomerFieldErrorCode = LagoApiError.InvalidCharacters | LagoApiError.ValueIsTooLong

type CustomerFieldErrorMap = Record<string, { message: string; path: string[] }>

const isCustomerFieldErrorKey = (key: string): key is CustomerFieldErrorKey =>
  Object.hasOwn(MAX_LENGTH_BY_ERROR_KEY, key)

const isCustomerFieldErrorCode = (code: unknown): code is CustomerFieldErrorCode =>
  code === LagoApiError.InvalidCharacters || code === LagoApiError.ValueIsTooLong

export const getCustomerFieldErrorMap = (
  errors: readonly GraphQLFormattedError[] | undefined,
  pathByErrorKey: Record<CustomerFieldErrorKey, string>,
  translate: TranslateFunc,
): CustomerFieldErrorMap => {
  const details = errors?.[0]?.extensions?.details

  if (!details || typeof details !== 'object') return {}

  return Object.fromEntries(
    Object.entries(details).flatMap(([key, codes]) => {
      if (!isCustomerFieldErrorKey(key) || !Array.isArray(codes)) return []

      const code = codes.find(isCustomerFieldErrorCode)

      if (!code) return []

      const path = pathByErrorKey[key]
      const message =
        code === LagoApiError.InvalidCharacters
          ? translate('text_1792577695510fp8vzeszoh7')
          : translate('text_1792577695510xy36tafb8l5', { max: MAX_LENGTH_BY_ERROR_KEY[key] })

      return [[path, { message, path: path.split('.') }]]
    }),
  )
}
