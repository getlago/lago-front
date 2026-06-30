import { renderHook } from '@testing-library/react'

import { OrderListItemFragment, OrderStatusEnum } from '~/generated/graphql'
import { testMockNavigateFn } from '~/test-utils'

import { useOrderActions } from '../useOrderActions'

const mockHasPermissions = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermissions: mockHasPermissions,
  }),
}))

const createMockOrder = (
  overrides: Partial<OrderListItemFragment> = {},
): OrderListItemFragment => ({
  id: 'order-1',
  number: 'OR-2026-0001',
  status: OrderStatusEnum.Created,
  executionMode: null,
  executedAt: null,
  orderForm: {
    id: 'of-1',
    number: 'OF-2026-0001',
    quote: { id: 'q-1', number: 'QT-001' },
  },
  ...overrides,
})

describe('useOrderActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN a created order with ordersUpdate permission', () => {
    it('THEN returns a single edit action', () => {
      const { result } = renderHook(() => useOrderActions())
      const actions = result.current.getActions(createMockOrder())

      expect(actions).toHaveLength(1)
      expect(actions[0].icon).toBe('pen')
    })
  })

  describe('GIVEN an executed order', () => {
    it('THEN returns no actions', () => {
      const { result } = renderHook(() => useOrderActions())
      const actions = result.current.getActions(
        createMockOrder({ status: OrderStatusEnum.Executed }),
      )

      expect(actions).toHaveLength(0)
    })
  })

  describe('GIVEN a created order without ordersUpdate permission', () => {
    it('THEN returns no actions', () => {
      mockHasPermissions.mockReturnValue(false)
      const { result } = renderHook(() => useOrderActions())
      const actions = result.current.getActions(createMockOrder())

      expect(actions).toHaveLength(0)
    })
  })

  describe('GIVEN the edit action', () => {
    it('THEN navigates to the edit-order route', () => {
      const { result } = renderHook(() => useOrderActions())
      const actions = result.current.getActions(createMockOrder({ id: 'order-42' }))

      actions[0].onAction()

      expect(testMockNavigateFn).toHaveBeenCalledWith('/order/order-42/edit')
    })
  })
})
