import { ApolloError } from '@apollo/client'
import { GraphQLFormattedError } from 'graphql'

import { LagoGQLError } from '~/core/apolloClient/errorUtils'
import { LagoApiError } from '~/generated/graphql'

export const FREE_TEXT_MAX_LENGTH = 255
export const ADDRESS_LINE_MAX_LENGTH = 500

export type PortalCustomerFieldPath =
  | 'name'
  | 'firstname'
  | 'lastname'
  | 'legalName'
  | 'taxIdentificationNumber'
  | 'addressLine1'
  | 'addressLine2'
  | 'zipcode'
  | 'city'
  | 'state'
  | 'shippingAddress.addressLine1'
  | 'shippingAddress.addressLine2'
  | 'shippingAddress.zipcode'
  | 'shippingAddress.city'
  | 'shippingAddress.state'

// The API returns the errors keyed by the customer attribute, camelized
// (`shipping_address_line1` becomes `shippingAddressLine1`).
const FIELD_PATH_BY_ERROR_KEY: Record<string, PortalCustomerFieldPath> = {
  name: 'name',
  firstname: 'firstname',
  lastname: 'lastname',
  legalName: 'legalName',
  taxIdentificationNumber: 'taxIdentificationNumber',
  addressLine1: 'addressLine1',
  addressLine2: 'addressLine2',
  zipcode: 'zipcode',
  city: 'city',
  state: 'state',
  shippingAddressLine1: 'shippingAddress.addressLine1',
  shippingAddressLine2: 'shippingAddress.addressLine2',
  shippingZipcode: 'shippingAddress.zipcode',
  shippingCity: 'shippingAddress.city',
  shippingState: 'shippingAddress.state',
}

const HANDLED_ERROR_CODES: string[] = [LagoApiError.InvalidCharacters, LagoApiError.ValueIsTooLong]

const ADDRESS_LINE_PATHS: PortalCustomerFieldPath[] = [
  'addressLine1',
  'addressLine2',
  'shippingAddress.addressLine1',
  'shippingAddress.addressLine2',
]

export const getMaxLength = (path: PortalCustomerFieldPath) =>
  ADDRESS_LINE_PATHS.includes(path) ? ADDRESS_LINE_MAX_LENGTH : FREE_TEXT_MAX_LENGTH

export type PortalCustomerFieldError = {
  path: PortalCustomerFieldPath
  code: LagoApiError.InvalidCharacters | LagoApiError.ValueIsTooLong
}

export const mapPortalCustomerErrors = (
  errorObject?: ApolloError | readonly GraphQLFormattedError[],
): PortalCustomerFieldError[] => {
  if (!errorObject) return []

  const errors = ((errorObject as ApolloError)?.graphQLErrors ||
    errorObject ||
    []) as LagoGQLError[]

  const details = errors[0]?.extensions?.details

  if (!details) return []

  return Object.entries(details).flatMap(([key, codes]) => {
    const path = FIELD_PATH_BY_ERROR_KEY[key]
    const code = codes.find((value) => HANDLED_ERROR_CODES.includes(value))

    if (!path || !code) return []

    return [{ path, code: code as PortalCustomerFieldError['code'] }]
  })
}
