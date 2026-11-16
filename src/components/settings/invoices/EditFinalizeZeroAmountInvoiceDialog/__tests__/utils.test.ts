import {
  EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment,
  EditCustomerFinalizeZeroAmountInvoiceForDialogFragment,
  FinalizeZeroAmountInvoiceEnum,
} from '~/generated/graphql'

import { getInitialValue, isCustomerEntity, toFinalizeZeroAmountInvoiceEnum } from '../utils'

const customer: EditCustomerFinalizeZeroAmountInvoiceForDialogFragment = {
  __typename: 'Customer',
  id: 'customer-1',
  externalId: 'customer-external-1',
  name: 'Acme',
  finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Finalize,
}

const billingEntity: EditBillingEntityFinalizeZeroAmountInvoiceForDialogFragment = {
  __typename: 'BillingEntity',
  id: 'billing-entity-1',
  finalizeZeroAmountInvoice: true,
}

describe('EditFinalizeZeroAmountInvoiceDialog utils', () => {
  describe('isCustomerEntity', () => {
    it('GIVEN a customer WHEN narrowing THEN it returns true', () => {
      expect(isCustomerEntity(customer)).toBe(true)
    })

    it('GIVEN a billing entity or no entity WHEN narrowing THEN it returns false', () => {
      expect(isCustomerEntity(billingEntity)).toBe(false)
      expect(isCustomerEntity(null)).toBe(false)
      expect(isCustomerEntity(undefined)).toBe(false)
    })
  })

  describe('getInitialValue', () => {
    it('GIVEN a customer inheriting WHEN seeding THEN the field opens empty', () => {
      expect(
        getInitialValue({
          entity: customer,
          finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Inherit,
        }),
      ).toBe('')
    })

    it('GIVEN a customer with its own value WHEN seeding THEN the enum value is used', () => {
      expect(
        getInitialValue({
          entity: customer,
          finalizeZeroAmountInvoice: FinalizeZeroAmountInvoiceEnum.Skip,
        }),
      ).toBe(FinalizeZeroAmountInvoiceEnum.Skip)
    })

    it('GIVEN a billing entity WHEN seeding THEN the boolean is stringified', () => {
      expect(getInitialValue({ entity: billingEntity, finalizeZeroAmountInvoice: false })).toBe(
        'false',
      )
      expect(getInitialValue({ entity: billingEntity, finalizeZeroAmountInvoice: true })).toBe(
        'true',
      )
    })

    it('GIVEN nothing set WHEN seeding THEN the field opens empty', () => {
      expect(getInitialValue({ entity: billingEntity, finalizeZeroAmountInvoice: null })).toBe('')
      expect(getInitialValue({})).toBe('')
    })
  })

  describe('toFinalizeZeroAmountInvoiceEnum', () => {
    it('GIVEN a known option WHEN converting THEN the enum member is returned', () => {
      expect(toFinalizeZeroAmountInvoiceEnum('finalize')).toBe(
        FinalizeZeroAmountInvoiceEnum.Finalize,
      )
      expect(toFinalizeZeroAmountInvoiceEnum('skip')).toBe(FinalizeZeroAmountInvoiceEnum.Skip)
    })

    it('GIVEN a value outside the enum WHEN converting THEN it returns undefined', () => {
      expect(toFinalizeZeroAmountInvoiceEnum('true')).toBeUndefined()
      expect(toFinalizeZeroAmountInvoiceEnum('')).toBeUndefined()
    })
  })
})
