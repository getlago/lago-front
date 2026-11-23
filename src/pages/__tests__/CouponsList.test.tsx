import { generatePath } from 'react-router'

import { ActionItem } from '~/components/designSystem/Table/types'
import { MOVE_TO_LIVE_ACTION_TEST_ID } from '~/components/sandbox/useMoveToLive'
import { CouponStatusEnum, MoveToLiveMovableItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import CouponsList from '../CouponsList'

const mockMainHeaderConfigure = jest.fn()
const mockTableProps = jest.fn()

const mockCanCreate = jest.fn()
const mockCanEdit = jest.fn()
const mockCanTerminate = jest.fn()
const mockCanDelete = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/components/designSystem/Table/Table', () => ({
  Table: (props: Record<string, unknown>) => {
    mockTableProps(props)
    return null
  },
}))

jest.mock('~/components/designSystem/Pagination', () => ({
  PaginatedContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  usePageSearchParam: () => ({ page: 1, goToPage: jest.fn() }),
}))

jest.mock('~/components/SearchInput', () => ({
  SearchInput: () => null,
}))

jest.mock('~/components/coupons/useDeleteCoupon', () => ({
  useDeleteCoupon: () => ({ openDialog: jest.fn() }),
}))

jest.mock('~/components/coupons/useTerminateCoupon', () => ({
  useTerminateCoupon: () => ({ openDialog: jest.fn() }),
}))

jest.mock('~/components/coupons/CouponCaption', () => ({
  CouponCaption: () => null,
}))

jest.mock('~/components/designSystem/Status', () => ({
  Status: () => null,
}))

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(() => jest.fn()),
  generatePath: jest.fn((route: string) => route),
}))

jest.mock('~/hooks/usePermissionsCouponActions', () => ({
  usePermissionsCouponActions: () => ({
    canCreate: mockCanCreate,
    canEdit: mockCanEdit,
    canTerminate: mockCanTerminate,
    canDelete: mockCanDelete,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useOrganizationInfos', () => ({
  useOrganizationInfos: () => ({
    intlFormatDateTimeOrgaTZ: () => ({ date: '2024-01-01' }),
  }),
}))

jest.mock('~/hooks/useDebouncedSearch', () => ({
  useDebouncedSearch: () => ({
    debouncedSearch: jest.fn(),
    isLoading: false,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCouponsLazyQuery: () => [
    jest.fn(),
    { data: null, error: null, loading: false, fetchMore: jest.fn(), variables: {} },
  ],
}))

jest.mock('~/core/constants/statusCouponMapping', () => ({
  couponStatusMapping: () => ({ type: 'success', label: 'Active' }),
}))

const mockMoveToLive = jest.fn()
let mockCanMoveToLive = false

jest.mock('~/components/sandbox/useMoveToLive', () => ({
  ...jest.requireActual('~/components/sandbox/useMoveToLive'),
  useMoveToLive: () => ({ canMoveToLive: mockCanMoveToLive, moveToLive: mockMoveToLive }),
}))

describe('CouponsList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCanCreate.mockReturnValue(true)
    mockCanEdit.mockReturnValue(true)
    mockCanTerminate.mockReturnValue(true)
    mockCanDelete.mockReturnValue(true)
  })

  describe('GIVEN the component is rendered', () => {
    describe('WHEN user has couponsCreate permission', () => {
      it('THEN should pass a visible create action to MainHeader.Configure', () => {
        render(<CouponsList />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({
                  type: 'action',
                  dataTest: 'add-coupon',
                }),
              ]),
            }),
          }),
        )
      })
    })

    describe('WHEN user has no create permission', () => {
      it('THEN should pass hidden create action to MainHeader.Configure', () => {
        mockCanCreate.mockReturnValue(false)

        render(<CouponsList />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: expect.objectContaining({
              items: expect.arrayContaining([
                expect.objectContaining({
                  hidden: true,
                }),
              ]),
            }),
          }),
        )
      })
    })

    it('THEN should configure entity with view name', () => {
      render(<CouponsList />)

      expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: expect.objectContaining({
            viewName: expect.any(String),
          }),
        }),
      )
    })
  })

  describe('GIVEN user has all row-level permissions', () => {
    describe('WHEN actionColumn is called for an active coupon', () => {
      it('THEN should return edit, terminate, and delete actions', () => {
        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Active,
        })

        expect(actions).toHaveLength(3)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'pen' }))
        expect(actions[1]).toEqual(expect.objectContaining({ startIcon: 'switch' }))
        expect(actions[2]).toEqual(expect.objectContaining({ startIcon: 'trash' }))
      })
    })

    describe('WHEN actionColumn is called for a terminated coupon', () => {
      it('THEN should omit the terminate action', () => {
        mockCanTerminate.mockReturnValue(false)

        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Terminated,
        })

        expect(actions).toHaveLength(2)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'pen' }))
        expect(actions[1]).toEqual(expect.objectContaining({ startIcon: 'trash' }))
      })
    })
  })

  describe('GIVEN user has no row-level permissions', () => {
    describe('WHEN actionColumn is called for a row item', () => {
      it('THEN should return empty array', () => {
        mockCanEdit.mockReturnValue(false)
        mockCanTerminate.mockReturnValue(false)
        mockCanDelete.mockReturnValue(false)

        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => unknown[]

        const actions = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Active,
        })

        expect(actions).toEqual([])
      })
    })
  })

  describe('GIVEN user has only couponsUpdate permission', () => {
    describe('WHEN actionColumn is called for an active coupon', () => {
      it('THEN should return edit and terminate actions but not delete', () => {
        mockCanDelete.mockReturnValue(false)

        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Active,
        })

        expect(actions).toHaveLength(2)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'pen' }))
        expect(actions[1]).toEqual(expect.objectContaining({ startIcon: 'switch' }))
      })
    })
  })

  describe('GIVEN user has only couponsDelete permission', () => {
    describe('WHEN actionColumn is called', () => {
      it('THEN should return only the delete action', () => {
        mockCanEdit.mockReturnValue(false)
        mockCanTerminate.mockReturnValue(false)

        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => { startIcon: string }[]

        const actions = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Active,
        })

        expect(actions).toHaveLength(1)
        expect(actions[0]).toEqual(expect.objectContaining({ startIcon: 'trash' }))
      })
    })
  })

  describe('GIVEN the edit action is a link', () => {
    describe('WHEN its target is built', () => {
      it('THEN should point at the coupon edit route', () => {
        render(<CouponsList />)

        const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
          item: Record<string, unknown>,
        ) => ActionItem<{ id: string }>[]

        const [editAction] = actionColumn({
          id: 'coupon-1',
          name: 'Test Coupon',
          status: CouponStatusEnum.Active,
        })

        editAction?.link?.({ id: 'coupon-1' })

        expect(generatePath).toHaveBeenLastCalledWith('/update/coupons/:couponId', {
          couponId: 'coupon-1',
        })
      })
    })
  })

  describe('GIVEN move to live mode', () => {
    const MOVE_ROW = {
      id: 'coupon-1',
      name: 'Coupon',
      code: 'coupon',
      status: CouponStatusEnum.Active,
      appliedCouponsCount: 0,
    }

    const getMoveAction = (row: typeof MOVE_ROW = MOVE_ROW) => {
      const actionColumn = mockTableProps.mock.calls[0]?.[0]?.actionColumn as (
        item: typeof MOVE_ROW,
      ) => ActionItem<typeof MOVE_ROW>[]

      return actionColumn(row).find((action) => action.dataTest === MOVE_TO_LIVE_ACTION_TEST_ID)
    }

    afterEach(() => {
      mockCanMoveToLive = false
    })

    it('WHEN the member can move items THEN the row action moves the item to live mode', () => {
      mockCanMoveToLive = true

      render(<CouponsList />)

      const moveAction = getMoveAction()

      expect(moveAction?.startIcon).toBe('outside')

      moveAction?.onAction?.(MOVE_ROW)

      expect(mockMoveToLive).toHaveBeenCalledWith({
        itemType: MoveToLiveMovableItemTypeEnum.Coupon,
        id: MOVE_ROW.id,
      })
    })

    it('WHEN the coupon is terminated THEN there is no move to live row action', () => {
      mockCanMoveToLive = true

      render(<CouponsList />)

      expect(getMoveAction({ ...MOVE_ROW, status: CouponStatusEnum.Terminated })).toBeUndefined()
    })

    it('WHEN the member cannot move items THEN there is no move to live row action', () => {
      render(<CouponsList />)

      expect(getMoveAction()).toBeUndefined()
    })
  })
})
