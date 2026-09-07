import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { act, renderHook, waitFor } from '@testing-library/react'
import { ReactNode } from 'react'

import { LocalUsageChargeInput } from '~/components/plans/types'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  UpdateSubscriptionChargeDocument,
  UpdateSubscriptionChargeMutation,
  UpdateSubscriptionChargeMutationVariables,
} from '~/generated/graphql'

import { useSubscriptionChargeMutations } from '../useSubscriptionChargeMutations'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (k: string) => k }),
}))

const SUB_ID = 'sub_1'

const updatedCharge: NonNullable<UpdateSubscriptionChargeMutation['updateSubscriptionCharge']> = {
  __typename: 'Charge',
  id: 'ch_override_1',
  code: 'api_calls',
  chargeModel: ChargeModelEnum.Standard,
  invoiceable: true,
  invoiceDisplayName: 'API',
  minAmountCents: '0',
  payInAdvance: false,
  prorated: false,
  regroupPaidFees: null,
  properties: {
    __typename: 'Properties',
    amount: '12',
    packageSize: null,
    freeUnits: null,
    pricingGroupKeys: null,
    fixedAmount: null,
    freeUnitsPerEvents: null,
    freeUnitsPerTotalAggregation: null,
    rate: null,
    perTransactionMinAmount: null,
    perTransactionMaxAmount: null,
    customProperties: null,
    graduatedRanges: null,
    graduatedPercentageRanges: null,
    volumeRanges: null,
    presentationGroupKeys: null,
  },
  filters: [],
  appliedPricingUnit: null,
  billableMetric: {
    __typename: 'BillableMetric',
    id: 'bm_1',
    name: 'API calls',
    code: 'api_calls',
    aggregationType: AggregationTypeEnum.CountAgg,
    recurring: false,
    filters: [],
  },
  taxes: [],
}

const buildCharge = (overrides: Partial<LocalUsageChargeInput> = {}): LocalUsageChargeInput =>
  ({
    id: 'ch_1',
    code: 'api_calls',
    chargeModel: ChargeModelEnum.Standard,
    invoiceDisplayName: 'API',
    invoiceable: true,
    payInAdvance: false,
    prorated: false,
    minAmountCents: '0',
    regroupPaidFees: null,
    properties: { amount: '12' },
    filters: [],
    taxes: [],
    billableMetric: { id: 'bm_1', code: 'api_calls' },
    ...overrides,
  }) as unknown as LocalUsageChargeInput

const wrapper = (mocks: MockedResponse[]) =>
  function W({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    )
  }

describe('useSubscriptionChargeMutations', () => {
  it('fires updateSubscriptionCharge with subscriptionId + chargeCode', async () => {
    let called = false
    const updateMock: MockedResponse<
      UpdateSubscriptionChargeMutation,
      UpdateSubscriptionChargeMutationVariables
    > = {
      request: { query: UpdateSubscriptionChargeDocument },
      variableMatcher: (vars) =>
        vars?.input?.subscriptionId === SUB_ID && vars?.input?.chargeCode === 'api_calls',
      result: () => {
        called = true
        return { data: { updateSubscriptionCharge: updatedCharge } }
      },
    }

    const { result } = renderHook(
      () => useSubscriptionChargeMutations({ subscriptionId: SUB_ID, currency: CurrencyEnum.Usd }),
      { wrapper: wrapper([updateMock]) },
    )

    await act(async () => {
      await result.current.handleSaveCharge(buildCharge())
    })

    await waitFor(() => expect(called).toBe(true))
  })
})
