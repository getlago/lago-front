import { act, renderHook } from '@testing-library/react'

import {
  type InvoicingPaymentsSettingsFormValues,
  useInvoicingPaymentsSettingsDrawer,
} from '../useInvoicingPaymentsSettingsDrawer'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: mockDrawerOpen, close: mockDrawerClose }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    hasFeatureFlag: () => true,
    organization: { defaultCurrency: 'USD' },
  }),
}))

const mockOnSave = jest.fn()

const defaultValues: InvoicingPaymentsSettingsFormValues = {
  paymentMethodId: '',
  invoiceCustomFooter: '',
}

describe('useInvoicingPaymentsSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns openDrawer function', () => {
    const { result } = renderHook(() => useInvoicingPaymentsSettingsDrawer(mockOnSave))

    expect(result.current).toHaveProperty('openDrawer')
    expect(typeof result.current.openDrawer).toBe('function')
  })

  it('opens the drawer when openDrawer is called', () => {
    const { result } = renderHook(() => useInvoicingPaymentsSettingsDrawer(mockOnSave))

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
})
