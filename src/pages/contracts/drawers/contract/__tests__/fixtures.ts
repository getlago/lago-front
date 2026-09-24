import {
  ContractForContractDrawerFragment,
  ContractStatusEnum,
  PaymentMethodTypeEnum,
  TimezoneEnum,
} from '~/generated/graphql'

export const contractForDrawerFixture: ContractForContractDrawerFragment = {
  __typename: 'Contract',
  id: 'contract-1',
  externalId: 'external-contract-1',
  name: 'Enterprise agreement',
  status: ContractStatusEnum.Active,
  startedAt: '2026-01-01T00:00:00Z',
  endedAt: '2099-12-31T00:00:00Z',
  billingAnchorDate: '2026-01-15',
  billingEntityId: 'billing-entity-2',
  consolidateInvoice: true,
  purchaseOrderNumber: 'PO-42',
  paymentMethodType: PaymentMethodTypeEnum.Provider,
  paymentMethod: { __typename: 'PaymentMethod', id: 'payment-method-1' },
  customer: {
    __typename: 'Customer',
    id: 'customer-1',
    externalId: 'external-customer-1',
    displayName: 'Acme',
    applicableTimezone: TimezoneEnum.TzUtc,
    billingEntity: { __typename: 'BillingEntity', id: 'billing-entity-1' },
  },
  plan: { __typename: 'CatalogPlan', id: 'plan-1', name: 'Enterprise plan', code: 'enterprise' },
}
