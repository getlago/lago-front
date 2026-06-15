import { act, renderHook } from '@testing-library/react'

import {
  type SubscriptionSettingsFormValues,
  useSubscriptionSettingsDrawer,
} from '../useSubscriptionSettingsDrawer'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({
    open: mockDrawerOpen,
    close: mockDrawerClose,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const mockOnSave = jest.fn()

const defaultValues: SubscriptionSettingsFormValues = {
  externalId: '',
  subscriptionName: '',
  billingTime: 'anniversary',
  startDate: '',
  endDate: '',
}

describe('useSubscriptionSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns openDrawer function', () => {
    const { result } = renderHook(() => useSubscriptionSettingsDrawer(mockOnSave))

    expect(result.current).toHaveProperty('openDrawer')
    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('opens the drawer when openDrawer is called', () => {
    const { result } = renderHook(() => useSubscriptionSettingsDrawer(mockOnSave))

    act(() => {
      result.current.openDrawer(defaultValues)
    })
    expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
    expect(mockDrawerOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.any(String),
        children: expect.anything(),
        actions: expect.anything(),
      }),
    )
  })

  it('opens the drawer with pre-populated values', () => {
    const { result } = renderHook(() => useSubscriptionSettingsDrawer(mockOnSave))

    act(() => {
      result.current.openDrawer({
        externalId: 'ext_001',
        subscriptionName: 'My Sub',
        billingTime: 'calendar',
        startDate: '2023-07-26',
        endDate: '',
      })
    })
    expect(mockDrawerOpen).toHaveBeenCalledTimes(1)
  })
})
