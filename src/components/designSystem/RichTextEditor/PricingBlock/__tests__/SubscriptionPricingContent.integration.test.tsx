import { act, renderHook } from '@testing-library/react'

import type { PlanFormInput } from '~/components/plans/types'
import {
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  type SubscriptionPricingState,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import {
  AggregationTypeEnum,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
} from '~/generated/graphql'
import { usePlanFormSetup } from '~/hooks/plans/usePlanFormSetup'
import { useSubscriptionPricingDrawer } from '~/pages/quotes/hooks/useSubscriptionPricingDrawer'
import { render } from '~/test-utils'

import { SubscriptionPricingContent } from '../SubscriptionPricingContent'

const mockOpen = jest.fn()
const mockGetPlans = jest.fn()
const mockPlan = {
  id: 'plan_1',
  name: 'Starter',
  code: 'starter',
  amountCurrency: CurrencyEnum.Usd,
}
const mockDefaultValues: PlanFormInput = {
  name: 'Starter',
  code: 'starter',
  description: '',
  interval: PlanInterval.Yearly,
  amountCents: '100',
  amountCurrency: CurrencyEnum.Usd,
  payInAdvance: false,
  trialPeriod: 0,
  taxes: [],
  billChargesMonthly: true,
  billFixedChargesMonthly: false,
  fixedCharges: [],
  charges: [
    {
      billableMetric: {
        id: 'bm_1',
        code: 'api_calls',
        name: 'API Calls',
        aggregationType: AggregationTypeEnum.CountAgg,
        recurring: false,
        filters: [],
      },
      chargeModel: ChargeModelEnum.Standard,
      properties: { amount: '50' },
      invoiceable: true,
      filters: [],
    },
  ],
  minimumCommitment: { amountCents: '100' },
  entitlements: [],
}

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: jest.fn() }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansLazyQuery: () => [
    mockGetPlans,
    { data: { plans: { collection: [mockPlan] } }, loading: false },
  ],
  useGetSinglePlanQuery: () => ({ data: { plan: mockPlan }, loading: false }),
  useGetSubscriptionForQuotePricingQuery: () => ({ data: undefined }),
}))

jest.mock('~/hooks/plans/usePlanForm', () => ({
  buildDefaultValues: () => mockDefaultValues,
}))

jest.mock('~/hooks/plans/usePlanFormSetup', () => {
  const actual = jest.requireActual('~/hooks/plans/usePlanFormSetup')

  return { ...actual, usePlanFormSetup: jest.fn(actual.usePlanFormSetup) }
})

jest.mock('../useSubscriptionSettingsDrawer', () => ({
  useSubscriptionSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('../useQuotePlanSettingsDrawer', () => ({
  useQuotePlanSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('../QuoteInvoicingPaymentsSettings', () => ({
  QuoteInvoicingPaymentsSettings: () => null,
}))

jest.mock('~/components/plans/form/FixedChargesSection', () => ({
  FixedChargesSection: () => null,
}))

jest.mock('~/components/plans/UsageChargesSection', () => ({
  UsageChargesSection: () => null,
}))

jest.mock('~/components/plans/CommitmentsSection', () => ({
  CommitmentsSection: () => null,
}))

jest.mock('~/components/plans/ProgressiveBillingSection', () => ({
  ProgressiveBillingSection: () => null,
}))

jest.mock('~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer', () => ({
  SubscriptionFeeDrawer: () => null,
}))

const initialState: SubscriptionPricingState = {
  planId: 'plan_1',
  planCode: 'starter',
  planName: 'Starter',
  planDescription: '',
  subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
  invoicingSettings: DEFAULT_INVOICING_SETTINGS,
}

const getPlanForm = (): ReturnType<typeof usePlanFormSetup>['form'] => {
  const setup = jest.mocked(usePlanFormSetup).mock.results.at(-1)

  if (setup?.type !== 'return') throw new Error('Plan form was not initialized')

  return setup.value.form
}

describe('SubscriptionPricingContent with the real plan setup hook', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saves current nested overrides without rerendering the pricing content', async () => {
    const { result } = renderHook(() => useSubscriptionPricingDrawer())
    const onSave = jest.fn().mockResolvedValue({ ok: true })

    act(() => result.current.onPricingCommand({ onSave }))
    const opened = mockOpen.mock.calls[0][0]
    const rendered = render(
      <SubscriptionPricingContent {...opened.children.props} initialState={initialState} />,
    )
    const form = getPlanForm()
    const rendersBeforeEdit = jest.mocked(usePlanFormSetup).mock.calls.length

    act(() => {
      form.setFieldValue('charges[0].properties.amount', '75')
      form.setFieldValue('minimumCommitment.amountCents', '200')
    })

    expect(jest.mocked(usePlanFormSetup).mock.calls).toHaveLength(rendersBeforeEdit)
    expect(form.state.values.billChargesMonthly).toBe(true)
    await act(async () => opened.form.submit())

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][2].plans[0].overrides).toEqual({
      charges: [
        {
          billableMetricCode: 'api_calls',
          chargeModel: ChargeModelEnum.Standard,
          properties: { amount: '75' },
        },
      ],
      minimumCommitment: { amountCents: 20000 },
    })
    expect(mockDefaultValues.charges[0].properties?.amount).toBe('50')
    rendered.unmount()
  })

  it('clears the live snapshot on unmount and ignores later updates', () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }
    const basePlanFormValuesRef = { current: null as PlanFormInput | null }
    const rendered = render(
      <SubscriptionPricingContent
        stateRef={stateRef}
        formValuesRef={formValuesRef}
        basePlanFormValuesRef={basePlanFormValuesRef}
        initialState={initialState}
      />,
    )
    const form = getPlanForm()

    expect(formValuesRef.current).not.toBeNull()
    rendered.unmount()
    act(() => form.setFieldValue('minimumCommitment.amountCents', '500'))
    expect(formValuesRef.current).toBeNull()
  })

  it.each(['charges', 'interval'] as const)(
    'resets monthly billing when annual usage billing loses its %s condition',
    async (condition) => {
      const { result } = renderHook(() => usePlanFormSetup({ planIdToFetch: 'plan_1' }))
      const form = result.current.form

      expect(form.state.values.billChargesMonthly).toBe(true)

      await act(async () => {
        if (condition === 'charges') {
          await form.removeFieldValue('charges', 0)
        } else {
          form.setFieldValue('interval', PlanInterval.Monthly)
        }
      })

      expect(form.state.values.billChargesMonthly).toBe(false)
    },
  )
})
