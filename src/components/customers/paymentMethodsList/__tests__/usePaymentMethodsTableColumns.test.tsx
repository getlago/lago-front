import { renderHook } from '@testing-library/react'

import { usePaymentMethodsTableColumns } from '../usePaymentMethodsTableColumns'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

describe('usePaymentMethodsTableColumns', () => {
  const mockSetPaymentMethodAsDefault = jest.fn().mockResolvedValue(undefined)
  const mockDestroyPaymentMethod = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('WHEN generating table columns', () => {
    it('THEN returns columns and actionColumn', () => {
      const { result } = renderHook(() =>
        usePaymentMethodsTableColumns({
          setPaymentMethodAsDefault: mockSetPaymentMethodAsDefault,
          destroyPaymentMethod: mockDestroyPaymentMethod,
        }),
      )

      expect(result.current.columns).toBeDefined()
      expect(result.current.actionColumn).toBeDefined()
    })
  })
})
