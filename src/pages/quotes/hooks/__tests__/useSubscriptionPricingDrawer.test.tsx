import { act, renderHook } from '@testing-library/react'

import type { PlanFormInput } from '~/components/plans/types'
import { addToast } from '~/core/apolloClient'
import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import type { SubscriptionPricingState } from '~/core/serializers/serializeQuotePlanBillingItems'
import { CurrencyEnum, PlanInterval } from '~/generated/graphql'
import { QUOTE_SAVE_FAILED_TOAST_KEY } from '~/pages/quotes/utils/quoteSaveErrorKeys'
import { render } from '~/test-utils'

import { useSubscriptionPricingDrawer } from '../useSubscriptionPricingDrawer'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

const mockAddToast = addToast as jest.Mock

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

// State the mocked content component hydrates into the hook's stateRef on render.
// `null` keeps the ref empty (exercises the early-return branch in handleSave).
let mockInjectedState: SubscriptionPricingState | null = null
let mockInjectedFormValues: PlanFormInput | null = null
let mockInjectedBasePlanFormValues: PlanFormInput | null = null

const catalogFormValues = {
  name: 'Enterprise Plan',
  code: 'enterprise',
  description: '',
  interval: PlanInterval.Monthly,
  amountCents: '850.00',
  amountCurrency: CurrencyEnum.Usd,
  payInAdvance: false,
  trialPeriod: 0,
  charges: [],
  fixedCharges: [],
  entitlements: [],
} as unknown as PlanFormInput

// Verdict the mocked content component reports through validatePlanFormRef.
// `null` leaves the ref unfilled, as when the content component never mounted.
let mockPlanFormValid: boolean | null = null

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Mock SubscriptionPricingContent — on render it hydrates the shared stateRef
// so the drawer's submit handler has a subscription state to serialize, plus the
// form values and their catalog-plan baseline used to diff the overrides.
jest.mock(
  '~/components/designSystem/RichTextEditor/PricingBlock/SubscriptionPricingContent',
  () => ({
    SubscriptionPricingContent: ({
      stateRef,
      formValuesRef,
      basePlanFormValuesRef,
      validatePlanFormRef,
    }: {
      stateRef?: { current: SubscriptionPricingState | null }
      formValuesRef?: { current: PlanFormInput | null }
      basePlanFormValuesRef?: { current: PlanFormInput | null }
      validatePlanFormRef?: { current: (() => Promise<boolean>) | null }
    }) => {
      if (stateRef) {
        stateRef.current = mockInjectedState
      }
      if (formValuesRef) {
        formValuesRef.current = mockInjectedFormValues
      }
      if (basePlanFormValuesRef) {
        basePlanFormValuesRef.current = mockInjectedBasePlanFormValues
      }

      if (validatePlanFormRef) {
        validatePlanFormRef.current =
          mockPlanFormValid === null ? null : () => Promise.resolve(mockPlanFormValid as boolean)
      }

      return null
    },
  }),
)

describe('useSubscriptionPricingDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInjectedState = null
    mockPlanFormValid = null
    mockInjectedFormValues = null
    mockInjectedBasePlanFormValues = null
  })

  it('returns the expected interface', () => {
    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    expect(result.current).toHaveProperty('onPricingCommand')
    expect(result.current).toHaveProperty('isPricingDisabled')
    expect(result.current).toHaveProperty('entities')
    expect(result.current).toHaveProperty('syncEntitiesWithBlocks')
  })

  it('opens the drawer when onPricingCommand is called', () => {
    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    const mockOnSave = jest.fn()

    act(() => {
      result.current.onPricingCommand({ onSave: mockOnSave })
    })

    expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
  })

  it('isPricingDisabled returns false when no entities', () => {
    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    expect(result.current.isPricingDisabled()).toBe(false)
  })

  it('hydrates entities from initial billingItems with plans', () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            code: 'enterprise',
            name: 'Enterprise Plan',
            description: '',
            subscriptionExternalId: null,
            subscriptionName: null,
            billingTime: 'anniversary',
            startDate: '2023-07-26',
            endDate: null,
            paymentMethodId: null,
            invoiceCustomFooter: null,
          },
          overrides: {},
        },
      ],
    }

    const { result } = renderHook(() => useSubscriptionPricingDrawer(initialBillingItems))

    expect(result.current.entities).toHaveProperty('plan_123')
    expect(result.current.entities.plan_123.entityType).toBe('plan')
    expect(result.current.entities.plan_123.name).toBe('Enterprise Plan')
  })

  it('syncEntitiesWithBlocks removes orphaned entities', () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            code: 'enterprise',
            name: 'Enterprise Plan',
            description: '',
            subscriptionExternalId: null,
            subscriptionName: null,
            billingTime: 'anniversary',
            startDate: '2023-07-26',
            endDate: null,
            paymentMethodId: null,
            invoiceCustomFooter: null,
          },
          overrides: {},
        },
      ],
    }

    const { result } = renderHook(() => useSubscriptionPricingDrawer(initialBillingItems))

    // Block with different entity — plan_123 becomes orphaned
    let billingItems: BillingItemsPayload | null = null

    act(() => {
      billingItems = result.current.syncEntitiesWithBlocks([
        { pricingType: 'plan', entityIds: ['plan_other'] },
      ])
    })

    expect(billingItems).not.toBeNull()
    expect(result.current.entities).not.toHaveProperty('plan_123')
  })

  it('syncEntitiesWithBlocks re-hydrates a pruned plan when its block re-appears (undo)', () => {
    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            code: 'enterprise',
            name: 'Enterprise Plan',
            description: '',
            subscriptionExternalId: null,
            subscriptionName: null,
            billingTime: 'anniversary',
            startDate: '2023-07-26',
            endDate: null,
            paymentMethodId: null,
            invoiceCustomFooter: null,
          },
          overrides: {},
        },
      ],
    }

    const { result } = renderHook(() => useSubscriptionPricingDrawer(initialBillingItems))

    // Delete: the block leaves the doc, so the plan is pruned and the payload
    // clears the plan slice for the autosave.
    let afterDelete: BillingItemsPayload | null = null

    act(() => {
      afterDelete = result.current.syncEntitiesWithBlocks([])
    })

    expect(afterDelete).toEqual(expect.objectContaining({ plans: [] }))
    expect(result.current.entities).not.toHaveProperty('plan_123')

    // Undo: TipTap re-inserts the block, so the same id re-appears in the doc.
    let afterUndo: BillingItemsPayload | null = null

    act(() => {
      afterUndo = result.current.syncEntitiesWithBlocks([
        { pricingType: 'plan', entityIds: ['plan_123'] },
      ])
    })

    // Entity is rehydrated (NodeView resolves again) and the plan item — with its
    // overrides — is re-persisted, restoring server state.
    expect(result.current.entities).toHaveProperty('plan_123')
    expect(afterUndo).toEqual(
      expect.objectContaining({
        plans: [
          expect.objectContaining({
            id: 'plan_123',
            payload: expect.objectContaining({ name: 'Enterprise Plan' }),
          }),
        ],
      }),
    )
  })

  it('commits entities and propagates dates on success', async () => {
    mockInjectedState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }

    const onSave = jest.fn().mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    // Render the drawer children so the mocked content hydrates the state ref
    render(openArgs.children)

    await act(async () => {
      await openArgs.form.submit()
    })

    expect(onSave).toHaveBeenCalledWith(
      { pricingType: 'plan', entityIds: ['plan_123'] },
      expect.objectContaining({
        plan_123: expect.objectContaining({ entityId: 'plan_123', entityType: 'plan' }),
      }),
      // The drawer owns only the `plans` key; `addOns` is normalized in by the
      // save funnel (savePricingBlock), not by this drawer.
      expect.objectContaining({ plans: expect.any(Array) }),
      undefined,
    )
    expect(result.current.entities).toHaveProperty('plan_123')
  })

  it('commits the plan preview payload built from the form values', async () => {
    mockInjectedState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }
    mockInjectedFormValues = catalogFormValues

    const onSave = jest.fn().mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(openArgs.children)

    await act(async () => {
      await openArgs.form.submit()
    })

    expect(result.current.entities.plan_123.plan).toBeDefined()
    expect(result.current.entities.plan_123.plan?.rows.length).toBeGreaterThan(0)
  })

  it('commits an empty preview payload when no form values are available', async () => {
    mockInjectedState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }
    mockInjectedFormValues = null

    const onSave = jest.fn().mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(openArgs.children)

    await act(async () => {
      await openArgs.form.submit()
    })

    expect(result.current.entities.plan_123.plan).toEqual({ rows: [] })
  })

  it('toasts and keeps the drawer open when the save fails', async () => {
    mockInjectedState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }

    const onSave = jest.fn().mockResolvedValue({ ok: false, error: undefined })

    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    // Render the drawer children so the mocked content hydrates the state ref
    render(openArgs.children)

    await act(async () => {
      await expect(openArgs.form.submit()).rejects.toThrow()
    })

    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: QUOTE_SAVE_FAILED_TOAST_KEY,
    })
    expect(mockDrawerClose).not.toHaveBeenCalled()
    expect(result.current.entities).not.toHaveProperty('plan_123')
  })

  describe('GIVEN the plan form reports its validity', () => {
    const validState: SubscriptionPricingState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '2024-07-26',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }

    const submitDrawer = async (onSave: jest.Mock) => {
      const rendered = renderHook(() => useSubscriptionPricingDrawer(undefined))

      act(() => {
        rendered.result.current.onPricingCommand({ onSave })
      })

      const openArgs = mockDrawerOpen.mock.calls[0][0]

      render(openArgs.children)

      return { openArgs, result: rendered.result }
    }

    describe('WHEN the plan form is invalid', () => {
      beforeEach(() => {
        mockInjectedState = validState
        mockPlanFormValid = false
      })

      it('THEN should not persist the billing item', async () => {
        const onSave = jest.fn().mockResolvedValue({ ok: true })
        const { openArgs, result } = await submitDrawer(onSave)

        await act(async () => {
          await expect(openArgs.form.submit()).rejects.toThrow()
        })

        expect(onSave).not.toHaveBeenCalled()
        expect(result.current.entities).not.toHaveProperty('plan_123')
      })

      it('THEN should toast and keep the drawer open', async () => {
        const onSave = jest.fn().mockResolvedValue({ ok: true })
        const { openArgs } = await submitDrawer(onSave)

        await act(async () => {
          await expect(openArgs.form.submit()).rejects.toThrow()
        })

        expect(mockAddToast).toHaveBeenCalledWith({
          severity: 'danger',
          translateKey: QUOTE_SAVE_FAILED_TOAST_KEY,
        })
        expect(mockDrawerClose).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the plan form is valid', () => {
      beforeEach(() => {
        mockInjectedState = validState
        mockPlanFormValid = true
      })

      it('THEN should persist the billing item', async () => {
        const onSave = jest.fn().mockResolvedValue({ ok: true })
        const { openArgs, result } = await submitDrawer(onSave)

        await act(async () => {
          await openArgs.form.submit()
        })

        expect(onSave).toHaveBeenCalledTimes(1)
        expect(result.current.entities).toHaveProperty('plan_123')
      })
    })
  })

  it('preserves existing coupons in the payload when saving a plan', async () => {
    // Regression: coupons live alongside plans in billingItems. Saving a plan
    // must not overwrite billingItems and drop a previously-added coupon.
    mockInjectedState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }

    const existingCoupon = {
      type: 'coupon',
      id: 'cpn_1',
      localId: 'local-cpn-1',
      payload: {},
      overrides: {},
    } as unknown as NonNullable<BillingItemsPayload['coupons']>[number]

    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      coupons: [existingCoupon],
    }

    const onSave = jest.fn().mockResolvedValue({ ok: true })

    const { result } = renderHook(() => useSubscriptionPricingDrawer(initialBillingItems))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(openArgs.children)

    await act(async () => {
      await openArgs.form.submit()
    })

    expect(onSave).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ plans: expect.any(Array), coupons: [existingCoupon] }),
      undefined,
    )
  })

  it('syncEntitiesWithBlocks preserves existing coupons when pruning an orphaned plan', () => {
    const existingCoupon = {
      type: 'coupon',
      id: 'cpn_1',
      localId: 'local-cpn-1',
      payload: {},
      overrides: {},
    } as unknown as NonNullable<BillingItemsPayload['coupons']>[number]

    const initialBillingItems: BillingItemsPayload = {
      addOns: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            code: 'enterprise',
            name: 'Enterprise Plan',
            description: '',
            subscriptionExternalId: null,
            subscriptionName: null,
            billingTime: 'anniversary',
            startDate: '2023-07-26',
            endDate: null,
            paymentMethodId: null,
            invoiceCustomFooter: null,
          },
          overrides: {},
        },
      ],
      coupons: [existingCoupon],
    }

    const { result } = renderHook(() => useSubscriptionPricingDrawer(initialBillingItems))

    let billingItems: BillingItemsPayload | null = null

    act(() => {
      billingItems = result.current.syncEntitiesWithBlocks([
        { pricingType: 'plan', entityIds: ['plan_other'] },
      ])
    })

    expect(billingItems).toEqual(expect.objectContaining({ plans: [], coupons: [existingCoupon] }))
  })

  it('toasts and keeps the drawer open (no save) when no subscription state is set', async () => {
    mockInjectedState = null

    const onSave = jest.fn()

    const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

    act(() => {
      result.current.onPricingCommand({ onSave })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    render(openArgs.children)

    // Submitting an incomplete plan throws (FormDrawer catches it and, with
    // closeOnError:false, keeps the drawer open) and surfaces a toast rather
    // than silently doing nothing.
    await act(async () => {
      await expect(openArgs.form.submit()).rejects.toThrow()
    })

    expect(onSave).not.toHaveBeenCalled()
    expect(mockDrawerClose).not.toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith({
      severity: 'danger',
      translateKey: QUOTE_SAVE_FAILED_TOAST_KEY,
    })
  })

  describe('override diff baseline (LAGO-1789)', () => {
    const planState: SubscriptionPricingState = {
      planId: 'plan_123',
      planCode: 'enterprise',
      planName: 'Enterprise Plan',
      basePlanName: 'Enterprise Plan',
      planDescription: '',
      subscriptionSettings: {
        externalId: '',
        subscriptionName: '',
        billingTime: 'anniversary',
        startDate: '2023-07-26',
        endDate: '',
      },
      invoicingSettings: { paymentMethodId: '', invoiceCustomFooter: '' },
      overrides: {},
    }

    const saveAndReadPlan = async (): Promise<{ overrides: Record<string, unknown> }> => {
      const onSave = jest.fn().mockResolvedValue({ ok: true })
      const { result } = renderHook(() => useSubscriptionPricingDrawer(undefined))

      act(() => {
        result.current.onPricingCommand({ onSave })
      })

      const openArgs = mockDrawerOpen.mock.calls[0][0]

      render(openArgs.children)

      await act(async () => {
        await openArgs.form.submit()
      })

      return onSave.mock.calls[0][2].plans[0]
    }

    it('sends no overrides when the form matches the catalog plan', async () => {
      mockInjectedState = planState
      mockInjectedFormValues = catalogFormValues
      mockInjectedBasePlanFormValues = catalogFormValues

      const plan = await saveAndReadPlan()

      expect(plan.overrides).toEqual({})
    })

    it('sends only the edited field when the form differs from the catalog plan', async () => {
      mockInjectedState = planState
      mockInjectedFormValues = { ...catalogFormValues, amountCents: '900.00' }
      mockInjectedBasePlanFormValues = catalogFormValues

      const plan = await saveAndReadPlan()

      expect(plan.overrides).toEqual({ amountCents: 90000 })
    })

    it('falls back to sending every configured field when no baseline is available', async () => {
      mockInjectedState = planState
      mockInjectedFormValues = catalogFormValues
      mockInjectedBasePlanFormValues = null

      const plan = await saveAndReadPlan()

      expect(plan.overrides).toEqual({ amountCents: 85000 })
    })

    describe('seeding the quote currency', () => {
      const saveAndReadSeededCurrency = async (
        hasQuoteCurrency: boolean,
      ): Promise<CurrencyEnum | undefined> => {
        const onSave = jest.fn().mockResolvedValue({ ok: true })
        const { result } = renderHook(() =>
          useSubscriptionPricingDrawer(undefined, {
            currency: CurrencyEnum.Eur,
            hasQuoteCurrency,
          }),
        )

        act(() => {
          result.current.onPricingCommand({ onSave })
        })

        const openArgs = mockDrawerOpen.mock.calls[0][0]

        render(openArgs.children)

        await act(async () => {
          await openArgs.form.submit()
        })

        return onSave.mock.calls[0][3]
      }

      beforeEach(() => {
        mockInjectedState = planState
        mockInjectedFormValues = catalogFormValues
        mockInjectedBasePlanFormValues = catalogFormValues
      })

      it("forwards the plan's currency when the quote has none of its own", async () => {
        expect(await saveAndReadSeededCurrency(false)).toBe(CurrencyEnum.Usd)
      })

      it('forwards nothing when the quote already owns a currency', async () => {
        expect(await saveAndReadSeededCurrency(true)).toBeUndefined()
      })

      it('locks the plan currency picker only when the quote owns a currency', () => {
        const { result } = renderHook(() =>
          useSubscriptionPricingDrawer(undefined, {
            currency: CurrencyEnum.Eur,
            hasQuoteCurrency: true,
          }),
        )

        act(() => {
          result.current.onPricingCommand({ onSave: jest.fn() })
        })

        expect(mockDrawerOpen.mock.calls[0][0].children.props).toEqual(
          expect.objectContaining({ currency: CurrencyEnum.Eur, hasQuoteCurrency: true }),
        )
      })
    })
  })
  it('passes the resolved payment term down to the drawer content', () => {
    const { result } = renderHook(() =>
      useSubscriptionPricingDrawer(undefined, { netPaymentTerm: 30 }),
    )

    act(() => {
      result.current.onPricingCommand({ onSave: jest.fn().mockResolvedValue({ ok: true }) })
    })

    const openArgs = mockDrawerOpen.mock.calls[0][0]

    expect(openArgs.children.props.netPaymentTerm).toBe(30)
  })
})
