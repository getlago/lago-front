import { z } from 'zod'

import {
  addCustomerTooLongIssues,
  CUSTOMER_ADDRESS_LINE_MAX_LENGTH,
  CUSTOMER_TEXT_MAX_LENGTH,
  getCustomerConstrainedField,
  getCustomerFieldFormPath,
  getCustomerTooLongErrorKey,
} from '~/components/customers/fieldConstraints'

const TOO_LONG_255_KEY = 'text_1793265036704cnkqwk0atap'
const TOO_LONG_500_KEY = 'text_17932959847757c9xwcz2ltv'

const EMOJI = '\u{1F44D}'
const COMBINING_E = 'é'

type ValidationOptions = { billingAddressPath?: string; initialValues?: unknown }

const parse = (values: unknown, options: ValidationOptions = {}): z.ZodIssue[] => {
  const result = z
    .any()
    .superRefine((parsed, ctx) => addCustomerTooLongIssues(parsed, ctx, options))
    .safeParse(values)

  return result.success ? [] : result.error.issues
}

describe('customerFieldConstraints', () => {
  describe('getCustomerFieldFormPath', () => {
    describe('GIVEN an API error key', () => {
      it.each([
        ['name', undefined, 'name'],
        ['name', 'billingAddress', 'name'],
        ['city', undefined, 'city'],
        ['city', 'billingAddress', 'billingAddress.city'],
        ['addressLine1', 'billingAddress', 'billingAddress.addressLine1'],
        ['shippingCity', undefined, 'shippingAddress.city'],
        ['shippingCity', 'billingAddress', 'shippingAddress.city'],
        ['shippingAddressLine2', undefined, 'shippingAddress.addressLine2'],
      ])('THEN should resolve %s to %s', (apiErrorKey, billingAddressPath, expected) => {
        const field = getCustomerConstrainedField(apiErrorKey)

        expect(field).toBeDefined()
        expect(field && getCustomerFieldFormPath(field, billingAddressPath)).toBe(expected)
      })
    })

    describe('GIVEN a key the forms do not constrain', () => {
      it('THEN should not be registered', () => {
        expect(getCustomerConstrainedField('legalNumber')).toBeUndefined()
      })
    })
  })

  describe('getCustomerTooLongErrorKey', () => {
    it.each([
      [CUSTOMER_TEXT_MAX_LENGTH, TOO_LONG_255_KEY],
      [CUSTOMER_ADDRESS_LINE_MAX_LENGTH, TOO_LONG_500_KEY],
    ])('THEN should map the %s limit to its message', (maxLength, expected) => {
      expect(getCustomerTooLongErrorKey(maxLength)).toBe(expected)
    })
  })

  describe('addCustomerTooLongIssues', () => {
    describe('GIVEN a value at the limit', () => {
      it.each([
        ['ascii', 'a'.repeat(CUSTOMER_TEXT_MAX_LENGTH)],
        ['supplementary characters', EMOJI.repeat(CUSTOMER_TEXT_MAX_LENGTH)],
        ['combining characters', COMBINING_E.repeat(127)],
      ])('THEN should accept %s', (_, value) => {
        expect(parse({ name: value })).toEqual([])
      })
    })

    describe('GIVEN a value one character over the limit', () => {
      it.each([
        ['ascii', 'a'.repeat(CUSTOMER_TEXT_MAX_LENGTH + 1)],
        ['supplementary characters', EMOJI.repeat(CUSTOMER_TEXT_MAX_LENGTH + 1)],
        ['combining characters', COMBINING_E.repeat(128)],
      ])('THEN should reject %s', (_, value) => {
        expect(parse({ name: value })).toEqual([
          expect.objectContaining({ message: TOO_LONG_255_KEY, path: ['name'] }),
        ])
      })
    })

    describe('GIVEN 255 supplementary characters', () => {
      // Counting UTF-16 code units, as the native maxLength did, rejects this at 510
      it('THEN should accept them although they span 510 code units', () => {
        const value = EMOJI.repeat(CUSTOMER_TEXT_MAX_LENGTH)

        expect(value.length).toBe(CUSTOMER_TEXT_MAX_LENGTH * 2)
        expect(parse({ name: value })).toEqual([])
      })
    })

    describe('GIVEN an address line', () => {
      it('THEN should allow up to 500 characters', () => {
        expect(parse({ addressLine1: 'a'.repeat(CUSTOMER_ADDRESS_LINE_MAX_LENGTH) })).toEqual([])
      })

      it('THEN should reject more with the 500 message', () => {
        expect(parse({ addressLine1: 'a'.repeat(CUSTOMER_ADDRESS_LINE_MAX_LENGTH + 1) })).toEqual([
          expect.objectContaining({ message: TOO_LONG_500_KEY, path: ['addressLine1'] }),
        ])
      })
    })

    describe('GIVEN a billingAddressPath', () => {
      it('THEN should report billing errors under it', () => {
        const values = { billingAddress: { city: 'a'.repeat(CUSTOMER_TEXT_MAX_LENGTH + 1) } }

        expect(parse(values, { billingAddressPath: 'billingAddress' })).toEqual([
          expect.objectContaining({ path: ['billingAddress', 'city'] }),
        ])
      })

      it('THEN should still report shipping errors under shippingAddress', () => {
        const values = {
          shippingAddress: { addressLine1: 'a'.repeat(CUSTOMER_ADDRESS_LINE_MAX_LENGTH + 1) },
        }

        expect(parse(values, { billingAddressPath: 'billingAddress' })).toEqual([
          expect.objectContaining({
            message: TOO_LONG_500_KEY,
            path: ['shippingAddress', 'addressLine1'],
          }),
        ])
      })
    })

    describe('GIVEN a stored value longer than the limit', () => {
      const storedName = 'a'.repeat(CUSTOMER_TEXT_MAX_LENGTH + 10)

      it('THEN should accept it while it is unchanged', () => {
        expect(parse({ name: storedName }, { initialValues: { name: storedName } })).toEqual([])
      })

      it('THEN should reject it once it changed', () => {
        expect(parse({ name: `${storedName}b` }, { initialValues: { name: storedName } })).toEqual([
          expect.objectContaining({ message: TOO_LONG_255_KEY, path: ['name'] }),
        ])
      })

      it('THEN should accept it once it is corrected', () => {
        expect(parse({ name: 'Acme' }, { initialValues: { name: storedName } })).toEqual([])
      })
    })

    describe('GIVEN values that are not strings', () => {
      it.each([
        ['undefined', { name: undefined }],
        ['null', { name: null }],
        ['a missing object', {}],
        ['a non-object', 'not an object'],
      ])('THEN should ignore %s', (_, values) => {
        expect(parse(values)).toEqual([])
      })
    })
  })
})
