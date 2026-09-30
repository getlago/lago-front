import { PaymentMethodTypeEnum } from '~/generated/graphql'

import { buildCreateContractInput } from '../buildContractInput'
import { ContractFormValues } from '../constants'

const values: ContractFormValues = {
  externalCustomerId: 'customer-external-id',
  externalId: 'customer-contract-id',
  planCode: 'enterprise',
  isPlanRequired: true,
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
  billingAnchorDate: undefined,
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
        billingAnchorDate: undefined,
      }),
    )
  })
})
