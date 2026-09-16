import { renderHook } from '@testing-library/react'

import { ConnectionCategory } from '~/components/customerConnections/types'
import { ConnectionCategoryEnum, ConnectionResolvedBehaviorEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS,
  useConnectionRoutingGridItems,
} from '../useConnectionRoutingGridItems'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockConnectionRoutingValue = jest.fn()

jest.mock('../ConnectionRoutingValue', () => ({
  ConnectionRoutingValue: (props: Record<string, unknown>) => {
    mockConnectionRoutingValue(props)

    return null
  },
}))

const CONNECTIONS = [
  {
    category: ConnectionCategoryEnum.Payment,
    behavior: ConnectionResolvedBehaviorEnum.Specific,
    code: 'stripe-eu',
  },
  {
    category: ConnectionCategoryEnum.Tax,
    behavior: ConnectionResolvedBehaviorEnum.Inherit,
    code: 'anrok-eu',
  },
]

const renderItems = (categories: ConnectionCategory[]) =>
  renderHook(() =>
    useConnectionRoutingGridItems({
      categories,
      connections: CONNECTIONS,
      customerId: 'customer-1',
    }),
  )

describe('useConnectionRoutingGridItems', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a list of categories', () => {
    describe('WHEN the items are built', () => {
      it('THEN should return one labeled row per category, in order', () => {
        const { result } = renderItems([
          ConnectionCategory.Payment,
          ConnectionCategory.Tax,
          ConnectionCategory.Accounting,
          ConnectionCategory.Crm,
        ])

        expect(result.current.map(({ label }) => label)).toEqual([
          CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS[ConnectionCategory.Payment],
          CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS[ConnectionCategory.Tax],
          CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS[ConnectionCategory.Accounting],
          CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS[ConnectionCategory.Crm],
        ])
      })
    })
  })

  describe('GIVEN the billing object routes some categories', () => {
    describe('WHEN a category has a routing', () => {
      it('THEN should hand that routing to the value', () => {
        const { result } = renderItems([ConnectionCategory.Tax])

        render(<>{result.current[0].value}</>)

        expect(mockConnectionRoutingValue).toHaveBeenCalledWith(
          expect.objectContaining({
            category: ConnectionCategory.Tax,
            customerId: 'customer-1',
            routing: expect.objectContaining({
              behavior: ConnectionResolvedBehaviorEnum.Inherit,
              code: 'anrok-eu',
            }),
          }),
        )
      })
    })

    describe('WHEN a category is missing from the connections', () => {
      it('THEN should hand an undefined routing to the value', () => {
        const { result } = renderItems([ConnectionCategory.Crm])

        render(<>{result.current[0].value}</>)

        expect(mockConnectionRoutingValue).toHaveBeenCalledWith(
          expect.objectContaining({ category: ConnectionCategory.Crm, routing: undefined }),
        )
      })
    })
  })
})
