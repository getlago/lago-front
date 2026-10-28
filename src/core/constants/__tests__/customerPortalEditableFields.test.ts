import { CountryCode, CustomerPortalFieldEnum } from '~/generated/graphql'

import {
  CUSTOMER_PORTAL_FIELDS,
  getCustomerPortalEditableFields,
  getCustomerPortalLockedFields,
  hasEditableCustomerPortalFormField,
  pickCustomerPortalEditableFields,
} from '../customerPortalEditableFields'

describe('customerPortalEditableFields', () => {
  describe('CUSTOMER_PORTAL_FIELDS', () => {
    it('THEN should cover every editable field once', () => {
      const fields = CUSTOMER_PORTAL_FIELDS.map(({ field }) => field)

      expect(fields).toHaveLength(Object.values(CustomerPortalFieldEnum).length)
      expect(new Set(fields)).toEqual(new Set(Object.values(CustomerPortalFieldEnum)))
    })
  })

  describe('pickCustomerPortalEditableFields', () => {
    it('THEN should drop the fields that are not editable', () => {
      const result = pickCustomerPortalEditableFields(
        {
          name: 'Acme',
          country: CountryCode.Us,
          zipcode: '10001',
          taxIdentificationNumber: 'US123',
          shippingAddress: { city: 'New York' },
        },
        [CustomerPortalFieldEnum.Name, CustomerPortalFieldEnum.ShippingAddress],
      )

      expect(result).toEqual({ name: 'Acme', shippingAddress: { city: 'New York' } })
    })

    it('THEN should return an empty input when nothing is editable', () => {
      expect(pickCustomerPortalEditableFields({ name: 'Acme' }, [])).toEqual({})
    })
  })

  describe('hasEditableCustomerPortalFormField', () => {
    it.each([
      [[CustomerPortalFieldEnum.City], true],
      [[CustomerPortalFieldEnum.DocumentLocale], false],
      [[], false],
    ])('THEN should return %s -> %s', (fields, expected) => {
      expect(hasEditableCustomerPortalFormField(fields)).toBe(expected)
    })
  })

  describe('getCustomerPortalEditableFields', () => {
    it('THEN should return every field that is not locked', () => {
      const editable = getCustomerPortalEditableFields([
        CustomerPortalFieldEnum.Country,
        CustomerPortalFieldEnum.Zipcode,
      ])

      expect(editable).toContain(CustomerPortalFieldEnum.City)
      expect(editable).not.toContain(CustomerPortalFieldEnum.Country)
      expect(editable).not.toContain(CustomerPortalFieldEnum.Zipcode)
      expect(editable).toHaveLength(Object.values(CustomerPortalFieldEnum).length - 2)
    })

    it.each([[undefined], [null]])(
      'THEN should treat nothing as editable when the list is %s',
      (fields) => {
        expect(getCustomerPortalEditableFields(fields)).toEqual([])
      },
    )
  })

  describe('getCustomerPortalLockedFields', () => {
    it('THEN should lock every form field that is not editable', () => {
      const locked = [CustomerPortalFieldEnum.Country, CustomerPortalFieldEnum.ShippingAddress]

      expect(getCustomerPortalLockedFields(getCustomerPortalEditableFields(locked))).toEqual(
        expect.arrayContaining(locked),
      )
      expect(getCustomerPortalLockedFields(getCustomerPortalEditableFields(locked))).toHaveLength(2)
    })

    it('THEN should keep the current lock of fields that have no form input', () => {
      const unknownField = 'legal_number' as CustomerPortalFieldEnum
      const currentLocked = [
        CustomerPortalFieldEnum.Country,
        CustomerPortalFieldEnum.DocumentLocale,
        unknownField,
      ]

      const locked = getCustomerPortalLockedFields(
        Object.values(CustomerPortalFieldEnum),
        currentLocked,
      )

      expect(locked).toEqual([CustomerPortalFieldEnum.DocumentLocale, unknownField])
    })
  })
})
