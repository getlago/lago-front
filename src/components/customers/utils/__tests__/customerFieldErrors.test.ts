import { GraphQLFormattedError } from 'graphql'

import { LagoApiError } from '~/generated/graphql'

import {
  CustomerFieldErrorKey,
  getCustomerFieldErrorMap,
  hasOnlyCustomerFieldErrors,
  zodCustomerFreeText,
} from '../customerFieldErrors'

const PATH_BY_ERROR_KEY: Record<CustomerFieldErrorKey, string> = {
  name: 'name',
  firstname: 'firstname',
  lastname: 'lastname',
  legalName: 'legalName',
  taxIdentificationNumber: 'taxIdentificationNumber',
  addressLine1: 'billingAddress.addressLine1',
  addressLine2: 'billingAddress.addressLine2',
  zipcode: 'billingAddress.zipcode',
  city: 'billingAddress.city',
  state: 'billingAddress.state',
  shippingAddressLine1: 'shippingAddress.addressLine1',
  shippingAddressLine2: 'shippingAddress.addressLine2',
  shippingZipcode: 'shippingAddress.zipcode',
  shippingCity: 'shippingAddress.city',
  shippingState: 'shippingAddress.state',
}

const translate = (
  key: string,
  data?: Record<string, string | number | undefined | null>,
): string => (data ? `${key}:${JSON.stringify(data)}` : key)

const INVALID_CHARACTERS_MESSAGE = 'text_1792577695510fp8vzeszoh7'
const tooLongMessage = (max: number): string => `text_1792577695510xy36tafb8l5:{"max":${max}}`

const buildErrors = (details: unknown): GraphQLFormattedError[] => [
  {
    message: 'Unprocessable Entity',
    extensions: { code: LagoApiError.UnprocessableEntity, details },
  },
]

describe('getCustomerFieldErrorMap', () => {
  describe('GIVEN no errors', () => {
    it('THEN returns an empty map', () => {
      expect(getCustomerFieldErrorMap(undefined, PATH_BY_ERROR_KEY, translate)).toEqual({})
      expect(getCustomerFieldErrorMap([], PATH_BY_ERROR_KEY, translate)).toEqual({})
    })
  })

  describe('GIVEN an error without details', () => {
    it('THEN returns an empty map', () => {
      expect(
        getCustomerFieldErrorMap(
          [{ message: 'Not found', extensions: { code: LagoApiError.NotFound } }],
          PATH_BY_ERROR_KEY,
          translate,
        ),
      ).toEqual({})
      expect(getCustomerFieldErrorMap(buildErrors('oops'), PATH_BY_ERROR_KEY, translate)).toEqual(
        {},
      )
    })
  })

  describe('GIVEN a value_is_too_long error on a free text field', () => {
    it('THEN maps it to the field path with the 255 limit', () => {
      const errors = buildErrors({ legalName: [LagoApiError.ValueIsTooLong] })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({
        legalName: { message: tooLongMessage(255), path: ['legalName'] },
      })
    })
  })

  describe('GIVEN value_is_too_long errors on address lines', () => {
    it('THEN maps them to the nested billing and shipping paths with the 500 limit', () => {
      const errors = buildErrors({
        addressLine1: [LagoApiError.ValueIsTooLong],
        shippingAddressLine2: [LagoApiError.ValueIsTooLong],
      })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({
        'billingAddress.addressLine1': {
          message: tooLongMessage(500),
          path: ['billingAddress', 'addressLine1'],
        },
        'shippingAddress.addressLine2': {
          message: tooLongMessage(500),
          path: ['shippingAddress', 'addressLine2'],
        },
      })
    })
  })

  describe('GIVEN a value_is_too_long error on a shipping free text field', () => {
    it('THEN uses the 255 limit', () => {
      const errors = buildErrors({ shippingCity: [LagoApiError.ValueIsTooLong] })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({
        'shippingAddress.city': { message: tooLongMessage(255), path: ['shippingAddress', 'city'] },
      })
    })
  })

  describe('GIVEN an invalid_characters error', () => {
    it('THEN maps it to the invalid characters message', () => {
      const errors = buildErrors({ shippingState: [LagoApiError.InvalidCharacters] })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({
        'shippingAddress.state': {
          message: INVALID_CHARACTERS_MESSAGE,
          path: ['shippingAddress', 'state'],
        },
      })
    })
  })

  describe('GIVEN a field with another code before a handled one', () => {
    it('THEN uses the handled code', () => {
      const errors = buildErrors({
        name: [LagoApiError.ValueIsInvalid, LagoApiError.ValueIsTooLong],
      })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({
        name: { message: tooLongMessage(255), path: ['name'] },
      })
    })
  })

  describe('GIVEN an error on an unknown field, with another code or with no code list', () => {
    it('THEN ignores it', () => {
      const errors = buildErrors({
        email: [LagoApiError.ValueIsTooLong],
        city: [LagoApiError.ValueIsInvalid],
        state: LagoApiError.ValueIsTooLong,
        toString: [LagoApiError.ValueIsTooLong],
      })

      expect(getCustomerFieldErrorMap(errors, PATH_BY_ERROR_KEY, translate)).toEqual({})
    })
  })
})

describe('hasOnlyCustomerFieldErrors', () => {
  describe('GIVEN no errors or no details', () => {
    it('THEN returns false', () => {
      expect(hasOnlyCustomerFieldErrors(undefined)).toBe(false)
      expect(hasOnlyCustomerFieldErrors(buildErrors(undefined))).toBe(false)
      expect(hasOnlyCustomerFieldErrors(buildErrors({}))).toBe(false)
    })
  })

  describe('GIVEN every detail is a mapped field error', () => {
    it('THEN returns true', () => {
      const errors = buildErrors({
        legalName: [LagoApiError.InvalidCharacters],
        shippingCity: [LagoApiError.ValueIsTooLong],
      })

      expect(hasOnlyCustomerFieldErrors(errors)).toBe(true)
    })
  })

  describe('GIVEN a mapped field error next to an unmapped detail', () => {
    it('THEN returns false', () => {
      const errors = buildErrors({
        legalName: [LagoApiError.InvalidCharacters],
        email: [LagoApiError.ValueIsInvalid],
      })

      expect(hasOnlyCustomerFieldErrors(errors)).toBe(false)
    })
  })

  describe('GIVEN a second error next to the field errors', () => {
    it('THEN returns false', () => {
      const errors = [
        ...buildErrors({ legalName: [LagoApiError.InvalidCharacters] }),
        { message: 'Not found', extensions: { code: LagoApiError.NotFound } },
      ]

      expect(hasOnlyCustomerFieldErrors(errors)).toBe(false)
    })
  })
})

describe('zodCustomerFreeText', () => {
  const longName = 'a'.repeat(256)

  describe('GIVEN a value over the limit', () => {
    it('THEN fails with the limit message', () => {
      const result = zodCustomerFreeText({ key: 'name', initialValue: '', translate }).safeParse(
        longName,
      )

      expect(result.success).toBe(false)
      expect(result.error?.issues[0].message).toBe(tooLongMessage(255))
    })
  })

  describe('GIVEN an address line within its own limit', () => {
    it('THEN passes', () => {
      const schema = zodCustomerFreeText({ key: 'addressLine1', initialValue: '', translate })

      expect(schema.safeParse('a'.repeat(500)).success).toBe(true)
      expect(schema.safeParse('a'.repeat(501)).success).toBe(false)
    })
  })

  describe('GIVEN a value over the limit that equals the initial value', () => {
    it('THEN passes', () => {
      const schema = zodCustomerFreeText({ key: 'name', initialValue: longName, translate })

      expect(schema.safeParse(longName).success).toBe(true)
    })
  })
})
