import { renderHook } from '@testing-library/react'

import {
  INHERIT_DEFAULT_LABEL_KEY,
  INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
  INHERIT_FROM_CUSTOMER_LABEL_KEY,
} from '~/components/paymentTerms/utils'
import { PaymentTermTypeEnum } from '~/generated/graphql'
import { BillingEntityByIdStatus } from '~/hooks/useBillingEntitiesOptions'

import { useInheritedPaymentTerm } from '../useInheritedPaymentTerm'

const NET_30 = { termType: PaymentTermTypeEnum.Net, days: 30 }
const NET_45 = { termType: PaymentTermTypeEnum.Net, days: 45 }
const END_OF_MONTH = { termType: PaymentTermTypeEnum.EndOfMonth }

const mockUseBillingEntityById = jest.fn()

jest.mock('~/hooks/useBillingEntitiesOptions', () => ({
  ...jest.requireActual('~/hooks/useBillingEntitiesOptions'),
  useBillingEntityById: (id: string | null | undefined) => mockUseBillingEntityById(id),
}))

const entityLookup = (
  status: BillingEntityByIdStatus,
  billingEntity?: { id: string; paymentTerm: typeof END_OF_MONTH },
) => mockUseBillingEntityById.mockReturnValue({ billingEntity, status })

describe('useInheritedPaymentTerm', () => {
  beforeEach(() => {
    mockUseBillingEntityById.mockReset()
  })

  describe('GIVEN the customer has its own term', () => {
    const customer = { paymentTerm: NET_30, billingEntity: { paymentTerm: NET_45 } }

    describe.each<BillingEntityByIdStatus>(['loading', 'unavailable'])(
      'WHEN the issuing entity lookup would be %s',
      (status) => {
        it('THEN should return the customer term without looking the entity up', () => {
          mockUseBillingEntityById.mockImplementation((id) => ({
            billingEntity: undefined,
            status: id ? status : 'resolved',
          }))

          const { result } = renderHook(() =>
            useInheritedPaymentTerm({ customer, billingEntityId: 'be_2' }),
          )

          expect(mockUseBillingEntityById).toHaveBeenCalledWith(undefined)
          expect(result.current).toEqual({
            term: NET_30,
            labelKey: INHERIT_FROM_CUSTOMER_LABEL_KEY,
          })
        })
      },
    )
  })

  describe('GIVEN the customer has no term of its own', () => {
    const customer = { paymentTerm: null, billingEntity: { paymentTerm: NET_45 } }

    describe('WHEN the issuing entity resolves', () => {
      it('THEN should return that entity term, not the customer default entity one', () => {
        entityLookup('resolved', { id: 'be_2', paymentTerm: END_OF_MONTH })

        const { result } = renderHook(() =>
          useInheritedPaymentTerm({ customer, billingEntityId: 'be_2' }),
        )

        expect(mockUseBillingEntityById).toHaveBeenCalledWith('be_2')
        expect(result.current).toEqual({
          term: END_OF_MONTH,
          labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
        })
      })
    })

    describe.each<BillingEntityByIdStatus>(['loading', 'unavailable'])(
      'WHEN the issuing entity lookup is %s',
      (status) => {
        it('THEN should report the term as unknown', () => {
          entityLookup(status)

          const { result } = renderHook(() =>
            useInheritedPaymentTerm({ customer, billingEntityId: 'be_2' }),
          )

          expect(result.current).toBeUndefined()
        })
      },
    )

    describe('WHEN no issuing entity is bound', () => {
      it('THEN should fall back to the customer default entity term', () => {
        entityLookup('resolved')

        const { result } = renderHook(() =>
          useInheritedPaymentTerm({ customer, billingEntityId: null }),
        )

        expect(result.current).toEqual({
          term: NET_45,
          labelKey: INHERIT_FROM_BILLING_ENTITY_LABEL_KEY,
        })
      })
    })

    describe('WHEN no level carries a term', () => {
      it('THEN should return due on receipt labelled as the default', () => {
        entityLookup('resolved')

        const { result } = renderHook(() =>
          useInheritedPaymentTerm({
            customer: { paymentTerm: null, billingEntity: { paymentTerm: null } },
            billingEntityId: null,
          }),
        )

        expect(result.current?.labelKey).toBe(INHERIT_DEFAULT_LABEL_KEY)
      })
    })
  })

  describe('GIVEN the customer is not loaded yet', () => {
    it('THEN should report the term as unknown rather than the default', () => {
      entityLookup('resolved')

      const { result } = renderHook(() =>
        useInheritedPaymentTerm({ customer: undefined, billingEntityId: null }),
      )

      expect(result.current).toBeUndefined()
    })
  })
})
