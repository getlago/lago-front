import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { ReactNode } from 'react'

import {
  CurrencyEnum,
  CustomerAccountTypeEnum,
  PlanInterval,
  StatusTypeEnum,
  TimezoneEnum,
  UpdateSubscriptionDocument,
  UpdateSubscriptionMutation,
  UpdateSubscriptionMutationVariables,
} from '~/generated/graphql'

import { useUpdateSubscriptionPlanOverride } from '../useUpdateSubscriptionPlanOverride'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const SUB_ID = 'sub_1'

const updatedSubscription: NonNullable<UpdateSubscriptionMutation['updateSubscription']> = {
  __typename: 'Subscription',
  id: SUB_ID,
  status: StatusTypeEnum.Active,
  cancellationReason: null,
  startedAt: '2024-01-01T00:00:00Z',
  subscriptionAt: '2024-01-01T00:00:00Z',
  endingAt: null,
  name: null,
  purchaseOrderNumber: null,
  externalId: 'external_sub_1',
  activationRules: [],
  paymentMethodType: null,
  paymentMethod: null,
  consolidateInvoice: false,
  skipInvoiceCustomSections: false,
  selectedInvoiceCustomSections: [],
  customer: {
    __typename: 'Customer',
    id: 'customer_1',
    activeSubscriptionsCount: 1,
    customerType: null,
    name: 'Customer',
    displayName: 'Customer',
    firstname: null,
    lastname: null,
    externalId: 'external_customer_1',
    hasActiveWallet: false,
    currency: CurrencyEnum.Usd,
    hasCreditNotes: false,
    applicableTimezone: TimezoneEnum.TzUtc,
    hasOverdueInvoices: false,
    accountType: CustomerAccountTypeEnum.Customer,
    addressLine1: null,
    addressLine2: null,
    canEditAttributes: true,
    city: null,
    country: null,
    email: null,
    externalSalesforceId: null,
    legalName: null,
    legalNumber: null,
    taxIdentificationNumber: null,
    phone: null,
    state: null,
    timezone: null,
    zipcode: null,
    url: null,
    paymentProvider: null,
    paymentProviderCode: null,
    creditNotesBalances: [],
    shippingAddress: null,
    metadata: [],
    billingEntity: {
      __typename: 'BillingEntity',
      id: 'billing_entity_1',
      code: 'billing_entity_1',
      name: 'Billing entity',
      euTaxManagement: false,
    },
    anrokCustomer: null,
    avalaraCustomer: null,
    netsuiteCustomer: null,
    providerCustomer: null,
    xeroCustomer: null,
    hubspotCustomer: null,
    salesforceCustomer: null,
  },
  plan: {
    __typename: 'Plan',
    id: 'plan_override_1',
    name: 'Plan',
    code: 'plan_1',
    interval: PlanInterval.Monthly,
  },
}

const wrapper = (mocks: MockedResponse[]) =>
  function W({ children }: { children: ReactNode }) {
    return (
      // errorPolicy 'all' mirrors the app client: GraphQL errors resolve in
      // `result.errors` rather than throwing.
      <MockedProvider
        mocks={mocks}
        addTypename={false}
        defaultOptions={{ mutate: { errorPolicy: 'all' } }}
      >
        {children}
      </MockedProvider>
    )
  }

describe('useUpdateSubscriptionPlanOverride', () => {
  it('fires updateSubscription with planOverrides and no charges array, and returns true', async () => {
    let captured: Record<string, unknown> | undefined
    const mock: MockedResponse<UpdateSubscriptionMutation, UpdateSubscriptionMutationVariables> = {
      request: { query: UpdateSubscriptionDocument },
      variableMatcher: (vars) => {
        captured = vars?.input
        return vars?.input?.id === SUB_ID
      },
      result: { data: { updateSubscription: updatedSubscription } },
    }

    const { result } = renderHook(
      () => useUpdateSubscriptionPlanOverride({ subscriptionId: SUB_ID }),
      { wrapper: wrapper([mock]) },
    )

    let success: boolean | undefined

    await act(async () => {
      success = await result.current.updatePlanOverride({ description: 'Edited' })
    })

    await waitFor(() => expect(captured).toBeDefined())
    expect(success).toBe(true)
    expect(
      (captured as { planOverrides?: { description?: string } }).planOverrides?.description,
    ).toBe('Edited')
    expect(
      (captured as { planOverrides?: { charges?: unknown } }).planOverrides?.charges,
    ).toBeUndefined()
  })

  it('returns false when the backend rejects the override (drawer must stay open)', async () => {
    const mock: MockedResponse<UpdateSubscriptionMutation, UpdateSubscriptionMutationVariables> = {
      request: { query: UpdateSubscriptionDocument },
      variableMatcher: () => true,
      result: { errors: [new GraphQLError('Unprocessable entity')] },
    }

    const { result } = renderHook(
      () => useUpdateSubscriptionPlanOverride({ subscriptionId: SUB_ID }),
      { wrapper: wrapper([mock]) },
    )

    let success: boolean | undefined

    await act(async () => {
      success = await result.current.updatePlanOverride({ description: 'Edited' })
    })

    expect(success).toBe(false)
  })
})
