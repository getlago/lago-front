import { ApolloError, NetworkStatus } from '@apollo/client'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'

import { FILTERS_PANEL_OPENER_TEST_ID } from '~/components/Filters/presentation/FiltersPanelPopper'
import { addToast } from '~/core/apolloClient'
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
  ATTRIBUTION_TABLE_ROW_TEST_ID,
  ATTRIBUTION_TABLE_TEST_ID,
} from '../AttributionFlatTable'
import { getAttributionToolbarOptionTestId } from '../AttributionToolbarSelect'
import { AttributionHierarchyType, getAttributionNodeKey } from '../attributionTree'
import { ATTRIBUTION_TREE_TABLE_TEST_ID } from '../AttributionTreeTable'
import { AttributionGroupByEnum } from '../buildAttributionColumns'
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

jest.mock('../useAttributionTree', () => ({
  ...jest.requireActual('../useAttributionTree'),
  useAttributionTree: (params: unknown) => mockUseAttributionTree(params),
}))

const mockSetupQuery = jest.fn()
const mockChargesQuery = jest.fn()
const mockUsageQuery = jest.fn()

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useGetSubscriptionAttributionSetupQuery: (options: unknown) => mockSetupQuery(options),
  useGetSubscriptionAttributionChargesQuery: (options: unknown) => mockChargesQuery(options),
  useGetSubscriptionAttributedUsageQuery: (options: unknown) => mockUsageQuery(options),
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
  usage: {
    currency: CurrencyEnum.Usd,
    metadata: { currentPage: 1, totalPages: 1 },
    rows: [],
    unattributed: { amountCents: null, chargesUsage: [] },
    totals: { amountCents: null, chargesUsage },
  },
  isLoadingMore: false,
})

const flatTypes = [
  { id: 'type-api-key', code: 'api_key', name: 'API Key' },
  { id: 'type-agent', code: 'agent_id', name: 'Agent' },
]

const mockRefetchSetup = jest.fn()
const mockRefetchCharges = jest.fn()
const mockRefetchUsage = jest.fn()

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

const mockFetchMoreUsage = jest.fn()

const firstPageUsage = {
  currency: CurrencyEnum.Usd,
  rows: [
    { value: 'k_live_ab12', amountCents: null, chargesUsage: [usageOf(tokensCharge, 4)] },
    { value: 'k_live_c7e0', amountCents: null, chargesUsage: [usageOf(tokensCharge, 2)] },
  ],
  unattributed: { amountCents: null, chargesUsage: [usageOf(tokensCharge, 1)] },
  totals: { amountCents: null, chargesUsage: [usageOf(tokensCharge, 7)] },
}

const mockUsage = ({
  currentPage = 1,
  totalPages = 1,
  loading = false,
  networkStatus = NetworkStatus.ready,
}: {
  currentPage?: number
  totalPages?: number
  loading?: boolean
  networkStatus?: NetworkStatus
} = {}): void => {
  mockUsageQuery.mockReturnValue({
    data: { attributedUsage: { ...firstPageUsage, metadata: { currentPage, totalPages } } },
    loading,
    networkStatus,
    error: undefined,
    refetch: mockRefetchUsage,
    fetchMore: mockFetchMoreUsage,
  })
}

const getLastUsageVariables = (): Record<string, unknown> =>
  mockUsageQuery.mock.calls.at(-1)?.[0].variables

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
    mockFetchMoreUsage.mockResolvedValue({})

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
    mockUseAttributionTree.mockReturnValue({
      nodes: {},
      toggleNode: jest.fn(),
      loadMore: jest.fn(),
      refresh: mockRefreshTree,
    })
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

  describe('GIVEN only flat attribution types exist', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should show the flat grouping and disable the hierarchical one', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(ATTRIBUTION_GROUP_ROWS_BY_TEST_ID)).toHaveTextContent(
          'text_17902308125635bb6aqr2wbe',
        )

        await user.click(screen.getByTestId(ATTRIBUTION_GROUP_ROWS_BY_TEST_ID))

        expect(
          screen.getByTestId(
            getAttributionToolbarOptionTestId(
              ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
              AttributionGroupByEnum.hierarchical,
            ),
          ),
        ).toBeDisabled()
        expect(screen.getByTestId(ATTRIBUTION_TABLE_TEST_ID)).toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the queries whose failure has an error placeholder', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should silence the setup and usage queries to avoid a second toast', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(mockSetupQuery.mock.calls.at(-1)?.[0].context).toEqual({ silentError: true })
        expect(mockUsageQuery.mock.calls.at(-1)?.[0].context).toEqual({ silentError: true })
      })
    })

    describe('WHEN loading the next page of rows', () => {
      it('THEN should let a failure reach the global error toast', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        expect(mockFetchMoreUsage).toHaveBeenCalledWith(
          expect.objectContaining({ context: { silentError: false } }),
        )
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

        expect(mockUsageQuery.mock.calls.at(-1)?.[0]).toEqual(
          expect.objectContaining({
            skip: false,
            variables: expect.objectContaining({ groupBy: 'department' }),
          }),
        )
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
        expect(mockUsageQuery.mock.calls.at(-1)?.[0].skip).toBe(true)
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
      it('THEN should fetch the next page and append its rows after the current ones', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        expect(mockFetchMoreUsage).toHaveBeenCalledTimes(1)

        const { variables, updateQuery } = mockFetchMoreUsage.mock.calls[0][0]
        const nextPage = {
          ...firstPageUsage,
          metadata: { currentPage: 2, totalPages: 2 },
          rows: [{ value: 'k_live_41aa', amountCents: null, chargesUsage: [] }],
          unattributed: { amountCents: null, chargesUsage: [usageOf(tokensCharge, 99)] },
        }
        const merged = updateQuery(
          { attributedUsage: { ...firstPageUsage, metadata: { currentPage: 1, totalPages: 2 } } },
          { fetchMoreResult: { attributedUsage: nextPage } },
        )

        expect(variables).toEqual({ page: 2 })
        expect(merged.attributedUsage.rows.map((row: { value: string }) => row.value)).toEqual([
          'k_live_ab12',
          'k_live_c7e0',
          'k_live_41aa',
        ])
        expect(merged.attributedUsage.metadata).toEqual({ currentPage: 2, totalPages: 2 })
        expect(merged.attributedUsage.unattributed).toBe(firstPageUsage.unattributed)
        expect(merged.attributedUsage.totals).toBe(firstPageUsage.totals)
      })
    })

    describe('WHEN the selection changes before the next page arrives', () => {
      it('THEN should drop the late page instead of appending it to the new selection', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))
        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'agent_id')

        const { updateQuery } = mockFetchMoreUsage.mock.calls[0][0]
        const current = {
          attributedUsage: { ...firstPageUsage, metadata: { currentPage: 1, totalPages: 2 } },
        }
        const latePage = {
          ...firstPageUsage,
          metadata: { currentPage: 2, totalPages: 2 },
          rows: [{ value: 'k_live_41aa', amountCents: null, chargesUsage: [] }],
        }

        expect(updateQuery(current, { fetchMoreResult: { attributedUsage: latePage } })).toBe(
          current,
        )
      })
    })

    describe('WHEN the next page comes back without data', () => {
      it('THEN should keep the loaded rows', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        const { updateQuery } = mockFetchMoreUsage.mock.calls[0][0]
        const current = {
          attributedUsage: { ...firstPageUsage, metadata: { currentPage: 1, totalPages: 2 } },
        }

        expect(updateQuery(current, { fetchMoreResult: null })).toBe(current)
      })
    })

    describe('WHEN the next page request fails', () => {
      it('THEN should show an error toast and keep show more available for a retry', async () => {
        const user = userEvent.setup()

        mockFetchMoreUsage.mockRejectedValue(new Error('network'))
        mockUsage({ totalPages: 2 })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')
        await user.click(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID))

        await waitFor(() => {
          expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'danger' }))
        })
        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)).toHaveLength(3)
        expect(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).toBeEnabled()
      })
    })

    describe('WHEN the next page is loading', () => {
      it('THEN should keep the loaded rows and disable show more', async () => {
        const user = userEvent.setup()

        mockUsage({ totalPages: 2, loading: true, networkStatus: NetworkStatus.fetchMore })
        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'api_key')

        expect(screen.getAllByTestId(ATTRIBUTION_TABLE_ROW_TEST_ID)).toHaveLength(3)
        expect(screen.getByTestId(ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN show more is loading the next page', () => {
      it('THEN should disable refresh so it cannot reset the list under the pending page', () => {
        mockUsage({ totalPages: 3, loading: true, networkStatus: NetworkStatus.fetchMore })
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

        mockUsageQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: new Error('boom'),
          refetch: mockRefetchUsage,
        })

        render(<SubscriptionAttributionTabContent />)

        await user.click(screen.getByTestId(PLACEHOLDER_TEST_ID))

        expect(mockRefetchSetup).toHaveBeenCalled()
        expect(mockRefetchUsage).toHaveBeenCalled()
      })
    })

    describe('WHEN the error placeholder is displayed', () => {
      it('THEN should keep the toolbar so the selection can be changed', async () => {
        const user = userEvent.setup()

        mockUsageQuery.mockReturnValue({
          data: undefined,
          loading: false,
          error: new Error('too_many_filters'),
          refetch: mockRefetchUsage,
        })

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
        expect(mockRefetchUsage).toHaveBeenCalled()
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

    const getLastTreeParams = () => mockUseAttributionTree.mock.calls.at(-1)?.[0]

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

      it('THEN should render the tree and skip the flat usage query', () => {
        render(<SubscriptionAttributionTabContent />)

        expect(screen.getByTestId(ATTRIBUTION_TREE_TABLE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(ATTRIBUTION_TABLE_TEST_ID)).not.toBeInTheDocument()
        expect(mockUsageQuery.mock.calls.at(-1)?.[0]).toEqual(
          expect.objectContaining({ skip: true }),
        )
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
      it('THEN should skip the tree and render the flat table', async () => {
        const user = userEvent.setup()

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(
          user,
          ATTRIBUTION_GROUP_ROWS_BY_TEST_ID,
          AttributionGroupByEnum.flat,
        )

        expect(getLastTreeParams()).toEqual(expect.objectContaining({ skip: true }))
        expect(screen.getByTestId(ATTRIBUTION_TABLE_TEST_ID)).toBeInTheDocument()
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
        mockUseAttributionTree.mockReturnValue({
          nodes: {
            [getAttributionNodeKey([])]: {
              status: 'loaded',
              isExpanded: true,
              blocks: [
                rootBlockOf('department', [filteredUsageOf('filter-opus', 'Opus', 4)]),
                rootBlockOf('region', [filteredUsageOf('filter-sonnet', 'Sonnet', 2)]),
              ],
            },
          },
          toggleNode: jest.fn(),
          loadMore: jest.fn(),
          refresh: mockRefreshTree,
        })

        render(<SubscriptionAttributionTabContent />)
        await selectOptionByValue(user, ATTRIBUTION_CHARGES_TEST_ID, tokensCharge.id)

        expect(screen.getByText('Opus')).toBeInTheDocument()
        expect(screen.getByText('Sonnet')).toBeInTheDocument()
      })
    })

    describe('WHEN refresh is clicked', () => {
      it('THEN should refresh the tree instead of refetching the flat usage', async () => {
        const user = userEvent.setup()

        mockUseAttributionTree.mockReturnValue({
          nodes: {
            [getAttributionNodeKey([])]: {
              status: 'loaded',
              isExpanded: true,
              blocks: [],
            },
          },
          toggleNode: jest.fn(),
          loadMore: jest.fn(),
          refresh: mockRefreshTree,
        })

        render(<SubscriptionAttributionTabContent />)
        await user.click(screen.getByTestId(ATTRIBUTION_REFRESH_BUTTON_TEST_ID))

        expect(mockRefreshTree).toHaveBeenCalled()
        expect(mockRefetchUsage).not.toHaveBeenCalled()
      })
    })

    describe('WHEN the root level failed to load', () => {
      it('THEN should display the error placeholder', () => {
        mockUseAttributionTree.mockReturnValue({
          nodes: { [getAttributionNodeKey([])]: { status: 'error' } },
          toggleNode: jest.fn(),
          loadMore: jest.fn(),
          refresh: mockRefreshTree,
        })

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

    const mockUsageError = (error: Error): void => {
      mockUsageQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error,
        refetch: mockRefetchUsage,
      })
    }

    const getPlaceholderTitle = (): string | null =>
      screen.getByTestId(PLACEHOLDER_TEST_ID).getAttribute('data-title')

    const getGenericErrorTitle = (): string | null => {
      mockUsageError(new Error('boom'))

      const { unmount } = render(<SubscriptionAttributionTabContent />)
      const title = getPlaceholderTitle()

      unmount()

      return title
    }

    describe('WHEN the flat usage query hits a guard error', () => {
      it('THEN should display the narrow your view placeholder instead of the generic one', () => {
        const genericTitle = getGenericErrorTitle()

        mockUsageError(guardError)
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
        mockUseAttributionTree.mockReturnValue({
          nodes: { [getAttributionNodeKey([])]: { status: 'error', error: guardError } },
          toggleNode: jest.fn(),
          loadMore: jest.fn(),
          refresh: mockRefreshTree,
        })

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
        mockUseAttributionTree.mockReturnValue({
          nodes: { [getAttributionNodeKey([])]: { status: 'error', error: new Error('boom') } },
          toggleNode: jest.fn(),
          loadMore: jest.fn(),
          refresh: mockRefreshTree,
        })

        render(<SubscriptionAttributionTabContent />)

        expect(getPlaceholderTitle()).toBe(genericTitle)
      })
    })
  })
})
