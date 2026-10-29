import { ApolloError } from '@apollo/client'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import { FILTERS_PANEL_OPENER_TEST_ID } from '~/components/Filters/presentation/FiltersPanelPopper'
import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  ChargeModelEnum,
  CurrencyEnum,
  PlanInterval,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ATTRIBUTION_FILTERS_PREFIX,
  ATTRIBUTION_TIME_RANGE_FILTER_KEY,
  getAttributionEntityFilterKey,
} from '../attributionFilters'
import {
  ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID,
  ATTRIBUTION_SHOW_MORE_TEST_ID,
  ATTRIBUTION_TABLE_ROW_TEST_ID,
  ATTRIBUTION_TABLE_TEST_ID,
} from '../AttributionFlatTable'
import { getAttributionToolbarOptionTestId } from '../AttributionToolbarSelect'
import { AttributionHierarchyType, getAttributionNodeKey } from '../attributionTree'
import { ATTRIBUTION_TREE_TABLE_TEST_ID } from '../AttributionTreeTable'
import { AttributionGroupByEnum, SPLIT_FILTERS_PER_PAGE } from '../buildAttributionColumns'
import {
  ATTRIBUTION_CHARGES_TEST_ID,
  ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
  ATTRIBUTION_LIST_BY_TEST_ID,
  ATTRIBUTION_REFRESH_BUTTON_TEST_ID,
  ATTRIBUTION_SHOW_TEST_ID,
  ATTRIBUTION_UNDER_TEST_ID,
  SubscriptionAttributionTabContent,
} from '../SubscriptionAttributionTabContent'

const PLACEHOLDER_TEST_ID = 'generic-placeholder'

jest.mock('~/core/apolloClient', () => ({
  ...jest.requireActual('~/core/apolloClient'),
  addToast: jest.fn(),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/components/designSystem/GenericPlaceholder', () => ({
  GenericPlaceholder: ({ buttonAction, title }: { buttonAction?: () => void; title?: string }) => (
    <button data-test="generic-placeholder" data-title={title} onClick={buttonAction} />
  ),
}))

const mockUseAttributionTree = jest.fn()
const mockRefreshTree = jest.fn()
const mockLoadMoreTreeRows = jest.fn()
const mockLoadMoreFilterPage = jest.fn()

jest.mock('../useAttributionTree', () => ({
  ...jest.requireActual('../useAttributionTree'),
  useAttributionTree: (params: unknown) => mockUseAttributionTree(params),
}))

const mockSetupQuery = jest.fn()
const mockChargesQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionAttributionSetupQuery: (options: unknown) => mockSetupQuery(options),
  useGetSubscriptionAttributionChargesQuery: (options: unknown) => mockChargesQuery(options),
}))

type AttributionCharge = AttributionChargeUsageFragment['charge']

const tokensCharge: AttributionCharge = {
  id: 'charge-tokens',
  code: 'tokens',
  invoiceDisplayName: null,
  chargeModel: ChargeModelEnum.Standard,
  billableMetric: { id: 'bm-tokens', name: 'Tokens' },
  filters: [{ id: 'filter-opus' }],
}

const storageCharge: AttributionCharge = {
  id: 'charge-storage',
  code: 'storage',
  invoiceDisplayName: null,
  chargeModel: ChargeModelEnum.Graduated,
  billableMetric: { id: 'bm-storage', name: 'Storage' },
  filters: [],
}

const usageOf = (charge: AttributionCharge, units: number): AttributionChargeUsageFragment => ({
  charge,
  chargeFilter: null,
  units,
  amountCents: null,
})

const filteredUsageOf = (
  filterId: string,
  invoiceDisplayName: string,
  units: number,
): AttributionChargeUsageFragment => ({
  charge: tokensCharge,
  chargeFilter: { id: filterId, invoiceDisplayName, values: {} },
  units,
  amountCents: null,
})

const rootBlockOf = (code: string, chargesUsage: AttributionChargeUsageFragment[]) => ({
  level: { code, name: code, isLeaf: false },
  usages: [
    {
      currency: CurrencyEnum.Usd,
      metadata: { currentPage: 1, totalPages: 1 },
      rows: [],
      unattributed: { amountCents: null, chargesUsage: [] },
      totals: { amountCents: null, chargesUsage },
    },
  ],
  isLoadingMore: false,
})

const flatTypes = [
  { id: 'type-api-key', code: 'api_key', name: 'API Key' },
  { id: 'type-agent', code: 'agent_id', name: 'Agent' },
]

const mockRefetchSetup = jest.fn()
const mockRefetchCharges = jest.fn()

const toFlatHierarchy = (
  types: AttributionHierarchyType[],
  parentId: string | null = null,
): Array<Omit<AttributionHierarchyType, 'children'> & { parent: { id: string } | null }> =>
  types.flatMap(({ children = [], ...type }) => [
    { ...type, parent: parentId ? { id: parentId } : null },
    ...toFlatHierarchy(children, type.id),
  ])

const mockSetup = ({
  flat = flatTypes,
  roots = [],
}: { flat?: typeof flatTypes; roots?: AttributionHierarchyType[] } = {}): void => {
  mockSetupQuery.mockReturnValue({
    data: {
      subscription: {
        id: 'subscription-1',
        startedAt: '2026-01-01T00:00:00Z',
        currentBillingPeriodStartedAt: '2026-10-01T00:00:00Z',
        plan: { id: 'plan-1', interval: PlanInterval.Monthly },
        customer: { id: 'customer-1', displayName: 'Acme Corp' },
      },
      flatAttributionTypes: { collection: flat },
      hierarchicalAttributionTypes: { collection: toFlatHierarchy(roots) },
    },
    loading: false,
    error: undefined,
    refetch: mockRefetchSetup,
  })
}

const firstPageUsage = {
  currency: CurrencyEnum.Usd,
  splitFiltersCount: null,
  rows: [
    { value: 'k_live_ab12', amountCents: null, chargesUsage: [usageOf(tokensCharge, 4)] },
    { value: 'k_live_c7e0', amountCents: null, chargesUsage: [usageOf(tokensCharge, 2)] },
  ],
  unattributed: { amountCents: null, chargesUsage: [usageOf(tokensCharge, 1)] },
  totals: { amountCents: null, chargesUsage: [usageOf(tokensCharge, 7)] },
}

const mockTree = (overrides: Record<string, unknown> = {}): void => {
  mockUseAttributionTree.mockReturnValue({
    nodes: {},
    isLoadingFilterPage: false,
    toggleNode: jest.fn(),
    loadMore: mockLoadMoreTreeRows,
    loadMoreFilterPage: mockLoadMoreFilterPage,
    refresh: mockRefreshTree,
    ...overrides,
  })
}

const loadedRootOf = (blocks: unknown[]) => ({
  [getAttributionNodeKey([])]: { status: 'loaded', isExpanded: true, blocks },
})

const mockUsage = ({
  currentPage = 1,
  totalPages = 1,
  isLoadingMore = false,
}: {
  currentPage?: number
  totalPages?: number
  isLoadingMore?: boolean
} = {}): void => {
  mockTree({
    nodes: loadedRootOf([
      {
        level: { code: 'api_key', name: 'API Key', isLeaf: true },
        usages: [{ ...firstPageUsage, metadata: { currentPage, totalPages } }],
        isLoadingMore,
      },
    ]),
  })
}

const mockRootError = (error: unknown): void => {
  mockTree({ nodes: { [getAttributionNodeKey([])]: { status: 'error', error } } })
}

const getLastTreeParams = () => mockUseAttributionTree.mock.calls.at(-1)?.[0]

const getLastUsageVariables = (): Record<string, unknown> => {
  const params = getLastTreeParams()

  return { ...params.variables, groupBy: params.getChildLevels(null)[0]?.code }
}

const selectOptionByValue = async (
  user: ReturnType<typeof userEvent.setup>,
  openerTestId: string,
  value: string,
): Promise<void> => {
  await user.click(screen.getByTestId(openerTestId))
  await user.click(screen.getByTestId(getAttributionToolbarOptionTestId(openerTestId, value)))
}

describe('SubscriptionAttributionTabContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock

    useParamsMock.mockReturnValue({ subscriptionId: 'subscription-1' })

    mockSetup()
    mockChargesQuery.mockReturnValue({
      data: {
        attributedUsage: {
          totals: { chargesUsage: [usageOf(tokensCharge, 0), usageOf(storageCharge, 0)] },
        },
      },
      refetch: mockRefetchCharges,
    })
    mockUsage()
  })

  describe('GIVEN no flat key is listed', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should query the first flat type with units and every charge', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({
            subscriptionId: 'subscription-1',
            groupBy: 'api_key',
            basis: AttributedUsageBasisEnum.Units,
            chargeIds: undefined,
            splitChargeId: undefined,
          }),
        )
      })

      it('THEN should render a single customer row', () => {
        render(<SubscriptionAttributionTabContent />)

        const rows = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)

        expect(rows).toHaveLength(1)
        expect(rows[0]).toHaveTextContent('Acme Corp')
        expect(rows[0]).toHaveTextContent('7')
      })
    })
  })

  describe('GIVEN a flat type whose code matches the no flat key option', () => {
    describe('WHEN it is selected in the list by selector', () => {
      it('THEN should group by that type', async () => {
        const user = userEvent.setup()

        mockSetup({ flat: [...flatTypes, { id: 'type-all', code: '__ALL__', name: 'All' }] })

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, '__ALL__')

        expect(getLastUsageVariables()).toEqual(expect.objectContaining({ groupBy: '__ALL__' }))
      })
    })
  })

  describe('GIVEN there is no flat type but a hierarchical root type', () => {
    describe('WHEN rows are grouped flat', () => {
      it('THEN should query the root hierarchical type', async () => {
        const user = userEvent.setup()

        mockSetup({
          flat: [],
          roots: [{ id: 'type-dept', code: 'department', name: 'Department' }],
        })

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(
          user,
          ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
          AttributionGroupByEnum.flat,
        )

        expect(getLastTreeParams().skip).toBe(false)
        expect(getLastUsageVariables()).toEqual(expect.objectContaining({ groupBy: 'department' }))
      })
    })
  })

  describe('GIVEN no usage attribution type exists', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should display the empty placeholder and skip the usage query', () => {
        mockSetup({ flat: [], roots: [] })

        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TABLE_TEST_ID)).not.toBeInTheDocument()
        expect(getLastTreeParams().skip).toBe(true)
      })
    })
  })

  describe('GIVEN a flat key with more values than one page', () => {
    describe('WHEN the list is displayed', () => {
      it('THEN should display the show more row before the unattributed row', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        const loadMoreRow = screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID).closest('tr')
        const rows = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)

        expect(rows[1].nextElementSibling).toBe(loadMoreRow)
        expect(loadMoreRow?.nextElementSibling).toBe(rows[2])
      })
    })

    describe('WHEN clicking show more', () => {
      it('THEN should load the next rows of the root block', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        expect(mockLoadMoreTreeRows).toHaveBeenCalledWith([], 0)
      })
    })

    describe('WHEN the next page is loading', () => {
      it('THEN should keep the loaded rows and disable show more', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2, isLoadingMore: true })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)).toHaveLength(3)
        expect(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN show more is loading the next page', () => {
      it('THEN should disable refresh so it cannot reset the list under the pending page', () => {
        mockUsage({ totalPages: 3, isLoadingMore: true })
        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(ATTRIBUTION_REFRESH_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the last page is loaded', () => {
      it('THEN should hide show more', async () => {
        const user = userEvent.setup()

        mockUsage({ currentPage: 2, totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        expect(screen.queryByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN no flat key is listed', () => {
      it('THEN should not display show more next to the customer row', () => {
        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        expect(screen.queryByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the plan has no charge supporting attribution', () => {
    describe('WHEN the charges have loaded empty', () => {
      it('THEN should display the empty placeholder instead of the table', () => {
        mockChargesQuery.mockReturnValue({
          data: { attributedUsage: { totals: { chargesUsage: [] } } },
          loading: false,
          refetch: mockRefetchCharges,
        })

        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TABLE_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN the charges are still loading', () => {
      it('THEN should keep displaying the table', () => {
        mockChargesQuery.mockReturnValue({
          data: undefined,
          loading: true,
          refetch: mockRefetchCharges,
        })

        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(ATTRIBUTION_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a flat key is listed', () => {
    describe('WHEN the user picks it in List by', () => {
      it('THEN should group by its code and render its values then the unattributed row', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'agent_id')

        expect(getLastUsageVariables()).toEqual(expect.objectContaining({ groupBy: 'agent_id' }))

        const rows = screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)

        expect(rows).toHaveLength(3)
        expect(rows[0]).toHaveTextContent('k_live_ab12')
        expect(rows[0]).toHaveTextContent('Agent')
      })
    })
  })

  describe('GIVEN the user narrows the charges', () => {
    describe('WHEN picking a charge with filters', () => {
      it('THEN should request that charge split by its filters', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, tokensCharge.id)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({ chargeIds: ['charge-tokens'], splitChargeId: 'charge-tokens' }),
        )
      })
    })

    describe('WHEN a charge is selected and List by changes afterwards', () => {
      it('THEN should keep the charges list query and the selected charge', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, tokensCharge.id)
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'agent_id')

        expect(mockChargesQuery.mock.calls.at(-1)?.[0].variables).toEqual({
          subscriptionId: 'subscription-1',
          groupBy: 'api_key',
        })
        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({
            groupBy: 'agent_id',
            chargeIds: ['charge-tokens'],
            splitChargeId: 'charge-tokens',
          }),
        )
      })
    })

    describe('WHEN picking a charge without filters', () => {
      it('THEN should request that charge without splitting it', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, storageCharge.id)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({ chargeIds: ['charge-storage'], splitChargeId: undefined }),
        )
      })
    })
  })

  describe('GIVEN the Show selector', () => {
    describe('WHEN the user picks amounts with a priced charge available', () => {
      it('THEN should query the amount basis', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_SHOW_TEST_ID, AttributedUsageBasisEnum.Amount)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({ basis: AttributedUsageBasisEnum.Amount }),
        )
      })
    })

    describe('WHEN amounts are selected then a non priced charge is picked', () => {
      it('THEN should fall back to the units basis', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_SHOW_TEST_ID, AttributedUsageBasisEnum.Amount)
        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, storageCharge.id)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({ basis: AttributedUsageBasisEnum.Units }),
        )
      })
    })

    describe('WHEN only a non priced charge is selected', () => {
      it('THEN should disable the amounts option', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, storageCharge.id)
        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_TEST_ID))

        expect(
          screen.getByTestId(
            getAttributionToolbarOptionTestId(
              ATTRIBUTION_SHOW_TEST_ID,
              AttributedUsageBasisEnum.Amount,
            ),
          ),
        ).toBeDisabled()
      })
    })
  })

  describe('GIVEN the usage query failed', () => {
    describe('WHEN the user retries from the error placeholder', () => {
      it('THEN should refetch the queries', async () => {
        const user = userEvent.setup()

        mockRootError(new Error('boom'))

        render(<SubscriptionAttributionTabContent />)

        await user.click(screen.getByTestId(PLACEHOLDER_TEST_ID))

        expect(mockRefetchSetup).toHaveBeenCalled()
        expect(mockRefreshTree).toHaveBeenCalled()
      })
    })

    describe('WHEN the error placeholder is displayed', () => {
      it('THEN should keep the toolbar so the selection can be changed', async () => {
        const user = userEvent.setup()

        mockRootError(new Error('too_many_filters'))

        render(<SubscriptionAttributionTabContent />)

        expect(screen.queryByTestId(ATTRIBUTION_TABLE_TEST_ID)).not.toBeInTheDocument()

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, storageCharge.id)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({ chargeIds: ['charge-storage'] }),
        )
      })
    })
  })

  describe('GIVEN the tab is displayed', () => {
    describe('WHEN clicking refresh', () => {
      it('THEN should refetch the charges and the usage', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        await user.click(screen.getByTestId(ATTRIBUTION_REFRESH_BUTTON_TEST_ID))

        expect(mockRefetchCharges).toHaveBeenCalled()
        expect(mockRefreshTree).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN hierarchical types are configured', () => {
    const userType: AttributionHierarchyType = { id: 'type-user', code: 'user', name: 'User' }
    const teamType: AttributionHierarchyType = {
      id: 'type-team',
      code: 'team',
      name: 'Team',
      children: [userType],
    }
    const departmentType: AttributionHierarchyType = {
      id: 'type-dept',
      code: 'department',
      name: 'Department',
      children: [teamType],
    }

    beforeEach(() => {
      mockSetup({ roots: [departmentType] })
    })

    describe('WHEN rows are grouped hierarchically', () => {
      it('THEN should always fetch the usage attribution types from the network', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(mockSetupQuery).toHaveBeenCalledWith(
          expect.objectContaining({ fetchPolicy: 'network-only' }),
        )
      })

      it('THEN should render the tree instead of the flat table', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(ATTRIBUTION_TREE_TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TABLE_TEST_ID)).not.toBeInTheDocument()
        expect(getLastTreeParams()).toEqual(
          expect.objectContaining({
            skip: false,
            variables: expect.objectContaining({
              subscriptionId: 'subscription-1',
              basis: AttributedUsageBasisEnum.Units,
              limit: 50,
            }),
          }),
        )
      })

      it('THEN should resolve the root levels from the root types', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(getLastTreeParams().getChildLevels(null)).toEqual([
          { code: 'department', name: 'Department', isLeaf: false },
        ])
      })

      it('THEN should not display the under selector', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(screen.queryByTestId(ATTRIBUTION_UNDER_TEST_ID)).not.toBeInTheDocument()
      })
    })

    describe('WHEN rows are grouped flat', () => {
      it('THEN should load a single leaf level and render the flat table', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(
          user,
          ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
          AttributionGroupByEnum.flat,
        )

        const { getChildLevels } = getLastTreeParams()

        expect(getChildLevels(null)).toEqual([{ code: 'api_key', name: 'api_key', isLeaf: true }])
        expect(getChildLevels('department')).toEqual([])
        expect(screen.getByTestId(ATTRIBUTION_TABLE_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should change the reset key so the tree reloads in flat mode', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        const treeResetKey = getLastTreeParams().resetKey

        await selectOptionByValue(
          user,
          ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
          AttributionGroupByEnum.flat,
        )

        expect(getLastTreeParams().resetKey).not.toBe(treeResetKey)
      })
    })

    describe('WHEN a flat key is listed', () => {
      it('THEN should display the under selector defaulting to the lowest level', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        expect(screen.getByTestId(ATTRIBUTION_UNDER_TEST_ID)).toBeInTheDocument()
        expect(getLastTreeParams().getChildLevels('user')).toEqual([
          { code: 'api_key', name: 'API Key', isLeaf: true },
        ])
      })

      it('THEN should stop the tree at the selected under level', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        const previousResetKey = getLastTreeParams().resetKey

        await selectOptionByValue(user, ATTRIBUTION_UNDER_TEST_ID, 'team')

        expect(getLastTreeParams().resetKey).not.toEqual(previousResetKey)
        expect(getLastTreeParams().getChildLevels('team')).toEqual([
          { code: 'api_key', name: 'API Key', isLeaf: true },
        ])
      })

      it('THEN should reset the under level when the flat key changes', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await selectOptionByValue(user, ATTRIBUTION_UNDER_TEST_ID, 'team')
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'agent_id')

        expect(getLastTreeParams().getChildLevels('user')).toEqual([
          { code: 'agent_id', name: 'Agent', isLeaf: true },
        ])
      })
    })

    describe('WHEN a toolbar value changes', () => {
      it('THEN should change the tree reset key', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        const previousResetKey = getLastTreeParams().resetKey

        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, 'charge-storage')

        expect(getLastTreeParams().resetKey).not.toEqual(previousResetKey)
      })
    })

    describe('WHEN the setup returns a different hierarchy', () => {
      it('THEN should change the tree reset key', () => {
        const { rerender } = render(<SubscriptionAttributionTabContent />)

        const previousResetKey = getLastTreeParams().resetKey

        mockSetup({
          roots: [departmentType, { id: 'type-region', code: 'region', name: 'Region' }],
        })
        rerender(<SubscriptionAttributionTabContent />)

        expect(getLastTreeParams().resetKey).not.toEqual(previousResetKey)
        expect(getLastTreeParams().getChildLevels(null)).toEqual([
          { code: 'department', name: 'Department', isLeaf: false },
          { code: 'region', name: 'Region', isLeaf: true },
        ])
      })
    })

    describe('WHEN the root exposes several levels', () => {
      it('THEN should build the columns from every root block, not only the first', async () => {
        const user = userEvent.setup()

        const regionType: AttributionHierarchyType = {
          id: 'type-region',
          code: 'region',
          name: 'Region',
        }

        mockSetup({ roots: [departmentType, regionType] })
        mockTree({
          nodes: loadedRootOf([
            rootBlockOf('department', [filteredUsageOf('filter-opus', 'Opus', 4)]),
            rootBlockOf('region', [filteredUsageOf('filter-sonnet', 'Sonnet', 2)]),
          ]),
        })

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, tokensCharge.id)

        expect(screen.getByText('Opus')).toBeInTheDocument()
        expect(screen.getByText('Sonnet')).toBeInTheDocument()
      })
    })

    describe('WHEN refresh is clicked', () => {
      it('THEN should refresh the tree', async () => {
        const user = userEvent.setup()

        mockTree({ nodes: loadedRootOf([]) })

        render(<SubscriptionAttributionTabContent />)
        await user.click(screen.getByTestId(ATTRIBUTION_REFRESH_BUTTON_TEST_ID))

        expect(mockRefreshTree).toHaveBeenCalled()
      })
    })

    describe('WHEN the root level failed to load', () => {
      it('THEN should display the error placeholder', () => {
        mockRootError(undefined)

        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(PLACEHOLDER_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TREE_TABLE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN filters applied in the URL', () => {
    const setUrlFilters = (filters: Record<string, string>): void => {
      const search = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [
            `${ATTRIBUTION_FILTERS_PREFIX}_${key}`,
            value,
          ]),
        ),
      )

      window.history.pushState({}, '', `/?${search.toString()}`)
    }

    const getLastTreeVariables = (): Record<string, unknown> =>
      mockUseAttributionTree.mock.calls.at(-1)?.[0].variables

    afterEach(() => {
      window.history.pushState({}, '', '/')
    })

    describe('WHEN the tab renders', () => {
      it('THEN should display the filters bar', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(FILTERS_PANEL_OPENER_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN a custom time range and entity filters are applied', () => {
      beforeEach(() => {
        setUrlFilters({
          [ATTRIBUTION_TIME_RANGE_FILTER_KEY]: '2026-09-01T00:00:00.000Z,2026-09-10T23:59:59.999Z',
          [getAttributionEntityFilterKey('api_key')]: 'k_live_ab12,k_live_c7e0',
          [getAttributionEntityFilterKey('unknown_type')]: 'ignored',
        })
      })

      it('THEN should send them with the flat usage query', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({
            fromDatetime: '2026-09-01T00:00:00.000Z',
            toDatetime: '2026-09-10T23:59:59.999Z',
            filters: [{ code: 'api_key', values: ['k_live_ab12', 'k_live_c7e0'] }],
          }),
        )
      })

      it('THEN should send them with the tree requests', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(getLastTreeVariables()).toEqual(
          expect.objectContaining({
            fromDatetime: '2026-09-01T00:00:00.000Z',
            toDatetime: '2026-09-10T23:59:59.999Z',
            filters: [{ code: 'api_key', values: ['k_live_ab12', 'k_live_c7e0'] }],
          }),
        )
      })
    })

    describe('WHEN the past billing period is applied', () => {
      it('THEN should send the previous period bounds', () => {
        setUrlFilters({ [ATTRIBUTION_TIME_RANGE_FILTER_KEY]: 'past' })

        render(<SubscriptionAttributionTabContent />)

        expect(getLastUsageVariables()).toEqual(
          expect.objectContaining({
            fromDatetime: '2026-09-01T00:00:00.000Z',
            toDatetime: '2026-09-30T23:59:59.000Z',
          }),
        )
      })
    })

    describe('WHEN only the current billing period is applied', () => {
      it('THEN should send neither bounds nor filters', () => {
        setUrlFilters({ [ATTRIBUTION_TIME_RANGE_FILTER_KEY]: 'current' })

        render(<SubscriptionAttributionTabContent />)

        const variables = getLastUsageVariables()

        expect(variables.fromDatetime).toBeUndefined()
        expect(variables.toDatetime).toBeUndefined()
        expect(variables.filters).toBeUndefined()
      })
    })
  })

  describe('GIVEN the whole table request fails', () => {
    const guardError = new ApolloError({
      graphQLErrors: [
        new GraphQLError('Unprocessable Entity', { extensions: { code: 'too_many_groups' } }),
      ],
    })

    const getPlaceholderTitle = (): string | null =>
      screen.getByTestId(PLACEHOLDER_TEST_ID).getAttribute('data-title')

    const getGenericErrorTitle = (): string | null => {
      mockRootError(new Error('boom'))

      const { unmount } = render(<SubscriptionAttributionTabContent />)
      const title = getPlaceholderTitle()

      unmount()

      return title
    }

    describe('WHEN the flat usage query hits a guard error', () => {
      it('THEN should display the narrow your view placeholder instead of the generic one', () => {
        const genericTitle = getGenericErrorTitle()

        mockRootError(guardError)
        render(<SubscriptionAttributionTabContent />)

        expect(getPlaceholderTitle()).toEqual(expect.any(String))
        expect(getPlaceholderTitle()).not.toBe(genericTitle)
      })
    })

    describe('WHEN the tree root hits a guard error', () => {
      it('THEN should display the narrow your view placeholder', () => {
        const genericTitle = getGenericErrorTitle()

        mockSetup({
          roots: [{ id: 'type-department', code: 'department', name: 'Department' }],
        })
        mockRootError(guardError)

        render(<SubscriptionAttributionTabContent />)

        expect(getPlaceholderTitle()).not.toBe(genericTitle)
      })
    })

    describe('WHEN the tree root hits any other error', () => {
      it('THEN should keep the generic error placeholder', () => {
        const genericTitle = getGenericErrorTitle()

        mockSetup({
          roots: [{ id: 'type-department', code: 'department', name: 'Department' }],
        })
        mockRootError(new Error('boom'))

        render(<SubscriptionAttributionTabContent />)

        expect(getPlaceholderTitle()).toBe(genericTitle)
      })
    })
  })
  describe('GIVEN a split charge with more filters than one filter page', () => {
    const filterUsages = (models: string[]): AttributionChargeUsageFragment[] =>
      models.map((model) => filteredUsageOf(`filter-${model}`, model, 1))
    const defaultTokensUsage = usageOf(tokensCharge, 1)

    const splitBlock = (pages: string[][], splitFiltersCount = 11) => ({
      level: { code: 'api_key', name: 'API Key', isLeaf: true },
      usages: pages.map((models) => ({
        ...firstPageUsage,
        splitFiltersCount,
        metadata: { currentPage: 1, totalPages: 1 },
        totals: {
          amountCents: null,
          splitChargeUnits: 42,
          chargesUsage: [...filterUsages(models), defaultTokensUsage],
        },
      })),
      isLoadingMore: false,
    })

    const firstPageModels = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10']

    const renderSplit = async (
      treeOverrides: Record<string, unknown> = {},
      pages: string[][] = [firstPageModels],
      splitFiltersCount = 11,
    ) => {
      const user = userEvent.setup()

      mockTree({
        nodes: loadedRootOf([splitBlock(pages, splitFiltersCount)]),
        ...treeOverrides,
      })
      render(<SubscriptionAttributionTabContent />)
      await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, tokensCharge.id)

      return user
    }

    const getHeaderLabels = (): string[] =>
      Array.from(
        screen.getByTestId(ATTRIBUTION_TABLE_TEST_ID).querySelectorAll('thead tr:nth-child(2) th'),
      ).map((th) => th.textContent ?? '')

    describe('WHEN the columns are collapsed', () => {
      it('THEN should expand the first page without fetching another filter page', async () => {
        const user = await renderSplit()

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(mockLoadMoreFilterPage).not.toHaveBeenCalled()
        expect(getHeaderLabels().slice(1, -1)).toEqual([...firstPageModels, expect.any(String)])
      })
    })

    describe('WHEN the first page is expanded and more filters remain', () => {
      it('THEN should fetch the next filter page on show more', async () => {
        const user = await renderSplit()

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))
        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(mockLoadMoreFilterPage).toHaveBeenCalledTimes(1)
      })

      it('THEN should show show more in loading state while the filter page loads', async () => {
        const user = await renderSplit({ isLoadingFilterPage: true })

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toBeDisabled()
        expect(screen.getByTestId(ATTRIBUTION_REFRESH_BUTTON_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN a second filter page is loaded', () => {
      it('THEN should append its columns and keep the default column last', async () => {
        const user = await renderSplit({}, [firstPageModels, ['m11']])

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        const labels = getHeaderLabels()

        expect(labels.slice(1, -1)).toEqual([...firstPageModels, 'm11', expect.any(String)])
        expect(labels.filter((label) => label === 'm11')).toHaveLength(1)
      })

      it('THEN should hide show more once every filter is loaded', async () => {
        const user = await renderSplit({}, [firstPageModels, ['m11']])

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(screen.queryByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).not.toBeInTheDocument()
      })

      it('THEN should show the split charge units of the API as the row total', async () => {
        const user = await renderSplit({}, [firstPageModels, ['m11']])

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        const customerCells = screen
          .getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)[0]
          .querySelectorAll('td')

        expect(customerCells[customerCells.length - 1]).toHaveTextContent('42')
      })
    })

    describe('WHEN a toolbar value changes while the columns are expanded', () => {
      it('THEN should collapse the columns back to the first page view', async () => {
        const user = await renderSplit({}, [firstPageModels, ['m11']])

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))
        expect(screen.queryByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).not.toBeInTheDocument()

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toBeEnabled()
        expect(getHeaderLabels().slice(1, -1)).toEqual(['m1', 'm2', 'm3', expect.any(String)])
      })
    })

    describe('WHEN a tree node is loading while the columns are expanded', () => {
      it('THEN should disable show more', async () => {
        const user = await renderSplit({
          nodes: {
            ...loadedRootOf([splitBlock([firstPageModels], 11)]),
            [getAttributionNodeKey([{ code: 'api_key', value: 'k_live_ab12' }])]: {
              status: 'loading',
            },
          },
        })

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN the charge has no more filters than one page', () => {
      it('THEN should not offer show more once expanded', async () => {
        const user = await renderSplit({}, [firstPageModels], SPLIT_FILTERS_PER_PAGE)

        await user.click(screen.getByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID))

        expect(screen.queryByTestId(ATTRIBUTION_SHOW_MORE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })
})
