import { act, renderHook } from '@testing-library/react'

import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'

import { useSubscriptionPricingDrawer } from '../useSubscriptionPricingDrawer'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Mock SubscriptionPricingContent
jest.mock(
  '~/components/designSystem/RichTextEditor/PricingBlock/SubscriptionPricingContent',
  () => ({
    SubscriptionPricingContent: () => null,
  }),
)

describe('useSubscriptionPricingDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
      addons: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            plan_code: 'enterprise',
            plan_name: 'Enterprise Plan',
            plan_description: '',
            subscription_external_id: null,
            subscription_name: null,
            billing_time: 'anniversary',
            start_date: '2023-07-26',
            end_date: null,
            payment_method_id: null,
            invoice_custom_footer: null,
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
      addons: [],
      plans: [
        {
          type: 'plan',
          id: 'plan_123',
          payload: {
            position: 1,
            plan_code: 'enterprise',
            plan_name: 'Enterprise Plan',
            plan_description: '',
            subscription_external_id: null,
            subscription_name: null,
            billing_time: 'anniversary',
            start_date: '2023-07-26',
            end_date: null,
            payment_method_id: null,
            invoice_custom_footer: null,
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
})
