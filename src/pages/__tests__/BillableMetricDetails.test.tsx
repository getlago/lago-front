import { MainHeaderDropdownAction, MainHeaderDropdownItem } from '~/components/MainHeader/types'
import { COPY_TO_PRODUCTION_ACTION_TEST_ID } from '~/components/sandbox/useCopyToProduction'
import { CopyToProductionCopyableItemTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import BillableMetricDetails from '../BillableMetricDetails'

const mockMainHeaderConfigure = jest.fn()
const mockHasPermissions = jest.fn()
const mockIsPremium = jest.fn()
const mockUseGetBillableMetricQuery = jest.fn()

jest.mock('~/components/MainHeader/MainHeader', () => ({
  MainHeader: {
    Configure: (props: Record<string, unknown>) => {
      mockMainHeaderConfigure(props)
      return null
    },
  },
}))

jest.mock('~/components/MainHeader/useMainHeaderTabContent', () => ({
  useMainHeaderTabContent: () => null,
}))

jest.mock('~/components/layouts/DetailsPage', () => ({
  DetailsPage: {
    Container: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}))

jest.mock('~/components/billableMetrics/BillableMetricDetailsOverview', () => ({
  BillableMetricDetailsOverview: () => null,
}))

jest.mock('~/components/billableMetrics/BillableMetricDetailsActivityLogs', () => ({
  BillableMetricDetailsActivityLogs: () => null,
}))

jest.mock('~/components/billableMetrics/DeleteBillableMetricDialog', () => ({
  useDeleteBillableMetricDialog: () => ({ openDeleteBillableMetricDialog: jest.fn() }),
}))

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

jest.mock('~/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ isPremium: mockIsPremium() }),
}))

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/core/utils/copyToClipboard', () => ({
  copyToClipboard: jest.fn(),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetBillableMetricForHeaderDetailsQuery: (options: Record<string, unknown>) =>
    mockUseGetBillableMetricQuery(options),
}))

interface MainHeaderTabConfig {
  title: string
  hidden?: boolean
}

const mockCopyToProduction = jest.fn()
let mockCanCopyToProduction = false

jest.mock('~/components/sandbox/useCopyToProduction', () => ({
  ...jest.requireActual('~/components/sandbox/useCopyToProduction'),
  useCopyToProduction: () => ({
    canCopyToProduction: mockCanCopyToProduction,
    copyToProduction: mockCopyToProduction,
  }),
}))

describe('BillableMetricDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

    useParamsMock.mockReturnValue({ billableMetricId: 'bm-123' })
    mockIsPremium.mockReturnValue(true)
    mockUseGetBillableMetricQuery.mockReturnValue({
      data: {
        billableMetric: {
          id: 'bm-123',
          name: 'Test BM',
          code: 'test-bm',
        },
      },
      loading: false,
    })
  })

  describe('GIVEN the component is rendered with data', () => {
    describe('WHEN the billable metric is loaded', () => {
      it('THEN should configure MainHeader with breadcrumb', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            breadcrumb: expect.arrayContaining([
              expect.objectContaining({
                label: expect.any(String),
                path: expect.any(String),
              }),
            ]),
          }),
        )
      })

      it('THEN should configure MainHeader with entity name and code', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            entity: expect.objectContaining({
              viewName: 'Test BM',
              metadata: 'test-bm',
            }),
          }),
        )
      })

      it('THEN should pass loading false to MainHeader.Configure', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        expect(mockMainHeaderConfigure).toHaveBeenCalledWith(
          expect.objectContaining({
            actions: expect.objectContaining({ loading: false }),
          }),
        )
      })

      it('THEN should configure tabs', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        const tabs = mockMainHeaderConfigure.mock.calls[0]?.[0]?.tabs as MainHeaderTabConfig[]

        expect(tabs.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('GIVEN user has all permissions', () => {
    describe('WHEN actions are configured', () => {
      it('THEN should include dropdown with edit, copy ID, duplicate, and delete items', () => {
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        const actions = mockMainHeaderConfigure.mock.calls[0]?.[0]?.actions
          ?.items as MainHeaderDropdownAction[]

        expect(actions).toHaveLength(1)
        expect(actions[0]?.type).toBe('dropdown')

        const visibleItems = actions[0]?.items.filter((i) => !i.hidden)

        expect(visibleItems).toHaveLength(4)
      })
    })
  })

  describe('GIVEN user has no billableMetricsUpdate permission', () => {
    describe('WHEN actions are configured', () => {
      it('THEN should hide the edit action', () => {
        mockHasPermissions.mockImplementation(
          (perms: string[]) => !perms.includes('billableMetricsUpdate'),
        )

        render(<BillableMetricDetails />)

        const actions = mockMainHeaderConfigure.mock.calls[0]?.[0]?.actions
          ?.items as MainHeaderDropdownAction[]
        const editItem = actions[0]?.items[0]

        expect(editItem?.hidden).toBe(true)
      })
    })
  })

  describe('GIVEN user has no billableMetricsCreate permission', () => {
    describe('WHEN actions are configured', () => {
      it('THEN should hide the duplicate action', () => {
        mockHasPermissions.mockImplementation(
          (perms: string[]) => !perms.includes('billableMetricsCreate'),
        )

        render(<BillableMetricDetails />)

        const actions = mockMainHeaderConfigure.mock.calls[0]?.[0]?.actions
          ?.items as MainHeaderDropdownAction[]
        const duplicateItem = actions[0]?.items[2]

        expect(duplicateItem?.hidden).toBe(true)
      })
    })
  })

  describe('GIVEN user has no billableMetricsDelete permission', () => {
    describe('WHEN actions are configured', () => {
      it('THEN should hide the delete action', () => {
        mockHasPermissions.mockImplementation(
          (perms: string[]) => !perms.includes('billableMetricsDelete'),
        )

        render(<BillableMetricDetails />)

        const actions = mockMainHeaderConfigure.mock.calls[0]?.[0]?.actions
          ?.items as MainHeaderDropdownAction[]
        const deleteItem = actions[0]?.items[3]

        expect(deleteItem?.hidden).toBe(true)
      })
    })
  })

  describe('GIVEN user is not premium', () => {
    describe('WHEN tabs are configured', () => {
      it('THEN should hide the activity logs tab', () => {
        mockIsPremium.mockReturnValue(false)
        mockHasPermissions.mockReturnValue(true)

        render(<BillableMetricDetails />)

        const tabs = mockMainHeaderConfigure.mock.calls[0]?.[0]?.tabs as MainHeaderTabConfig[]
        const activityLogsTab = tabs.find((t) => t.hidden === true)

        expect(activityLogsTab).toBeDefined()
      })
    })
  })

  describe('GIVEN copy to production', () => {
    const getMoveItem = (): MainHeaderDropdownItem | undefined => {
      const [dropdown] = mockMainHeaderConfigure.mock.calls[0]?.[0]?.actions
        ?.items as MainHeaderDropdownAction[]

      return dropdown?.items.find((item) => item.dataTest === COPY_TO_PRODUCTION_ACTION_TEST_ID)
    }

    afterEach(() => {
      mockCanCopyToProduction = false
    })

    it('WHEN the member can copy items THEN the action copies the item to production', () => {
      mockCanCopyToProduction = true
      mockHasPermissions.mockReturnValue(true)
      const closePopper = jest.fn()

      render(<BillableMetricDetails />)

      const moveItem = getMoveItem()

      expect(moveItem?.hidden).toBe(false)

      moveItem?.onClick(closePopper)

      expect(mockCopyToProduction).toHaveBeenCalledWith({
        itemType: CopyToProductionCopyableItemTypeEnum.BillableMetric,
        id: 'bm-123',
        code: 'test-bm',
      })
      expect(closePopper).toHaveBeenCalled()
    })

    it('WHEN the member cannot copy items THEN the action is hidden', () => {
      mockHasPermissions.mockReturnValue(true)

      render(<BillableMetricDetails />)

      expect(getMoveItem()?.hidden).toBe(true)
    })
  })
})
