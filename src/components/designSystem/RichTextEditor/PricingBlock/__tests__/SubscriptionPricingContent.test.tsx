import { act, screen } from '@testing-library/react'

import type { PlanFormInput } from '~/components/plans/types'
import {
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  type SubscriptionPricingState,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { render } from '~/test-utils'

import { SubscriptionPricingContent } from '../SubscriptionPricingContent'

const mockPlan = {
  id: 'plan_1',
  name: 'Starter',
  code: 'starter',
  description: '',
  interval: PlanInterval.Monthly,
  amountCents: '5000',
  amountCurrency: CurrencyEnum.Usd,
  payInAdvance: false,
  invoiceDisplayName: '',
  trialPeriod: 0,
  fixedCharges: [],
  charges: [],
  minimumCommitment: null,
  usageThresholds: [],
  subscriptionsCount: 0,
  billChargesMonthly: false,
  hasOverriddenPlans: false,
  billFixedChargesMonthly: false,
  taxes: [],
  entitlements: [],
}

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansQuery: jest.fn(() => ({
    data: {
      plans: {
        collection: [{ id: 'plan_1', name: 'Starter', code: 'starter' }],
      },
    },
    loading: false,
  })),
}))

// Mock usePlanFormSetup — returns a mock form + plan when planIdToFetch is set
jest.mock('~/hooks/plans/usePlanFormSetup', () => {
  const { createMockPlanForm } = jest.requireActual('~/test-utils/createMockPlanForm')

  return {
    usePlanFormSetup: jest.fn(({ planIdToFetch }: { planIdToFetch?: string }) => ({
      form: createMockPlanForm(),
      plan: planIdToFetch ? mockPlan : undefined,
      formReady: !!planIdToFetch,
      loading: false,
      resolvedPlanId: planIdToFetch,
      subscriptionSettings: undefined,
      invoicingSettings: undefined,
    })),
  }
})

// Mock hook-based drawers
jest.mock('../useSubscriptionSettingsDrawer', () => ({
  useSubscriptionSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('../useInvoicingPaymentsSettingsDrawer', () => ({
  useInvoicingPaymentsSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

jest.mock('../useQuotePlanSettingsDrawer', () => ({
  useQuotePlanSettingsDrawer: () => ({ openDrawer: jest.fn() }),
}))

// Mock reused section components
jest.mock('~/components/plans/form/FixedChargesSection', () => ({
  FixedChargesSection: () => <div data-test="fixed-charges-section">Fixed Charges</div>,
}))

jest.mock('~/components/plans/UsageChargesSection', () => ({
  UsageChargesSection: () => <div data-test="usage-charges-section">Usage Charges</div>,
}))

jest.mock('~/components/plans/CommitmentsSection', () => ({
  CommitmentsSection: () => <div data-test="commitments-section">Commitments</div>,
}))

jest.mock('~/components/plans/ProgressiveBillingSection', () => ({
  ProgressiveBillingSection: () => (
    <div data-test="progressive-billing-section">Progressive Billing</div>
  ),
}))

jest.mock('~/components/plans/drawers/subscriptionFee/SubscriptionFeeDrawer', () => ({
  SubscriptionFeeDrawer: () => null,
}))

describe('SubscriptionPricingContent', () => {
  it('shows plan selection ComboBox without initial data', async () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }

    await act(() =>
      render(<SubscriptionPricingContent stateRef={stateRef} formValuesRef={formValuesRef} />),
    )

    // Should show ComboBox for plan selection
    expect(screen.getByText('Plan')).toBeInTheDocument()
    // Should not show sections since no plan is selected
    expect(screen.queryByTestId('fixed-charges-section')).not.toBeInTheDocument()
  })

  it('shows sections when initial plan is provided', async () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }

    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }

    await act(() =>
      render(
        <SubscriptionPricingContent
          stateRef={stateRef}
          formValuesRef={formValuesRef}
          initialState={initialState}
        />,
      ),
    )

    // Should show both the ComboBox and the sections
    expect(screen.getByText('Plan')).toBeInTheDocument()
    expect(screen.getByTestId('fixed-charges-section')).toBeInTheDocument()
    expect(screen.getByTestId('usage-charges-section')).toBeInTheDocument()
    expect(screen.getByTestId('commitments-section')).toBeInTheDocument()
    expect(screen.getByTestId('progressive-billing-section')).toBeInTheDocument()
  })

  it('syncs state to stateRef when plan is selected', async () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }

    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }

    await act(() =>
      render(
        <SubscriptionPricingContent
          stateRef={stateRef}
          formValuesRef={formValuesRef}
          initialState={initialState}
        />,
      ),
    )

    expect(stateRef.current).not.toBeNull()
    expect(stateRef.current?.planId).toBe('plan_1')
  })
})
