import { TaxInfosForCreateInvoiceFragment } from '~/generated/graphql'

import { computeHasTaxProvider, resolveCustomerApplicableTax } from '../CreateInvoice'

// -- Test data --

const orgTax: TaxInfosForCreateInvoiceFragment = {
  id: 'org-tax-1',
  name: 'Org VAT',
  code: 'org_vat',
  rate: 20,
}
const customerTax: TaxInfosForCreateInvoiceFragment = {
  id: 'cust-tax-1',
  name: 'Customer Tax',
  code: 'cust_tax',
  rate: 10,
}
const billingEntityTax: TaxInfosForCreateInvoiceFragment = {
  id: 'be-tax-1',
  name: 'BE Tax',
  code: 'be_tax',
  rate: 15,
}

// -- Tests --

describe('CreateInvoice tax resolution logic', () => {
  describe('computeHasTaxProvider', () => {
    describe('GIVEN a customer with an Anrok integration', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: { id: 'anrok-1' },
            avalaraCustomer: null,
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with an Avalara integration', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: null,
            avalaraCustomer: { id: 'avalara-1' },
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with both Anrok and Avalara integrations', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return true', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: { id: 'anrok-1' },
            avalaraCustomer: { id: 'avalara-1' },
          })

          expect(result).toBe(true)
        })
      })
    })

    describe('GIVEN a customer with no tax provider', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return false', () => {
          const result = computeHasTaxProvider({
            anrokCustomer: null,
            avalaraCustomer: null,
          })

          expect(result).toBe(false)
        })
      })
    })

    describe('GIVEN no customer data', () => {
      describe('WHEN computing hasTaxProvider', () => {
        it('THEN should return false', () => {
          expect(computeHasTaxProvider(undefined)).toBe(false)
          expect(computeHasTaxProvider(null)).toBe(false)
        })
      })
    })
  })

  describe('resolveCustomerApplicableTax', () => {
    describe('GIVEN the customer has a tax provider (Anrok or Avalara)', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return an empty array regardless of other taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: true,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([])
        })
      })
    })

    describe('GIVEN no tax provider and the customer has taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return customer taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([customerTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, but billing entity has taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return billing entity taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([billingEntityTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, and empty billing entity taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should fall back to org-level taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [],
            billingEntityTaxes: [],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([orgTax])
        })
      })
    })

    describe('GIVEN no tax provider, no customer taxes, and no billing entity taxes', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should fall back to org-level taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: null,
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([orgTax])
        })
      })
    })

    describe('GIVEN no tax provider and no taxes at any level', () => {
      describe('WHEN resolving applicable taxes', () => {
        it('THEN should return undefined', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: null,
            orgTaxes: undefined,
          })

          expect(result).toBeUndefined()
        })
      })
    })

    describe('GIVEN customer taxes take precedence over billing entity taxes', () => {
      describe('WHEN both customer and billing entity have taxes', () => {
        it('THEN should return customer taxes, not billing entity taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: [customerTax],
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([customerTax])
          expect(result).not.toEqual([billingEntityTax])
        })
      })
    })

    describe('GIVEN billing entity taxes take precedence over org taxes', () => {
      describe('WHEN billing entity has taxes but customer does not', () => {
        it('THEN should return billing entity taxes, not org taxes', () => {
          const result = resolveCustomerApplicableTax({
            hasTaxProvider: false,
            customerTaxes: null,
            billingEntityTaxes: [billingEntityTax],
            orgTaxes: [orgTax],
          })

          expect(result).toEqual([billingEntityTax])
          expect(result).not.toEqual([orgTax])
        })
      })
    })
  })
})
