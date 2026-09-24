import { PaymentMethodTypeEnum } from '~/generated/graphql'

import { buildCreateContractInput, buildUpdateContractInput } from '../buildContractInput'
import { ContractFormValues } from '../constants'

const values: ContractFormValues = {
  externalCustomerId: 'customer-external-id',
  externalId: 'customer-contract-id',
  planCode: 'enterprise',
  name: 'Enterprise agreement',
  billingEntityId: 'billing-entity-1',
  consolidateInvoice: false,
  paymentMethod: {
    paymentMethodId: 'payment-method-1',
    paymentMethodType: PaymentMethodTypeEnum.Provider,
  },
  purchaseOrderNumber: '  PO-42  ',
  startedAt: '2099-01-01T00:00:00.000Z',
  endedAt: '2099-02-01T00:00:00.000Z',
  billingAnchorDate: '2099-01-01T00:00:00.000Z',
}

const clearedValues: ContractFormValues = {
  ...values,
  externalId: '',
  name: '',
  billingEntityId: undefined,
  purchaseOrderNumber: '   ',
  endedAt: undefined,
}

describe('buildCreateContractInput', () => {
  it('builds the create input keyed on the customer external id', () => {
    expect(buildCreateContractInput(values)).toEqual({
      externalCustomerId: 'customer-external-id',
      externalId: 'customer-contract-id',
      planCode: 'enterprise',
      name: 'Enterprise agreement',
      billingEntityId: 'billing-entity-1',
      consolidateInvoice: false,
      paymentMethod: { paymentMethodId: 'payment-method-1', paymentMethodType: 'provider' },
      purchaseOrderNumber: 'PO-42',
      startedAt: '2099-01-01T00:00:00.000Z',
      endedAt: '2099-02-01T00:00:00.000Z',
      billingAnchorDate: '2099-01-01',
    })
  })

  it('omits empty optional values', () => {
    expect(buildCreateContractInput(clearedValues)).toEqual(
      expect.objectContaining({
        externalId: undefined,
        name: undefined,
        billingEntityId: undefined,
        purchaseOrderNumber: undefined,
        endedAt: undefined,
      }),
    )
  })
})

describe('buildUpdateContractInput', () => {
  it('builds the update input keyed on the contract external id, without the customer', () => {
    const input = buildUpdateContractInput(values, 'external-contract-1')

    expect(input).toEqual({
      externalId: 'external-contract-1',
      planCode: 'enterprise',
      name: 'Enterprise agreement',
      billingEntityId: 'billing-entity-1',
      consolidateInvoice: false,
      paymentMethod: { paymentMethodId: 'payment-method-1', paymentMethodType: 'provider' },
      purchaseOrderNumber: 'PO-42',
      startedAt: '2099-01-01T00:00:00.000Z',
      endedAt: '2099-02-01T00:00:00.000Z',
      billingAnchorDate: '2099-01-01',
    })
    expect(input).not.toHaveProperty('externalCustomerId')
  })

  // `undefined` is stripped from the request and the service only writes present keys, so a
  // cleared field would silently keep its stored value.
  it('sends null for every cleared optional value', () => {
    expect(buildUpdateContractInput(clearedValues, 'external-contract-1')).toEqual(
      expect.objectContaining({
        externalId: 'external-contract-1',
        name: null,
        billingEntityId: null,
        purchaseOrderNumber: null,
        endedAt: null,
      }),
    )
  })
})
