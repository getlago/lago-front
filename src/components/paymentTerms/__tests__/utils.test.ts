import { DEFAULT_PAYMENT_TERM } from '~/core/constants/paymentTerm'
import { PaymentTermTypeEnum } from '~/generated/graphql'

import {
  getInheritedPaymentTerm,
  INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
  INHERIT_FROM_CUSTOMER_LABEL_KEY,
} from '../utils'

const CUSTOMER_TERM = { termType: PaymentTermTypeEnum.Net, days: 30 }
const CUSTOMER_ENTITY_TERM = { termType: PaymentTermTypeEnum.EndOfMonth }
const ISSUING_ENTITY_TERM = { termType: PaymentTermTypeEnum.NetEndOfMonth, days: 2 }

describe('getInheritedPaymentTerm', () => {
  describe('GIVEN a customer with a term of its own', () => {
    describe('WHEN the object is bound to another billing entity', () => {
      it('THEN should inherit the customer term and say so', () => {
        expect(
          getInheritedPaymentTerm({
            customer: { paymentTerm: CUSTOMER_TERM, billingEntity: { paymentTerm: null } },
            issuingBillingEntity: { paymentTerm: ISSUING_ENTITY_TERM },
          }),
        ).toEqual({ term: CUSTOMER_TERM, labelKey: INHERIT_FROM_CUSTOMER_LABEL_KEY })
      })
    })
  })

  describe('GIVEN a customer without a term', () => {
    describe('WHEN the object is bound to a billing entity of its own', () => {
      it('THEN should inherit that entity term, not the customer entity one', () => {
        // Switching the entity on a one-off invoice used to keep showing the customer's entity term.
        expect(
          getInheritedPaymentTerm({
            customer: { paymentTerm: null, billingEntity: { paymentTerm: CUSTOMER_ENTITY_TERM } },
            issuingBillingEntity: { paymentTerm: ISSUING_ENTITY_TERM },
          }),
        ).toEqual({ term: ISSUING_ENTITY_TERM, labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY })
      })
    })

    describe('WHEN the object is not bound to a billing entity', () => {
      it('THEN should inherit the customer billing entity term and name the entity', () => {
        expect(
          getInheritedPaymentTerm({
            customer: { paymentTerm: null, billingEntity: { paymentTerm: CUSTOMER_ENTITY_TERM } },
          }),
        ).toEqual({ term: CUSTOMER_ENTITY_TERM, labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY })
      })
    })

    describe('WHEN the bound billing entity has no term either', () => {
      it('THEN should fall back to due on receipt without consulting the customer entity', () => {
        expect(
          getInheritedPaymentTerm({
            customer: { paymentTerm: null, billingEntity: { paymentTerm: CUSTOMER_ENTITY_TERM } },
            issuingBillingEntity: { paymentTerm: null },
          }),
        ).toEqual({ term: DEFAULT_PAYMENT_TERM, labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY })
      })
    })
  })

  describe('GIVEN no customer at all', () => {
    it('THEN should fall back to due on receipt from the billing entity', () => {
      expect(getInheritedPaymentTerm({ customer: null })).toEqual({
        term: DEFAULT_PAYMENT_TERM,
        labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
      })
    })
  })
})
