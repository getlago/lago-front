import { CountryCode, CustomerPortalEditableFieldEnum } from '~/generated/graphql'

import {
  CUSTOMER_PORTAL_EDITABLE_FIELDS,
  pickCustomerPortalEditableFields,
} from '../customerPortalEditableFields'

describe('customerPortalEditableFields', () => {
  describe('CUSTOMER_PORTAL_EDITABLE_FIELDS', () => {
    it('THEN should cover every editable field once', () => {
      const fields = CUSTOMER_PORTAL_EDITABLE_FIELDS.map(({ field }) => field)

      expect(fields).toHaveLength(Object.values(CustomerPortalEditableFieldEnum).length)
      expect(new Set(fields)).toEqual(new Set(Object.values(CustomerPortalEditableFieldEnum)))
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
        [CustomerPortalEditableFieldEnum.Name, CustomerPortalEditableFieldEnum.ShippingAddress],
      )

      expect(result).toEqual({ name: 'Acme', shippingAddress: { city: 'New York' } })
    })

    it('THEN should return an empty input when nothing is editable', () => {
      expect(pickCustomerPortalEditableFields({ name: 'Acme' }, [])).toEqual({})
    })
  })
})
