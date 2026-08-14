import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PlanFormInput } from '~/components/plans/types'
import {
  type BillingItemPlan,
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
import { usePlanFormSetup } from '~/hooks/plans/usePlanFormSetup'
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

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 56,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: String(i),
        start: i * 56,
        size: 56,
      })),
    scrollToIndex: jest.fn(),
    measureElement: jest.fn(),
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: (searchQuery: unknown) => ({
    debouncedSearch: searchQuery,
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansLazyQuery: jest.fn(() => [
    jest.fn(),
    {
      data: {
        plans: {
          collection: [
            { id: 'plan_1', name: 'Starter', code: 'starter' },
            { id: 'plan_2', name: 'Pro', code: 'pro' },
          ],
        },
      },
      loading: false,
    },
  ]),
}))

// Mock usePlanFormSetup — returns a mock form + plan when planIdToFetch is set
let mockFormOverrides: Partial<PlanFormInput> = {}
let mockBasePlanFormValues: PlanFormInput | undefined

// Mirrors TanStack: handleSubmit only invokes onSubmit once the form-level
// validators pass, which is what the component uses as its validity signal.
let mockFormPassesValidation = true

// Amendment path: while the quote still amends a subscription, the hook resolves the plan
// (and the subscription settings) from that subscription instead of planIdToFetch, and both
// only land once the query resolves — after mount.
let mockSubscriptionPlanId: string | undefined
let mockSubscriptionSettings: SubscriptionPricingState['subscriptionSettings'] | undefined
// The plan the form displays. When the quote amends a subscription running an overridden
// plan — or was saved from such an amendment — this is the override child plan, which is
// absent from the catalog list.
let mockDisplayedPlan: typeof mockPlan | undefined
// The catalog plan the hook resolves, when a test needs one that is not derived from the
// resolved plan id (an override child resolves to its parent).
let mockCatalogPlan: typeof mockPlan | undefined

// Default catalog plan for a given id — plan_1/plan_2 mirror the mocked plans query
// collection, any other id stands for a plan outside the current search page.
const mockBuildCatalogPlan = (id: string): typeof mockPlan => {
  const catalog: Record<string, { name: string; code: string }> = {
    plan_1: { name: 'Starter', code: 'starter' },
    plan_2: { name: 'Pro', code: 'pro' },
  }

  return { ...mockPlan, id, ...(catalog[id] ?? { name: `Catalog ${id}`, code: id }) }
}

jest.mock('~/hooks/plans/usePlanFormSetup', () => {
  const { createMockPlanForm } = jest.requireActual('~/test-utils/createMockPlanForm')

  return {
    usePlanFormSetup: jest.fn(
      ({
        planIdToFetch,
        subscriptionId,
        onSubmit,
      }: {
        planIdToFetch?: string
        subscriptionId?: string
        onSubmit?: (value: PlanFormInput) => void
      }) => {
        const form = createMockPlanForm(mockFormOverrides)

        form.handleSubmit = jest.fn(async () => {
          if (mockFormPassesValidation) {
            onSubmit?.(form.state.values)
          }
        })

        // The subscription's own plan wins over planIdToFetch as long as the
        // subscription is still forwarded.
        const resolvedPlanId = (subscriptionId && mockSubscriptionPlanId) || planIdToFetch

        // `plan` is what the form displays — possibly an override child plan — while
        // `catalogPlan` is always the plan listed on the Plans page behind it.
        const catalogPlan =
          mockCatalogPlan ?? (resolvedPlanId ? mockBuildCatalogPlan(resolvedPlanId) : undefined)

        return {
          form,
          plan: resolvedPlanId ? (mockDisplayedPlan ?? mockPlan) : undefined,
          catalogPlan,
          basePlanFormValues: mockBasePlanFormValues,
          formReady: !!resolvedPlanId,
          loading: false,
          resolvedPlanId,
          subscriptionSettings: subscriptionId ? mockSubscriptionSettings : undefined,
          invoicingSettings: undefined,
        }
      },
    ),
  }
})

// Mock hook-based drawers with spies
const mockOpenSubscriptionSettings = jest.fn()
const mockOpenPlanSettings = jest.fn()

jest.mock('../useSubscriptionSettingsDrawer', () => ({
  useSubscriptionSettingsDrawer: () => ({ openDrawer: mockOpenSubscriptionSettings }),
}))

// Mock the new invoicing/payments settings component with a visibility marker.
jest.mock('../QuoteInvoicingPaymentsSettings', () => ({
  QuoteInvoicingPaymentsSettings: () => (
    <div data-test="quote-invoicing-payments-settings">Invoicing & payments</div>
  ),
}))

const mockUseQuotePlanSettingsDrawer = jest.fn()

jest.mock('../useQuotePlanSettingsDrawer', () => ({
  useQuotePlanSettingsDrawer: (...args: unknown[]) => {
    mockUseQuotePlanSettingsDrawer(...args)

    return { openDrawer: mockOpenPlanSettings }
  },
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
    mockFormPassesValidation = true
    mockBasePlanFormValues = undefined
    mockSubscriptionPlanId = undefined
    mockSubscriptionSettings = undefined
    mockDisplayedPlan = undefined
    mockCatalogPlan = undefined
    mockOpenSubscriptionSettings.mockClear()
    mockOpenPlanSettings.mockClear()
  })

  // The options live in the popper, outside the element `aria-controls` points at, so they
  // are queried document-wide. The ComboBox sorts them alphabetically by label.
  const openPlanOptions = async (): Promise<string[]> => {
    await userEvent.click(screen.getByRole('combobox'))

    await waitFor(() => {
      expect(screen.getAllByRole('option').length).toBeGreaterThan(0)
    })

    return screen.getAllByRole('option').map((option) => option.textContent ?? '')
  }

  it('shows plan selection ComboBox without initial data', async () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }
    const basePlanFormValuesRef = { current: null as PlanFormInput | null }

    await act(() =>
      render(
        <SubscriptionPricingContent
          stateRef={stateRef}
          formValuesRef={formValuesRef}
          basePlanFormValuesRef={basePlanFormValuesRef}
        />,
      ),
    )

    // Should show ComboBox for plan selection
    expect(screen.getByText('Plan')).toBeInTheDocument()
    // Should not show sections since no plan is selected
    expect(screen.queryByTestId('fixed-charges-section')).not.toBeInTheDocument()
  })

  it('shows sections when initial plan is provided', async () => {
    const stateRef = { current: null as SubscriptionPricingState | null }
    const formValuesRef = { current: null as PlanFormInput | null }
    const basePlanFormValuesRef = { current: null as PlanFormInput | null }

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
          basePlanFormValuesRef={basePlanFormValuesRef}
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
    const basePlanFormValuesRef = { current: null as PlanFormInput | null }

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
          basePlanFormValuesRef={basePlanFormValuesRef}
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
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
          />,
        ),
      )

      // formReady is false and selectedPlanId is empty => stateRef.current = null (line 153-154)
      expect(stateRef.current).toBeNull()
    })
  })

  describe('GIVEN a plan with custom form values', () => {
    // Overrides are no longer computed here — the component snapshots the live
    // form values into formValuesRef and toPlanBillingItems derives the overrides
    // from them (see buildPlanOverrides tests in the serializer suite).
    it('WHEN form has fixed charges and usage charges THEN formValuesRef captures them', async () => {
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
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      const initialState: SubscriptionPricingState = {
        planId: 'plan_1',
        planCode: 'starter',
        planName: 'Starter',
        planDescription: '',
        subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
        invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
          />,
        ),
      )

      expect(formValuesRef.current?.fixedCharges).toHaveLength(1)
      expect(formValuesRef.current?.fixedCharges?.[0].addOn.code).toBe('setup_fee')
      expect(formValuesRef.current?.charges).toHaveLength(1)
      expect(formValuesRef.current?.charges?.[0].billableMetric.code).toBe('api_calls')
    })

    it('WHEN form has a minimum commitment THEN formValuesRef captures it', async () => {
      mockFormOverrides = {
        minimumCommitment: {
          amountCents: '5000',
          invoiceDisplayName: 'Min spend',
        },
      }

      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      const initialState: SubscriptionPricingState = {
        planId: 'plan_1',
        planCode: 'starter',
        planName: 'Starter',
        planDescription: '',
        subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
        invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
          />,
        ),
      )

      expect(formValuesRef.current?.minimumCommitment?.amountCents).toBe('5000')
      expect(formValuesRef.current?.minimumCommitment?.invoiceDisplayName).toBe('Min spend')
    })

    it('WHEN form has a subscription fee amount THEN formValuesRef captures it', async () => {
      mockFormOverrides = {
        amountCents: '7500',
        invoiceDisplayName: 'Premium fee',
      }

      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      const initialState: SubscriptionPricingState = {
        planId: 'plan_1',
        planCode: 'starter',
        planName: 'Starter',
        planDescription: '',
        subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
        invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
          />,
        ),
      )

      expect(formValuesRef.current?.amountCents).toBe('7500')
      expect(formValuesRef.current?.invoiceDisplayName).toBe('Premium fee')
    })
  })

  describe('GIVEN a customer is provided', () => {
    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }
    const mockCustomer = { id: 'cust-1', externalId: 'ext-1', name: 'Acme' }

    it('WHEN a plan is selected THEN the invoicing & payments component is rendered', async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
            customer={mockCustomer}
          />,
        ),
      )

      expect(screen.getByTestId('quote-invoicing-payments-settings')).toBeInTheDocument()
    })

    it('WHEN no customer is provided THEN the invoicing & payments component is hidden', async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
          />,
        ),
      )

      expect(screen.queryByTestId('quote-invoicing-payments-settings')).not.toBeInTheDocument()
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
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
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
  })

  describe('GIVEN an existing draft quote being edited (billingItemPlan set)', () => {
    const billingItemPlan = {
      type: 'plan',
      id: 'plan_1',
      payload: {},
      overrides: {},
    } as unknown as BillingItemPlan

    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }

    it('WHEN the saved plan is an override THEN its parent is offered instead', async () => {
      // A quote saved from a subscription amendment stores the subscription's override
      // plan id, so the hook resolves the parent as the catalog plan (LAGO-1823).
      const overrideBillingItemPlan = {
        ...billingItemPlan,
        id: 'plan_1_override',
      } as unknown as BillingItemPlan

      mockDisplayedPlan = { ...mockPlan, id: 'plan_1_override', code: 'starter_override' }
      mockCatalogPlan = mockBuildCatalogPlan('plan_99')

      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            // The saved state carries the override id too, so the user has not switched plan
            initialState={{ ...initialState, planId: 'plan_1_override' }}
            billingItemPlan={overrideBillingItemPlan}
          />,
        ),
      )

      const options = await openPlanOptions()

      expect(options).toEqual(['Catalog plan_99 (plan_99)', 'Pro (pro)', 'Starter (starter)'])
    })

    it('WHEN the user switches to a different plan THEN billingItemPlan is dropped so prices reset', async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
            billingItemPlan={billingItemPlan}
          />,
        ),
      )

      // Initially the original plan is forwarded to the hook
      expect(usePlanFormSetup).toHaveBeenCalledWith(expect.objectContaining({ billingItemPlan }))

      // Switch the plan via the ComboBox — click opens the dropdown, then select Pro
      const combobox = screen.getByRole('combobox') as HTMLInputElement

      await userEvent.click(combobox)

      await waitFor(() => {
        expect(screen.getAllByRole('listbox').length).toBeGreaterThan(0)
      })

      const listboxId = combobox.getAttribute('aria-controls') as string
      const listbox = document.getElementById(listboxId) as HTMLElement

      await userEvent.click(within(listbox).getByText('Pro (pro)'))

      // After the switch, the hook is called WITHOUT billingItemPlan so it fetches plan_2 and resets
      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ billingItemPlan: undefined, planIdToFetch: 'plan_2' }),
      )
    })

    it('WHEN the user re-selects the original plan THEN billingItemPlan is preserved', async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
            billingItemPlan={billingItemPlan}
          />,
        ),
      )

      // No switch happened — original plan stays forwarded (saved customizations preserved)
      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ billingItemPlan, planIdToFetch: 'plan_1' }),
      )
    })
  })

  describe('GIVEN the quote owns a currency', () => {
    const renderWithQuoteCurrency = async (hasQuoteCurrency: boolean) => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            currency={CurrencyEnum.Eur}
            hasQuoteCurrency={hasQuoteCurrency}
          />,
        ),
      )
    }

    it('WHEN it does THEN the plan form uses it and its currency picker is locked', async () => {
      await renderWithQuoteCurrency(true)

      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ initialCurrency: CurrencyEnum.Eur }),
      )
      expect(mockUseQuotePlanSettingsDrawer).toHaveBeenLastCalledWith(expect.anything(), {
        disableCurrencyInput: true,
      })
    })

    it('WHEN it does not THEN the plan keeps its own currency and picker', async () => {
      await renderWithQuoteCurrency(false)

      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ initialCurrency: undefined }),
      )
      expect(mockUseQuotePlanSettingsDrawer).toHaveBeenLastCalledWith(expect.anything(), {
        disableCurrencyInput: false,
      })
    })
  })

  describe('GIVEN the drawer passes a validatePlanFormRef', () => {
    const renderWithValidateRef = async () => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const validatePlanFormRef = { current: null as (() => Promise<boolean>) | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      const rendered = await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            validatePlanFormRef={validatePlanFormRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
          />,
        ),
      )

      return { rendered, validatePlanFormRef }
    }

    describe('WHEN the component mounts', () => {
      it('THEN should fill the ref with a validation handle', async () => {
        const { validatePlanFormRef } = await renderWithValidateRef()

        expect(typeof validatePlanFormRef.current).toBe('function')
      })
    })

    describe('WHEN the plan form passes its validators', () => {
      it('THEN should report the form as valid', async () => {
        mockFormPassesValidation = true

        const { validatePlanFormRef } = await renderWithValidateRef()

        await expect(validatePlanFormRef.current?.()).resolves.toBe(true)
      })
    })

    describe('WHEN the plan form fails its validators', () => {
      it('THEN should report the form as invalid', async () => {
        mockFormPassesValidation = false

        const { validatePlanFormRef } = await renderWithValidateRef()

        await expect(validatePlanFormRef.current?.()).resolves.toBe(false)
      })

      it('THEN should report invalid again on a second attempt', async () => {
        mockFormPassesValidation = false

        const { validatePlanFormRef } = await renderWithValidateRef()

        await validatePlanFormRef.current?.()

        await expect(validatePlanFormRef.current?.()).resolves.toBe(false)
      })
    })

    describe('WHEN the component unmounts', () => {
      it('THEN should clear the ref', async () => {
        const { rendered, validatePlanFormRef } = await renderWithValidateRef()

        rendered.unmount()

        expect(validatePlanFormRef.current).toBeNull()
      })
    })
  })

  describe('GIVEN the override diff baseline', () => {
    const initialState: SubscriptionPricingState = {
      planId: 'plan_1',
      planCode: 'starter',
      planName: 'Starter',
      planDescription: '',
      subscriptionSettings: DEFAULT_SUBSCRIPTION_SETTINGS,
      invoicingSettings: DEFAULT_INVOICING_SETTINGS,
      overrides: {},
    }

    // Seed the base ref (optionally with a stale leftover) and render, returning the
    // refs so each test can assert how the sync effect wrote them.
    const renderWithRefs = async (basePlanFormValuesInit: PlanFormInput | null = null) => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: basePlanFormValuesInit }

      await act(() =>
        render(
          <SubscriptionPricingContent
            stateRef={stateRef}
            formValuesRef={formValuesRef}
            basePlanFormValuesRef={basePlanFormValuesRef}
            initialState={initialState}
          />,
        ),
      )

      return { stateRef, basePlanFormValuesRef }
    }

    it('WHEN the catalog plan values are available THEN basePlanFormValuesRef captures them', async () => {
      mockBasePlanFormValues = {
        name: 'Starter',
        code: 'starter',
        interval: PlanInterval.Monthly,
        amountCents: '5000',
        amountCurrency: CurrencyEnum.Usd,
        charges: [],
        fixedCharges: [],
        entitlements: [],
      } as unknown as PlanFormInput

      const { basePlanFormValuesRef } = await renderWithRefs()

      expect(basePlanFormValuesRef.current).toEqual(mockBasePlanFormValues)
    })

    it('WHEN no catalog plan values are available THEN the ref is cleared, not left stale', async () => {
      // A leftover value from a previous plan: the sync must overwrite it, otherwise a
      // stale baseline would be diffed against the new plan.
      const { stateRef, basePlanFormValuesRef } = await renderWithRefs({
        name: 'Previous plan',
      } as unknown as PlanFormInput)

      expect(stateRef.current).not.toBeNull()
      expect(basePlanFormValuesRef.current).toBeNull()
    })

    it('WHEN the baseline has not arrived yet THEN the pricing sections still render', async () => {
      await renderWithRefs()

      // The plan query is cache-and-network, so it reports loading on every open —
      // the drawer must not blank out waiting for the diff baseline.
      expect(screen.getByTestId('fixed-charges-section')).toBeInTheDocument()
    })
  })

  describe('GIVEN a quote attached to a subscription', () => {
    const subscriptionSettings = {
      externalId: 'sub_ext_1',
      subscriptionName: 'Acme monthly',
      billingTime: 'calendar' as const,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    }

    const renderWithSubscription = async (isAmendment: boolean) => {
      const stateRef = { current: null as SubscriptionPricingState | null }
      const formValuesRef = { current: null as PlanFormInput | null }
      const basePlanFormValuesRef = { current: null as PlanFormInput | null }

      // A fresh element every time: React bails out of a re-render given the very same
      // element reference, and the mocked hook would never be called again.
      const buildElement = () => (
        <SubscriptionPricingContent
          stateRef={stateRef}
          formValuesRef={formValuesRef}
          basePlanFormValuesRef={basePlanFormValuesRef}
          subscriptionId="sub_1"
          isAmendment={isAmendment}
        />
      )

      const rendered = await act(() => render(buildElement()))

      return {
        stateRef,
        // Replays the render so the mocked hook returns its newly-set values, the way the
        // subscription query resolving after mount would.
        rerender: async () => {
          await act(async () => {
            rendered.rerender(buildElement())
          })
        },
      }
    }

    const selectPlan = async (label: string) => {
      const combobox = screen.getByRole('combobox') as HTMLInputElement

      await userEvent.click(combobox)

      await waitFor(() => {
        expect(screen.getAllByRole('listbox').length).toBeGreaterThan(0)
      })

      const listboxId = combobox.getAttribute('aria-controls') as string
      const listbox = document.getElementById(listboxId) as HTMLElement

      await userEvent.click(within(listbox).getByText(label))
    }

    it('WHEN it is an amendment THEN the plan can still be changed', async () => {
      mockSubscriptionPlanId = 'plan_1'

      await renderWithSubscription(true)

      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })

    it('WHEN the subscription runs an overridden plan THEN the override is not offered', async () => {
      mockSubscriptionPlanId = 'plan_1'
      mockDisplayedPlan = {
        ...mockPlan,
        id: 'plan_1_override',
        code: 'starter_override',
      }

      await renderWithSubscription(true)

      const options = await openPlanOptions()

      expect(options).toEqual(['Pro (pro)', 'Starter (starter)'])
    })

    it('WHEN the catalog plan falls outside the current search page THEN it is still offered', async () => {
      mockSubscriptionPlanId = 'plan_99'
      mockDisplayedPlan = {
        ...mockPlan,
        id: 'plan_99_override',
        code: 'plan_99_override',
      }

      await renderWithSubscription(true)

      const options = await openPlanOptions()

      expect(options).toContain('Catalog plan_99 (plan_99)')
    })

    it('WHEN it is not an amendment THEN the plan stays locked to the subscription', async () => {
      mockSubscriptionPlanId = 'plan_1'

      await renderWithSubscription(false)

      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('WHEN the user switches plan on an amendment THEN the subscription is dropped so prices reset', async () => {
      mockSubscriptionPlanId = 'plan_1'

      await renderWithSubscription(true)

      // While the original plan is selected, the subscription still drives the form
      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ subscriptionId: 'sub_1', planIdToFetch: 'plan_1' }),
      )

      await selectPlan('Pro (pro)')

      // Both sources are dropped, so the hook fetches plan_2 and resets to its defaults
      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subscriptionId: undefined,
          billingItemPlan: undefined,
          planIdToFetch: 'plan_2',
        }),
      )
    })

    it('WHEN the subscription settings resolve after mount THEN they seed the quote state', async () => {
      mockSubscriptionPlanId = 'plan_1'

      const { stateRef, rerender } = await renderWithSubscription(true)

      expect(stateRef.current?.subscriptionSettings.externalId).toBe('')

      mockSubscriptionSettings = subscriptionSettings
      await rerender()

      expect(stateRef.current?.subscriptionSettings).toEqual({
        ...subscriptionSettings,
        // An amendment quote never carries a start date
        startDate: '',
      })
    })

    it('WHEN the user switches plan THEN the seeded subscription settings are preserved', async () => {
      mockSubscriptionPlanId = 'plan_1'
      mockSubscriptionSettings = subscriptionSettings

      const { stateRef, rerender } = await renderWithSubscription(true)

      await rerender()
      await selectPlan('Pro (pro)')

      // The subscription query is no longer forwarded, but its settings must survive
      expect(usePlanFormSetup).toHaveBeenLastCalledWith(
        expect.objectContaining({ subscriptionId: undefined, planIdToFetch: 'plan_2' }),
      )
      expect(stateRef.current?.subscriptionSettings).toEqual({
        ...subscriptionSettings,
        startDate: '',
      })
    })
  })
})
