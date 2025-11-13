import { renderHook, waitFor } from '@testing-library/react'

import { PaymentMethodOption } from '../usePaymentMethodOptions'
import { usePaymentMethodSelection } from '../usePaymentMethodSelection'

const createMockOption = (value: string, isDefault?: boolean): PaymentMethodOption => ({
  value,
  label: `Payment Method ${value}`,
  labelNode: <div>{value}</div>,
  isDefault,
  type: 'provider',
})

describe('usePaymentMethodSelection', () => {
  describe('WHEN default payment method exists', () => {
    it('THEN selects default payment method on initialization', async () => {
      const options: PaymentMethodOption[] = [
        createMockOption('pm_001'),
        createMockOption('pm_002', true), // default payment method
        createMockOption('manual'),
      ]

      const { result } = renderHook(() => usePaymentMethodSelection(options))

      await waitFor(() => {
        expect(result.current[0]).toBe('pm_002')
      })
    })
  })

  describe('WHEN no default payment method exists', () => {
    it('THEN selects first option on initialization', async () => {
      const options: PaymentMethodOption[] = [
        createMockOption('pm_001'),
        createMockOption('pm_002'),
        createMockOption('manual'),
      ]

      const { result } = renderHook(() => usePaymentMethodSelection(options))

      await waitFor(() => {
        expect(result.current[0]).toBe('pm_001')
      })
    })
  })
})
