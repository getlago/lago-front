import { NetworkStatus } from '@apollo/client'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { addToast } from '~/core/apolloClient'
import {
  AttributedUsageBasisEnum,
  AttributionChargeUsageFragment,
  ChargeModelEnum,
  CurrencyEnum,
} from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  ATTRIBUTION_LOAD_MORE_ROWS_TEST_ID,
  ATTRIBUTION_TABLE_ROW_TEST_ID,
  ATTRIBUTION_TABLE_TEST_ID,
} from '../AttributionFlatTable'
import { getAttributionToolbarOptionTestId } from '../AttributionToolbarSelect'
import {
  ATTRIBUTION_CHARGES_TEST_ID,
  ATTRIBUTION_LIST_BY_TEST_ID,
  ATTRIBUTION_REFRESH_BUTTON_TEST_ID,
  ATTRIBUTION_SHOW_TEST_ID,
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
  GenericPlaceholder: ({ buttonAction }: { buttonAction?: () => void }) => (
    <button data-test="generic-placeholder" onClick={buttonAction} />
  ),
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

const flatTypes = [
  { id: 'type-api-key', code: 'api_key', name: 'API Key' },
  { id: 'type-agent', code: 'agent_id', name: 'Agent' },
]

const mockRefetchSetup = jest.fn()
const mockRefetchCharges = jest.fn()
const mockRefetchUsage = jest.fn()

const mockSetup = ({
  flat = flatTypes,
  roots = [] as typeof flatTypes,
}: { flat?: typeof flatTypes; roots?: typeof flatTypes } = {}): void => {
  mockSetupQuery.mockReturnValue({
    data: {
      subscription: {
        id: 'subscription-1',
        customer: { id: 'customer-1', displayName: 'Acme Corp' },
      },
      flatAttributionTypes: { collection: flat },
      rootAttributionTypes: { collection: roots },
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

        mockSetup({ flat: [...flatTypes, { id: 'type-all', code: 'all', name: 'All' }] })

        render(<SubscriptionAttributionTabContent />)

        await selectOptionByValue(user, ATTRIBUTION_LIST_BY_TEST_ID, 'all')

        expect(getLastUsageVariables()).toEqual(expect.objectContaining({ groupBy: 'all' }))
      })
    })
  })

  describe('GIVEN there is no flat type but a hierarchical root type', () => {
    describe('WHEN the tab renders', () => {
      it('THEN should query the root hierarchical type', () => {
        mockSetup({
          flat: [],
          roots: [{ id: 'type-dept', code: 'department', name: 'Department' }],
        })

        render(<SubscriptionAttributionTabContent />)

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
})
