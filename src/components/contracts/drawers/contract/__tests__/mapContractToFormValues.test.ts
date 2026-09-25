import { PaymentMethodTypeEnum, TimezoneEnum } from '~/generated/graphql'

import { contractForDrawerFixture } from './fixtures'

import { mapContractToDrawerCustomer, mapContractToFormValues } from '../mapContractToFormValues'

describe('mapContractToFormValues', () => {
  it('maps every stored value onto the form shape', () => {
    expect(mapContractToFormValues(contractForDrawerFixture)).toEqual({
      externalCustomerId: 'external-customer-1',
      externalId: 'external-contract-1',
      planCode: 'enterprise',
      isPlanRequired: true,
      name: 'Enterprise agreement',
      billingEntityId: 'billing-entity-2',
      consolidateInvoice: true,
      paymentMethod: {
        paymentMethodId: 'payment-method-1',
        paymentMethodType: PaymentMethodTypeEnum.Provider,
      },
      purchaseOrderNumber: 'PO-42',
      startedAt: '2026-01-01T00:00:00Z',
      endedAt: '2099-12-31T00:00:00Z',
      initialEndedAt: '2099-12-31T00:00:00Z',
      billingAnchorDate: '2026-01-15T00:00:00.000Z',
    })
  })

  it('maps absent optional values to the empty form shapes', () => {
    const values = mapContractToFormValues({
      ...contractForDrawerFixture,
      name: null,
      endedAt: null,
      purchaseOrderNumber: null,
      billingEntityId: null,
      paymentMethod: null,
      plan: null,
    })

    expect(values).toEqual(
      expect.objectContaining({
        name: '',
        endedAt: undefined,
        purchaseOrderNumber: undefined,
        billingEntityId: 'billing-entity-1',
        planCode: '',
        isPlanRequired: false,
        paymentMethod: {
          paymentMethodId: null,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        },
      }),
    )
  })

  // A UTC-parsed fallback would resend Jan 1 and trip `contract_locked` on an active contract.
  it('falls back to the start calendar day in the customer timezone when no anchor is stored', () => {
    const values = mapContractToFormValues({
      ...contractForDrawerFixture,
      startedAt: '2026-01-01T03:00:00Z',
      billingAnchorDate: null,
      customer: {
        ...contractForDrawerFixture.customer,
        applicableTimezone: TimezoneEnum.TzAmericaNewYork,
      },
    })

    expect(values.billingAnchorDate).toBe('2025-12-31T00:00:00.000Z')
  })
})

describe('mapContractToDrawerCustomer', () => {
  it('seeds the drawer customer from the contract customer', () => {
    expect(mapContractToDrawerCustomer(contractForDrawerFixture)).toEqual({
      externalId: 'external-customer-1',
      displayName: 'Acme',
      applicableTimezone: TimezoneEnum.TzUtc,
      billingEntityId: 'billing-entity-1',
    })
  })
})
