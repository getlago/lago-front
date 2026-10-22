import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

import {
  ADDRESS_LINE_MAX_LENGTH,
  FREE_TEXT_MAX_LENGTH,
  getMaxLength,
  mapPortalCustomerErrors,
} from '../mapPortalCustomerErrors'

const buildErrors = (details: Record<string, string[]>): GraphQLFormattedError[] => [
  {
    message: 'Unprocessable Entity',
    extensions: { code: LagoApiError.UnprocessableEntity, details },
  },
]

describe('mapPortalCustomerErrors', () => {
  describe('GIVEN no errors', () => {
    it('THEN returns an empty list', () => {
      expect(mapPortalCustomerErrors(undefined)).toEqual([])
      expect(mapPortalCustomerErrors([])).toEqual([])
    })
  })

  describe('GIVEN billing field errors', () => {
    it('THEN maps each error to its form field', () => {
      const errors = buildErrors({
        legalName: [LagoApiError.InvalidCharacters],
        addressLine1: [LagoApiError.ValueIsTooLong],
      })

      expect(mapPortalCustomerErrors(errors)).toEqual([
        { path: 'legalName', code: LagoApiError.InvalidCharacters },
        { path: 'addressLine1', code: LagoApiError.ValueIsTooLong },
      ])
    })
  })

  describe('GIVEN shipping field errors', () => {
    it('THEN maps them to the nested shipping address fields', () => {
      const errors = buildErrors({
        shippingAddressLine2: [LagoApiError.InvalidCharacters],
        shippingState: [LagoApiError.ValueIsTooLong],
      })

      expect(mapPortalCustomerErrors(errors)).toEqual([
        { path: 'shippingAddress.addressLine2', code: LagoApiError.InvalidCharacters },
        { path: 'shippingAddress.state', code: LagoApiError.ValueIsTooLong },
      ])
    })
  })

  describe('GIVEN an error on an unknown field or with another code', () => {
    it('THEN ignores it', () => {
      const errors = buildErrors({
        email: [LagoApiError.InvalidCharacters],
        city: [LagoApiError.ValueIsInvalid],
      })

      expect(mapPortalCustomerErrors(errors)).toEqual([])
    })
  })
})

describe('getMaxLength', () => {
  it('returns the address line limit for the billing and shipping address lines', () => {
    expect(getMaxLength('addressLine1')).toBe(ADDRESS_LINE_MAX_LENGTH)
    expect(getMaxLength('shippingAddress.addressLine2')).toBe(ADDRESS_LINE_MAX_LENGTH)
  })

  it('returns the free text limit for the other fields', () => {
    expect(getMaxLength('legalName')).toBe(FREE_TEXT_MAX_LENGTH)
    expect(getMaxLength('shippingAddress.city')).toBe(FREE_TEXT_MAX_LENGTH)
  })
})
