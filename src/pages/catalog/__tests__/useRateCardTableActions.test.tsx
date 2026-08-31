import { renderHook } from '@testing-library/react'

import { ActionItem } from '~/components/designSystem/Table/types'
import {
  CurrencyEnum,
  ProductTypeEnum,
  RateCardBillingTimingEnum,
  RateCardForListFragment,
  RateCardRegroupPaidFeesEnum,
} from '~/generated/graphql'

import { useRateCardTableActions } from '../useRateCardTableActions'

const mockHasPermissions = jest.fn()
const mockOpenRateCardDrawer = jest.fn()
const mockOpenDeleteRateCardDialog = jest.fn()

jest.mock('../drawers/rateCard/useRateCardDrawer', () => ({
  useRateCardDrawer: () => ({ openDrawer: mockOpenRateCardDrawer }),
}))

jest.mock('../dialogs/useDeleteRateCardDialog', () => ({
  useDeleteRateCardDialog: () => ({
    openDeleteRateCardDialog: mockOpenDeleteRateCardDialog,
  }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const buildRateCard = (
  overrides: Partial<RateCardForListFragment> = {},
): RateCardForListFragment => ({
  __typename: 'RateCard',
  id: 'rate-card-1',
  name: 'Enterprise plan',
  code: 'enterprise_plan',
  createdAt: '2024-01-20T00:00:00Z',
  ratesCount: 3,
  currency: CurrencyEnum.Usd,
  appliedPricingUnitCode: null,
  description: null,
  billingTiming: RateCardBillingTimingEnum.Arrears,
  displayOnInvoice: true,
  regroupPaidFees: RateCardRegroupPaidFeesEnum.None,
  proration: false,
  walletTargetable: false,
  attachedToPlanOrSubscription: false,
  attachedToSubscriptions: false,
  product: {
    __typename: 'Product',
    id: 'pitem-1',
    name: 'Seats',
    code: 'seats',
    productType: ProductTypeEnum.Fixed,
    billableMetric: null,
  },
  productFilter: null,
  activeRate: null,
  ...overrides,
})

const getActions = (
  actionColumn: ReturnType<typeof useRateCardTableActions>['actionColumn'],
  rateCard: RateCardForListFragment,
) => (actionColumn(rateCard) ?? []) as ActionItem<RateCardForListFragment>[]

describe('useRateCardTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN a rate card row', () => {
    describe('WHEN getRowActionLink is called', () => {
      it('THEN returns the details overview path', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useRateCardTableActions())

        expect(result.current.getRowActionLink({ id: 'rate-card-1' })).toBe(
          '/product-catalog/rate-cards/rate-card-1/overview',
        )
      })
    })

    describe('WHEN the user has both the update and delete permissions', () => {
      it('THEN offers edit and delete actions wired to the drawer and delete dialog', () => {
        mockHasPermissions.mockReturnValue(true)

        const { result } = renderHook(() => useRateCardTableActions())
        const rateCard = buildRateCard()
        const actions = getActions(result.current.actionColumn, rateCard)

        expect(actions).toHaveLength(2)

        const [editAction, deleteAction] = actions

        editAction?.onAction(rateCard)
        expect(mockOpenRateCardDrawer).toHaveBeenCalledWith({ rateCard })

        deleteAction?.onAction(rateCard)
        expect(mockOpenDeleteRateCardDialog).toHaveBeenCalledWith({ rateCard })
      })
    })

    describe('WHEN the user lacks the update permission', () => {
      it('THEN drops the edit action but keeps delete', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('rateCardsUpdate'),
        )

        const { result } = renderHook(() => useRateCardTableActions())
        const actions = getActions(result.current.actionColumn, buildRateCard())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('trash')
      })
    })

    describe('WHEN the user lacks the delete permission', () => {
      it('THEN drops the delete action but keeps edit', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('rateCardsDelete'),
        )

        const { result } = renderHook(() => useRateCardTableActions())
        const actions = getActions(result.current.actionColumn, buildRateCard())

        expect(actions).toHaveLength(1)
        expect(actions[0]?.startIcon).toBe('pen')
      })
    })

    describe('WHEN the user has neither permission', () => {
      it('THEN offers no row actions', () => {
        mockHasPermissions.mockReturnValue(false)

        const { result } = renderHook(() => useRateCardTableActions())

        expect(getActions(result.current.actionColumn, buildRateCard())).toHaveLength(0)
      })
    })
  })
})
