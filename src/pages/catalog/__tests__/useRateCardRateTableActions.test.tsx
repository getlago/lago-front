import { renderHook } from '@testing-library/react'

import { ActionItem } from '~/components/designSystem/Table/types'
import { RateCardRateForListFragment, RateCardRateStatusEnum } from '~/generated/graphql'

import { buildRateCardForRateDrawer, buildRateCardRate } from './fixtures'

import { useRateCardRateTableActions } from '../useRateCardRateTableActions'

const mockHasPermissions = jest.fn()
const mockOpenRateDrawer = jest.fn()
const mockOpenDeleteRateDialog = jest.fn()
const mockNavigate = jest.fn()

jest.mock('../drawers/rateCardRate/useRateCardRateDrawer', () => ({
  useRateCardRateDrawer: () => ({ openDrawer: mockOpenRateDrawer }),
}))

jest.mock('../dialogs/useDeleteRateCardRateDialog', () => ({
  useDeleteRateCardRateDialog: () => ({
    openDeleteRateCardRateDialog: mockOpenDeleteRateDialog,
  }),
}))

jest.mock('~/core/router', () => ({
  ...jest.requireActual('~/core/router'),
  useNavigate: () => mockNavigate,
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const renderActions = (rateCard = buildRateCardForRateDrawer()) =>
  renderHook(() => useRateCardRateTableActions({ rateCard }))

const getActions = (
  actionColumn: ReturnType<typeof useRateCardRateTableActions>['actionColumn'],
  rate: RateCardRateForListFragment,
) => (actionColumn(rate) ?? []) as ActionItem<RateCardRateForListFragment>[]

describe('useRateCardRateTableActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHasPermissions.mockReturnValue(true)
  })

  describe('GIVEN a rate row', () => {
    describe('WHEN getRowActionLink is called', () => {
      it('THEN returns the rate details overview path nested under its card', () => {
        const { result } = renderActions()

        expect(result.current.getRowActionLink({ id: 'rate-1' })).toBe(
          '/product-catalog/rate-cards/rc-1/rates/rate-1/overview',
        )
      })
    })

    describe('WHEN the rate is pending and the user has every permission', () => {
      it('THEN offers view, edit and delete', () => {
        const { result } = renderActions()
        const actions = getActions(result.current.actionColumn, buildRateCardRate())

        expect(actions.map((action) => action.startIcon)).toEqual(['eye', 'pen', 'trash'])
      })

      it('THEN the view action navigates to the rate details page', () => {
        const { result } = renderActions()
        const rate = buildRateCardRate()
        const [viewAction] = getActions(result.current.actionColumn, rate)

        viewAction?.onAction(rate)

        expect(mockNavigate).toHaveBeenCalledWith(
          '/product-catalog/rate-cards/rc-1/rates/rate-1/overview',
        )
      })

      it('THEN the edit action opens the drawer seeded with the card and the rate', () => {
        const rateCard = buildRateCardForRateDrawer()
        const { result } = renderActions(rateCard)
        const rate = buildRateCardRate()
        const editAction = getActions(result.current.actionColumn, rate)[1]

        editAction?.onAction(rate)

        expect(mockOpenRateDrawer).toHaveBeenCalledWith({ rateCard, rate })
      })

      it('THEN the delete action opens the confirmation dialog for that rate', () => {
        const { result } = renderActions()
        const rate = buildRateCardRate()
        const deleteAction = getActions(result.current.actionColumn, rate)[2]

        deleteAction?.onAction(rate)

        expect(mockOpenDeleteRateDialog).toHaveBeenCalledWith({ rate })
      })
    })

    describe('WHEN the rate is already effective', () => {
      it('THEN drops delete but keeps view and edit, because only a pending rate can be deleted', () => {
        const { result } = renderActions()
        const actions = getActions(
          result.current.actionColumn,
          buildRateCardRate({ status: RateCardRateStatusEnum.Active }),
        )

        expect(actions.map((action) => action.startIcon)).toEqual(['eye', 'pen'])
      })
    })

    describe('WHEN the rate is terminated', () => {
      it('THEN leaves only the view action', () => {
        const { result } = renderActions()
        const actions = getActions(
          result.current.actionColumn,
          buildRateCardRate({ status: RateCardRateStatusEnum.Terminated }),
        )

        expect(actions.map((action) => action.startIcon)).toEqual(['eye'])
      })
    })

    describe('WHEN the card is billed by subscriptions', () => {
      const attachedCard = buildRateCardForRateDrawer({ attachedToSubscriptions: true })

      it('THEN keeps edit for a pending rate', () => {
        const { result } = renderActions(attachedCard)
        const actions = getActions(result.current.actionColumn, buildRateCardRate())

        expect(actions.map((action) => action.startIcon)).toEqual(['eye', 'pen', 'trash'])
      })

      it('THEN drops edit for the active rate, which prices live subscriptions', () => {
        const { result } = renderActions(attachedCard)
        const actions = getActions(
          result.current.actionColumn,
          buildRateCardRate({ status: RateCardRateStatusEnum.Active }),
        )

        expect(actions.map((action) => action.startIcon)).toEqual(['eye'])
      })
    })

    describe('WHEN the user lacks the update permission', () => {
      it('THEN drops the edit action but keeps view and delete', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('rateCardsUpdate'),
        )

        const { result } = renderActions()
        const actions = getActions(result.current.actionColumn, buildRateCardRate())

        expect(actions.map((action) => action.startIcon)).toEqual(['eye', 'trash'])
      })
    })

    describe('WHEN the user lacks the delete permission', () => {
      it('THEN drops the delete action but keeps view and edit', () => {
        mockHasPermissions.mockImplementation(
          (permissions: string[]) => !permissions.includes('rateCardsDelete'),
        )

        const { result } = renderActions()
        const actions = getActions(result.current.actionColumn, buildRateCardRate())

        expect(actions.map((action) => action.startIcon)).toEqual(['eye', 'pen'])
      })
    })

    describe('WHEN the user has neither the update nor the delete permission', () => {
      it('THEN still offers the view action, which needs no write permission', () => {
        mockHasPermissions.mockReturnValue(false)

        const { result } = renderActions()
        const actions = getActions(result.current.actionColumn, buildRateCardRate())

        expect(actions.map((action) => action.startIcon)).toEqual(['eye'])
      })
    })

    describe('WHEN the action column tooltip is built', () => {
      it('THEN lists only the actions the row actually offers', () => {
        const { result } = renderActions()
        const tooltip = result.current.actionColumnTooltip(
          buildRateCardRate({ status: RateCardRateStatusEnum.Terminated }),
        )

        // Terminated rates keep the view action only, so the tooltip lists a single entry.
        expect(tooltip.split(',')).toHaveLength(1)
      })
    })
  })
})
