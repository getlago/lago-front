import { GraphQLFormattedError } from 'graphql'

import {
  computeCustomerInitials,
  CUSTOMER_ADDRESS_LINE_MAX_LENGTH,
  CUSTOMER_TEXT_MAX_LENGTH,
  getCustomerFieldErrors,
  getInitials,
} from '~/components/customers/utils'
import { LagoApiError } from '~/generated/graphql'

const buildErrors = (details: Record<string, unknown>): GraphQLFormattedError[] => [
  { message: 'Unprocessable Entity', extensions: { code: 'unprocessable_entity', details } },
]

const translate = jest.fn((key: string, data?: Record<string, unknown>) =>
  data?.max ? `too-long-${data.max}` : 'invalid-characters',
)

describe('customerUtils', () => {
  describe('getInitials', () => {
    describe('one word', () => {
      it('should return the first letter of the single word', () => {
        expect(getInitials('First')).toEqual('F')
      })
    })

    describe('multiple words', () => {
      it('should return the first letter of the two words', () => {
        expect(getInitials('First Second')).toEqual('FS')
      })

      it('should return the first letter of all the words', () => {
        expect(getInitials('First Second Third')).toEqual('FST')
      })
    })
  })

  describe('computeCustomerInitials', () => {
    describe('name', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago' })).toEqual('L')
      })
    })

    describe('name + firstname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', firstname: 'Stefan' })).toEqual('L')
      })
    })

    describe('name + lastname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', lastname: 'World' })).toEqual('L')
      })
    })

    describe('name + firstname + lastname', () => {
      it('should return the initial of the name', () => {
        expect(
          computeCustomerInitials({ name: 'Lago', firstname: 'Stefan', lastname: 'World' }),
        ).toEqual('L')
      })
    })

    describe('firstname', () => {
      it('should return the initial of the firstname', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan' })).toEqual('S')
      })
    })

    describe('firstname + lastname', () => {
      it('should return the initial of both names', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan', lastname: 'World' })).toEqual('SW')
      })
    })

    describe('lastname', () => {
      it('should return the initial of the last name', () => {
        expect(computeCustomerInitials({ lastname: 'World' })).toEqual('W')
      })
    })
  })

  describe('getCustomerFieldErrors', () => {
    describe('GIVEN a value_is_too_long error', () => {
      it.each([
        ['shippingAddressLine2', 'shippingAddress.addressLine2', CUSTOMER_ADDRESS_LINE_MAX_LENGTH],
        ['shippingZipcode', 'shippingAddress.zipcode', CUSTOMER_TEXT_MAX_LENGTH],
        ['addressLine1', 'addressLine1', CUSTOMER_ADDRESS_LINE_MAX_LENGTH],
        ['legalName', 'legalName', CUSTOMER_TEXT_MAX_LENGTH],
      ])('THEN should map %s to %s with a %s limit', (key, path, max) => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ [key]: [LagoApiError.ValueIsTooLong] }),
          translate,
        })

        expect(fields).toEqual({ [path]: { message: `too-long-${max}`, path: path.split('.') } })
      })
    })

    describe('GIVEN a billingAddressPath', () => {
      it.each([
        ['city', 'billingAddress.city'],
        ['name', 'name'],
        ['shippingCity', 'shippingAddress.city'],
      ])('THEN should map %s to %s', (key, path) => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ [key]: [LagoApiError.ValueIsTooLong] }),
          translate,
          billingAddressPath: 'billingAddress',
        })

        expect(Object.keys(fields)).toEqual([path])
      })
    })

    describe('GIVEN an invalid_characters error', () => {
      it('THEN should use the invalid characters message', () => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({ name: [LagoApiError.InvalidCharacters] }),
          translate,
        })

        expect(fields.name.message).toBe('invalid-characters')
      })
    })

    describe('GIVEN only mapped field errors', () => {
      it('THEN hasOnlyFieldErrors should be true', () => {
        const { hasOnlyFieldErrors } = getCustomerFieldErrors({
          errors: buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
          translate,
        })

        expect(hasOnlyFieldErrors).toBe(true)
      })
    })

    describe('GIVEN errors that are not all mapped to a field', () => {
      it.each([
        ['an unrelated detail code', buildErrors({ externalId: ['value_already_exist'] })],
        [
          'a mix of mapped and unrelated codes',
          buildErrors({ city: [LagoApiError.ValueIsTooLong], email: ['invalid_email_format'] }),
        ],
        [
          'a handled and an unhandled code on the same field',
          buildErrors({ city: [LagoApiError.ValueIsTooLong, 'value_is_invalid'] }),
        ],
        ['a non-array detail', buildErrors({ error: 'Stripe: resource_missing' })],
        ['no details', [{ message: 'Internal error', extensions: { code: 'internal_error' } }]],
        [
          'several errors',
          [
            ...buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
            ...buildErrors({ city: [LagoApiError.ValueIsTooLong] }),
          ],
        ],
        ['no errors', undefined],
      ])('THEN hasOnlyFieldErrors should be false for %s', (_, errors) => {
        const { hasOnlyFieldErrors } = getCustomerFieldErrors({ errors, translate })

        expect(hasOnlyFieldErrors).toBe(false)
      })

      it('THEN should ignore unrelated codes', () => {
        const { fields } = getCustomerFieldErrors({
          errors: buildErrors({
            externalId: ['value_already_exist'],
            error: 'Stripe: resource_missing',
          }),
          translate,
        })

        expect(fields).toEqual({})
      })
    })
  })
})
