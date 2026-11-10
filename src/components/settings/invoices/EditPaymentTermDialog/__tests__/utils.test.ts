import {
  INHERIT_DEFAULT_LABEL_KEY,
  INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
} from '~/components/paymentTerms/utils'
import { DEFAULT_PAYMENT_TERM } from '~/core/constants/paymentTerm'
import {
  EditBillingEntityPaymentTermForDialogFragment,
  EditCustomerPaymentTermForDialogFragment,
  PaymentTermTypeEnum,
} from '~/generated/graphql'

import { getInheritedFrom } from '../utils'

const ENTITY_TERM = { termType: PaymentTermTypeEnum.Net, days: 30 }
const CUSTOMER_TERM = { termType: PaymentTermTypeEnum.EndOfMonth }

const buildCustomer = (
  billingEntityTerm: EditCustomerPaymentTermForDialogFragment['paymentTerm'],
): EditCustomerPaymentTermForDialogFragment => ({
  __typename: 'Customer',
  id: 'customer-1',
  externalId: 'customer-external-1',
  paymentTerm: CUSTOMER_TERM,
  billingEntity: {
    __typename: 'BillingEntity',
    id: 'billing-entity-1',
    paymentTerm: billingEntityTerm,
  },
})

const billingEntity: EditBillingEntityPaymentTermForDialogFragment = {
  __typename: 'BillingEntity',
  id: 'billing-entity-1',
  paymentTerm: ENTITY_TERM,
}

describe('getInheritedFrom', () => {
  describe('GIVEN a customer whose billing entity has a term', () => {
    it('THEN should offer that entity term, not the customer own term being edited', () => {
      expect(getInheritedFrom(buildCustomer(ENTITY_TERM))).toEqual({
        term: ENTITY_TERM,
        labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
      })
    })
  })

  describe('GIVEN a customer whose billing entity has no term', () => {
    it('THEN should offer the default and label it as such', () => {
      expect(getInheritedFrom(buildCustomer(null))).toEqual({
        term: DEFAULT_PAYMENT_TERM,
        labelKey: INHERIT_DEFAULT_LABEL_KEY,
      })
    })
  })

  describe('GIVEN a billing entity', () => {
    it('THEN should offer nothing to inherit', () => {
      expect(getInheritedFrom(billingEntity)).toBeUndefined()
      expect(getInheritedFrom(null)).toBeUndefined()
    })
  })
})
