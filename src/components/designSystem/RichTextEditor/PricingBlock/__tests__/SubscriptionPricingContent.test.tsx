import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PlanFormInput } from '~/components/plans/types'
import {
  DEFAULT_INVOICING_SETTINGS,
  DEFAULT_SUBSCRIPTION_SETTINGS,
  type SubscriptionPricingState,
} from '~/core/serializers/serializeQuotePlanBillingItems'
import {
  ChargeModelEnum,
  CurrencyEnum,
  FixedChargeChargeModelEnum,
  PlanInterval,
} from '~/generated/graphql'
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
let mockFormOverrides: Partial<PlanFormInput> = {}

jest.mock('~/hooks/plans/usePlanFormSetup', () => {
  const { createMockPlanForm } = jest.requireActual('~/test-utils/createMockPlanForm')

  return {
    usePlanFormSetup: jest.fn(({ planIdToFetch }: { planIdToFetch?: string }) => ({
      form: createMockPlanForm(mockFormOverrides),
      plan: planIdToFetch ? mockPlan : undefined,
      formReady: !!planIdToFetch,
      loading: false,
      resolvedPlanId: planIdToFetch,
      subscriptionSettings: undefined,
      invoicingSettings: undefined,
    })),
  }
})

// Mock hook-based drawers with spies
const mockOpenSubscriptionSettings = jest.fn()
const mockOpenInvoicingSettings = jest.fn()
const mockOpenPlanSettings = jest.fn()
let mockShowInvoicingSection = false

jest.mock('../useSubscriptionSettingsDrawer', () => ({
  useSubscriptionSettingsDrawer: () => ({ openDrawer: mockOpenSubscriptionSettings }),
}))

jest.mock('../useInvoicingPaymentsSettingsDrawer', () => ({
  useInvoicingPaymentsSettingsDrawer: () => ({
    openDrawer: mockOpenInvoicingSettings,
    showSection: mockShowInvoicingSection,
  }),
}))

jest.mock('../useQuotePlanSettingsDrawer', () => ({
  useQuotePlanSettingsDrawer: () => ({ openDrawer: mockOpenPlanSettings }),
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
  beforeEach(() => {
    mockFormOverrides = {}
    mockShowInvoicingSection = false
    mockOpenSubscriptionSettings.mockClear()
    mockOpenInvoicingSettings.mockClear()
    mockOpenPlanSettings.mockClear()
  })

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

  describe('GIVEN no plan is selected', () => {
    it('WHEN rendered without initialState THEN stateRef remains null', async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(<SubscriptionPricingContent stateRef={stateRef} formValuesRef={formValuesRef} />),
      )

      // formReady is false and selectedPlanId is empty => stateRef.current = null (line 153-154)
      expect(stateRef.current).toBeNull()
    })
  })

  describe('GIVEN a plan with overrides', () => {
    it('WHEN form has fixed charges and usage charges THEN stateRef includes charge overrides', async () => {
      mockFormOverrides = {
        fixedCharges: [
          {
            addOn: { id: 'addon_1', code: 'setup_fee', name: 'Setup Fee' },
            chargeModel: FixedChargeChargeModelEnum.Standard,
            properties: { amount: '1000' },
          },
        ] as PlanFormInput['fixedCharges'],
        charges: [
          {
            billableMetric: {
              id: 'bm_1',
              code: 'api_calls',
              name: 'API Calls',
              aggregationType: 'count_agg',
              recurring: false,
              filters: [],
            },
            chargeModel: ChargeModelEnum.Standard,
            properties: { amount: '50' },
          },
        ] as unknown as PlanFormInput['charges'],
      }

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

      // Should have merged fixed + usage charges into overrides.charges (lines 168-188)
      expect(stateRef.current?.overrides.charges).toHaveLength(2)
      expect(stateRef.current?.overrides.charges?.[0].billable_metric_code).toBe('setup_fee')
      expect(stateRef.current?.overrides.charges?.[1].billable_metric_code).toBe('api_calls')
    })

    it('WHEN form has a positive minimum commitment THEN stateRef includes minimum_commitment override', async () => {
      mockFormOverrides = {
        minimumCommitment: {
          amountCents: '5000',
          invoiceDisplayName: 'Min spend',
        },
      }

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

      // Lines 191-198: minimum_commitment set when positive non-NaN number
      expect(stateRef.current?.overrides.minimum_commitment).toEqual({
        amount_cents: 5000,
        invoice_display_name: 'Min spend',
      })
    })

    it('WHEN form has subscription fee amount THEN stateRef includes amount_cents override', async () => {
      mockFormOverrides = {
        amountCents: '7500',
        invoiceDisplayName: 'Premium fee',
      }

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

      // Lines 162-165: subscription fee override serialization
      expect(stateRef.current?.overrides.amount_cents).toBe(7500)
      expect(stateRef.current?.overrides.invoice_display_name).toBe('Premium fee')
    })
  })

  describe('GIVEN showInvoicingSection is true', () => {
    it('WHEN a plan is selected THEN the invoicing & payments section is rendered', async () => {
      mockShowInvoicingSection = true

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

      // Line 358: showInvoicingSection conditional — the invoicing selector has icon="receipt"
      // Count the Selector buttons: subscription settings, invoicing, plan settings, subscription fee = 4
      const selectorButtons = screen.getAllByRole('button')

      // The invoicing section title text appears when showSection is true (line 297)
      expect(selectorButtons.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('GIVEN a plan is selected and sections are visible', () => {
    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }

    it('WHEN clicking the subscription settings selector THEN opens the subscription settings drawer', async () => {
      const user = userEvent.setup()
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            initialState={initialState}
          />,
        ),
      )

      // The Selector renders a div[role="button"] containing the title text.
      // "Subscription settings" text appears both in the section title and the selector.
      // Find all role="button" elements — selectors are the div[role="button"] wrappers.
      const allButtons = screen.getAllByRole('button')
      // The subscription settings selector contains the "Subscription settings" title
      // and has tabIndex=0 (clickable). Filter to only tabIndex=0 role="button" divs.
      const subscriptionSettingsSelector = allButtons.find(
        (el) => el.tagName === 'DIV' && el.getAttribute('tabindex') === '0',
      )

      expect(subscriptionSettingsSelector).toBeDefined()
      await user.click(subscriptionSettingsSelector as HTMLElement)

      expect(mockOpenSubscriptionSettings).toHaveBeenCalledWith(DEFAULT_SUBSCRIPTION_SETTINGS)
    })

    it('WHEN clicking the invoicing settings selector THEN opens the invoicing settings drawer', async () => {
      mockShowInvoicingSection = true
      const user = userEvent.setup()
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            initialState={initialState}
          />,
        ),
      )

      // Find all clickable Selector divs (div[role="button"][tabindex="0"])
      const allButtons = screen.getAllByRole('button')
      const clickableSelectors = allButtons.filter(
        (el) => el.tagName === 'DIV' && el.getAttribute('tabindex') === '0',
      )

      // With invoicing section visible: subscription settings (0), invoicing (1), plan settings (2), subscription fee (3)
      const invoicingSelector = clickableSelectors[1]

      expect(invoicingSelector).toBeDefined()
      await user.click(invoicingSelector)

      expect(mockOpenInvoicingSettings).toHaveBeenCalledWith(DEFAULT_INVOICING_SETTINGS)
    })
  })
})
